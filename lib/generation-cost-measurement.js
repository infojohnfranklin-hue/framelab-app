const { randomUUID } = require("node:crypto");

const ALLOWED_GENERATOR_TYPES = new Set(["main_generator", "blueprint"]);
const ALLOWED_FAILURE_CODES = new Set(["ECONNABORTED", "ECONNRESET", "ETIMEDOUT"]);
const PRICE_SCHEDULE_ID = "openai-standard-usd-2026-11-01";
const PRICE_SCHEDULE_DATE = "2026-11-01";
const USD_PER_MILLION_TOKENS = Object.freeze({
  "gpt-4.1-mini": Object.freeze({ input: 0.4, cachedInput: 0.1, output: 1.6 }),
  "gpt-4.1-mini-2025-04-14": Object.freeze({ input: 0.4, cachedInput: 0.1, output: 1.6 }),
  "gpt-5.4-mini-2026-03-17": Object.freeze({ input: 0.75, cachedInput: 0.075, output: 4.5 }),
  "gpt-6.1-sol": Object.freeze({ input: 2, cachedInput: 0.1, output: 10 }),
  "gpt-6-luna": Object.freeze({ input: 0.1, cachedInput: 0.01, output: 0.5 }),
});

function readTokenCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function classifyFailure(error) {
  if (ALLOWED_FAILURE_CODES.has(error?.code)) return "network_or_timeout";
  if (Number.isInteger(error?.status)) {
    if (error.status === 408) return "provider_timeout";
    if (error.status >= 500) return "provider_server_error";
    return "provider_http_error";
  }
  return "provider_error";
}

function emitSafely(context, record) {
  try {
    if (typeof context?.logger !== "function") return false;
    if (typeof context?.generationId !== "string") return false;
    context.logger(JSON.stringify({
      event: "provider_call_measurement",
      logicalGenerationId: context.generationId,
      generatorType: context.generatorType,
      ...record,
    }));
    return true;
  } catch {
    // Measurement logging must never change provider-call behavior.
    return false;
  }
}

function markMeasurementIncomplete(context) {
  try {
    context.measurementIntegrity = "incomplete";
  } catch {
    // The provider result remains authoritative even if instrumentation state is damaged.
  }
}

function normalizeUsage(usage) {
  const inputRaw = usage?.prompt_tokens;
  const cachedRaw = usage?.prompt_tokens_details?.cached_tokens;
  const outputRaw = usage?.completion_tokens;
  const inputTokens = readTokenCount(inputRaw);
  const cachedInputTokens = readTokenCount(cachedRaw);
  const outputTokens = readTokenCount(outputRaw);
  const rawFields = [inputRaw, cachedRaw, outputRaw];
  const values = [inputTokens, cachedInputTokens, outputTokens];
  const hasAny = rawFields.some((value) => value !== undefined && value !== null);
  const invalid = rawFields.some((value, index) =>
    value !== undefined && value !== null && values[index] === null
  );
  const complete = values.every((value) => value !== null);
  let usageStatus = "unavailable";
  if (invalid) usageStatus = "provider_reported_invalid";
  else if (complete) usageStatus = "provider_reported_complete";
  else if (hasAny) usageStatus = "provider_reported_partial";

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    usageStatus,
    valid: !invalid && complete && cachedInputTokens <= inputTokens,
    hasAny,
  };
}

function estimateCallCostUsd(model, usage) {
  const rates = USD_PER_MILLION_TOKENS[model];
  if (!rates) return { value: null, status: "unknown_model_price" };
  const normalized = normalizeUsage(usage);
  if (!normalized.valid) {
    return {
      value: null,
      status: normalized.usageStatus === "provider_reported_invalid" ||
        (normalized.cachedInputTokens !== null && normalized.inputTokens !== null &&
          normalized.cachedInputTokens > normalized.inputTokens)
        ? "unknown_invalid_usage"
        : "unknown_incomplete_usage",
    };
  }
  const uncachedInputTokens = normalized.inputTokens - normalized.cachedInputTokens;
  const usd = (
    uncachedInputTokens * rates.input +
    normalized.cachedInputTokens * rates.cachedInput +
    normalized.outputTokens * rates.output
  ) / 1_000_000;
  return { value: Number(usd.toFixed(12)), status: "estimated_from_provider_usage" };
}

function addKnownUsage(context, usage) {
  const normalized = normalizeUsage(usage);
  const totals = context.knownUsageTotals;
  if (normalized.hasAny) {
    totals.callsWithAnyUsage += 1;
    if (normalized.usageStatus !== "provider_reported_complete" || !normalized.valid) {
      totals.callsWithMissingOrInvalidUsageFields += 1;
    }
    if (normalized.inputTokens !== null) totals.inputTokens += normalized.inputTokens;
    if (normalized.cachedInputTokens !== null) totals.cachedInputTokens += normalized.cachedInputTokens;
    if (normalized.outputTokens !== null) totals.outputTokens += normalized.outputTokens;
  } else {
    totals.callsWithUnknownUsage += 1;
  }
  return normalized;
}

function readErrorUsage(error) {
  return error?.usage || error?.response?.usage || error?.response?.data?.usage ||
    error?.response?.body?.usage || error?.error?.usage || null;
}

function knownSubtotalUsd(context) {
  const known = context.providerCalls
    .map((call) => call.estimatedCostUsd)
    .filter((value) => value !== null);
  return Number(known.reduce((sum, value) => sum + value, 0).toFixed(12));
}

function completeTotalUsd(context) {
  if (context.measurementIntegrity !== "complete" ||
      context.providerCalls.length !== context.providerInvocationCount ||
      !context.providerCalls.length ||
      context.providerCalls.some((call) => call.estimatedCostUsd === null)) return null;
  return knownSubtotalUsd(context);
}

function recordProviderCall(context, record, usage, model) {
  try {
    const usageFields = addKnownUsage(context, usage);
    const cost = estimateCallCostUsd(model, usage);
    context.providerCalls.push({ estimatedCostUsd: cost.value });
    if (cost.value === null) context.knownUsageTotals.callsWithUnknownCost += 1;
    const completeTotal = completeTotalUsd(context);
    const emitted = emitSafely(context, {
      ...record,
      model,
      priceScheduleId: PRICE_SCHEDULE_ID,
      priceScheduleDate: PRICE_SCHEDULE_DATE,
      currency: "USD",
      costBasis: "estimated_provider_token_cost_not_invoice",
      inputTokens: usageFields.inputTokens,
      cachedInputTokens: usageFields.cachedInputTokens,
      outputTokens: usageFields.outputTokens,
      usageStatus: usageFields.usageStatus,
      estimatedCostUsd: cost.value,
      costEstimateStatus: cost.status,
      knownSubtotalUsd: knownSubtotalUsd(context),
      completeCostTotalUsd: completeTotal,
      costTotalStatus: completeTotal !== null
        ? "estimated_complete"
        : context.measurementIntegrity === "incomplete"
          ? "unknown_incomplete_measurement"
          : "unknown_incomplete_call_cost",
      knownUsageTotals: { ...context.knownUsageTotals },
    });
    if (!emitted) markMeasurementIncomplete(context);
  } catch (error) {
    markMeasurementIncomplete(context);
    throw error;
  }
}

function createGenerationCostMeasurementContext(
  generatorType,
  logger,
  reserveProviderAttempt
) {
  if (!ALLOWED_GENERATOR_TYPES.has(generatorType)) {
    throw new TypeError("Unsupported generator type");
  }
  let generationId = null;
  try {
    generationId = randomUUID();
  } catch {
    // Calls still proceed without measurement if UUID creation fails.
  }
  return {
    generationId,
    generatorType,
    reserveProviderAttempt:
      typeof reserveProviderAttempt === "function"
        ? reserveProviderAttempt
        : null,
    nextCallIndex: 0,
    providerCalls: [],
    providerInvocationCount: 0,
    measurementIntegrity: "complete",
    finalized: false,
    knownUsageTotals: {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      callsWithAnyUsage: 0,
      callsWithMissingOrInvalidUsageFields: 0,
      callsWithUnknownUsage: 0,
      callsWithUnknownCost: 0,
    },
    logger: typeof logger === "function"
      ? logger
      : (line) => console.info("PREMIVATE_COST_MEASUREMENT", line),
  };
}

async function measureOpenAICall(context, {
  stage,
  model,
  imageReferencePresent = false,
  retryConfiguration = "sdk_default_unoverridden",
  configuredMaxRetries = null,
}, invoke) {
  let callIndex = null;
  try {
    context.nextCallIndex += 1;
    callIndex = context.nextCallIndex;
  } catch {
    // If measurement state is damaged, still make the original call once.
  }

  const safeMetadata = {
    stage,
    model,
    callIndex,
    imageReferencePresent: Boolean(imageReferencePresent),
    retryConfiguration,
    configuredMaxRetries: Number.isInteger(configuredMaxRetries) &&
      configuredMaxRetries >= 0 ? configuredMaxRetries : null,
  };

  if (typeof context?.reserveProviderAttempt !== "function") {
    const error = new Error("Provider attempt guard unavailable");
    error.code = "PROVIDER_ATTEMPT_GUARD_UNAVAILABLE";
    throw error;
  }

  await context.reserveProviderAttempt();

  try {
    if (!Number.isSafeInteger(context.providerInvocationCount) ||
        context.providerInvocationCount < 0) {
      throw new TypeError("Invalid provider invocation counter");
    }
    context.providerInvocationCount += 1;
  } catch {
    markMeasurementIncomplete(context);
  }

  let response;
  try {
    response = await invoke();
  } catch (error) {
    try {
      const usage = readErrorUsage(error);
      const modelUsed = error?.response?.model || error?.response?.data?.model || model;
      recordProviderCall(context, {
        ...safeMetadata,
        status: "error",
        failureClass: classifyFailure(error),
        actualHttpAttempts: null,
        modelSource: modelUsed === model ? "request_configuration" : "provider_error_response",
      }, usage, modelUsed);
    } catch {
      // Preserve the original provider error.
    }
    throw error;
  }

  try {
    const modelUsed = response?.model || model;
    recordProviderCall(context, {
      ...safeMetadata,
      status: "success",
      failureClass: null,
      actualHttpAttempts: configuredMaxRetries === 0 ? 1 : null,
      modelSource: response?.model ? "provider_response" : "request_configuration",
    }, response?.usage, modelUsed);
  } catch {
    // Instrumentation failure cannot discard a successful response.
  }
  return response;
}

function finalizeGenerationCostMeasurement(context, outcome) {
  try {
    if (!context || context.finalized ||
        (!context.providerInvocationCount && !context.providerCalls.length)) return;
    context.finalized = true;
    const validOutcome = ["success", "error", "unknown"].includes(outcome)
      ? outcome
      : "unknown";
    const total = completeTotalUsd(context);
    const totalCostStatus = total !== null
      ? "estimated_complete"
      : context.measurementIntegrity === "incomplete" ||
        context.providerCalls.length !== context.providerInvocationCount
          ? "unknown_incomplete_measurement"
          : "unknown_incomplete_call_cost";
    emitSafely(context, {
      event: "generation_cost_summary",
      outcome: validOutcome,
      providerCallCount: context.providerInvocationCount,
      recordedProviderCallCount: context.providerCalls.length,
      measurementIntegrity: context.measurementIntegrity,
      priceScheduleId: PRICE_SCHEDULE_ID,
      priceScheduleDate: PRICE_SCHEDULE_DATE,
      currency: "USD",
      costBasis: "estimated_provider_token_cost_not_invoice",
      knownSubtotalUsd: knownSubtotalUsd(context),
      estimatedTotalCostUsd: total,
      totalCostStatus,
      knownUsageTotals: { ...context.knownUsageTotals },
    });
  } catch {
    // Measurement must never change the route response.
  }
}

module.exports = {
  createGenerationCostMeasurementContext,
  measureOpenAICall,
  finalizeGenerationCostMeasurement,
};
