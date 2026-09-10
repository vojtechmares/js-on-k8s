// Plain HTTP service instrumented with OpenTelemetry via --import.
// Recipe: https://www.js-on-k8s.dev/recipes/telemetry/
import { createServer } from "node:http";
import pino from "pino";

// pino is auto-instrumented: every line gets trace_id and span_id.
const log = pino({ base: undefined, timestamp: pino.stdTimeFunctions.isoTime });

let ready = false;

const server = createServer(async (req, res) => {
  if (req.url === "/healthz") return res.writeHead(200).end("ok");
  if (req.url === "/readyz") return res.writeHead(ready ? 200 : 503).end(ready ? "ready" : "not ready");

  if (req.url === "/") {
    // An outgoing call shows up as a child span of the incoming request.
    const upstream = await fetch(`http://127.0.0.1:${server.address().port}/upstream`);
    const body = await upstream.text();
    log.info({ path: req.url }, "request");
    return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ upstream: body }));
  }

  if (req.url === "/upstream") {
    await new Promise((r) => setTimeout(r, 50));
    return res.writeHead(200).end("hello");
  }

  res.writeHead(404).end("not found");
});

server.listen(process.env.PORT ?? 3000, () => {
  log.info({ port: server.address().port }, "listening");
  ready = true;
});

function shutdown() {
  ready = false;
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
