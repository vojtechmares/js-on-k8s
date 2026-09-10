// Recipe: https://js-on-k8s.dev/recipes/graceful-shutdown-nestjs/
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Without this, Nest ignores SIGTERM and Kubernetes has to SIGKILL the Pod.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}

bootstrap();
