---
title: Containerize a TanStack Start app with Nitro
description: Add the Nitro Vite plugin, build a node-server bundle into .output, and run the entry with node in a distroless image.
order: 14
tags: [tanstack, react, nitro, vite, dockerfile]
updated: 2026-09-10
example: examples/tanstack-start
---

TanStack Start builds with Vite. The Nitro plugin turns the server side into a
self-contained Node.js bundle with its own graceful shutdown, so the Dockerfile
copies one folder.

## vite.config.ts

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro({ preset: "node-server" }), viteReact()],
});
```

`vite build` emits `.output/server/index.mjs` and `.output/public`.

## Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build --chown=nonroot:nonroot /app/.output ./.output
EXPOSE 3000
CMD [".output/server/index.mjs"]
```

## Health route

```ts
// src/routes/api/healthz.ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/healthz")({
  server: {
    handlers: {
      GET: () => new Response("ok"),
    },
  },
});
```

## Notes

- Nitro's node server listens on `PORT` and `HOST`, handles `SIGTERM` and `SIGINT`, and waits for in-flight requests up to `NITRO_SHUTDOWN_TIMEOUT` (default 30000 ms). Keep that below `terminationGracePeriodSeconds`.
- Runtime config: Nitro reads `NITRO_*` env vars, everything else is `process.env` in server code.
- `.output` contains a copy of the dependencies it needs. Do not copy `node_modules`.
