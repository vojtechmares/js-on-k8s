---
title: Kubernetes probes done right
description: Liveness restarts, readiness routes. Give them different endpoints, keep dependencies out, and use readiness to shed load.
order: 5
section: run
tags: [probes, liveness, readiness, startup, kubernetes]
updated: 2026-09-10
example: examples/full/src/server.js
---

Kubernetes asks your container three questions and reacts differently to each
answer. Most probe problems come from answering all three with the same endpoint.

| Probe       | Question                        | On failure                          |
| ----------- | ------------------------------- | ----------------------------------- |
| `startup`   | Has the process finished booting? | Keep waiting, then restart        |
| `liveness`  | Is the process stuck for good?  | Restart the container               |
| `readiness` | Can this Pod take traffic now?  | Remove the Pod from Service endpoints |

## Liveness and readiness are not the same

Liveness is a last resort. It should fail only when a restart is the right fix:
a deadlocked event loop, a process that will never recover. Readiness is a routing
decision that changes every few seconds: starting up, shutting down, overloaded,
waiting for a cache to warm.

If one endpoint answers both, every temporary "not ready" becomes a restart.
Under load, a slow response to liveness kills a healthy Pod, its traffic lands on
the others, they slow down too, and the cluster restarts its way into an outage.

```js
app.get("/healthz", (req, res) => res.send("ok"));                         // liveness
app.get("/readyz", (req, res) => res.status(ready ? 200 : 503).send(""));  // readiness
```

## Probes must not depend on other services

Do not ping the database, Redis, or a downstream API from a probe.

- In liveness it is plain wrong: restarting your Pod does not fix their database.
  All replicas fail at once, and the restart storm hides the real incident.
- In readiness it is usually wrong too. A degraded cache makes every Pod unready,
  the Service has no endpoints, and users get connection errors instead of slower
  responses. Handle a missing dependency in the request path: return an error,
  serve stale data, degrade.

Readiness may reflect state your own process owns: initialisation finished,
shutdown started, overloaded.

## Readiness as overload protection

Node.js runs one event loop per process. When it falls behind, every request
gets slower, including the probes. Measure the lag and act before Kubernetes does.

```js
import { monitorEventLoopDelay } from "node:perf_hooks";

const loop = monitorEventLoopDelay({ resolution: 20 });
loop.enable();

let inFlight = 0;
const MAX_IN_FLIGHT = 200;
const MAX_LAG_MS = 200;

const overloaded = () => inFlight > MAX_IN_FLIGHT || loop.percentile(99) / 1e6 > MAX_LAG_MS;

function handler(req, res) {
  if (req.url === "/readyz") {
    const ok = ready && !overloaded();
    res.writeHead(ok ? 200 : 503).end(ok ? "ready" : "not ready");
    return;
  }
  if (overloaded()) {
    res.writeHead(503, { "retry-after": "1" }).end("overloaded");
    return;
  }
  inFlight++;
  res.on("finish", () => inFlight--);
  // ...
}
```

Two layers: reject excess requests with 503 immediately, and report "not ready"
so the Service stops sending more. Pair it with a HorizontalPodAutoscaler, so
shedding buys time for new replicas instead of hiding the need for them.

Fastify users get this from `@fastify/under-pressure`. Keep the thresholds
above what a healthy Pod does under normal load, or readiness flaps.

## Startup probe

A startup probe gives a slow boot time to finish before liveness starts
counting. It should be a no-op for JavaScript: bundle, compile TypeScript, and
generate clients at build time, run migrations in a Job, not in `main()`.

Boot should take milliseconds. If it does not, add the probe and fix the boot.

```yaml
startupProbe:
  httpGet: { path: /healthz, port: http }
  periodSeconds: 2
  failureThreshold: 30   # up to 60 s
```

## Pod spec

```yaml
containers:
  - name: app
    ports:
      - name: http
        containerPort: 3000
    livenessProbe:
      httpGet: { path: /healthz, port: http }
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet: { path: /readyz, port: http }
      periodSeconds: 5
      failureThreshold: 2
      successThreshold: 1
```

## Notes

- Liveness with `failureThreshold: 3` and `periodSeconds: 10` restarts after 30 s of silence. Do not make it faster.
- Do not log probe requests. They drown the real traffic.
- Flip readiness to 503 as the first step of [graceful shutdown](/recipes/graceful-shutdown/).
- Probes run from the kubelet on the node, not through the Service. A `NetworkPolicy` must not block them; see [networking](/recipes/networking/).
