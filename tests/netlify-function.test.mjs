import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { handler } = require("../netlify/functions/weather")

const originalFetch = global.fetch
const originalApiKey = process.env.OPENWEATHER_API_KEY

beforeEach(() => {
  process.env.OPENWEATHER_API_KEY = "test-key"
})

afterEach(() => {
  global.fetch = originalFetch
  process.env.OPENWEATHER_API_KEY = originalApiKey
})

describe("netlify weather function", () => {
  it("returns weather payload", async () => {
    global.fetch = async (url) => {
      if (url.includes("/weather?")) {
        return { ok: true, json: async () => ({ name: "Tbilisi" }) }
      }
      return {
        ok: true,
        json: async () => ({ current: { temp: 11 }, daily: [{}, {}, {}] }),
      }
    }

    const response = await handler({ queryStringParameters: { lat: "41.7", lon: "44.8" } })
    const payload = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(payload.currentData.name).toBe("Tbilisi")
    expect(payload.forecastData.current.temp).toBe(11)
  })

  it("returns 400 for invalid coordinates", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({}) })

    const response = await handler({ queryStringParameters: { lat: "200", lon: "44.8" } })
    expect(response.statusCode).toBe(400)
  })
})
