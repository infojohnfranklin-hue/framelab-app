BEGIN;

CREATE TABLE IF NOT EXISTS public.premivate_contract_confirmations (
  id uuid PRIMARY KEY,
  clerk_user_id text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('pro', 'credit_topup')),
  state text NOT NULL DEFAULT 'checkout_pending' CHECK (
    state IN ('checkout_pending', 'paid_pending_transfer', 'transfer_reported', 'service_eligible', 'checkout_expired', 'payment_failed', 'refund_review')
  ),
  stripe_checkout_session_id text UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  livemode boolean,
  amount_total bigint,
  currency text,
  terms_locale text NOT NULL CHECK (terms_locale IN ('en', 'de')),
  terms_version text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  confirmation_version text NOT NULL,
  terms_snapshot jsonb NOT NULL,
  early_start_requested boolean NOT NULL,
  early_start_requested_at timestamptz,
  market_country text CHECK (market_country IS NULL OR market_country ~ '^[A-Z]{2}$'),
  buyer_type text CHECK (buyer_type IS NULL OR buyer_type IN ('consumer', 'business_registered', 'business_unregistered', 'business_unknown')),
  transaction_snapshot jsonb,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  paid_at timestamptz,
  service_start_at timestamptz,
  pdf_data_base64 text,
  pdf_sha256 text CHECK (pdf_sha256 IS NULL OR pdf_sha256 ~ '^[a-f0-9]{64}$'),
  pdf_byte_length bigint CHECK (pdf_byte_length IS NULL OR pdf_byte_length > 0),
  pdf_created_at timestamptz,
  pdf_transfer_completed_at timestamptz,
  pdf_transfer_reported_sha256 text,
  pdf_transfer_reported_byte_length bigint,
  entitlement_unlocked_at timestamptz,
  refund_review_event_id text,
  refund_review_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((payment_status = 'paid') = (paid_at IS NOT NULL)),
  CHECK ((pdf_data_base64 IS NULL AND pdf_sha256 IS NULL AND pdf_byte_length IS NULL) OR
         (pdf_data_base64 IS NOT NULL AND pdf_sha256 IS NOT NULL AND pdf_byte_length IS NOT NULL))
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_contract_confirmation_id uuid;

CREATE INDEX IF NOT EXISTS premivate_contract_confirmations_user_state_idx
  ON public.premivate_contract_confirmations (clerk_user_id, state, created_at DESC);

CREATE INDEX IF NOT EXISTS premivate_contract_confirmations_subscription_idx
  ON public.premivate_contract_confirmations (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

ALTER TABLE public.premivate_contract_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.premivate_contract_confirmations FROM anon, authenticated;
GRANT ALL ON TABLE public.premivate_contract_confirmations TO service_role;

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
    OR NEW.early_start_requested IS DISTINCT FROM OLD.early_start_requested
    OR NEW.early_start_requested_at IS DISTINCT FROM OLD.early_start_requested_at THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_CONTRACT_SNAPSHOT_IMMUTABLE';
  END IF;

  IF OLD.stripe_checkout_session_id IS NOT NULL
    AND NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id THEN
    RAISE EXCEPTION 'PREMIVATE_CONFIRMATION_SESSION_IMMUTABLE';
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

DROP TRIGGER IF EXISTS premivate_contract_confirmation_guard_trg
  ON public.premivate_contract_confirmations;
CREATE TRIGGER premivate_contract_confirmation_guard_trg
  BEFORE UPDATE ON public.premivate_contract_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.premivate_contract_confirmation_guard();

COMMIT;
