import { getStripePublishableKey, stripeSecretMatchesEnvironment } from "../../lib/stripe-mode";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  if (process.env.VERCEL_ENV !== "preview") return res.status(404).json({ error: "NOT_FOUND" });
  if (!stripeSecretMatchesEnvironment(process.env)) {
    return res.status(503).json({ error: "STRIPE_TEST_SECRET_UNAVAILABLE" });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const authHeaders = { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` };
  try {
    const [accountResponse, priceResponse, webhookResponse] = await Promise.all([
      fetch("https://api.stripe.com/v1/account", { headers: authHeaders }),
      priceId
        ? fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(priceId)}?expand[]=product`, { headers: authHeaders })
        : Promise.resolve(null),
      fetch("https://api.stripe.com/v1/webhook_endpoints?limit=100", { headers: authHeaders }),
    ]);
    const accountBody = await accountResponse.json();
    const priceBody = priceResponse ? await priceResponse.json() : null;
    const webhookBody = await webhookResponse.json();
    return res.status(200).json({
      environment: "preview",
      secretModeMatchesPreview: stripeSecretMatchesEnvironment(process.env),
      publishableKeyConfigured: Boolean(getStripePublishableKey(process.env)),
      stripeAccount: accountResponse.ok
        ? { id: accountBody.id, livemode: accountBody.livemode }
        : { status: accountResponse.status, error: accountBody?.error?.type || "unavailable" },
      configuredPrice: !priceId
        ? { status: "missing" }
        : priceResponse.ok
          ? {
              id: priceBody.id,
              active: priceBody.active,
              livemode: priceBody.livemode,
              currency: priceBody.currency,
              unitAmount: priceBody.unit_amount,
              recurring: priceBody.recurring,
              product: typeof priceBody.product === "object"
                ? { id: priceBody.product.id, name: priceBody.product.name }
                : priceBody.product,
            }
          : { status: priceResponse.status, error: priceBody?.error?.code || "unavailable" },
      webhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      webhookEndpoints: webhookResponse.ok
        ? (webhookBody.data || []).map((endpoint) => {
            let destination = null;
            try {
              const parsedUrl = new URL(endpoint.url);
              destination = `${parsedUrl.origin}${parsedUrl.pathname}`;
            } catch {}
            return {
              id: endpoint.id,
              destination,
              hasQueryParameters: Boolean(endpoint.url && endpoint.url.includes("?")),
              status: endpoint.status,
              livemode: endpoint.livemode,
              enabledEvents: endpoint.enabled_events,
            };
          })
        : { status: webhookResponse.status, error: webhookBody?.error?.type || "unavailable" },
    });
  } catch {
    return res.status(502).json({ error: "STRIPE_PREFLIGHT_UNAVAILABLE" });
  }
}
