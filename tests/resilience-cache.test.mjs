import { describe, expect, it } from "vitest";
import { ResilientCache } from "../src/cache.js";

describe("ResilientCache", () => {
  it("stores and retrieves fresh items within TTL", () => {
    const cache = new ResilientCache({ defaultTtlMs: 1000, maxStaleMs: 5000 });
    cache.set("city:tbilisi", { temp: 22 });

    const fresh = cache.getFresh("city:tbilisi");
    expect(fresh).toEqual({ temp: 22 });
  });

  it("serves stale items when TTL has expired but maxStaleMs has not", async () => {
    const cache = new ResilientCache({ defaultTtlMs: 20, maxStaleMs: 500 });
    cache.set("city:batumi", { temp: 24 });

    await new Promise((r) => setTimeout(r, 30));

    // Fresh should be null
    expect(cache.getFresh("city:batumi")).toBeNull();

    // Stale should still return the value
    const stale = cache.getStale("city:batumi");
    expect(stale).toEqual({ temp: 24 });

    const entry = cache.get("city:batumi");
    expect(entry?.stale).toBe(true);
  });

  it("evicts and returns null when past maxStaleMs", async () => {
    const cache = new ResilientCache({ defaultTtlMs: 10, maxStaleMs: 30 });
    cache.set("city:kutaisi", { temp: 20 });

    await new Promise((r) => setTimeout(r, 45));

    expect(cache.getStale("city:kutaisi")).toBeNull();
    expect(cache.get("city:kutaisi")).toBeNull();
  });
});
