const chokidar = require("chokidar");

const WATCH_GLOBS = [
  "index.html",
  "scripts/**/*.{js,mjs}",
  "style/**/*.css",
  "src/**/*.js",
  "netlify/**/*.js",
  "manifest.webmanifest",
  "sw.js",
];

function createLiveReload({ rootDir }) {
  const clients = new Set();

  const watcher = chokidar.watch(WATCH_GLOBS, {
    cwd: rootDir,
    ignored: ["node_modules/**", ".git/**"],
    ignoreInitial: true,
  });

  const broadcastReload = (reasonPath) => {
    const payload = `data: ${JSON.stringify({ type: "reload", path: reasonPath })}\n\n`;
    for (const client of clients) {
      client.write(payload);
    }
  };

  watcher.on("all", (_eventName, changedPath) => {
    broadcastReload(changedPath);
  });

  const middleware = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
    clients.add(res);

    req.on("close", () => {
      clients.delete(res);
    });
  };

  const shutdown = async () => {
    await watcher.close();
    for (const client of clients) {
      client.end();
    }
    clients.clear();
  };

  return { middleware, shutdown };
}

module.exports = {
  createLiveReload,
};
