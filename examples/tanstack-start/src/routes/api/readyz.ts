import { createFileRoute } from "@tanstack/react-router";
import { state } from "../../lib/state";

export const Route = createFileRoute("/api/readyz")({
  server: {
    handlers: {
      GET: () => new Response(state.ready ? "ready" : "not ready", { status: state.ready ? 200 : 503 }),
    },
  },
});
