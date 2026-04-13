function setStatus(message, isError = false) {
  const statusEl = document.getElementById("status")
  if (!statusEl) return

  statusEl.textContent = message
  statusEl.classList.toggle("error", isError)
}

function toFahrenheit(celsius) {
  return celsius * 1.8 + 32
}

function bindUnitToggle(containerSelector, valueCelsius) {
  const button = document.querySelector(containerSelector)
  if (!button) return

  const valueNode = button.querySelector("h2")
  const unitNode = button.querySelector("span")
  if (!valueNode || !unitNode) return

  button.addEventListener("click", () => {
    const isCelsius = unitNode.textContent === "C"
    if (isCelsius) {
      unitNode.textContent = "F"
      valueNode.textContent = toFahrenheit(valueCelsius).toFixed(1)
    } else {
      unitNode.textContent = "C"
      valueNode.textContent = Math.round(valueCelsius)
    }
  })
}

function setIcons(icon, iconId) {
  if (!iconId || typeof Skycons === "undefined") return

  const iconMap = {
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
  }

  const mappedIcon = iconMap[icon] || "partly-cloudy-day"
  const currentIcon = mappedIcon.replace(/-/g, "_").toUpperCase()

  const skycons = new Skycons({ color: "white" })
  skycons.play()
  skycons.set(iconId, Skycons[currentIcon])
}

async function fetchWeatherFromServer(latitude, longitude) {
  const endpoint = `/api/weather?lat=${latitude}&lon=${longitude}`

  const response = await fetch(endpoint)

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`

    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch (_error) {
      // Ignore JSON parse errors and return default message.
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

function updateLocations(name) {
  const locationNodes = document.querySelectorAll(".location-timezone")
  locationNodes.forEach((node) => {
    node.textContent = name
  })
}

function applyWeatherData(forecastData) {
  const todayTemp = forecastData.current.temp
  const todayFeelsLike = forecastData.current.feels_like
  const tomorrowTemp = forecastData.daily[1].temp.day
  const tomorrowFeelsLike = forecastData.daily[1].feels_like.day
  const datTemp = forecastData.daily[2].temp.day
  const datFeelsLike = forecastData.daily[2].feels_like.day

  document.querySelector(".temperature-degree.today").textContent = Math.round(todayTemp)
  document.querySelector(".temperature-feels-like.today").textContent = Math.round(todayFeelsLike)
  document.querySelector(".temperature-degree.tomorrow").textContent = Math.round(tomorrowTemp)
  document.querySelector(".temperature-feels-like.tomorrow").textContent = Math.round(tomorrowFeelsLike)
  document.querySelector(".temperature-degree.day-after-tomorrow").textContent = Math.round(datTemp)
  document.querySelector(".temperature-feels-like.day-after-tomorrow").textContent = Math.round(datFeelsLike)

  setIcons(forecastData.current.weather[0].main, document.querySelector("#icon-today"))
  setIcons(forecastData.daily[1].weather[0].main, document.querySelector("#icon-tomorrow"))
  setIcons(forecastData.daily[2].weather[0].main, document.querySelector("#icon-day-after-tomorrow"))

  bindUnitToggle(".degree-section.today", todayTemp)
  bindUnitToggle(".degree-feels-like-section.today", todayFeelsLike)
  bindUnitToggle(".degree-section.tomorrow", tomorrowTemp)
  bindUnitToggle(".degree-feels-like-section.tomorrow", tomorrowFeelsLike)
  bindUnitToggle(".degree-section.day-after-tomorrow", datTemp)
  bindUnitToggle(".degree-feels-like-section.day-after-tomorrow", datFeelsLike)
}

function getCurrentPositionAsync() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })
  })
}

window.addEventListener("load", async () => {
  const main = document.getElementById("weather-main")

  try {
    if (main) main.setAttribute("aria-busy", "true")
    setStatus("Requesting location permission...")
    const position = await getCurrentPositionAsync()

    setStatus("Loading weather data...")
    const payload = await fetchWeatherFromServer(
      position.coords.latitude,
      position.coords.longitude
    )

    updateLocations(payload.currentData.name || "Unknown")
    applyWeatherData(payload.forecastData)
    setStatus("Weather loaded")
  } catch (error) {
    console.error(error)
    setStatus(`Unable to load weather: ${error.message}`, true)
  } finally {
    if (main) main.setAttribute("aria-busy", "false")
  }
})
