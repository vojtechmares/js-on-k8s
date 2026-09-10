// Recipe: https://js-on-k8s.dev/recipes/graceful-shutdown/nextjs
// Runs once at server start. Next.js keeps its own SIGTERM handler, which
// finishes in-flight requests and exits; these listeners run alongside it.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { state } = await import("./lib/state");

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => {
      state.ready = false;
      console.log(JSON.stringify({ level: "info", msg: `${signal} received, readiness off` }));
    });
  }
}
