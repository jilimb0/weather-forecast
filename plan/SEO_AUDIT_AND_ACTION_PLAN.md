# План SEO-оснащения и PWA метаданных: Weather Forecast Pro

> **Текущий SEO-скор:** 50 / 100 (⚪ Чистый семантический HTML5, отсутствует социальная и поисковая обвязка)  
> **Дата аудита:** Октябрь 2026  
> **Роль в экосистеме:** Локальный погодный PWA-сервис с почасовым и суточным прогнозом  
> **Стек:** Чистый HTML5 + CSS3 + Vanilla JavaScript (ESM)  
> **Глобальный план:** [GLOBAL_SEO_OPTIMIZATION_PLAN.md](file:///Users/jilimbo/Documents/Personal/GLOBAL_SEO_OPTIMIZATION_PLAN.md)

---

## 1. Сильные стороны текущей реализации

* **Идеальная семантика документа:** `<header>`, `<main id="app">`, `<section>`, `<form>`, `<skip-link>`.
* **Доступность (A11y / ARIA):** `aria-live="polite"`, `aria-busy`, `role="status"`, `aria-autocomplete`.
* **Быстродействие и Core Web Vitals:** Чистый ESM без фреймворков, скрипты с `defer`, высокий Lighthouse Score.

---

## 2. Точки роста

### [P1] Отсутствие Open Graph и Twitter Cards
* При отправке ссылки в мессенджеры нет превью-карточки.

### [P1] Отсутствие `robots.txt` и `sitemap.xml`
* Нет карты сайта и инструкций для поисковых ботов.

### [P2] Отсутствие Schema.org разметки
* Нет структурированных данных о приложении (`WebApplication`).

---

## 3. Пошаговый план внедрения (Action Plan)

- [x] **Шаг 1: Добавление метаданных Open Graph, Twitter и Canonical в `index.html`**
  ```html
  <link rel="canonical" href="https://weather-forecast.app/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Weather Forecast Pro — Погода в реальном времени" />
  <meta property="og:description" content="Быстрый, приватный и точный почасовой прогноз погоды без рекламы. Работает офлайн как PWA." />
  <meta property="og:image" content="https://weather-forecast.app/assets/og-weather.png" />
  <meta name="twitter:card" content="summary_large_image" />
  ```

- [x] **Шаг 2: Создание `robots.txt` и `sitemap.xml`**
  - Разрешить индексацию главной страницы.

- [x] **Шаг 3: Внедрение Schema.org `WebApplication`**
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Weather Forecast Pro",
    "applicationCategory": "WeatherApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "offers": { "@type": "Offer", "price": "0" }
  }
  </script>
  ```
