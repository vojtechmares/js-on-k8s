---
title: Containerize a Hono API
description: A Hono service on the Node.js adapter, built in two stages into a distroless image, with the Bun variant alongside.
order: 5
tags: [hono, dockerfile, api, distroless, bun]
updated: 2026-09-10
example: examples/frameworks/hono
---

Hono is small and runtime-agnostic, which makes its image the simplest case:
the runtime, `hono`, the adapter, and your code.

## Application

```js
// src/server.js
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
app.get("/healthz", (c) => c.text("ok"));
app.get("/", (c) => c.json({ message: "hello" }));

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000), hostname: "0.0.0.0" });
```

## Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY src ./src

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/src ./src
EXPOSE 3000
CMD ["src/server.js"]
```

## TypeScript

Compile in the build stage and copy `dist/` instead of `src/`. Do not ship
`tsx` or `ts-node` into the runtime stage; startup time and image size both pay
for it, and the distroless image has no room for a compiler anyway.

```dockerfile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev
# ...
COPY --from=build --chown=nonroot:nonroot /app/dist ./dist
CMD ["dist/server.js"]
```

## Bun

Same app, `Bun.serve()` instead of the Node.js adapter, and the Bun images:

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src

FROM oven/bun:1-distroless
WORKDIR /app
COPY --from=build --chown=nonroot:nonroot /app ./
USER nonroot
CMD ["src/server.ts"]
```

## Notes

- `hostname: "0.0.0.0"` in `serve()`. The adapter defaults to all interfaces, but be explicit; Fastify users have been bitten by the opposite default.
- Health and readiness routes come before any middleware that needs a database.
- Shutdown handling for Hono is in [graceful shutdown with Hono](/recipes/graceful-shutdown/hono/).
