# Telemetry example

Recipe: https://js-on-k8s.dev/recipes/telemetry/

```sh
npm ci
# Print spans to the terminal instead of sending them to a collector:
OTEL_TRACES_EXPORTER=console OTEL_METRICS_EXPORTER=none OTEL_LOGS_EXPORTER=none npm start
curl localhost:3000/
```

You get a server span for `GET /`, a client span for the outgoing `fetch`, a
server span for `/upstream`, and the pino log line carries `trace_id` and `span_id`.

- `src/otel.mjs` is the zero-code path: register the ESM loader hook, then load
  the auto-instrumentation register. `npm start` uses it.
- `src/instrumentation.mjs` is the manual path with a `NodeSDK` you control.
  `npm run start:manual` uses it.
- `deployment.yaml` holds the env vars that point the SDK at an OpenTelemetry
  Collector in the cluster.
