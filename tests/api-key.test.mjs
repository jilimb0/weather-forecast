import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { fetchWeatherPayload, geocodeCity } = require("../src/weather-service");

describe("API key validation", () => {
  it("fetchWeatherPayload throws MISSING_API_KEY when apiKey is undefined", async () => {
    await expect(fetchWeatherPayload({ lat: "41.7", lon: "44.8" })).rejects.toMatchObject({
      code: "MISSING_API_KEY",
      statusCode: 500,
    });
  });

  it("fetchWeatherPayload throws MISSING_API_KEY when apiKey is null", async () => {
    await expect(
      fetchWeatherPayload({ lat: "41.7", lon: "44.8", apiKey: null }),
    ).rejects.toMatchObject({ code: "MISSING_API_KEY", statusCode: 500 });
  });

  it("geocodeCity throws MISSING_API_KEY when apiKey is missing", async () => {
    await expect(geocodeCity({ query: "Tbilisi" })).rejects.toMatchObject({
      code: "MISSING_API_KEY",
      statusCode: 500,
    });
  });
});
