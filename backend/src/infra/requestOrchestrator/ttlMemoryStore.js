/** Simple in-memory TTL map for HTTP response replay (single-process). */

export class TtlMemoryStore {
  constructor() {
    /** @type {Map<string, { value: unknown, expiresAt: number }>} */
    this.map = new Map();
  }

  /** @returns {unknown | null} */
  get(key) {
    const row = this.map.get(key);
    if (!row) return null;
    if (Date.now() > row.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return row.value;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @param {number} ttlMs
   */
  set(key, value, ttlMs) {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear() {
    this.map.clear();
  }
}
