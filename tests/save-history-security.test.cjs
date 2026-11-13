const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const endpointPath = path.join(root, "pages/api/save-history.js");
const videosPath = path.join(root, "pages/videos.js");
const deleteEndpointPath = path.join(root, "pages/api/delete-generation.js");

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

function createHarness({ userId = "clerk_owner", databaseError = null } = {}) {
  const state = {
    fromCalls: 0,
    insertCalls: 0,
    upsertCalls: 0,
    inserts: [],
    logs: [],
  };

  const query = {
    insert(rows) {
      state.insertCalls += 1;
      state.inserts.push(JSON.parse(JSON.stringify(rows[0])));
      return this;
    },
    upsert() {
      state.upsertCalls += 1;
      return this;
    },
    select() {
      return this;
    },
    single() {
      return Promise.resolve({
        data: state.inserts[0] || null,
        error: databaseError,
      });
    },
  };

  const source = fs.readFileSync(endpointPath, "utf8")
    .replace(/^import .*;\s*$/gm, "")
    .replace("export default async function handler", "async function handler");

  const { handler } = vm.runInNewContext(
    `${source}\n({ handler });`,
    {
      getAuth: () => ({ userId }),
      assertAccountNotDeleting: async () => true,
      supabase: {
        from(table) {
          state.fromCalls += 1;
          assert.equal(table, "generations");
          return query;
        },
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

async function invoke(harness, body, method = "POST") {
  const response = createResponse();
  await harness.handler({ method, body }, response);
  return response;
}

test("unauthenticated history saves are rejected before Supabase access", async () => {
  for (const recordType of ["generate_reel", "blueprint"]) {
    const harness = createHarness({ userId: null });
    const response = await invoke(harness, { recordType });

    assert.equal(response.statusCode, 401);
    assert.equal(harness.state.fromCalls, 0);
    assert.equal(harness.state.insertCalls, 0);
  }
});

test("missing, non-object, and array request bodies return 400 before Supabase access", async () => {
  for (const body of [undefined, null, "invalid", 42, [], ["blueprint"]]) {
    const harness = createHarness();
    const response = await invoke(harness, body);

    assert.equal(response.statusCode, 400);
    assert.equal(harness.state.fromCalls, 0);
    assert.equal(harness.state.insertCalls, 0);
  }
});

test("standard history ignores forged owner IDs and preserves its mapped fields", async () => {
  const harness = createHarness({ userId: "clerk_owner" });
  const fullPackage = {
    type: "generate_reel",
    schema_version: 1,
    result: { concept: "A saved concept" },
  };
  const response = await invoke(harness, {
    recordType: "generate_reel",
    userId: "attacker_user",
    user_id: "attacker_user",
    id: 9876,
    title: "Artist — Track",
    prompt: "Source prompt",
    reelConcept: "Reel idea",
    directorMode: "Poetic Documentary",
    styleDNA: "Soft Grain",
    era: "Timeless",
    reelPurpose: "Music Video Concept Seed",
    videoUrl: "https://example.invalid/video",
    artist: "Artist",
    track: "Track",
    genre: "Soul",
    bpm: 94,
    mood: "Tense",
    style: "Soft Grain Cinema",
    camera: "Poetic Documentary",
    fullPackage,
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(harness.state.insertCalls, 1);
  assert.equal(harness.state.upsertCalls, 0);
  assert.deepEqual(harness.state.inserts[0], {
    user_id: "clerk_owner",
    title: "Artist — Track",
    prompt: "Source prompt",
    reel_concept: "Reel idea",
    director_mode: "Poetic Documentary",
    style_dna: "Soft Grain",
    era: "Timeless",
    reel_purpose: "Music Video Concept Seed",
    video_url: "https://example.invalid/video",
    artist: "Artist",
    track: "Track",
    genre: "Soul",
    bpm: 94,
    mood: "Tense",
    style: "Soft Grain Cinema",
    camera: "Poetic Documentary",
    full_package: fullPackage,
  });
  assert.equal("id" in harness.state.inserts[0], false);
});

test("blueprint history ignores forged owner IDs and preserves every existing blueprint field", async () => {
  const harness = createHarness({ userId: "clerk_owner" });
  const shots = [{ title: "Shot 1", description: "Visible action" }];
  const productionAssets = { format: "16:9", notes: ["Use the reference"] };
  const response = await invoke(harness, {
    recordType: "blueprint",
    userId: "attacker_user",
    user_id: "attacker_user",
    id: 9876,
    title: "Blueprint title",
    prompt: "Blueprint vision",
    director_mode: "Surreal Dream Cinema",
    shots,
    video_url: "",
    director_summary: "Director summary",
    production_assets: productionAssets,
    expanded_prompt: "Full production prompt",
    ignoredField: "must not be inserted",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(harness.state.insertCalls, 1);
  assert.equal(harness.state.upsertCalls, 0);
  assert.deepEqual(harness.state.inserts[0], {
    user_id: "clerk_owner",
    title: "Blueprint title",
    prompt: "Blueprint vision",
    director_mode: "Surreal Dream Cinema",
    shots,
    video_url: "",
    director_summary: "Director summary",
    production_assets: productionAssets,
    expanded_prompt: "Full production prompt",
  });
  assert.equal("id" in harness.state.inserts[0], false);
  assert.equal("ignoredField" in harness.state.inserts[0], false);
});

test("unknown history record types return 400 without inserting", async () => {
  const harness = createHarness();
  const response = await invoke(harness, { recordType: "unknown" });

  assert.equal(response.statusCode, 400);
  assert.equal(harness.state.fromCalls, 0);
  assert.equal(harness.state.insertCalls, 0);
});

test("database failures return a generic error and do not expose database details", async () => {
  const harness = createHarness({
    databaseError: { message: "private database detail" },
  });
  const response = await invoke(harness, {
    recordType: "blueprint",
    title: "Private blueprint title",
  });
  const captured = JSON.stringify({
    body: response.body,
    logs: harness.state.logs,
  });

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, "Failed to save generation");
  assert.doesNotMatch(captured, /private database detail|Private blueprint title/);
  assert.deepEqual(harness.state.logs, [["SAVE_HISTORY_DATABASE_ERROR"]]);
});

test("Blueprint save uses the authenticated server endpoint and retains its UI success path", () => {
  const source = fs.readFileSync(videosPath, "utf8");
  const start = source.indexOf("async function handleSaveToHistory()");
  const end = source.indexOf("\nfunction generateShotSequence", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handlerSource = source.slice(start, end);

  assert.match(handlerSource, /fetch\("\/api\/save-history"/);
  assert.match(handlerSource, /recordType:\s*"blueprint"/);
  assert.match(handlerSource, /shots:\s*generatedShots/);
  assert.match(handlerSource, /director_summary:\s*directorSummary/);
  assert.match(handlerSource, /production_assets:\s*productionAssets/);
  assert.match(handlerSource, /expanded_prompt:\s*expandedPrompt/);
  assert.match(handlerSource, /setSaved\(true\)/);
  assert.match(handlerSource, /setSaving\(false\)/);
  assert.doesNotMatch(handlerSource, /user_id\s*:/);
  assert.doesNotMatch(handlerSource, /\.from\(["']generations["']\)\s*\.insert/);
  assert.doesNotMatch(source, /import\s+\{\s*supabase\s*\}\s+from\s+["']\.\.\/lib\/supabaseClient["']/);
});

test("A01 authenticated owner-filtered delete endpoint remains present", () => {
  const source = fs.readFileSync(deleteEndpointPath, "utf8");

  assert.match(source, /getAuth\(req\)/);
  assert.match(source, /\.eq\(["']user_id["'],\s*userId\)/);
  assert.match(source, /\.delete\(\)/);
});
