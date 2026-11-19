const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");

const checkoutSourcePath = path.resolve(
  __dirname,
  "../pages/api/create-checkout-session.js",
);
const calls = [];
const originalPriceId = process.env.STRIPE_PRO_PRICE_ID;
const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
let handler;

before(async () => {
  process.env.STRIPE_PRO_PRICE_ID = "price_test_premivate_pro_24_chf";
  process.env.NEXT_PUBLIC_BASE_URL = "https://premivate.example.test";

  globalThis.__billingStripeMock = {
    checkout: {
      sessions: {
        create: async (params) => {
          calls.push(params);
          return { url: "https://checkout.example.test/session" };
        },
      },
    },
  };

  const source = fs.readFileSync(checkoutSourcePath, "utf8");
  const testableSource = source
    .replace('import Stripe from "stripe";\n', "")
    .replace(
      "const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);",
      "const stripe = globalThis.__billingStripeMock;",
    );

  assert.notEqual(testableSource, source, "Stripe client must be replaced by the test mock");

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(testableSource).toString("base64")}`;
  ({ default: handler } = await import(moduleUrl));
});

after(() => {
  if (originalPriceId === undefined) delete process.env.STRIPE_PRO_PRICE_ID;
  else process.env.STRIPE_PRO_PRICE_ID = originalPriceId;

  if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
  else process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;

  delete globalThis.__billingStripeMock;
});

test("POST checkout uses the configured Pro Price ID and returns the hosted URL", async () => {
  calls.length = 0;
  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await handler({ method: "POST" }, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(calls[0].line_items, [
    { price: "price_test_premivate_pro_24_chf", quantity: 1 },
  ]);
  assert.equal(calls[0].mode, "subscription");
  assert.equal(calls[0].success_url, "https://premivate.example.test/success");
  assert.equal(calls[0].cancel_url, "https://premivate.example.test");
  assert.deepEqual(responseBody, {
    url: "https://checkout.example.test/session",
  });
});

test("non-POST requests are rejected before Stripe is called", async () => {
  calls.length = 0;
  let statusCode;
  let responseBody;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await handler({ method: "GET" }, res);

  assert.equal(statusCode, 405);
  assert.deepEqual(responseBody, { error: "Only POST allowed" });
  assert.equal(calls.length, 0);
});
