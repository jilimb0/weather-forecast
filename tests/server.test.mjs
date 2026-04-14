import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createGeocodeHandler, createWeatherHandler } = require("../src/server");
const { parseCoordinate, normalizeWeatherPayload } = require("../src/weather-service");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    set(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createForecastList() {
  const base = 1776242748;
  return Array.from({ length: 40 }, (_, idx) => ({
    dt: base + idx * 10800,
    main: {
      temp: 10 + idx * 0.4,
      temp_min: 9 + idx * 0.3,
      temp_max: 11 + idx * 0.5,
      feels_like: 8 + idx * 0.35,
    },
    weather: [{ main: idx % 2 ? "Clouds" : "Clear", icon: idx % 2 ? "03d" : "01d" }],
    pop: (idx % 5) / 10,
  }));
}

describe("weather-service", () => {
  it("validates coordinates", () => {
    expect(parseCoordinate("41.7", "lat")).toBe(41.7);
    expect(() => parseCoordinate("abc", "lat")).toThrow();
    expect(() => parseCoordinate("181", "lon")).toThrow();
  });

  it("normalizes to v2 contract", () => {
    const current = {
      dt: 1776156348,
      timezone: 14400,
      name: "Tbilisi",
      coord: { lat: 41.7, lon: 44.8 },
      sys: { country: "GE" },
      main: { temp: 12, feels_like: 10, humidity: 40, pressure: 1015 },
      weather: [{ main: "Clouds", icon: "03d" }],
      wind: { speed: 4, deg: 210 },
      visibility: 10000,
    };
    const payload = normalizeWeatherPayload(current, {
      list: createForecastList(),
      city: { timezone: 14400 },
    });

    expect(payload.location.name).toBe("Tbilisi");
    expect(payload.current.feelsLike).toBe(10);
    expect(payload.hourly).toHaveLength(8);
    expect(payload.daily).toHaveLength(5);
    expect(payload.meta.cacheTtlSec).toBeGreaterThan(0);
  });
});

describe("weather handler", () => {
  it("returns valid payload and cache headers", async () => {
    const mockFetch = async (url) => {
      if (url.includes("/weather?")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "Tbilisi",
            dt: 1776156348,
            timezone: 14400,
            coord: { lat: 41.7, lon: 44.8 },
            sys: { country: "GE" },
            main: { temp: 11, feels_like: 9, humidity: 37, pressure: 1021 },
            weather: [{ main: "Clouds", icon: "03d" }],
            wind: { speed: 5, deg: 200 },
            visibility: 10000,
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ list: createForecastList(), city: { timezone: 14400 } }),
      };
    };

    const handler = createWeatherHandler({ apiKey: "test-key", fetchImpl: mockFetch });
    const req = { query: { lat: "40.1", lon: "45.9" }, headers: {}, ip: "127.0.0.1" };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.location.name).toBe("Tbilisi");
    expect(res.body.daily).toHaveLength(5);
    expect(res.headers["Cache-Control"]).toContain("stale-while-revalidate");
  });

  it("maps invalid coordinates to 400", async () => {
    const handler = createWeatherHandler({
      apiKey: "test-key",
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    });
    const req = { query: { lat: "abc", lon: "44.8" }, headers: {}, ip: "127.0.0.1" };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe("INVALID_COORDINATE");
  });

  it("maps upstream 429", async () => {
    const handler = createWeatherHandler({
      apiKey: "test-key",
      fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ message: "rate" }) }),
    });
    const req = { query: { lat: "11.1", lon: "12.2" }, headers: {}, ip: "127.0.0.1" };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe("UPSTREAM_RATE_LIMITED");
  });
});

describe("geocode handler", () => {
  it("returns city results", async () => {
    const handler = createGeocodeHandler({
      apiKey: "test-key",
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => [{ name: "Tbilisi", country: "GE", lat: 41.7, lon: 44.8 }],
      }),
    });

    const req = { query: { q: "tbil" }, headers: {} };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.results[0].name).toBe("Tbilisi");
  });
});
