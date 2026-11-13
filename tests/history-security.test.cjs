const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

const root = path.join(__dirname, "..");
const apiPath = path.join(root, "pages/api/history.js");
const pagePath = path.join(root, "pages/history.js");
const savePath = path.join(root, "pages/api/save-history.js");
const deletePath = path.join(root, "pages/api/delete-generation.js");
const { parse } = createRequire(path.join(root, "package.json"))(
  "@babel/parser"
);

function createResponse() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createHarness({ userId = "user_owner", rows = [], databaseError = null } = {}) {
  const state = {
    fromCalls: 0,
    selectCalls: [],
    filters: [],
    orderCalls: [],
    logs: [],
  };

  const query = {
    select(columns) {
      state.selectCalls.push(columns);
      return this;
    },
    eq(column, value) {
      state.filters.push([column, value]);
      return this;
    },
    order(column, options) {
      state.orderCalls.push([column, options]);
      if (databaseError) {
        return Promise.resolve({ data: null, error: databaseError });
      }
      if (!Array.isArray(rows)) {
        return Promise.resolve({ data: rows, error: null });
      }
      const ownerFilter = state.filters.find(([field]) => field === "user_id")?.[1];
      const data = rows
        .filter((row) => row.user_id === ownerFilter)
        .sort((left, right) => right.created_at.localeCompare(left.created_at));
      return Promise.resolve({ data, error: null });
    },
  };

  const source = fs
    .readFileSync(apiPath, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace("export default async function handler", "async function handler");
  const { handler } = vm.runInNewContext(
    `${source}\n({ handler });`,
    {
      getAuth: (req) => ({ userId: req.sessionUserId || null }),
      assertAccountNotDeleting: async () => true,
      process: { env: {} },
      supabase: {
        from(table) {
          state.fromCalls += 1;
          assert.equal(table, "generations");
          return query;
        },
      },
      console: {
        error: (...args) => state.logs.push(args),
      },
      Array,
    }
  );

  return { handler, state, userId };
}

async function invoke(harness, { method = "GET", sessionUserId = harness.userId, query } = {}) {
  const response = createResponse();
  await harness.handler({ method, sessionUserId, query }, response);
  return response;
}

test("History GET rejects missing Clerk authentication before database access", async () => {
  const harness = createHarness({ userId: null });
  const response = await invoke(harness, {
    sessionUserId: null,
    query: { userId: "user_attacker" },
  });

  assert.equal(response.statusCode, 401);
  assert.equal(harness.state.fromCalls, 0);
});

test("History GET filters by the Clerk session and ignores a forged user ID", async () => {
  const rows = [
    { id: 1, user_id: "user_owner", created_at: "2026-11-01T10:00:00Z" },
    { id: 2, user_id: "user_attacker", created_at: "2026-11-01T12:00:00Z" },
    { id: 3, user_id: "user_owner", created_at: "2026-11-01T11:00:00Z" },
  ];
  const harness = createHarness({ userId: "user_owner", rows });
  const response = await invoke(harness, {
    query: { userId: "user_attacker", user_id: "user_attacker" },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.generations.map((row) => row.id), [3, 1]);
  assert.deepEqual(harness.state.filters, [["user_id", "user_owner"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(harness.state.orderCalls)), [
    ["created_at", { ascending: false }],
  ]);
  assert.equal(response.headers["Cache-Control"], "private, no-store");
});

test("History GET returns a generic visible server error on a database failure", async () => {
  const harness = createHarness({
    databaseError: { message: "private database detail" },
  });
  const response = await invoke(harness);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, "History could not be loaded");
  assert.doesNotMatch(JSON.stringify({ body: response.body, logs: harness.state.logs }), /private database detail/);
  assert.deepEqual(harness.state.logs, [["HISTORY_DATABASE_ERROR"]]);
});

test("History GET does not misreport an invalid database payload as an empty history", async () => {
  const harness = createHarness({ rows: null });
  const response = await invoke(harness);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, "History could not be loaded");
});

test("History endpoint rejects methods other than GET", async () => {
  const harness = createHarness();
  const response = await invoke(harness, { method: "POST" });

  assert.equal(response.statusCode, 405);
  assert.equal(harness.state.fromCalls, 0);
});

test("History page uses the secure endpoint and keeps empty, error, and loading states distinct", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  parse(page, { sourceType: "module", plugins: ["jsx"] });

  assert.doesNotMatch(page, /lib\/supabaseClient|\.from\(["']generations["']\)/);
  assert.match(page, /fetch\(["']\/api\/history["']/);
  assert.match(page, /role="alert"/);
  assert.match(page, /!historyLoading && !historyError && generations\.length === 0/);
  assert.match(page, /!historyLoading && !historyError && \(/);
  assert.match(page, /setHistoryLoadRequest/);
});

test("History save and delete endpoints remain wired to their existing server routes", () => {
  const page = fs.readFileSync(pagePath, "utf8");
  const save = fs.readFileSync(savePath, "utf8");
  const remove = fs.readFileSync(deletePath, "utf8");

  assert.match(page, /fetch\(["']\/api\/delete-generation["']/);
  assert.match(page, /setGenerations\(\(current\) => current\.filter\(\(item\) => item\.id !== id\)\)/);
  assert.match(save, /getAuth\(req\)/);
  assert.match(save, /\.insert\(\[generation\]\)/);
  assert.match(remove, /getAuth\(req\)/);
  assert.match(remove, /\.eq\("user_id", userId\)/);
});
