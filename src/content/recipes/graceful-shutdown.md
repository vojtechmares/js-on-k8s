---
title: Graceful shutdown on SIGTERM
description: Stop accepting connections, finish in-flight requests, then exit with a deadline.
order: 6
section: run
tags: [signals, shutdown, http]
updated: 2026-09-10
example: examples/full/src/server.js
---

Without a `SIGTERM` handler, Node.js exits immediately and in-flight requests fail.
With a handler that never finishes, Kubernetes waits for `terminationGracePeriodSeconds`
and then kills the process anyway. Do both: handle the signal, and set a deadline.

## Handler

```js
import { createServer } from "node:http";

const server = createServer(handler);
server.listen(process.env.PORT ?? 3000);

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ level: "info", msg: `${signal} received, shutting down` }));

  // 1. Stop accepting new connections, finish in-flight requests.
  server.close((err) => process.exit(err ? 1 : 0));
  // 2. Close idle keep-alive connections so close() can finish.
  server.closeIdleConnections();
  // 3. Hard deadline, shorter than terminationGracePeriodSeconds.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

## Pod spec

```yaml
spec:
  terminationGracePeriodSeconds: 30
  containers:
    - name: app
      lifecycle:
        preStop:
          sleep:
            seconds: 5
```

## Why the preStop sleep

Endpoint removal and `SIGTERM` happen in parallel. For a few seconds after the
signal, kube-proxy and ingress controllers may still route new requests to the Pod.
Sleeping in `preStop` delays the signal until routing has caught up. The `sleep`
action is available since Kubernetes 1.30; use `exec` with `sleep 5` on older clusters,
which requires a shell in the image.

## Notes

- Order of timeouts: `preStop` + app deadline < `terminationGracePeriodSeconds`.
- Also fail the readiness probe as soon as shutdown starts. See [health checks](/recipes/probes).
- Close database pools and flush logs after `server.close()` resolves, before `process.exit()`.
- Since Node.js 19, `server.close()` closes idle keep-alive connections itself. The explicit call keeps older versions working.
- Using a framework or a meta-framework? The recipes below cover Express, Fastify, Hono, Elysia, NestJS, Next.js and TanStack Start.
