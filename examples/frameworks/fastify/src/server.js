// Recipe: https://js-on-k8s.dev/recipes/graceful-shutdown-fastify
import Fastify from "fastify";

const app = Fastify({ logger: true, forceCloseConnections: "idle" });
let ready = false;

app.get("/healthz", async () => "ok");
app.get("/readyz", async (req, reply) => {
  reply.code(ready ? 200 : 503);
  return ready ? "ready" : "not ready";
});
app.get("/", async () => ({ message: "hello from fastify" }));
app.get("/slow", async () => {
  await new Promise((r) => setTimeout(r, 3000));
  return "done";
});

app.addHook("onClose", async () => {
  app.log.info("closing resources");
});

async function shutdown(signal) {
  app.log.info({ signal }, "shutting down");
  ready = false;
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.close();
  process.exit(0);
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

await app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
ready = true;
