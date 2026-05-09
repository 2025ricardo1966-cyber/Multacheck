import Redis from "ioredis";
import crypto from "node:crypto";
import { logger } from "../config/logger.js";

/**
 * Clave estable por contenido del caso (incluye descripción normalizada para evitar colisiones).
 */
function fingerprintMulta(multaData) {
  const country = String(multaData?.country ?? "AR").trim();
  const type = String(multaData?.type ?? "").trim();
  const amount =
    multaData?.amount != null && multaData?.amount !== ""
      ? String(multaData.amount)
      : "";
  const desc = String(multaData?.description ?? "")
    .trim()
    .replace(/\s+/g, " ");
  return `${country}:${type}:${amount}:${desc}`;
}

class AnalysisCache {
  constructor() {
    const url = process.env.REDIS_URL?.trim();
    this.redis = url ? new Redis(url, { maxRetriesPerRequest: 2 }) : null;

    if (this.redis) {
      /* Sin listener, ioredis emite "Unhandled error event" si Redis no está levantado. */
      this.redis.on("error", () => {});
    }

    if (!this.redis) {
      logger.info({ context: "redis_cache", msg: "Redis disabled — no REDIS_URL" });
    }
  }

  getCacheKey(multaData) {
    const fp = fingerprintMulta(multaData);
    const hash = crypto.createHash("sha256").update(fp).digest("hex").slice(0, 40);
    return `multa:analysis:${hash}`;
  }

  async get(multaData) {
    if (!this.redis) return null;

    try {
      const key = this.getCacheKey(multaData);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.info({
          context: "redis_cache",
          msg: "CACHE_HIT",
          keyPrefix: key.slice(0, 24),
        });
        return JSON.parse(cached);
      }

      return null;
    } catch (e) {
      logger.error({
        context: "redis_cache",
        msg: "CACHE_READ_ERROR",
        error: e.message,
      });
      return null;
    }
  }

  async set(multaData, result, ttlSeconds = 86400) {
    if (!this.redis || result == null) return;

    try {
      const key = this.getCacheKey(multaData);
      await this.redis.setex(key, ttlSeconds, JSON.stringify(result));
      logger.info({
        context: "redis_cache",
        msg: "CACHE_SET",
        ttlSeconds,
        keyPrefix: key.slice(0, 24),
      });
    } catch (e) {
      logger.error({
        context: "redis_cache",
        msg: "CACHE_WRITE_ERROR",
        error: e.message,
      });
    }
  }

  async getStats() {
    if (!this.redis) {
      return { enabled: false };
    }

    try {
      const info = await this.redis.info("stats");
      const hits = info.match(/keyspace_hits:(\d+)/)?.[1] ?? "0";
      const misses = info.match(/keyspace_misses:(\d+)/)?.[1] ?? "0";
      const total = Number.parseInt(hits, 10) + Number.parseInt(misses, 10);

      return {
        enabled: true,
        hitRate:
          total > 0
            ? `${((Number.parseInt(hits, 10) / total) * 100).toFixed(1)}%`
            : "0%",
        keys: await this.redis.dbsize(),
      };
    } catch (e) {
      logger.error({
        context: "redis_cache",
        msg: "CACHE_STATS_ERROR",
        error: e.message,
      });
      return { enabled: true, error: e.message };
    }
  }
}

export const analysisCache = new AnalysisCache();
