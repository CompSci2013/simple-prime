# AUTHENTICATION & AUTHORIZATION SERVICE SPECIFICATION
## Auto Discovery Platform
### Security Layer Design

**Status**: Specification - Ready for Implementation
**Date**: 2025-11-15
**Purpose**: Define authentication and authorization requirements for the Auto Discovery platform

---

## EXECUTIVE SUMMARY

The Auto Discovery platform requires a **bare-bones authentication and authorization service** to verify user identity and enforce access control across the application. This specification defines a lightweight, JWT-based security layer that integrates seamlessly with the existing Angular 14 frontend and Node.js backend.

**Key Requirements**:
- User authentication (login/logout)
- Session management (JWT tokens)
- Role-based access control (RBAC)
- Domain-based authorization (area-of-concern scoping)
- Frontend route guards
- Backend API protection
- Kubernetes deployment integration

**Design Principles**:
- Minimal complexity (bare-bones)
- Stateless authentication (JWT)
- Defense in depth (frontend + backend validation)
- Zero-trust approach (verify every request)

---

## 1. AUTHENTICATION OVERVIEW

### 1.1 Authentication Flow

```
┌─────────────┐
│   Browser   │
│  (Angular)  │
└──────┬──────┘
       │
       │ 1. Login Request (username, password)
       ▼
┌─────────────────────┐
│   Auth Service      │
│  (Node.js + JWT)    │
└──────┬──────────────┘
       │
       │ 2. Validate Credentials
       ▼
┌─────────────────────┐
│   User Database     │
│   (Elasticsearch)   │
└──────┬──────────────┘
       │
       │ 3. Return User + Roles + Domains
       ▼
┌─────────────────────┐
│   Auth Service      │
│ Generate JWT Token  │
└──────┬──────────────┘
       │
       │ 4. Return JWT Token
       ▼
┌─────────────┐
│   Browser   │
│ Store Token │
│ (localStorage)
└─────────────┘
```

### 1.2 Token-Based Authentication (JWT)

**Technology**: JSON Web Tokens (JWT)

**Token Lifecycle**:
1. User logs in with credentials
2. Auth service validates credentials
3. Auth service generates signed JWT with user claims
4. Frontend stores JWT in `localStorage`
5. Frontend includes JWT in `Authorization` header for all requests
6. Backend validates JWT on every request
7. Token expires after configured TTL (default: 8 hours)
8. User must re-authenticate after expiration

**JWT Structure**:

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-id-12345",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "roles": ["analyst", "viewer"],
    "domains": ["vehicle-discovery", "analytics"],
    "iat": 1700000000,
    "exp": 1700028800
  },
  "signature": "..."
}
```

**JWT Claims**:
- `sub` (subject): Unique user identifier
- `username`: Username for display
- `email`: User email address
- `roles`: Array of role names
- `domains`: Array of domain names (areas of concern)
- `iat` (issued at): Timestamp when token was created
- `exp` (expiration): Timestamp when token expires

---

## 2. AUTHORIZATION MODEL

### 2.1 Roles

**Role Definition**: A role represents a user's **functional responsibility** within the system.

**Predefined Roles**:

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `admin` | System administrator | Full access to all features and domains |
| `analyst` | Data analyst | Read/write access to discovery, filters, charts |
| `viewer` | Read-only user | Read-only access to discovery features |
| `guest` | Unauthenticated user | No access (redirected to login) |

**Role Hierarchy**:
```
admin (highest privilege)
  ├── Full access to all domains
  ├── User management capabilities
  └── Configuration management
analyst
  ├── Full access to vehicle-discovery domain
  ├── Full access to analytics domain
  └── Read-only access to admin domain
viewer
  ├── Read-only access to vehicle-discovery domain
  └── Read-only access to analytics domain
guest (lowest privilege)
  └── No access (requires login)
```

**Role Assignment**:
- Roles are assigned by administrators
- A user can have multiple roles
- Effective permissions = union of all assigned roles
- Example: User with `["analyst", "viewer"]` has analyst permissions

### 2.2 Domains

**Domain Definition**: A domain represents an **area of concern** within the application, not a networking domain.

**Predefined Domains**:

| Domain | Description | Components/Features |
|--------|-------------|---------------------|
| `vehicle-discovery` | Core vehicle browsing | Discover page, filters, pickers, results table |
| `analytics` | Data visualization | Charts, statistics, pop-out windows |
| `admin` | Administrative functions | User management, configuration (future) |
| `public` | Public resources | Login page, health checks |

**Domain-Based Access Control**:
```typescript
// Example: User authorization check
{
  "username": "john.doe",
  "roles": ["analyst"],
  "domains": ["vehicle-discovery", "analytics"]
}

// Access checks:
canAccessDiscoverPage() → true (vehicle-discovery domain)
canAccessCharts() → true (analytics domain)
canAccessUserManagement() → false (admin domain not assigned)
```

**Domain Scoping Rules**:
1. **Public domain**: No authentication required
2. **Vehicle-discovery domain**: Requires `viewer`, `analyst`, or `admin` role
3. **Analytics domain**: Requires `analyst` or `admin` role
4. **Admin domain**: Requires `admin` role only

### 2.3 Permission Model

**Permission Structure**:
- Permissions are **implied by roles and domains**
- No explicit permission table (keeps it bare-bones)
- Permissions are checked at two levels:
  1. **Frontend** (route guards, UI element visibility)
  2. **Backend** (API endpoint authorization)

**Permission Check Logic**:

```typescript
interface AuthorizationCheck {
  requiredRole?: string;        // Minimum role required
  requiredDomain?: string;      // Domain access required
  requireAny?: boolean;         // OR logic vs AND logic
}

// Example checks:
{
  endpoint: "/api/v1/manufacturer-model-combinations",
  requiredRole: "viewer",
  requiredDomain: "vehicle-discovery"
}

{
  endpoint: "/api/v1/admin/users",
  requiredRole: "admin",
  requiredDomain: "admin"
}
```

---

## 3. API CONTRACTS

### 3.1 Authentication Endpoints

**Base URL**: `http://auto-discovery.minilab/api/v1/auth`

#### 3.1.1 POST /api/v1/auth/login

**Description**: Authenticate user and receive JWT token

**Request**:
```json
{
  "username": "john.doe",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-12345",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "roles": ["analyst", "viewer"],
    "domains": ["vehicle-discovery", "analytics"]
  },
  "expiresAt": "2025-11-15T23:59:59.000Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid username or password",
  "code": "INVALID_CREDENTIALS"
}
```

**Response (429 Too Many Requests)**:
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

**Rate Limiting**:
- Maximum 5 failed login attempts per username per 15-minute window
- After 5 failures, username is locked for 15 minutes
- Prevents brute-force attacks

#### 3.1.2 POST /api/v1/auth/logout

**Description**: Invalidate current session (optional, since JWT is stateless)

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**: None

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Note**: Since JWT is stateless, logout is primarily handled client-side by removing the token. This endpoint can optionally implement token blacklisting for enhanced security.

#### 3.1.3 POST /api/v1/auth/refresh

**Description**: Refresh JWT token before expiration

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**: None

**Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-11-16T07:59:59.000Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "code": "TOKEN_EXPIRED"
}
```

**Refresh Rules**:
- Can only refresh within 1 hour of expiration
- Cannot refresh already-expired tokens
- New token has same claims as old token
- Old token remains valid until its original expiration

#### 3.1.4 GET /api/v1/auth/verify

**Description**: Verify if current JWT token is valid

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK)**:
```json
{
  "valid": true,
  "user": {
    "id": "user-12345",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "roles": ["analyst", "viewer"],
    "domains": ["vehicle-discovery", "analytics"]
  },
  "expiresAt": "2025-11-15T23:59:59.000Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "valid": false,
  "error": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### 3.2 User Management Endpoints (Admin Only)

#### 3.2.1 GET /api/v1/admin/users

**Description**: List all users (admin only)

**Authorization**: Requires `admin` role + `admin` domain

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `search` (optional): Search by username or email

**Response (200 OK)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "user-12345",
      "username": "john.doe",
      "email": "john.doe@example.com",
      "roles": ["analyst", "viewer"],
      "domains": ["vehicle-discovery", "analytics"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastLogin": "2025-11-15T08:30:00.000Z",
      "active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

#### 3.2.2 POST /api/v1/admin/users

**Description**: Create new user (admin only)

**Authorization**: Requires `admin` role + `admin` domain

**Request**:
```json
{
  "username": "jane.smith",
  "email": "jane.smith@example.com",
  "password": "SecurePassword123!",
  "roles": ["viewer"],
  "domains": ["vehicle-discovery"]
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "user": {
    "id": "user-67890",
    "username": "jane.smith",
    "email": "jane.smith@example.com",
    "roles": ["viewer"],
    "domains": ["vehicle-discovery"],
    "createdAt": "2025-11-15T12:00:00.000Z",
    "active": true
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Username already exists",
  "code": "DUPLICATE_USERNAME"
}
```

#### 3.2.3 PUT /api/v1/admin/users/:id

**Description**: Update user roles and domains (admin only)

**Authorization**: Requires `admin` role + `admin` domain

**Request**:
```json
{
  "roles": ["analyst", "viewer"],
  "domains": ["vehicle-discovery", "analytics", "admin"]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "user-67890",
    "username": "jane.smith",
    "email": "jane.smith@example.com",
    "roles": ["analyst", "viewer"],
    "domains": ["vehicle-discovery", "analytics", "admin"],
    "updatedAt": "2025-11-15T12:30:00.000Z"
  }
}
```

#### 3.2.4 DELETE /api/v1/admin/users/:id

**Description**: Deactivate user account (admin only)

**Authorization**: Requires `admin` role + `admin` domain

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

**Note**: Users are deactivated (soft delete), not permanently deleted, for audit trail purposes.

---

## 4. DATA MODELS

### 4.1 User Model

**Elasticsearch Index**: `auto-discovery-users`

```typescript
interface User {
  id: string;                    // Unique identifier (UUID)
  username: string;              // Unique username (lowercase, alphanumeric + underscore)
  email: string;                 // Email address (unique)
  passwordHash: string;          // bcrypt hash of password (never returned in API)
  roles: string[];               // Array of role names
  domains: string[];             // Array of domain names
  active: boolean;               // Account active status
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  lastLogin: string | null;      // ISO 8601 timestamp or null
  failedLoginAttempts: number;   // Failed login counter
  lockedUntil: string | null;    // ISO 8601 timestamp or null
}
```

**Example Document**:
```json
{
  "id": "user-12345",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "passwordHash": "$2b$10$abcdefghijklmnopqrstuvwxyz...",
  "roles": ["analyst", "viewer"],
  "domains": ["vehicle-discovery", "analytics"],
  "active": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-11-15T08:00:00.000Z",
  "lastLogin": "2025-11-15T08:30:00.000Z",
  "failedLoginAttempts": 0,
  "lockedUntil": null
}
```

### 4.2 Role Model (Configuration-Based)

**Storage**: Hardcoded in auth service configuration (not in database for bare-bones approach)

```typescript
interface Role {
  name: string;                  // Role identifier
  description: string;           // Human-readable description
  impliedDomains: string[];      // Domains automatically granted with this role
}
```

**Predefined Roles**:
```typescript
const ROLES: Role[] = [
  {
    name: "admin",
    description: "System administrator with full access",
    impliedDomains: ["vehicle-discovery", "analytics", "admin"]
  },
  {
    name: "analyst",
    description: "Data analyst with read/write access to discovery features",
    impliedDomains: ["vehicle-discovery", "analytics"]
  },
  {
    name: "viewer",
    description: "Read-only user for discovery features",
    impliedDomains: ["vehicle-discovery"]
  }
];
```

### 4.3 Domain Model (Configuration-Based)

**Storage**: Hardcoded in auth service configuration

```typescript
interface Domain {
  name: string;                  // Domain identifier
  description: string;           // Human-readable description
  public: boolean;               // Whether domain requires authentication
}
```

**Predefined Domains**:
```typescript
const DOMAINS: Domain[] = [
  {
    name: "public",
    description: "Public resources (login page, health checks)",
    public: true
  },
  {
    name: "vehicle-discovery",
    description: "Vehicle browsing and filtering features",
    public: false
  },
  {
    name: "analytics",
    description: "Data visualization and charting features",
    public: false
  },
  {
    name: "admin",
    description: "Administrative and user management features",
    public: false
  }
];
```

---

## 5. BACKEND INTEGRATION

### 5.1 Auth Service Architecture

**Technology**: Node.js + Express (matching existing backend)

**Directory Structure**:
```
backend/
├── src/
│   ├── auth/                           # NEW: Authentication module
│   │   ├── auth.controller.js          # Auth endpoints (login, logout, verify)
│   │   ├── auth.service.js             # Auth business logic
│   │   ├── jwt.service.js              # JWT generation and validation
│   │   ├── password.service.js         # Password hashing (bcrypt)
│   │   ├── rate-limiter.service.js     # Login rate limiting
│   │   └── auth.routes.js              # Auth route definitions
│   │
│   ├── middleware/                     # NEW: Middleware
│   │   ├── auth.middleware.js          # JWT validation middleware
│   │   ├── role.middleware.js          # Role authorization middleware
│   │   └── domain.middleware.js        # Domain authorization middleware
│   │
│   ├── admin/                          # NEW: Admin module
│   │   ├── user.controller.js          # User management endpoints
│   │   ├── user.service.js             # User CRUD operations
│   │   └── admin.routes.js             # Admin route definitions
│   │
│   ├── config/
│   │   ├── elasticsearch.js            # Existing ES config
│   │   └── auth.config.js              # NEW: Auth configuration
│   │
│   ├── controllers/
│   │   └── vehicleController.js        # Existing vehicle controller
│   │
│   ├── routes/
│   │   └── vehicleRoutes.js            # Existing vehicle routes
│   │
│   ├── services/
│   │   └── elasticsearchService.js     # Existing ES service
│   │
│   └── index.js                        # Server entry point (updated)
│
├── package.json                        # Updated dependencies
└── Dockerfile                          # Existing Docker config
```

### 5.2 Required Dependencies

**Add to package.json**:
```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "express-rate-limit": "^7.1.5"
  }
}
```

### 5.3 Environment Variables

**Add to backend deployment**:
```bash
# JWT Configuration
JWT_SECRET=<random-256-bit-secret>           # REQUIRED: Secret for signing JWTs
JWT_EXPIRES_IN=8h                            # Token expiration time
JWT_REFRESH_WINDOW=1h                        # Time window for refresh

# Password Configuration
BCRYPT_ROUNDS=10                             # bcrypt hash rounds

# Rate Limiting
LOGIN_RATE_LIMIT_WINDOW=15                   # Minutes
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5              # Max attempts per window

# Elasticsearch User Index
ES_USER_INDEX=auto-discovery-users           # User data index
```

### 5.4 Middleware Integration

**Protected Route Example**:
```javascript
// vehicleRoutes.js (existing file - needs update)
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { verifyToken, requireRole, requireDomain } = require('../middleware/auth.middleware');

// Protected endpoint - requires authentication + viewer role + vehicle-discovery domain
router.get(
  '/manufacturer-model-combinations',
  verifyToken,
  requireRole('viewer'),
  requireDomain('vehicle-discovery'),
  vehicleController.getManufacturerModelCombinations
);

module.exports = router;
```

**Middleware Functions**:

```javascript
// auth.middleware.js (NEW FILE)
const jwtService = require('../auth/jwt.service');

/**
 * Verify JWT token and attach user to request
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwtService.verifyToken(token);
    req.user = decoded;  // Attach user claims to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Require specific role
 */
function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Admin has access to everything
    if (req.user.roles.includes('admin')) {
      return next();
    }

    // Check if user has required role
    if (!req.user.roles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        error: `Requires ${roleName} role`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
}

/**
 * Require specific domain access
 */
function requireDomain(domainName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Admin has access to all domains
    if (req.user.roles.includes('admin')) {
      return next();
    }

    // Check if user has required domain
    if (!req.user.domains.includes(domainName)) {
      return res.status(403).json({
        success: false,
        error: `Requires ${domainName} domain access`,
        code: 'INSUFFICIENT_DOMAIN'
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  requireDomain
};
```

---

## 6. FRONTEND INTEGRATION

### 6.1 Angular Service Architecture

**New Services**:
```
frontend/src/app/core/services/
├── auth.service.ts              # NEW: Authentication service
├── auth-storage.service.ts      # NEW: Token storage service
└── current-user.service.ts      # NEW: Current user state service
```

### 6.2 AuthService Interface

```typescript
// auth.service.ts (NEW FILE)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStorageService } from './auth-storage.service';
import { CurrentUserService } from './current-user.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  expiresAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  domains: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = '/api/v1/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private authStorage: AuthStorageService,
    private currentUser: CurrentUserService
  ) {
    // Check for existing token on service initialization
    this.checkExistingAuth();
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_BASE}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response.success) {
            this.authStorage.setToken(response.token);
            this.currentUser.setUser(response.user);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.http.post(`${this.API_BASE}/logout`, {}).subscribe({
      complete: () => {
        this.clearSession();
      },
      error: () => {
        // Clear session even if API call fails
        this.clearSession();
      }
    });
  }

  /**
   * Verify if current token is valid
   */
  verifyToken(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>(`${this.API_BASE}/verify`)
      .pipe(
        map(response => response.valid),
        tap(valid => {
          if (!valid) {
            this.clearSession();
          }
        })
      );
  }

  /**
   * Refresh JWT token
   */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_BASE}/refresh`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            this.authStorage.setToken(response.token);
          }
        })
      );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authStorage.hasToken();
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return this.authStorage.getToken();
  }

  /**
   * Clear session and redirect to login
   */
  private clearSession(): void {
    this.authStorage.clearToken();
    this.currentUser.clearUser();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Check for existing authentication on service initialization
   */
  private checkExistingAuth(): void {
    if (this.authStorage.hasToken()) {
      this.verifyToken().subscribe({
        next: (valid) => {
          this.isAuthenticatedSubject.next(valid);
        },
        error: () => {
          this.clearSession();
        }
      });
    }
  }
}
```

### 6.3 Route Guards

**Create Auth Guard**:
```typescript
// auth.guard.ts (NEW FILE)
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CurrentUserService } from '../services/current-user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private currentUser: CurrentUserService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Check role requirements (if specified in route data)
    const requiredRole = route.data['requiredRole'];
    if (requiredRole && !this.currentUser.hasRole(requiredRole)) {
      return this.router.createUrlTree(['/unauthorized']);
    }

    // Check domain requirements (if specified in route data)
    const requiredDomain = route.data['requiredDomain'];
    if (requiredDomain && !this.currentUser.hasDomain(requiredDomain)) {
      return this.router.createUrlTree(['/unauthorized']);
    }

    return true;
  }
}
```

**Apply Guard to Routes**:
```typescript
// app-routing.module.ts (UPDATE EXISTING FILE)
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Public routes
  {
    path: 'login',
    component: LoginComponent
  },

  // Protected routes
  {
    path: 'discover',
    component: DiscoverComponent,
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'viewer',
      requiredDomain: 'vehicle-discovery'
    }
  },

  // Admin routes
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'admin',
      requiredDomain: 'admin'
    }
  },

  // Default route
  {
    path: '',
    redirectTo: '/discover',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 6.4 HTTP Interceptor

**JWT Interceptor** (attach token to all requests):

```typescript
// jwt.interceptor.ts (NEW FILE)
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from auth service
    const token = this.authService.getToken();

    // Clone request and add Authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
```

**Register Interceptor**:
```typescript
// app.module.ts (UPDATE EXISTING FILE)
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ]
})
export class AppModule { }
```

### 6.5 Login Component

**Create Login Page**:
```typescript
// login.component.ts (NEW FILE)
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  returnUrl: string = '/discover';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Get return URL from query params or default to '/discover'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/discover';

    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Login failed. Please try again.';
      }
    });
  }
}
```

---

## 7. KUBERNETES DEPLOYMENT

### 7.1 Auth Service Deployment

**Create new Kubernetes deployment for auth service** (or integrate into existing backend):

**Option A: Separate Auth Service Deployment**

```yaml
# k8s/auth-deployment.yaml (NEW FILE)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auto-discovery-auth
  namespace: auto-discovery
  labels:
    app: auto-discovery-auth
    tier: backend
    version: v1.0.0
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auto-discovery-auth
  template:
    metadata:
      labels:
        app: auto-discovery-auth
        tier: backend
        version: v1.0.0
    spec:
      nodeSelector:
        kubernetes.io/hostname: thor
      containers:
      - name: auth
        image: localhost/auto-discovery-auth:v1.0.0
        imagePullPolicy: Never
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: ELASTICSEARCH_URL
          value: "http://elasticsearch.data.svc.cluster.local:9200"
        - name: ES_USER_INDEX
          value: "auto-discovery-users"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auto-discovery-secrets
              key: jwt-secret
        - name: JWT_EXPIRES_IN
          value: "8h"
        - name: JWT_REFRESH_WINDOW
          value: "1h"
        - name: BCRYPT_ROUNDS
          value: "10"
        - name: LOGIN_RATE_LIMIT_WINDOW
          value: "15"
        - name: LOGIN_RATE_LIMIT_MAX_ATTEMPTS
          value: "5"
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
```

**Option B: Integrate into Existing Backend** (Recommended for bare-bones approach)

Update `backend-deployment.yaml` environment variables:
```yaml
# k8s/backend-deployment.yaml (UPDATE EXISTING FILE)
env:
  # Existing environment variables
  - name: ELASTICSEARCH_URL
    value: "http://elasticsearch.data.svc.cluster.local:9200"
  - name: ELASTICSEARCH_INDEX
    value: "autos-unified"

  # NEW: Auth configuration
  - name: ES_USER_INDEX
    value: "auto-discovery-users"
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: auto-discovery-secrets
        key: jwt-secret
  - name: JWT_EXPIRES_IN
    value: "8h"
  - name: JWT_REFRESH_WINDOW
    value: "1h"
  - name: BCRYPT_ROUNDS
    value: "10"
  - name: LOGIN_RATE_LIMIT_WINDOW
    value: "15"
  - name: LOGIN_RATE_LIMIT_MAX_ATTEMPTS
    value: "5"
```

### 7.2 Kubernetes Secret

**Create secret for JWT signing key**:

```yaml
# k8s/secrets.yaml (NEW FILE)
apiVersion: v1
kind: Secret
metadata:
  name: auto-discovery-secrets
  namespace: auto-discovery
type: Opaque
data:
  # Base64-encoded JWT secret (replace with actual random 256-bit value)
  jwt-secret: <base64-encoded-secret>
```

**Generate JWT secret**:
```bash
# Generate random 256-bit secret and base64 encode
openssl rand -base64 32 | tr -d '\n' | base64
```

### 7.3 Ingress Update

**Update ingress to route auth endpoints**:

```yaml
# k8s/ingress.yaml (UPDATE EXISTING FILE)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auto-discovery
  namespace: auto-discovery
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  ingressClassName: traefik
  rules:
  - host: auto-discovery.minilab
    http:
      paths:
      # Auth endpoints (priority: highest)
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-backend  # Or auto-discovery-auth if separate
            port:
              number: 3000

      # Admin endpoints
      - path: /api/v1/admin
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-backend
            port:
              number: 3000

      # All other API endpoints
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-backend
            port:
              number: 3000

      # Frontend
      - path: /
        pathType: Prefix
        backend:
          service:
            name: auto-discovery-frontend
            port:
              number: 80
```

---

## 8. SECURITY CONSIDERATIONS

### 8.1 Password Security

**Requirements**:
- Passwords MUST be hashed using bcrypt (minimum 10 rounds)
- Passwords MUST meet complexity requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Password hashes MUST NEVER be returned in API responses
- Password reset functionality (future enhancement)

### 8.2 Token Security

**Requirements**:
- JWT tokens MUST be signed with HS256 (HMAC-SHA256)
- JWT secret MUST be at least 256 bits (32 bytes)
- JWT secret MUST be stored in Kubernetes Secret
- JWT secret MUST be different per environment (dev, staging, prod)
- Tokens MUST have expiration time (default: 8 hours)
- Tokens MUST include minimal claims (no sensitive data)
- Tokens SHOULD be refreshable within 1 hour of expiration
- Optional: Implement token blacklist for logout (future enhancement)

### 8.3 Rate Limiting

**Requirements**:
- Login endpoint MUST implement rate limiting
- Maximum 5 failed attempts per username per 15 minutes
- After 5 failures, lock account for 15 minutes
- Rate limits stored in memory (or Redis for distributed systems - future enhancement)

### 8.4 CORS Configuration

**Requirements**:
- Backend MUST enable CORS for frontend origin
- Allowed origins: `http://auto-discovery.minilab`
- Allow credentials: `true`
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers: `Content-Type, Authorization`

### 8.5 HTTPS/TLS

**Production Requirement**:
- All production deployments MUST use HTTPS
- HTTP requests MUST redirect to HTTPS
- JWT tokens MUST be transmitted over HTTPS only
- Cookies (if used) MUST have `Secure` flag set

**Development Exception**:
- HTTP allowed in local development environment (minilab)

---

## 9. INITIAL SETUP & BOOTSTRAPPING

### 9.1 Default Admin Account

**Purpose**: Provide initial admin access for system setup

**Default Credentials** (for development only):
```
Username: admin
Password: Admin123!
```

**Bootstrapping Process**:
1. On first startup, auth service checks for existing users in Elasticsearch
2. If `auto-discovery-users` index is empty, create default admin user
3. Hash password using bcrypt
4. Insert user document with admin role and all domains
5. Log creation to console
6. **IMPORTANT**: Change default password immediately after first login

**Automated Bootstrap Script**:
```javascript
// bootstrap.js (NEW FILE)
const elasticsearchService = require('./services/elasticsearchService');
const passwordService = require('./auth/password.service');

async function bootstrapAdminUser() {
  const ES_USER_INDEX = process.env.ES_USER_INDEX || 'auto-discovery-users';

  try {
    // Check if any users exist
    const userCount = await elasticsearchService.count(ES_USER_INDEX);

    if (userCount === 0) {
      console.log('No users found. Creating default admin user...');

      const passwordHash = await passwordService.hashPassword('Admin123!');

      const adminUser = {
        id: 'user-admin-default',
        username: 'admin',
        email: 'admin@auto-discovery.local',
        passwordHash,
        roles: ['admin'],
        domains: ['vehicle-discovery', 'analytics', 'admin'],
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      };

      await elasticsearchService.index(ES_USER_INDEX, adminUser.id, adminUser);

      console.log('✅ Default admin user created successfully');
      console.log('⚠️  WARNING: Change default password immediately!');
      console.log('   Username: admin');
      console.log('   Password: Admin123!');
    } else {
      console.log(`Found ${userCount} existing users. Skipping bootstrap.`);
    }
  } catch (error) {
    console.error('❌ Failed to bootstrap admin user:', error);
  }
}

module.exports = { bootstrapAdminUser };
```

**Call bootstrap on server startup**:
```javascript
// index.js (UPDATE EXISTING FILE)
const { bootstrapAdminUser } = require('./bootstrap');

async function startServer() {
  // Existing server setup...

  // Bootstrap admin user if needed
  await bootstrapAdminUser();

  // Start Express server
  app.listen(PORT, () => {
    console.log(`Auto Discovery Backend API listening on port ${PORT}`);
  });
}

startServer();
```

### 9.2 Elasticsearch Index Setup

**Create user index mapping**:
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "username": { "type": "keyword" },
      "email": { "type": "keyword" },
      "passwordHash": { "type": "text", "index": false },
      "roles": { "type": "keyword" },
      "domains": { "type": "keyword" },
      "active": { "type": "boolean" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "lastLogin": { "type": "date" },
      "failedLoginAttempts": { "type": "integer" },
      "lockedUntil": { "type": "date" }
    }
  }
}
```

**Index Creation Script**:
```javascript
// Create index on first startup
async function ensureUserIndex() {
  const ES_USER_INDEX = process.env.ES_USER_INDEX || 'auto-discovery-users';

  const indexExists = await elasticsearchService.indexExists(ES_USER_INDEX);

  if (!indexExists) {
    console.log(`Creating user index: ${ES_USER_INDEX}`);
    await elasticsearchService.createIndex(ES_USER_INDEX, {
      mappings: { /* mapping definition above */ }
    });
    console.log('✅ User index created successfully');
  }
}
```

---

## 10. TESTING STRATEGY

### 10.1 Backend Testing

**Test Coverage Requirements**:
- Auth service: 90% minimum
- JWT service: 95% minimum
- Middleware: 85% minimum

**Test Scenarios**:

**Authentication Tests**:
- ✅ Successful login with valid credentials
- ✅ Failed login with invalid username
- ✅ Failed login with invalid password
- ✅ Account lockout after 5 failed attempts
- ✅ Account unlock after 15 minutes
- ✅ JWT token generation with correct claims
- ✅ JWT token expiration after configured TTL
- ✅ Token refresh within refresh window
- ✅ Token refresh rejection outside refresh window
- ✅ Logout clears session

**Authorization Tests**:
- ✅ Access granted with valid role
- ✅ Access denied without required role
- ✅ Access granted with admin role (bypass)
- ✅ Access granted with valid domain
- ✅ Access denied without required domain
- ✅ Multiple role permission union

**Password Tests**:
- ✅ Password hashing with bcrypt
- ✅ Password validation against hash
- ✅ Password complexity requirements

### 10.2 Frontend Testing

**Test Coverage Requirements**:
- Auth service: 85% minimum
- Auth guard: 90% minimum
- Login component: 80% minimum

**E2E Test Scenarios**:
- ✅ Login flow: Enter credentials → Submit → Redirect to discover page
- ✅ Logout flow: Click logout → Clear session → Redirect to login
- ✅ Protected route: Access without auth → Redirect to login
- ✅ Role-based routing: Access admin page without admin role → Unauthorized
- ✅ Token expiration: Wait for expiration → Auto-logout
- ✅ Invalid credentials: Submit bad password → Show error message

---

## 11. IMPLEMENTATION PHASES

### Phase 1: Backend Foundation (Week 1)
- [ ] Set up JWT service (generation, verification, refresh)
- [ ] Set up password service (hashing, validation)
- [ ] Set up Elasticsearch user index
- [ ] Implement bootstrap script for default admin user
- [ ] Create auth middleware (verifyToken, requireRole, requireDomain)
- [ ] Write unit tests for JWT and password services

### Phase 2: Auth Endpoints (Week 1-2)
- [ ] Implement POST /api/v1/auth/login
- [ ] Implement POST /api/v1/auth/logout
- [ ] Implement POST /api/v1/auth/refresh
- [ ] Implement GET /api/v1/auth/verify
- [ ] Implement rate limiting for login endpoint
- [ ] Write integration tests for auth endpoints

### Phase 3: User Management (Week 2)
- [ ] Implement GET /api/v1/admin/users
- [ ] Implement POST /api/v1/admin/users
- [ ] Implement PUT /api/v1/admin/users/:id
- [ ] Implement DELETE /api/v1/admin/users/:id
- [ ] Protect existing vehicle endpoints with auth middleware
- [ ] Write integration tests for admin endpoints

### Phase 4: Frontend Auth (Week 2-3)
- [ ] Create AuthService
- [ ] Create AuthStorageService
- [ ] Create CurrentUserService
- [ ] Create JwtInterceptor
- [ ] Create AuthGuard
- [ ] Create LoginComponent
- [ ] Update routes with auth guards
- [ ] Write unit tests for auth services

### Phase 5: Integration & Testing (Week 3)
- [ ] End-to-end testing: Login → Browse vehicles → Logout
- [ ] Test role-based access control
- [ ] Test domain-based access control
- [ ] Test token expiration and refresh
- [ ] Performance testing: Concurrent login requests
- [ ] Security testing: Brute-force protection

### Phase 6: Kubernetes Deployment (Week 3-4)
- [ ] Create Kubernetes secret for JWT key
- [ ] Update backend deployment with auth environment variables
- [ ] Update ingress for auth routing
- [ ] Deploy to development environment
- [ ] Verify auth flow in deployed environment
- [ ] Create deployment documentation

---

## 12. FUTURE ENHANCEMENTS (Out of Scope)

**Not included in bare-bones implementation but recommended for future**:

1. **Password Reset**: Email-based password reset workflow
2. **Multi-Factor Authentication (MFA)**: TOTP-based 2FA
3. **OAuth/SSO Integration**: Google, Microsoft, SAML support
4. **Token Blacklist**: Redis-based token revocation for logout
5. **Audit Logging**: Log all authentication and authorization events
6. **Session Management**: View and revoke active sessions
7. **API Keys**: Service-to-service authentication
8. **Fine-Grained Permissions**: Beyond role + domain model
9. **User Profile Management**: Self-service profile updates
10. **Password Policies**: Configurable complexity rules, expiration

---

## APPENDIX A: API ENDPOINT SUMMARY

| Method | Endpoint | Auth Required | Role | Domain | Description |
|--------|----------|---------------|------|--------|-------------|
| POST | /api/v1/auth/login | No | - | public | Login with username/password |
| POST | /api/v1/auth/logout | Yes | - | - | Logout and clear session |
| POST | /api/v1/auth/refresh | Yes | - | - | Refresh JWT token |
| GET | /api/v1/auth/verify | Yes | - | - | Verify token validity |
| GET | /api/v1/admin/users | Yes | admin | admin | List all users |
| POST | /api/v1/admin/users | Yes | admin | admin | Create new user |
| PUT | /api/v1/admin/users/:id | Yes | admin | admin | Update user roles/domains |
| DELETE | /api/v1/admin/users/:id | Yes | admin | admin | Deactivate user |
| GET | /api/v1/manufacturer-model-combinations | Yes | viewer | vehicle-discovery | Get vehicle data |

---

## APPENDIX B: ROLE-DOMAIN MATRIX

| Role | vehicle-discovery | analytics | admin | Description |
|------|-------------------|-----------|-------|-------------|
| **admin** | ✅ Full | ✅ Full | ✅ Full | Complete system access |
| **analyst** | ✅ Full | ✅ Full | ❌ None | Discovery + analytics access |
| **viewer** | ✅ Read-Only | ❌ None | ❌ None | Read-only discovery access |
| **guest** | ❌ None | ❌ None | ❌ None | No access (unauthenticated) |

---

## APPENDIX C: FRONTEND ROUTE PROTECTION

```typescript
// Route configuration with auth requirements
const routes: Routes = [
  // Public (no auth)
  { path: 'login', component: LoginComponent },

  // Viewer+ (vehicle-discovery domain)
  {
    path: 'discover',
    component: DiscoverComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'viewer', requiredDomain: 'vehicle-discovery' }
  },

  // Analyst+ (analytics domain)
  {
    path: 'charts',
    component: ChartsComponent,
    canActivate: [AuthGuard],
    data: { requiredRole: 'analyst', requiredDomain: 'analytics' }
  },

  // Admin only (admin domain)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module'),
    canActivate: [AuthGuard],
    data: { requiredRole: 'admin', requiredDomain: 'admin' }
  }
];
```

---

## APPENDIX D: SECURITY CONCEPTS EXPLAINED (FOR NOVICES)

This appendix provides beginner-friendly explanations of key security concepts referenced throughout this specification.

---

### Quick Reference: Acronyms Used in This Document

| Acronym | Full Name | Simple Explanation |
|---------|-----------|-------------------|
| **API** | **A**pplication **P**rogramming **I**nterface | How different software programs talk to each other |
| **CA** | **C**ertificate **A**uthority | Trusted company that verifies website identities (like VeriSign, Let's Encrypt) |
| **CORS** | **C**ross-**O**rigin **R**esource **S**haring | Browser security that controls which websites can access your API |
| **GDPR** | **G**eneral **D**ata **P**rotection **R**egulation | European privacy law protecting user data |
| **HIPAA** | **H**ealth **I**nsurance **P**ortability and **A**ccountability **A**ct | US law protecting medical information |
| **HTTP** | **H**yper**T**ext **T**ransfer **P**rotocol | How web browsers and servers communicate (unencrypted) |
| **HTTPS** | **H**yper**T**ext **T**ransfer **P**rotocol **S**ecure | HTTP with encryption (secure) |
| **JSON** | **J**ava**S**cript **O**bject **N**otation | Simple text format for storing data: `{"name": "value"}` |
| **JWT** | **J**SON **W**eb **T**oken | Digital ID card proving who you are |
| **MFA** | **M**ulti-**F**actor **A**uthentication | Login requiring 2+ proofs (password + phone code) |
| **PCI-DSS** | **P**ayment **C**ard **I**ndustry **D**ata **S**ecurity **S**tandard | Security rules for handling credit card data |
| **RBAC** | **R**ole-**B**ased **A**ccess **C**ontrol | Permissions based on user role (admin, viewer, etc.) |
| **SSL** | **S**ecure **S**ockets **L**ayer | Old encryption standard (replaced by TLS, but name still used) |
| **TLS** | **T**ransport **L**ayer **S**ecurity | Modern encryption standard for HTTPS |
| **TOTP** | **T**ime-based **O**ne-**T**ime **P**assword | 6-digit codes that change every 30 seconds (like Google Authenticator) |
| **TTL** | **T**ime **T**o **L**ive | How long something stays valid before expiring |
| **URL** | **U**niform **R**esource **L**ocator | Web address (like `http://example.com/page`) |

---

### Quick Reference: Technical Terms

| Term | Simple Explanation |
|------|-------------------|
| **Authentication** | Proving who you are (like showing ID at airport security) |
| **Authorization** | Proving what you're allowed to do (like showing a ticket to enter a concert) |
| **bcrypt** | A secure method for scrambling passwords so they can't be read if stolen |
| **Claims** | Information stored inside a JWT token (like "username", "roles") |
| **Cookie** | Small piece of data stored in your browser (like a website's memory of you) |
| **Credential** | Information that proves identity (username + password, or a token) |
| **Endpoint** | A specific URL on the server that does something (like `/api/v1/login`) |
| **Hash** | One-way scrambling of data (can't be unscrambled, only compared) |
| **HS256** | HMAC-SHA256, a specific algorithm for creating digital signatures |
| **Header** | Metadata sent with every web request (like "who I am" or "what format I want") |
| **Interceptor** | Code that automatically runs for every HTTP request (like a middleman) |
| **Payload** | The actual data being sent (as opposed to metadata/headers) |
| **Rate Limiting** | Restricting how many attempts someone can make (to prevent attacks) |
| **Session** | The period when you're logged in (from login to logout) |
| **Token** | A piece of data that proves who you are (like a digital ID badge) |

---

### D.1 JWT Signature Verification

**Acronym Expanded**: JWT = **J**SON **W**eb **T**oken

**What is JSON?** JavaScript Object Notation - a simple text format for storing data that looks like this: `{"name": "John", "age": 30}`

**What is it?**

JWT (JSON Web Token) signature verification is the process of ensuring that a token hasn't been tampered with since it was created by the server.

A **token** is like a digital ID card that proves who you are and what you're allowed to do.

**The Analogy: Sealed Envelope**

Imagine you receive a sealed envelope with a wax seal bearing the king's crest:
- The **envelope** = JWT token
- The **letter inside** = User information (username, roles, domains)
- The **wax seal** = Digital signature
- The **king's crest** = Secret key only the server knows

When you receive the envelope, you can verify it's authentic by checking:
1. Is the wax seal intact? (Has the token been modified?)
2. Does the crest match the king's official seal? (Was this signed by our server?)

If someone tries to change the letter inside (e.g., add "admin" role), the seal breaks and verification fails.

**How it Works Technically**

```
┌─────────────────────────────────────────┐
│ JWT Token Structure                     │
├─────────────────────────────────────────┤
│ Header:                                 │
│   { "alg": "HS256", "typ": "JWT" }     │
│                                         │
│ Payload (User Claims):                  │
│   {                                     │
│     "username": "john.doe",            │
│     "roles": ["viewer"],               │
│     "exp": 1700028800                  │
│   }                                     │
│                                         │
│ Signature (Mathematical Proof):         │
│   HMACSHA256(                           │
│     base64(header) + "." + base64(payload),
│     SECRET_KEY                          │
│   )                                     │
└─────────────────────────────────────────┘
```

**Verification Process**:

1. **Server receives token**: `eyJhbGci...` (looks like gibberish)
2. **Server splits token**: Separates header, payload, and signature
3. **Server re-calculates signature**: Uses the same algorithm + secret key
4. **Server compares**:
   - If original signature === re-calculated signature → ✅ **Valid** (not tampered)
   - If signatures don't match → ❌ **Invalid** (tampered or forged)

**Why This Matters**

Without signature verification, a malicious user could:
1. Copy their token
2. Change `"roles": ["viewer"]` to `"roles": ["admin"]`
3. Submit the modified token
4. Gain unauthorized admin access

**With** signature verification:
- Modified tokens fail verification immediately
- Server rejects the request
- Attacker is denied access

**Key Requirement**: The secret key MUST be kept secret. If an attacker obtains the secret key, they can create valid tokens with any claims.

---

### D.2 CORS Configuration

**Acronym Expanded**: CORS = **C**ross-**O**rigin **R**esource **S**haring

**What is "Cross-Origin"?** When one website (origin A) tries to access resources from a different website (origin B). For example, `yoursite.com` trying to fetch data from `api.yoursite.com`.

**What is "Resource Sharing"?** Allowing or denying access to your API endpoints (resources) based on where the request comes from.

**What is it?**

CORS (Cross-Origin Resource Sharing) is a security feature built into web browsers that controls which websites can make requests to your API.

**The Analogy: Nightclub Bouncer**

Imagine your backend API is a nightclub:
- The **bouncer** = CORS policy
- **Guests** = Frontend applications trying to access your API
- **VIP list** = Allowed origins (`http://auto-discovery.minilab`)

The bouncer asks every guest: "Where are you coming from?"
- Guest says "auto-discovery.minilab" → ✅ Bouncer lets them in (on the VIP list)
- Guest says "evil-hacker-site.com" → ❌ Bouncer turns them away (not on the list)

**The Problem CORS Solves**

By default, browsers implement the **Same-Origin Policy**: JavaScript running on `website-a.com` **cannot** make requests to `website-b.com`.

This prevents malicious websites from:
1. User visits `evil-site.com`
2. Evil site's JavaScript tries to call `your-bank.com/transfer-money`
3. Browser blocks the request (different origins)

**Without CORS**, our Angular frontend (`http://auto-discovery.minilab`) cannot call our backend API (`http://auto-discovery.minilab/api`) if they're considered different "origins".

**What is an Origin?**

An origin = **Protocol** + **Domain** + **Port**

Examples:
- `http://auto-discovery.minilab` (origin 1)
- `http://auto-discovery.minilab:4200` (origin 2 - different port!)
- `https://auto-discovery.minilab` (origin 3 - different protocol!)
- `http://api.auto-discovery.minilab` (origin 4 - different subdomain!)

All four are **different origins** to the browser.

**How CORS Works**

```
┌──────────────┐                                  ┌──────────────┐
│   Browser    │                                  │   Backend    │
│  (Frontend)  │                                  │   API Server │
└──────┬───────┘                                  └──────┬───────┘
       │                                                 │
       │ 1. Preflight Request (OPTIONS)                 │
       │    Origin: http://auto-discovery.minilab      │
       │ ─────────────────────────────────────────────> │
       │                                                 │
       │                2. Check CORS Policy             │
       │                Is this origin allowed?          │
       │                                                 │
       │ 3. Preflight Response                          │
       │    Access-Control-Allow-Origin: http://...    │
       │    Access-Control-Allow-Methods: GET, POST     │
       │    Access-Control-Allow-Headers: Authorization │
       │ <───────────────────────────────────────────── │
       │                                                 │
       │ 4. ✅ Origin allowed! Send actual request      │
       │    GET /api/v1/vehicles                        │
       │    Authorization: Bearer eyJhbGci...           │
       │ ─────────────────────────────────────────────> │
       │                                                 │
       │ 5. Response with data                          │
       │ <───────────────────────────────────────────── │
       │                                                 │
```

**CORS Configuration for Auto Discovery**

```javascript
// backend/src/index.js
const cors = require('cors');

app.use(cors({
  origin: 'http://auto-discovery.minilab',        // Only allow our frontend
  credentials: true,                               // Allow cookies and auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'],      // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));
```

**What Each Setting Means**:

- **`origin`**: Which frontend domains can access the API
  - `'http://auto-discovery.minilab'` = Only our frontend
  - `'*'` = **DANGER!** Any website can access (never use in production)

- **`credentials: true`**: Allow sending authentication tokens
  - Required for `Authorization: Bearer <token>` headers
  - Required for cookies

- **`methods`**: Which HTTP verbs are allowed
  - GET = Read data
  - POST = Create data
  - PUT = Update data
  - DELETE = Remove data

- **`allowedHeaders`**: Which HTTP headers can be sent
  - `Content-Type` = Specify JSON format
  - `Authorization` = Send JWT tokens

**Why This Matters**

**Without proper CORS**:
```
❌ Browser console error:
Access to fetch at 'http://auto-discovery.minilab/api/v1/vehicles'
from origin 'http://auto-discovery.minilab:4200' has been blocked
by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

**With proper CORS**:
```
✅ Request succeeds
Frontend can fetch data from backend
Application works correctly
```

**Security Note**: CORS is a **browser security feature**. Tools like `curl`, Postman, or malicious backend services can bypass CORS. CORS only protects against attacks originating from web browsers.

---

### D.3 HTTPS Requirement for Production

**Acronyms Expanded**:
- HTTP = **H**yper**T**ext **T**ransfer **P**rotocol (the language browsers and servers use to communicate)
- HTTPS = **H**yper**T**ext **T**ransfer **P**rotocol **S**ecure (HTTP with encryption)
- TLS = **T**ransport **L**ayer **S**ecurity (modern encryption standard)
- SSL = **S**ecure **S**ockets **L**ayer (older encryption standard, now replaced by TLS, but people still say "SSL")

**What is a "Protocol"?** A set of rules for how computers communicate. Like how humans have rules for polite conversation (say hello, take turns speaking), HTTP is the rules for web communication.

**What is it?**

HTTPS (Hypertext Transfer Protocol Secure) is the encrypted version of HTTP. It ensures that data transmitted between browser and server cannot be read or modified by attackers.

**The Analogy: Postcard vs. Sealed Letter**

**HTTP** (unencrypted):
- Like sending a **postcard** through the mail
- Anyone who handles the postcard can read it
- Postal workers, neighbors, mail thieves can all see the message
- Content can be altered: Someone could change "Send $100" to "Send $1000"

**HTTPS** (encrypted):
- Like sending a letter in a **locked box**
- Only you and the recipient have the key
- Mail handlers can see the box is being delivered, but can't read the contents
- Tamper-evident: If someone tries to open it, you'll know

**The Danger of HTTP**

When you send login credentials over HTTP:

```
┌─────────┐         ┌─────────────┐         ┌─────────┐
│ Browser │────────>│   Network   │────────>│ Server  │
│         │         │  (Coffee    │         │         │
│         │         │   Shop WiFi)│         │         │
└─────────┘         └─────────────┘         └─────────┘
                           │
                           │ 🕵️ Attacker can see:
                           │ POST /api/v1/auth/login
                           │ {
                           │   "username": "john.doe",
                           │   "password": "SecurePassword123!"
                           │ }
                           │
                           └──> ❌ PASSWORD STOLEN!
```

With HTTP, anyone on the network path can see **everything**:
- Your username and password
- Your JWT token
- Your personal data
- Your vehicle search queries
- Everything in plain text

**How HTTPS Protects You**

HTTPS uses **TLS/SSL encryption** to create a secure tunnel:

```
┌─────────┐         ┌─────────────┐         ┌─────────┐
│ Browser │────────>│   Network   │────────>│ Server  │
│         │         │  (Coffee    │         │         │
│         │         │   Shop WiFi)│         │         │
└─────────┘         └─────────────┘         └─────────┘
                           │
                           │ 🕵️ Attacker can only see:
                           │
                           │ 🔒 Encrypted gibberish:
                           │ b8f4c9a1e7d2f5g3h8j1k4m7n9p2q5r8...
                           │
                           └──> ✅ Cannot read anything!
```

**What HTTPS Encrypts**:
- ✅ HTTP headers (including `Authorization: Bearer <token>`)
- ✅ Request body (login credentials, form data)
- ✅ Response body (user data, vehicle information)
- ✅ Query parameters (`?manufacturer=Ford&model=F-150`)
- ✅ Cookies

**What HTTPS Does NOT Encrypt** (visible to network observers):
- ❌ Domain name (`auto-discovery.minilab`)
- ❌ IP address (where you're connecting)
- ❌ Fact that you're making a connection
- ❌ Approximate data size

**How HTTPS Works (Simplified)**

1. **Browser → Server**: "Hey, I want to connect securely"
2. **Server → Browser**: "Here's my certificate proving I'm auto-discovery.minilab"
3. **Browser verifies certificate**: "Let me check with trusted authorities... ✅ Valid!"
4. **Browser + Server**: Exchange cryptographic keys
5. **Secure tunnel established**: All further communication is encrypted
6. **Login request sent**: Encrypted credentials travel through tunnel
7. **Server receives**: Decrypts and processes login
8. **Response sent**: Encrypted JWT token travels back through tunnel

**Certificate Authorities (CAs)**

**Acronym Expanded**: CA = **C**ertificate **A**uthority

HTTPS relies on **trusted third parties** called Certificate Authorities:
- VeriSign, DigiCert, Let's Encrypt, etc.
- They vouch for your identity
- Browser trusts them by default
- Like a government issuing passports

**Why Production REQUIRES HTTPS**

**Security Reasons**:
1. **Credential Protection**: Passwords transmitted safely
2. **Token Protection**: JWT tokens cannot be stolen in transit
3. **Data Integrity**: Responses cannot be modified by attackers
4. **Authentication**: Proves you're connecting to the real server, not an imposter

**Compliance Reasons**:
5. **Industry Standards**: PCI-DSS (Payment Card Industry), GDPR (European privacy law), HIPAA (US healthcare law) all require encryption
6. **Browser Requirements**: Modern browsers show "Not Secure" warnings for HTTP
7. **Search Engine Ranking**: Google penalizes HTTP sites

**Trust Reasons**:
8. **User Confidence**: Green padlock = secure connection
9. **Professional Image**: HTTPS is expected for all legitimate websites

**What Happens Without HTTPS**:

```
Scenario: User on coffee shop WiFi logs into HTTP site

1. User enters: username=john.doe, password=SecurePassword123!
2. Transmitted in plain text over WiFi
3. 🕵️ Attacker running Wireshark captures packets
4. Attacker sees credentials in plain text
5. Attacker logs in as john.doe
6. Attacker gains access to user's account
7. ❌ Data breach, identity theft, unauthorized access
```

**With HTTPS**:

```
Same scenario with HTTPS:

1. User enters credentials
2. Encrypted before transmission
3. 🕵️ Attacker captures encrypted packets
4. Attacker sees: 7f8a9b2c4d5e6f1a3b7c9d2e4f6a8b1c...
5. Attacker cannot decrypt (needs private key from server)
6. ✅ User credentials remain safe
7. ✅ Login succeeds securely
```

**Development Exception**

It's acceptable to use HTTP in **local development** because:
- No data leaves your machine
- No network attackers (you control the network)
- Faster to set up (no certificate needed)
- `http://localhost` or `http://auto-discovery.minilab` (local hosts file)

**Production Non-Negotiable**: Always use HTTPS. No exceptions.

**How to Get HTTPS**

**Option 1: Let's Encrypt** (Free)
```bash
# Install certbot
sudo apt-get install certbot

# Get free certificate
sudo certbot --nginx -d auto-discovery.yourdomain.com
```

**Option 2: Cloud Provider** (AWS, Google Cloud, Azure)
- Usually includes free SSL certificates
- Automatic renewal
- Load balancer handles HTTPS

**Option 3: Traefik (Kubernetes - Our Setup)**
```yaml
# Traefik automatically handles Let's Encrypt
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
```

**Summary: Why Each Security Concept Matters**

| Concept | What It Protects | Attack It Prevents | Consequence If Missing |
|---------|------------------|-------------------|------------------------|
| **JWT Signature Verification** | Token integrity | Token tampering, privilege escalation | Attacker modifies token to gain admin access |
| **CORS Configuration** | API from unauthorized origins | Cross-site attacks from malicious websites | Evil site makes requests pretending to be user |
| **HTTPS in Production** | Data in transit | Man-in-the-middle, eavesdropping, credential theft | Passwords and tokens stolen over network |

**Defense in Depth**: All three work together to create a secure system. Removing any one creates a vulnerability.

---

**END OF SPECIFICATION**

This specification provides a complete, implementation-ready design for a bare-bones authentication and authorization system for the Auto Discovery platform. All API contracts, data models, integration points, and deployment requirements are defined in sufficient detail for backend and frontend teams to implement without ambiguity.
