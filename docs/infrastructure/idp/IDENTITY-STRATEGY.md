# Identity and Access Management (IAM) Strategy
**Project:** Generic Prime / Halo Labs Infrastructure  
**Date:** December 23, 2025  
**Context:** Halo Labs (Minilab) K3s Environment

---

## 1. Executive Summary

This document outlines the architecture for introducing enterprise-grade Authentication (AuthN) and Authorization (AuthZ) into the Halo Labs ecosystem. 

Rather than implementing custom authentication logic (a security anti-pattern), we will deploy **Keycloak** as a centralized Identity Provider (IdP). This treats Identity as a **Platform Service**—infrastructure shared across `generic-prime`, the `transportation-portal`, `RAG UI`, and `GitLab`.

### Strategic Goals
1.  **Centralization:** Single Sign-On (SSO) for all internal applications.
2.  **Standardization:** Use OpenID Connect (OIDC) and OAuth 2.0 standards.
3.  **Security:** Offload sensitive credential handling (hashing, MFA, resets) to a dedicated, battle-tested system.
4.  **Scalability:** Enable rapid secure onboarding of future applications without rewriting auth code.

---

## 2. Architecture: The "Platform Service" Model

We leverage the high-performance hardware (Thor/Loki) to run a dedicated IdP.

### Component Map

```mermaid
graph TD
    User((User)) -->|HTTPS| Traefik[Traefik Ingress *.minilab]
    
    subgraph "Halo Labs K3s Cluster"
        Traefik -->|auth.minilab| Keycloak[Keycloak (IdP)]
        Traefik -->|generic-prime.minilab| Angular[Generic Prime Frontend]
        Traefik -->|api.generic-prime| Node[Data Broker Backend]
        
        Keycloak -->|Persist| PG[Postgres DB]
    end
    
    Angular <-->|1. Login Flow (OIDC)| Keycloak
    Angular -->|2. API Request + Bearer Token| Node
    Node <-->|3. Validate Token (JWKS)| Keycloak
```

### Technology Selection
*   **Identity Provider:** **Keycloak**
    *   *Why:* Industry standard for Java/Angular ecosystems, supports full OIDC/SAML, highly configurable.
    *   *Alternative:* Authentik (lighter, but Keycloak offers better "corporate standard" simulation).
*   **Frontend Library:** `angular-oauth2-oidc`
    *   *Why:* The de-facto standard library for Angular OIDC integration. Certified certified by OpenID Foundation.
*   **Backend Validation:** `keycloak-connect` or `jsonwebtoken` + `jwks-rsa`
    *   *Why:* Standard middleware for verifying JWT signatures and claims in Node.js.

---

## 3. Implementation Roadmap

### Phase 1: Infrastructure Deployment (The IdP)
**Goal:** A running Keycloak instance accessible at `https://auth.minilab`.

1.  **Namespace:** Deploy to `platform` or `security` namespace.
2.  **Database:** Deploy PostgreSQL (stateful workload) backed by local-path storage on Thor/Loki.
3.  **Keycloak Deployment:**
    *   Image: `quay.io/keycloak/keycloak:latest`
    *   Ingress: Route `auth.minilab` via Traefik.
    *   TLS: Use existing wildcard `*.minilab` certificates.
4.  **Initial Configuration:**
    *   **Realm:** Create `halo-labs`.
    *   **Users:** Create admin users and test users.

### Phase 2: Frontend Integration (Angular)
**Goal:** `generic-prime` requires login to access specific features (e.g., Preferences).

1.  **Keycloak Config:**
    *   Create Client: `generic-prime-frontend`
    *   Access Type: `Public`
    *   Valid Redirect URIs: `https://generic-prime.minilab/*`, `http://localhost:4205/*`
    *   Web Origins: `+`
2.  **Angular Implementation:**
    *   Install `angular-oauth2-oidc`.
    *   Configure `AuthConfig`:
        ```typescript
        export const authConfig: AuthConfig = {
          issuer: 'https://auth.minilab/realms/halo-labs',
          redirectUri: window.location.origin + '/index.html',
          clientId: 'generic-prime-frontend',
          responseType: 'code',
          scope: 'openid profile email',
          showDebugInformation: true,
        };
        ```
    *   Implement `APP_INITIALIZER` to load discovery document on startup.
    *   Add `AuthGuard` to protect routes (e.g., `/preferences`, `/admin`).
    *   Add `HttpInterceptor` to attach `Authorization: Bearer <token>` to outbound API calls.

### Phase 3: Backend Integration (Data Broker)
**Goal:** Ensure API requests are authorized.

1.  **Keycloak Config:**
    *   Create Client: `generic-prime-backend` (Bearer-only).
2.  **Node.js Implementation:**
    *   Install middleware.
    *   Protect routes:
        ```javascript
        app.use('/api/preferences', keycloak.protect(), preferencesRoutes);
        ```
    *   **Validation Logic:**
        1.  Extract Token from Header.
        2.  Download Public Key from Keycloak (`/realms/halo-labs/protocol/openid-connect/certs`).
        3.  Verify Signature.
        4.  Check Claims (Expiration, Audience).
        5.  Extract Roles (`realm_access.roles`) for RBAC.

---

## 4. Specific Considerations for Minilab

### Development Environment Constraints
*   **Local Dev:** When running `ng serve` locally (port 4205), Keycloak must accept redirects to `localhost`.
*   **DNS:** The dev machine must be able to resolve `auth.minilab` to the cluster ingress IP (Loki/Thor).
*   **Certificates:** Since the CA is private, Node.js and local browsers must trust the Minilab Root CA, or strictly for dev, TLS verification might need to be explicitly managed (though trusting the CA is the correct path).

### Future Expansion
Once this foundation is laid, onboarding the **Transportation Portal** or **RAG UI** becomes trivial:
1.  Add new Client in Keycloak.
2.  Plug in OIDC library in the new app.
3.  Immediate SSO support (log in once, access all tools).
