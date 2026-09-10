---
title: Distroless instead of Alpine or Debian slim
description: Ship the Node.js runtime and your app, nothing else. No shell, no package manager, non-root.
order: 5
tags: [dockerfile, security, distroless]
updated: 2026-09-10
example: examples/full/Dockerfile
---

The end goal for a production image is: the Node.js binary, its shared libraries,
CA certificates, your code and its dependencies. Google's distroless images are
exactly that.

```dockerfile
FROM gcr.io/distroless/nodejs24-debian12:nonroot
```

## Why not Alpine or slim

- **Alpine** uses musl. Native modules built for glibc break, DNS behaves differently,
  and some performance issues only show up under load.
- **Debian slim** still ships a shell, `apt`, and a hundred packages you never call.
  Every one of them is CVE surface and image size.
- **Distroless** has no shell. An attacker who gets code execution has no `sh`,
  `curl` or `apt` to work with. Scanners report almost nothing.

## What changes for you

- `ENTRYPOINT` is already `["node"]`. Write `CMD ["src/server.js"]`.
- No `RUN`, no `npm`. Install and build in a previous stage, then `COPY --from`.
- Use the `:nonroot` tag. It runs as UID 65532 and satisfies restricted Pod Security Standards.
- No `sleep` binary for `preStop`. Use the Kubernetes `sleep` action instead of `exec`.
- Debugging: temporarily switch to the `:debug` tag, which adds busybox, or use
  `kubectl debug` with an ephemeral container.

## Tags

| Tag                                  | Runs as | Contains        |
| ------------------------------------ | ------- | --------------- |
| `nodejs24-debian12`                  | root    | node            |
| `nodejs24-debian12:nonroot`          | nonroot | node            |
| `nodejs24-debian12:debug`            | root    | node + busybox  |
| `nodejs24-debian12:debug-nonroot`    | nonroot | node + busybox  |

Chainguard's `cgr.dev/chainguard/node` images are an equivalent alternative
with the same properties.
