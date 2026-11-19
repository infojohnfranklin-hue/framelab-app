BEGIN;

CREATE OR REPLACE VIEW public.premivate_monthly_market_sales
WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', paid_at AT TIME ZONE 'UTC')::date AS month_utc,
  market_country,
  buyer_type,
  currency,
  count(*)::bigint AS paid_transaction_count,
  sum(amount_total)::bigint AS gross_amount_total_minor_units,
  count(*) FILTER (WHERE state = 'refund_review')::bigint AS refund_review_count,
  sum(amount_total) FILTER (WHERE state = 'refund_review')::bigint AS refund_review_amount_minor_units
FROM public.premivate_contract_confirmations
WHERE payment_status = 'paid'
  AND paid_at IS NOT NULL
  AND market_country IS NOT NULL
  AND buyer_type IS NOT NULL
GROUP BY 1, 2, 3, 4;

REVOKE ALL ON public.premivate_monthly_market_sales FROM anon, authenticated;
GRANT SELECT ON public.premivate_monthly_market_sales TO service_role;

COMMENT ON VIEW public.premivate_monthly_market_sales IS
  'Monthly gross paid PREMIVATE transaction totals by billing country and declared buyer category, with refund-review subtotals; amounts are Stripe minor units and do not include external owner revenue.';

COMMIT;
