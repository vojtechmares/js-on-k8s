---
title: Kustomize base and overlays
description: One base with the manifests, one overlay per environment that changes only the image tag, replicas and config.
order: 1
tags: [kustomize, manifests, environments]
updated: 2026-09-10
example: examples/full/k8s
---

Kustomize needs no templating. The base holds the real manifests; overlays patch what
differs between environments.

## Layout

```
k8s/
  base/
    kustomization.yaml
    deployment.yaml
    service.yaml
    pdb.yaml
  overlays/
    staging/
      kustomization.yaml
    production/
      kustomization.yaml
```

## Base

```yaml
# k8s/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
  - pdb.yaml
configMapGenerator:
  - name: app
    literals:
      - LOG_LEVEL=info
```

## Overlay

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: app-production
resources:
  - ../../base
images:
  - name: ghcr.io/you/app
    newTag: 1.0.0
replicas:
  - name: app
    count: 3
configMapGenerator:
  - name: app
    behavior: merge
    literals:
      - LOG_LEVEL=warn
```

## Apply

```sh
kubectl apply -k k8s/overlays/production
# or from CI
cd k8s/overlays/production && kustomize edit set image ghcr.io/you/app=ghcr.io/you/app:${GIT_SHA}
```

## Notes

- `configMapGenerator` appends a hash to the ConfigMap name and updates references,
  so a config change rolls the Deployment.
- Keep patches small. If an overlay rewrites most of the base, the base is wrong.
- Kustomize is built into `kubectl`, and Argo CD and Flux render it natively.
