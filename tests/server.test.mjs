import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { parseCoordinate, createWeatherHandler } = require("../src/server");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
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
  return [
    {
      dt: 1776242748,
      main: { temp: 12, feels_like: 10 },
      weather: [{ main: "Clouds" }],
    },
    {
      dt: 1776253548,
      main: { temp: 15, feels_like: 13 },
      weather: [{ main: "Clear" }],
    },
    {
      dt: 1776329148,
      main: { temp: 16, feels_like: 14 },
      weather: [{ main: "Rain" }],
    },
    {
      dt: 1776339948,
      main: { temp: 17, feels_like: 15 },
      weather: [{ main: "Clouds" }],
    },
  ];
}

describe("parseCoordinate", () => {
  it("parses valid lat/lon", () => {
    expect(parseCoordinate("41.7", "lat")).toBe(41.7);
    expect(parseCoordinate("44.8", "lon")).toBe(44.8);
  });

  it("throws on invalid coordinate", () => {
    expect(() => parseCoordinate("abc", "lat")).toThrow();
    expect(() => parseCoordinate("91", "lat")).toThrow();
    expect(() => parseCoordinate("181", "lon")).toThrow();
  });
});

describe("weather handler", () => {
  it("returns proxied weather payload", async () => {
    const mockFetch = async (url) => {
      if (url.includes("/weather?")) {
        return {
          ok: true,
          json: async () => ({
            name: "Tbilisi",
            dt: 1776156348,
            timezone: 14400,
            main: { temp: 11, feels_like: 9 },
            weather: [{ main: "Clouds" }],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ list: createForecastList(), city: { timezone: 14400 } }),
      };
    };

    const handler = createWeatherHandler({ apiKey: "test-key", fetchImpl: mockFetch });
    const req = { query: { lat: "41.7", lon: "44.8" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.currentData.name).toBe("Tbilisi");
    expect(res.body.forecastData.current.temp).toBe(11);
    expect(res.body.forecastData.daily[1].temp.day).toBe(12);
    expect(res.body.forecastData.daily[2].temp.day).toBe(16);
  });

  it("returns 400 for bad lat", async () => {
    const handler = createWeatherHandler({
      apiKey: "test-key",
      fetchImpl: async () => ({ ok: true, json: async () => ({}) }),
    });
    const req = { query: { lat: "1000", lon: "44.8" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain("lat");
  });

  it("returns 500 when api key missing", async () => {
    const handler = createWeatherHandler({
      fetchImpl: async () => ({ ok: true, json: async () => ({}) }),
    });
    const req = { query: { lat: "41.7", lon: "44.8" } };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
  });
});
