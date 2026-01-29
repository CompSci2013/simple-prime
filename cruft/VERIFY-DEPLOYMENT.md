# Verify Production Deployment

**Last Updated**: 2025-12-20 (Session 23)

---

## Quick Verification Checklist

### From Windows 11 Browser

- [ ] Open http://generic-prime.minilab/
  - Expected: Angular application loads with dark theme
  - Watch for: "Frontend" title in browser tab, application content loads

- [ ] Open http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Brammo
  - Expected: JSON response with vehicle data (5 Brammo records)
  - Look for: "total": 5, "manufacturer": "Brammo"

### From Terminal (Thor SSH)

```bash
# Verify pods are running
kubectl get pods -n generic-prime
# Expected: 4 pods (2 frontend + 2 backend) all RUNNING

# Verify services exist
kubectl get svc -n generic-prime
# Expected: generic-prime-frontend and generic-prime-backend-api

# Verify ingress is configured
kubectl get ingress -n generic-prime
# Expected: generic-prime-ingress with ADDRESS 192.168.0.110,192.168.0.244

# Test backend API
curl http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Brammo
# Expected: JSON with vehicle data

# View frontend pod logs
kubectl logs -n generic-prime deployment/generic-prime-frontend --tail=20
# Expected: Nginx log showing HTTP requests
```

---

## Detailed Verification Steps

### 1. Verify Frontend Pods Running

```bash
kubectl get pods -n generic-prime -l app=generic-prime-frontend
```

Expected output:
```
NAME                                    READY   STATUS    RESTARTS   AGE
generic-prime-frontend-b97c47f7c-hn8nd  1/1     Running   0          XX
generic-prime-frontend-b97c47f7c-rkkkc  1/1     Running   0          XX
```

**What to look for**:
- Both pods have STATUS = "Running"
- Both show READY = "1/1" (ready containers / total containers)
- No recent RESTARTS

### 2. Verify Frontend Deployment Status

```bash
kubectl get deployment -n generic-prime generic-prime-frontend
```

Expected output:
```
NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
generic-prime-frontend   2/2     2            2           XX
```

**What to look for**:
- READY = "2/2" (2 replicas ready)
- UP-TO-DATE = "2" (all replicas updated)
- AVAILABLE = "2" (all replicas available for traffic)

### 3. Verify Services

```bash
kubectl get svc -n generic-prime
```

Expected output:
```
NAME                        TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)
generic-prime-frontend      ClusterIP   10.43.92.39    <none>        80/TCP
generic-prime-backend-api   ClusterIP   10.43.254.90   <none>        3000/TCP
```

**What to look for**:
- generic-prime-frontend service exists with PORT 80
- generic-prime-backend-api service exists with PORT 3000
- Both have CLUSTER-IP assigned
- TYPE is ClusterIP (internal routing via Traefik)

### 4. Verify Ingress

```bash
kubectl get ingress -n generic-prime
```

Expected output:
```
NAME                    CLASS     HOSTS                 ADDRESS                   PORTS
generic-prime-ingress   traefik   generic-prime.minilab 192.168.0.110,192.168... 80
```

**What to look for**:
- HOST = "generic-prime.minilab"
- CLASS = "traefik"
- ADDRESS shows both 192.168.0.110 (Loki) and 192.168.0.244 (Thor)

### 5. Verify Ingress Routing Rules

```bash
kubectl get ingress -n generic-prime -o yaml | grep -A 20 "rules:"
```

Expected to see:
```yaml
rules:
- host: generic-prime.minilab
  http:
    paths:
    - backend:
        service:
          name: generic-prime-backend-api
          port:
            number: 3000
      path: /api
      pathType: Prefix
    - backend:
        service:
          name: generic-prime-frontend
          port:
            number: 80
      path: /
      pathType: Prefix
```

**What to look for**:
- Two routes defined (one for /, one for /api)
- Routes point to correct services
- Path types are "Prefix"

### 6. Test Frontend HTTP Response

```bash
curl -I http://generic-prime.minilab/
```

Expected output:
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: ...
```

**What to look for**:
- Status code = 200 (success)
- Content-Type includes "text/html"

### 7. Test Frontend Content

```bash
curl http://generic-prime.minilab/ | head -20
```

Expected to see HTML with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Frontend</title>
  ...
  <app-root></app-root>
  ...
</head>
```

**What to look for**:
- HTML doctype present
- Angular app-root component present
- CSS and JavaScript references

### 8. Test Backend API

```bash
curl http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Brammo
```

Expected output: JSON with vehicles data
```json
{
  "total": 5,
  "page": 1,
  "size": 20,
  "results": [
    {
      "vehicle_id": "nhtsa-ram-brammo-street-bikes-1972",
      "manufacturer": "Brammo",
      "model": "Brammo Street Bikes",
      ...
    },
    ...
  ]
}
```

**What to look for**:
- Valid JSON response
- "total" = 5 (5 Brammo vehicles)
- At least one vehicle with manufacturer "Brammo"
- Data fields: vehicle_id, manufacturer, model, year, etc.

### 9. View Frontend Pod Logs

```bash
kubectl logs -n generic-prime deployment/generic-prime-frontend --tail=50
```

Expected to see Nginx logs:
```
172.17.0.1 - - [20/Dec/2025:14:05:12 +0000] "GET / HTTP/1.1" 200 ...
```

**What to look for**:
- HTTP GET requests
- Status codes (200 = success)
- No ERROR messages
- References to assets (CSS, JS files)

### 10. View Backend Pod Logs

```bash
kubectl logs -n generic-prime deployment/generic-prime-backend-api --tail=50
```

Expected to see application logs:
```
Server started on port 3000
Connected to Elasticsearch at elasticsearch.data.svc.cluster.local:9200
```

**What to look for**:
- Server started successfully
- Connected to Elasticsearch
- No ERROR messages
- Request/response logs showing API calls

---

## Windows 11 Browser Testing

### Test 1: Production Frontend

1. On Windows 11, open browser
2. Navigate to: **http://generic-prime.minilab/**
3. Verify:
   - Page loads without errors
   - Title shows "Frontend" (browser tab)
   - Application displays (Angular content loads)
   - Dark theme visible (dark background)
   - No 404 or 5xx errors

### Test 2: Backend API Direct

1. On Windows 11, open new tab
2. Navigate to: **http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Brammo**
3. Verify:
   - JSON response displayed
   - "total": 5 in response
   - Vehicle data with manufacturer "Brammo"

### Test 3: API From Application

1. In the browser tab with http://generic-prime.minilab/
2. Open DevTools (F12)
3. Go to Network tab
4. Interact with application (click filters, search, etc.)
5. Verify:
   - API calls to generic-prime.minilab/api/...
   - Responses are successful (200 status)
   - Data appears in application UI

---

## Development Container Verification

### Check Container is Running

```bash
podman ps | grep generic-prime-frontend-dev
```

Expected: Container listed with status "Up XX seconds"

### Verify Source Code Mounted

```bash
podman exec generic-prime-frontend-dev ls -la /app/src/app
```

Expected: Files listed (app.component.ts, app.module.ts, etc.)

### Check npm Packages Available

```bash
podman exec generic-prime-frontend-dev npm list | head -20
```

Expected: Package tree showing installed dependencies

### Test Start Dev Server

```bash
podman exec -it generic-prime-frontend-dev npm start -- --host 0.0.0.0 --port 4205
```

Expected: Angular CLI output
```
✔ Compiled successfully.

Application bundle generation complete.
...
✔ Angular Live Development Server is listening on localhost:4205...
```

---

## Common Issues & Troubleshooting

### Issue: Cannot resolve generic-prime.minilab

**Solution**:
1. Verify Windows hosts file has: `192.168.0.110 generic-prime.minilab`
2. Flush DNS cache: `ipconfig /flushdns` (Command Prompt as Admin)
3. Try again

### Issue: HTTP 503 Service Unavailable

**Solution**:
1. Check pods are running: `kubectl get pods -n generic-prime`
2. If pods are down, check logs: `kubectl logs -n generic-prime ...`
3. May indicate ingress not fully initialized - wait 30 seconds and retry

### Issue: Frontend loads but API calls fail

**Solution**:
1. Check backend pods: `kubectl get pods -n generic-prime`
2. Test API directly: `curl http://generic-prime.minilab/api/specs/v1/...`
3. Check backend logs: `kubectl logs -n generic-prime deployment/generic-prime-backend-api`
4. Verify /api route in ingress: `kubectl get ingress -n generic-prime -o yaml`

### Issue: Development server won't start

**Solution**:
1. Check container is running: `podman ps | grep generic-prime-frontend-dev`
2. If not running, start it: `podman start generic-prime-frontend-dev`
3. Try npm start again
4. Check for port conflicts (4205 in use?)

---

## Success Criteria: All Should Pass ✅

- [ ] Frontend pod (1) responds with HTML
- [ ] Frontend pod (2) responds with HTML
- [ ] Frontend service created with ClusterIP
- [ ] Backend pod (1) running for 13+ days
- [ ] Backend pod (2) running for 13+ days
- [ ] Backend service created with ClusterIP
- [ ] Ingress has correct routes (/ and /api)
- [ ] API returns vehicle data
- [ ] Windows browser loads frontend HTML
- [ ] Windows browser can fetch API data
- [ ] curl shows 200 status codes
- [ ] Pod logs show requests without errors
- [ ] Development container is running

---

**If all checks pass**: Production deployment is successful ✅

**If any check fails**: Check the corresponding logs and troubleshoot
