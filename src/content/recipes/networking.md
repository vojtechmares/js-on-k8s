---
title: Pod, Service, Ingress, Gateway API and NetworkPolicy
description: How a request reaches your container, and why you should say who may talk to it.
order: 6
tags: [service, ingress, networkpolicy, networking, kubernetes]
updated: 2026-09-10
example: examples/full/k8s/base
---

```
internet -> Ingress controller | Gateway -> Service (ClusterIP) -> Pod (Deployment) -> container:3000
                 |                             |
        Ingress / HTTPRoute rules      selector + named port
```

Pods get an IP each and die with it. A Service gives the group a stable name and
spreads connections over the ready Pods. An Ingress maps a hostname and path to
that Service at the cluster edge.

## Service

```yaml
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
      targetPort: http   # the container port name, not a number
```

The Service only routes to Pods whose [readiness probe](/recipes/probes/) passes.
Inside the cluster the app is now `http://app.<namespace>.svc`.

## Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - hosts: [app.example.com]
      secretName: app-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: app
                port:
                  name: http
```

The Ingress resource is only data. An Ingress controller (ingress-nginx, Traefik,
HAProxy, a cloud load balancer) reads it and does the work. TLS ends at the
controller; the app speaks plain HTTP and trusts `X-Forwarded-*` from it.

## Gateway API

Gateway API is the successor to Ingress and splits the job in two objects with
two owners.

- The **Gateway** is infrastructure: which load balancer, which listeners, which
  TLS certificates. The platform team creates it once per cluster or per
  environment, in its own namespace, and decides which namespaces may attach.
- The **HTTPRoute** is application config: which hostname and path go to which
  Service. It lives next to your Deployment, and you own it.

```yaml
# Owned by the application team, in the app namespace.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: app
spec:
  parentRefs:
    - name: public          # the shared Gateway
      namespace: gateway-system
  hostnames: [app.example.com]
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: app
          port: 80
```

```yaml
# Owned by the platform team. Shown for reference; do not ship this with the app.
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: public
  namespace: gateway-system
spec:
  gatewayClassName: cilium          # or istio, envoy-gateway, nginx, a cloud class
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "*.example.com"
      tls:
        certificateRefs: [{ name: wildcard-example-com }]
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              gateway-access: "true"
```

An HTTPRoute can also split traffic by weight between two Services, match on
headers, and rewrite paths, all without controller-specific annotations. New
clusters should start with Gateway API; Ingress keeps working but gets no new
features.

## NetworkPolicy

By default every Pod can open a connection to every other Pod in the cluster,
across namespaces. A compromised frontend can reach the database directly.
A `NetworkPolicy` is a firewall for Pods: once one selects a Pod, only the
listed traffic is allowed.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: app
  policyTypes: [Ingress, Egress]
  ingress:
    # Only the ingress controller may reach the app.
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - port: http
  egress:
    # DNS
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
    # The database, and nothing else.
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgres
      ports:
        - port: 5432
```

Egress rules matter as much as ingress: they stop a compromised Pod from
scanning the cluster or calling home. Remember DNS, the telemetry collector,
and any external API you need.

## Notes

- Policies need a CNI that enforces them (Cilium, Calico, most managed clusters). On a CNI that does not, they are silently ignored. Test with a `kubectl exec` from another Pod.
- Kubelet probes come from the node, not from a Pod, and are not blocked by policies on most CNIs.
- Start with a namespace-wide default deny, then allow per app. Adding policies later to a running namespace is harder than starting with them.
- Same-namespace ingress from the ingress controller depends on how it is deployed. Match its namespace and Pod labels, not an IP.
- With Gateway API the traffic comes from the Gateway's data plane Pods. Allow ingress from that namespace instead of `ingress-nginx`.
