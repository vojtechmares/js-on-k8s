// Recipe: https://www.js-on-k8s.dev/recipes/graceful-shutdown/tanstack-start/
// Evaluated once at startup. Nitro keeps its own SIGTERM handler, which drains
// in-flight requests (NITRO_SHUTDOWN_TIMEOUT) and exits; this runs alongside it.
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { state } from "./lib/state";

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    state.ready = false;
    console.log(JSON.stringify({ level: "info", msg: `${signal} received, readiness off` }));
  });
}

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
