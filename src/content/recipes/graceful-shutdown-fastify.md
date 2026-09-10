---
title: Graceful shutdown with Fastify
description: Use app.close() with forceCloseConnections and onClose hooks, and listen on 0.0.0.0.
order: 4
tags: [fastify, signals, shutdown]
updated: 2026-09-10
example: examples/frameworks/fastify
---

Fastify has a real lifecycle. `app.close()` stops the server, waits for in-flight
requests, then runs every `onClose` hook in reverse registration order.

```js
import Fastify from "fastify";

const app = Fastify({
  logger: true,
  // Close idle keep-alive connections on app.close(), keep in-flight ones.
  forceCloseConnections: "idle",
});

let ready = false;

app.get("/healthz", async () => "ok");
app.get("/readyz", async (req, reply) => {
  reply.code(ready ? 200 : 503);
  return ready ? "ready" : "not ready";
});
app.get("/", async () => ({ message: "hello" }));

// Runs after in-flight requests finish. Close pools and clients here.
app.addHook("onClose", async () => {
  app.log.info("closing resources");
});

async function shutdown(signal) {
  app.log.info({ signal }, "shutting down");
  ready = false;
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.close();
  process.exit(0);
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

// Fastify binds to localhost by default. Containers need 0.0.0.0.
await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
ready = true;
```

## Notes

- `host: "0.0.0.0"` is the most common reason a Fastify container passes locally and fails its probes in a Pod.
- `close-with-grace` from the Fastify maintainers wraps the signal handling and the deadline in one call, if you prefer a dependency.
- Plugins such as `@fastify/postgres` register their own `onClose` hooks. You rarely need to close clients by hand.
- `@fastify/under-pressure` adds an event-loop-aware health route if you want more than a static `ok`.
