# NAVIGATION & UI AUTHORIZATION SPECIFICATION
## Auto Discovery Platform
### Role-Based Navigation and Menu System

**Status**: Specification - Ready for Implementation
**Date**: 2025-11-16
**Purpose**: Define navigation architecture with role-based menu visibility and UI authorization

---

## EXECUTIVE SUMMARY

The Auto Discovery platform requires a **role-based navigation system** that provides both route-level security (guards) and UI-level authorization (menu visibility). This specification defines a declarative menu configuration system where navigation items are automatically filtered based on user roles and domains.

**Key Requirements**:
- Top navigation bar with role-based dropdown menus
- Declarative menu configuration (TypeScript config, not hardcoded)
- Automatic menu filtering based on current user permissions
- Authorization directives for conditional UI rendering
- Dual-layer protection: Route guards + UI visibility guards
- Server-side enforcement (never trust client)

**Design Principles**:
- Declarative over imperative (configuration vs code)
- DRY (Don't Repeat Yourself) - define permissions once
- Fail-secure (default deny, explicit allow)
- Seamless UX (hide unauthorized items, don't show errors)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Authorization Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: UI Visibility (Frontend UX)                       │
│  • Menu items filtered by role/domain                        │
│  • Buttons/links hidden if unauthorized                      │
│  • Directives: *hasRole, *hasDomain, *hasPermission         │
│  Purpose: Good UX (don't show what user can't access)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Route Guards (Frontend Security)                  │
│  • AuthGuard checks authentication                           │
│  • RoleGuard checks required roles                           │
│  • DomainGuard checks required domains                       │
│  Purpose: Prevent navigation to unauthorized routes          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Backend Authorization (Server Security)           │
│  • verifyToken middleware                                    │
│  • requireRole middleware                                    │
│  • requireDomain middleware                                  │
│  Purpose: Enforce authorization server-side (NEVER TRUST)   │
└─────────────────────────────────────────────────────────────┘
```

**Defense in Depth**: All three layers work together. Even if a user bypasses UI + route guards (e.g., manual URL entry, browser console manipulation), the backend still enforces authorization.

### 1.2 Navigation Structure

```
┌────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
│  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌───────┐         │
│  │ Home │  │ Discover │  │ Analytics│  │ Admin │  [User] │
│  └──────┘  └────┬─────┘  └────┬─────┘  └───┬───┘         │
│                  │              │            │              │
│                  ▼              ▼            ▼              │
│           ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│           │ Vehicles │  │ Charts   │  │ Users    │        │
│           │ Filters  │  │ Reports  │  │ Roles    │        │
│           │ Saved    │  │ Export   │  │ Settings │        │
│           └──────────┘  └──────────┘  └──────────┘        │
└────────────────────────────────────────────────────────────┘

Role-Based Visibility:
• "Discover" → Requires: viewer role, vehicle-discovery domain
• "Analytics" → Requires: analyst role, analytics domain
• "Admin" → Requires: admin role, admin domain
• Sub-items inherit parent requirements (can add additional)
```

---

## 2. MENU CONFIGURATION SYSTEM

### 2.1 MenuItem Interface

```typescript
/**
 * Declarative menu item configuration
 */
interface MenuItem {
  // Identification
  id: string;                          // Unique identifier
  label: string;                       // Display text
  icon?: string;                       // PrimeNG icon class (e.g., 'pi pi-home')

  // Navigation
  route?: string;                      // Angular route path
  routerLink?: string[];               // Router link array
  externalUrl?: string;                // External link (opens in new tab)
  command?: () => void;                // Custom click handler

  // Authorization
  requiredRole?: string;               // Minimum role required
  requiredRoles?: string[];            // Any of these roles (OR logic)
  requiredDomain?: string;             // Domain access required
  requiredDomains?: string[];          // Any of these domains (OR logic)
  requireAllRoles?: boolean;           // If true, user must have ALL roles (AND logic)
  requireAllDomains?: boolean;         // If true, user must have ALL domains (AND logic)

  // Hierarchy
  children?: MenuItem[];               // Nested menu items (dropdowns)
  parent?: string;                     // Parent menu ID

  // Display
  visible?: boolean;                   // Hardcoded visibility (default: true)
  disabled?: boolean;                  // Disabled state
  separator?: boolean;                 // Separator line (no label/route)
  badge?: string;                      // Badge text (e.g., "New", "3")
  badgeClass?: string;                 // Badge CSS class

  // Metadata
  order?: number;                      // Display order (for sorting)
  tooltip?: string;                    // Tooltip text
}
```

### 2.2 Menu Configuration Example

```typescript
// menu-config.ts (NEW FILE)
import { MenuItem } from './menu.model';

export const MAIN_MENU: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'pi pi-home',
    routerLink: ['/'],
    order: 1
    // No authorization required - public
  },

  {
    id: 'discover',
    label: 'Discover',
    icon: 'pi pi-search',
    route: '/discover',
    requiredRole: 'viewer',
    requiredDomain: 'vehicle-discovery',
    order: 2,
    children: [
      {
        id: 'discover-vehicles',
        label: 'Browse Vehicles',
        icon: 'pi pi-car',
        routerLink: ['/discover'],
        requiredRole: 'viewer',
        requiredDomain: 'vehicle-discovery'
      },
      {
        id: 'discover-filters',
        label: 'Advanced Filters',
        icon: 'pi pi-filter',
        routerLink: ['/discover', 'filters'],
        requiredRole: 'analyst',  // More restrictive than parent
        requiredDomain: 'vehicle-discovery'
      },
      {
        id: 'discover-saved',
        label: 'Saved Searches',
        icon: 'pi pi-bookmark',
        routerLink: ['/discover', 'saved'],
        requiredRole: 'viewer',
        requiredDomain: 'vehicle-discovery',
        badge: '3',
        badgeClass: 'p-badge-info'
      },
      {
        id: 'discover-separator',
        separator: true
      },
      {
        id: 'discover-export',
        label: 'Export Results',
        icon: 'pi pi-download',
        command: () => this.exportService.exportResults(),
        requiredRole: 'analyst',
        requiredDomain: 'vehicle-discovery'
      }
    ]
  },

  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'pi pi-chart-bar',
    route: '/analytics',
    requiredRole: 'analyst',
    requiredDomain: 'analytics',
    order: 3,
    children: [
      {
        id: 'analytics-charts',
        label: 'Interactive Charts',
        icon: 'pi pi-chart-line',
        routerLink: ['/analytics', 'charts'],
        requiredRole: 'analyst',
        requiredDomain: 'analytics'
      },
      {
        id: 'analytics-reports',
        label: 'Reports',
        icon: 'pi pi-file',
        routerLink: ['/analytics', 'reports'],
        requiredRole: 'analyst',
        requiredDomain: 'analytics'
      },
      {
        id: 'analytics-export',
        label: 'Export Data',
        icon: 'pi pi-download',
        routerLink: ['/analytics', 'export'],
        requiredRole: 'analyst',
        requiredDomain: 'analytics'
      }
    ]
  },

  {
    id: 'admin',
    label: 'Admin',
    icon: 'pi pi-cog',
    route: '/admin',
    requiredRole: 'admin',
    requiredDomain: 'admin',
    order: 4,
    children: [
      {
        id: 'admin-users',
        label: 'User Management',
        icon: 'pi pi-users',
        routerLink: ['/admin', 'users'],
        requiredRole: 'admin',
        requiredDomain: 'admin'
      },
      {
        id: 'admin-roles',
        label: 'Roles & Permissions',
        icon: 'pi pi-key',
        routerLink: ['/admin', 'roles'],
        requiredRole: 'admin',
        requiredDomain: 'admin'
      },
      {
        id: 'admin-settings',
        label: 'System Settings',
        icon: 'pi pi-wrench',
        routerLink: ['/admin', 'settings'],
        requiredRole: 'admin',
        requiredDomain: 'admin'
      }
    ]
  }
];

export const USER_MENU: MenuItem[] = [
  {
    id: 'user-profile',
    label: 'My Profile',
    icon: 'pi pi-user',
    routerLink: ['/profile']
    // All authenticated users can access
  },
  {
    id: 'user-preferences',
    label: 'Preferences',
    icon: 'pi pi-sliders-h',
    routerLink: ['/preferences']
  },
  {
    id: 'user-separator',
    separator: true
  },
  {
    id: 'user-logout',
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => this.authService.logout()
  }
];
```

---

## 3. MENU SERVICE

### 3.1 MenuService Implementation

```typescript
// menu.service.ts (NEW FILE)
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentUserService } from '../auth/current-user.service';
import { MenuItem } from './menu.model';
import { MAIN_MENU, USER_MENU } from './menu-config';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private mainMenuSubject = new BehaviorSubject<MenuItem[]>([]);
  private userMenuSubject = new BehaviorSubject<MenuItem[]>([]);

  public mainMenu$ = this.mainMenuSubject.asObservable();
  public userMenu$ = this.userMenuSubject.asObservable();

  constructor(private currentUser: CurrentUserService) {
    // Update menu when user changes (login/logout)
    this.currentUser.user$.subscribe(() => {
      this.updateMenus();
    });

    // Initial menu load
    this.updateMenus();
  }

  /**
   * Filter and update menus based on current user permissions
   */
  private updateMenus(): void {
    const filteredMainMenu = this.filterMenuByPermissions(MAIN_MENU);
    const filteredUserMenu = this.filterMenuByPermissions(USER_MENU);

    this.mainMenuSubject.next(filteredMainMenu);
    this.userMenuSubject.next(filteredUserMenu);
  }

  /**
   * Recursively filter menu items based on user permissions
   */
  private filterMenuByPermissions(items: MenuItem[]): MenuItem[] {
    return items
      .filter(item => this.isMenuItemAuthorized(item))
      .map(item => ({
        ...item,
        children: item.children
          ? this.filterMenuByPermissions(item.children)
          : undefined
      }))
      .filter(item => {
        // Remove parent items that have no visible children
        if (item.children && item.children.length === 0 && !item.route && !item.routerLink) {
          return false;
        }
        return true;
      });
  }

  /**
   * Check if menu item is authorized for current user
   */
  private isMenuItemAuthorized(item: MenuItem): boolean {
    // Separators are always visible (if parent is visible)
    if (item.separator) {
      return true;
    }

    // Hardcoded visibility
    if (item.visible === false) {
      return false;
    }

    // No authorization required
    if (!item.requiredRole && !item.requiredRoles && !item.requiredDomain && !item.requiredDomains) {
      return true;
    }

    // Check role requirements
    if (item.requiredRole) {
      if (!this.currentUser.hasRole(item.requiredRole)) {
        return false;
      }
    }

    if (item.requiredRoles) {
      const hasAnyRole = item.requireAllRoles
        ? item.requiredRoles.every(role => this.currentUser.hasRole(role))
        : item.requiredRoles.some(role => this.currentUser.hasRole(role));

      if (!hasAnyRole) {
        return false;
      }
    }

    // Check domain requirements
    if (item.requiredDomain) {
      if (!this.currentUser.hasDomain(item.requiredDomain)) {
        return false;
      }
    }

    if (item.requiredDomains) {
      const hasAnyDomain = item.requireAllDomains
        ? item.requiredDomains.every(domain => this.currentUser.hasDomain(domain))
        : item.requiredDomains.some(domain => this.currentUser.hasDomain(domain));

      if (!hasAnyDomain) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get specific menu by ID
   */
  getMenuItem(menuId: string): MenuItem | undefined {
    const findInMenu = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.id === menuId) {
          return item;
        }
        if (item.children) {
          const found = findInMenu(item.children);
          if (found) {
            return found;
          }
        }
      }
      return undefined;
    };

    return findInMenu([...MAIN_MENU, ...USER_MENU]);
  }

  /**
   * Check if specific menu item is authorized
   */
  isAuthorized(menuId: string): boolean {
    const item = this.getMenuItem(menuId);
    return item ? this.isMenuItemAuthorized(item) : false;
  }

  /**
   * Get breadcrumb trail for current route
   */
  getBreadcrumbs(route: string): MenuItem[] {
    const breadcrumbs: MenuItem[] = [];
    const findPath = (items: MenuItem[], targetRoute: string, path: MenuItem[] = []): boolean => {
      for (const item of items) {
        const currentPath = [...path, item];

        if (item.route === targetRoute || item.routerLink?.join('/') === targetRoute) {
          breadcrumbs.push(...currentPath);
          return true;
        }

        if (item.children) {
          if (findPath(item.children, targetRoute, currentPath)) {
            return true;
          }
        }
      }
      return false;
    };

    findPath(MAIN_MENU, route);
    return breadcrumbs;
  }
}
```

---

## 4. AUTHORIZATION DIRECTIVES

### 4.1 HasRoleDirective

```typescript
// has-role.directive.ts (NEW FILE)
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CurrentUserService } from '../services/current-user.service';

/**
 * Structural directive to conditionally render elements based on user role
 *
 * @example
 * <div *hasRole="'admin'">Admin only content</div>
 * <div *hasRole="['analyst', 'admin']">Analyst or Admin content</div>
 */
@Directive({
  selector: '[hasRole]'
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private requiredRoles: string[] = [];
  private hasView = false;

  @Input()
  set hasRole(roles: string | string[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    // Watch for user changes (login/logout)
    this.currentUser.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });

    // Initial check
    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasRequiredRole = this.requiredRoles.some(role =>
      this.currentUser.hasRole(role)
    );

    if (hasRequiredRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRequiredRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
```

### 4.2 HasDomainDirective

```typescript
// has-domain.directive.ts (NEW FILE)
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CurrentUserService } from '../services/current-user.service';

/**
 * Structural directive to conditionally render elements based on user domain
 *
 * @example
 * <div *hasDomain="'vehicle-discovery'">Vehicle discovery content</div>
 * <div *hasDomain="['analytics', 'admin']">Analytics or Admin content</div>
 */
@Directive({
  selector: '[hasDomain]'
})
export class HasDomainDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private requiredDomains: string[] = [];
  private hasView = false;

  @Input()
  set hasDomain(domains: string | string[]) {
    this.requiredDomains = Array.isArray(domains) ? domains : [domains];
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.currentUser.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });

    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasRequiredDomain = this.requiredDomains.some(domain =>
      this.currentUser.hasDomain(domain)
    );

    if (hasRequiredDomain && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRequiredDomain && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
```

### 4.3 HasPermissionDirective (Combined)

```typescript
// has-permission.directive.ts (NEW FILE)
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CurrentUserService } from '../services/current-user.service';

export interface PermissionConfig {
  role?: string | string[];
  domain?: string | string[];
  requireAll?: boolean;  // AND vs OR logic
}

/**
 * Structural directive to conditionally render elements based on combined permissions
 *
 * @example
 * <div *hasPermission="{ role: 'admin', domain: 'admin' }">Admin only</div>
 * <div *hasPermission="{ role: ['analyst', 'admin'], domain: 'analytics' }">Analytics access</div>
 */
@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private config: PermissionConfig = {};
  private hasView = false;

  @Input()
  set hasPermission(config: PermissionConfig) {
    this.config = config;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private currentUser: CurrentUserService
  ) {}

  ngOnInit(): void {
    this.currentUser.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateView();
      });

    this.updateView();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView(): void {
    const hasPermission = this.checkPermission();

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkPermission(): boolean {
    const { role, domain, requireAll } = this.config;

    let hasRole = true;
    let hasDomain = true;

    // Check role
    if (role) {
      const roles = Array.isArray(role) ? role : [role];
      hasRole = requireAll
        ? roles.every(r => this.currentUser.hasRole(r))
        : roles.some(r => this.currentUser.hasRole(r));
    }

    // Check domain
    if (domain) {
      const domains = Array.isArray(domain) ? domain : [domain];
      hasDomain = requireAll
        ? domains.every(d => this.currentUser.hasDomain(d))
        : domains.some(d => this.currentUser.hasDomain(d));
    }

    return hasRole && hasDomain;
  }
}
```

---

## 5. NAVIGATION COMPONENT

### 5.1 Top Navigation Bar Component

```typescript
// top-nav.component.ts (NEW FILE)
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { MenuService } from '../../core/services/menu.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { MenuItem } from '../../core/models/menu.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopNavComponent implements OnInit {
  mainMenu$: Observable<MenuItem[]>;
  userMenu$: Observable<MenuItem[]>;
  currentUser$: Observable<User | null>;

  constructor(
    private menuService: MenuService,
    private currentUser: CurrentUserService
  ) {
    this.mainMenu$ = this.menuService.mainMenu$;
    this.userMenu$ = this.menuService.userMenu$;
    this.currentUser$ = this.currentUser.user$;
  }

  ngOnInit(): void {}

  onMenuItemClick(item: MenuItem): void {
    if (item.command) {
      item.command();
    }
  }
}
```

### 5.2 Top Navigation Template (PrimeNG MenuBar)

```html
<!-- top-nav.component.html -->
<div class="top-nav-container">
  <!-- Left side: Main menu -->
  <p-menubar [model]="mainMenu$ | async" styleClass="main-menu">
    <!-- Logo slot -->
    <ng-template pTemplate="start">
      <img
        src="assets/logo.png"
        alt="Auto Discovery"
        height="40"
        class="mr-2"
      />
    </ng-template>

    <!-- User menu slot -->
    <ng-template pTemplate="end">
      <div class="user-menu-container" *ngIf="currentUser$ | async as user">
        <!-- User avatar and name -->
        <p-avatar
          [label]="user.username.charAt(0).toUpperCase()"
          shape="circle"
          styleClass="mr-2"
        ></p-avatar>
        <span class="username">{{ user.username }}</span>

        <!-- User dropdown menu -->
        <p-menu
          #userMenu
          [model]="userMenu$ | async"
          [popup]="true"
        ></p-menu>
        <button
          pButton
          type="button"
          icon="pi pi-angle-down"
          class="p-button-text p-button-sm"
          (click)="userMenu.toggle($event)"
        ></button>
      </div>

      <!-- Login button (if not authenticated) -->
      <button
        *ngIf="!(currentUser$ | async)"
        pButton
        label="Login"
        icon="pi pi-sign-in"
        routerLink="/login"
      ></button>
    </ng-template>
  </p-menubar>
</div>
```

### 5.3 Navigation Styles

```scss
// top-nav.component.scss
.top-nav-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-menu {
  ::ng-deep {
    .p-menubar {
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
    }

    // Dropdown menu styling
    .p-menuitem-link {
      padding: 0.75rem 1rem;

      &:hover {
        background-color: var(--primary-color);
        color: var(--primary-color-text);
      }
    }

    // Icon spacing
    .p-menuitem-icon {
      margin-right: 0.5rem;
    }

    // Badge styling
    .p-badge {
      margin-left: 0.5rem;
    }

    // Separator styling
    .p-menuitem-separator {
      margin: 0.5rem 0;
      border-top: 1px solid var(--surface-border);
    }
  }
}

.user-menu-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .username {
    font-weight: 500;
  }
}
```

---

## 6. ROUTE CONFIGURATION

### 6.1 Route Configuration with Guards

```typescript
// app-routing.module.ts (UPDATE EXISTING FILE)
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)
  },

  // Viewer+ routes (vehicle-discovery domain)
  {
    path: 'discover',
    loadChildren: () => import('./features/discover/discover.module').then(m => m.DiscoverModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'viewer',
      requiredDomain: 'vehicle-discovery',
      breadcrumb: 'Discover'
    }
  },
  {
    path: 'discover/filters',
    loadChildren: () => import('./features/filters/filters.module').then(m => m.FiltersModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'analyst',  // More restrictive
      requiredDomain: 'vehicle-discovery',
      breadcrumb: 'Advanced Filters'
    }
  },
  {
    path: 'discover/saved',
    loadChildren: () => import('./features/saved/saved.module').then(m => m.SavedModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'viewer',
      requiredDomain: 'vehicle-discovery',
      breadcrumb: 'Saved Searches'
    }
  },

  // Analyst+ routes (analytics domain)
  {
    path: 'analytics',
    loadChildren: () => import('./features/analytics/analytics.module').then(m => m.AnalyticsModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'analyst',
      requiredDomain: 'analytics',
      breadcrumb: 'Analytics'
    },
    children: [
      {
        path: 'charts',
        component: ChartsComponent,
        data: { breadcrumb: 'Charts' }
      },
      {
        path: 'reports',
        component: ReportsComponent,
        data: { breadcrumb: 'Reports' }
      },
      {
        path: 'export',
        component: ExportComponent,
        data: { breadcrumb: 'Export' }
      }
    ]
  },

  // Admin only routes (admin domain)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: {
      requiredRole: 'admin',
      requiredDomain: 'admin',
      breadcrumb: 'Admin'
    },
    children: [
      {
        path: 'users',
        component: UserManagementComponent,
        data: { breadcrumb: 'Users' }
      },
      {
        path: 'roles',
        component: RoleManagementComponent,
        data: { breadcrumb: 'Roles' }
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { breadcrumb: 'Settings' }
      }
    ]
  },

  // User profile (all authenticated users)
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard],
    data: { breadcrumb: 'My Profile' }
  },
  {
    path: 'preferences',
    loadChildren: () => import('./features/preferences/preferences.module').then(m => m.PreferencesModule),
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Preferences' }
  },

  // Error pages
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '404',
    component: NotFoundComponent
  },

  // Default route
  {
    path: '',
    redirectTo: '/discover',
    pathMatch: 'full'
  },

  // Wildcard
  {
    path: '**',
    redirectTo: '/404'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

---

## 7. USAGE EXAMPLES

### 7.1 Template Examples

```html
<!-- Example 1: Show button only to admins -->
<button
  *hasRole="'admin'"
  pButton
  label="Delete User"
  icon="pi pi-trash"
  (click)="deleteUser()"
></button>

<!-- Example 2: Show content to analysts OR admins -->
<div *hasRole="['analyst', 'admin']">
  <app-advanced-analytics></app-advanced-analytics>
</div>

<!-- Example 3: Show content to users with analytics domain -->
<div *hasDomain="'analytics'">
  <app-export-data-button></app-export-data-button>
</div>

<!-- Example 4: Combined permissions (role AND domain) -->
<div *hasPermission="{ role: 'analyst', domain: 'analytics' }">
  <app-custom-reports></app-custom-reports>
</div>

<!-- Example 5: Multiple roles required (ALL must match) -->
<div *hasPermission="{ role: ['admin', 'superuser'], requireAll: true }">
  <app-dangerous-operation></app-dangerous-operation>
</div>

<!-- Example 6: Disable button if unauthorized -->
<button
  pButton
  label="Export"
  [disabled]="!(currentUser.hasRole('analyst'))"
  (click)="export()"
></button>

<!-- Example 7: Conditional rendering in table columns -->
<p-table [value]="users">
  <ng-template pTemplate="body" let-user>
    <tr>
      <td>{{ user.username }}</td>
      <td>{{ user.email }}</td>
      <td *hasRole="'admin'">
        <button pButton icon="pi pi-pencil" (click)="editUser(user)"></button>
        <button pButton icon="pi pi-trash" (click)="deleteUser(user)"></button>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### 7.2 Component Examples

```typescript
// Example: Programmatic permission check
export class MyComponent {
  constructor(private currentUser: CurrentUserService) {}

  canDeleteUser(): boolean {
    return this.currentUser.hasRole('admin');
  }

  canExportData(): boolean {
    return this.currentUser.hasRole('analyst') &&
           this.currentUser.hasDomain('analytics');
  }

  onDeleteClick(): void {
    if (!this.canDeleteUser()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Unauthorized',
        detail: 'You do not have permission to delete users'
      });
      return;
    }

    // Proceed with deletion
    this.deleteUser();
  }
}
```

---

## 8. BREADCRUMB NAVIGATION

### 8.1 Breadcrumb Component

```typescript
// breadcrumb.component.ts (NEW FILE)
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MenuItem } from 'primeng/api';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumb',
  template: `
    <p-breadcrumb
      [model]="breadcrumbs$ | async"
      [home]="home"
      styleClass="breadcrumb-nav"
    ></p-breadcrumb>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1rem;
      background-color: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs$: Observable<MenuItem[]>;
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.breadcrumbs$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.buildBreadcrumbs(this.activatedRoute.root))
    );
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: MenuItem[] = []
  ): MenuItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({
          label,
          routerLink: url
        });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
```

---

## 9. SECURITY BEST PRACTICES

### 9.1 Defense in Depth

**Never rely on frontend authorization alone**:

```typescript
// ❌ BAD: Only frontend check
// User can bypass by manipulating browser console
if (this.currentUser.hasRole('admin')) {
  this.deleteUser(userId);  // Direct API call
}

// ✅ GOOD: Frontend + Backend enforcement
// Frontend: Good UX (hide button)
<button *hasRole="'admin'" (click)="deleteUser()">Delete</button>

// Backend: Real security (verify on every request)
router.delete('/users/:id', verifyToken, requireRole('admin'), (req, res) => {
  // Delete user
});
```

### 9.2 Fail-Secure Defaults

```typescript
// ✅ GOOD: Default deny
private isMenuItemAuthorized(item: MenuItem): boolean {
  // No authorization specified = public access
  if (!item.requiredRole && !item.requiredDomain) {
    return true;
  }

  // Authorization specified but user doesn't have it = deny
  if (item.requiredRole && !this.currentUser.hasRole(item.requiredRole)) {
    return false;  // Default deny
  }

  // ... additional checks
}

// ❌ BAD: Default allow
private isMenuItemAuthorized(item: MenuItem): boolean {
  if (!this.currentUser.isAuthenticated()) {
    return true;  // ⚠️ Dangerous: Allows unauthenticated access
  }
  // ...
}
```

### 9.3 Server-Side Validation

**Backend MUST validate every request**:

```javascript
// Backend: ALWAYS verify permissions
router.get('/api/v1/admin/users',
  verifyToken,           // Layer 1: Authenticated?
  requireRole('admin'),  // Layer 2: Correct role?
  requireDomain('admin'),// Layer 3: Correct domain?
  async (req, res) => {
    // Now safe to process request
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  }
);
```

---

## 10. TESTING STRATEGY

### 10.1 Menu Service Tests

```typescript
// menu.service.spec.ts
describe('MenuService', () => {
  let service: MenuService;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CurrentUserService', ['hasRole', 'hasDomain']);

    TestBed.configureTestingModule({
      providers: [
        MenuService,
        { provide: CurrentUserService, useValue: spy }
      ]
    });

    service = TestBed.inject(MenuService);
    currentUserService = TestBed.inject(CurrentUserService) as jasmine.SpyObj<CurrentUserService>;
  });

  it('should filter menu items based on role', () => {
    currentUserService.hasRole.and.returnValue(true);
    currentUserService.hasDomain.and.returnValue(true);

    service.mainMenu$.subscribe(menu => {
      expect(menu.length).toBeGreaterThan(0);
      expect(menu.some(item => item.id === 'admin')).toBe(true);
    });
  });

  it('should hide admin menu for non-admin users', () => {
    currentUserService.hasRole.and.callFake((role: string) => role !== 'admin');
    currentUserService.hasDomain.and.returnValue(true);

    service.mainMenu$.subscribe(menu => {
      expect(menu.some(item => item.id === 'admin')).toBe(false);
    });
  });

  it('should recursively filter child menu items', () => {
    currentUserService.hasRole.and.callFake((role: string) => role === 'viewer');
    currentUserService.hasDomain.and.returnValue(true);

    service.mainMenu$.subscribe(menu => {
      const discover = menu.find(item => item.id === 'discover');
      expect(discover).toBeDefined();

      // Should have 'Browse Vehicles' (viewer) but not 'Advanced Filters' (analyst)
      expect(discover?.children?.some(c => c.id === 'discover-vehicles')).toBe(true);
      expect(discover?.children?.some(c => c.id === 'discover-filters')).toBe(false);
    });
  });
});
```

### 10.2 Directive Tests

```typescript
// has-role.directive.spec.ts
describe('HasRoleDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;

  @Component({
    template: `<div *hasRole="'admin'" id="admin-content">Admin Content</div>`
  })
  class TestComponent {}

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CurrentUserService', ['hasRole']);

    TestBed.configureTestingModule({
      declarations: [TestComponent, HasRoleDirective],
      providers: [{ provide: CurrentUserService, useValue: spy }]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    currentUserService = TestBed.inject(CurrentUserService) as jasmine.SpyObj<CurrentUserService>;
  });

  it('should render content when user has required role', () => {
    currentUserService.hasRole.and.returnValue(true);
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('#admin-content');
    expect(element).toBeTruthy();
    expect(element.textContent).toContain('Admin Content');
  });

  it('should hide content when user lacks required role', () => {
    currentUserService.hasRole.and.returnValue(false);
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('#admin-content');
    expect(element).toBeNull();
  });
});
```

### 10.3 E2E Tests

```typescript
// navigation.e2e.spec.ts
test('admin menu should only appear for admin users', async ({ page }) => {
  // Login as viewer
  await page.goto('/login');
  await page.fill('[name="username"]', 'viewer_user');
  await page.fill('[name="password"]', 'ViewerPass123!');
  await page.click('button[type="submit"]');

  // Verify admin menu is NOT visible
  await expect(page.locator('[data-menu-id="admin"]')).not.toBeVisible();

  // Logout
  await page.click('[data-action="logout"]');

  // Login as admin
  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'Admin123!');
  await page.click('button[type="submit"]');

  // Verify admin menu IS visible
  await expect(page.locator('[data-menu-id="admin"]')).toBeVisible();
});

test('should prevent access to admin routes via URL', async ({ page }) => {
  // Login as viewer
  await page.goto('/login');
  await page.fill('[name="username"]', 'viewer_user');
  await page.fill('[name="password"]', 'ViewerPass123!');
  await page.click('button[type="submit"]');

  // Try to navigate to admin route directly
  await page.goto('/admin/users');

  // Should redirect to unauthorized page
  await expect(page).toHaveURL('/unauthorized');
  await expect(page.locator('h1')).toContainText('Unauthorized');
});
```

---

## 11. MIGRATION & DEPLOYMENT

### 11.1 Phased Rollout

**Phase 1: Add Menu Service (No Breaking Changes)**
- Create MenuService and menu configuration
- Add to providers, but don't use in templates yet
- Test in isolation

**Phase 2: Add Authorization Directives**
- Create and test directives
- Start using in new components only

**Phase 3: Update Existing Components**
- Replace hardcoded authorization checks with directives
- Update templates to use menu service

**Phase 4: Enforce Route Guards**
- Ensure all protected routes have guards
- Test with different user roles

### 11.2 Backward Compatibility

If you have existing hardcoded navigation:

```typescript
// Old approach (hardcoded)
export class OldNavComponent {
  showAdminMenu(): boolean {
    return this.currentUser.hasRole('admin');
  }
}

// New approach (declarative)
export class NewNavComponent {
  mainMenu$ = this.menuService.mainMenu$;

  constructor(private menuService: MenuService) {}
}
```

Both can coexist during migration.

---

## 12. FUTURE ENHANCEMENTS

**Not included in initial implementation**:

1. **Permission Caching**: Cache permission checks for performance
2. **Dynamic Menu Loading**: Load menus from backend (database-driven)
3. **Contextual Menus**: Right-click context menus
4. **Keyboard Shortcuts**: Hotkeys for common actions
5. **Menu Customization**: User-configurable menu layouts
6. **Mega Menus**: Large dropdown menus with rich content
7. **Mobile Navigation**: Hamburger menu for mobile devices
8. **Menu Analytics**: Track which menu items are used most
9. **Feature Flags**: Enable/disable menu items via feature flags
10. **Internationalization**: Multi-language menu labels

---

## APPENDIX A: COMPLETE MODULE

```typescript
// navigation.module.ts (NEW FILE)
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbModule } from 'primeng/breadcrumb';

import { TopNavComponent } from './components/top-nav/top-nav.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { MenuService } from './services/menu.service';
import { HasRoleDirective } from './directives/has-role.directive';
import { HasDomainDirective } from './directives/has-domain.directive';
import { HasPermissionDirective } from './directives/has-permission.directive';

@NgModule({
  declarations: [
    TopNavComponent,
    BreadcrumbComponent,
    HasRoleDirective,
    HasDomainDirective,
    HasPermissionDirective
  ],
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    MenuModule,
    AvatarModule,
    ButtonModule,
    BreadcrumbModule
  ],
  providers: [
    MenuService
  ],
  exports: [
    TopNavComponent,
    BreadcrumbComponent,
    HasRoleDirective,
    HasDomainDirective,
    HasPermissionDirective
  ]
})
export class NavigationModule { }
```

---

## APPENDIX B: ROLE-MENU MATRIX

| Menu Item | Guest | Viewer | Analyst | Admin |
|-----------|-------|--------|---------|-------|
| **Home** | ✅ | ✅ | ✅ | ✅ |
| **Discover** | ❌ | ✅ | ✅ | ✅ |
| ↳ Browse Vehicles | ❌ | ✅ | ✅ | ✅ |
| ↳ Advanced Filters | ❌ | ❌ | ✅ | ✅ |
| ↳ Saved Searches | ❌ | ✅ | ✅ | ✅ |
| ↳ Export Results | ❌ | ❌ | ✅ | ✅ |
| **Analytics** | ❌ | ❌ | ✅ | ✅ |
| ↳ Charts | ❌ | ❌ | ✅ | ✅ |
| ↳ Reports | ❌ | ❌ | ✅ | ✅ |
| ↳ Export Data | ❌ | ❌ | ✅ | ✅ |
| **Admin** | ❌ | ❌ | ❌ | ✅ |
| ↳ User Management | ❌ | ❌ | ❌ | ✅ |
| ↳ Roles & Permissions | ❌ | ❌ | ❌ | ✅ |
| ↳ System Settings | ❌ | ❌ | ❌ | ✅ |
| **My Profile** | ❌ | ✅ | ✅ | ✅ |
| **Preferences** | ❌ | ✅ | ✅ | ✅ |
| **Logout** | ❌ | ✅ | ✅ | ✅ |

---

**END OF SPECIFICATION**

This specification provides a complete, production-ready design for a role-based navigation and authorization system that should be implemented from the beginning, not bolted on later.
