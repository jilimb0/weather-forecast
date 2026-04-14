function parseCoordinate(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a valid number`);
  }

  if (label === "lat" && (num < -90 || num > 90)) {
    throw new Error("lat must be between -90 and 90");
  }

  if (label === "lon" && (num < -180 || num > 180)) {
    throw new Error("lon must be between -180 and 180");
  }

  return num;
}

async function fetchWeatherPayload({ apiKey, lat, lon, fetchImpl = fetch }) {
  if (!apiKey) {
    const err = new Error("Server missing OpenWeather API key");
    err.statusCode = 500;
    throw err;
  }

  const parsedLat = parseCoordinate(lat, "lat");
  const parsedLon = parseCoordinate(lon, "lon");

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${parsedLat}&lon=${parsedLon}&units=metric&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${parsedLat}&lon=${parsedLon}&units=metric&appid=${apiKey}`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetchImpl(currentUrl),
    fetchImpl(forecastUrl),
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    const err = new Error("Upstream weather provider request failed");
    err.statusCode = 502;
    throw err;
  }

  const [currentData, forecastData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ]);

  return { currentData, forecastData };
}

module.exports = {
  parseCoordinate,
  fetchWeatherPayload,
};
