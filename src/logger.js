const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

function serialize(args) {
  return args
    .map((a) => {
      if (a instanceof Error)
        return JSON.stringify({ message: a.message, stack: a.stack, name: a.name });
      if (typeof a === "object" && a !== null) return JSON.stringify(a);
      return String(a);
    })
    .join(" ");
}

function log(level, ...args) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;
  const timestamp = new Date().toISOString();
  const message = serialize(args);
  const output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

module.exports = {
  debug: (...args) => log("debug", ...args),
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
};
