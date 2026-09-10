---
title: Memory and CPU for Node.js Pods
description: Measure before you set numbers. Then give Node.js a full CPU or two, size the heap under the memory limit, and re-measure after every runtime upgrade.
order: 12
tags: [resources, memory, cpu, v8, oomkilled]
updated: 2026-09-10
example: examples/full/k8s/base/deployment.yaml
---

There is no correct number to copy. The right requests and limits come from
looking at what your app does under real traffic, and they change with every
dependency and runtime upgrade. Start from the defaults below, then let
[telemetry](/recipes/telemetry/) correct you: CPU usage, throttling, heap size,
RSS and event loop lag are all one dashboard away once the SDK is in.

## CPU

Node.js runs JavaScript on one thread, but the process is not single-threaded.
The garbage collector, libuv's thread pool (DNS, fs, some crypto), worker
threads and native modules all run alongside it.

```yaml
resources:
  requests:
    cpu: "1"
```

- Below one CPU (`1000m`) you get CFS throttling under load: the process is
  paused mid-request and latency spikes even though the node is idle.
  `500m` is fine for an idle sidecar, not for a service that takes traffic.
- Two CPUs (`2000m`) help when GC, the thread pool or worker threads have
  real work to do. A fullstack framework rendering React on the server is
  a typical case. Measure, do not guess.
- Leave the CPU limit off unless policy requires one. Scale with more replicas.
- Set `UV_THREADPOOL_SIZE` to match the CPU request if you do a lot of
  DNS, filesystem or crypto work.

## Memory

Memory depends entirely on the app. A JSON API on Fastify may sit at 80 MB.
A Next.js or TanStack Start app rendering pages, holding a route cache and
bundling its own dependencies may need 512 MB to 1 GB. Look at RSS after a
day of traffic, not after startup.

```yaml
resources:
  requests:
    memory: 512Mi
  limits:
    memory: 512Mi
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=384"
```

- Request equals limit: `Guaranteed` QoS for memory, last to be evicted.
- Tell V8 the limit. The heap is only part of the process memory: buffers,
  native modules, the code cache and thread stacks live outside it. Leave
  around 25 percent below the container limit.
- Node.js 20 and newer read cgroup limits for the default heap size, but the
  default is conservative. Setting it explicitly is still the safest option.
- Check in a running Pod: `node -e "console.log(v8.getHeapStatistics().heap_size_limit/1048576)"`.

## Bun, Deno and Node.js versions

The numbers above are for Node.js on V8. Bun uses JavaScriptCore, Deno has
its own runtime layout, and every major Node.js release changes GC tuning.
Treat a runtime switch or upgrade as a resource change: read the changelog,
load-test with production-like traffic, compare RSS, CPU and p99 latency,
and adjust the requests before the rollout. `--max-old-space-size` is a V8
flag and does nothing on Bun.

## Notes

- OOMKilled with a flat heap graph means the leak is outside the heap: native buffers, too many worker threads, or the heap limit set higher than the container limit.
- Throttling shows up as `container_cpu_cfs_throttled_seconds_total` in cAdvisor metrics. If it is non-zero on a busy service, raise the request.
- Vertical Pod Autoscaler in recommendation mode is a cheap way to see what your Pods actually use.
