// Liveness endpoint. Readiness lives in src/routes/api/readyz.ts.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/healthz")({
  server: {
    handlers: {
      GET: () => new Response("ok"),
    },
  },
});
