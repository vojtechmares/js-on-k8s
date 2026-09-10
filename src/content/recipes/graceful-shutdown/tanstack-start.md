---
title: Graceful shutdown with TanStack Start and Nitro
description: Nitro's node server drains in-flight requests on SIGTERM. Tune its timeout and add readiness in the server entry.
order: 7
tags: [tanstack, nitro, signals, shutdown]
updated: 2026-09-10
example: examples/tanstack-start
---

The `node-server` preset of Nitro listens for `SIGTERM` and `SIGINT`, stops
accepting connections, waits for in-flight requests, and exits. You configure it
with environment variables and add readiness in the server entry.

## Environment

```yaml
env:
  - name: NITRO_SHUTDOWN_TIMEOUT
    value: "10000"   # ms to wait for in-flight requests, default 30000
```

Keep `preStop` sleep + `NITRO_SHUTDOWN_TIMEOUT` below `terminationGracePeriodSeconds`.

## Readiness in the server entry

`src/server.ts` is evaluated once at startup, so it is the place for process-level code.

```ts
// src/server.ts
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { state } from "./lib/state";

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    state.ready = false; // /api/readyz starts returning 503
  });
}

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
```

```ts
// src/routes/api/readyz.ts
import { createFileRoute } from "@tanstack/react-router";
import { state } from "../../lib/state";

export const Route = createFileRoute("/api/readyz")({
  server: {
    handlers: {
      GET: () => new Response(state.ready ? "ready" : "not ready", { status: state.ready ? 200 : 503 }),
    },
  },
});
```

## Notes

- `NITRO_SHUTDOWN_SIGNALS` (default `SIGINT SIGTERM`) and `NITRO_SHUTDOWN_DISABLED=true` exist, but you should not need them.
- Close database pools in a Nitro plugin's `close` hook, or in your own listener before Nitro's timeout fires.
- Containerizing TanStack Start is its own recipe: [Containerize a TanStack Start app with Nitro](/recipes/container-images/tanstack-start).
