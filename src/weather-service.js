const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 60;
const FETCH_TIMEOUT_MS = 7000;
const MAX_RETRIES = 1;

const weatherCache = new Map();
const requestBuckets = new Map();

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseCoordinate(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const err = new Error(`${label} must be a valid number`);
    err.statusCode = 400;
    err.code = "INVALID_COORDINATE";
    throw err;
  }

  if (label === "lat" && (num < -90 || num > 90)) {
    const err = new Error("lat must be between -90 and 90");
    err.statusCode = 400;
    err.code = "INVALID_COORDINATE";
    throw err;
  }

  if (label === "lon" && (num < -180 || num > 180)) {
    const err = new Error("lon must be between -180 and 180");
    err.statusCode = 400;
    err.code = "INVALID_COORDINATE";
    throw err;
  }

  return num;
}

function roundCoord(value) {
  return Math.round(value * 10) / 10;
}

function makeCacheKey(lat, lon, units = "metric") {
  return `${roundCoord(lat)}:${roundCoord(lon)}:${units}`;
}

function getCachedPayload(key) {
  const cached = weatherCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.storedAt > CACHE_TTL_MS) {
    weatherCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedPayload(key, payload) {
  weatherCache.set(key, { value: payload, storedAt: Date.now() });
}

function enforceRateLimit(ipAddress = "unknown") {
  const now = Date.now();
  const bucket = requestBuckets.get(ipAddress) || { count: 0, resetAt: now + RATE_WINDOW_MS };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }

  bucket.count += 1;
  requestBuckets.set(ipAddress, bucket);

  if (bucket.count > RATE_MAX_REQUESTS) {
    const err = new Error("Too many requests. Please retry in a moment.");
    err.statusCode = 429;
    err.code = "RATE_LIMITED";
    throw err;
  }
}

async function fetchWithTimeout(url, fetchImpl, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url, fetchImpl) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fetchWithTimeout(url, fetchImpl);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRIES) break;
      const jitterMs = 120 + Math.floor(Math.random() * 180);
      await new Promise((resolve) => setTimeout(resolve, jitterMs));
    }
  }

  const err = new Error("Upstream weather provider unavailable");
  err.statusCode = 502;
  err.code = "UPSTREAM_UNAVAILABLE";
  err.cause = lastError;
  throw err;
}

async function parseErrorBody(response) {
  try {
    const body = await response.json();
    return body?.message || body?.error || "";
  } catch (_error) {
    return "";
  }
}

function mapUpstreamStatus(status, message = "") {
  if (status === 429) {
    const err = new Error("Weather provider rate limit reached. Please try again shortly.");
    err.statusCode = 429;
    err.code = "UPSTREAM_RATE_LIMITED";
    err.details = message;
    return err;
  }

  const err = new Error("Upstream weather provider request failed");
  err.statusCode = 502;
  err.code = "UPSTREAM_UNAVAILABLE";
  err.details = message;
  return err;
}

function toIsoDate(timestampSec, timezoneOffsetSec) {
  return new Date((timestampSec + timezoneOffsetSec) * 1000).toISOString().slice(0, 10);
}

function toLocalHour(timestampSec, timezoneOffsetSec) {
  const daySec = 86400;
  const adjusted = (timestampSec + timezoneOffsetSec) % daySec;
  const normalized = adjusted < 0 ? adjusted + daySec : adjusted;
  return normalized / 3600;
}

function pickNoonEntry(entries, timezoneOffsetSec) {
  const target = 12;
  return entries.reduce((best, current) => {
    const bestDist = Math.abs(toLocalHour(best.dt, timezoneOffsetSec) - target);
    const currDist = Math.abs(toLocalHour(current.dt, timezoneOffsetSec) - target);
    return currDist < bestDist ? current : best;
  });
}

function aggregateDay(entries, timezoneOffsetSec) {
  const noonEntry = pickNoonEntry(entries, timezoneOffsetSec);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const item of entries) {
    min = Math.min(min, item.main.temp_min ?? item.main.temp);
    max = Math.max(max, item.main.temp_max ?? item.main.temp);
  }

  return {
    dt: noonEntry.dt,
    temp: {
      min,
      max,
      day: noonEntry.main.temp,
    },
    feelsLike: noonEntry.main.feels_like,
    condition: noonEntry.weather?.[0]?.main || "Clouds",
    icon: noonEntry.weather?.[0]?.icon || "03d",
    pop: noonEntry.pop || 0,
  };
}

function normalizeWeatherPayload(currentData, forecastData, units = "metric") {
  const timezoneOffsetSec = currentData.timezone || forecastData.city?.timezone || 0;
  const todayKey = toIsoDate(currentData.dt, timezoneOffsetSec);

  const hourly = (forecastData.list || []).slice(0, 8).map((item) => ({
    dt: item.dt,
    temp: item.main.temp,
    feelsLike: item.main.feels_like,
    condition: item.weather?.[0]?.main || "Clouds",
    icon: item.weather?.[0]?.icon || "03d",
    pop: item.pop || 0,
  }));

  const grouped = new Map();
  for (const entry of forecastData.list || []) {
    const key = toIsoDate(entry.dt, timezoneOffsetSec);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  }

  const dailyKeys = [...grouped.keys()]
    .filter((k) => k > todayKey)
    .sort()
    .slice(0, 5);

  if (dailyKeys.length < 5) {
    const err = new Error("Insufficient forecast data from upstream provider");
    err.statusCode = 502;
    err.code = "UPSTREAM_INCOMPLETE";
    throw err;
  }

  const daily = dailyKeys.map((key) => aggregateDay(grouped.get(key), timezoneOffsetSec));

  return {
    location: {
      name: currentData.name,
      country: currentData.sys?.country || "",
      timezone: timezoneOffsetSec,
      lat: currentData.coord?.lat,
      lon: currentData.coord?.lon,
    },
    current: {
      dt: currentData.dt,
      temp: currentData.main.temp,
      feelsLike: currentData.main.feels_like,
      humidity: currentData.main.humidity,
      wind: {
        speed: currentData.wind?.speed ?? 0,
        deg: currentData.wind?.deg ?? 0,
      },
      pressure: currentData.main.pressure,
      visibility: currentData.visibility,
      condition: currentData.weather?.[0]?.main || "Clouds",
      icon: currentData.weather?.[0]?.icon || "03d",
    },
    hourly,
    daily,
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "openweather",
      units,
      cacheTtlSec: CACHE_TTL_MS / 1000,
    },
  };
}

async function fetchWeatherPayload({
  apiKey,
  lat,
  lon,
  fetchImpl = fetch,
  ipAddress = "unknown",
  requestId = randomId(),
  units = "metric",
}) {
  enforceRateLimit(ipAddress);

  if (!apiKey) {
    const err = new Error("Server missing OpenWeather API key");
    err.statusCode = 500;
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const parsedLat = parseCoordinate(lat, "lat");
  const parsedLon = parseCoordinate(lon, "lon");
  const cacheKey = makeCacheKey(parsedLat, parsedLon, units);

  const cachedPayload = getCachedPayload(cacheKey);
  if (cachedPayload) {
    return {
      ...cachedPayload,
      meta: {
        ...cachedPayload.meta,
        requestId,
        cacheHit: true,
      },
    };
  }

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${parsedLat}&lon=${parsedLon}&units=${units}&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${parsedLat}&lon=${parsedLon}&units=${units}&appid=${apiKey}`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetchWithRetry(currentUrl, fetchImpl),
    fetchWithRetry(forecastUrl, fetchImpl),
  ]);

  if (!currentResponse.ok) {
    throw mapUpstreamStatus(currentResponse.status, await parseErrorBody(currentResponse));
  }
  if (!forecastResponse.ok) {
    throw mapUpstreamStatus(forecastResponse.status, await parseErrorBody(forecastResponse));
  }

  const [currentData, forecastData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ]);

  const payload = normalizeWeatherPayload(currentData, forecastData, units);
  setCachedPayload(cacheKey, payload);

  console.log(
    JSON.stringify({
      level: "info",
      msg: "weather_payload_served",
      requestId,
      cacheHit: false,
      lat: roundCoord(parsedLat),
      lon: roundCoord(parsedLon),
    }),
  );

  return {
    ...payload,
    meta: {
      ...payload.meta,
      requestId,
      cacheHit: false,
    },
  };
}

async function geocodeCity({ apiKey, query, fetchImpl = fetch }) {
  if (!apiKey) {
    const err = new Error("Server missing OpenWeather API key");
    err.statusCode = 500;
    err.code = "MISSING_API_KEY";
    throw err;
  }

  if (!query || query.trim().length < 2) {
    const err = new Error("Query must be at least 2 characters");
    err.statusCode = 400;
    err.code = "INVALID_QUERY";
    throw err;
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query.trim())}&limit=5&appid=${apiKey}`;
  const response = await fetchWithRetry(url, fetchImpl);

  if (!response.ok) {
    throw mapUpstreamStatus(response.status, await parseErrorBody(response));
  }

  const rows = await response.json();
  return rows.map((item) => ({
    name: item.name,
    country: item.country,
    state: item.state || "",
    lat: item.lat,
    lon: item.lon,
    label: `${item.name}${item.state ? `, ${item.state}` : ""}, ${item.country}`,
  }));
}

function mapApiError(error, requestId) {
  if (error.statusCode && error.code) {
    return {
      statusCode: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
        requestId,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      requestId,
    },
  };
}

module.exports = {
  CACHE_TTL_MS,
  parseCoordinate,
  normalizeWeatherPayload,
  fetchWeatherPayload,
  geocodeCity,
  mapApiError,
  randomId,
};
