// Manual OpenTelemetry setup, for when you need control over instrumentations,
// sampling or processors. Load with: node --import ./src/instrumentation.mjs src/server.js
// Exporters still come from OTEL_* env vars (OTLP by default).
// Recipe: https://www.js-on-k8s.dev/recipes/telemetry/
import { register } from "node:module";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);

const sdk = new NodeSDK({
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();

// Flush the last spans before the process exits. The app's own SIGTERM handler
// closes the HTTP server; both run.
process.on("SIGTERM", () => {
  sdk.shutdown().catch(() => {});
});
