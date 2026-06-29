const express = require("express");
const path = require("node:path");
const Sentry = require("@sentry/node");
const { fetchWeatherPayload, geocodeCity, mapApiError, randomId } = require("./weather-service");
const logger = require("./logger");

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

  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
    app.use(Sentry.Handlers.requestHandler());
  }

  app.use(express.json());

  if (liveReloadMiddleware) {
    app.get("/__live-reload", liveReloadMiddleware);
  }

  app.use((req, res, next) => {
    if (req.path === "/" || req.path === "/index.html") {
      const script = `<script>window.__WEATHER_CONFIG__=${JSON.stringify({
        defaultLocation: {
          lat: Number(process.env.DEFAULT_LAT) || 41.7151,
          lon: Number(process.env.DEFAULT_LON) || 44.8271,
          label: "Default",
        },
      })}</script>`;
      const send = res.send.bind(res);
      res.send = (body) => send(body.toString().replace("</head>", script + "</head>"));
    }
    next();
  });

  app.use(express.static(path.join(__dirname, "..")));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      checks: {
        apiKey: apiKey ? "configured" : "missing",
      },
    });
  });

  app.get("/api/weather", createWeatherHandler({ apiKey, fetchImpl }));
  app.get("/api/geocode", createGeocodeHandler({ apiKey, fetchImpl }));

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  return app;
}

module.exports = {
  createApp,
  createWeatherHandler,
  createGeocodeHandler,
};
