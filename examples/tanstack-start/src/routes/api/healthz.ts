import { createFileRoute } from "@tanstack/react-router";

// Liveness endpoint. Nitro handles SIGTERM and in-flight requests itself.
export const Route = createFileRoute("/api/healthz")({
  server: {
    handlers: {
      GET: () => new Response("ok"),
    },
  },
});
