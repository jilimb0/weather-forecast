const fs = require("node:fs");
const path = require("node:path");
const { Hono } = require("hono");
const { serveStatic } = require("@hono/node-server/serve-static");
const { serve } = require("@hono/node-server");
const Sentry = require("@sentry/node");
const { fetchWeatherPayload, geocodeCity, mapApiError, randomId } = require("./weather-service");

function createWeatherHandler({ apiKey, fetchImpl = fetch } = {}) {
  return async function weatherHandler(req, res) {
    if (res && typeof res.status === "function") {
      const requestId = req.headers?.["x-request-id"] || randomId();
      try {
        const payload = await fetchWeatherPayload({
          apiKey,
          lat: req.query?.lat,
          lon: req.query?.lon,
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
      return;
    }

    const c = req;
    const requestId = c.req.header("x-request-id") || randomId();
    try {
      const payload = await fetchWeatherPayload({
        apiKey,
        lat: c.req.query("lat"),
        lon: c.req.query("lon"),
        fetchImpl,
        ipAddress: c.req.header("x-forwarded-for")?.split(",")?.[0]?.trim() || "unknown",
        requestId,
      });

      c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=240");
      return c.json(payload, 200);
    } catch (error) {
      const mapped = mapApiError(error, requestId);
      return c.json(mapped.body, mapped.statusCode);
    }
  };
}

function createGeocodeHandler({ apiKey, fetchImpl = fetch } = {}) {
  return async function geocodeHandler(req, res) {
    if (res && typeof res.status === "function") {
      const requestId = req.headers?.["x-request-id"] || randomId();
      try {
        const results = await geocodeCity({
          apiKey,
          query: req.query?.q,
          fetchImpl,
        });
        res.status(200).json({ results, requestId });
      } catch (error) {
        const mapped = mapApiError(error, requestId);
        res.status(mapped.statusCode).json(mapped.body);
      }
      return;
    }

    const c = req;
    const requestId = c.req.header("x-request-id") || randomId();
    try {
      const results = await geocodeCity({
        apiKey,
        query: c.req.query("q"),
        fetchImpl,
      });
      return c.json({ results, requestId }, 200);
    } catch (error) {
      const mapped = mapApiError(error, requestId);
      return c.json(mapped.body, mapped.statusCode);
    }
  };
}

function createApp({ apiKey, fetchImpl = fetch, liveReloadMiddleware = null } = {}) {
  const app = new Hono();

  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.2 });
  }

  // Defensive security headers middleware
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "geolocation=(self)");
    c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com https://api.openweathermap.org; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none'; base-uri 'self';",
    );
  });

  if (liveReloadMiddleware) {
    app.get("/__live-reload", (c) => {
      if (c.env?.incoming && c.env?.outgoing) {
        liveReloadMiddleware(c.env.incoming, c.env.outgoing);
      }
      return new Response(null);
    });
  }

  app.get("/health", (c) => {
    return c.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
        checks: {
          apiKey: apiKey ? "configured" : "missing",
        },
      },
      200,
    );
  });

  const weatherHandler = createWeatherHandler({ apiKey, fetchImpl });
  const geocodeHandler = createGeocodeHandler({ apiKey, fetchImpl });

  app.get("/api/weather", (c) => weatherHandler(c));
  app.get("/api/geocode", (c) => geocodeHandler(c));

  const getIndexHtml = () => {
    const indexPath = path.join(__dirname, "..", "index.html");
    const html = fs.readFileSync(indexPath, "utf-8");
    const script = `<script>window.__WEATHER_CONFIG__=${JSON.stringify({
      defaultLocation: {
        lat: Number(process.env.DEFAULT_LAT) || 41.7151,
        lon: Number(process.env.DEFAULT_LON) || 44.8271,
        label: "Default",
      },
    })}</script>`;
    return html.replace("</head>", `${script}</head>`);
  };

  app.get("/", (c) => c.html(getIndexHtml()));
  app.get("/index.html", (c) => c.html(getIndexHtml()));

  const staticRoot = path.relative(process.cwd(), path.join(__dirname, "..")) || "./";
  app.use("/*", serveStatic({ root: staticRoot }));

  app.listen = (port, callback) => serve({ fetch: app.fetch, port }, callback);

  return app;
}

module.exports = {
  createApp,
  createWeatherHandler,
  createGeocodeHandler,
};
