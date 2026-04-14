import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { handler: weatherHandler } = require("../netlify/functions/weather");
const { handler: geocodeHandler } = require("../netlify/functions/geocode");

const originalFetch = global.fetch;
const originalApiKey = process.env.OPENWEATHER_API_KEY;

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

beforeEach(() => {
  process.env.OPENWEATHER_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.OPENWEATHER_API_KEY = originalApiKey;
});

describe("netlify weather function", () => {
  it("returns v2 payload", async () => {
    global.fetch = async (url) => {
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

    const response = await weatherHandler({
      queryStringParameters: { lat: "41.7", lon: "44.8" },
      headers: {},
    });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload.hourly).toHaveLength(8);
    expect(payload.daily).toHaveLength(5);
    expect(payload.meta.requestId).toBeTruthy();
  });

  it("returns 400 for invalid coordinates", async () => {
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });

    const response = await weatherHandler({
      queryStringParameters: { lat: "200", lon: "44.8" },
      headers: {},
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("netlify geocode function", () => {
  it("returns search results", async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => [{ name: "Tbilisi", country: "GE", lat: 41.7, lon: 44.8 }],
    });

    const response = await geocodeHandler({ queryStringParameters: { q: "tbil" }, headers: {} });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload.results[0].name).toBe("Tbilisi");
  });
});
