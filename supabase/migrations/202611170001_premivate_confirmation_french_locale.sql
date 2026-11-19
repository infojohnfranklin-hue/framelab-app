BEGIN;

ALTER TABLE public.premivate_contract_confirmations
  DROP CONSTRAINT IF EXISTS premivate_contract_confirmations_terms_locale_check;

ALTER TABLE public.premivate_contract_confirmations
  ADD CONSTRAINT premivate_contract_confirmations_terms_locale_check
  CHECK (terms_locale IN ('en', 'de', 'fr'));

COMMIT;
