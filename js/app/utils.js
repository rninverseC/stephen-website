export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage write failures in constrained environments
  }
}

export function normalizeGuestbookEntry(entry) {
  return {
    id: entry.id ?? null,
    name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim().slice(0, 30) : "Anonymous",
    message: typeof entry.message === "string" ? entry.message.trim().slice(0, 180) : "",
    timestamp: typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString()
  };
}
