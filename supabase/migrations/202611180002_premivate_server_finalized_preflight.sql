BEGIN;

ALTER TABLE public.premivate_contract_confirmations
  ADD COLUMN IF NOT EXISTS purchase_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS stripe_confirmation_token_id text,
  ADD COLUMN IF NOT EXISTS eligibility_snapshot jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS premivate_contract_confirmation_token_uidx
  ON public.premivate_contract_confirmations (stripe_confirmation_token_id)
  WHERE stripe_confirmation_token_id IS NOT NULL;

ALTER TABLE public.premivate_subscription_checkout_claims
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

CREATE OR REPLACE FUNCTION public.premivate_contract_confirmation_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.clerk_user_id IS DISTINCT FROM OLD.clerk_user_id
    OR NEW.service_type IS DISTINCT FROM OLD.service_type
    OR NEW.terms_locale IS DISTINCT FROM OLD.terms_locale
    OR NEW.terms_version IS DISTINCT FROM OLD.terms_version
    OR NEW.terms_accepted_at IS DISTINCT FROM OLD.terms_accepted_at
    OR NEW.confirmation_version IS DISTINCT FROM OLD.confirmation_version
    OR NEW.terms_snapshot IS DISTINCT FROM OLD.terms_snapshot
    OR NEW.purchase_snapshot IS DISTINCT FROM OLD.purchase_snapshot
    OR NEW.early_start_requested IS DISTINCT FROM OLD.early_start_requested
    OR NEW.early_start_requested_at IS DISTINCT FROM OLD.early_start_requested_at THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_CONTRACT_SNAPSHOT_IMMUTABLE';
  END IF;

  IF OLD.stripe_checkout_session_id IS NOT NULL
    AND NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_SESSION_IMMUTABLE';
  END IF;

  IF OLD.stripe_confirmation_token_id IS NOT NULL
    AND NEW.stripe_confirmation_token_id IS DISTINCT FROM OLD.stripe_confirmation_token_id THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_TOKEN_IMMUTABLE';
  END IF;

  IF OLD.eligibility_snapshot IS NOT NULL
    AND NEW.eligibility_snapshot IS DISTINCT FROM OLD.eligibility_snapshot THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_ELIGIBILITY_IMMUTABLE';
  END IF;

  IF OLD.transaction_snapshot IS NOT NULL
    AND NEW.transaction_snapshot IS DISTINCT FROM OLD.transaction_snapshot THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_TRANSACTION_SNAPSHOT_IMMUTABLE';
  END IF;

  IF OLD.pdf_data_base64 IS NOT NULL AND (
    NEW.pdf_data_base64 IS DISTINCT FROM OLD.pdf_data_base64
    OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256
    OR NEW.pdf_byte_length IS DISTINCT FROM OLD.pdf_byte_length
    OR NEW.pdf_created_at IS DISTINCT FROM OLD.pdf_created_at
  ) THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_PDF_IMMUTABLE';
  END IF;

  IF OLD.payment_status = 'paid' AND NEW.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_PAYMENT_STATUS_IMMUTABLE';
  END IF;

  IF OLD.market_country IS NOT NULL AND NEW.market_country IS DISTINCT FROM OLD.market_country THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_MARKET_DATA_IMMUTABLE';
  END IF;

  IF OLD.buyer_type IS NOT NULL AND NEW.buyer_type IS DISTINCT FROM OLD.buyer_type THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_BUYER_TYPE_IMMUTABLE';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.premivate_subscription_checkout_claim(
  p_clerk_user_id text,
  p_claim_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE claimed_token text;
DECLARE existing_token text;
DECLARE existing_status text;
BEGIN
  IF p_clerk_user_id IS NULL OR p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' OR
     p_claim_token IS NULL OR length(trim(p_claim_token)) = 0 THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  INSERT INTO public.premivate_subscription_checkout_claims (
    clerk_user_id, claim_token, status, expires_at
  ) VALUES (p_clerk_user_id, p_claim_token, 'pending', now() + interval '24 hours')
  ON CONFLICT (clerk_user_id) DO UPDATE
    SET claim_token = excluded.claim_token,
        status = 'pending',
        stripe_session_id = NULL,
        stripe_subscription_id = NULL,
        expires_at = excluded.expires_at,
        updated_at = now()
    WHERE premivate_subscription_checkout_claims.expires_at <= now()
       OR premivate_subscription_checkout_claims.status IN ('completed', 'released')
  RETURNING claim_token INTO claimed_token;

  IF claimed_token IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'claimed');
  END IF;

  SELECT claim_token, status INTO existing_token, existing_status
    FROM public.premivate_subscription_checkout_claims
   WHERE clerk_user_id = p_clerk_user_id;
  IF existing_token = p_claim_token AND existing_status = 'pending' THEN
    RETURN jsonb_build_object('status', 'claimed');
  END IF;
  RETURN jsonb_build_object('status', 'busy');
END;
$$;

CREATE OR REPLACE FUNCTION public.premivate_subscription_checkout_attach_subscription(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_subscription_id text,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_stripe_subscription_id IS NULL OR p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'SUBSCRIPTION_ID_INVALID';
  END IF;
  UPDATE public.premivate_subscription_checkout_claims
     SET stripe_subscription_id = p_stripe_subscription_id,
         expires_at = p_expires_at,
         updated_at = now()
   WHERE clerk_user_id = p_clerk_user_id
     AND claim_token = p_claim_token
     AND status = 'pending'
     AND (stripe_subscription_id IS NULL OR stripe_subscription_id = p_stripe_subscription_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = '23514', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_CONFLICT';
  END IF;
  RETURN jsonb_build_object('status', 'attached');
END;
$$;

CREATE OR REPLACE FUNCTION public.premivate_subscription_checkout_complete_subscription(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_subscription_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.premivate_subscription_checkout_claims
     SET status = 'completed', updated_at = now()
   WHERE clerk_user_id = p_clerk_user_id
     AND claim_token = p_claim_token
     AND stripe_subscription_id = p_stripe_subscription_id
     AND status IN ('pending', 'completed');
  IF NOT FOUND THEN
    RAISE EXCEPTION USING errcode = '23514', message = 'SUBSCRIPTION_CHECKOUT_CLAIM_CONFLICT';
  END IF;
  RETURN jsonb_build_object('status', 'completed');
END;
$$;

CREATE OR REPLACE FUNCTION public.premivate_subscription_checkout_release_subscription(
  p_clerk_user_id text,
  p_claim_token text,
  p_stripe_subscription_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.premivate_subscription_checkout_claims
     SET status = 'released', updated_at = now()
   WHERE clerk_user_id = p_clerk_user_id
     AND claim_token = p_claim_token
     AND (p_stripe_subscription_id IS NULL OR stripe_subscription_id = p_stripe_subscription_id)
     AND status = 'pending';
  RETURN jsonb_build_object('status', CASE WHEN FOUND THEN 'released' ELSE 'unchanged' END);
END;
$$;

CREATE OR REPLACE FUNCTION public.premivate_self_service_checkout_claim(
  p_clerk_user_id text,
  p_claim_token text,
  p_operation text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE claimed_token text;
DECLARE existing_token text;
DECLARE existing_status text;
BEGIN
  IF p_clerk_user_id IS NULL OR p_clerk_user_id !~ '^user_[A-Za-z0-9]+$' OR
     p_claim_token IS NULL OR length(trim(p_claim_token)) = 0 OR p_operation <> 'credit_topup' THEN
    RAISE EXCEPTION USING errcode = '22023', message = 'SELF_SERVICE_CHECKOUT_CLAIM_INVALID';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_clerk_user_id, 0));
  IF EXISTS (SELECT 1 FROM public.premivate_self_service_account_deletions
      WHERE clerk_user_hash = public.premivate_account_deletion_hash(p_clerk_user_id)) THEN
    RETURN jsonb_build_object('status', 'account_deleting');
  END IF;
  INSERT INTO public.premivate_self_service_checkout_claims (
    clerk_user_id, claim_token, status, operation, expires_at
  ) VALUES (p_clerk_user_id, p_claim_token, 'pending', p_operation, now() + interval '24 hours')
  ON CONFLICT (clerk_user_id) DO UPDATE
    SET claim_token = excluded.claim_token, status = 'pending', operation = excluded.operation,
        stripe_session_id = NULL, expires_at = excluded.expires_at, updated_at = now()
    WHERE premivate_self_service_checkout_claims.expires_at <= now()
       OR premivate_self_service_checkout_claims.status IN ('completed', 'released')
  RETURNING claim_token INTO claimed_token;
  IF claimed_token IS NOT NULL THEN RETURN jsonb_build_object('status', 'claimed'); END IF;
  SELECT claim_token, status INTO existing_token, existing_status
    FROM public.premivate_self_service_checkout_claims WHERE clerk_user_id = p_clerk_user_id;
  IF existing_token = p_claim_token AND existing_status = 'pending' THEN
    RETURN jsonb_build_object('status', 'claimed');
  END IF;
  RETURN jsonb_build_object('status', 'busy');
END;
$$;

REVOKE ALL ON FUNCTION public.premivate_subscription_checkout_attach_subscription(text, text, text, timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.premivate_subscription_checkout_complete_subscription(text, text, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.premivate_subscription_checkout_release_subscription(text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.premivate_subscription_checkout_attach_subscription(text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.premivate_subscription_checkout_complete_subscription(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.premivate_subscription_checkout_release_subscription(text, text, text) TO service_role;

COMMIT;
