import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { ReadinessService } from "./readiness.service";

@Controller()
export class HealthController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get("healthz")
  live() {
    return "ok";
  }

  @Get("readyz")
  ready(@Res() res: Response) {
    res.status(this.readiness.ready ? 200 : 503).send(this.readiness.ready ? "ready" : "not ready");
  }

  @Get()
  hello() {
    return { message: "hello from nestjs" };
  }

  @Get("slow")
  async slow() {
    await new Promise((r) => setTimeout(r, 3000));
    return "done";
  }
}
