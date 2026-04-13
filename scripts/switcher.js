const switchMode = document.getElementById("theme-switcher")
const themeLink = document.getElementById("theme")
const THEME_STORAGE_KEY = "weather_theme"

function applyTheme(themeName) {
  const href = themeName === "dark" ? "./style/darkmode.css" : "./style/lightmode.css"
  const buttonLabel = themeName === "dark" ? "Light" : "Dark"

  themeLink.setAttribute("href", href)
  switchMode.textContent = buttonLabel
}

const initialTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || "light"
applyTheme(initialTheme)

switchMode.addEventListener("click", () => {
  const isLight = themeLink.getAttribute("href") === "./style/lightmode.css"
  const nextTheme = isLight ? "dark" : "light"

  applyTheme(nextTheme)
  window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
})
