begin;

-- Keep the account-deletion guard through Stripe's documented 30-day event
-- resend window, then remove the hashed marker. Self-service markers begin
-- their retention period only after the account data has been deleted.
alter table public.premivate_account_deletion_tombstones
  add column if not exists expires_at timestamptz;

update public.premivate_account_deletion_tombstones
   set expires_at = created_at + interval '30 days'
 where expires_at is null;

alter table public.premivate_account_deletion_tombstones
  alter column expires_at set default (now() + interval '30 days');
alter table public.premivate_account_deletion_tombstones
  alter column expires_at set not null;

alter table public.premivate_self_service_account_deletions
  add column if not exists expires_at timestamptz;

update public.premivate_self_service_account_deletions
   set expires_at = updated_at + interval '30 days'
 where stage = 'data_deleted' and expires_at is null;

update public.premivate_self_service_account_deletions
   set expires_at = null
 where stage <> 'data_deleted' and expires_at is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.premivate_self_service_account_deletions'::regclass
       and conname = 'premivate_self_service_deletions_expiry_matches_stage'
  ) then
    alter table public.premivate_self_service_account_deletions
      add constraint premivate_self_service_deletions_expiry_matches_stage
      check (
        (stage = 'data_deleted' and expires_at is not null)
        or (stage <> 'data_deleted' and expires_at is null)
      );
  end if;
end;
$$;

create index if not exists premivate_account_deletion_tombstones_expires_at_idx
  on public.premivate_account_deletion_tombstones (expires_at);
create index if not exists premivate_self_service_deletions_expires_at_idx
  on public.premivate_self_service_account_deletions (expires_at)
  where stage = 'data_deleted';

create or replace function public.premivate_purge_expired_account_deletion_markers()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, cron
as $$
declare
  v_tombstones_deleted integer := 0;
  v_self_service_deleted integer := 0;
  v_cron_runs_deleted integer := 0;
begin
  delete from public.premivate_account_deletion_tombstones
   where expires_at <= statement_timestamp();
  get diagnostics v_tombstones_deleted = row_count;

  delete from public.premivate_self_service_account_deletions
   where stage = 'data_deleted'
     and expires_at is not null
     and expires_at <= statement_timestamp();
  get diagnostics v_self_service_deleted = row_count;

  -- Supabase Cron keeps job-run history indefinitely unless it is cleaned up.
  delete from cron.job_run_details as run
   where run.end_time < statement_timestamp() - interval '7 days'
     and exists (
       select 1
         from cron.job as job
        where job.jobid = run.jobid
          and job.jobname = 'premivate-expired-account-deletion-marker-purge'
     );
  get diagnostics v_cron_runs_deleted = row_count;

  return jsonb_build_object(
    'tombstonesDeleted', v_tombstones_deleted,
    'selfServiceMarkersDeleted', v_self_service_deleted,
    'cronRunRecordsDeleted', v_cron_runs_deleted
  );
end;
$$;

revoke all on function public.premivate_purge_expired_account_deletion_markers()
  from public, anon, authenticated, service_role;

create or replace function public.premivate_self_service_deletion_advance(
  p_clerk_user_id text,
  p_expected_stage text,
  p_next_stage text
)
returns jsonb
language plpgsql
security definer
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
     set stage = p_next_stage,
         expires_at = case when p_next_stage = 'data_deleted'
           then now() + interval '30 days' else null end,
         updated_at = now()
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
returns jsonb
language plpgsql
security definer
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
     set stage = 'data_deleted',
         expires_at = now() + interval '30 days',
         updated_at = now()
   where clerk_user_hash = v_hash;
  return jsonb_build_object(
    'stage', 'data_deleted',
    'historyRowsDeleted', v_history_deleted,
    'profilesDeleted', v_profiles_deleted
  );
end;
$$;

revoke all on function public.premivate_self_service_deletion_advance(text, text, text)
  from public, anon, authenticated;
revoke all on function public.premivate_self_service_deletion_commit(text)
  from public, anon, authenticated;
grant execute on function public.premivate_self_service_deletion_advance(text, text, text)
  to service_role;
grant execute on function public.premivate_self_service_deletion_commit(text)
  to service_role;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'premivate-expired-account-deletion-marker-purge',
  '0 * * * *',
  'select public.premivate_purge_expired_account_deletion_markers();'
);

commit;
