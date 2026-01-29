# RBAC Implementation and Test Plan
**Project:** Generic Prime Identity
**Date:** December 23, 2025
**Context:** Role-Based Access Control (RBAC) Design for Multi-Domain Application

---

## 1. Role Architecture Strategy

To support the granular permissions required for Bob, Alice, and Frank, we cannot use simple "User/Admin" roles. We must implement **Domain-Scoped Roles**.

### Role Naming Convention
Format: `{domain}:{permission}`

**Available Roles in Keycloak:**
*   `global:admin` (Superuser)
*   `automobiles:admin`, `automobiles:view`
*   `physics:admin`, `physics:view`
*   `agriculture:admin`, `agriculture:view`
*   `chemistry:admin`, `chemistry:view`
*   `mathematics:admin`, `mathematics:view`

> **Note on Inheritance:** In Keycloak, we can configure "Composite Roles".
> *   `automobiles:admin` effectively includes `automobiles:view`.
> *   `global:admin` includes ALL other roles.

---

## 2. User & Account Creation (The "How")

Since we are simulating an enterprise environment, accounts are created by an Administrator in the **Keycloak Admin Console** (`https://auth.minilab`).

### Procedure for Creating Users
1.  Log in to Keycloak Admin Console (`admin` / `<admin-password>`).
2.  Navigate to **Users** > **Add user**.
3.  **Bob:**
    *   Username: `bob`
    *   Email: `bob@halo.labs`
    *   *Credentials:* Set temporary password (e.g., `password123`).
    *   *Role Mappings:* Assign `global:admin`.
4.  **Alice:**
    *   Username: `alice`
    *   Email: `alice@halo.labs`
    *   *Credentials:* Set temporary password.
    *   *Role Mappings:* Assign `automobiles:admin`, `physics:view`.
5.  **Frank:**
    *   Username: `frank`
    *   Email: `frank@halo.labs`
    *   *Credentials:* Set temporary password.
    *   *Role Mappings:* Assign `agriculture:view`, `chemistry:view`, `mathematics:view`.

---

## 3. Enforcement Logic

To test this, the application must be aware of these roles.

### Frontend (Angular)
*   **Decoded Token:** The app decodes the JWT and looks at `realm_access.roles`.
*   **Logic:**
    *   *Bob* sees "Edit" buttons on every screen.
    *   *Alice* sees "Edit" buttons only in Automobiles. In Physics, she sees data but "Edit" is disabled/hidden. In Agriculture, she might be blocked entirely (Route Guard) or see a blank state.
    *   *Frank* is blocked from Automobiles and Physics.

### Backend (Node.js/Data Broker)
*   **Middleware:** Intercepts requests.
*   **Logic:**
    *   `POST /api/automobiles/preferences` -> Checks for `automobiles:admin` OR `global:admin`.
    *   `GET /api/physics/data` -> Checks for `physics:view` OR `physics:admin` OR `global:admin`.

---

## 4. Test Plan

### Test Matrix

| User | Domain | Action | Expected Result | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **Bob** | **Automobiles** | **Edit/Save** | ✅ **Allow** | Has `global:admin` |
| **Bob** | **Physics** | **Edit/Save** | ✅ **Allow** | Has `global:admin` |
| **Bob** | **Math** | **Edit/Save** | ✅ **Allow** | Has `global:admin` |
| --- | --- | --- | --- | --- |
| **Alice** | **Automobiles** | **Edit/Save** | ✅ **Allow** | Has `automobiles:admin` |
| **Alice** | **Physics** | View Data | ✅ **Allow** | Has `physics:view` |
| **Alice** | **Physics** | **Edit/Save** | ❌ **Deny** | Lacks `physics:admin` |
| **Alice** | **Agriculture** | View Data | ❌ **Deny** | Lacks any `agriculture` role |
| --- | --- | --- | --- | --- |
| **Frank** | **Automobiles** | View Data | ❌ **Deny** | Lacks any `automobiles` role |
| **Frank** | **Agriculture** | View Data | ✅ **Allow** | Has `agriculture:view` |
| **Frank** | **Agriculture** | **Edit/Save** | ❌ **Deny** | Lacks `agriculture:admin` |

### Testing Methods

#### A. Manual Browser Testing (Easiest Verification)
1.  **Open Incognito Window.**
2.  **Go to `https://generic-prime.minilab`.**
3.  **Redirects to Login.** Enter `alice` / `password`.
4.  **Navigate to Automobiles:** Verify "Save Layout" button is enabled.
5.  **Navigate to Physics:** Verify data loads, but "Save Layout" is disabled.
6.  **Navigate to Agriculture:** Verify Access Denied page or Route Guard redirect.

#### B. API Testing (Postman/Curl) - "The Truth Test"
Even if the UI hides a button, we must verify the Backend rejects the request.

1.  **Get Token for Frank:**
    ```bash
    curl -d "client_id=generic-prime-frontend" -d "username=frank" -d "password=..." -d "grant_type=password" https://auth.minilab/realms/halo-labs/protocol/openid-connect/token
    ```
2.  **Attempt Prohibited Action (Frank tries to save Auto preferences):**
    ```bash
    curl -X POST https://api.generic-prime.minilab/api/automobiles/preferences \
      -H "Authorization: Bearer <franks_token>" \
      -d '{"layout": "hacked"}'
    ```
3.  **Verify:** Response must be `403 Forbidden`.

#### C. Automated E2E Testing (Playwright)
1.  Update `app.spec.ts` to include authentication flows.
2.  Test: `test('Alice cannot edit Physics', async ({ page }) => { ... })`.
