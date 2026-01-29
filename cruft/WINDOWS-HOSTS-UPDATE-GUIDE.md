# Windows Hosts File Update Guide

**Date**: 2025-12-20 (Session 22)
**Status**: Ready to deploy

---

## Overview

Your Windows hosts file is already **mostly correct** but may need verification/cleanup. This guide shows:
1. What your current file should contain
2. What changed (and why)
3. How to update it

---

## Current Status ✅

Your Windows `/etc/hosts` file already has:
```
192.168.0.110   generic-prime.minilab
```

**This is CORRECT** ✅ based on Session 22 investigation.

---

## What Changed in Session 22

### Previous Understanding (Incorrect)
- Assumed Thor (192.168.0.244) was the control plane
- Thought generic-prime.minilab should point to Thor

### Current Understanding (Correct)
- **Loki (192.168.0.110)** is the K3s control plane
- **Thor (192.168.0.244)** is a K3s worker node
- **generic-prime.minilab MUST point to Loki** (control plane where Traefik runs)

### Why This Matters

```
Development Flow:
  Windows Browser → 192.168.0.244:4205 (Thor dev server)
    ↓
  Frontend makes API call to: http://generic-prime.minilab/api/...
    ↓
  Resolves to 192.168.0.110 (Loki) via /etc/hosts
    ↓
  Traefik Ingress on Loki:80 routes /api to backend pods
```

---

## How to Update Your Windows Hosts File

### Step 1: Copy the Corrected File

Use the file provided: `docs/windows-hosts.txt`

This file contains:
- Properly formatted entries
- Clear organization (Thor section, Loki section, generic-prime section)
- Helpful comments explaining each section
- Instructions for usage

### Step 2: Update Your Windows Hosts File

```
File location: C:\Windows\System32\drivers\etc\hosts
```

**Option A: Manual Update (Recommended)**
1. Open **Notepad as Administrator**
2. File → Open → Navigate to `C:\Windows\System32\drivers\etc\hosts`
3. Replace the entire contents with the contents of `docs/windows-hosts.txt`
4. Save the file
5. Close Notepad

**Option B: PowerShell (Advanced)**
```powershell
# Run PowerShell as Administrator
(Get-Content "C:\path\to\docs\windows-hosts.txt") | Set-Content "C:\Windows\System32\drivers\etc\hosts"
```

### Step 3: Flush DNS Cache

After updating, flush your DNS cache to ensure Windows picks up the changes:

**Windows 10/11 - Command Prompt (as Administrator):**
```cmd
ipconfig /flushdns
```

Or in **PowerShell (as Administrator):**
```powershell
Clear-DnsClientCache
```

### Step 4: Verify

Test that your hostname resolves correctly:

**Command Prompt:**
```cmd
ping generic-prime.minilab
```

**Expected output:**
```
Pinging generic-prime.minilab [192.168.0.110] with 32 bytes of data:
Reply from 192.168.0.110: bytes=32 time=<X>ms TTL=XX
```

---

## What's in the Corrected File

### Thor Section (192.168.0.244)
```
192.168.0.244   minilab
192.168.0.244   minipc
192.168.0.244   registry.minilab
192.168.0.244   angular.minilab
192.168.0.244   traefik.minilab
192.168.0.244   ockview-wrapper.minilab
192.168.0.244   dockview-wrapper.minilab.local
192.168.0.244   satellites.minilab
192.168.0.244   kibana.minilab
192.168.0.244   thor
192.168.0.244   thor.minilab
```

### Loki Section (192.168.0.110)
```
192.168.0.110   loki
192.168.0.110   loki.minilab
192.168.0.110   whoami.minilab
192.168.0.110   gitLab.minilab
192.168.0.110   ollama.minilab
192.168.0.110   chat.minilab
192.168.0.110   dockview.minilab
192.168.0.110   rag.minilab
192.168.0.110   qdrant.minilab
192.168.0.110   rag-ui.minilab
192.168.0.110   api.satellites.minilab
192.168.0.110   api.transportation.minilab
192.168.0.110   transportation.minilab
192.168.0.110   autos.minilab
192.168.0.110   autos2.minilab
192.168.0.110   auto-discovery.minilab
```

### Critical: generic-prime (Loki Control Plane Ingress)
```
192.168.0.110   generic-prime.minilab
192.168.0.110   generic-prime-dockview.minilab
```

**Why Loki?** Traefik ingress controller runs on the K3s control plane (Loki). All external HTTP/HTTPS requests must enter through Loki:80, where Traefik routes them to the appropriate backend pods.

---

## Verification Checklist

After updating your hosts file:

- [ ] Notepad opened as Administrator
- [ ] File location: `C:\Windows\System32\drivers\etc\hosts`
- [ ] Contents replaced with `windows-hosts.txt`
- [ ] File saved
- [ ] DNS cache flushed: `ipconfig /flushdns`
- [ ] Test ping: `ping generic-prime.minilab` → resolves to 192.168.0.110
- [ ] Test browser: `http://192.168.0.244:4205` (development server)
- [ ] Test production: `http://generic-prime.minilab/` (Kubernetes ingress)

---

## Troubleshooting

### "Cannot resolve generic-prime.minilab"

1. Verify hosts file entry exists:
   ```cmd
   findstr generic-prime C:\Windows\System32\drivers\etc\hosts
   ```

2. Verify it points to 192.168.0.110:
   ```cmd
   findstr "192.168.0.110.*generic-prime" C:\Windows\System32\drivers\etc\hosts
   ```

3. Flush DNS cache again:
   ```cmd
   ipconfig /flushdns
   ```

4. Try pinging directly by IP:
   ```cmd
   ping 192.168.0.110
   ```
   If this works, the network is fine; DNS cache may need more time to refresh.

### "Connection refused" when accessing generic-prime.minilab

1. Verify Traefik is running on Loki:
   ```bash
   kubectl get pods -n kube-system | grep traefik
   ```

2. Verify ingress is configured:
   ```bash
   kubectl get ingress -n generic-prime
   ```

3. Test from Thor SSH:
   ```bash
   curl -H "Host: generic-prime.minilab" http://192.168.0.110/
   ```

---

## Next Steps

After updating your hosts file, proceed with Session 23:

1. Build production Docker image
2. Deploy frontend to Kubernetes
3. Launch development container
4. Test both environments:
   - Development: `http://192.168.0.244:4205`
   - Production: `http://generic-prime.minilab/`

See `NEXT-STEPS.md` for detailed instructions.

---

## Architecture Reference

For more information about the Kubernetes cluster topology:
- `docs/claude/KUBERNETES-ARCHITECTURE.md` - Comprehensive architecture guide
- `docs/claude/ORIENTATION.md` - Project-specific infrastructure details
- `~/projects/infrastructure/docs/LAB-CONFIGURATION.md` - Complete lab configuration

---

**Last Updated**: 2025-12-20 (Session 22)
**Status**: Ready for production deployment
