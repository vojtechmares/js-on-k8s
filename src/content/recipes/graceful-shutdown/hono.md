---
title: Graceful shutdown with Hono
description: Hono is runtime-agnostic. Close the server the adapter gave you, on Node or on Bun.
order: 3
tags: [hono, signals, shutdown, bun]
updated: 2026-09-10
example: examples/frameworks/hono
---

Hono only routes requests. Listening and shutting down belong to the runtime
adapter, so the shutdown code depends on where you run it.

## Node.js

`serve()` from `@hono/node-server` returns a Node.js `http.Server`.

```js
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
let ready = false;

app.get("/healthz", (c) => c.text("ok"));
app.get("/readyz", (c) => c.text(ready ? "ready" : "not ready", ready ? 200 : 503));
app.get("/", (c) => c.json({ message: "hello" }));

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000), hostname: "0.0.0.0" }, () => {
  ready = true;
});

function shutdown() {
  ready = false;
  server.close((err) => process.exit(err ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Bun

`Bun.serve()` returns a server whose `stop()` waits for in-flight requests by default.

```ts
const server = Bun.serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000) });

async function shutdown() {
  ready = false;
  setTimeout(() => process.exit(1), 10_000).unref();
  await server.stop();
  process.exit(0);
}
```

## Notes

- On Node.js 18, add `server.closeIdleConnections()` after `server.close()`. Node.js 19 and newer do it for you.
- `server.stop(true)` on Bun kills in-flight requests. Leave the argument out.
- Deno: pass an `AbortSignal` to `Deno.serve()` and abort it in the handler.
