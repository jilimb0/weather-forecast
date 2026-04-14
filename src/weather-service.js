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

function getDateKey(timestampSec, timezoneOffsetSec) {
  return new Date((timestampSec + timezoneOffsetSec) * 1000).toISOString().slice(0, 10);
}

function getLocalHour(timestampSec, timezoneOffsetSec) {
  const secondsInDay = 86400;
  const adjusted = (timestampSec + timezoneOffsetSec) % secondsInDay;
  const normalized = adjusted < 0 ? adjusted + secondsInDay : adjusted;
  return normalized / 3600;
}

function pickBestEntryForDay(entries, timezoneOffsetSec) {
  const targetHour = 12;

  return entries.reduce((best, current) => {
    const bestDistance = Math.abs(getLocalHour(best.dt, timezoneOffsetSec) - targetHour);
    const currentDistance = Math.abs(getLocalHour(current.dt, timezoneOffsetSec) - targetHour);
    return currentDistance < bestDistance ? current : best;
  });
}

function createDailyItem(entry) {
  return {
    temp: { day: entry.main.temp },
    feels_like: { day: entry.main.feels_like },
    weather: [{ main: entry.weather?.[0]?.main || "Clouds" }],
  };
}

function normalizeForecastData(currentData, forecastRawData) {
  const timezoneOffsetSec = currentData.timezone || forecastRawData.city?.timezone || 0;
  const currentDayKey = getDateKey(currentData.dt, timezoneOffsetSec);

  const grouped = new Map();
  for (const entry of forecastRawData.list || []) {
    const key = getDateKey(entry.dt, timezoneOffsetSec);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(entry);
  }

  const futureKeys = [...grouped.keys()].filter((key) => key > currentDayKey).sort();
  if (futureKeys.length < 2) {
    const err = new Error("Insufficient forecast data from upstream provider");
    err.statusCode = 502;
    throw err;
  }

  const tomorrowEntry = pickBestEntryForDay(grouped.get(futureKeys[0]), timezoneOffsetSec);
  const dayAfterEntry = pickBestEntryForDay(grouped.get(futureKeys[1]), timezoneOffsetSec);

  return {
    timezone_offset: timezoneOffsetSec,
    current: {
      temp: currentData.main.temp,
      feels_like: currentData.main.feels_like,
      weather: [{ main: currentData.weather?.[0]?.main || "Clouds" }],
    },
    daily: [
      createDailyItem({
        main: {
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
        },
        weather: currentData.weather,
      }),
      createDailyItem(tomorrowEntry),
      createDailyItem(dayAfterEntry),
    ],
  };
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
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${parsedLat}&lon=${parsedLon}&units=metric&appid=${apiKey}`;

  const [currentResponse, forecastResponse] = await Promise.all([
    fetchImpl(currentUrl),
    fetchImpl(forecastUrl),
  ]);

  if (!currentResponse.ok || !forecastResponse.ok) {
    const err = new Error("Upstream weather provider request failed");
    err.statusCode = 502;
    throw err;
  }

  const [currentData, forecastRawData] = await Promise.all([
    currentResponse.json(),
    forecastResponse.json(),
  ]);

  const forecastData = normalizeForecastData(currentData, forecastRawData);
  return { currentData, forecastData };
}

module.exports = {
  parseCoordinate,
  fetchWeatherPayload,
  normalizeForecastData,
};
