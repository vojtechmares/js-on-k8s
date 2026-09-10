---
title: Telemetry with OpenTelemetry
description: Kubernetes collects nothing about your app. Export logs, metrics and traces yourself, in one standard.
order: 15
tags: [opentelemetry, otel, metrics, traces, logs, observability]
updated: 2026-09-10
example: examples/telemetry
---

Kubernetes knows whether a container runs and how much CPU it burns. It does not
know your request latency, your error rate, or which downstream call was slow.
The kubelet forwards stdout to the node's disk and stops there. Everything else
is your job.

OpenTelemetry (OTel) is the standard for all three signals. Instrument once,
export over OTLP to a collector, and let the collector decide where things go.

## Zero-code instrumentation

```sh
npm install @opentelemetry/auto-instrumentations-node
```

```js
// src/otel.mjs
import { register } from "node:module";

// Lets the SDK patch ESM imports. CommonJS apps can skip this line and
// `--import @opentelemetry/auto-instrumentations-node/register` directly.
register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);

await import("@opentelemetry/auto-instrumentations-node/register");
```

```dockerfile
# node is the ENTRYPOINT in the distroless image
CMD ["--import", "./src/otel.mjs", "src/server.js"]
```

The hook patches `http`, `pg`, `redis`, `pino` and other common modules
before your code loads. Without the loader hook an ESM app only gets the
`fetch` spans, because those come from `diagnostics_channel` and need no
patching. Configuration is environment variables:

```yaml
env:
  - name: OTEL_SERVICE_NAME
    value: app
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://otel-collector.observability:4318
  - name: OTEL_TRACES_EXPORTER
    value: otlp
  - name: OTEL_METRICS_EXPORTER
    value: otlp
  - name: OTEL_LOGS_EXPORTER
    value: otlp
  - name: OTEL_NODE_RESOURCE_DETECTORS
    value: env,host,os,container
  - name: K8S_POD_NAME
    valueFrom:
      fieldRef: { fieldPath: metadata.name }
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: k8s.pod.name=$(K8S_POD_NAME),k8s.namespace.name=app,deployment.environment.name=production
```

## Manual setup

When you need control over exporters, sampling or which instrumentations load,
replace the register hook with your own file and `--import` that instead.

```js
// src/instrumentation.mjs
import { register } from "node:module";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);

const sdk = new NodeSDK({
  // Exporters come from OTEL_* env vars: OTLP over HTTP by default.
  instrumentations: [getNodeAutoInstrumentations({ "@opentelemetry/instrumentation-fs": { enabled: false } })],
});

sdk.start();
process.on("SIGTERM", () => sdk.shutdown());
```

## The three signals

- **Logs.** Keep [writing JSON to stdout](/recipes/logging/). The pino instrumentation adds `trace_id` and `span_id` to every line, so logs and traces join up. Ship them either from stdout with the collector's `filelog` receiver, or directly over OTLP with the logs exporter. Not both.
- **Metrics.** Auto-instrumentation gives you HTTP duration histograms and runtime metrics. Push over OTLP, or expose `/metrics` with `@opentelemetry/exporter-prometheus` if your cluster scrapes.
- **Traces.** Incoming requests, outgoing HTTP, database calls, message queues. Sample in the collector, not in the app, so you can change it without a rollout.

## Collector

Run the OpenTelemetry Collector in the cluster, usually as a DaemonSet or a
Deployment in an `observability` namespace, and point every app at it. Apps
never talk to vendors directly. Swapping Grafana for Datadog is then a collector
config change.

## Notes

- Flush on shutdown: `sdk.shutdown()` in your SIGTERM handler, before `process.exit()`. Otherwise the last spans of every Pod are lost on each deploy.
- The `fs` instrumentation is noisy and slow. Disable it.
- `--import` and `module.register()` need Node.js 20.6 or newer. Set `OTEL_NODE_RESOURCE_DETECTORS` explicitly, or the SDK probes every cloud metadata service at startup.
- Exporting adds a little CPU. Batch exporters are the default; leave them on.
