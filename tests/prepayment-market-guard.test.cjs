const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function loadRoute(file, { marketActivated = false, calls = {} } = {}) {
  let source = fs.readFileSync(path.join(root, file), "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace("export default async function handler", "async function handler");
  const api = vm.runInNewContext(`${source}\n({ handler });`, {
    isPrepaymentMarketActivated: () => marketActivated,
    getAuth: () => { calls.auth = (calls.auth || 0) + 1; return { userId: null }; },
    Stripe: class { constructor() { calls.stripe = (calls.stripe || 0) + 1; } },
    createServerFinalizedPrepaymentDraft: async () => { calls.draft = (calls.draft || 0) + 1; },
    assertAccountNotDeleting: async () => { calls.supabase = (calls.supabase || 0) + 1; },
    process: { env: {} },
  }, { timeout: 1000 });
  return api;
}

function response() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

for (const route of [
  "pages/api/create-checkout-session.js",
  "pages/api/create-credit-topup-session.js",
]) {
  test(`${route} rejects a closed market before auth, Stripe, or Supabase`, async () => {
    const calls = {};
    const api = loadRoute(route, { marketActivated: false, calls });
    const res = response();
    await api.handler({ method: "POST", body: { marketCountryScope: "CH", termsAccepted: false } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, "MARKET_NOT_ACTIVATED");
    assert.deepEqual(calls, {});
  });
}

test("an activated market proceeds to the existing Clerk authentication guard", async () => {
  const calls = {};
  const api = loadRoute("pages/api/create-checkout-session.js", { marketActivated: true, calls });
  const res = response();
  await api.handler({ method: "POST", body: { marketCountryScope: "CH" } }, res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(calls, { auth: 1 });
});

test("the credits API cannot advertise top-up sales while every market is closed", () => {
  const source = fs.readFileSync(path.join(root, "pages/api/credits.js"), "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace("export default async function handler", "async function handler");
  const api = vm.runInNewContext(`${source}\n({ isTopupSalesAvailable });`, {
    hasAnyActivatedPrepaymentMarket: () => false,
    isTopupSalesEnabled: () => true,
    process: { env: {} },
  }, { timeout: 1000 });
  assert.equal(api.isTopupSalesAvailable(), false);
});

test("Pro pricing and top-up settings gate their UI actions on activated markets", () => {
  const pricing = fs.readFileSync(path.join(root, "pages/pricing.js"), "utf8");
  const settings = fs.readFileSync(path.join(root, "pages/settings.js"), "utf8");
  assert.match(pricing, /disabled=\{loading \|\| !prepaymentMarketsOpen\}/);
  assert.match(pricing, /if \(!prepaymentMarketsOpen \|\| loading \|\| checkoutStartedRef\.current\) return/);
  assert.match(settings, /if \(!prepaymentMarketsOpen \|\| topupBusy \|\| creditState\?\.topupSalesEnabled !== true\) return/);
  assert.match(settings, /prepaymentMarketsOpen && creditState\.topupSalesEnabled && !creditState\.creditAccessBlocked/);
});
