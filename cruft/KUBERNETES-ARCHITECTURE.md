# Kubernetes Architecture: Halo Lab Real Setup

**Date**: 2025-12-20
**Purpose**: Clarify actual Kubernetes cluster topology for generic-prime deployments

---

## Executive Summary

The Halo Lab Kubernetes (K3s) cluster consists of two nodes with distinct roles:

| Node | IP | Role | Purpose | Traefik |
|------|----|----|---------|---------|
| **Loki** | 192.168.0.110 | Control Plane | Manage cluster, store data, route ingress | ✅ Runs here |
| **Thor** | 192.168.0.244 | Worker | Run application pods | No |

**Key Discovery**: Thor can run `kubectl` commands because it has a kubeconfig pointing to Loki's API server (192.168.0.110:6443). Thor is **not** running K3s server—it's running K3s agent (worker node only).

---

## Actual Kubernetes Architecture

### Node Roles (Verified)

```bash
$ kubectl get nodes -o wide

NAME   STATUS   ROLES                  VERSION    INTERNAL-IP     EXTERNAL-IP
loki   Ready    control-plane,master   v1.33.3    192.168.0.110   <none>
thor   Ready    <none>                 v1.33.4    192.168.0.244   <none>
```

**Loki** has the actual control plane roles:
- `control-plane` - Runs API server, scheduler, controller-manager
- `master` - Legacy label, equivalent to control-plane

**Thor** has no control plane role:
- Empty roles field means it's a pure worker node
- Runs K3s agent process only
- Cannot be used as API server

### API Server Location

```bash
$ kubectl config view | grep server:
    server: https://192.168.0.110:6443
```

The Kubernetes API server is **only on Loki**. All cluster communication goes through Loki.

### Traefik Ingress Controller

Traefik (K3s default ingress controller) runs on the **control plane node (Loki)**:
- Listens on port 80 (HTTP) and 443 (HTTPS)
- Handles ingress routing for all applications
- Routes external requests to pods (which may run on any node)

---

## How Thor Gets kubectl Access

Thor has delegated access to Kubernetes through a **kubeconfig file** shared across nodes:

```
~/.kube/config
├── server: https://192.168.0.110:6443  ← Points to Loki
├── certificate-authority: (Loki's CA)
├── client-certificate: (Thor's cert)
└── client-key: (Thor's key)
```

**Process**:
1. User runs `kubectl` on Thor
2. kubectl reads ~/.kube/config
3. Connects to Loki's API at 192.168.0.110:6443
4. RBAC grants Thor user permission to operate cluster
5. Commands execute against Loki's API

This is a **standard Kubernetes pattern** for cluster access from non-control-plane nodes.

---

## Windows Hosts File: Correct Configuration

Given that Loki runs Traefik ingress, **Windows hosts file must point to Loki**:

```ini
192.168.0.110   loki loki.minilab generic-prime.minilab
192.168.0.244   thor thor.minilab
```

### Why Loki (Not Thor)?

1. **Traefik Ingress runs on Loki**
   - All Kubernetes ingress requests route through Loki:80
   - Requests to `generic-prime.minilab` must reach Loki first

2. **Ingress Controller is a control-plane service**
   - K3s deploys Traefik on the control plane by default
   - This is standard Kubernetes architecture

3. **Pod routing is automatic**
   - Whether backend pods run on Thor or Loki doesn't matter
   - Kubernetes service routes to them internally
   - Windows client only needs to reach Traefik on Loki

### Network Flow Example

```
Windows Browser: http://generic-prime.minilab/api/...
  ↓
  DNS → 192.168.0.110 (Loki)  ← From /etc/hosts
  ↓
  HTTP GET to Loki:80 (Traefik)
  ↓
  Traefik applies ingress rules:
    /api → generic-prime-backend-api service
  ↓
  Service LoadBalances to pod endpoints:
    Pod could be on Loki or Thor (Kubernetes handles routing)
  ↓
  Backend pod responds
```

---

## Development Environment Topology

```
┌─────────────────────────────────────────────────────┐
│  Kubernetes Cluster (K3s)                           │
│                                                     │
│  Loki (192.168.0.110) - Control Plane               │
│  ├─ K3s API Server (port 6443)                      │
│  ├─ Traefik Ingress (port 80)                       │
│  ├─ System Pods (coredns, k3s-agent, etc.)          │
│  └─ etcd (cluster database)                         │
│                                                     │
│  Thor (192.168.0.244) - Worker Node                 │
│  ├─ K3s Agent (port 10250)                          │
│  ├─ Application Pods (may run here)                 │
│  ├─ Development Container (port 4205)               │
│  └─ Docker/Podman Runtime                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Configuration Changes Required

### 1. Windows /etc/hosts (C:\Windows\System32\drivers\etc\hosts)

**Current (Wrong)**:
```ini
192.168.0.244   generic-prime.minilab
```

**Updated (Correct)**:
```ini
192.168.0.110   loki loki.minilab generic-prime.minilab
192.168.0.244   thor thor.minilab
```

### 2. Development Container Environment

The dev container on Thor needs to resolve `generic-prime.minilab` to Loki:
- Container runs with `--network host` so it uses Thor's `/etc/hosts`
- Thor should have `192.168.0.110 generic-prime.minilab` configured
- This already matches Loki's /etc/hosts per LAB-CONFIGURATION.md

### 3. E2E Test Container

Already configured correctly in `Dockerfile.e2e`:
```dockerfile
RUN echo "192.168.0.110 generic-prime-dockview generic-prime-dockview.minilab" >> /etc/hosts
```

This points E2E tests to Loki for API access.

---

## Verification Commands

Verify the actual setup on Thor:

```bash
# Check node roles
kubectl get nodes -o wide
# Expected: loki=control-plane,master | thor=<none>

# Check API server location
kubectl config view | grep server:
# Expected: https://192.168.0.110:6443

# Check Traefik pods running on Loki
kubectl get pods -n kube-system | grep traefik
# Expected: traefik pods running on loki node

# Check K3s process on current node
ps aux | grep k3s
# If on Thor: k3s agent
# If on Loki: k3s server

# Test ingress routing through Loki
curl -H "Host: generic-prime.minilab" http://192.168.0.110/api/specs/v1/health
# Should return backend health response
```

---

## Infrastructure Documentation Status

### Checked and Verified

✅ `/home/odin/projects/infrastructure/docs/LAB-CONFIGURATION.md`
- Correctly identifies Loki as "Control Plane"
- Correctly identifies Thor as "Worker"
- Network configuration is accurate

✅ `/home/odin/projects/infrastructure/docs/halo-labs.md`
- Correctly describes control plane on one node
- Correctly describes worker providing GPU compute

### Updated Files

✅ `ORIENTATION.md` (generic-prime project)
- Updated infrastructure overview to show correct node roles
- Updated network access paths
- Updated Windows hosts file recommendations
- Updated troubleshooting procedures

---

## Summary

| Aspect | Value | Note |
|--------|-------|------|
| **Control Plane Node** | Loki (192.168.0.110) | Runs K3s server |
| **Worker Node** | Thor (192.168.0.244) | Runs K3s agent |
| **Traefik Ingress** | Loki | On control plane |
| **kubectl Access from Thor** | Yes | Via kubeconfig to Loki API |
| **Windows hosts for generic-prime.minilab** | 192.168.0.110 | Must point to Loki |
| **Frontend dev server** | 192.168.0.244:4205 | Runs on Thor |
| **Backend API access** | Via Loki Traefik | Always routes through Loki |

This architecture is **standard for Kubernetes** and provides proper separation between control plane operations and workload execution.
