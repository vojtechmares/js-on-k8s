---
title: Container images for Node.js
description: What a production image should contain, and the recipes that get you there for plain Node.js, Bun, Next.js and TanStack Start.
order: 2
section: build
tags: [dockerfile, docker, images, distroless, buildpacks]
updated: 2026-09-10
example: examples/full/Dockerfile
---

A production image is the runtime, your code, its production dependencies and
CA certificates. Nothing else. Everything below follows from that.

## What good looks like

```
FROM node:24-bookworm-slim AS build          # tools live here
  npm ci --omit=dev, build TypeScript, bundle
FROM gcr.io/distroless/nodejs24-debian12:nonroot   # only this ships
  COPY --from=build ... ; CMD ["src/server.js"]
```

- **Two stages.** Build tools, dev dependencies and source maps stay in the first stage.
- **Lockfile first.** Copy `package.json` and the lockfile before the source, so the dependency layer is cached between builds.
- **Distroless runtime.** No shell, no package manager, non-root user. Alpine and Debian slim are the fallbacks, not the goal.
- **Node as PID 1.** `CMD ["src/server.js"]` under the image's `node` entrypoint. Never `npm start`.
- **Secrets never touch a layer.** Private registry tokens go in as BuildKit secrets.
- **Build once.** The same image goes through every environment; configuration comes from the Pod spec.

## Checklist

```sh
docker history --no-trunc image | grep -ci token      # 0
docker inspect image --format '{{.Config.User}}'      # 65532 or nonroot
docker run --rm --entrypoint sh image                 # should fail: no shell
docker images image --format '{{.Size}}'              # a Node.js API is ~200 MB, mostly the runtime
```

## Notes

- Bun has the same shape: `oven/bun:1` to build, `oven/bun:1-distroless` to run.
- Meta-frameworks add a build step and their own output folder, but the runtime stage is the same distroless image.
- Buildpacks produce a reasonable image without a Dockerfile, at the cost of a bigger, shell-bearing base.
