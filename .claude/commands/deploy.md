# Deploy to Kubernetes

**This command builds and deploys the Generic Prime application to Kubernetes.**

---

## Overview

Deployment involves 4 phases:
1. **Build**: Create production image with podman on Thor
2. **Import**: Import image into K3s containerd on Thor
3. **Deploy**: Restart deployment to pick up new image
4. **Verify**: Confirm pods are running

---

## Prerequisites

- SSH session open to Thor (or running directly on Thor)
- Podman installed on Thor
- kubectl configured on Thor (points to Loki API server)
- The `generic-prime` namespace exists

---

## Directive

Execute the following deployment steps. All commands run on **Thor**.

### Phase 1: Build Production Image

```bash
cd ~/projects/generic-prime/frontend && podman build -f Dockerfile.prod -t localhost/generic-prime-frontend:prod .
```

**Expected output**: Multi-stage build completing with nginx image

### Phase 2: Import Image into K3s

```bash
podman save localhost/generic-prime-frontend:prod -o /tmp/frontend.tar && sudo k3s ctr images import /tmp/frontend.tar && rm /tmp/frontend.tar
```

**Expected output**: Image imported successfully

### Phase 3: Deploy to Kubernetes

```bash
# Restart deployment to pick up new image
kubectl rollout restart deployment/generic-prime-frontend -n generic-prime

# Wait for rollout to complete
kubectl rollout status deployment/generic-prime-frontend -n generic-prime --timeout=120s
```

**Expected output**: "deployment 'generic-prime-frontend' successfully rolled out"

### Phase 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n generic-prime -l app=generic-prime-frontend

# Check service endpoints
kubectl get svc -n generic-prime
```

---

## Troubleshooting

If pods are not starting:
```bash
# Check pod events
kubectl describe pod -n generic-prime -l app=generic-prime-frontend

# Check logs
kubectl logs -n generic-prime -l app=generic-prime-frontend --tail=50
```

If image pull fails:
```bash
# Verify image exists in K3s containerd
sudo k3s ctr images ls | grep generic-prime
```

---

## Architecture Reference

- **Image**: `localhost/generic-prime-frontend:prod`
- **Namespace**: `generic-prime`
- **Deployment**: `generic-prime-frontend` (2 replicas)
- **Service**: ClusterIP on port 80
- **Ingress**: `generic-prime.minilab` via Traefik (runs on Loki)
- **Node Selector**: `kubernetes.io/hostname: thor`
- **Control Plane**: Loki (192.168.0.110)
- **Worker Node**: Thor (192.168.0.244)

---

## Post-Deployment

After successful deployment:
1. Access the application at `http://generic-prime.minilab/`
2. Verify the application loads correctly
3. Test key functionality (filters, pop-outs, picker)

---

**Version**: 1.1
**Updated**: 2025-12-25
**Purpose**: Automate production deployment to Kubernetes
**Audience**: Claude Code sessions requiring deployment
