# Full example

A small Node.js HTTP service with every recipe from [js-on-k8s.dev](https://js-on-k8s.dev) applied.

| Recipe | Where |
| --- | --- |
| [Run node directly](https://js-on-k8s.dev/recipes/run-node-directly) | `Dockerfile` (`CMD ["src/server.js"]`), `Procfile` |
| [Graceful shutdown](https://js-on-k8s.dev/recipes/graceful-shutdown) | `src/server.js`, `preStop` in `k8s/base/deployment.yaml` |

| [Dockerfile](https://js-on-k8s.dev/recipes/container-images/dockerfile) | `Dockerfile`, `.dockerignore` |
| [Distroless](https://js-on-k8s.dev/recipes/container-images/distroless-image) | runtime stage in `Dockerfile` |
| [Buildpacks](https://js-on-k8s.dev/recipes/container-images/buildpacks) | `project.toml`, `Procfile` |
| [Deployment](https://js-on-k8s.dev/recipes/manifests) | `k8s/base/` |
| [Memory and CPU](https://js-on-k8s.dev/recipes/memory-and-cpu) | `resources` and `NODE_OPTIONS` in `k8s/base/deployment.yaml` |
| [Config from environment](https://js-on-k8s.dev/recipes/config-from-environment) | `src/config.js`, `configMapGenerator` in `k8s/base/kustomization.yaml` |
| [Logging](https://js-on-k8s.dev/recipes/logging) | `src/log.js` |
| [Probes](https://js-on-k8s.dev/recipes/probes) | `/healthz`, `/readyz` and load shedding in `src/server.js` |
| [Networking](https://js-on-k8s.dev/recipes/networking) | `k8s/base/service.yaml`, `ingress.yaml`, `networkpolicy.yaml`, `k8s/gateway-api/` |
| [Zero-downtime rollouts](https://js-on-k8s.dev/recipes/zero-downtime-rollouts) | `strategy`, `topologySpreadConstraints`, `k8s/base/pdb.yaml` |
| [Kustomize](https://js-on-k8s.dev/recipes/manifests/kustomize) | `k8s/base/`, `k8s/overlays/` |
| [Helm chart](https://js-on-k8s.dev/recipes/manifests/helm-chart) | `chart/` |

## Run locally

```sh
npm ci
node src/server.js
curl localhost:3000/
curl localhost:3000/readyz
```

Send `SIGTERM` (Ctrl+C sends `SIGINT`, which is handled the same way) while a request to `/slow` is in flight and watch it finish before the process exits.

## Build the image

```sh
docker build -t ghcr.io/vojtechmares/js-on-k8s-example:1.0.0 .
docker run --rm -p 3000:3000 ghcr.io/vojtechmares/js-on-k8s-example:1.0.0
```

Or with buildpacks:

```sh
pack build ghcr.io/vojtechmares/js-on-k8s-example:1.0.0 --builder paketobuildpacks/builder-jammy-base
```

## Deploy

Kustomize:

```sh
kubectl apply -k k8s/overlays/staging
kubectl rollout status deployment/app -n app-staging
```

Helm:

```sh
helm upgrade --install app ./chart -n app --create-namespace
```
