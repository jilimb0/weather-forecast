require("dotenv").config();

const path = require("node:path");
const { createApp } = require("./server");
const { createLiveReload } = require("./live-reload");

const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.OPENWEATHER_API_KEY;
const isLocal = process.env.NODE_ENV !== "production";

let liveReload = null;
if (isLocal) {
  liveReload = createLiveReload({ rootDir: path.join(__dirname, "..") });
}

const app = createApp({
  apiKey,
  liveReloadMiddleware: liveReload?.middleware || null,
});

const server = app.listen(port, () => {
  console.log(`Weather app server listening on http://localhost:${port}`);
  if (isLocal) {
    console.log("Live reload enabled on localhost");
  }
});

process.on("SIGINT", async () => {
  if (liveReload) {
    await liveReload.shutdown();
  }
  server.close(() => {
    process.exit(0);
  });
});
