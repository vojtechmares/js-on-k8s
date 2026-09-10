// Zero-code OpenTelemetry for an ESM app. Load with: node --import ./src/otel.mjs src/server.js
// Recipe: https://js-on-k8s.dev/recipes/telemetry
import { register } from "node:module";

// Lets the SDK patch ESM imports such as `import http from "node:http"` and `import pino from "pino"`.
// CommonJS apps do not need this line.
register("@opentelemetry/instrumentation/hook.mjs", import.meta.url);

// Starts the SDK with every auto-instrumentation, configured from OTEL_* env vars.
await import("@opentelemetry/auto-instrumentations-node/register");
