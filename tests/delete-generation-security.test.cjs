const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const endpointPath = path.join(root, "pages/api/delete-generation.js");

function createHarness({ userId = "user_owner", databaseError = null } = {}) {
  const state = {
    clientCalls: 0,
    deleteCalls: 0,
    filters: [],
    logs: [],
  };
  const endpointSource = fs.readFileSync(endpointPath, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace("export default async function handler", "async function handler");

  const query = {
    delete() {
      state.deleteCalls += 1;
      return this;
    },
    eq(column, value) {
      state.filters.push([column, value]);
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve({ data: null, error: databaseError }).then(resolve, reject);
    },
  };

  const { handler } = vm.runInNewContext(
    `${endpointSource}\n({ handler });`,
    {
      getAuth: () => ({ userId }),
      createClient: () => {
        state.clientCalls += 1;
        return {
          from(table) {
            assert.equal(table, "generations");
            return query;
          },
        };
      },
      console: {
        log: (...args) => state.logs.push(args),
        error: (...args) => state.logs.push(args),
      },
      process: { env: {} },
    }
  );

  return { handler, state };
}

function createResponse() {
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

async function invoke(harness, id) {
  const response = createResponse();
  await harness.handler({ method: "POST", body: { id } }, response);
  return response;
}

test("unauthenticated history delete is rejected before database access", async () => {
  const harness = createHarness({ userId: null });
  const response = await invoke(harness, 12);

  assert.equal(response.statusCode, 401);
  assert.equal(harness.state.clientCalls, 0);
  assert.equal(harness.state.deleteCalls, 0);
  assert.equal(harness.state.logs.length, 0);
});

test("owner filter prevents deleting another user's generation without exposing row data", async () => {
  const harness = createHarness({ userId: "user_authenticated" });
  const response = await invoke(harness, 123);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal("deleted" in response.body, false);
  assert.deepEqual(harness.state.filters, [
    ["id", "123"],
    ["user_id", "user_authenticated"],
  ]);
  assert.deepEqual(harness.state.logs, []);
});

test("authenticated owner can delete their own generation", async () => {
  const harness = createHarness({ userId: "user_owner" });
  const response = await invoke(harness, 456);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(harness.state.filters, [
    ["id", "456"],
    ["user_id", "user_owner"],
  ]);
  assert.equal(harness.state.deleteCalls, 1);
});

test("large valid int8 decimal string is passed to Supabase without precision loss", async () => {
  const harness = createHarness();
  const response = await invoke(harness, "9223372036854775807");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(harness.state.filters, [
    ["id", "9223372036854775807"],
    ["user_id", "user_owner"],
  ]);
});

test("zero, negative, malformed, unsafe-number, and out-of-range IDs are rejected", async () => {
  const invalidIds = [
    0,
    -1,
    "0",
    "-1",
    "not-an-id",
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    "9223372036854775808",
    "-9223372036854775808",
  ];

  for (const id of invalidIds) {
    const harness = createHarness();
    const response = await invoke(harness, id);

    assert.equal(response.statusCode, 400, `expected ID ${String(id)} to be rejected`);
    assert.equal(harness.state.clientCalls, 0);
    assert.equal(harness.state.deleteCalls, 0);
  }
});

test("database failure returns a generic error and logs no database details", async () => {
  const harness = createHarness({
    databaseError: { message: "private row detail must not escape" },
  });
  const response = await invoke(harness, 789);
  const captured = JSON.stringify({ body: response.body, logs: harness.state.logs });

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, "Delete failed");
  assert.doesNotMatch(captured, /private row detail/);
  assert.deepEqual(harness.state.logs, [["DELETE_GENERATION_DATABASE_ERROR"]]);
});
