require("dotenv").config();

const { createApp } = require("./server");

const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.OPENWEATHER_API_KEY;

const app = createApp({ apiKey });

app.listen(port, () => {
  console.log(`Weather app server listening on http://localhost:${port}`);
});
