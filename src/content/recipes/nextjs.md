---
title: Containerize a Next.js app
description: Build with output standalone, copy three folders into a distroless image, run server.js directly.
order: 8
tags: [nextjs, react, dockerfile, standalone]
updated: 2026-09-10
example: examples/nextjs
---

`output: "standalone"` makes `next build` trace every file a page needs and
write a self-contained server into `.next/standalone`. That folder plus static
assets is the whole runtime.

## next.config.ts

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
};

export default config;
```

## Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=build --chown=nonroot:nonroot /app/public ./public
EXPOSE 3000
CMD ["server.js"]
```

## Health route

```ts
// app/api/healthz/route.ts
export const dynamic = "force-dynamic";
export function GET() {
  return new Response("ok");
}
```

## Notes

- `HOSTNAME=0.0.0.0` matters. The standalone server binds to localhost otherwise.
- The standalone server handles `SIGTERM` itself and finishes in-flight requests.
  Set `NEXT_MANUAL_SIG_HANDLE=true` only if you take over signal handling in `instrumentation.ts`.
- `NEXT_PUBLIC_*` variables are inlined at build time. Everything else is read at runtime, so pass it through the Pod spec.
- ISR and the fetch cache write under `.next` on disk. With more than one replica, configure a shared `cacheHandler`. If you keep `readOnlyRootFilesystem: true`, mount an `emptyDir` at `/app/.next/cache`.
- Image optimization needs `sharp`. Next.js 15 and newer include it in the trace automatically.
