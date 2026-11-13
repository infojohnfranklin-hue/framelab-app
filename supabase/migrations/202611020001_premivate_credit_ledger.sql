begin;

create sequence public.premivate_credit_ledger_entries_id_seq;

create table public.premivate_credit_accounts (
  clerk_user_id text primary key,
  subscription_available integer not null default 0
    check (subscription_available >= 0),
  subscription_held integer not null default 0
    check (subscription_held >= 0),
  purchased_available integer not null default 0
    check (purchased_available >= 0),
  purchased_held integer not null default 0
    check (purchased_held >= 0),
  last_paid_period_start timestamptz,
  last_paid_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subscription_available + subscription_held <= 200),
  check (
    (last_paid_period_start is null and last_paid_period_end is null)
    or
    (last_paid_period_start is not null
      and last_paid_period_end is not null
      and last_paid_period_end > last_paid_period_start)
  )
);

create table public.premivate_credit_reservations (
  clerk_user_id text not null
    references public.premivate_credit_accounts(clerk_user_id),
  request_id text not null,
  operation text not null check (operation in ('main', 'text_blueprint')),
  credits integer not null check (credits = 1),
  subscription_credits integer not null default 0 check (subscription_credits >= 0),
  purchased_credits integer not null default 0 check (purchased_credits >= 0),
  status text not null
    check (status in ('reserved', 'started', 'uncertain', 'committed', 'released')),
  provider_started_at timestamptz,
  resolution text check (resolution in ('consumed', 'not_consumed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clerk_user_id, request_id),
  check (subscription_credits + purchased_credits = credits),
  check (
    (status in ('started', 'uncertain', 'committed') and provider_started_at is not null)
    or status in ('reserved', 'released')
  )
);

create table public.premivate_credit_period_grants (
  grant_id bigint generated always as identity primary key,
  clerk_user_id text not null
    references public.premivate_credit_accounts(clerk_user_id),
  stripe_subscription_id text not null,
  stripe_invoice_id text not null unique,
  stripe_event_id text not null unique,
  period_kind text not null check (period_kind in ('initial', 'cycle')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  requested_credits integer not null check (requested_credits = 100),
  subscription_total_before integer not null check (subscription_total_before between 0 and 200),
  subscription_total_after integer not null check (subscription_total_after between 0 and 200),
  granted_credits integer not null check (granted_credits between 0 and 100),
  grant_status text not null
    check (grant_status in ('granted_initial', 'granted_cycle', 'granted_paid_gap')),
  created_at timestamptz not null default now(),
  check (period_end > period_start),
  check (subscription_total_after = least(200, subscription_total_before + 100)),
  check (granted_credits = subscription_total_after - subscription_total_before),
  unique (clerk_user_id, stripe_subscription_id, period_start, period_end)
);

create table public.premivate_credit_topup_grants (
  grant_id bigint generated always as identity primary key,
  clerk_user_id text not null
    references public.premivate_credit_accounts(clerk_user_id),
  stripe_payment_intent_id text not null unique,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);

create table public.premivate_credit_ledger_entries (
  id bigint primary key
    default nextval('public.premivate_credit_ledger_entries_id_seq'),
  clerk_user_id text not null
    references public.premivate_credit_accounts(clerk_user_id),
  request_id text,
  reference_id text,
  entry_type text not null
    check (entry_type in (
      'reservation',
      'provider_commit',
      'reservation_release',
      'uncertain_resolution',
      'subscription_grant',
      'topup_grant'
    )),
  bucket text not null
    check (bucket in (
      'subscription_available',
      'subscription_held',
      'purchased_available',
      'purchased_held'
    )),
  delta integer not null check (delta <> 0),
  created_at timestamptz not null default now()
);

alter sequence public.premivate_credit_ledger_entries_id_seq
  owned by public.premivate_credit_ledger_entries.id;

alter table public.premivate_credit_accounts enable row level security;
alter table public.premivate_credit_reservations enable row level security;
alter table public.premivate_credit_period_grants enable row level security;
alter table public.premivate_credit_topup_grants enable row level security;
alter table public.premivate_credit_ledger_entries enable row level security;

revoke all on public.premivate_credit_accounts from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_reservations from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_period_grants from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_topup_grants from public, anon, authenticated, service_role;
revoke all on public.premivate_credit_ledger_entries from public, anon, authenticated, service_role;
revoke all on sequence public.premivate_credit_ledger_entries_id_seq
  from public, anon, authenticated, service_role;

create or replace function public.premivate_credit_recover_expired_locked(
  p_clerk_user_id text
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  reservation_row public.premivate_credit_reservations%rowtype;
  recovered_count integer := 0;
begin
  -- Global mutation lock order: account first, then reservation rows.
  perform 1
    from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id
   for update;

  for reservation_row in
    select *
      from public.premivate_credit_reservations
     where clerk_user_id = p_clerk_user_id
       and status in ('reserved', 'started')
       and expires_at <= now()
     order by request_id
     for update
  loop
    if reservation_row.status = 'reserved' then
      -- Provider-start RPC was not completed, so no provider call was permitted.
      update public.premivate_credit_accounts
         set subscription_available = subscription_available + reservation_row.subscription_credits,
             subscription_held = subscription_held - reservation_row.subscription_credits,
             purchased_available = purchased_available + reservation_row.purchased_credits,
             purchased_held = purchased_held - reservation_row.purchased_credits,
             updated_at = now()
       where clerk_user_id = p_clerk_user_id;

      if reservation_row.subscription_credits > 0 then
        insert into public.premivate_credit_ledger_entries
          (clerk_user_id, request_id, entry_type, bucket, delta)
        values
          (p_clerk_user_id, reservation_row.request_id, 'reservation_release',
           'subscription_held', -reservation_row.subscription_credits),
          (p_clerk_user_id, reservation_row.request_id, 'reservation_release',
           'subscription_available', reservation_row.subscription_credits);
      end if;

      if reservation_row.purchased_credits > 0 then
        insert into public.premivate_credit_ledger_entries
          (clerk_user_id, request_id, entry_type, bucket, delta)
        values
          (p_clerk_user_id, reservation_row.request_id, 'reservation_release',
           'purchased_held', -reservation_row.purchased_credits),
          (p_clerk_user_id, reservation_row.request_id, 'reservation_release',
           'purchased_available', reservation_row.purchased_credits);
      end if;

      update public.premivate_credit_reservations
         set status = 'released',
             resolution = 'not_consumed',
             updated_at = now()
       where clerk_user_id = p_clerk_user_id
         and request_id = reservation_row.request_id;
    else
      -- A provider may have started. Keep the hold; never refund automatically.
      update public.premivate_credit_reservations
         set status = 'uncertain',
             updated_at = now()
       where clerk_user_id = p_clerk_user_id
         and request_id = reservation_row.request_id;
    end if;

    recovered_count := recovered_count + 1;
  end loop;

  return recovered_count;
end;
$$;

create or replace function public.premivate_credit_reserve(
  p_clerk_user_id text,
  p_request_id text,
  p_operation text,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  account_row public.premivate_credit_accounts%rowtype;
  reservation_row public.premivate_credit_reservations%rowtype;
  subscription_take integer;
  purchased_take integer;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_request_id is null or length(trim(p_request_id)) = 0
     or p_operation not in ('main', 'text_blueprint')
     or p_credits is distinct from 1 then
    raise exception using errcode = '22023', message = 'CREDIT_RESERVATION_INPUT_INVALID';
  end if;

  insert into public.premivate_credit_accounts (clerk_user_id)
  values (p_clerk_user_id)
  on conflict (clerk_user_id) do nothing;

  -- All mutating RPCs lock account before reservation.
  select * into account_row
    from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id
   for update;

  select * into reservation_row
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id
     and request_id = p_request_id
   for update;

  if found then
    if reservation_row.operation <> p_operation
       or reservation_row.credits <> p_credits then
      raise exception using errcode = '23505', message = 'CREDIT_REQUEST_ID_CONFLICT';
    end if;

    return jsonb_build_object(
      'status', 'duplicate',
      'requestId', p_request_id,
      'reservationStatus', reservation_row.status
    );
  end if;

  subscription_take := least(account_row.subscription_available, p_credits);
  purchased_take := p_credits - subscription_take;

  if purchased_take > account_row.purchased_available then
    raise exception using errcode = 'P0001', message = 'CREDIT_BALANCE_INSUFFICIENT';
  end if;

  update public.premivate_credit_accounts
     set subscription_available = subscription_available - subscription_take,
         subscription_held = subscription_held + subscription_take,
         purchased_available = purchased_available - purchased_take,
         purchased_held = purchased_held + purchased_take,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  insert into public.premivate_credit_reservations (
    clerk_user_id, request_id, operation, credits,
    subscription_credits, purchased_credits, status, expires_at
  ) values (
    p_clerk_user_id, p_request_id, p_operation, p_credits,
    subscription_take, purchased_take, 'reserved', now() + interval '30 minutes'
  );

  if subscription_take > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values
      (p_clerk_user_id, p_request_id, 'reservation', 'subscription_available', -subscription_take),
      (p_clerk_user_id, p_request_id, 'reservation', 'subscription_held', subscription_take);
  end if;

  if purchased_take > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values
      (p_clerk_user_id, p_request_id, 'reservation', 'purchased_available', -purchased_take),
      (p_clerk_user_id, p_request_id, 'reservation', 'purchased_held', purchased_take);
  end if;

  return jsonb_build_object(
    'status', 'reserved',
    'requestId', p_request_id,
    'subscriptionCredits', subscription_take,
    'purchasedCredits', purchased_take
  );
end;
$$;

create or replace function public.premivate_credit_mark_provider_started(
  p_clerk_user_id text,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  reservation_row public.premivate_credit_reservations%rowtype;
begin
  perform 1 from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id for update;

  select * into reservation_row
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status = 'started' then
    return jsonb_build_object('status', 'duplicate', 'requestId', p_request_id);
  end if;

  if reservation_row.status <> 'reserved' then
    raise exception using errcode = '23514', message = 'CREDIT_RESERVATION_NOT_STARTABLE';
  end if;

  if reservation_row.expires_at <= clock_timestamp() then
    raise exception using errcode = '23514', message = 'CREDIT_RESERVATION_EXPIRED';
  end if;

  update public.premivate_credit_reservations
     set status = 'started',
         provider_started_at = clock_timestamp(),
         updated_at = clock_timestamp()
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id;

  return jsonb_build_object('status', 'started', 'requestId', p_request_id);
end;
$$;

create or replace function public.premivate_credit_commit(
  p_clerk_user_id text,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  reservation_row public.premivate_credit_reservations%rowtype;
begin
  perform 1 from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id for update;

  select * into reservation_row
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status = 'committed' then
    return jsonb_build_object('status', 'duplicate', 'requestId', p_request_id);
  end if;

  if reservation_row.status not in ('started', 'uncertain') then
    raise exception using errcode = '23514', message = 'CREDIT_RESERVATION_NOT_COMMITTABLE';
  end if;

  update public.premivate_credit_accounts
     set subscription_held = subscription_held - reservation_row.subscription_credits,
         purchased_held = purchased_held - reservation_row.purchased_credits,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  if reservation_row.subscription_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values (p_clerk_user_id, p_request_id, 'provider_commit',
            'subscription_held', -reservation_row.subscription_credits);
  end if;

  if reservation_row.purchased_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values (p_clerk_user_id, p_request_id, 'provider_commit',
            'purchased_held', -reservation_row.purchased_credits);
  end if;

  update public.premivate_credit_reservations
     set status = 'committed', resolution = 'consumed', updated_at = now()
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id;

  return jsonb_build_object('status', 'committed', 'requestId', p_request_id);
end;
$$;

create or replace function public.premivate_credit_release(
  p_clerk_user_id text,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  reservation_row public.premivate_credit_reservations%rowtype;
begin
  perform 1 from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id for update;

  select * into reservation_row
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status = 'released' then
    return jsonb_build_object('status', 'duplicate', 'requestId', p_request_id);
  end if;

  if reservation_row.status <> 'reserved' then
    raise exception using errcode = '23514', message = 'CREDIT_RESERVATION_NOT_RELEASABLE';
  end if;

  update public.premivate_credit_accounts
     set subscription_available = subscription_available + reservation_row.subscription_credits,
         subscription_held = subscription_held - reservation_row.subscription_credits,
         purchased_available = purchased_available + reservation_row.purchased_credits,
         purchased_held = purchased_held - reservation_row.purchased_credits,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  if reservation_row.subscription_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values
      (p_clerk_user_id, p_request_id, 'reservation_release',
       'subscription_held', -reservation_row.subscription_credits),
      (p_clerk_user_id, p_request_id, 'reservation_release',
       'subscription_available', reservation_row.subscription_credits);
  end if;

  if reservation_row.purchased_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values
      (p_clerk_user_id, p_request_id, 'reservation_release',
       'purchased_held', -reservation_row.purchased_credits),
      (p_clerk_user_id, p_request_id, 'reservation_release',
       'purchased_available', reservation_row.purchased_credits);
  end if;

  update public.premivate_credit_reservations
     set status = 'released', resolution = 'not_consumed', updated_at = now()
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id;

  return jsonb_build_object('status', 'released', 'requestId', p_request_id);
end;
$$;

create or replace function public.premivate_credit_resolve_uncertain(
  p_clerk_user_id text,
  p_request_id text,
  p_outcome text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  reservation_row public.premivate_credit_reservations%rowtype;
begin
  if p_outcome not in ('consumed', 'not_consumed') then
    raise exception using errcode = '22023', message = 'CREDIT_RESOLUTION_INVALID';
  end if;

  perform 1 from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id for update;

  select * into reservation_row
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  if reservation_row.status in ('committed', 'released') then
    if reservation_row.resolution = p_outcome then
      return jsonb_build_object('status', 'duplicate', 'requestId', p_request_id);
    end if;
    raise exception using errcode = '23514', message = 'CREDIT_RESOLUTION_CONFLICT';
  end if;

  if reservation_row.status not in ('started', 'uncertain') then
    raise exception using errcode = '23514', message = 'CREDIT_RESERVATION_NOT_UNCERTAIN';
  end if;

  if p_outcome = 'not_consumed' then
    update public.premivate_credit_accounts
       set subscription_available = subscription_available + reservation_row.subscription_credits,
           subscription_held = subscription_held - reservation_row.subscription_credits,
           purchased_available = purchased_available + reservation_row.purchased_credits,
           purchased_held = purchased_held - reservation_row.purchased_credits,
           updated_at = now()
     where clerk_user_id = p_clerk_user_id;

    if reservation_row.subscription_credits > 0 then
      insert into public.premivate_credit_ledger_entries
        (clerk_user_id, request_id, entry_type, bucket, delta)
      values
        (p_clerk_user_id, p_request_id, 'uncertain_resolution',
         'subscription_held', -reservation_row.subscription_credits),
        (p_clerk_user_id, p_request_id, 'uncertain_resolution',
         'subscription_available', reservation_row.subscription_credits);
    end if;

    if reservation_row.purchased_credits > 0 then
      insert into public.premivate_credit_ledger_entries
        (clerk_user_id, request_id, entry_type, bucket, delta)
      values
        (p_clerk_user_id, p_request_id, 'uncertain_resolution',
         'purchased_held', -reservation_row.purchased_credits),
        (p_clerk_user_id, p_request_id, 'uncertain_resolution',
         'purchased_available', reservation_row.purchased_credits);
    end if;

    update public.premivate_credit_reservations
       set status = 'released', resolution = 'not_consumed', updated_at = now()
     where clerk_user_id = p_clerk_user_id and request_id = p_request_id;

    return jsonb_build_object('status', 'released', 'requestId', p_request_id);
  end if;

  update public.premivate_credit_accounts
     set subscription_held = subscription_held - reservation_row.subscription_credits,
         purchased_held = purchased_held - reservation_row.purchased_credits,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  if reservation_row.subscription_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values (p_clerk_user_id, p_request_id, 'uncertain_resolution',
            'subscription_held', -reservation_row.subscription_credits);
  end if;

  if reservation_row.purchased_credits > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, request_id, entry_type, bucket, delta)
    values (p_clerk_user_id, p_request_id, 'uncertain_resolution',
            'purchased_held', -reservation_row.purchased_credits);
  end if;

  update public.premivate_credit_reservations
     set status = 'committed', resolution = 'consumed', updated_at = now()
   where clerk_user_id = p_clerk_user_id and request_id = p_request_id;

  return jsonb_build_object('status', 'committed', 'requestId', p_request_id);
end;
$$;

create or replace function public.premivate_credit_grant_paid_period(
  p_clerk_user_id text,
  p_stripe_subscription_id text,
  p_stripe_invoice_id text,
  p_stripe_event_id text,
  p_period_kind text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  account_row public.premivate_credit_accounts%rowtype;
  prior_grant public.premivate_credit_period_grants%rowtype;
  recovered_count integer := 0;
  new_grant_id bigint;
  total_before integer;
  total_after integer;
  grant_amount integer;
  grant_status text;
  subscription_has_prior boolean;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_stripe_subscription_id is null or p_stripe_invoice_id is null
     or p_stripe_event_id is null
     or p_period_kind is null or p_period_kind not in ('initial', 'cycle')
     or p_period_start is null or p_period_end is null
     or p_period_end <= p_period_start then
    raise exception using errcode = '22023', message = 'CREDIT_PERIOD_INPUT_INVALID';
  end if;

  insert into public.premivate_credit_accounts (clerk_user_id)
  values (p_clerk_user_id)
  on conflict (clerk_user_id) do nothing;

  -- Lock order is always account, then reservations/grant rows.
  select * into account_row
    from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id
   for update;

  select * into prior_grant
    from public.premivate_credit_period_grants
   where stripe_invoice_id = p_stripe_invoice_id
      or stripe_event_id = p_stripe_event_id
   for update;

  if found then
    if prior_grant.clerk_user_id = p_clerk_user_id
       and prior_grant.stripe_subscription_id = p_stripe_subscription_id
       and prior_grant.stripe_invoice_id = p_stripe_invoice_id
       and prior_grant.period_start = p_period_start
       and prior_grant.period_end = p_period_end then
      return jsonb_build_object(
        'status', 'duplicate',
        'grantId', prior_grant.grant_id,
        'grantedCredits', prior_grant.granted_credits,
        'recoveredReservations', 0
      );
    end if;
    raise exception using errcode = '23505', message = 'CREDIT_PERIOD_REFERENCE_CONFLICT';
  end if;

  select * into prior_grant
    from public.premivate_credit_period_grants
   where clerk_user_id = p_clerk_user_id
     and stripe_subscription_id = p_stripe_subscription_id
     and period_start = p_period_start
     and period_end = p_period_end
   for update;

  if found then
    raise exception using errcode = '23505',
      message = 'CREDIT_PERIOD_ALREADY_RECORDED_WITH_DIFFERENT_REFERENCE';
  end if;

  select exists (
    select 1
      from public.premivate_credit_period_grants
     where clerk_user_id = p_clerk_user_id
       and stripe_subscription_id = p_stripe_subscription_id
  ) into subscription_has_prior;

  if p_period_kind = 'initial' and subscription_has_prior then
    raise exception using errcode = '23514', message = 'CREDIT_INITIAL_PERIOD_CONFLICT';
  end if;

  if p_period_kind = 'cycle' and not subscription_has_prior then
    raise exception using errcode = '23514', message = 'CREDIT_CYCLE_WITHOUT_SUBSCRIPTION_HISTORY';
  end if;

  -- Global chronology across this user's subscriptions. A later-arriving older
  -- or overlapping paid period stops before any balance or grant mutation.
  if account_row.last_paid_period_end is not null
     and p_period_start < account_row.last_paid_period_end then
    raise exception using errcode = '23514',
      message = 'CREDIT_PERIOD_OUT_OF_ORDER_OR_OVERLAPPING';
  end if;

  recovered_count :=
    public.premivate_credit_recover_expired_locked(p_clerk_user_id);

  total_before := account_row.subscription_available + account_row.subscription_held;
  grant_amount := least(100, 200 - total_before);
  total_after := total_before + grant_amount;

  -- The cap includes held reservations. A later safe refund therefore cannot
  -- push the combined available+held subscription balance above 200.
  update public.premivate_credit_accounts
     set subscription_available = subscription_available + grant_amount,
         last_paid_period_start = p_period_start,
         last_paid_period_end = p_period_end,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  if account_row.last_paid_period_end is null then
    grant_status := 'granted_initial';
  elsif p_period_start > account_row.last_paid_period_end then
    grant_status := 'granted_paid_gap';
  else
    grant_status := 'granted_cycle';
  end if;

  insert into public.premivate_credit_period_grants (
    clerk_user_id, stripe_subscription_id, stripe_invoice_id, stripe_event_id,
    period_kind, period_start, period_end, requested_credits,
    subscription_total_before, subscription_total_after, granted_credits, grant_status
  ) values (
    p_clerk_user_id, p_stripe_subscription_id, p_stripe_invoice_id, p_stripe_event_id,
    p_period_kind, p_period_start, p_period_end, 100,
    total_before, total_after, grant_amount, grant_status
  ) returning grant_id into new_grant_id;

  if grant_amount > 0 then
    insert into public.premivate_credit_ledger_entries
      (clerk_user_id, reference_id, entry_type, bucket, delta)
    values
      (p_clerk_user_id, p_stripe_invoice_id, 'subscription_grant',
       'subscription_available', grant_amount);
  end if;

  return jsonb_build_object(
    'status', grant_status,
    'grantId', new_grant_id,
    'grantedCredits', grant_amount,
    'subscriptionAvailable', account_row.subscription_available + grant_amount,
    'subscriptionHeld', account_row.subscription_held,
    'recoveredReservations', recovered_count
  );
end;
$$;

create or replace function public.premivate_credit_grant_purchased(
  p_clerk_user_id text,
  p_stripe_payment_intent_id text,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  account_row public.premivate_credit_accounts%rowtype;
  topup_row public.premivate_credit_topup_grants%rowtype;
  new_grant_id bigint;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_stripe_payment_intent_id is null
     or p_credits is null or p_credits <= 0 then
    raise exception using errcode = '22023', message = 'CREDIT_TOPUP_INPUT_INVALID';
  end if;

  insert into public.premivate_credit_accounts (clerk_user_id)
  values (p_clerk_user_id)
  on conflict (clerk_user_id) do nothing;

  select * into account_row
    from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id
   for update;

  select * into topup_row
    from public.premivate_credit_topup_grants
   where stripe_payment_intent_id = p_stripe_payment_intent_id
   for update;

  if found then
    if topup_row.clerk_user_id = p_clerk_user_id and topup_row.credits = p_credits then
      return jsonb_build_object('status', 'duplicate', 'grantId', topup_row.grant_id);
    end if;
    raise exception using errcode = '23505', message = 'CREDIT_TOPUP_REFERENCE_CONFLICT';
  end if;

  update public.premivate_credit_accounts
     set purchased_available = purchased_available + p_credits,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  insert into public.premivate_credit_topup_grants (
    clerk_user_id, stripe_payment_intent_id, credits
  ) values (
    p_clerk_user_id, p_stripe_payment_intent_id, p_credits
  ) returning grant_id into new_grant_id;

  insert into public.premivate_credit_ledger_entries
    (clerk_user_id, reference_id, entry_type, bucket, delta)
  values
    (p_clerk_user_id, p_stripe_payment_intent_id, 'topup_grant',
     'purchased_available', p_credits);

  return jsonb_build_object(
    'status', 'granted',
    'grantId', new_grant_id,
    'purchasedAvailable', account_row.purchased_available + p_credits
  );
end;
$$;

revoke all on function public.premivate_credit_recover_expired_locked(text)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_reserve(text, text, text, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_mark_provider_started(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_commit(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_release(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_resolve_uncertain(text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_grant_paid_period(text, text, text, text, text, timestamptz, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.premivate_credit_grant_purchased(text, text, integer)
  from public, anon, authenticated, service_role;

grant execute on function public.premivate_credit_reserve(text, text, text, integer) to service_role;
grant execute on function public.premivate_credit_mark_provider_started(text, text) to service_role;
grant execute on function public.premivate_credit_commit(text, text) to service_role;
grant execute on function public.premivate_credit_release(text, text) to service_role;
grant execute on function public.premivate_credit_resolve_uncertain(text, text, text) to service_role;
grant execute on function public.premivate_credit_grant_paid_period(text, text, text, text, text, timestamptz, timestamptz) to service_role;
grant execute on function public.premivate_credit_grant_purchased(text, text, integer) to service_role;

revoke all on sequence public.premivate_credit_ledger_entries_id_seq
  from public, anon, authenticated, service_role;

commit;
