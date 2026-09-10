---
title: Graceful shutdown with Elysia
description: Elysia runs on Bun. Call app.stop() on SIGTERM and ship it in the Bun distroless image.
order: 6
tags: [elysia, bun, signals, shutdown]
updated: 2026-09-10
example: examples/frameworks/elysia
---

Elysia wraps `Bun.serve()`. `app.stop()` stops accepting connections and lets
in-flight requests finish. Signals reach Bun the same way they reach Node.js:
only if Bun is PID 1.

```ts
import { Elysia } from "elysia";

let ready = false;

const app = new Elysia()
  .get("/healthz", () => "ok")
  .get("/readyz", ({ set }) => {
    set.status = ready ? 200 : 503;
    return ready ? "ready" : "not ready";
  })
  .get("/", () => ({ message: "hello" }))
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: "0.0.0.0" }, () => {
    ready = true;
  });

async function shutdown(signal: string) {
  console.log(JSON.stringify({ level: "info", msg: `${signal} received` }));
  ready = false;
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.stop();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

## Dockerfile

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src

FROM oven/bun:1-distroless
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/src ./src
USER nonroot
EXPOSE 3000
# ENTRYPOINT is ["bun"] in the image, so this is `bun src/server.ts`.
CMD ["src/server.ts"]
```

## Notes

- `app.stop(true)` closes active connections immediately. Do not pass `true` on SIGTERM.
- Bun runs TypeScript directly, so there is no build stage for the code itself.
- Elysia has a Node.js adapter (`@elysiajs/node`) if you need to stay on Node.js. Then the Node.js recipes apply.
