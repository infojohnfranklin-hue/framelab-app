begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.premivate_account_deletion_tombstones (
  clerk_user_hash text primary key check (
    char_length(clerk_user_hash) = 64
    and clerk_user_hash = lower(clerk_user_hash)
    and translate(clerk_user_hash, '0123456789abcdef', '') = ''
  ),
  deletion_scope text not null check (deletion_scope = 'synthetic_preview_support_test'),
  created_at timestamptz not null default now()
);
alter table public.premivate_account_deletion_tombstones enable row level security;
revoke all on public.premivate_account_deletion_tombstones from public, anon, authenticated, service_role;

create or replace function public.premivate_account_deletion_hash(p_clerk_user_id text)
returns text language sql immutable strict security definer
set search_path = pg_catalog
as $$ select encode(extensions.digest(convert_to(p_clerk_user_id, 'UTF8'), 'sha256'), 'hex') $$;

create or replace function public.premivate_account_deletion_preflight(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_plan text := '';
  v_profile_stripe boolean := false;
  v_profile_count integer := 0;
  v_history_count integer := 0;
  v_credit_account_count integer := 0;
  v_credit_balance bigint := 0;
  v_credit_source_count integer := 0;
  v_period_grant_count integer := 0;
  v_topup_grant_count integer := 0;
  v_ledger_entry_count integer := 0;
  v_active_reservation_count integer := 0;
  v_refund_count integer := 0;
  v_refund_review_count integer := 0;
  v_checkout_claim_count integer := 0;
  v_blockers text[] := array[]::text[];
  v_marked boolean := false;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;

  select exists (
    select 1 from public.premivate_account_deletion_tombstones
     where clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)
  ) into v_marked;

  select count(*)::integer,
         coalesce(bool_or(stripe_customer_id is not null
           or stripe_subscription_id is not null
           or stripe_subscription_status is not null), false),
         coalesce(max(lower(coalesce(plan::text, ''))), '')
    into v_profile_count, v_profile_stripe, v_plan
    from public.profiles where id = p_clerk_user_id;

  select count(*)::integer into v_history_count
    from public.generations where user_id = p_clerk_user_id;

  select count(*)::integer,
         coalesce(sum(subscription_available + subscription_held
           + purchased_available + purchased_held), 0)::bigint
    into v_credit_account_count, v_credit_balance
    from public.premivate_credit_accounts where clerk_user_id = p_clerk_user_id;

  select count(*)::integer into v_credit_source_count
    from public.premivate_credit_sources where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_period_grant_count
    from public.premivate_credit_period_grants where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_topup_grant_count
    from public.premivate_credit_topup_grants where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_ledger_entry_count
    from public.premivate_credit_ledger_entries where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_active_reservation_count
    from public.premivate_credit_reservations
   where clerk_user_id = p_clerk_user_id and status in ('reserved', 'started', 'uncertain');
  select count(*)::integer into v_refund_count
    from public.premivate_credit_refunds where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_refund_review_count
    from public.premivate_credit_refund_reviews where clerk_user_id = p_clerk_user_id;
  select count(*)::integer into v_checkout_claim_count
    from public.premivate_subscription_checkout_claims where clerk_user_id = p_clerk_user_id;

  if v_marked then
    return jsonb_build_object(
      'status', 'already_marked',
      'deletionMarked', true,
      'blockers', '[]'::jsonb,
      'counts', jsonb_build_object(
        'profiles', v_profile_count, 'historyRows', v_history_count,
        'creditAccounts', v_credit_account_count, 'creditBalance', v_credit_balance,
        'creditSources', v_credit_source_count, 'periodGrants', v_period_grant_count,
        'topupGrants', v_topup_grant_count, 'ledgerEntries', v_ledger_entry_count,
        'activeReservations', v_active_reservation_count, 'refundRecords', v_refund_count,
        'refundReviews', v_refund_review_count, 'checkoutClaims', v_checkout_claim_count
      )
    );
  end if;

  if v_profile_stripe then v_blockers := array_append(v_blockers, 'PROFILE_STRIPE_LINKAGE'); end if;
  if v_plan like '%pro%' then v_blockers := array_append(v_blockers, 'PRO_PLAN_PRESENT'); end if;
  if v_credit_balance > 0 then v_blockers := array_append(v_blockers, 'CREDIT_BALANCE_PRESENT'); end if;
  if v_credit_source_count > 0 then v_blockers := array_append(v_blockers, 'CREDIT_SOURCE_RECORDS_PRESENT'); end if;
  if v_period_grant_count > 0 or v_topup_grant_count > 0 then
    v_blockers := array_append(v_blockers, 'PAID_CREDIT_GRANTS_PRESENT');
  end if;
  if v_active_reservation_count > 0 then
    v_blockers := array_append(v_blockers, 'ACTIVE_CREDIT_RESERVATION');
  end if;
  if v_refund_count > 0 or v_refund_review_count > 0 then
    v_blockers := array_append(v_blockers, 'REFUND_RECORDS_PRESENT');
  end if;
  if v_checkout_claim_count > 0 then v_blockers := array_append(v_blockers, 'CHECKOUT_CLAIM_PRESENT'); end if;

  return jsonb_build_object(
    'status', case when cardinality(v_blockers) = 0 then 'ready' else 'blocked' end,
    'deletionMarked', false,
    'blockers', to_jsonb(v_blockers),
    'counts', jsonb_build_object(
      'profiles', v_profile_count, 'historyRows', v_history_count,
      'creditAccounts', v_credit_account_count, 'creditBalance', v_credit_balance,
      'creditSources', v_credit_source_count, 'periodGrants', v_period_grant_count,
      'topupGrants', v_topup_grant_count, 'ledgerEntries', v_ledger_entry_count,
      'activeReservations', v_active_reservation_count, 'refundRecords', v_refund_count,
      'refundReviews', v_refund_review_count, 'checkoutClaims', v_checkout_claim_count
    )
  );
end;
$$;

create or replace function public.premivate_account_deletion_commit(p_clerk_user_id text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_preflight jsonb;
  v_history_deleted integer := 0;
  v_profile_deleted integer := 0;
begin
  if p_clerk_user_id is null or p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' then
    raise exception using errcode = '22023', message = 'ACCOUNT_DELETION_USER_ID_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  v_preflight := public.premivate_account_deletion_preflight(p_clerk_user_id);

  if v_preflight->>'deletionMarked' = 'true' then
    return jsonb_build_object('status', 'already_marked');
  end if;
  if jsonb_array_length(coalesce(v_preflight->'blockers', '[]'::jsonb)) > 0 then
    raise exception using errcode = 'P0001', message = 'ACCOUNT_DELETION_PREFLIGHT_BLOCKED';
  end if;

  insert into public.premivate_account_deletion_tombstones (clerk_user_hash, deletion_scope)
  values (public.premivate_account_deletion_hash(p_clerk_user_id), 'synthetic_preview_support_test')
  on conflict (clerk_user_hash) do nothing;

  delete from public.premivate_credit_source_reservations where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_refunds where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_ledger_entries where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_period_grants where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_topup_grants where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_reservations where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_sources where clerk_user_id = p_clerk_user_id;
  delete from public.premivate_credit_accounts where clerk_user_id = p_clerk_user_id;

  delete from public.generations where user_id = p_clerk_user_id;
  get diagnostics v_history_deleted = row_count;
  delete from public.profiles where id = p_clerk_user_id;
  get diagnostics v_profile_deleted = row_count;

  return jsonb_build_object(
    'status', 'deleted',
    'historyRowsDeleted', v_history_deleted,
    'profilesDeleted', v_profile_deleted
  );
end;
$$;

create or replace function public.premivate_reject_deleted_account_write()
returns trigger language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_user_id text;
begin
  if tg_table_name = 'profiles' then
    v_user_id := to_jsonb(new)->>'id';
  elsif tg_table_name = 'generations' then
    v_user_id := to_jsonb(new)->>'user_id';
  else
    v_user_id := to_jsonb(new)->>'clerk_user_id';
  end if;

  if v_user_id is null or v_user_id = '' then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));

  if exists (
    select 1 from public.premivate_account_deletion_tombstones
     where clerk_user_hash = public.premivate_account_deletion_hash(v_user_id)
  ) then
    raise exception using errcode = '23514', message = 'ACCOUNT_DELETION_TOMBSTONED';
  end if;
  return new;
end;
$$;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'profiles', 'generations', 'premivate_credit_accounts',
    'premivate_credit_reservations', 'premivate_credit_period_grants',
    'premivate_credit_topup_grants', 'premivate_credit_ledger_entries',
    'premivate_credit_sources', 'premivate_credit_source_reservations',
    'premivate_credit_refunds', 'premivate_credit_refund_reviews',
    'premivate_subscription_checkout_claims'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is null then
      raise exception 'ACCOUNT_DELETION_REQUIRED_TABLE_MISSING';
    end if;
    execute format(
      'create trigger premivate_reject_deleted_account_write
       before insert or update on public.%I
       for each row execute function public.premivate_reject_deleted_account_write()',
      v_table
    );
  end loop;
end;
$$;

revoke all on function public.premivate_account_deletion_hash(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_account_deletion_preflight(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_account_deletion_commit(text) from public, anon, authenticated, service_role;
revoke all on function public.premivate_reject_deleted_account_write() from public, anon, authenticated, service_role;
grant execute on function public.premivate_account_deletion_preflight(text) to service_role;
grant execute on function public.premivate_account_deletion_commit(text) to service_role;

commit;
