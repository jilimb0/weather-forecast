const { geocodeCity, mapApiError, randomId } = require("../../src/weather-service");

exports.handler = async (event) => {
  const requestId = event.headers?.["x-request-id"] || randomId();

  try {
    const q = event.queryStringParameters?.q || "";
    const results = await geocodeCity({
      apiKey: process.env.OPENWEATHER_API_KEY,
      query: q,
      fetchImpl: fetch,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ results, requestId }),
    };
  } catch (error) {
    const mapped = mapApiError(error, requestId);
    return {
      statusCode: mapped.statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapped.body),
    };
  }
};
