---
title: Run node directly, not npm start
description: Make node PID 1 so Kubernetes signals reach your application code.
order: 1
tags: [dockerfile, signals, pid1]
updated: 2026-09-10
example: examples/full/Dockerfile
---

Kubernetes stops a Pod by sending `SIGTERM` to PID 1 of each container. If PID 1 is
`npm`, a shell, or anything other than your app, the signal may be swallowed or delayed,
and after `terminationGracePeriodSeconds` the container is killed with `SIGKILL`.

## Do this

```dockerfile
CMD ["node", "server.js"]
```

Use the exec form (JSON array). `node` becomes PID 1 and receives signals directly.

## Not this

```dockerfile
# npm is PID 1 and spawns node as a child
CMD ["npm", "start"]

# shell form: /bin/sh -c "node server.js" makes sh PID 1
CMD node server.js
```

Newer npm versions forward signals, but they add a process, add startup time,
and hide the exit code. A shell in front does not forward `SIGTERM` at all.

## Notes

- Need `npm start` for local development? Keep it in `package.json`, just do not use it in the image.
- Node as PID 1 does not reap zombie processes. If your app spawns child processes,
  run with an init process: `docker run --init`, or `tini` as `ENTRYPOINT`.
- Distroless Node images already set `ENTRYPOINT ["node"]`, so `CMD ["server.js"]` is enough.
- Environment variables in the exec form are not expanded. Read them in code, not in `CMD`.
