begin;

-- Additive Stripe lifecycle, checkout de-duplication, and refund provenance.
-- Run in Preview first. No customer rows or existing credit balances are reset.
do $$
begin
  if to_regclass('public.premivate_credit_sources') is not null
     or to_regclass('public.premivate_credit_source_reservations') is not null
     or to_regclass('public.premivate_credit_refunds') is not null
     or to_regclass('public.premivate_credit_refund_reviews') is not null
     or to_regclass('public.premivate_subscription_checkout_claims') is not null
     or exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles'
          and column_name in (
            'stripe_subscription_id', 'stripe_subscription_status',
            'stripe_paid_through', 'stripe_cancel_at_period_end',
            'stripe_livemode', 'stripe_status_updated_at'
          )
     ) then
    raise exception 'PREMIVATE_STRIPE_LIFECYCLE_PARTIAL_OR_ALREADY_APPLIED';
  end if;

  if not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'premivate_credit_accounts'
  ) or not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'premivate_credit_reservations'
  ) or not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'premivate_credit_period_grants'
  ) or not exists (
    select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'premivate_credit_topup_grants'
  ) then
    raise exception 'PREMIVATE_LEDGER_BASELINE_MISSING';
  end if;

  if exists (
    select 1 from public.premivate_credit_accounts a
    left join (
      select clerk_user_id,
             sum(subscription_credits) filter (where status in ('reserved', 'started', 'uncertain'))::integer as subscription_held,
             sum(purchased_credits) filter (where status in ('reserved', 'started', 'uncertain'))::integer as purchased_held
        from public.premivate_credit_reservations
       group by clerk_user_id
    ) r using (clerk_user_id)
    where a.subscription_held <> coalesce(r.subscription_held, 0)
       or a.purchased_held <> coalesce(r.purchased_held, 0)
  ) then
    raise exception 'PREMIVATE_ACTIVE_RESERVATION_BALANCE_MISMATCH';
  end if;
end;
$$;

alter table public.profiles
  add column stripe_subscription_id text,
  add column stripe_subscription_status text,
  add column stripe_paid_through timestamptz,
  add column stripe_cancel_at_period_end boolean not null default false,
  add column stripe_livemode boolean,
  add column stripe_status_updated_at timestamptz;

create unique index profiles_stripe_subscription_id_unique
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.premivate_credit_accounts
  add column credit_access_blocked boolean not null default false;

create table public.premivate_credit_sources (
  source_id bigint generated always as identity primary key,
  clerk_user_id text not null references public.premivate_credit_accounts(clerk_user_id),
  source_kind text not null check (source_kind in (
    'subscription', 'topup', 'legacy_subscription', 'legacy_purchased'
  )),
  bucket text not null check (bucket in ('subscription', 'purchased')),
  source_reference_id text not null,
  grant_credits integer not null check (grant_credits >= 0),
  available_credits integer not null default 0 check (available_credits >= 0),
  held_credits integer not null default 0 check (held_credits >= 0),
  consumed_credits integer not null default 0 check (consumed_credits >= 0),
  refunded_credits integer not null default 0 check (refunded_credits >= 0),
  refund_state text check (refund_state in ('pending', 'refunded')),
  created_at timestamptz not null default now(),
  unique (clerk_user_id, source_kind, source_reference_id),
  check (available_credits + held_credits + consumed_credits + refunded_credits = grant_credits),
  check (
    (source_kind in ('subscription', 'legacy_subscription') and bucket = 'subscription')
    or (source_kind in ('topup', 'legacy_purchased') and bucket = 'purchased')
  )
);

create index premivate_credit_sources_reserve_idx
  on public.premivate_credit_sources (clerk_user_id, bucket, created_at, source_id)
  where available_credits > 0;

create table public.premivate_credit_source_reservations (
  clerk_user_id text not null,
  request_id text not null,
  source_id bigint not null references public.premivate_credit_sources(source_id),
  credits integer not null check (credits > 0),
  status text not null check (status in ('held', 'consumed', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, request_id, source_id),
  foreign key (clerk_user_id, request_id)
    references public.premivate_credit_reservations(clerk_user_id, request_id)
    deferrable initially deferred
);

create table public.premivate_credit_refunds (
  refund_id bigint generated always as identity primary key,
  clerk_user_id text not null references public.premivate_credit_accounts(clerk_user_id),
  source_id bigint not null unique references public.premivate_credit_sources(source_id),
  stripe_event_id text not null unique,
  status text not null check (status in ('pending', 'refunded', 'refunded_with_consumed')),
  revoked_credits integer not null default 0 check (revoked_credits >= 0),
  consumed_credits integer not null default 0 check (consumed_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.premivate_credit_refund_reviews (
  review_id bigint generated always as identity primary key,
  stripe_event_id text not null unique,
  stripe_charge_id text not null,
  clerk_user_id text,
  source_kind text not null,
  source_reference_id text,
  reason text not null check (reason in (
    'PARTIAL_REFUND_REQUIRES_MANUAL_REVIEW',
    'CREDIT_SOURCE_NOT_AVAILABLE_FOR_AUTOMATIC_REFUND',
    'PAYMENT_INTENT_MISSING',
    'REFUND_SOURCE_UNRESOLVED'
  )),
  amount integer not null check (amount >= 0),
  currency text not null check (currency = 'chf'),
  created_at timestamptz not null default now()
);

create table public.premivate_subscription_checkout_claims (
  clerk_user_id text primary key,
  claim_token text not null unique,
  status text not null check (status in ('pending', 'completed', 'released')),
  stripe_session_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Preserve all existing aggregate balances as explicitly non-refundable legacy
-- sources. New paid grants are tracked against their exact invoice or PaymentIntent.
insert into public.premivate_credit_sources (
  clerk_user_id, source_kind, bucket, source_reference_id, grant_credits,
  available_credits, held_credits
)
select clerk_user_id, 'legacy_subscription', 'subscription',
       'legacy:' || clerk_user_id || ':subscription',
       subscription_available + subscription_held,
       subscription_available, subscription_held
  from public.premivate_credit_accounts
 where subscription_available + subscription_held > 0;

insert into public.premivate_credit_sources (
  clerk_user_id, source_kind, bucket, source_reference_id, grant_credits,
  available_credits, held_credits
)
select clerk_user_id, 'legacy_purchased', 'purchased',
       'legacy:' || clerk_user_id || ':purchased',
       purchased_available + purchased_held,
       purchased_available, purchased_held
  from public.premivate_credit_accounts
 where purchased_available + purchased_held > 0;

insert into public.premivate_credit_source_reservations (
  clerk_user_id, request_id, source_id, credits, status
)
select r.clerk_user_id, r.request_id, s.source_id, r.subscription_credits, 'held'
  from public.premivate_credit_reservations r
  join public.premivate_credit_sources s
    on s.clerk_user_id = r.clerk_user_id and s.bucket = 'subscription'
   and s.source_kind = 'legacy_subscription'
 where r.subscription_credits > 0 and r.status in ('reserved', 'started', 'uncertain')
union all
select r.clerk_user_id, r.request_id, s.source_id, r.purchased_credits, 'held'
  from public.premivate_credit_reservations r
  join public.premivate_credit_sources s
    on s.clerk_user_id = r.clerk_user_id and s.bucket = 'purchased'
   and s.source_kind = 'legacy_purchased'
 where r.purchased_credits > 0 and r.status in ('reserved', 'started', 'uncertain');

alter table public.premivate_credit_sources enable row level security;
alter table public.premivate_credit_source_reservations enable row level security;
alter table public.premivate_credit_refunds enable row level security;
alter table public.premivate_credit_refund_reviews enable row level security;
alter table public.premivate_subscription_checkout_claims enable row level security;

revoke all on public.premivate_credit_sources from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_source_reservations from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_refunds from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_refund_reviews from public, anon, authenticated, service_role;
revoke all on public.premivate_subscription_checkout_claims from public, anon, authenticated, service_role;

create or replace function public.premivate_credit_create_source_after_grant()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_table_name = 'premivate_credit_period_grants' then
    insert into public.premivate_credit_sources (
      clerk_user_id, source_kind, bucket, source_reference_id, grant_credits, available_credits
    ) values (
      new.clerk_user_id, 'subscription', 'subscription', new.stripe_invoice_id,
      new.granted_credits, new.granted_credits
    );
  else
    insert into public.premivate_credit_sources (
      clerk_user_id, source_kind, bucket, source_reference_id, grant_credits, available_credits
    ) values (
      new.clerk_user_id, 'topup', 'purchased', new.stripe_payment_intent_id,
      new.credits, new.credits
    );
  end if;
  return new;
end;
$$;

create trigger premivate_credit_period_source_after_insert
after insert on public.premivate_credit_period_grants
for each row execute function public.premivate_credit_create_source_after_grant();

create trigger premivate_credit_topup_source_after_insert
after insert on public.premivate_credit_topup_grants
for each row execute function public.premivate_credit_create_source_after_grant();

create or replace function public.premivate_credit_finalize_pending_refunds_locked(p_clerk_user_id text)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  refund_row public.premivate_credit_refunds%rowtype;
  source_row public.premivate_credit_sources%rowtype;
  revoked integer;
  finalized integer := 0;
begin
  for refund_row in
    select r.*
      from public.premivate_credit_refunds r
      join public.premivate_credit_sources s on s.source_id = r.source_id
     where r.clerk_user_id = p_clerk_user_id and r.status = 'pending' and s.held_credits = 0
     order by r.refund_id
     for update of r
  loop
    select * into source_row from public.premivate_credit_sources
     where source_id = refund_row.source_id for update;
    revoked := source_row.available_credits;

    if source_row.bucket = 'subscription' then
      update public.premivate_credit_accounts
         set subscription_available = subscription_available - revoked,
             credit_access_blocked = credit_access_blocked or source_row.consumed_credits > 0,
             updated_at = now()
       where clerk_user_id = p_clerk_user_id
         and subscription_available >= revoked;
    else
      update public.premivate_credit_accounts
         set purchased_available = purchased_available - revoked,
             credit_access_blocked = credit_access_blocked or source_row.consumed_credits > 0,
             updated_at = now()
       where clerk_user_id = p_clerk_user_id
         and purchased_available >= revoked;
    end if;

    if not found then
      raise exception using errcode = '23514', message = 'CREDIT_REFUND_BALANCE_MISMATCH';
    end if;

    update public.premivate_credit_sources
       set available_credits = 0,
           refunded_credits = refunded_credits + revoked,
           refund_state = 'refunded'
     where source_id = source_row.source_id;

    update public.premivate_credit_refunds
       set status = case when source_row.consumed_credits > 0
                         then 'refunded_with_consumed' else 'refunded' end,
           revoked_credits = revoked,
           consumed_credits = source_row.consumed_credits,
           updated_at = now()
     where refund_id = refund_row.refund_id;
    finalized := finalized + 1;
  end loop;

  update public.premivate_credit_accounts a
     set credit_access_blocked = exists (
       select 1 from public.premivate_credit_refunds r
        where r.clerk_user_id = p_clerk_user_id
          and r.status in ('pending', 'refunded_with_consumed')
     ),
         updated_at = now()
   where a.clerk_user_id = p_clerk_user_id;
  return finalized;
end;
$$;

create or replace function public.premivate_credit_track_reservation_sources()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  blocked boolean;
  source_row public.premivate_credit_sources%rowtype;
  allocation_row record;
begin
  if tg_op = 'INSERT' then
    select credit_access_blocked into blocked
      from public.premivate_credit_accounts
     where clerk_user_id = new.clerk_user_id;
    if not found then
      raise exception using errcode = 'P0002', message = 'CREDIT_ACCOUNT_NOT_FOUND';
    end if;
    if blocked then
      raise exception using errcode = 'P0001', message = 'CREDIT_ACCOUNT_RESTRICTED';
    end if;

    if new.subscription_credits > 0 then
      select * into source_row
        from public.premivate_credit_sources
       where clerk_user_id = new.clerk_user_id and bucket = 'subscription'
         and available_credits >= new.subscription_credits
       order by created_at, source_id limit 1 for update;
      if not found then
        raise exception using errcode = '23514', message = 'CREDIT_SOURCE_BALANCE_MISMATCH';
      end if;
      update public.premivate_credit_sources
         set available_credits = available_credits - new.subscription_credits,
             held_credits = held_credits + new.subscription_credits
       where source_id = source_row.source_id;
      insert into public.premivate_credit_source_reservations
        (clerk_user_id, request_id, source_id, credits, status)
      values (new.clerk_user_id, new.request_id, source_row.source_id,
              new.subscription_credits, 'held');
    end if;

    if new.purchased_credits > 0 then
      select * into source_row
        from public.premivate_credit_sources
       where clerk_user_id = new.clerk_user_id and bucket = 'purchased'
         and available_credits >= new.purchased_credits
       order by created_at, source_id limit 1 for update;
      if not found then
        raise exception using errcode = '23514', message = 'CREDIT_SOURCE_BALANCE_MISMATCH';
      end if;
      update public.premivate_credit_sources
         set available_credits = available_credits - new.purchased_credits,
             held_credits = held_credits + new.purchased_credits
       where source_id = source_row.source_id;
      insert into public.premivate_credit_source_reservations
        (clerk_user_id, request_id, source_id, credits, status)
      values (new.clerk_user_id, new.request_id, source_row.source_id,
              new.purchased_credits, 'held');
    end if;
    return new;
  end if;

  if new.status = old.status then return new; end if;
  if new.status = 'committed' then
    for allocation_row in
      select * from public.premivate_credit_source_reservations
       where clerk_user_id = old.clerk_user_id and request_id = old.request_id
         and status = 'held' for update
    loop
      update public.premivate_credit_sources
         set held_credits = held_credits - allocation_row.credits,
             consumed_credits = consumed_credits + allocation_row.credits
       where source_id = allocation_row.source_id
         and held_credits >= allocation_row.credits;
      if not found then
        raise exception using errcode = '23514', message = 'CREDIT_SOURCE_HOLD_MISMATCH';
      end if;
      update public.premivate_credit_source_reservations
         set status = 'consumed', updated_at = now()
       where clerk_user_id = allocation_row.clerk_user_id
         and request_id = allocation_row.request_id and source_id = allocation_row.source_id;
    end loop;
    perform public.premivate_credit_finalize_pending_refunds_locked(old.clerk_user_id);
  elsif new.status = 'released' and new.resolution = 'not_consumed' then
    for allocation_row in
      select * from public.premivate_credit_source_reservations
       where clerk_user_id = old.clerk_user_id and request_id = old.request_id
         and status = 'held' for update
    loop
      update public.premivate_credit_sources
         set held_credits = held_credits - allocation_row.credits,
             available_credits = available_credits + allocation_row.credits
       where source_id = allocation_row.source_id
         and held_credits >= allocation_row.credits;
      if not found then
        raise exception using errcode = '23514', message = 'CREDIT_SOURCE_HOLD_MISMATCH';
      end if;
      update public.premivate_credit_source_reservations
         set status = 'released', updated_at = now()
       where clerk_user_id = allocation_row.clerk_user_id
         and request_id = allocation_row.request_id and source_id = allocation_row.source_id;
    end loop;
    perform public.premivate_credit_finalize_pending_refunds_locked(old.clerk_user_id);
  end if;
  return new;
end;
$$;

create trigger premivate_credit_reservation_source_tracking
before insert or update of status on public.premivate_credit_reservations
for each row execute function public.premivate_credit_track_reservation_sources();

create or replace function public.premivate_credit_refund_source(
  p_clerk_user_id text,
  p_source_type text,
  p_source_reference_id text,
  p_stripe_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  source_row public.premivate_credit_sources%rowtype;
  refund_row public.premivate_credit_refunds%rowtype;
  revoked integer;
  refund_status text;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_source_type not in ('subscription', 'topup')
     or p_source_reference_id is null or length(trim(p_source_reference_id)) = 0
     or p_stripe_event_id is null or length(trim(p_stripe_event_id)) = 0 then
    raise exception using errcode = '22023', message = 'CREDIT_REFUND_INPUT_INVALID';
  end if;

  perform 1 from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_REFUND_SOURCE_NOT_FOUND';
  end if;

  select * into source_row
    from public.premivate_credit_sources
   where clerk_user_id = p_clerk_user_id
     and source_kind = p_source_type
     and source_reference_id = p_source_reference_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_REFUND_SOURCE_NOT_FOUND';
  end if;

  select * into refund_row from public.premivate_credit_refunds
   where source_id = source_row.source_id for update;
  if found then
    return jsonb_build_object('status', 'duplicate',
      'revokedCredits', refund_row.revoked_credits,
      'consumedCredits', refund_row.consumed_credits);
  end if;
  if source_row.refund_state is not null then
    raise exception using errcode = '23514', message = 'CREDIT_REFUND_SOURCE_STATE_CONFLICT';
  end if;

  if source_row.held_credits > 0 then
    update public.premivate_credit_sources set refund_state = 'pending'
     where source_id = source_row.source_id;
    update public.premivate_credit_accounts set credit_access_blocked = true, updated_at = now()
     where clerk_user_id = p_clerk_user_id;
    insert into public.premivate_credit_refunds
      (clerk_user_id, source_id, stripe_event_id, status, consumed_credits)
    values (p_clerk_user_id, source_row.source_id, p_stripe_event_id,
            'pending', source_row.consumed_credits);
    return jsonb_build_object('status', 'pending', 'revokedCredits', 0,
      'consumedCredits', source_row.consumed_credits);
  end if;

  revoked := source_row.available_credits;
  if source_row.bucket = 'subscription' then
    update public.premivate_credit_accounts
       set subscription_available = subscription_available - revoked,
           credit_access_blocked = credit_access_blocked or source_row.consumed_credits > 0,
           updated_at = now()
     where clerk_user_id = p_clerk_user_id and subscription_available >= revoked;
  else
    update public.premivate_credit_accounts
       set purchased_available = purchased_available - revoked,
           credit_access_blocked = credit_access_blocked or source_row.consumed_credits > 0,
           updated_at = now()
     where clerk_user_id = p_clerk_user_id and purchased_available >= revoked;
  end if;
  if not found then
    raise exception using errcode = '23514', message = 'CREDIT_REFUND_BALANCE_MISMATCH';
  end if;

  update public.premivate_credit_sources
     set available_credits = 0,
         refunded_credits = refunded_credits + revoked,
         refund_state = 'refunded'
   where source_id = source_row.source_id;

  refund_status := case when source_row.consumed_credits > 0
                        then 'refunded_with_consumed' else 'refunded' end;
  insert into public.premivate_credit_refunds
    (clerk_user_id, source_id, stripe_event_id, status, revoked_credits, consumed_credits)
  values (p_clerk_user_id, source_row.source_id, p_stripe_event_id,
          refund_status, revoked, source_row.consumed_credits);
  return jsonb_build_object('status', refund_status, 'revokedCredits', revoked,
    'consumedCredits', source_row.consumed_credits);
end;
$$;

create or replace function public.premivate_credit_record_refund_review(
  p_stripe_event_id text,
  p_stripe_charge_id text,
  p_clerk_user_id text,
  p_source_type text,
  p_source_reference_id text,
  p_reason text,
  p_amount integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_stripe_event_id is null or p_stripe_charge_id is null
     or p_reason not in ('PARTIAL_REFUND_REQUIRES_MANUAL_REVIEW',
                         'CREDIT_SOURCE_NOT_AVAILABLE_FOR_AUTOMATIC_REFUND',
                         'PAYMENT_INTENT_MISSING',
                         'REFUND_SOURCE_UNRESOLVED')
     or p_amount is null or p_amount < 0 or p_currency <> 'chf' then
    raise exception using errcode = '22023', message = 'REFUND_REVIEW_INPUT_INVALID';
  end if;
  insert into public.premivate_credit_refund_reviews (
    stripe_event_id, stripe_charge_id, clerk_user_id, source_kind,
    source_reference_id, reason, amount, currency
  ) values (
    p_stripe_event_id, p_stripe_charge_id, p_clerk_user_id, p_source_type,
    p_source_reference_id, p_reason, p_amount, p_currency
  ) on conflict (stripe_event_id) do nothing;
  return jsonb_build_object('status', 'recorded');
end;
$$;

create or replace function public.premivate_subscription_checkout_claim(
  p_clerk_user_id text,
  p_claim_token text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare claimed_token text;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_claim_token is null or length(trim(p_claim_token)) = 0 then
    raise exception using errcode = '22023', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_INVALID';
  end if;
  insert into public.premivate_subscription_checkout_claims (
    clerk_user_id, claim_token, status, expires_at
  ) values (
    p_clerk_user_id, p_claim_token, 'pending', now() + interval '24 hours'
  ) on conflict (clerk_user_id) do update
    set claim_token = excluded.claim_token,
        status = 'pending',
        stripe_session_id = null,
        expires_at = excluded.expires_at,
        updated_at = now()
    where premivate_subscription_checkout_claims.expires_at <= now()
       or premivate_subscription_checkout_claims.status in ('completed', 'released')
  returning claim_token into claimed_token;

  if claimed_token is null then
    return jsonb_build_object('status', 'busy');
  end if;
  return jsonb_build_object('status', 'claimed');
end;
$$;

create or replace function public.premivate_subscription_checkout_attach_session(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_session_id text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.premivate_subscription_checkout_claims
     set stripe_session_id = p_stripe_session_id,
         expires_at = p_expires_at,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token
     and status = 'pending' and stripe_session_id is null
     and p_stripe_session_id is not null and p_expires_at > now();
  if not found then
    raise exception using errcode = '23514', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_CONFLICT';
  end if;
  return jsonb_build_object('status', 'attached');
end;
$$;

create or replace function public.premivate_subscription_checkout_release(
  p_clerk_user_id text,
  p_claim_token text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.premivate_subscription_checkout_claims
     set status = 'released', updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token
     and status = 'pending' and stripe_session_id is null;
  return jsonb_build_object('status', case when found then 'released' else 'unchanged' end);
end;
$$;

create or replace function public.premivate_subscription_checkout_complete(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.premivate_subscription_checkout_claims
     set status = 'completed', updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token
     and stripe_session_id = p_stripe_session_id and status in ('pending', 'completed');
  if not found then
    raise exception using errcode = '23514', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_CONFLICT';
  end if;
  return jsonb_build_object('status', 'completed');
end;
$$;

create or replace function public.premivate_subscription_checkout_release_expired(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.premivate_subscription_checkout_claims
     set status = 'released', updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token
     and stripe_session_id = p_stripe_session_id and status = 'pending'
     and expires_at <= now() + interval '1 minute';
  return jsonb_build_object('status', case when found then 'released' else 'unchanged' end);
end;
$$;

-- Return a safe restriction marker with the existing separated balances.
create or replace function public.premivate_credit_get_balance(p_clerk_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare account_row public.premivate_credit_accounts%rowtype;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0 then
    raise exception using errcode = '22023', message = 'CREDIT_BALANCE_USER_INVALID';
  end if;
  select * into account_row from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_ACCOUNT_NOT_FOUND';
  end if;
  return jsonb_build_object(
    'subscriptionAvailable', account_row.subscription_available,
    'subscriptionHeld', account_row.subscription_held,
    'purchasedAvailable', account_row.purchased_available,
    'purchasedHeld', account_row.purchased_held,
    'creditAccessBlocked', account_row.credit_access_blocked
  );
end;
$$;

revoke all on function public.premivate_credit_create_source_after_grant() from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_finalize_pending_refunds_locked(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_track_reservation_sources() from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_refund_source(text, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_record_refund_review(text, text, text, text, text, text, integer, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_subscription_checkout_claim(text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_subscription_checkout_attach_session(text, text, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.premivate_subscription_checkout_release(text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_subscription_checkout_complete(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_subscription_checkout_release_expired(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_get_balance(text) from public, anon, authenticated, service_role;

grant execute on function public.premivate_credit_refund_source(text, text, text, text) to service_role;
grant execute on function public.premivate_credit_record_refund_review(text, text, text, text, text, text, integer, text) to service_role;
grant execute on function public.premivate_subscription_checkout_claim(text, text) to service_role;
grant execute on function public.premivate_subscription_checkout_attach_session(text, text, text, timestamptz) to service_role;
grant execute on function public.premivate_subscription_checkout_release(text, text) to service_role;
grant execute on function public.premivate_subscription_checkout_complete(text, text, text) to service_role;
grant execute on function public.premivate_subscription_checkout_release_expired(text, text, text) to service_role;
grant execute on function public.premivate_credit_get_balance(text) to service_role;

commit;
