const express = require("express");
const path = require("node:path");
const { fetchWeatherPayload, geocodeCity, mapApiError, randomId } = require("./weather-service");

function createWeatherHandler({ apiKey, fetchImpl = fetch } = {}) {
  return async function weatherHandler(req, res) {
    const requestId = req.headers["x-request-id"] || randomId();

    try {
      const payload = await fetchWeatherPayload({
        apiKey,
        lat: req.query.lat,
        lon: req.query.lon,
        fetchImpl,
        ipAddress: req.ip || "unknown",
        requestId,
      });

      res
        .status(200)
        .set("Cache-Control", "public, max-age=60, stale-while-revalidate=240")
        .json(payload);
    } catch (error) {
      const mapped = mapApiError(error, requestId);
      res.status(mapped.statusCode).json(mapped.body);
    }
  };
}

function createGeocodeHandler({ apiKey, fetchImpl = fetch } = {}) {
  return async function geocodeHandler(req, res) {
    const requestId = req.headers["x-request-id"] || randomId();

    try {
      const results = await geocodeCity({
        apiKey,
        query: req.query.q,
        fetchImpl,
      });
      res.status(200).json({ results, requestId });
    } catch (error) {
      const mapped = mapApiError(error, requestId);
      res.status(mapped.statusCode).json(mapped.body);
    }
  };
}

function createApp({ apiKey, fetchImpl = fetch, liveReloadMiddleware = null } = {}) {
  const app = express();

  app.use(express.json());

  if (liveReloadMiddleware) {
    app.get("/__live-reload", liveReloadMiddleware);
  }

  app.use(express.static(path.join(__dirname, "..")));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/api/weather", createWeatherHandler({ apiKey, fetchImpl }));
  app.get("/api/geocode", createGeocodeHandler({ apiKey, fetchImpl }));

  return app;
}

module.exports = {
  createApp,
  createWeatherHandler,
  createGeocodeHandler,
};
