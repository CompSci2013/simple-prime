# Generic-Prime & Data-Broker Integration

**Document Purpose**: Explain how generic-prime frontend depends on and uses the data-broker backend infrastructure

**Related Documents**:
- `/home/odin/projects/data-broker/INTEGRATION-ARCHITECTURE.md` - Complete architecture overview
- `/home/odin/projects/data-broker/generic-prime/docs/README.md` - Backend API documentation

---

## Quick Reference

**What is data-broker?**
A separate, reusable backend infrastructure project that provides:
- Node.js/Express REST API (in `data-broker/generic-prime/`)
- Elasticsearch cluster management
- Data ingestion pipelines
- Infrastructure-as-code (Docker, Kubernetes)

**What does generic-prime use from data-broker?**
- Backend API endpoints for vehicle search and filtering
- Elasticsearch data (autos-unified, autos-vins indices)
- Health checks and readiness probes
- Kubernetes deployment manifests

---

## Architecture

### Data Flow

```
USER BROWSER
    ↓
Angular App (generic-prime frontend, port 4205)
    ↓
    ├─ URL State Management (UrlStateService)
    │  └─ Reads/writes filter state to URL parameters
    ├─ Resource Management (ResourceManagementService)
    │  └─ Deduplicates requests to backend
    └─ HTTP Calls via ApiService
       ↓
       http://generic-prime.minilab/api/specs/v1/...
       ↓
Traefik Ingress (K8s port 80)
    ↓
generic-prime-backend-api service (K8s ClusterIP:3000)
    ↓
Express Server (data-broker/generic-prime/)
    ├─ specsController.js (request handlers)
    ├─ specsRoutes.js (endpoint definitions)
    └─ elasticsearchService.js (query logic)
       ↓
Elasticsearch Client (@elastic/elasticsearch)
    ↓
Elasticsearch Cluster (K8s data namespace)
    ├─ autos-unified (4,887 vehicle specs)
    ├─ autos-vins (1,835 VIN instances)
    └─ [other indices]
```

---

## Backend API Endpoints

**Base URL**: `http://generic-prime.minilab/api/specs/v1/` (development)

### Vehicle Search Endpoint

**GET** `/vehicles/details`

Returns paginated vehicle specifications matching filter criteria.

**Query Parameters**:
```
?manufacturer=Ford&model=F-150&page=1&size=10&year=2020&body_class=Pickup
```

**Response**:
```json
{
  "total": 25000,
  "page": 1,
  "size": 10,
  "results": [
    {
      "vehicle_id": "ford-f150-2020",
      "manufacturer": "Ford",
      "model": "F-150",
      "year": 2020,
      "body_class": "Pickup"
    }
  ],
  "statistics": {
    "byManufacturer": {"Ford": 25000},
    "totalCount": 25000
  }
}
```

**Source Code**: `data-broker/generic-prime/src/controllers/specsController.js`

### Manufacturer-Model Combinations Endpoint

**GET** `/manufacturer-model-combinations`

Returns aggregated list of manufacturer-model pairs with counts.

**Query Parameters**:
```
?page=1&size=20
```

**Response**:
```json
{
  "data": [
    {"manufacturer": "Ford", "model": "F-150", "count": 25000},
    {"manufacturer": "Ford", "model": "Escape", "count": 18000}
  ],
  "total": 881,
  "page": 1,
  "size": 20
}
```

**Source Code**: `data-broker/generic-prime/src/controllers/specsController.js`

### Filter Values Endpoint

**GET** `/filters/:fieldName`

Returns distinct values for a filter field.

**Examples**:
```
GET /filters/manufacturer    → ["Ford", "Toyota", "Honda", ...]
GET /filters/body_class      → ["Sedan", "SUV", "Pickup", ...]
GET /filters/year           → [1972, 1973, ..., 2024, 2025]
```

**Response**:
```json
{
  "field": "body_class",
  "values": ["Sedan", "SUV", "Pickup", "Coupe", "Wagon", ...]
}
```

**Source Code**: `data-broker/generic-prime/src/controllers/specsController.js`

---

## Frontend Integration Points

### 1. API Service

**Location**: `frontend/src/framework/services/api.service.ts`

```typescript
// Calls backend vehicle details endpoint
getVehicleDetails(filters: AutoSearchFilters, page: number, size: number) {
  return this.http.get('/api/specs/v1/vehicles/details', {
    params: {
      manufacturer: filters.manufacturer,
      model: filters.model,
      year: filters.year,
      body_class: filters.bodyClass,
      page: page,
      size: size
    }
  });
}
```

**Responsible for**:
- Constructing HTTP requests to backend
- Handling response serialization
- Managing HTTP headers (CORS, content-type, etc.)
- Error handling for API failures

### 2. Resource Management Service

**Location**: `frontend/src/framework/services/resource-management.service.ts`

```typescript
// Deduplicates requests to prevent excessive API calls
// If same request is in-flight, returns existing observable
getVehicles(filters): Observable<ApiResponse<VehicleResult>> {
  const cacheKey = this.buildCacheKey(filters);
  if (this.requestCache.has(cacheKey)) {
    return this.requestCache.get(cacheKey); // Reuse in-flight request
  }

  const request$ = this.apiService.getVehicleDetails(...).pipe(
    shareReplay(1)
  );
  this.requestCache.set(cacheKey, request$);
  return request$;
}
```

**Responsible for**:
- Caching in-flight requests
- Deduplicating simultaneous requests for same data
- Managing cache expiration

### 3. URL State Service

**Location**: `frontend/src/framework/services/url-state.service.ts`

```typescript
// Syncs filter state to URL parameters
updateFilters(filters: AutoSearchFilters) {
  // Updates URL: /automobiles/discover?manufacturer=Ford&model=F-150&page=1
  this.router.navigate(['/automobiles/discover'], {
    queryParams: {
      manufacturer: filters.manufacturer,
      model: filters.model,
      // ... other filters
      page: filters.page,
      size: filters.size
    }
  });

  // This triggers API call via ResourceManagementService
}
```

**Responsible for**:
- Making filters shareable (via URL)
- Enabling browser back/forward navigation
- Persisting filter state across page refreshes

### 4. Discover Component

**Location**: `frontend/src/domain-config/automobile/components/discover.component.ts`

```typescript
export class DiscoverComponent implements OnInit {
  constructor(
    private resourceManagement: ResourceManagementService,
    private urlState: UrlStateService
  ) {}

  ngOnInit() {
    // Listen to URL parameter changes
    this.route.queryParams.subscribe(params => {
      const filters = this.mapUrlParamsToFilters(params);

      // Request data from backend
      this.resourceManagement.getVehicles(filters).subscribe(
        (response) => {
          this.resultsTable.data = response.results;
          this.statistics.update(response.statistics);
        }
      );
    });
  }
}
```

**Responsible for**:
- Displaying search results
- Coordinating between panels (Query Control, Picker, Results, Statistics)
- Managing user interactions

---

## Configuration for Different Deployments

### Development (Local Docker)

**Frontend Port**: `4205` (generic-prime-frontend-dev container)
**Backend URL**: `http://generic-prime.minilab/api/specs/v1/`
**Elasticsearch**: `http://elasticsearch.data.svc.cluster.local:9200`

**How it works**:
- Dev container has `--network host` flag
- Can access `generic-prime.minilab` via /etc/hosts entry
- Backend is in K8s, accessible via Traefik ingress

**Configuration**: `frontend/angular.json` (dev builder)

### Kubernetes Production

**Frontend Port**: `80` (via Traefik ingress)
**Backend URL**: `http://generic-prime-backend-api.generic-prime.svc.cluster.local:3000/api/specs/v1/`
**Elasticsearch**: `http://elasticsearch.data.svc.cluster.local:9200` (K8s DNS)

**How it works**:
- Frontend deployed in generic-prime namespace
- Routes to backend via K8s service discovery
- Elasticsearch accessible from K8s cluster

**Configuration**: `k8s/deployment.yaml` (frontend pod spec)

---

## Building & Deploying

### Frontend Build

```bash
cd ~/projects/generic-prime/frontend

# Development
ng serve --host 0.0.0.0 --port 4205

# Production
ng build --configuration production
```

**Output**: Angular bundle (served by nginx in K8s)

### Backend Build & Deployment

```bash
cd ~/projects/data-broker/generic-prime

# Build Docker image
podman build -f infra/Dockerfile -t localhost/generic-prime-backend-api:v1.5.0 .

# Deploy to K8s
kubectl apply -f infra/k8s/

# Verify
kubectl get pods -n generic-prime
kubectl logs -n generic-prime deployment/generic-prime-backend-api
```

**Output**: Running backend service in K8s

### Synchronized Deployment

```bash
# Both need to work together:
1. Deploy backend (data-broker/generic-prime)
2. Rebuild frontend to pick up any API changes
3. Deploy frontend
4. Frontend makes HTTP calls to backend
5. Backend queries Elasticsearch
6. Results flow back to frontend → display to user
```

---

## Environment Variables

### Frontend

**Location**: `frontend/src/environment/`

```typescript
export const environment = {
  production: false,
  apiBase: 'http://generic-prime.minilab',
  apiVersion: 'v1',
  // Full URL: http://generic-prime.minilab/api/specs/v1/...
};
```

**Key Variables**:
- `API_BASE_URL` - Backend server hostname/port
- `ELASTICSEARCH_TIMEOUT` - Request timeout (frontend-side)

### Backend

**Location**: `data-broker/generic-prime/` (environment variables)

```bash
PORT=3000
ELASTICSEARCH_URL=http://elasticsearch.data.svc.cluster.local:9200
ELASTICSEARCH_INDEX=autos-unified
SERVICE_NAME=specs-api
NODE_ENV=production
```

**Key Variables**:
- `ELASTICSEARCH_URL` - Cluster connection
- `ELASTICSEARCH_INDEX` - Which index to query
- `PORT` - Server port

---

## Testing the Integration

### Health Check (Backend)

```bash
curl http://generic-prime.minilab/health

# Response:
{
  "status": "ok",
  "service": "auto-discovery-specs-api",
  "elasticsearch": "connected"
}
```

### Readiness Check (Backend)

```bash
curl http://generic-prime.minilab/ready

# Response:
{
  "status": "ready",
  "service": "auto-discovery-specs-api",
  "elasticsearch": "connected"
}
```

### API Endpoint Test

```bash
curl 'http://generic-prime.minilab/api/specs/v1/vehicles/details?manufacturer=Brammo&size=2'

# Response: JSON array of vehicles
```

### E2E Testing

**Location**: `frontend/e2e/`

```bash
npm run test:e2e

# Tests:
# - Navigate to discover page
# - Select filters
# - Verify results from backend appear in table
# - Test pagination
# - Test pop-out windows
```

---

## Known Issues & Limitations

### Bug #11 (Backend)

**Location**: `data-broker/generic-prime/src/controllers/specsController.js`

**Issue**: `/manufacturer-model-combinations` uses in-memory pagination
- Loads all aggregations into memory
- Paginates in JavaScript instead of Elasticsearch
- Doesn't scale to large result sets

**Impact**: Works fine for current dataset (881 combinations)

**Fix**: Rewrite to use ES composite aggregation (pending)

---

## Troubleshooting

### Frontend Cannot Connect to Backend

1. Verify backend is running:
   ```bash
   kubectl get pods -n generic-prime
   kubectl logs -n generic-prime deployment/generic-prime-backend-api
   ```

2. Verify Traefik ingress is configured:
   ```bash
   kubectl get ingress -n generic-prime
   ```

3. Test backend directly:
   ```bash
   curl http://generic-prime.minilab/health
   ```

### Backend Cannot Connect to Elasticsearch

1. Verify Elasticsearch is running:
   ```bash
   kubectl get pods -n data
   ```

2. Check service DNS resolution:
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -- \
     wget -O- http://elasticsearch.data.svc.cluster.local:9200
   ```

3. Check backend logs for connection errors:
   ```bash
   kubectl logs -n generic-prime deployment/generic-prime-backend-api | grep -i elasticsearch
   ```

### Slow Queries from Frontend

1. Check query parameters in browser DevTools → Network tab
2. Verify filters are reasonable (e.g., not returning 100,000 rows)
3. Check ResourceManagementService cache (should deduplicate)
4. Monitor Elasticsearch cluster health:
   ```bash
   ELASTICSEARCH_URL=http://10.43.133.216:9200 \
   ~/projects/data-broker/scripts/util_health_check.sh
   ```

---

## Related Documentation

- **Architecture**: `/home/odin/projects/data-broker/INTEGRATION-ARCHITECTURE.md`
- **Backend API**: `/home/odin/projects/data-broker/generic-prime/docs/README.md`
- **Elasticsearch Config**: `/home/odin/projects/data-broker/configurations.md`
- **Infrastructure**: `ORIENTATION.md` (this project)
- **Deployment**: `k8s/` directory

---

**Document Version**: 1.0
**Last Updated**: 2025-12-20
**Status**: Ready for Review
