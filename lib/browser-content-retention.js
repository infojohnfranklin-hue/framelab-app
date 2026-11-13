const REOPEN_GENERATION_KEY = "reopenGeneration";
const ACTIVE_PROJECT_KEY = "framelabActiveProject";
const ACTIVE_PROJECT_STORED_AT_KEY = "framelabActiveProjectStoredAt";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CONTENT_KEYS_TO_CLEAR = [
  "framelab_history",
  REOPEN_GENERATION_KEY,
  "framelabActivePrompt",
  "activePrompt",
  "reopenPrompt",
  "reopenMode",
  "reopenImage",
  ACTIVE_PROJECT_KEY,
  ACTIVE_PROJECT_STORED_AT_KEY,
  "framelabActiveDirector",
];

function removeQuietly(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function isFresh(item, now = Date.now()) {
  const savedAt = item?._premivateStoredAt;
  return Number.isFinite(savedAt) && savedAt <= now && now - savedAt < MAX_AGE_MS;
}

export function storeReopenGeneration(item) {
  localStorage.setItem(
    REOPEN_GENERATION_KEY,
    JSON.stringify({ ...item, _premivateStoredAt: Date.now() })
  );
}

export function readFreshReopenGeneration(now = Date.now()) {
  let raw;
  try {
    raw = localStorage.getItem(REOPEN_GENERATION_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const item = JSON.parse(raw);
    if (!isFresh(item, now)) {
      removeQuietly(REOPEN_GENERATION_KEY);
      return null;
    }
    return item;
  } catch {
    removeQuietly(REOPEN_GENERATION_KEY);
    return null;
  }
}

export function storeActiveProject(value) {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, String(value));
    localStorage.setItem(ACTIVE_PROJECT_STORED_AT_KEY, String(Date.now()));
  } catch {
    removeQuietly(ACTIVE_PROJECT_KEY);
    removeQuietly(ACTIVE_PROJECT_STORED_AT_KEY);
  }
}

export function readFreshActiveProject(now = Date.now()) {
  let value;
  let rawSavedAt;
  try {
    value = localStorage.getItem(ACTIVE_PROJECT_KEY);
    rawSavedAt = localStorage.getItem(ACTIVE_PROJECT_STORED_AT_KEY);
  } catch {
    return null;
  }

  const savedAt = Number(rawSavedAt);
  if (
    !value ||
    !rawSavedAt ||
    !Number.isFinite(savedAt) ||
    savedAt > now ||
    now - savedAt >= MAX_AGE_MS
  ) {
    removeQuietly(ACTIVE_PROJECT_KEY);
    removeQuietly(ACTIVE_PROJECT_STORED_AT_KEY);
    return null;
  }
  return value;
}

export function pruneLocalContentCopies(now = Date.now()) {
  // This legacy cache has no Release-D read site; remove its un-timestamped copies.
  removeQuietly("framelab_history");
  for (const key of [
    "framelabActivePrompt",
    "activePrompt",
    "reopenPrompt",
    "reopenImage",
  ]) {
    removeQuietly(key);
  }
  readFreshReopenGeneration(now);
  readFreshActiveProject(now);
}

export function clearLocalContentCopies() {
  for (const key of CONTENT_KEYS_TO_CLEAR) {
    removeQuietly(key);
  }
}
