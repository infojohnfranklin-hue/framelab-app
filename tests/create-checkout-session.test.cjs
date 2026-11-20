const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { before, test } = require("node:test");

const checkoutSourcePath = path.resolve(
  __dirname,
  "../pages/api/create-checkout-session.js",
);
let source;
let handler;

before(async () => {
  source = fs.readFileSync(checkoutSourcePath, "utf8");
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  ({ default: handler } = await import(moduleUrl));
});

function responseCapture() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("POST checkout is fail-closed before any Stripe call", async () => {
  const res = responseCapture();

  await handler({ method: "POST", body: { marketCountryScope: "CH" } }, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "MARKET_NOT_ACTIVATED" });
  assert.doesNotMatch(source, /stripe\.checkout\.sessions\.create/);
});

test("non-POST requests remain rejected", async () => {
  const res = responseCapture();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.body, { error: "Only POST allowed" });
});
