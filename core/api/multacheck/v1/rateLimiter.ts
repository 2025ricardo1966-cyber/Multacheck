type RateLimitEntry = {
  timestamps: number[];
  blockedUntil: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const BLOCK_MS = 60_000;
const store = new Map<string, RateLimitEntry>();

export type RateLimitResult = Readonly<{
  allowed: boolean;
  retryAfter: number;
}>;

function cleanupOldRequests(entry: RateLimitEntry, now: number): void {
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < WINDOW_MS);
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const key = (identifier || "anonymous").slice(0, 256);
  const entry = store.get(key) ?? { timestamps: [], blockedUntil: 0 };

  cleanupOldRequests(entry, now);

  if (entry.blockedUntil > now) {
    store.set(key, entry);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000)),
    };
  }

  if (entry.timestamps.length >= MAX_REQUESTS) {
    entry.blockedUntil = now + BLOCK_MS;
    store.set(key, entry);
    return {
      allowed: false,
      retryAfter: Math.ceil(BLOCK_MS / 1000),
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    retryAfter: 0,
  };
}
