---
title: Graceful shutdown with Next.js
description: The standalone server already handles SIGTERM. Add readiness and cleanup around it, do not replace it.
order: 6
tags: [nextjs, signals, shutdown]
updated: 2026-09-10
example: examples/nextjs
---

The Next.js production server installs its own `SIGTERM` and `SIGINT` handlers.
It stops accepting connections, finishes in-flight requests and pending `after()`
callbacks, then exits. Leave that in place and add what Kubernetes needs around it.

## Readiness and cleanup

`instrumentation.ts` runs once when the server starts. Register extra listeners there;
they run next to the built-in ones.

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { state } = await import("./lib/state");

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      state.ready = false; // /api/readyz starts returning 503
      // Synchronous cleanup only: Next.js exits as soon as the server is closed.
    });
  }
}
```

```ts
// app/api/readyz/route.ts
import { state } from "@/lib/state";

export const dynamic = "force-dynamic";
export function GET() {
  return new Response(state.ready ? "ready" : "not ready", { status: state.ready ? 200 : 503 });
}
```

## Pod spec

```yaml
terminationGracePeriodSeconds: 30
containers:
  - name: web
    lifecycle:
      preStop:
        sleep:
          seconds: 5
    readinessProbe:
      httpGet: { path: /api/readyz, port: http }
      periodSeconds: 5
```

## Notes

- Need asynchronous cleanup, such as draining a queue? Set `NEXT_MANUAL_SIG_HANDLE=true`. Next.js then installs no handlers and you own the whole shutdown, including calling `process.exit()`.
- `next start` and the standalone `server.js` behave the same way. `npm run start` in the image does not: see [run node directly](/recipes/run-node-directly).
- Containerizing Next.js is its own recipe: [Containerize a Next.js app](/recipes/container-images/nextjs).
