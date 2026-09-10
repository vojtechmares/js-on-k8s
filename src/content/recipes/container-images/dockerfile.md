---
title: A minimal multi-stage Dockerfile
description: Install with npm ci, build in one stage, copy only what runs into the final image.
order: 1
tags: [dockerfile, docker, build]
updated: 2026-09-10
example: examples/full/Dockerfile
---

Keep dev dependencies, source maps and the package manager out of the image that runs
in production. Do it with two stages.

```dockerfile
# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY src ./src

FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /app/package.json ./
COPY --from=build --chown=nonroot:nonroot /app/src ./src
EXPOSE 3000
CMD ["src/server.js"]
```

## Order matters

Copy `package.json` and the lockfile before the source. The dependency layer is
rebuilt only when the lockfile changes, so day-to-day builds reuse it.

## .dockerignore

```
node_modules
npm-debug.log
.git
.env*
dist
coverage
```

Without it, `COPY` sends your local `node_modules` into the build context and
can overwrite the clean install.

## Notes

- `npm ci` fails if the lockfile and `package.json` disagree. That is a feature.
- Pin the base image by digest in CI for reproducible builds.
- If you have a TypeScript build step, run it in the build stage and copy `dist/` instead of `src/`.
- The final image has no shell, so `RUN` does not work there. Do all the work in the build stage.
- See [distroless images](/recipes/container-images/distroless-image) for what the runtime stage gives you.
