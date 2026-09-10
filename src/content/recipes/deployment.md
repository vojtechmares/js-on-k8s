---
title: A Deployment and Service for a Node.js app
description: The baseline manifest with probes, resources, security context and a stable port name.
order: 7
tags: [kubernetes, deployment, service, manifests]
updated: 2026-09-10
example: examples/full/k8s/base
---

This is the complete baseline. Every other recipe adjusts one part of it.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app.kubernetes.io/name: app
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: app
  template:
    metadata:
      labels:
        app.kubernetes.io/name: app
    spec:
      terminationGracePeriodSeconds: 30
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: ghcr.io/you/app:1.0.0
          ports:
            - name: http
              containerPort: 3000
          env:
            - name: PORT
              value: "3000"
            - name: NODE_ENV
              value: production
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 256Mi
          startupProbe:
            httpGet: { path: /healthz, port: http }
            failureThreshold: 30
            periodSeconds: 2
          livenessProbe:
            httpGet: { path: /healthz, port: http }
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /readyz, port: http }
            periodSeconds: 5
          lifecycle:
            preStop:
              sleep:
                seconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
---
apiVersion: v1
kind: Service
metadata:
  name: app
spec:
  selector:
    app.kubernetes.io/name: app
  ports:
    - name: http
      port: 80
      targetPort: http
```

## Notes

- Name the port and reference it by name in probes and the Service. Change the number in one place.
- `readOnlyRootFilesystem: true` works with Node.js as long as you do not write to disk.
  Mount an `emptyDir` at `/tmp` if a library needs it.
- Memory limit equals memory request. See [memory and CPU](/recipes/memory-and-cpu/) for why.
- No CPU limit. Node.js is single-threaded per process; throttling makes latency worse, not fairer.
- Expose through an Ingress or Gateway of your choice. The Service is all the app needs to know about.
