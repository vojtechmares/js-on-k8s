---
title: Configuration from the environment
description: Build one image, promote it through environments, and read every setting from env vars.
order: 12
tags: [configmap, secret, twelve-factor]
updated: 2026-09-10
example: examples/full/k8s/base
---

The image should not know which environment it runs in. Kubernetes injects
configuration at runtime through ConfigMaps and Secrets.

## Read it once

```js
// src/config.js
const required = (name) => {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Missing env var ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  databaseUrl: required("DATABASE_URL"),
};
```

Fail at startup on missing values. A crash loop on deploy is better than a
`undefined` in a connection string at runtime.

## Inject it

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app
data:
  LOG_LEVEL: info
---
apiVersion: v1
kind: Secret
metadata:
  name: app
stringData:
  DATABASE_URL: postgres://app:secret@db:5432/app
---
# in the Deployment container spec
envFrom:
  - configMapRef:
      name: app
  - secretRef:
      name: app
```

## Notes

- Do not bake `.env` files into the image. Keep `dotenv` for local development only,
  and never load it when `NODE_ENV=production`.
- Changing a ConfigMap does not restart Pods. Use Kustomize's `configMapGenerator`
  (which hashes the name) or a checksum annotation in Helm to trigger a rollout.
- Secrets are base64, not encrypted. Use an external secrets operator or a sealed
  secret tool for anything that lives in git.
