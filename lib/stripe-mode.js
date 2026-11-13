export function expectedStripeLivemode(env = process.env) {
  // Use Vercel's server-side deployment environment, never NODE_ENV: Next.js
  // sets NODE_ENV=production for both Preview and Production deployments.
  if (env.VERCEL_ENV === "production") return true;
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") return false;
  return null;
}

export function stripeSecretMatchesEnvironment(env = process.env) {
  const secret = env.STRIPE_SECRET_KEY;
  if (typeof secret !== "string" || !secret) return false;
  const expectedLive = expectedStripeLivemode(env);
  if (expectedLive === null) return false;
  return expectedLive
    ? secret.startsWith("sk_live_")
    : secret.startsWith("sk_test_");
}

export function stripeEventMatchesEnvironment(event, env = process.env) {
  const expectedLive = expectedStripeLivemode(env);
  return typeof event?.livemode === "boolean" &&
    expectedLive !== null &&
    event.livemode === expectedLive &&
    stripeSecretMatchesEnvironment(env);
}

export function getStripeBaseUrl(env = process.env) {
  if (env.VERCEL_ENV === "preview") {
    const host = env.VERCEL_URL;
    if (typeof host !== "string" ||
        !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(host)) {
      return null;
    }
    return `https://${host}`;
  }

  return typeof env.NEXT_PUBLIC_BASE_URL === "string"
    ? env.NEXT_PUBLIC_BASE_URL
    : null;
}
