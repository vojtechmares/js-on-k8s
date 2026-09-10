// A small HTTP service that applies every recipe from https://js-on-k8s.dev
//
// - started directly with `node src/server.js` (no npm in between)
// - /healthz for liveness, /readyz for readiness
// - graceful shutdown on SIGTERM with a hard deadline
// - JSON logs on stdout, configuration from the environment

import { createServer } from "node:http";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { config } from "./config.js";
import { createLogger } from "./log.js";

const log = createLogger(config.logLevel);

let ready = false;
let shuttingDown = false;
let inFlight = 0;

// Overload protection: shed requests and fail readiness when the event loop
// falls behind or too many requests are in flight.
// Recipe: https://js-on-k8s.dev/recipes/probes/
const loop = monitorEventLoopDelay({ resolution: 20 });
loop.enable();
const overloaded = () =>
  inFlight > config.maxInFlight || loop.percentile(99) / 1e6 > config.maxLoopLagMs;

const PROBE_PATHS = new Set(["/healthz", "/readyz"]);

function handler(req, res) {
  const url = new URL(req.url, "http://localhost");

  // Liveness: the event loop is running. Do not check dependencies here.
  if (url.pathname === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }

  // Readiness: initialised, not shutting down, not overloaded.
  if (url.pathname === "/readyz") {
    const ok = ready && !overloaded();
    res.writeHead(ok ? 200 : 503, { "content-type": "text/plain" }).end(ok ? "ready" : "not ready");
    return;
  }

  // Shed excess load before doing any work.
  if (overloaded()) {
    res.writeHead(503, { "content-type": "text/plain", "retry-after": "1" }).end("overloaded");
    return;
  }

  inFlight++;
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    inFlight--;
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    log.info(
      {
        method: req.method,
        path: url.pathname,
        status: res.statusCode,
        ms: Math.round(ms * 10) / 10,
        requestId: req.headers["x-request-id"],
      },
      "request",
    );
  });

  if (url.pathname === "/") {
    const body = JSON.stringify({
      message: config.greeting,
      hostname: process.env.HOSTNAME ?? null,
      version: process.env.APP_VERSION ?? "dev",
      node: process.version,
    });
    res.writeHead(200, { "content-type": "application/json" }).end(body);
    return;
  }

  // Simulates slow work so you can watch in-flight requests finish during shutdown.
  if (url.pathname === "/slow") {
    setTimeout(() => res.writeHead(200, { "content-type": "text/plain" }).end("done"), 3000);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" }).end("not found");
}

const server = createServer(handler);
// Keep-alive connections must outlive typical load balancer idle timeouts.
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(config.port, () => {
  log.info({ port: config.port, pid: process.pid, node: process.version }, "listening");
  // Connect to databases, warm caches, etc. before flipping this.
  ready = true;
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  // 1. Fail readiness first so the endpoint is removed from the Service.
  ready = false;
  log.info({ signal, inFlight }, "shutting down");

  // 2. Stop accepting new connections, finish in-flight requests.
  server.close((err) => {
    if (err) {
      log.error({ error: err.message }, "close failed");
      process.exit(1);
    }
    // Close database pools, flush logs, etc. here.
    log.info("closed");
    process.exit(0);
  });

  // 3. Close idle keep-alive connections so close() can finish.
  server.closeIdleConnections();

  // 4. Hard deadline, shorter than terminationGracePeriodSeconds.
  setTimeout(() => {
    log.warn({ inFlight }, "shutdown deadline reached, exiting");
    process.exit(1);
  }, config.shutdownTimeoutMs).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  log.error({ reason: String(reason) }, "unhandled rejection");
  process.exit(1);
});
