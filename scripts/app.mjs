const DEFAULT_LOCATION =
  typeof window !== "undefined" && window.__WEATHER_CONFIG__
    ? window.__WEATHER_CONFIG__.defaultLocation
    : { lat: 41.7151, lon: 44.8271, label: "Tbilisi, GE" };
const UNIT_STORAGE_KEY = "weather_units";
const LAST_PAYLOAD_KEY = "weather_last_payload";
const SAVED_LOCATION_KEY = "weather_selected_location";

const nodes =
  typeof document !== "undefined"
    ? {
        app: document.getElementById("app"),
        status: document.getElementById("status-banner"),
        location: document.getElementById("hero-location"),
        temp: document.getElementById("hero-temp"),
        condition: document.getElementById("hero-condition"),
        updated: document.getElementById("hero-updated"),
        heroIcon: document.getElementById("hero-icon"),
        hourlyList: document.getElementById("hourly-list"),
        dailyList: document.getElementById("daily-list"),
        metricsGrid: document.getElementById("metrics-grid"),
        retry: document.getElementById("retry-button"),
        unitButton: document.getElementById("unit-switcher"),
        useLocation: document.getElementById("use-location"),
        cityForm: document.getElementById("city-form"),
        cityInput: document.getElementById("city-input"),
        cityResults: document.getElementById("city-results"),
      }
    : null;

let currentPayload = null;
let currentUnit =
  typeof localStorage !== "undefined" ? localStorage.getItem(UNIT_STORAGE_KEY) || "C" : "C";
let activeCityIndex = -1;

function getStoredLocation() {
  if (typeof localStorage === "undefined") return DEFAULT_LOCATION;
  const raw = localStorage.getItem(SAVED_LOCATION_KEY);
  if (!raw) return DEFAULT_LOCATION;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return DEFAULT_LOCATION;
  }
}

function setStoredLocation(location) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(location));
}

export function formatTemp(celsius, unit = currentUnit) {
  if (unit === "F") return `${Math.round(celsius * 1.8 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

export function celsiusValue(celsius, unit = currentUnit) {
  return unit === "F" ? Math.round(celsius * 1.8 + 32) : Math.round(celsius);
}

function formatDateTime(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDay(dt, timezoneOffsetSec) {
  const millis = (dt + timezoneOffsetSec) * 1000;
  return new Date(millis).toLocaleDateString(undefined, { weekday: "short" });
}

function setStatus(message, type = "info", dom = nodes) {
  if (!dom?.status) return;
  dom.status.textContent = message || "";
  dom.status.classList.toggle("error", type === "error");
  dom.status.classList.toggle("hidden", !message);
}

function setPanelsLoading(isLoading, dom = nodes) {
  if (!dom?.app) return;
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("loading", isLoading);
  });
  dom.app.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function setWeatherIcon(iconMain, canvasNode) {
  if (!canvasNode || typeof Skycons === "undefined") return;
  const renderSize = 140;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvasNode.width = Math.round(renderSize * dpr);
  canvasNode.height = Math.round(renderSize * dpr);
  canvasNode.style.width = `${renderSize}px`;
  canvasNode.style.height = `${renderSize}px`;

  const map = {
    Clouds: "cloudy",
    Clear: "clear-day",
    Mist: "fog",
    Haze: "fog",
    Fog: "fog",
    Smoke: "fog",
    Drizzle: "rain",
    Rain: "rain",
    Thunderstorm: "thunder-rain",
    Snow: "snow",
  };

  const selected = (map[iconMain] || "partly-cloudy-day").replace(/-/g, "_").toUpperCase();
  const skycons = new Skycons({ color: "white" });
  skycons.play();
  skycons.set(canvasNode, Skycons[selected]);
}

function buildHourlyItem(item, timezoneOffsetSec) {
  const localHour = new Date((item.dt + timezoneOffsetSec) * 1000).toISOString().slice(11, 16);
  return `<li><p>${formatDay(item.dt, timezoneOffsetSec)} ${localHour}</p><strong>${formatTemp(item.temp)}</strong><p>${item.condition}</p><small>Rain: ${Math.round((item.pop || 0) * 100)}%</small></li>`;
}

function buildDailyItem(item, timezoneOffsetSec) {
  return `<li><p>${formatDay(item.dt, timezoneOffsetSec)}</p><strong>${formatTemp(item.temp.day)}</strong><p>${item.condition}</p><small>H ${formatTemp(item.temp.max)} / L ${formatTemp(item.temp.min)}</small></li>`;
}

function renderMetrics(current, dom = nodes) {
  const metricList = [
    { label: "Humidity", value: `${current.humidity}%` },
    { label: "Wind", value: `${current.wind.speed} m/s` },
    { label: "Pressure", value: `${current.pressure} hPa` },
    { label: "Visibility", value: `${Math.round((current.visibility || 0) / 1000)} km` },
  ];

  dom.metricsGrid.innerHTML = metricList
    .map(
      (metric) =>
        `<article class="metric"><p class="metric-label">${metric.label}</p><p class="metric-value">${metric.value}</p></article>`,
    )
    .join("");
}

export function renderPayload(payload, options = {}, dom = nodes) {
  const { fromOffline = false } = options;
  if (!dom) return;

  currentPayload = payload;

  dom.location.textContent = `${payload.location.name}, ${payload.location.country}`;
  dom.temp.textContent = `${celsiusValue(payload.current.temp)}°${currentUnit}`;
  dom.condition.textContent = `${payload.current.condition} • Feels like ${formatTemp(payload.current.feelsLike)}`;
  dom.updated.textContent = fromOffline
    ? `Showing cached weather from ${formatDateTime(payload.meta.fetchedAt)}`
    : `Updated ${formatDateTime(payload.meta.fetchedAt)}`;

  dom.hourlyList.innerHTML = payload.hourly
    .slice(0, 8)
    .map((item) => buildHourlyItem(item, payload.location.timezone))
    .join("");
  dom.dailyList.innerHTML = payload.daily
    .slice(0, 5)
    .map((item) => buildDailyItem(item, payload.location.timezone))
    .join("");

  renderMetrics(payload.current, dom);
  setWeatherIcon(payload.current.condition, dom.heroIcon);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LAST_PAYLOAD_KEY, JSON.stringify(payload));
  }
}

async function fetchWeather(lat, lon) {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || `Request failed (${response.status})`);
    error.code = body.code;
    throw error;
  }
  return body;
}

async function fetchCityResults(query) {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "City search failed");
  return body.results || [];
}

async function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 120000,
    });
  });
}

export async function loadWeather(location = getStoredLocation(), dom = nodes) {
  setPanelsLoading(true, dom);

  try {
    setStatus("", "info", dom);
    const payload = await fetchWeather(location.lat, location.lon);
    renderPayload(payload, {}, dom);
    setStatus("", "info", dom);
    setStoredLocation(location);
  } catch (error) {
    const cached =
      typeof localStorage !== "undefined" ? localStorage.getItem(LAST_PAYLOAD_KEY) : null;
    if (cached) {
      renderPayload(JSON.parse(cached), { fromOffline: true }, dom);
      setStatus(`Offline fallback enabled: ${error.message}`, "error", dom);
    } else {
      setStatus(`Unable to load weather: ${error.message}`, "error", dom);
    }
  } finally {
    setPanelsLoading(false, dom);
  }
}

async function useCurrentLocation(dom = nodes) {
  try {
    setStatus(
      "Please allow location access to get local weather, or keep using city search.",
      "info",
      dom,
    );
    const position = await getPosition();
    const loc = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      label: "Current location",
    };
    await loadWeather(loc, dom);
  } catch (error) {
    if (error?.code === 1) {
      setStatus("Location access was denied. You can still use city search above.", "error", dom);
      return;
    }
    setStatus(
      "We could not get your location right now. Try again or use city search.",
      "error",
      dom,
    );
  }
}

async function searchCity(dom = nodes) {
  const query = dom.cityInput.value.trim();
  if (query.length < 2) {
    setStatus("Please enter at least 2 characters", "error", dom);
    return;
  }

  try {
    const results = await fetchCityResults(query);
    if (!results.length) {
      populateCityDropdown(dom, []);
      setStatus("No cities found", "error", dom);
      return;
    }

    populateCityDropdown(dom, results);

    const selected = dom.cityResults.querySelector(".city-result-item");
    if (!selected) return;
    await loadWeather(
      {
        lat: Number(selected.dataset.lat),
        lon: Number(selected.dataset.lon),
        label: selected.textContent,
      },
      dom,
    );
  } catch (error) {
    setStatus(`City search failed: ${error.message}`, "error", dom);
  }
}

function populateCityDropdown(dom = nodes, items = []) {
  dom.cityResults.innerHTML = "";
  activeCityIndex = -1;
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "city-results-empty";
    empty.textContent = "Search results will appear here";
    dom.cityResults.appendChild(empty);
    return;
  }

  items.forEach((item, idx) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `city-result-item${idx === 0 ? " active" : ""}`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", idx === 0 ? "true" : "false");
    button.textContent = item.label;
    button.dataset.lat = String(item.lat);
    button.dataset.lon = String(item.lon);
    button.dataset.index = String(idx);
    dom.cityResults.appendChild(button);
  });
  activeCityIndex = 0;
}

function setActiveCityResult(dom, index) {
  const options = [...dom.cityResults.querySelectorAll(".city-result-item")];
  if (!options.length) return null;

  if (index < 0) {
    activeCityIndex = -1;
    options.forEach((option) => {
      option.classList.remove("active");
      option.setAttribute("aria-selected", "false");
    });
    return null;
  }

  const boundedIndex = Math.min(index, options.length - 1);
  activeCityIndex = boundedIndex;

  options.forEach((option, idx) => {
    const isActive = idx === boundedIndex;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  return options[boundedIndex];
}

async function applyCityResultSelection(dom, option) {
  if (!option?.dataset.lat || !option.dataset.lon) return;
  await loadWeather(
    {
      lat: Number(option.dataset.lat),
      lon: Number(option.dataset.lon),
      label: option.textContent,
    },
    dom,
  );
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";
  if (isLocalhost) return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  });
}

function initLocalLiveReload() {
  if (typeof window === "undefined") return;
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocalhost) return;

  const stream = new EventSource("/__live-reload");
  stream.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "reload") {
        window.location.reload();
      }
    } catch (_error) {
      window.location.reload();
    }
  };
}

function bindEvents(dom = nodes) {
  dom.retry.addEventListener("click", () => loadWeather(getStoredLocation(), dom));
  dom.useLocation.addEventListener("click", () => useCurrentLocation(dom));
  dom.cityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await searchCity(dom);
  });

  dom.cityResults.addEventListener("click", async (event) => {
    const target = event.target.closest(".city-result-item");
    if (!target?.dataset.lat || !target.dataset.lon) return;

    setActiveCityResult(dom, Number(target.dataset.index || 0));
    await applyCityResultSelection(dom, target);
  });

  dom.cityInput.addEventListener("keydown", async (event) => {
    const options = [...dom.cityResults.querySelectorAll(".city-result-item")];
    if (!options.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const active = setActiveCityResult(dom, activeCityIndex + 1);
      active?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const active = setActiveCityResult(dom, activeCityIndex - 1);
      active?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "Enter" && activeCityIndex >= 0) {
      event.preventDefault();
      await applyCityResultSelection(dom, options[activeCityIndex]);
      return;
    }

    if (event.key === "Escape") {
      setActiveCityResult(dom, -1);
    }
  });

  dom.unitButton.textContent = `°${currentUnit}`;
  dom.unitButton.addEventListener("click", () => {
    currentUnit = currentUnit === "C" ? "F" : "C";
    localStorage.setItem(UNIT_STORAGE_KEY, currentUnit);
    dom.unitButton.textContent = `°${currentUnit}`;
    if (currentPayload) {
      renderPayload(currentPayload, { fromOffline: false }, dom);
    }
  });

  const saved = getStoredLocation();
  const unique = new Map();
  [
    { label: saved.label || "Saved location", lat: saved.lat, lon: saved.lon },
    { label: DEFAULT_LOCATION.label, lat: DEFAULT_LOCATION.lat, lon: DEFAULT_LOCATION.lon },
  ].forEach((item) => {
    unique.set(`${item.label}-${item.lat}-${item.lon}`, item);
  });
  populateCityDropdown(dom, [...unique.values()]);
}

export function initWeatherApp(dom = nodes) {
  if (!dom) return;
  bindEvents(dom);
  initLocalLiveReload();
  registerServiceWorker();
  loadWeather(getStoredLocation(), dom);
}

if (typeof window !== "undefined" && typeof document !== "undefined" && !window.__WEATHER_TEST__) {
  initWeatherApp();
}
