// Recipe: https://js-on-k8s.dev/recipes/graceful-shutdown-hono
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
let ready = false;

app.get("/healthz", (c) => c.text("ok"));
app.get("/readyz", (c) => c.text(ready ? "ready" : "not ready", ready ? 200 : 503));
app.get("/", (c) => c.json({ message: "hello from hono" }));
app.get("/slow", async (c) => {
  await new Promise((r) => setTimeout(r, 3000));
  return c.text("done");
});

const server = serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 3000), hostname: "0.0.0.0" }, (info) => {
  console.log(JSON.stringify({ level: "info", msg: "listening", port: info.port }));
  ready = true;
});

function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", msg: `${signal} received, shutting down` }));
  ready = false;
  server.close((err) => process.exit(err ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
