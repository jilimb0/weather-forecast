import { createRequire } from "node:module";
import { beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { createApp } = require("../src/server");
const {
  computeWeatherAnomalyBps,
  normalizeWeatherPayload,
  openWeatherBreaker,
  weatherCache,
} = require("../src/weather-service");

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

function createCurrentWeather({
  lat = 41.7151,
  lon = 44.8271,
  windSpeed = 4.5,
  rain1h = 0,
  condition = "Clear",
} = {}) {
  const current = {
    dt: 1776156348,
    timezone: 14400,
    name: "Tbilisi",
    coord: { lat, lon },
    sys: { country: "GE" },
    main: { temp: 14, feels_like: 13, humidity: 50, pressure: 1015 },
    weather: [{ main: condition, icon: "01d" }],
    wind: { speed: windSpeed, deg: 210 },
    visibility: 10000,
  };
  if (rain1h > 0) {
    current.rain = { "1h": rain1h };
  }
  return current;
}

describe("computeWeatherAnomalyBps", () => {
  it("rounds coordinates to 2 decimals and returns 10000 factor for normal conditions", () => {
    const payload = normalizeWeatherPayload(
      createCurrentWeather({ lat: 41.7151, lon: -0.1278, windSpeed: 4.5, rain1h: 0 }),
      { list: createForecastList(), city: { timezone: 14400 } },
    );

    const anomaly = computeWeatherAnomalyBps(payload);

    expect(anomaly.latRounded).toBe(41.72);
    expect(anomaly.lonRounded).toBe(-0.13);
    expect(anomaly.precipitationMmPerHourBps).toBe(0);
    expect(anomaly.windSpeedMsBps).toBe(45000);
    expect(anomaly.weatherAnomalyFactorBps).toBe(10000);
    expect(anomaly.isWeatherCacheStale).toBe(false);
    expect(Number.isInteger(anomaly.precipitationMmPerHourBps)).toBe(true);
    expect(Number.isInteger(anomaly.windSpeedMsBps)).toBe(true);
    expect(Number.isInteger(anomaly.weatherAnomalyFactorBps)).toBe(true);
  });

  it("reduces weatherAnomalyFactorBps to 6500..8500 under heavy rain and wind", () => {
    const heavyRainPayload = normalizeWeatherPayload(
      createCurrentWeather({ windSpeed: 5.0, rain1h: 15.25, condition: "Rain" }),
      { list: createForecastList(), city: { timezone: 14400 } },
    );
    const heavyRainResult = computeWeatherAnomalyBps(heavyRainPayload);

    expect(heavyRainResult.precipitationMmPerHourBps).toBe(152500);
    expect(heavyRainResult.windSpeedMsBps).toBe(50000);
    expect(heavyRainResult.weatherAnomalyFactorBps).toBeGreaterThanOrEqual(6500);
    expect(heavyRainResult.weatherAnomalyFactorBps).toBeLessThanOrEqual(8500);

    const heavyWindPayload = normalizeWeatherPayload(
      createCurrentWeather({ windSpeed: 18.5, rain1h: 0, condition: "Clouds" }),
      { list: createForecastList(), city: { timezone: 14400 } },
    );
    const heavyWindResult = computeWeatherAnomalyBps(heavyWindPayload);

    expect(heavyWindResult.precipitationMmPerHourBps).toBe(0);
    expect(heavyWindResult.windSpeedMsBps).toBe(185000);
    expect(heavyWindResult.weatherAnomalyFactorBps).toBeGreaterThanOrEqual(6500);
    expect(heavyWindResult.weatherAnomalyFactorBps).toBeLessThanOrEqual(8500);

    const stormPayload = normalizeWeatherPayload(
      createCurrentWeather({ windSpeed: 24.0, rain1h: 25.0, condition: "Thunderstorm" }),
      { list: createForecastList(), city: { timezone: 14400 } },
    );
    const stormResult = computeWeatherAnomalyBps(stormPayload);

    expect(stormResult.weatherAnomalyFactorBps).toBeGreaterThanOrEqual(6500);
    expect(stormResult.weatherAnomalyFactorBps).toBeLessThanOrEqual(8500);
  });

  it("reflects Boolean(payload.meta?.stale) in isWeatherCacheStale", () => {
    const basePayload = normalizeWeatherPayload(createCurrentWeather(), {
      list: createForecastList(),
      city: { timezone: 14400 },
    });

    expect(computeWeatherAnomalyBps(basePayload).isWeatherCacheStale).toBe(false);
    expect(
      computeWeatherAnomalyBps({
        ...basePayload,
        meta: { ...basePayload.meta, stale: true },
      }).isWeatherCacheStale,
    ).toBe(true);
  });
});

describe("GET /api/v2/b2b/anomaly", () => {
  beforeEach(() => {
    weatherCache.clear();
    openWeatherBreaker.reset();
  });

  it("returns normalized integer bps payload for valid coordinates", async () => {
    const mockFetch = async (url) => {
      if (url.includes("/weather?")) {
        return {
          ok: true,
          status: 200,
          json: async () =>
            createCurrentWeather({
              lat: 41.7151,
              lon: 44.8271,
              windSpeed: 16.4,
              rain1h: 12.5,
              condition: "Rain",
            }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ list: createForecastList(), city: { timezone: 14400 } }),
      };
    };

    const app = createApp({ apiKey: "test-key", fetchImpl: mockFetch });
    const response = await app.request("/api/v2/b2b/anomaly?lat=41.7151&lon=44.8271");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    const body = await response.json();

    expect(body.latRounded).toBe(41.72);
    expect(body.lonRounded).toBe(44.83);
    expect(body.precipitationMmPerHourBps).toBe(125000);
    expect(body.windSpeedMsBps).toBe(164000);
    expect(body.weatherAnomalyFactorBps).toBeGreaterThanOrEqual(6500);
    expect(body.weatherAnomalyFactorBps).toBeLessThanOrEqual(8500);
    expect(body.isWeatherCacheStale).toBe(false);
    expect(Number.isInteger(body.precipitationMmPerHourBps)).toBe(true);
    expect(Number.isInteger(body.windSpeedMsBps)).toBe(true);
    expect(Number.isInteger(body.weatherAnomalyFactorBps)).toBe(true);
  });

  it("returns 400 for invalid or missing coordinates", async () => {
    const app = createApp({
      apiKey: "test-key",
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    });

    for (const query of [
      "lat=abc&lon=44.8",
      "lat=91&lon=44.8",
      "lat=41.7&lon=181",
      "lat=&lon=44.8",
      "lon=44.8",
    ]) {
      const response = await app.request(`/api/v2/b2b/anomaly?${query}`);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.code).toBe("INVALID_COORDINATE");
    }
  });
});
