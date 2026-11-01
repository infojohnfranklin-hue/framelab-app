const { randomUUID } = require("node:crypto");

const ALLOWED_GENERATOR_TYPES = new Set(["main_generator", "blueprint"]);
const ALLOWED_FAILURE_CODES = new Set(["ECONNABORTED", "ECONNRESET", "ETIMEDOUT"]);

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
    if (typeof context?.logger !== "function") return;
    if (typeof context?.generationId !== "string") return;
    context.logger(JSON.stringify({
      event: "provider_call_measurement",
      logicalGenerationId: context.generationId,
      generatorType: context.generatorType,
      ...record,
    }));
  } catch {
    // Measurement logging must never change provider-call behavior.
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
    knownUsageTotals: {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      callsWithAnyUsage: 0,
      callsWithMissingUsageFields: 0,
      callsWithUnknownUsage: 0,
      callsWithUnknownCost: 0,
    },
    logger: typeof logger === "function"
      ? logger
      : (line) => console.info("PREMIVATE_COST_MEASUREMENT", line),
  };
}

function addKnownUsage(context, usage) {
  const inputTokens = readTokenCount(usage?.prompt_tokens);
  const cachedInputTokens = readTokenCount(
    usage?.prompt_tokens_details?.cached_tokens
  );
  const outputTokens = readTokenCount(usage?.completion_tokens);
  const anyUsage = inputTokens !== null ||
    cachedInputTokens !== null || outputTokens !== null;
  const allFieldsKnown = inputTokens !== null &&
    cachedInputTokens !== null && outputTokens !== null;

  if (anyUsage) {
    context.knownUsageTotals.callsWithAnyUsage += 1;
    if (!allFieldsKnown) {
      context.knownUsageTotals.callsWithMissingUsageFields += 1;
    }
    if (inputTokens !== null) {
      context.knownUsageTotals.inputTokens += inputTokens;
    }
    if (cachedInputTokens !== null) {
      context.knownUsageTotals.cachedInputTokens += cachedInputTokens;
    }
    if (outputTokens !== null) {
      context.knownUsageTotals.outputTokens += outputTokens;
    }
  } else {
    context.knownUsageTotals.callsWithUnknownUsage += 1;
  }
  context.knownUsageTotals.callsWithUnknownCost += 1;

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    usageStatus: !anyUsage ? "unavailable" :
      allFieldsKnown ? "provider_reported_complete" :
      "provider_reported_partial",
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

  let response;
  try {
    response = await invoke();
  } catch (error) {
    try {
      context.knownUsageTotals.callsWithUnknownUsage += 1;
      context.knownUsageTotals.callsWithUnknownCost += 1;
      emitSafely(context, {
        ...safeMetadata,
        status: "error",
        failureClass: classifyFailure(error),
        actualHttpAttempts: null,
        inputTokens: null,
        cachedInputTokens: null,
        outputTokens: null,
        usageStatus: "unknown",
        estimatedCostUsd: null,
        costEstimateStatus: "unavailable_no_verified_price_schedule",
        knownUsageTotals: { ...context.knownUsageTotals },
        knownCostTotalUsd: null,
      });
    } catch {
      // Preserve the original provider error.
    }
    throw error;
  }

  try {
    const usageFields = addKnownUsage(context, response?.usage);
    emitSafely(context, {
      ...safeMetadata,
      status: "success",
      failureClass: null,
      actualHttpAttempts: configuredMaxRetries === 0 ? 1 : null,
      ...usageFields,
      estimatedCostUsd: null,
      costEstimateStatus: "unavailable_no_verified_price_schedule",
      knownUsageTotals: { ...context.knownUsageTotals },
      knownCostTotalUsd: null,
    });
  } catch {
    // Instrumentation failure cannot discard a successful response.
  }
  return response;
}

module.exports = {
  createGenerationCostMeasurementContext,
  measureOpenAICall,
};
