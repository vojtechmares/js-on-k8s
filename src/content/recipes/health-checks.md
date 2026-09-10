---
title: Liveness, readiness and startup probes
description: Separate "is the process alive" from "can it take traffic", and flip readiness first on shutdown.
order: 3
tags: [probes, http, kubernetes]
updated: 2026-09-10
example: examples/full/src/server.js
---

Kubernetes has three probes and they answer different questions. Answer each with a
different endpoint.

| Probe       | Question                     | On failure               |
| ----------- | ---------------------------- | ------------------------ |
| `startup`   | Has the app finished booting?| Wait, then restart       |
| `liveness`  | Is the process stuck?        | Restart the container    |
| `readiness` | Can it take traffic now?     | Remove from Service      |

## Endpoints

```js
let ready = false;

function handler(req, res) {
  if (req.url === "/healthz") {
    // Liveness: the event loop is running. Do not check dependencies here.
    res.writeHead(200).end("ok");
    return;
  }
  if (req.url === "/readyz") {
    // Readiness: dependencies are up and we are not shutting down.
    res.writeHead(ready ? 200 : 503).end(ready ? "ready" : "not ready");
    return;
  }
  // ... application routes
}

// after connecting to the database, warming caches, etc.
ready = true;

process.on("SIGTERM", () => {
  ready = false; // fail readiness first, then close the server
});
```

## Pod spec

```yaml
containers:
  - name: app
    ports:
      - name: http
        containerPort: 3000
    startupProbe:
      httpGet: { path: /healthz, port: http }
      failureThreshold: 30
      periodSeconds: 2
    livenessProbe:
      httpGet: { path: /healthz, port: http }
      periodSeconds: 10
    readinessProbe:
      httpGet: { path: /readyz, port: http }
      periodSeconds: 5
      failureThreshold: 2
```

## Notes

- Liveness must not call the database. A slow database would restart every Pod at once.
- Readiness may check dependencies, but keep it cheap. It runs every few seconds on every Pod.
- Do not log probe requests. They drown real traffic in the logs.
- A `startupProbe` replaces `initialDelaySeconds` guesses and protects slow boots.
