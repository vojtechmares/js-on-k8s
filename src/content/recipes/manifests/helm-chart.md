---
title: A minimal Helm chart
description: A chart with one Deployment, one Service, a PDB and a values file with only the knobs you actually turn.
order: 2
tags: [helm, chart, packaging]
updated: 2026-09-10
example: examples/full/chart
---

Use Helm when you distribute the app to others or need release management.
Start with fewer values than the default `helm create` scaffold gives you.

## values.yaml

```yaml
image:
  repository: ghcr.io/you/app
  tag: "1.0.0"
replicaCount: 2
port: 3000
resources:
  requests: { cpu: "1", memory: 256Mi }
  limits: { memory: 256Mi }
env:
  LOG_LEVEL: info
```

## templates/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "app.fullname" . }}
  labels: {{- include "app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }
  selector:
    matchLabels: {{- include "app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels: {{- include "app.selectorLabels" . | nindent 8 }}
      annotations:
        checksum/config: {{ toYaml .Values.env | sha256sum }}
    spec:
      terminationGracePeriodSeconds: 30
      securityContext: { runAsNonRoot: true, seccompProfile: { type: RuntimeDefault } }
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          ports:
            - { name: http, containerPort: {{ .Values.port }} }
          env:
            - { name: PORT, value: {{ .Values.port | quote }} }
            {{- range $k, $v := .Values.env }}
            - { name: {{ $k }}, value: {{ $v | quote }} }
            {{- end }}
          resources: {{- toYaml .Values.resources | nindent 12 }}
          startupProbe: { httpGet: { path: /healthz, port: http }, failureThreshold: 30, periodSeconds: 2 }
          livenessProbe: { httpGet: { path: /healthz, port: http }, periodSeconds: 10 }
          readinessProbe: { httpGet: { path: /readyz, port: http }, periodSeconds: 5 }
          lifecycle: { preStop: { sleep: { seconds: 5 } } }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
```

## Install

```sh
helm upgrade --install app ./chart -n app --create-namespace \
  --set image.tag=1.0.0
```

## Notes

- The `checksum/config` annotation rolls Pods when env values change.
- Keep probes, security context and strategy hard-coded. They are not per-environment knobs.
- Run `helm lint ./chart` and `helm template ./chart | kubectl apply --dry-run=server -f -` in CI.
