begin;

do $$
begin
  if to_regclass('public.premivate_account_deletion_tombstones') is null
     or to_regprocedure('public.premivate_account_deletion_hash(text)') is null then
    raise exception 'SELF_SERVICE_DELETION_SUPPORT_BASELINE_REQUIRED';
  end if;
  if to_regclass('public.profiles') is null or to_regclass('public.generations') is null
     or to_regclass('public.premivate_credit_accounts') is null
     or to_regclass('public.premivate_credit_reservations') is null
     or to_regclass('public.premivate_credit_sources') is null
     or to_regclass('public.premivate_credit_source_reservations') is null
     or to_regclass('public.premivate_credit_ledger_entries') is null
     or to_regclass('public.premivate_credit_period_grants') is null
     or to_regclass('public.premivate_credit_topup_grants') is null
     or to_regclass('public.premivate_credit_refunds') is null
     or to_regclass('public.premivate_credit_refund_reviews') is null
     or to_regclass('public.premivate_subscription_checkout_claims') is null then
    raise exception 'SELF_SERVICE_DELETION_REQUIRED_SOURCE_TABLE_MISSING';
  end if;
  if not exists (
       select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='stripe_customer_id'
     ) or not exists (
       select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='stripe_subscription_id'
     ) or not exists (
       select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='stripe_subscription_status'
     ) then
    raise exception 'SELF_SERVICE_DELETION_PROFILE_SCHEMA_UNSUPPORTED';
  end if;
end;
$$;

create table if not exists public.premivate_self_service_account_deletions (
  clerk_user_hash text primary key check (
    char_length(clerk_user_hash) = 64
    and clerk_user_hash = lower(clerk_user_hash)
    and translate(clerk_user_hash, '0123456789abcdef', '') = ''
  ),
  stage text not null check (stage in ('pending', 'stripe_complete', 'data_deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.premivate_self_service_account_deletions enable row level security;
revoke all on public.premivate_self_service_account_deletions from public, anon, authenticated, service_role;

create table if not exists public.premivate_self_service_checkout_claims (
  clerk_user_id text primary key,
  claim_token text not null unique,
  status text not null check (status in ('pending', 'completed', 'released')),
  operation text not null check (operation in ('credit_topup')),
  stripe_session_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.premivate_self_service_checkout_claims enable row level security;
revoke all on public.premivate_self_service_checkout_claims from public, anon, authenticated, service_role;

create or replace function public.premivate_self_service_deletion_status(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_stage text;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;
  select stage into v_stage
    from public.premivate_self_service_account_deletions
   where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id);
  if v_stage is null and exists (
    select 1 from public.premivate_account_deletion_tombstones
     where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)
  ) then
    v_stage := 'deleted';
  end if;
  return jsonb_build_object('stage', coalesce(v_stage, 'none'));
end;
$$;

create or replace function public.premivate_self_service_deletion_preflight(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_stage text;
  v_profile public.profiles%rowtype;
  v_balance public.premivate_credit_accounts%rowtype;
  v_active_reservations integer := 0;
  v_open_subscription_claims integer := 0;
  v_open_topup_claims integer := 0;
  v_refund_records integer := 0;
  v_blockers text[] := array[]::text[];
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;

  select stage into v_stage
    from public.premivate_self_service_account_deletions
   where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id);

  select * into v_profile from public.profiles where id = p_clerk_user_id;
  select * into v_balance from public.premivate_credit_accounts where clerk_user_id = p_clerk_user_id;

  select count(*)::integer into v_active_reservations
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id
     and status in ('reserved', 'started', 'uncertain')
     and (status <> 'reserved' or expires_at > now());
  select count(*)::integer into v_open_subscription_claims
    from public.premivate_subscription_checkout_claims
   where clerk_user_id = p_clerk_user_id and status = 'pending' and expires_at > now();
  select count(*)::integer into v_open_topup_claims
    from public.premivate_self_service_checkout_claims
   where clerk_user_id = p_clerk_user_id and status = 'pending' and expires_at > now();
  select (select count(*) from public.premivate_credit_refunds where clerk_user_id = p_clerk_user_id)
       + (select count(*) from public.premivate_credit_refund_reviews where clerk_user_id = p_clerk_user_id)
    into v_refund_records;

  if coalesce(v_active_reservations, 0) > 0 then v_blockers := array_append(v_blockers, 'GENERATION_IN_PROGRESS'); end if;
  if coalesce(v_open_subscription_claims, 0) > 0 or coalesce(v_open_topup_claims, 0) > 0 then
    v_blockers := array_append(v_blockers, 'CHECKOUT_IN_PROGRESS');
  end if;
  if coalesce(v_refund_records, 0) > 0 then
    v_blockers := array_append(v_blockers, 'FINANCIAL_RECORD_RETENTION_REVIEW_REQUIRED');
  end if;

  return jsonb_build_object(
    'status', coalesce(v_stage, case when cardinality(v_blockers) = 0 then 'ready' else 'blocked' end),
    'stage', coalesce(v_stage, 'none'),
    'blockers', to_jsonb(v_blockers),
    'balance', jsonb_build_object(
      'subscriptionAvailable', coalesce(v_balance.subscription_available, 0),
      'subscriptionHeld', coalesce(v_balance.subscription_held, 0),
      'purchasedAvailable', coalesce(v_balance.purchased_available, 0),
      'purchasedHeld', coalesce(v_balance.purchased_held, 0)
    ),
    'subscription', jsonb_build_object(
      'plan', coalesce(v_profile.plan::text, 'free'),
      'customerId', v_profile.stripe_customer_id,
      'subscriptionId', v_profile.stripe_subscription_id,
      'status', v_profile.stripe_subscription_status,
      'cancelAtPeriodEnd', coalesce(v_profile.stripe_cancel_at_period_end, false)
    ),
    'counts', jsonb_build_object(
      'activeReservations', coalesce(v_active_reservations, 0),
      'openSubscriptionCheckouts', coalesce(v_open_subscription_claims, 0),
      'openTopupCheckouts', coalesce(v_open_topup_claims, 0),
      'refundRecordsRequiringReview', coalesce(v_refund_records, 0)
    )
  );
end;
$$;

create or replace function public.premivate_self_service_deletion_begin(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_preflight jsonb;
  v_hash text;
  v_stage text;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;
  v_hash := public.premivate_account_deletion_hash(p_clerk_user_id);
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));

  select stage into v_stage from public.premivate_self_service_account_deletions
   where clerk_user_hash = v_hash;
  if v_stage is not null then
    return public.premivate_self_service_deletion_preflight(p_clerk_user_id);
  end if;
  if exists (select 1 from public.premivate_account_deletion_tombstones where clerk_user_hash = v_hash) then
    return jsonb_build_object('status', 'blocked', 'stage', 'none', 'blockers', jsonb_build_array('ACCOUNT_ALREADY_DELETED'));
  end if;

  v_preflight := public.premivate_self_service_deletion_preflight(p_clerk_user_id);
  if jsonb_array_length(coalesce(v_preflight->'blockers', '[]'::jsonb)) > 0 then
    return v_preflight;
  end if;

  insert into public.premivate_self_service_account_deletions (clerk_user_hash, stage)
  values (v_hash, 'pending');
  return public.premivate_self_service_deletion_preflight(p_clerk_user_id);
end;
$$;

create or replace function public.premivate_self_service_deletion_advance(
  p_clerk_user_id text,
  p_expected_stage text,
  p_next_stage text
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' or
     not ((p_expected_stage = 'pending' and p_next_stage = 'stripe_complete') or
          (p_expected_stage = 'stripe_complete' and p_next_stage = 'data_deleted')) then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_STAGE_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  update public.premivate_self_service_account_deletions
     set stage = p_next_stage, updated_at = now()
   where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)
     and stage = p_expected_stage;
  if not found then
    if exists (select 1 from public.premivate_self_service_account_deletions
      where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)
        and stage = p_next_stage) then
      return jsonb_build_object('stage', p_next_stage);
    end if;
    raise exception using errcode = '23514', message = 'ACCOUNT_DELETION_STAGE_CONFLICT';
  end if;
  return jsonb_build_object('stage', p_next_stage);
end;
$$;

create or replace function public.premivate_self_service_deletion_commit(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_hash text;
  v_stage text;
  v_history_deleted integer := 0;
  v_profiles_deleted integer := 0;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;
  v_hash := public.premivate_account_deletion_hash(p_clerk_user_id);
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  select stage into v_stage from public.premivate_self_service_account_deletions
   where clerk_user_hash = v_hash for update;
  if v_stage = 'data_deleted' then return jsonb_build_object('stage', v_stage); end if;
  if v_stage is distinct from 'stripe_complete' then
    raise exception using errcode = '23514', message = 'ACCOUNT_DELETION_STRIPE_STEP_REQUIRED';
  end if;

  delete from public.premivate_credit_source_reservations where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_ledger_entries where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_period_grants where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_topup_grants where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_reservations where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_sources where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_accounts where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_subscription_checkout_claims where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_self_service_checkout_claims where clerk_user_id = p_clerk_user_id;
  delete from public.generations where user_id = p_clerk_user_id;
  get diagnostics v_history_deleted = row_count;
  delete from public.profiles where id = p_clerk_user_id;
  get diagnostics v_profiles_deleted = row_count;

  update public.premivate_self_service_account_deletions
     set stage = 'data_deleted', updated_at = now()
   where clerk_user_hash = v_hash;
  return jsonb_build_object(
    'stage', 'data_deleted',
    'historyRowsDeleted', v_history_deleted,
    'profilesDeleted', v_profiles_deleted
  );
end;
$$;

create or replace function public.premivate_reject_deleted_account_write()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id text;
  v_old_user_id text;
begin
  if tg_table_name = 'profiles' then
    v_user_id := to_jsonb(new)->>'id';
    if tg_op = 'UPDATE' then v_old_user_id := to_jsonb(old)->>'id'; end if;
  elsif tg_table_name = 'generations' then
    v_user_id := to_jsonb(new)->>'user_id';
    if tg_op = 'UPDATE' then v_old_user_id := to_jsonb(old)->>'user_id'; end if;
  else
    v_user_id := to_jsonb(new)->>'clerk_user_id';
    if tg_op = 'UPDATE' then v_old_user_id := to_jsonb(old)->>'clerk_user_id'; end if;
  end if;
  if v_user_id is null or v_user_id = '' then return new; end if;
  if v_old_user_id is not null and v_old_user_id <> '' and v_old_user_id <> v_user_id then
    if v_old_user_id < v_user_id then
      perform pg_advisory_xact_lock(hashtextextended(v_old_user_id, 0));
      perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));
    else
      perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));
      perform pg_advisory_xact_lock(hashtextextended(v_old_user_id, 0));
    end if;
  else
    perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));
  end if;
  if exists (select 1 from public.premivate_account_deletion_tombstones
      where clerk_user_hash = public.premivate_account_deletion_hash(v_user_id))
     or exists (select 1 from public.premivate_self_service_account_deletions
      where clerk_user_hash = public.premivate_account_deletion_hash(v_user_id)) then
    raise exception using errcode = '23514', message = 'ACCOUNT_DELETION_TOMBSTONED';
  end if;
  if v_old_user_id is not null and v_old_user_id <> '' and (
       exists (select 1 from public.premivate_account_deletion_tombstones
        where clerk_user_hash = public.premivate_account_deletion_hash(v_old_user_id))
       or exists (select 1 from public.premivate_self_service_account_deletions
        where clerk_user_hash = public.premivate_account_deletion_hash(v_old_user_id))
     ) then
    raise exception using errcode = '23514', message = 'ACCOUNT_DELETION_TOMBSTONED';
  end if;
  return new;
end;
$$;

create or replace function public.premivate_subscription_checkout_claim(
  p_clerk_user_id text,
  p_claim_token text
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare claimed_token text;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' or
     p_claim_token is null or length(trim(p_claim_token)) = 0 then
    raise exception using errcode = '22023', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  if exists (select 1 from public.premivate_self_service_account_deletions
      where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)) then
    return jsonb_build_object('status', 'account_deleting');
  end if;
  insert into public.premivate_subscription_checkout_claims (
    clerk_user_id, claim_token, status, expires_at
  ) values (p_clerk_user_id, p_claim_token, 'pending', now() + interval '24 hours')
  on conflict (clerk_user_id) do update
    set claim_token = excluded.claim_token, status = 'pending', stripe_session_id = null,
        expires_at = excluded.expires_at, updated_at = now()
    where premivate_subscription_checkout_claims.expires_at <= now()
       or premivate_subscription_checkout_claims.status in ('completed', 'released')
  returning claim_token into claimed_token;
  if claimed_token is null then return jsonb_build_object('status', 'busy'); end if;
  return jsonb_build_object('status', 'claimed');
end;
$$;

create or replace function public.premivate_self_service_checkout_claim(
  p_clerk_user_id text,
  p_claim_token text,
  p_operation text
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare claimed_token text;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' or
     p_claim_token is null or length(trim(p_claim_token)) = 0 or p_operation <> 'credit_topup' then
    raise exception using errcode = '22023', message = 'SELF_SERVICE_CHECKOUT_CLAIM_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  if exists (select 1 from public.premivate_self_service_account_deletions
      where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)) then
    return jsonb_build_object('status', 'account_deleting');
  end if;
  insert into public.premivate_self_service_checkout_claims (
    clerk_user_id, claim_token, status, operation, expires_at
  ) values (p_clerk_user_id, p_claim_token, 'pending', p_operation, now() + interval '24 hours')
  on conflict (clerk_user_id) do update
    set claim_token = excluded.claim_token, status = 'pending', operation = excluded.operation,
        stripe_session_id = null, expires_at = excluded.expires_at, updated_at = now()
    where premivate_self_service_checkout_claims.expires_at <= now()
       or premivate_self_service_checkout_claims.status in ('completed', 'released')
  returning claim_token into claimed_token;
  if claimed_token is null then return jsonb_build_object('status', 'busy'); end if;
  return jsonb_build_object('status', 'claimed');
end;
$$;

create or replace function public.premivate_self_service_checkout_finish(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_session_id text,
  p_status text,
  p_expires_at timestamptz default null
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if p_status not in ('completed', 'released') then
    raise exception using errcode = '22023', message = 'SELF_SERVICE_CHECKOUT_STATUS_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  update public.premivate_self_service_checkout_claims
     set status = p_status,
         stripe_session_id = coalesce(p_stripe_session_id, stripe_session_id),
         expires_at = coalesce(p_expires_at, expires_at), updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token and status = 'pending';
  if not found then return jsonb_build_object('status', 'ignored'); end if;
  return jsonb_build_object('status', p_status);
end;
$$;

create or replace function public.premivate_self_service_checkout_attach(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_session_id text,
  p_expires_at timestamptz
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' or
     p_claim_token is null or p_stripe_session_id is null or p_expires_at is null then
    raise exception using errcode = '22023', message = 'SELF_SERVICE_CHECKOUT_ATTACH_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  update public.premivate_self_service_checkout_claims
     set stripe_session_id = p_stripe_session_id, expires_at = p_expires_at, updated_at = now()
   where clerk_user_id = p_clerk_user_id and claim_token = p_claim_token and status = 'pending';
  if not found then return jsonb_build_object('status', 'ignored'); end if;
  return jsonb_build_object('status', 'attached');
end;
$$;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'profiles', 'generations', 'premivate_credit_accounts', 'premivate_credit_reservations',
    'premivate_credit_period_grants', 'premivate_credit_topup_grants',
    'premivate_credit_ledger_entries', 'premivate_credit_sources',
    'premivate_credit_source_reservations', 'premivate_credit_refunds',
    'premivate_credit_refund_reviews', 'premivate_subscription_checkout_claims',
    'premivate_self_service_checkout_claims'
  ] loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise exception 'ACCOUNT_DELETION_REQUIRED_TABLE_MISSING';
    end if;
    execute format('drop trigger if exists premivate_reject_deleted_account_write on public.%I', v_table);
    execute format(
      'create trigger premivate_reject_deleted_account_write before insert or update on public.%I for each row execute function public.premivate_reject_deleted_account_write()',
      v_table
    );
  end loop;
end;
$$;

revoke all on function public.premivate_self_service_deletion_status(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_deletion_preflight(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_deletion_begin(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_deletion_advance(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_deletion_commit(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_checkout_claim(text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_checkout_finish(text, text, text, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.premivate_self_service_checkout_attach(text, text, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.premivate_self_service_deletion_status(text) to service_role;
grant execute on function public.premivate_self_service_deletion_preflight(text) to service_role;
grant execute on function public.premivate_self_service_deletion_begin(text) to service_role;
grant execute on function public.premivate_self_service_deletion_advance(text, text, text) to service_role;
grant execute on function public.premivate_self_service_deletion_commit(text) to service_role;
grant execute on function public.premivate_self_service_checkout_claim(text, text, text) to service_role;
grant execute on function public.premivate_self_service_checkout_finish(text, text, text, text, timestamptz) to service_role;
grant execute on function public.premivate_self_service_checkout_attach(text, text, text, timestamptz) to service_role;

commit;
