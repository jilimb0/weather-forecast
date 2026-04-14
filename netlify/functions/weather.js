const { fetchWeatherPayload, mapApiError, randomId } = require("../../src/weather-service");

exports.handler = async (event) => {
  const requestId =
    event.headers?.["x-request-id"] || event.headers?.["X-Request-Id"] || randomId();

  const ipAddress =
    event.headers?.["x-nf-client-connection-ip"] ||
    event.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
    "unknown";

  try {
    const { lat, lon } = event.queryStringParameters || {};

    const payload = await fetchWeatherPayload({
      apiKey: process.env.OPENWEATHER_API_KEY,
      lat,
      lon,
      fetchImpl: fetch,
      ipAddress,
      requestId,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
      },
      body: JSON.stringify(payload),
    };
  } catch (error) {
    const mapped = mapApiError(error, requestId);

    console.error(
      JSON.stringify({
        level: "error",
        msg: "netlify_weather_error",
        requestId,
        code: mapped.body.code,
        details: error.details || null,
      }),
    );

    return {
      statusCode: mapped.statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapped.body),
    };
  }
};
