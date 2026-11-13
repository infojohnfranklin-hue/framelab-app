const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

const root = path.join(__dirname, "..");
const apiPath = path.join(root, "pages/api/generate.js");
const uiPath = path.join(root, "pages/index.js");
const apiSource = fs.readFileSync(apiPath, "utf8");
const uiSource = fs.readFileSync(uiPath, "utf8");
const { parse } = createRequire(path.join(root, "package.json"))("@babel/parser");
const generationCostMeasurement = require(path.join(
  root,
  "lib/generation-cost-measurement.js"
));
const apiAst = parse(apiSource, { sourceType: "module" });

function visit(node, predicate, found = []) {
  if (!node || typeof node !== "object") return found;
  if (predicate(node)) found.push(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) visit(child, predicate, found);
    } else if (value && typeof value === "object") {
      visit(value, predicate, found);
    }
  }
  return found;
}

test("Pro ledger remains opt-in and reserves one Main credit before provider calls", () => {
  assert.match(
    apiSource,
    /PREMIVATE_PRO_CREDIT_LEDGER_ENABLED\s*===\s*"true"/
  );
  assert.match(apiSource, /operation:\s*"main",\s*credits:\s*1/);

  const reserveAt = apiSource.indexOf("reservation = await reserveProCredit");
  const duplicateAt = apiSource.indexOf('reservation?.status === "duplicate"');
  const firstProviderAt = apiSource.indexOf("await measureOpenAICall(");
  assert.ok(reserveAt >= 0 && duplicateAt > reserveAt);
  assert.ok(firstProviderAt > duplicateAt);
  assert.match(apiSource, /code:\s*"GENERATION_REQUEST_ALREADY_USED"/);
  assert.match(apiSource, /code:\s*"PRO_CREDITS_EXHAUSTED"/);
});

test("provider-start callback runs the global guard first and marks only once", async () => {
  const callbacks = visit(
    apiAst,
    (node) =>
      node.type === "VariableDeclarator" &&
      node.id?.type === "Identifier" &&
      node.id.name === "reserveMainProviderAttempt"
  );
  assert.equal(callbacks.length, 1);

  const callbackSource = apiSource.slice(
    callbacks[0].init.start,
    callbacks[0].init.end
  );
  const harness = `
    (async () => {
      let proGenerationContext = {
        userId: "user_test",
        generationRequestId: "request_1234567890",
        reserved: true,
        providerStarted: false,
      };
      const events = [];
      const supabase = {};
      const reserveGlobalProviderAttempt = async () => { events.push("guard"); };
      const markProProviderStarted = async () => {
        events.push("mark");
        return { status: "started" };
      };
      const callback = ${callbackSource};
      await callback();
      await callback();
      return { events, providerStarted: proGenerationContext.providerStarted };
    })()
  `;
  const result = await vm.runInNewContext(harness, {}, { timeout: 1000 });
  assert.deepEqual(Array.from(result.events), ["guard", "mark", "guard"]);
  assert.equal(result.providerStarted, true);
});

test("provider-start marking failure blocks the measured provider invocation", async () => {
  const callbacks = visit(
    apiAst,
    (node) =>
      node.type === "VariableDeclarator" &&
      node.id?.type === "Identifier" &&
      node.id.name === "reserveMainProviderAttempt"
  );
  const callbackSource = apiSource.slice(
    callbacks[0].init.start,
    callbacks[0].init.end
  );
  const harness = `
    (async () => {
      let proGenerationContext = {
        userId: "user_test",
        generationRequestId: "request_1234567890",
        reserved: true,
        providerStarted: false,
      };
      const events = [];
      const supabase = {};
      const reserveGlobalProviderAttempt = async () => { events.push("guard"); };
      const markProProviderStarted = async () => {
        events.push("mark");
        return { status: "duplicate" };
      };
      const callback = ${callbackSource};
      const context = measurement.createGenerationCostMeasurementContext(
        "main_generator",
        () => {},
        callback
      );
      let invocationCount = 0;
      try {
        await measurement.measureOpenAICall(
          context,
          { stage: "main", model: "gpt-4.1-mini" },
          async () => {
            invocationCount += 1;
            return { model: "gpt-4.1-mini", usage: {} };
          }
        );
        return { events, errorCode: null, invocationCount };
      } catch (error) {
        return { events, errorCode: error.code, invocationCount };
      }
    })()
  `;
  const result = await vm.runInNewContext(
    harness,
    { measurement: generationCostMeasurement },
    { timeout: 1000 }
  );
  assert.deepEqual(Array.from(result.events), ["guard", "mark"]);
  assert.equal(result.errorCode, "PROVIDER_START_MARK_FAILED");
  assert.equal(result.invocationCount, 0);
});

test("success commits before HTTP 200; post-start failures never auto-release", () => {
  const commitAt = apiSource.indexOf("await commitProCredit(supabase");
  const successAt = apiSource.indexOf('costMeasurementOutcome = "success"');
  const releaseConditionAt = apiSource.indexOf(
    "!proGenerationContext.providerStarted",
    apiSource.indexOf("} finally {")
  );
  const releaseCallAt = apiSource.indexOf("await releaseProCredit(supabase");

  assert.ok(commitAt >= 0 && successAt > commitAt);
  assert.ok(releaseConditionAt >= 0 && releaseCallAt > releaseConditionAt);
  assert.match(apiSource, /!proGenerationContext\.committed/);
});

test("Free reservation and completion paths remain present and unchanged in shape", () => {
  assert.match(apiSource, /if \(isFreeUser && !mockMode\)/);
  assert.match(apiSource, /reserveFreeGenerate\(\s*userId,\s*generationRequestId\s*\)/);
  assert.match(apiSource, /completeFreeGenerate\(\s*freeGenerationContext\.userId/);
  assert.match(apiSource, /failFreeGenerate\(\s*freeGenerationContext\.userId/);
});

test("UI sends a stable request ID for Free and Pro without changing its payload field", () => {
  assert.match(uiSource, /generationPlan === "free" \|\| generationPlan === "pro"/);
  assert.match(uiSource, /generationRequestIdRef\.current\s*=\s*globalThis\.crypto\.randomUUID\(\)/);
  assert.match(uiSource, /generationRequestId,\s*\}\),/);
});
