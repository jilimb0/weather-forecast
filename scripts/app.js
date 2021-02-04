window.addEventListener("load", () => {
  let long, lat, todayIcon, tomorrowIcon, DATIcon

  let tempDegreeToday = document.querySelector(".temperature-degree.today")
  let feelsLikeToday = document.querySelector(".temperature-feels-like.today")
  let tempDegreeTomorrow = document.querySelector(
    ".temperature-degree.tomorrow"
  )
  let feelsLikeTomorrow = document.querySelector(
    ".temperature-feels-like.tomorrow"
  )
  let tempDegreeDAT = document.querySelector(
    ".temperature-degree.day-after-tomorrow"
  )
  let feelsLikeDAT = document.querySelector(
    ".temperature-feels-like.day-after-tomorrow"
  )

  let tempSectionToday = document.querySelector(".degree-section.today")
  let feelsLikeSectionToday = document.querySelector(
    ".degree-feels-like-section.today"
  )
  let tempSectionTomorrow = document.querySelector(
    ".temperature-degree.tomorrow"
  )
  let feelsLikeSectionTomorrow = document.querySelector(
    ".temperature-feels-like.tomorrow"
  )
  let tempSectionDAT = document.querySelector(
    ".temperature-degree.day-after-tomorrow"
  )
  let feelsLikeSectionDAT = document.querySelector(
    ".temperature-feels-like.day-after-tomorrow"
  )

  let tempSpanToday = document.querySelector(".degree-section.today span")
  let feelsLikeSpanToday = document.querySelector(
    ".degree-feels-like-section.today span"
  )
  let tempSpanTomorrow = document.querySelector(".degree-section.tomorrow span")
  let feelsLikeSpanTomorrow = document.querySelector(
    ".degree-feels-like-section.tomorrow span"
  )
  let tempSpanDAT = document.querySelector(
    ".degree-section.day-after-tomorrow span"
  )
  let feelsLikeSpanDAT = document.querySelector(
    ".degree-feels-like-section.day-after-tomorrow span"
  )

  // let tempDescr = document.querySelector(".temperature-description")

  let location1 = document.querySelector(".location-timezone1")
  let location2 = document.querySelector(".location-timezone2")
  let location3 = document.querySelector(".location-timezone3")

  navigator.geolocation
    ? navigator.geolocation.getCurrentPosition((position) => {
        long = position.coords.longitude
        lat = position.coords.latitude
        const api = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&units=metric&appid=422966cfe87d86a464cecdd3bfde88d7`
        const apiForecast = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&units=metric&appid=422966cfe87d86a464cecdd3bfde88d7`

        fetch(api)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            console.log(data)

            location1.textContent = location2.textContent = location3.textContent =
              data.name
          })

        fetch(apiForecast)
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            console.log(data)

            // location1.textContent = location2.textContent = location3.textContent =
            //   data.timezone

            // const { description, main } = data.current.weather[0]
            // tempDescrToday.textContent = description

            todayIcon = data.current.weather[0].main
            tomorrowIcon = data.daily[1].weather[0].main
            DATIcon = data.daily[2].weather[0].main

            const { feels_like, temp } = data.current
            tempDegreeToday.textContent = Math.round(temp)
            feelsLikeToday.textContent = Math.round(feels_like)

            let tempTomorrow = data.daily[1].temp.day
            let feelsTomorrow = data.daily[1].feels_like.day
            tempDegreeTomorrow.textContent = Math.round(tempTomorrow)
            feelsLikeTomorrow.textContent = Math.round(feelsTomorrow)

            let tempDAT = data.daily[2].temp.day
            let feelsDAT = data.daily[2].feels_like.day
            tempDegreeDAT.textContent = Math.round(tempDAT)
            feelsLikeDAT.textContent = Math.round(feelsDAT)

            //SetIcon
            setIcons(todayIcon, document.querySelector("#icon-today"))
            setIcons(tomorrowIcon, document.querySelector("#icon-tomorrow"))
            setIcons(
              DATIcon,
              document.querySelector("#icon-day-after-tomorrow")
            )

            //change temperature to C or F
            //Formula T(°F) = T(°C) × 1.8 + 32

            let farengeitToday = temp * 1.8 + 32
            let farengeitFeelsLikeToday = feels_like * 1.8 + 32
            let farengeitTomorrow = tempTomorrow * 1.8 + 32
            let farengeitFeelsLikeTomorrow = feelsTomorrow * 1.8 + 32
            let farengeitDAT = tempDAT * 1.8 + 32
            let farengeitFeelsLikeDAT = feelsDAT * 1.8 + 32

            tempSectionToday.addEventListener("click", () => {
              tempSpanToday.textContent === "C"
                ? (tempSpanToday.textContent = "F")(
                    (tempDegreeToday.textContent = farengeitToday.toFixed(2))
                  )
                : tempSpanToday.textContent === "F"
                ? (tempSpanToday.textContent = "C")(
                    (tempDegreeToday.textContent = Math.round(temp))
                  )
                : tempSpanToday.textContent === "F"
            })
            feelsLikeSectionToday.addEventListener("click", () => {
              feelsLikeSpanToday.textContent === "C"
                ? (feelsLikeSpanToday.textContent = "F")(
                    (feelsLikeToday.textContent = farengeitFeelsLikeToday.toFixed(
                      2
                    ))
                  )
                : feelsLikeSpanToday.textContent === "F"
                ? (feelsLikeSpanToday.textContent = "C")(
                    (feelsLikeToday.textContent = Math.round(feels_like))
                  )
                : feelsLikeSpanToday.textContent === "F"
            })
            tempSectionTomorrow.addEventListener("click", () => {
              tempSpanTomorrow.textContent === "C"
                ? (tempSpanTomorrow.textContent = "F")(
                    (tempDegreeTomorrow.textContent = farengeitTomorrow.toFixed(
                      2
                    ))
                  )
                : tempSpanTomorrow.textContent === "F"
                ? (tempSpanTomorrow.textContent = "C")(
                    (tempDegreeTomorrow.textContent = Math.round(tempTomorrow))
                  )
                : tempSpanTomorrow.textContent === "F"
            })
            feelsLikeSectionTomorrow.addEventListener("click", () => {
              feelsLikeSpanTomorrow.textContent === "C"
                ? (feelsLikeSpanTomorrow.textContent = "F")(
                    (feelsLikeTomorrow.textContent = farengeitFeelsLikeTomorrow.toFixed(
                      2
                    ))
                  )
                : feelsLikeSpanTomorrow.textContent === "F"
                ? (feelsLikeSpanTomorrow.textContent = "C")(
                    (feelsLikeTomorrow.textContent = Math.round(feelsTomorrow))
                  )
                : feelsLikeSpanTomorrow.textContent === "F"
            })
            tempSectionDAT.addEventListener("click", () => {
              tempSpanDAT.textContent === "C"
                ? (tempSpanDAT.textContent = "F")(
                    (tempDegreeDAT.textContent = farengeitDAT.toFixed(2))
                  )
                : tempSpanDAT.textContent === "F"
                ? (tempSpanDAT.textContent = "C")(
                    (tempDegreeDAT.textContent = Math.round(tempDAT))
                  )
                : tempSpanDAT.textContent === "F"
            })
            feelsLikeSectionDAT.addEventListener("click", () => {
              feelsLikeSpanDAT.textContent === "C"
                ? (feelsLikeSpanDAT.textContent = "F")(
                    (feelsLikeDAT.textContent = farengeitFeelsLikeDAT.toFixed(
                      2
                    ))
                  )
                : feelsLikeSpanDAT.textContent === "F"
                ? (feelsLikeSpanDAT.textContent = "C")(
                    (feelsLikeDAT.textContent = Math.round(feelsDAT))
                  )
                : feelsLikeSpanDAT.textContent === "F"
            })
          })
      })
    : (h1.textContent = "hey dis is not working because the reasons")

  function setIcons(icon, iconID) {
    icon === "Clouds"
      ? (icon = "cloudy")
      : icon === "Clear"
      ? (icon = "clear-day")
      : icon === "Mist"
      ? (icon = "fog")
      : "rain"
    const skycons = new Skycons({ color: "white" })
    const currentIcon = icon.replace(/-/g, "_").toUpperCase()
    skycons.play()
    return skycons.set(iconID, Skycons[currentIcon])
  }
})
