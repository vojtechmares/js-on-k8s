// Recipe: https://www.js-on-k8s.dev/recipes/graceful-shutdown-express/
import express from "express";

const app = express();
let ready = false;

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/readyz", (req, res) => res.status(ready ? 200 : 503).send(ready ? "ready" : "not ready"));
app.get("/", (req, res) => res.json({ message: "hello from express" }));
app.get("/slow", (req, res) => setTimeout(() => res.send("done"), 3000));

const server = app.listen(process.env.PORT ?? 3000, () => {
  console.log(JSON.stringify({ level: "info", msg: "listening", port: server.address().port }));
  ready = true;
});

function shutdown(signal) {
  console.log(JSON.stringify({ level: "info", msg: `${signal} received, shutting down` }));
  ready = false;
  server.close((err) => process.exit(err ? 1 : 0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
