const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const parser = require("@babel/parser");

const {
  createGenerationCostMeasurementContext,
  measureOpenAICall,
} = require("../lib/generation-cost-measurement");

const repoRoot = path.resolve(__dirname, "..");

function loadCreditsWithMock({ env = {}, evalImpl = async () => 1 } = {}) {
  let attemptNumber = 0;
  const source = fs.readFileSync(
    path.join(repoRoot, "lib/credits.js"),
    "utf8"
  );
  const transformed = source
    .replace(
      /^import \{ Redis \} from "@upstash\/redis";$/m,
      'const { Redis } = require("@upstash/redis");'
    )
    .replace(
      /^import \{ randomUUID \} from "node:crypto";$/m,
      'const { randomUUID } = require("node:crypto");'
    )
    .replace(/^export\s+/gm, "")
    .concat("\nmodule.exports = { reserveGlobalProviderAttempt };");
  const module = { exports: {} };
  const fakeRequire = (specifier) => {
    if (specifier === "@upstash/redis") {
      return {
        Redis: class {
          constructor() {
            return { eval: evalImpl };
          }
        },
      };
    }
    if (specifier === "node:crypto") {
      return {
        randomUUID: () => `offline-attempt-${++attemptNumber}`,
      };
    }
    throw new Error(`Unexpected test require: ${specifier}`);
  };

  vm.runInNewContext(
    transformed,
    {
      require: fakeRequire,
      module,
      process: { env },
      Date,
      Number,
      String,
      Error,
      console: { error() {} },
    },
    { timeout: 1000 }
  );

  return module.exports;
}

const redisEnv = {
  UPSTASH_REDIS_REST_URL: "https://offline.invalid",
  UPSTASH_REDIS_REST_TOKEN: "offline-placeholder",
  PREMIVATE_PROVIDER_ATTEMPT_LIMIT: "3",
  PREMIVATE_PROVIDER_ATTEMPT_WINDOW_SECONDS: "60",
};

const expectedCallArgumentHashes = {
  "pages/api/generate.js": [
    "96209e1ba2a17baa38ab3671123471a09a58445d0dbc241ed9465caf00f5c2ca",
    "4e46bc002a3ff1c9c60f5a1cfa0d25374bbdd00be40992656aeb13ad1ef9e560",
    "6b80adb6f76d1ec2aec4888e612f4009e92f0ab4f1adfc77a46ff6abc2b70d71",
    "f8cddbccd57be3fa11c45920363337b450291a62e13e66541d7bafa249377198",
    "4a3ba96b8f7f8af9ff7c8120711d562b499bfc9e3a11de1a572833b39de443f5",
  ],
  "pages/api/generate-blueprint.js": [
    "832a784921d42f25a04fae76a1f18e39375de42ebebfc63d6535eb0756e5b697",
  ],
};

function isOpenAICompletionCall(node) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    node.callee.property?.name === "create" &&
    node.callee.object?.type === "MemberExpression" &&
    node.callee.object.property?.name === "completions"
  );
}

function isMeasurementCall(node) {
  return (
    node?.type === "CallExpression" &&
    node.callee?.type === "Identifier" &&
    node.callee.name === "measureOpenAICall"
  );
}

function collectCalls(filePath) {
  const source = fs.readFileSync(path.join(repoRoot, filePath), "utf8");
  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx"],
  });
  const calls = [];

  function visit(node, ancestors) {
    if (!node || typeof node !== "object") return;

    if (isOpenAICompletionCall(node)) {
      const argumentSource = node.arguments
        .map((argument) => source.slice(argument.start, argument.end))
        .join("\n---ARG---\n");
      const wrapped = ancestors.some(isMeasurementCall);

      calls.push({
        line: node.loc.start.line,
        wrapped,
        argumentHash: crypto
          .createHash("sha256")
          .update(argumentSource)
          .digest("hex"),
      });
    }

    const nextAncestors = [...ancestors, node];
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((child) => visit(child, nextAncestors));
      } else if (value && typeof value === "object") {
        visit(value, nextAncestors);
      }
    }
  }

  visit(ast, []);
  return calls;
}

function createContext(generatorType = "main_generator") {
  const records = [];
  const context = createGenerationCostMeasurementContext(
    generatorType,
    (line) => records.push(JSON.parse(line)),
    async () => ({ status: "RESERVED" })
  );
  return { context, records };
}

test("all six existing OpenAI calls are wrapped and keep identical request arguments", () => {
  for (const [filePath, expectedHashes] of Object.entries(
    expectedCallArgumentHashes
  )) {
    const calls = collectCalls(filePath);

    assert.equal(calls.length, expectedHashes.length, filePath);
    assert.deepEqual(
      calls.map((call) => call.argumentHash),
      expectedHashes,
      `${filePath}: request arguments or retry options changed`
    );
    assert.ok(
      calls.every((call) => call.wrapped),
      `${filePath}: an OpenAI call is not wrapped`
    );
  }
});

test("records complete provider token usage and leaves cost unavailable", async () => {
  const { context, records } = createContext();
  const response = {
    choices: [{ message: { content: "private output sentinel" } }],
    usage: {
      prompt_tokens: 120,
      completion_tokens: 35,
      prompt_tokens_details: { cached_tokens: 20 },
    },
  };
  let calls = 0;

  const result = await measureOpenAICall(
    context,
    {
      stage: "primary_generation",
      model: "gpt-4.1-mini",
      imageReferencePresent: false,
      retryConfiguration: "sdk_default_unoverridden",
    },
    async () => {
      calls += 1;
      return response;
    }
  );

  assert.equal(result, response);
  assert.equal(calls, 1);
  assert.equal(records.length, 1);
  assert.equal(records[0].status, "success");
  assert.equal(records[0].inputTokens, 120);
  assert.equal(records[0].cachedInputTokens, 20);
  assert.equal(records[0].outputTokens, 35);
  assert.equal(records[0].usageStatus, "provider_reported_complete");
  assert.equal(records[0].estimatedCostUsd, null);
  assert.equal(records[0].knownCostTotalUsd, null);
  assert.match(records[0].logicalGenerationId, /^[0-9a-f-]{36}$/i);
  assert.equal(
    JSON.stringify(records).includes("private output sentinel"),
    false
  );
});

test("retains partial usage and marks missing usage fields", async () => {
  const { context, records } = createContext();

  await measureOpenAICall(
    context,
    {
      stage: "blueprint_generation",
      model: "gpt-6-luna",
      imageReferencePresent: true,
      retryConfiguration: "maxRetries_zero",
      configuredMaxRetries: 0,
    },
    async () => ({
      usage: {
        prompt_tokens: 54,
        prompt_tokens_details: { cached_tokens: 6 },
      },
    })
  );

  assert.equal(records[0].inputTokens, 54);
  assert.equal(records[0].cachedInputTokens, 6);
  assert.equal(records[0].outputTokens, null);
  assert.equal(records[0].usageStatus, "provider_reported_partial");
  assert.equal(records[0].actualHttpAttempts, 1);
  assert.equal(records[0].imageReferencePresent, true);
  assert.equal(records[0].estimatedCostUsd, null);
});

test("missing usage and failed calls are unknown, never reported as zero cost", async () => {
  const { context, records } = createContext();

  await measureOpenAICall(
    context,
    {
      stage: "primary_generation",
      model: "gpt-4.1-mini",
    },
    async () => ({ choices: [] })
  );

  assert.equal(records[0].usageStatus, "unavailable");
  assert.equal(records[0].estimatedCostUsd, null);
  assert.equal(records[0].knownCostTotalUsd, null);

  const failure = Object.assign(
    new Error("prompt, output and secret sentinel"),
    { status: 502, code: "ETIMEDOUT" }
  );
  let calls = 0;

  await assert.rejects(
    measureOpenAICall(
      context,
      {
        stage: "semantic_repair",
        model: "gpt-5.4-mini-2026-03-17",
      },
      async () => {
        calls += 1;
        throw failure;
      }
    ),
    (error) => error === failure
  );

  assert.equal(calls, 1);
  assert.equal(records.length, 2);
  assert.equal(records[1].status, "error");
  assert.equal(records[1].failureClass, "network_or_timeout");
  assert.equal(records[1].actualHttpAttempts, null);
  assert.equal(records[1].usageStatus, "unknown");
  assert.equal(records[1].estimatedCostUsd, null);
  assert.equal(records[1].knownCostTotalUsd, null);

  const serialized = JSON.stringify(records);
  assert.equal(serialized.includes("sentinel"), false);
  assert.equal(serialized.includes(failure.message), false);
});

test("logging errors do not repeat calls or replace provider results/errors", async () => {
  const context = createGenerationCostMeasurementContext(
    "blueprint",
    () => {
      throw new Error("logger failure sentinel");
    },
    async () => ({ status: "RESERVED" })
  );
  const response = { usage: { prompt_tokens: 2, completion_tokens: 1 } };
  let successCalls = 0;

  const result = await measureOpenAICall(
    context,
    {
      stage: "blueprint_generation",
      model: "gpt-6-luna",
      configuredMaxRetries: 0,
    },
    async () => {
      successCalls += 1;
      return response;
    }
  );

  assert.equal(result, response);
  assert.equal(successCalls, 1);

  const failure = new Error("provider failure");
  let failureCalls = 0;

  await assert.rejects(
    measureOpenAICall(
      context,
      {
        stage: "blueprint_generation",
        model: "gpt-6-luna",
        configuredMaxRetries: 0,
      },
      async () => {
        failureCalls += 1;
        throw failure;
      }
    ),
    (error) => error === failure
  );

  assert.equal(failureCalls, 1);
});

test("rejects unknown generator types", () => {
  assert.throws(
    () => createGenerationCostMeasurementContext("unknown"),
    /Unsupported generator type/
  );
});

test("provider guard rejects missing and invalid configuration before Redis eval", async () => {
  let evalCalls = 0;
  const missing = loadCreditsWithMock({
    env: {
      UPSTASH_REDIS_REST_URL: redisEnv.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: redisEnv.UPSTASH_REDIS_REST_TOKEN,
    },
    evalImpl: async () => {
      evalCalls += 1;
      return 1;
    },
  });

  await assert.rejects(
    missing.reserveGlobalProviderAttempt(),
    { code: "PROVIDER_ATTEMPT_GUARD_CONFIG_INVALID" }
  );
  assert.equal(evalCalls, 0);

  for (const [key, value] of [
    ["PREMIVATE_PROVIDER_ATTEMPT_LIMIT", "0"],
    ["PREMIVATE_PROVIDER_ATTEMPT_LIMIT", "1.5"],
    ["PREMIVATE_PROVIDER_ATTEMPT_WINDOW_SECONDS", "-1"],
    ["PREMIVATE_PROVIDER_ATTEMPT_WINDOW_SECONDS", "9007199254740991"],
  ]) {
    const env = { ...redisEnv, [key]: value };
    const credits = loadCreditsWithMock({
      env,
      evalImpl: async () => {
        evalCalls += 1;
        return 1;
      },
    });

    await assert.rejects(
      credits.reserveGlobalProviderAttempt(),
      { code: "PROVIDER_ATTEMPT_GUARD_CONFIG_INVALID" }
    );
  }

  assert.equal(evalCalls, 0);
});

test("provider guard fails closed when Redis is absent", async () => {
  const credits = loadCreditsWithMock({
    env: {
      PREMIVATE_PROVIDER_ATTEMPT_LIMIT: "3",
      PREMIVATE_PROVIDER_ATTEMPT_WINDOW_SECONDS: "60",
    },
  });

  await assert.rejects(
    credits.reserveGlobalProviderAttempt(),
    { code: "CREDIT_STORE_UNAVAILABLE" }
  );
});

test("provider guard propagates the original Redis eval error", async () => {
  const failure = new Error("offline eval failure");
  const credits = loadCreditsWithMock({
    env: redisEnv,
    evalImpl: async () => {
      throw failure;
    },
  });

  await assert.rejects(
    credits.reserveGlobalProviderAttempt(),
    (error) => error === failure
  );
});

test("provider guard maps numeric Lua statuses and rejects string success", async () => {
  for (const [result, code] of [
    [0, "PROVIDER_ATTEMPT_LIMIT_REACHED"],
    [-1, "PROVIDER_ATTEMPT_RESERVATION_FAILED"],
    [-2, "PROVIDER_ATTEMPT_TTL_FAILED"],
    [99, "PROVIDER_ATTEMPT_GUARD_UNEXPECTED_RESULT"],
    ["1", "PROVIDER_ATTEMPT_GUARD_UNEXPECTED_RESULT"],
  ]) {
    const credits = loadCreditsWithMock({
      env: redisEnv,
      evalImpl: async () => result,
    });

    await assert.rejects(
      credits.reserveGlobalProviderAttempt(),
      { code }
    );
  }

  const credits = loadCreditsWithMock({
    env: redisEnv,
    evalImpl: async () => 1,
  });

  await assert.doesNotReject(credits.reserveGlobalProviderAttempt());
});

test("provider guard passes the production ARGV order and Lua commands", async () => {
  let captured;
  const credits = loadCreditsWithMock({
    env: redisEnv,
    evalImpl: async (script, keys, args) => {
      captured = { script, keys, args };
      return 1;
    },
  });

  await credits.reserveGlobalProviderAttempt();

  assert.equal(captured.keys.length, 1);
  assert.equal(captured.keys[0], "premivate:provider-attempt-guard");
  assert.equal(captured.args.length, 5);
  assert.match(captured.args[0], /^\d+$/);
  assert.equal(captured.args[1], "60000");
  assert.equal(captured.args[2], "3");
  assert.equal(captured.args[3], "offline-attempt-1");
  assert.equal(captured.args[4], "60");
  for (const command of [
    "ZREMRANGEBYSCORE",
    "ZCARD",
    "ZADD",
    "NX",
    "EXPIRE",
    "ZREM",
  ]) {
    assert.ok(captured.script.includes(command), command);
  }
});

test("parallel mocked reservations do not exceed the shared limit", async () => {
  const entries = new Map();
  const now = Date.now();
  const limit = 7;
  const env = {
    ...redisEnv,
    PREMIVATE_PROVIDER_ATTEMPT_LIMIT: String(limit),
  };
  const credits = loadCreditsWithMock({
    env,
    evalImpl: async (_script, _keys, args) => {
      const nowMs = Number(args[0]);
      const windowMs = Number(args[1]);
      const requestLimit = Number(args[2]);

      for (const [attemptId, score] of entries) {
        if (score <= nowMs - windowMs) entries.delete(attemptId);
      }
      if (entries.size >= requestLimit) return 0;
      entries.set(args[3], now);
      return 1;
    },
  });

  const results = await Promise.allSettled(
    Array.from({ length: 25 }, () =>
      credits.reserveGlobalProviderAttempt()
    )
  );

  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    limit
  );
  assert.equal(
    results.filter((result) => result.status === "rejected").length,
    25 - limit
  );
});

test("measurement guard must reserve before invoking the provider", async () => {
  const metadata = {
    stage: "primary_generation",
    model: "gpt-4.1-mini",
  };
  let invokeCalls = 0;

  const missingGuard = createGenerationCostMeasurementContext(
    "main_generator",
    () => {}
  );
  await assert.rejects(
    measureOpenAICall(missingGuard, metadata, async () => {
      invokeCalls += 1;
      return {};
    }),
    { code: "PROVIDER_ATTEMPT_GUARD_UNAVAILABLE" }
  );
  assert.equal(invokeCalls, 0);

  const guardFailure = new Error("guard failed");
  const failingGuard = createGenerationCostMeasurementContext(
    "main_generator",
    () => {},
    async () => {
      throw guardFailure;
    }
  );
  await assert.rejects(
    measureOpenAICall(failingGuard, metadata, async () => {
      invokeCalls += 1;
      return {};
    }),
    (error) => error === guardFailure
  );
  assert.equal(invokeCalls, 0);

  let reserveCalls = 0;
  const successfulGuard = createGenerationCostMeasurementContext(
    "main_generator",
    () => {},
    async () => {
      reserveCalls += 1;
      return { status: "RESERVED" };
    }
  );
  const response = { choices: [] };
  const result = await measureOpenAICall(
    successfulGuard,
    metadata,
    async () => {
      invokeCalls += 1;
      return response;
    }
  );

  assert.equal(result, response);
  assert.equal(reserveCalls, 1);
  assert.equal(invokeCalls, 1);
});

test("provider failure after reservation does not release the reservation", async () => {
  let reserveCalls = 0;
  const providerFailure = new Error("provider failure");
  const context = createGenerationCostMeasurementContext(
    "main_generator",
    () => {},
    async () => {
      reserveCalls += 1;
      return { status: "RESERVED" };
    }
  );

  await assert.rejects(
    measureOpenAICall(
      context,
      { stage: "primary_generation", model: "gpt-4.1-mini" },
      async () => {
        throw providerFailure;
      }
    ),
    (error) => error === providerFailure
  );

  assert.equal(reserveCalls, 1);
});

test("routes statically bind the global guard and disable main SDK retries", () => {
  const main = fs.readFileSync(
    path.join(repoRoot, "pages/api/generate.js"),
    "utf8"
  );
  const blueprint = fs.readFileSync(
    path.join(repoRoot, "pages/api/generate-blueprint.js"),
    "utf8"
  );

  assert.match(main, /reserveGlobalProviderAttempt,/);
  assert.match(
    main,
    /createGenerationCostMeasurementContext\(\s*"main_generator",\s*undefined,\s*reserveGlobalProviderAttempt\s*\)/
  );
  assert.match(
    main,
    /new OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY,\s*maxRetries:\s*0,/
  );
  assert.equal(
    (main.match(/retryConfiguration: "sdk_default_unoverridden"/g) || [])
      .length,
    0
  );
  assert.equal(
    (main.match(/configuredMaxRetries: 0/g) || []).length,
    5
  );

  assert.match(blueprint, /reserveGlobalProviderAttempt/);
  assert.match(
    blueprint,
    /createGenerationCostMeasurementContext\(\s*"blueprint",\s*undefined,\s*reserveGlobalProviderAttempt\s*\)/
  );
  assert.match(
    blueprint,
    /new OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY,\s*maxRetries:\s*0/
  );
});
