const SHELL_CACHE = "weather-shell-v2";
const API_CACHE = "weather-api-v2";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/style/style.css",
  "/style/lightmode.css",
  "/style/darkmode.css",
  "/scripts/app.mjs",
  "/scripts/switcher.js",
  "/scripts/skycons.js",
  "/manifest.webmanifest",
  "/assets/icons/icon-192.svg",
  "/assets/icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![SHELL_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/weather") || url.pathname.startsWith("/.netlify/functions/weather")) {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          return networkRes;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkRes) => {
        const copy = networkRes.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return networkRes;
      });
    }),
  );
});
