---
title: Graceful shutdown with NestJS
description: Turn on enableShutdownHooks() and use the lifecycle hooks to flip readiness and close resources in order.
order: 7
tags: [nestjs, signals, shutdown]
updated: 2026-09-10
example: examples/frameworks/nestjs
---

NestJS does not listen for signals unless you ask. With
`enableShutdownHooks()` a `SIGTERM` calls `app.close()`, which runs lifecycle
hooks and closes the HTTP server, waiting for in-flight requests.

## main.ts

```ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
```

## Lifecycle hooks

```ts
import { Injectable, BeforeApplicationShutdown, OnApplicationShutdown } from "@nestjs/common";

@Injectable()
export class ReadinessService implements BeforeApplicationShutdown, OnApplicationShutdown {
  ready = true;

  // Runs before the HTTP server closes: fail readiness now.
  beforeApplicationShutdown(signal?: string) {
    this.ready = false;
  }

  // Runs after the HTTP server closed: in-flight requests are done.
  onApplicationShutdown(signal?: string) {
    // close pools, flush queues
  }
}
```

The order on `SIGTERM` is `onModuleDestroy`, `beforeApplicationShutdown`,
HTTP server close, `onApplicationShutdown`. Providers such as TypeORM and
Mongoose modules already hook into it.

## Health controller

```ts
@Controller()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get("healthz")
  live() { return "ok"; }

  @Get("readyz")
  ready(@Res() res: Response) {
    res.status(this.readiness.ready ? 200 : 503).send(this.readiness.ready ? "ready" : "not ready");
  }
}
```

## Notes

- There is no built-in deadline. Add `setTimeout(() => process.exit(1), 10_000).unref()` in `beforeApplicationShutdown`, or set `terminationGracePeriodSeconds` and trust the kill.
- `@nestjs/terminus` gives you dependency-aware health indicators if a static `ok` is not enough.
- Build with `tsc` or `nest build`, then run `node dist/main.js`. Never `npm run start:prod` in the image.
