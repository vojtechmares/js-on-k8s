---
title: Zero-downtime rolling updates
description: Rolling update strategy, a PodDisruptionBudget and spread across nodes so a deploy never drops requests.
order: 11
tags: [rollout, pdb, availability]
updated: 2026-09-10
example: examples/full/k8s/base
---

With [graceful shutdown](/recipes/graceful-shutdown/) and
[readiness probes](/recipes/health-checks/) in place, the last piece is telling the
scheduler how many Pods may be unavailable at any time. The answer is zero.

## Strategy

```yaml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
```

A new Pod must pass its readiness probe before an old one is terminated.

## PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: app
```

Node drains and cluster upgrades respect the budget. Without it, both replicas can
be evicted at once.

## Spread

```yaml
spec:
  template:
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: app
```

## Notes

- `replicas: 1` cannot be zero-downtime through a node drain, whatever else you set.
- `minAvailable: 1` with two replicas blocks drains during a rollout for a moment. Use three
  replicas or `maxUnavailable: 1` if drains stall.
- Watch a rollout with `kubectl rollout status deployment/app`.
