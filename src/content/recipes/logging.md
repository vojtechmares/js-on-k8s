---
title: Log JSON lines to stdout
description: One JSON object per line on stdout. No files, no log rotation, no agents inside the container.
order: 9
section: measure
tags: [logging, observability, pino]
updated: 2026-09-10
example: examples/full/src/log.js
---

Kubernetes collects whatever a container writes to stdout and stderr. Log there,
in a format that machines parse and humans can still read with `jq`.

## Without dependencies

```js
// src/log.js
export const log = (level, msg, fields = {}) =>
  process.stdout.write(
    JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }) + "\n",
  );
```

## With pino

```js
import pino from "pino";
export const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
log.info({ port: 3000 }, "listening");
```

Pino writes JSON lines, is fast, and has no pretty-printing in production unless
you add it. Use `pino-pretty` only on your laptop.

## Notes

- `console.log` is synchronous when stdout is a pipe on Linux. Under heavy logging it
  blocks the event loop. Pino is asynchronous by default.
- Do not log probe requests. Filter `/healthz` and `/readyz` out of request logging.
- Put the request ID in every line of a request. Read it from the `traceparent` or
  `x-request-id` header set by your ingress.
- Do not write log files. The container has a
  [read-only root filesystem](/recipes/manifests) and files vanish with the Pod.
