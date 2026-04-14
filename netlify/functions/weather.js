const { fetchWeatherPayload } = require("../../src/weather-service");

exports.handler = async (event) => {
  try {
    const { lat, lon } = event.queryStringParameters || {};
    const data = await fetchWeatherPayload({
      apiKey: process.env.OPENWEATHER_API_KEY,
      lat,
      lon,
      fetchImpl: fetch,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    const statusCode = error.statusCode || (error.message?.includes("must be") ? 400 : 500);

    return {
      statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal server error" }),
    };
  }
};
