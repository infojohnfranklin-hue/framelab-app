const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function loadRoute() {
  const source = fs.readFileSync(path.join(root, "pages/api/prepayment-eligibility.js"), "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace("export default async function handler", "async function handler");
  return vm.runInNewContext(`${source}\n({ handler });`, {
  }, { timeout: 1000 });
}

function response() {
  return { statusCode: null, body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function eligibleSession() {
  return {
    id: "cs_test_123",
    ui_mode: "elements",
    status: "open",
    livemode: false,
    mode: "subscription",
    client_reference_id: "user_123",
    metadata: {
      clerkUserId: "user_123",
      premivateCheckoutFlow: "r1-location-v1",
      premivatePrecontractMarketScope: "CH",
      premivateBuyerType: "consumer",
    },
  };
}

test("legacy Checkout eligibility route is retired and cannot mutate a client-confirmable Session", async () => {
  const api = loadRoute();
  const res = response();
  await api.handler({ method: "POST" }, res);
  assert.equal(res.statusCode, 410);
  assert.equal(res.body.error, "LEGACY_CLIENT_FINALIZED_CHECKOUT_DISABLED");
});
