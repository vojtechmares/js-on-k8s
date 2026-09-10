---
title: Graceful shutdown with Express
description: app.listen() returns a plain Node.js http.Server. Close that, not the app.
order: 1
tags: [express, signals, shutdown]
updated: 2026-09-10
example: examples/frameworks/express
---

Express has no shutdown API of its own. `app.listen()` returns the underlying
`http.Server`, and that is what you close.

```js
import express from "express";

const app = express();
let ready = false;

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/readyz", (req, res) => res.status(ready ? 200 : 503).send(ready ? "ready" : "not ready"));
app.get("/", (req, res) => res.json({ message: "hello" }));

const server = app.listen(process.env.PORT ?? 3000, () => {
  ready = true;
});

function shutdown(signal) {
  ready = false;
  server.close((err) => process.exit(err ? 1 : 0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

## Notes

- Do not keep the `app.listen()` return value in a variable you never use. It is the only handle you get.
- Close database pools in the `server.close()` callback, before `process.exit()`.
- Express 5 handles rejected promises in async handlers. On Express 4 add an error middleware, or an unhandled rejection on shutdown can mask the exit code.
- The signal handling, timeouts and Pod spec are the same as in [graceful shutdown](/recipes/graceful-shutdown).
