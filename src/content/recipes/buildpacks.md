---
title: Build an image with Cloud Native Buildpacks
description: Get a production Node.js image without writing a Dockerfile, using pack and Paketo.
order: 12
tags: [buildpacks, paketo, build]
updated: 2026-09-10
example: examples/full/project.toml
---

Buildpacks detect a Node.js project, install dependencies, and produce an OCI image
with a non-root user, a launcher that forwards signals, and a rebasable base image.
You still get to pick what runs as the process.

## Build

```sh
pack build ghcr.io/you/app:1.0.0 \
  --builder paketobuildpacks/builder-jammy-base \
  --env BP_NODE_VERSION=24.*
```

## Tell it what to run

Without a `Procfile`, Paketo runs `npm start`. Override it:

```
# Procfile
web: node src/server.js
```

Or set it in `project.toml` and avoid extra flags:

```toml
# project.toml
[_]
schema-version = "0.2"

[[io.buildpacks.build.env]]
name = "BP_NODE_VERSION"
value = "24.*"

[[io.buildpacks.build.env]]
name = "BP_NODE_PROJECT_PATH"
value = "."
```

## Notes

- The launcher is PID 1 and forwards `SIGTERM` to your process. Your
  [shutdown handler](/recipes/graceful-shutdown/) still applies.
- Dev dependencies are pruned when `NODE_ENV=production`, which Paketo sets by default.
- `pack rebase` swaps the run image for a patched one without rebuilding your layers.
- Trade-off: the run image is Ubuntu based and includes a shell. Smaller than most
  hand-written images, but not [distroless](/recipes/distroless-image/).
