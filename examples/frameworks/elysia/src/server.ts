// Recipe: https://js-on-k8s.dev/recipes/graceful-shutdown-elysia/
import { Elysia } from "elysia";

let ready = false;

const app = new Elysia()
  .get("/healthz", () => "ok")
  .get("/readyz", ({ set }) => {
    set.status = ready ? 200 : 503;
    return ready ? "ready" : "not ready";
  })
  .get("/", () => ({ message: "hello from elysia" }))
  .get("/slow", () => new Promise<string>((r) => setTimeout(() => r("done"), 3000)))
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: "0.0.0.0" }, (server) => {
    console.log(JSON.stringify({ level: "info", msg: "listening", port: server.port }));
    ready = true;
  });

async function shutdown(signal: string) {
  console.log(JSON.stringify({ level: "info", msg: `${signal} received, shutting down` }));
  ready = false;
  setTimeout(() => process.exit(1), 10_000).unref();
  await app.stop();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
