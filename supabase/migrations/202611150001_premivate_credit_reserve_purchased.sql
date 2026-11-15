begin;

create or replace function public.premivate_credit_reserve_purchased(
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
begin
  if p_clerk_user_id is null or length(trim(p_clerk_user_id)) = 0
     or p_request_id is null or length(trim(p_request_id)) = 0
     or p_operation is distinct from 'main'
     or p_credits is distinct from 1 then
    raise exception using errcode = '22023', message = 'CREDIT_RESERVATION_INPUT_INVALID';
  end if;

  insert into public.premivate_credit_accounts (clerk_user_id)
  values (p_clerk_user_id)
  on conflict (clerk_user_id) do nothing;

  -- Keep the same account-before-reservation lock order as the other ledger RPCs.
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

  if account_row.purchased_available < p_credits then
    raise exception using errcode = 'P0001', message = 'CREDIT_BALANCE_INSUFFICIENT';
  end if;

  update public.premivate_credit_accounts
     set purchased_available = purchased_available - p_credits,
         purchased_held = purchased_held + p_credits,
         updated_at = now()
   where clerk_user_id = p_clerk_user_id;

  insert into public.premivate_credit_reservations (
    clerk_user_id, request_id, operation, credits,
    subscription_credits, purchased_credits, status, expires_at
  ) values (
    p_clerk_user_id, p_request_id, p_operation, p_credits,
    0, p_credits, 'reserved', now() + interval '30 minutes'
  );

  insert into public.premivate_credit_ledger_entries
    (clerk_user_id, request_id, entry_type, bucket, delta)
  values
    (p_clerk_user_id, p_request_id, 'reservation', 'purchased_available', -p_credits),
    (p_clerk_user_id, p_request_id, 'reservation', 'purchased_held', p_credits);

  return jsonb_build_object(
    'status', 'reserved',
    'requestId', p_request_id,
    'subscriptionCredits', 0,
    'purchasedCredits', p_credits
  );
end;
$$;

revoke all on function public.premivate_credit_reserve_purchased(text, text, text, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.premivate_credit_reserve_purchased(text, text, text, integer)
  to service_role;

commit;
