# syntax=docker/dockerfile:1
# Recipe: https://www.js-on-k8s.dev/recipes/telemetry/
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY src ./src

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000 \
    OTEL_SERVICE_NAME=app \
    OTEL_NODE_RESOURCE_DETECTORS=env,host,os,container
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/src ./src
EXPOSE 3000
# ENTRYPOINT is ["node"]: zero-code instrumentation via the --import hook.
CMD ["--import", "./src/otel.mjs", "src/server.js"]
