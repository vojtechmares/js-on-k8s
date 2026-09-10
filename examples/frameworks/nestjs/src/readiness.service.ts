import { Injectable, Logger, BeforeApplicationShutdown, OnApplicationShutdown } from "@nestjs/common";

@Injectable()
export class ReadinessService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private readonly log = new Logger(ReadinessService.name);
  ready = true;

  // Runs before the HTTP server closes: fail readiness and arm the deadline.
  beforeApplicationShutdown(signal?: string) {
    this.log.log(`${signal ?? "shutdown"} received, failing readiness`);
    this.ready = false;
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  // Runs after the HTTP server closed: in-flight requests are done.
  onApplicationShutdown(signal?: string) {
    this.log.log(`closed after ${signal ?? "shutdown"}`);
  }
}
