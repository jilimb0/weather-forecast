let switchMode = document.getElementById("theme-switcher")

switchMode.addEventListener("click", () => {
  let theme = document.getElementById("theme")

  theme.getAttribute("href") === "./style/lightmode.css"
    ? (theme.href = "./style/darkmode.css")((switchMode.textContent = "Light"))
    : (theme.href = "./style/lightmode.css")((switchMode.textContent = "Dark"))
})
