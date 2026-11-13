begin;

-- Service-role-only read RPC. It returns no fabricated zero balance when the
-- account has not yet been created by a paid ledger grant.
create or replace function public.premivate_credit_get_balance(
  p_clerk_user_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  account_row public.premivate_credit_accounts%rowtype;
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0 then
    raise exception using errcode = '22023', message = 'CREDIT_BALANCE_USER_INVALID';
  end if;

  select * into account_row
    from public.premivate_credit_accounts
   where clerk_user_id = p_clerk_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'CREDIT_ACCOUNT_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'subscriptionAvailable', account_row.subscription_available,
    'subscriptionHeld', account_row.subscription_held,
    'purchasedAvailable', account_row.purchased_available,
    'purchasedHeld', account_row.purchased_held
  );
end;
$$;

revoke all on function public.premivate_credit_get_balance(text)
  from public, anon, authenticated, service_role;
grant execute on function public.premivate_credit_get_balance(text) to service_role;

commit;
