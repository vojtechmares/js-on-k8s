---
title: JavaScript on Kubernetes
description: Practical, focused recipes for running Node.js and JavaScript applications on Kubernetes. Container images, signals, graceful shutdown, probes, manifests, Helm, Kustomize.
---

Running Node.js on Kubernetes is mostly boring, and that is the point. A handful of
details decide whether your app restarts cleanly, drops requests on deploy, or gets
OOM-killed at 3 am. This site collects those details as short recipes.

## Principles

- **One process, started directly.** Run `node server.js`, not `npm start`. Signals must reach your code.
- **Shut down on purpose.** Handle `SIGTERM`, stop accepting connections, finish in-flight work, exit.
- **Tell Kubernetes the truth.** Separate liveness and readiness. Fail readiness before you stop.
- **Ship the runtime, not a distro.** Multi-stage builds ending in a distroless image. No shell, no package manager, non-root.
- **Set memory limits twice.** Once for the container, once for V8.
- **Configure from the environment.** Build once, promote the same image through environments.

## How to read this

Each recipe covers exactly one thing and fits on a screen. Snippets are copy-paste
ready and taken from the [full example](https://github.com/vojtechmares/js-on-k8s/tree/main/examples/full),
which applies all of them to a small HTTP service.

## For agents and tooling

Every page on this site is also plain Markdown. Request any URL with
`Accept: text/markdown`, or append `.md` to the path. A [llms.txt](/llms.txt) index is available too.
