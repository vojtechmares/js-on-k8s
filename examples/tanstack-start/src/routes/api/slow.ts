import { createFileRoute } from "@tanstack/react-router";

// Takes three seconds. Use it to watch in-flight requests finish during shutdown.
export const Route = createFileRoute("/api/slow")({
  server: {
    handlers: {
      GET: async () => {
        await new Promise((r) => setTimeout(r, 3000));
        return new Response("done");
      },
    },
  },
});
