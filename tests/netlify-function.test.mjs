import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { handler } = require("../netlify/functions/weather");

const originalFetch = global.fetch;
const originalApiKey = process.env.OPENWEATHER_API_KEY;

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

beforeEach(() => {
  process.env.OPENWEATHER_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.OPENWEATHER_API_KEY = originalApiKey;
});

describe("netlify weather function", () => {
  it("returns weather payload", async () => {
    global.fetch = async (url) => {
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

    const response = await handler({ queryStringParameters: { lat: "41.7", lon: "44.8" } });
    const payload = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(payload.currentData.name).toBe("Tbilisi");
    expect(payload.forecastData.current.temp).toBe(11);
    expect(payload.forecastData.daily[1].temp.day).toBe(12);
  });

  it("returns 400 for invalid coordinates", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({}) });

    const response = await handler({ queryStringParameters: { lat: "200", lon: "44.8" } });
    expect(response.statusCode).toBe(400);
  });
});
