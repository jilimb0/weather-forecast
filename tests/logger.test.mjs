import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const logger = require("../src/logger");

describe("logger", () => {
  it("logs info messages", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test message");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("logs error messages", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("test error");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles Error objects", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error(new Error("something broke"));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
