/**
 * In-memory TTL Cache with Stale-While-Revalidate support.
 * Keeps entries past TTL for graceful fallback during upstream outages.
 */
class ResilientCache {
  constructor(options = {}) {
    this.defaultTtlMs = options.defaultTtlMs || 5 * 60 * 1000; // 5 min fresh
    this.maxStaleMs = options.maxStaleMs || 24 * 60 * 60 * 1000; // 24 hours stale
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.storedAt;
    if (age <= this.defaultTtlMs) {
      return { value: entry.value, stale: false, age };
    }

    if (age <= this.maxStaleMs) {
      return { value: entry.value, stale: true, age };
    }

    this.store.delete(key);
    return null;
  }

  getFresh(key) {
    const res = this.get(key);
    if (res && !res.stale) return res.value;
    return null;
  }

  getStale(key) {
    const res = this.get(key);
    if (res) return res.value;
    return null;
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      storedAt: Date.now(),
      ttlMs: ttlMs || this.defaultTtlMs,
    });
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

module.exports = { ResilientCache };
