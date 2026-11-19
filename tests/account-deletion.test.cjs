const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

function parseSource(relative) {
  return parse(read(relative), {
    sourceType: "module",
    plugins: ["jsx", "classProperties", "objectRestSpread"],
  });
}

test("account deletion UI requires signed-in user, re-verification and explicit confirmation", () => {
  const source = read("pages/settings.js");
  assert.match(source, /<SignedIn>\s*<AccountDeletionCard/);
  assert.match(source, /useReverification\(async \(\) =>/);
  assert.match(source, /confirmation !== "DELETE" \|\| !acknowledged/);
  assert.match(source, /acknowledged: true/);
  assert.match(source, /subscriptionAvailable/);
  assert.match(source, /purchasedAvailable/);
  assert.match(source, /freeRemaining/);
  assert.match(source, /mandatory legal rights remain unaffected/);
  assert.match(source, /Local drafts in this browser are not linked/);
  assert.match(source, /one-way hashed security marker is kept for 30 days after successful deletion/);
  assert.match(source, /Sicherheitsmarker bleibt 30 Tage nach erfolgreicher Löschung/);
});

test("deletion endpoint scopes target to authenticated identity and deletes Clerk last", () => {
  const source = read("pages/api/account-deletion.js");
  assert.match(source, /const auth = getAuth\(req\)/);
  assert.match(source, /const userId = auth\.userId/);
  assert.match(source, /auth\.has\?\.\(\{ reverification: "strict" \}\)/);
  assert.match(source, /sameOriginPost\(req\)/);
  assert.match(source, /req\.body\?\.confirmation !== "DELETE"/);
  assert.match(source, /beginAccountRedisDeletion\(redis, userId\)/);
  assert.ok(source.indexOf("cancelLinkedStripeObjects(userId, preflight.subscription)") < source.indexOf("premivate_self_service_deletion_advance"));
  assert.ok(source.indexOf("premivate_self_service_deletion_commit") < source.indexOf("deleteAccountRedisData(redis, userId, redisKeys)"));
  assert.ok(source.indexOf("deleteAccountRedisData(redis, userId, redisKeys)") < source.indexOf("clerk.users.deleteUser(userId)"));
  assert.match(source, /deletedUser\?\.id !== userId \|\| deletedUser\?\.deleted !== true/);
  assert.match(source, /retainedExternalFinancialRecords: true/);
});

test("migration has staged, tombstoned deletion and fail-closed concurrent write guards", () => {
  const source = read("supabase/migrations/202611080002_premivate_self_service_account_deletion.sql");
  assert.match(source, /create table if not exists public\.premivate_self_service_account_deletions/);
  assert.match(source, /clerk_user_hash text primary key/);
  assert.match(source, /for update/);
  assert.match(source, /v_stage is distinct from 'stripe_complete'/);
  assert.match(source, /premivate_self_service_deletion_commit/);
  assert.match(source, /delete from public\.generations where user_id = p_clerk_user_id/);
  assert.match(source, /premivate_reject_deleted_account_write/);
  assert.match(source, /grant execute on function public\.premivate_self_service_deletion_commit\(text\) to service_role/);
  assert.match(source, /status = 'pending' and expires_at > now\(\)/);
});

test("deletion markers have bounded expiry and a scheduled database purge", () => {
  const migration = read("supabase/migrations/202611190001_bounded_account_deletion_markers.sql");
  assert.match(migration, /premivate_account_deletion_tombstones[\s\S]*?expires_at timestamptz/);
  assert.match(migration, /created_at \+ interval '30 days'/);
  assert.match(migration, /set expires_at = updated_at \+ interval '30 days'[\s\S]*?where stage = 'data_deleted'/);
  assert.match(migration, /stage = 'data_deleted' and expires_at is not null/);
  assert.match(migration, /expires_at <= statement_timestamp\(\)/);
  assert.match(migration, /cron\.schedule\([\s\S]*?'0 \* \* \* \*'/);
  assert.match(migration, /delete from cron\.job_run_details as run[\s\S]*?interval '7 days'[\s\S]*?from cron\.job as job[\s\S]*?job\.jobid = run\.jobid[\s\S]*?job\.jobname = 'premivate-expired-account-deletion-marker-purge'/);
  assert.match(migration, /set stage = 'data_deleted',[\s\S]*?expires_at = now\(\) \+ interval '30 days'/);
  assert.match(migration, /grant execute on function public\.premivate_self_service_deletion_commit\(text\)[\s\S]*?to service_role/);
});

test("Swiss Privacy pages are publication-ready and match the bounded retention design", () => {
  const englishAndGerman = read("data/legal-documents.js");
  const french = read("data/legal-documents-fr.js");
  const englishGermanPrivacyBlocks = [...englishAndGerman.matchAll(/privacy:\s*\{([\s\S]*?)\n\s*imprint:/g)].map((match) => match[1]);
  const englishPrivacy = englishGermanPrivacyBlocks[0] ?? "";
  const germanPrivacy = englishGermanPrivacyBlocks[1] ?? "";
  const frenchPrivacy = french.match(/privacy:\s*\{([\s\S]*?)\n\s*imprint:/)?.[1] ?? "";

  assert.match(englishPrivacy, /publicationStatus: "ready"/);
  assert.match(germanPrivacy, /publicationStatus: "ready"/);
  assert.match(frenchPrivacy, /publicationStatus: "ready"/);
  assert.match(englishPrivacy, /Vercel Runtime Logs for this project are retained for one day/);
  assert.match(englishPrivacy, /expire 30 days after successful deletion[\s\S]*?next hourly database cleanup/);
  assert.match(germanPrivacy, /Vercel-Runtime-Logs dieses Projekts werden.*einen Tag gespeichert/);
  assert.match(germanPrivacy, /laufen 30 Tage nach erfolgreicher Löschung ab[\s\S]*?stündlichen Datenbank-Bereinigungslauf/);
  assert.match(frenchPrivacy, /Runtime Logs Vercel de ce projet sont conservés pendant un jour/);
  assert.match(frenchPrivacy, /expirent 30 jours après la suppression réussie[\s\S]*?nettoyage horaire/);
  assert.doesNotMatch(englishPrivacy, /Release-D|Candidate|must be reconciled|before publication/i);
  assert.doesNotMatch(frenchPrivacy, /Release-D|Candidate|avant publication|doit être rapproché/i);
  assert.deepEqual(parseSource("data/legal-documents.js").type, "File");
  assert.deepEqual(parseSource("data/legal-documents-fr.js").type, "File");
});

test("generate and blueprint generation are blocked and release operation locks", () => {
  for (const relative of ["pages/api/generate.js", "pages/api/generate-blueprint.js"]) {
    const source = read(relative);
    assert.match(source, /assertAccountNotDeleting\(supabase, userId, process\.env\)/, relative);
    assert.match(source, /beginAccountRedisOperation\(accountOperationRedis, userId\)/, relative);
    assert.match(source, /finishAccountRedisOperation\(accountOperationRedis, accountOperationUserId, accountOperationId\)/, relative);
    assert.match(source, /ACCOUNT_DELETION_IN_PROGRESS/, relative);
  }
});

test("account reads and writes refuse work once deletion starts", () => {
  for (const relative of [
    "pages/api/credits.js",
    "pages/api/delete-generation.js",
    "pages/api/history.js",
    "pages/api/me-plan.js",
    "pages/api/save-history.js",
    "pages/api/create-checkout-session.js",
    "pages/api/create-credit-topup-session.js",
    "pages/api/create-portal-session.js",
  ]) {
    assert.match(read(relative), /assertAccountNotDeleting\(/, relative);
  }
});

test("Stripe webhooks suppress user state recreation during deletion", () => {
  const webhook = read("pages/api/stripe-webhook.js");
  const topup = read("lib/credit-topup.js");
  const refunds = read("lib/stripe-refunds.js");
  assert.match(webhook, /isAccountDeletionMarked\(supabase, userId, process\.env\)/);
  assert.match(webhook, /cancelled\.status !== "canceled"/);
  assert.match(topup, /suppressed_account_deletion/);
  assert.match(topup, /premivate_self_service_checkout_finish/);
  assert.match(refunds, /isDeletionInProgress\(source\.userId\)/);
  assert.match(refunds, /suppressed_account_deletion/);
});

test("all modified JavaScript and JSX parses", () => {
  const files = [
    "pages/settings.js",
    "pages/api/account-deletion.js",
    "pages/api/create-checkout-session.js",
    "pages/api/create-credit-topup-session.js",
    "pages/api/create-portal-session.js",
    "pages/api/credits.js",
    "pages/api/delete-generation.js",
    "pages/api/generate-blueprint.js",
    "pages/api/generate.js",
    "pages/api/history.js",
    "pages/api/me-plan.js",
    "pages/api/save-history.js",
    "pages/api/stripe-webhook.js",
    "lib/account-deletion.js",
    "lib/credit-topup.js",
    "lib/stripe-refunds.js",
    "data/legal-documents.js",
    "data/legal-documents-fr.js",
  ];
  for (const file of files) assert.doesNotThrow(() => parseSource(file), file);
});
