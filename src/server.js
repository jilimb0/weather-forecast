const express = require("express");
const path = require("node:path");
const { parseCoordinate, fetchWeatherPayload } = require("./weather-service");

function createWeatherHandler({ apiKey, fetchImpl = fetch }) {
  return async function weatherHandler(req, res) {
    try {
      const data = await fetchWeatherPayload({
        apiKey,
        lat: req.query.lat,
        lon: req.query.lon,
        fetchImpl,
      });

      res.status(200).json(data);
    } catch (error) {
      if (error.message.includes("must be")) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.statusCode) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      console.error("/api/weather error", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

function createApp({ apiKey, fetchImpl = fetch } = {}) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..")));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/api/weather", createWeatherHandler({ apiKey, fetchImpl }));

  return app;
}

module.exports = {
  createApp,
  parseCoordinate,
  createWeatherHandler,
};
