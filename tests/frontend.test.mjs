import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const payload = {
  location: { name: "Tbilisi", country: "GE", timezone: 14400 },
  current: {
    temp: 10,
    feelsLike: 8,
    condition: "Clouds",
    humidity: 45,
    wind: { speed: 3, deg: 200 },
    pressure: 1018,
    visibility: 10000,
  },
  hourly: Array.from({ length: 8 }, (_, i) => ({
    dt: 1776242748 + i * 10800,
    temp: 10 + i,
    condition: "Clouds",
    pop: 0.2,
  })),
  daily: Array.from({ length: 5 }, (_, i) => ({
    dt: 1776242748 + i * 86400,
    temp: { day: 12 + i, min: 8 + i, max: 16 + i },
    condition: "Clear",
  })),
  meta: { fetchedAt: "2026-04-14T10:00:00.000Z" },
};

function createDom() {
  const dom = new JSDOM(
    `
    <main id="app">
      <section id="status-banner"></section>
      <p id="hero-location"></p>
      <h2 id="hero-temp"></h2>
      <p id="hero-condition"></p>
      <p id="hero-updated"></p>
      <canvas id="hero-icon"></canvas>
      <ul id="hourly-list"></ul>
      <ul id="daily-list"></ul>
      <div id="metrics-grid"></div>
      <button id="retry-button"></button>
      <button id="unit-switcher"></button>
      <button id="use-location"></button>
      <form id="city-form"></form>
      <input id="city-input" />
      <div id="city-results"></div>
    </main>
  `,
    { url: "http://localhost" },
  );

  global.window = dom.window;
  window.__WEATHER_TEST__ = true;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  Object.defineProperty(globalThis, "navigator", {
    value: {
      geolocation: {
        getCurrentPosition: vi.fn((_ok, fail) => fail(new Error("geo unavailable"))),
      },
      serviceWorker: undefined,
    },
    configurable: true,
  });

  global.Skycons = function Skycons() {
    return { play: () => {}, set: () => {} };
  };
  global.Skycons.CLOUDY = "CLOUDY";

  return {
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
  };
}

let domNodes;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  domNodes = createDom();
});

describe("frontend app", () => {
  it("formats temperature for C/F", async () => {
    const module = await import("../scripts/app.mjs");
    expect(module.formatTemp(10, "C")).toBe("10°C");
    expect(module.formatTemp(10, "F")).toBe("50°F");
  });

  it("renders payload sections", async () => {
    const module = await import("../scripts/app.mjs");
    module.renderPayload(payload, {}, domNodes);

    expect(document.getElementById("hero-location").textContent).toContain("Tbilisi");
    expect(document.getElementById("hourly-list").children.length).toBe(8);
    expect(document.getElementById("daily-list").children.length).toBe(5);
    expect(document.getElementById("metrics-grid").children.length).toBe(4);
  });

  it("falls back to cached payload when weather fetch fails", async () => {
    const module = await import("../scripts/app.mjs");
    localStorage.setItem("weather_last_payload", JSON.stringify(payload));
    global.fetch = vi.fn(async () => {
      throw new Error("Network down");
    });

    await module.loadWeather({ lat: 0, lon: 0 }, domNodes);

    expect(document.getElementById("status-banner").textContent).toContain("Offline fallback");
    expect(document.getElementById("hero-location").textContent).toContain("Tbilisi");
  });
});
