/**
 * Cache en memoria (proceso único). Para Redis distribuido, reemplazar por cliente REDIS_URL.
 */
const memory = new Map();

export async function cacheGet(key) {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.exp < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.val;
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  memory.set(key, { val: value, exp: Date.now() + ttlSeconds * 1000 });
}

export async function cacheIncr(key, ttlSeconds = 86400) {
  const cur = parseInt((await cacheGet(key)) || "0", 10) + 1;
  await cacheSet(key, String(cur), ttlSeconds);
  return cur;
}
