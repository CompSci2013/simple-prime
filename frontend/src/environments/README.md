# Environment Configuration

**Purpose**: Contains environment-specific configuration files that are swapped at build time. Enables different settings for development, staging, and production builds.

## Structure

```
environments/
├── environment.ts            # Development configuration (default)
└── environment.prod.ts       # Production configuration
```

## Configuration Properties

| Property | Dev | Prod | Purpose |
|----------|-----|------|---------|
| `production` | `false` | `true` | Enables production mode optimizations |
| `apiBaseUrl` | `http://generic-prime.minilab/api/specs/v1` | (varies) | Backend API endpoint |
| `includeTestIds` | `true` | `false` | Enables `data-testid` attributes for E2E tests |

## Build-Time Replacement

Angular CLI automatically replaces environment files based on build configuration:

```bash
# Development (uses environment.ts)
ng serve

# Production (uses environment.prod.ts)
ng build --configuration production
```

Configured in `angular.json`:
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

## Usage in Code

```typescript
import { environment } from '../environments/environment';

// API calls
const url = `${environment.apiBaseUrl}/vehicles`;

// Feature flags
if (environment.includeTestIds) {
  element.setAttribute('data-testid', 'my-button');
}

// Development-only logging
if (!environment.production) {
  console.log('Debug:', data);
}
```

## Adding New Environments

1. Create new file: `environment.staging.ts`
2. Add configuration in `angular.json`:
   ```json
   "configurations": {
     "staging": {
       "fileReplacements": [
         {
           "replace": "src/environments/environment.ts",
           "with": "src/environments/environment.staging.ts"
         }
       ]
     }
   }
   ```
3. Build with: `ng build --configuration staging`

## Adding New Properties

1. Add property to ALL environment files
2. Update this README with the new property
3. Use consistent types across all files
