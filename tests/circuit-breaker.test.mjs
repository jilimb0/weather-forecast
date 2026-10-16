import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "../src/circuit-breaker.js";

describe("CircuitBreaker", () => {
  it("starts in CLOSED state and executes actions successfully", async () => {
    const cb = new CircuitBreaker({ name: "TestService", failureThreshold: 3 });
    expect(cb.getState()).toBe("CLOSED");

    const result = await cb.execute(async () => "ok");
    expect(result).toBe("ok");
    expect(cb.getState()).toBe("CLOSED");
  });

  it("trips to OPEN after reaching failureThreshold", async () => {
    const cb = new CircuitBreaker({
      name: "TestService",
      failureThreshold: 2,
      recoveryTimeoutMs: 100,
    });

    // Failure 1
    await expect(
      cb.execute(async () => {
        throw new Error("fail 1");
      }),
    ).rejects.toThrow("fail 1");
    expect(cb.getState()).toBe("CLOSED");

    // Failure 2 -> should trip
    await expect(
      cb.execute(async () => {
        throw new Error("fail 2");
      }),
    ).rejects.toThrow("fail 2");
    expect(cb.getState()).toBe("OPEN");

    // Fast-fail while OPEN
    await expect(cb.execute(async () => "blocked")).rejects.toThrow("is OPEN");
  });

  it("executes fallback when OPEN if fallback function is provided", async () => {
    const cb = new CircuitBreaker({
      name: "TestService",
      failureThreshold: 1,
      recoveryTimeoutMs: 500,
    });

    await expect(
      cb.execute(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("OPEN");

    const fallbackResult = await cb.execute(
      async () => "should not run",
      () => ({ fallback: true }),
    );
    expect(fallbackResult).toEqual({ fallback: true });
  });

  it("transitions to HALF_OPEN after recoveryTimeoutMs and resets on success", async () => {
    const cb = new CircuitBreaker({
      name: "TestService",
      failureThreshold: 1,
      recoveryTimeoutMs: 30,
    });

    await expect(
      cb.execute(async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(cb.getState()).toBe("OPEN");

    // Wait for recovery timeout
    await new Promise((r) => setTimeout(r, 40));
    expect(cb.getState()).toBe("HALF_OPEN");

    // Successful probe resets to CLOSED
    const res = await cb.execute(async () => "recovered");
    expect(res).toBe("recovered");
    expect(cb.getState()).toBe("CLOSED");
  });
});
