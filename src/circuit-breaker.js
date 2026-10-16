/**
 * Circuit Breaker implementation for upstream weather and geocoding providers.
 * States:
 * - CLOSED: Requests pass through normally. Failures increment counter.
 * - OPEN: Requests fast-fail immediately or execute optional fallback.
 * - HALF_OPEN: Probe request is sent. If successful, resets to CLOSED. If fails, re-opens.
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || "OpenWeather";
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 30000; // 30 seconds
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 1;

    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }

  getState() {
    if (this.state === "OPEN" && Date.now() >= this.nextAttempt) {
      this.state = "HALF_OPEN";
      this.successCount = 0;
    }
    return this.state;
  }

  async execute(action, fallback = null) {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      if (typeof fallback === "function") {
        return await fallback();
      }
      const err = new Error(
        `Circuit breaker [${this.name}] is OPEN. Fast-failing upstream request.`,
      );
      err.statusCode = 503;
      err.code = "CIRCUIT_BREAKER_OPEN";
      throw err;
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      if (typeof fallback === "function") {
        const fbResult = await fallback(error);
        if (fbResult !== null && fbResult !== undefined) {
          return fbResult;
        }
      }
      throw error;
    }
  }

  onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.successCount += 1;
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure(_error) {
    this.lastFailureTime = Date.now();
    this.failureCount += 1;

    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.recoveryTimeoutMs;
    }
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }
}

module.exports = { CircuitBreaker };
