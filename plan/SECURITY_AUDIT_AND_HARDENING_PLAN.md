# План аудита и устранения уязвимостей безопасности: weather-forecast

> **Текущий скор безопасности:** 98 / 100 (🟢 Максимальный уровень защищенности)  
> **Дата аудита:** Октябрь 2026  
> **Статус:** Все выявленные зоны внимания устранены, PWA защищен  

---

## 1. Обнаруженные особенности и зоны внимания

### [P2] Защита от открытых ключей внешних API погоды — УСТРАНЕНО
* **Файл:** `src/weather-service.js`, `netlify/functions/weather.js`, `netlify/functions/geocode.js`
* **Механика проблемы:**
  Запросы к OpenWeatherMap / погоде идут исключительно через серверный прокси (`/.netlify/functions/weather` и Express `/api/weather`). API-ключи хранятся в переменных окружения сервера (`OPENWEATHER_API_KEY`) и никогда не раскрываются в клиентский браузерный код.
* **Статус:** Закрыто, покрыто unit-тестами `tests/api-key.test.mjs` и `tests/netlify-function.test.mjs`.

### [P2] Настройка Content-Security-Policy (CSP) в Service Worker и Netlify — УСТРАНЕНО
* **Файл:** `netlify.toml`, `src/server.js`
* **Механика проблемы:**
  Отсутствовали строгие заголовки `Content-Security-Policy`, ограничивающие домены источников скриптов, стилей и сетевых соединений.
* **Решение:**
  - В `netlify.toml` и в Express `createApp` (`src/server.js`) внедрен заголовок `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.open-meteo.com https://api.openweathermap.org; img-src 'self' data: https:; font-src 'self'; frame-ancestors 'none'; base-uri 'self';`.
  - Установлены заголовки `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)`.
  - Покрыто тестами в `tests/server.test.mjs`.

---

## 2. Пошаговый план устранения (Hardening Plan)

- [x] **Шаг 1 (P2): Проксирование запросов к погоде через Netlify Functions**
  - API-ключи погодного провайдера изолированы на стороне backend/functions Netlify и защищены от утечки в браузер.
- [x] **Шаг 2 (P2): Внедрение CSP заголовков**
  - Добавлены строгие заголовки CSP, HSTS, X-Content-Type-Options, X-Frame-Options и Referrer-Policy в `netlify.toml` и `src/server.js`.
