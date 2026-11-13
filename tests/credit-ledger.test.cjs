const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const sourcePath = path.join(root, "lib", "credit-ledger.js");
const migrationPath = path.join(
  root,
  "supabase",
  "migrations",
  "202611020001_premivate_credit_ledger.sql"
);

const source = fs.readFileSync(sourcePath, "utf8").replace(/^export\s+/gm, "");
const moduleObject = { exports: {} };

vm.runInNewContext(
  `${source}
module.exports = {
  calculateRollover,
  classifyPaidPeriod,
  transitionReservation,
  resolveHeldCredits,
  reserve
};`,
  { module: moduleObject, exports: moduleObject.exports, require },
  { filename: sourcePath }
);

const ledger = moduleObject.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const migration = fs.readFileSync(migrationPath, "utf8");

test("rollover includes held subscription credits in the 200-credit cap", () => {
  assert.deepEqual(plain(ledger.calculateRollover(170, 30)), {
    availableBefore: 170,
    heldBefore: 30,
    totalBefore: 200,
    grant: 0,
    availableAfter: 170,
    heldAfter: 30,
    totalAfter: 200,
  });

  assert.deepEqual(plain(ledger.calculateRollover(100, 30)), {
    availableBefore: 100,
    heldBefore: 30,
    totalBefore: 130,
    grant: 70,
    availableAfter: 170,
    heldAfter: 30,
    totalAfter: 200,
  });
});

test("refund after a period rollover cannot exceed the cap", () => {
  const rollover = ledger.calculateRollover(99, 1);
  const refunded = ledger.resolveHeldCredits({
    available: rollover.availableAfter,
    held: rollover.heldAfter,
    credits: 1,
    outcome: "not_consumed",
  });

  assert.equal(refunded.total, 200);
  assert.equal(refunded.available + refunded.held, 200);
});

test("consumed held credits are removed without refund", () => {
  assert.deepEqual(plain(ledger.resolveHeldCredits({
    available: 90,
    held: 10,
    credits: 1,
    outcome: "consumed",
  })), { available: 90, held: 9, total: 99 });
});

test("provider may start only after reservation; started work is never auto-released", () => {
  assert.deepEqual(plain(ledger.transitionReservation("reserved", "provider_started")),
    { status: "started" });
  assert.deepEqual(plain(ledger.transitionReservation("started", "provider_started")), {
    status: "conflict",
    reason: "CREDIT_RESERVATION_TRANSITION_INVALID",
  });
  assert.deepEqual(plain(ledger.transitionReservation("started", "recover")),
    { status: "uncertain" });
  assert.deepEqual(plain(ledger.transitionReservation("started", "release")), {
    status: "conflict",
    reason: "CREDIT_RESERVATION_TRANSITION_INVALID",
  });
  assert.deepEqual(plain(ledger.transitionReservation("reserved", "recover")),
    { status: "released" });
});

test("unconfirmed provider outcome keeps held credits until explicit resolution", () => {
  assert.deepEqual(plain(ledger.transitionReservation("uncertain", "resolve_not_consumed")),
    { status: "released" });
  assert.deepEqual(plain(ledger.transitionReservation("uncertain", "resolve_consumed")),
    { status: "committed" });
});

test("legitimate new subscription can start after the prior subscription ends", () => {
  assert.deepEqual(plain(ledger.classifyPaidPeriod({
    periodKind: "initial",
    periodStart: "2026-04-01T00:00:00.000Z",
    periodEnd: "2026-05-01T00:00:00.000Z",
    lastUserPaidPeriodEnd: "2026-04-01T00:00:00.000Z",
    subscriptionHasPriorPeriod: false,
  })), { status: "grant", grantStatus: "granted_cycle" });
});

test("new subscription with a genuine non-overlapping gap is recorded without backfill", () => {
  assert.deepEqual(plain(ledger.classifyPaidPeriod({
    periodKind: "initial",
    periodStart: "2026-05-01T00:00:00.000Z",
    periodEnd: "2026-06-01T00:00:00.000Z",
    lastUserPaidPeriodEnd: "2026-04-01T00:00:00.000Z",
    subscriptionHasPriorPeriod: false,
  })), { status: "grant", grantStatus: "granted_paid_gap" });
});

test("delayed older period across subscriptions is rejected", () => {
  assert.deepEqual(plain(ledger.classifyPaidPeriod({
    periodKind: "cycle",
    periodStart: "2026-02-01T00:00:00.000Z",
    periodEnd: "2026-03-01T00:00:00.000Z",
    lastUserPaidPeriodEnd: "2026-04-01T00:00:00.000Z",
    subscriptionHasPriorPeriod: true,
  })), {
    status: "conflict",
    reason: "CREDIT_PERIOD_OUT_OF_ORDER_OR_OVERLAPPING",
  });
});

test("same period replay is idempotently classified", () => {
  assert.deepEqual(plain(ledger.classifyPaidPeriod({
    periodKind: "cycle",
    periodStart: "2026-03-01T00:00:00.000Z",
    periodEnd: "2026-04-01T00:00:00.000Z",
    lastUserPaidPeriodEnd: "2026-04-01T00:00:00.000Z",
    subscriptionHasPriorPeriod: true,
    exactDuplicate: true,
  })), { status: "duplicate" });
});

test("invalid credit amount rejects before any Supabase RPC", async () => {
  await assert.rejects(
    ledger.reserve(null, {
      userId: "user_1",
      requestId: "req_1",
      operation: "main",
      credits: 2,
    }),
    { name: "TypeError", message: "INVALID_CREDIT_AMOUNT" }
  );
});

test("all account-changing RPCs use account-before-reservation lock order", () => {
  const mutations = [
    "premivate_credit_reserve",
    "premivate_credit_mark_provider_started",
    "premivate_credit_commit",
    "premivate_credit_release",
    "premivate_credit_resolve_uncertain",
    "premivate_credit_recover_expired_locked",
    "premivate_credit_grant_paid_period",
  ];

  for (const name of mutations) {
    const start = migration.indexOf(`function public.${name}(`);
    assert.notEqual(start, -1, `${name} exists`);
    const next = migration.indexOf("create or replace function", start + 10);
    const body = migration.slice(start, next === -1 ? undefined : next);
    const accountLock = body.indexOf("from public.premivate_credit_accounts");
    const reservationLock = body.indexOf("from public.premivate_credit_reservations");
    if (reservationLock !== -1) {
      assert.ok(accountLock !== -1 && accountLock < reservationLock, name);
    }
  }
});

test("foreign schema sequences are not modified", () => {
  assert.doesNotMatch(
    migration,
    /revoke\s+all\s+on\s+all\s+sequences\s+in\s+schema\s+public/i
  );
  assert.match(
    migration,
    /revoke all on sequence public\.premivate_credit_ledger_entries_id_seq/i
  );
});

test("period recovery count and new grant id use separate fields", () => {
  assert.match(migration, /recovered_count integer/);
  assert.match(migration, /new_grant_id bigint/);
  assert.match(migration, /'grantId', new_grant_id/);
  assert.match(migration, /'recoveredReservations', recovered_count/);
});

test("expired reservations cannot transition to started", () => {
  const start = migration.indexOf(
    "create or replace function public.premivate_credit_mark_provider_started("
  );
  assert.notEqual(start, -1);
  const next = migration.indexOf("create or replace function", start + 10);
  const body = migration.slice(start, next === -1 ? undefined : next);
  const statusGuard = body.indexOf("if reservation_row.status <> 'reserved' then");
  const expiryGuard = body.indexOf(
    "if reservation_row.expires_at <= clock_timestamp() then"
  );
  const startUpdate = body.indexOf("set status = 'started'");
  assert.ok(statusGuard >= 0 && statusGuard < expiryGuard);
  assert.ok(expiryGuard < startUpdate);
  assert.match(body, /message = 'CREDIT_RESERVATION_EXPIRED'/);
});
