---
title: Memory limits and the V8 heap
description: Set the container memory limit and tell V8 about it, or get OOM-killed before the garbage collector tries.
order: 11
tags: [resources, memory, v8, oomkilled]
updated: 2026-09-10
example: examples/full/k8s/base/deployment.yaml
---

V8 sizes its heap from what it believes is available memory. Inside a container that
belief can be wrong, and the kernel kills the process before V8 starts collecting
aggressively. Set both limits and keep them consistent.

## Container

```yaml
resources:
  requests:
    memory: 512Mi
  limits:
    memory: 512Mi
```

Request equals limit gives the Pod the `Guaranteed` QoS class for memory and makes it
the last candidate for eviction.

## V8

```yaml
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=384"
```

Leave roughly 25 percent headroom below the container limit. The heap is not the only
memory Node.js uses: buffers, native modules, the code cache and thread stacks all live
outside it.

## CPU

```yaml
resources:
  requests:
    cpu: 250m
  # no cpu limit
```

Node.js runs JavaScript on one thread. A request of `250m` to `1000m` is realistic.
CPU limits use CFS throttling and add tail latency even when the node is idle, so most
teams leave them off and rely on requests for scheduling. Scale horizontally with more
replicas instead of bigger Pods.

## Notes

- Check the heap limit in a running Pod: `node -e "console.log(v8.getHeapStatistics().heap_size_limit/1048576)"`.
- Node.js 20 and newer read cgroup limits for the default heap size, but the default is
  conservative. Setting it explicitly is still the safest option.
- `UV_THREADPOOL_SIZE` controls libuv's thread pool (DNS, fs, some crypto). Raise it if you
  request more than one CPU and do a lot of file or DNS work.
