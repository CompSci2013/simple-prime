# USER PREFERENCES SERVICE SPECIFICATION
## Auto Discovery Platform
### File-Based User Preference Management

**Status**: Specification - Ready for Implementation
**Date**: 2025-11-16
**Purpose**: Define file-based user preference storage integrated with authentication

---

## EXECUTIVE SUMMARY

The Auto Discovery platform requires **user-specific preference storage** that persists across sessions and devices. User preferences (panel layout, column visibility, filter defaults, etc.) MUST be stored in **JSON files** on the backend filesystem, keyed by authenticated user ID, NOT in browser localStorage.

**Key Requirements**:
- File-based storage at `~/projects/auto-discovery-user-prefs/<user-id>.json`
- Backend API for loading/saving preferences
- Frontend UserPreferencesService integrated with AuthService
- Automatic loading on login
- Automatic saving on changes
- Zero localStorage usage for user preferences

**Design Principles**:
- User-centric (preferences follow the user, not the browser)
- Server-authoritative (backend owns the data)
- Atomic writes (no partial updates)
- Versioned schema (supports future migrations)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LOGIN                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  AuthService authenticates user                              │
│  Returns: { userId: "user-12345", ... }                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  UserPreferencesService.loadPreferences(userId)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: GET /api/v1/users/:userId/preferences              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Read file:                                                  │
│  ~/projects/auto-discovery-user-prefs/user-12345.json       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Return JSON preferences to frontend                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DiscoverComponent applies preferences:                      │
│  - Panel order                                               │
│  - Column visibility                                         │
│  - Filter defaults                                           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interactions

```
┌──────────────────┐
│  AuthService     │
│  (login/logout)  │
└────────┬─────────┘
         │
         │ 1. User logged in
         ▼
┌──────────────────────┐
│ UserPreferencesService│◄──────┐
│ (manage prefs)       │        │
└────────┬─────────────┘        │
         │                      │
         │ 2. Load prefs        │ 5. Save prefs
         │                      │
         ▼                      │
┌──────────────────┐            │
│   HttpClient     │            │
│ (API calls)      │            │
└────────┬─────────┘            │
         │                      │
         │ 3. GET/PUT           │
         ▼                      │
┌──────────────────┐            │
│  Backend API     │            │
│ (preferences)    │            │
└────────┬─────────┘            │
         │                      │
         │ 4. Read/Write        │
         ▼                      │
┌──────────────────────────┐    │
│  Filesystem              │    │
│  ~/...user-prefs/        │    │
│  user-12345.json         │    │
└──────────────────────────┘    │
                                │
┌──────────────────┐            │
│ DiscoverComponent├────────────┘
│ (consumes prefs) │  User changes panel order
└──────────────────┘
```

---

## 2. DATA MODELS

### 2.1 UserPreferences Interface

```typescript
/**
 * Complete user preferences structure
 * Stored in: ~/projects/auto-discovery-user-prefs/<userId>.json
 */
interface UserPreferences {
  // Metadata
  userId: string;                          // User ID (matches auth user ID)
  version: number;                         // Schema version (for migrations)
  createdAt: string;                       // ISO 8601 timestamp
  updatedAt: string;                       // ISO 8601 timestamp

  // Discover Page Preferences
  discover: DiscoverPreferences;

  // Table Preferences
  tables: Record<string, TablePreferences>;

  // Filter Defaults
  filterDefaults: FilterDefaults;

  // Chart Preferences
  charts: ChartPreferences;
}

/**
 * Discover page layout and panel preferences
 */
interface DiscoverPreferences {
  panelOrder: string[];                    // Panel IDs in display order
  panelCollapsed: Record<string, boolean>; // Panel ID → collapsed state
  gridColumns: number;                     // Number of columns (1, 2, or 3)
}

/**
 * Table-specific preferences (keyed by table ID)
 */
interface TablePreferences {
  columnOrder: string[];                   // Column keys in display order
  columnVisibility: Record<string, boolean>; // Column key → visible
  columnWidths: Record<string, number>;    // Column key → width (px)
  sortField: string | null;                // Current sort column
  sortOrder: 'asc' | 'desc' | null;        // Current sort direction
  pageSize: number;                        // Rows per page
}

/**
 * Default filter values applied on page load
 */
interface FilterDefaults {
  manufacturer?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  bodyClass?: string[];
  dataSource?: string[];
}

/**
 * Chart display preferences
 */
interface ChartPreferences {
  defaultChartType: 'bar' | 'pie' | 'line'; // Default visualization
  colorScheme: string;                      // Color palette name
  showLegend: boolean;                      // Display legend by default
  animationsEnabled: boolean;               // Enable chart animations
}
```

### 2.2 Default Preferences

When no preference file exists, use these defaults:

```typescript
const DEFAULT_PREFERENCES: UserPreferences = {
  userId: '', // Set to actual user ID
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  discover: {
    panelOrder: [
      'query-control',
      'manufacturer-chart',
      'model-chart',
      'year-chart',
      'body-class-chart',
      'data-source-chart',
      'results-table'
    ],
    panelCollapsed: {},
    gridColumns: 2
  },

  tables: {
    'vehicle-results': {
      columnOrder: [
        'manufacturer',
        'model',
        'year',
        'bodyClass',
        'dataSource',
        'instanceCount'
      ],
      columnVisibility: {
        manufacturer: true,
        model: true,
        year: true,
        bodyClass: true,
        dataSource: true,
        instanceCount: true,
        vin: false,
        trim: false
      },
      columnWidths: {},
      sortField: null,
      sortOrder: null,
      pageSize: 20
    }
  },

  filterDefaults: {},

  charts: {
    defaultChartType: 'bar',
    colorScheme: 'default',
    showLegend: true,
    animationsEnabled: true
  }
};
```

---

## 3. BACKEND API

### 3.1 File Storage Location

**Base Directory**: `~/projects/auto-discovery-user-prefs/`

**File Naming Convention**: `<userId>.json`

**Examples**:
- `~/projects/auto-discovery-user-prefs/user-12345.json`
- `~/projects/auto-discovery-user-prefs/user-admin-default.json`

**Permissions**:
- Directory: `755` (rwxr-xr-x)
- Files: `644` (rw-r--r--)
- Owner: Backend service user

### 3.2 API Endpoints

#### 3.2.1 GET /api/v1/users/:userId/preferences

**Description**: Load user preferences from file

**Authorization**: Requires authentication. Users can only access their own preferences (except admins).

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters**:
- `userId` (string): User ID from JWT token

**Response (200 OK)**:
```json
{
  "success": true,
  "preferences": {
    "userId": "user-12345",
    "version": 1,
    "createdAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-11-16T10:30:00.000Z",
    "discover": {
      "panelOrder": ["query-control", "manufacturer-chart", "results-table"],
      "panelCollapsed": { "year-chart": true },
      "gridColumns": 2
    },
    "tables": {
      "vehicle-results": {
        "columnOrder": ["manufacturer", "model", "year"],
        "columnVisibility": { "manufacturer": true, "vin": false },
        "columnWidths": { "manufacturer": 200 },
        "sortField": "manufacturer",
        "sortOrder": "asc",
        "pageSize": 50
      }
    },
    "filterDefaults": {
      "manufacturer": ["Ford"],
      "yearMin": 2020
    },
    "charts": {
      "defaultChartType": "bar",
      "colorScheme": "default",
      "showLegend": true,
      "animationsEnabled": true
    }
  }
}
```

**Response (404 Not Found)** - No preference file exists:
```json
{
  "success": true,
  "preferences": null,
  "message": "No preferences found. Using defaults."
}
```

**Response (403 Forbidden)** - User trying to access another user's preferences:
```json
{
  "success": false,
  "error": "Cannot access preferences for another user",
  "code": "FORBIDDEN"
}
```

**Backend Logic**:
```javascript
// userPreferencesController.js
async function getPreferences(req, res) {
  const { userId } = req.params;
  const requestingUser = req.user; // From JWT token

  // Authorization check: Users can only access their own prefs (except admins)
  if (requestingUser.id !== userId && !requestingUser.roles.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Cannot access preferences for another user',
      code: 'FORBIDDEN'
    });
  }

  const filePath = path.join(PREFS_DIR, `${userId}.json`);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(200).json({
        success: true,
        preferences: null,
        message: 'No preferences found. Using defaults.'
      });
    }

    // Read and parse file
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const preferences = JSON.parse(fileContent);

    return res.status(200).json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Error reading preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load preferences',
      code: 'INTERNAL_ERROR'
    });
  }
}
```

#### 3.2.2 PUT /api/v1/users/:userId/preferences

**Description**: Save user preferences to file (overwrites existing)

**Authorization**: Requires authentication. Users can only update their own preferences.

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "user-12345",
  "version": 1,
  "discover": {
    "panelOrder": ["query-control", "results-table"],
    "panelCollapsed": {},
    "gridColumns": 1
  },
  "tables": {
    "vehicle-results": {
      "columnOrder": ["manufacturer", "model"],
      "columnVisibility": { "manufacturer": true },
      "columnWidths": {},
      "sortField": null,
      "sortOrder": null,
      "pageSize": 20
    }
  },
  "filterDefaults": {},
  "charts": {
    "defaultChartType": "bar",
    "colorScheme": "default",
    "showLegend": true,
    "animationsEnabled": true
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Preferences saved successfully",
  "updatedAt": "2025-11-16T10:35:00.000Z"
}
```

**Response (400 Bad Request)** - Invalid preference data:
```json
{
  "success": false,
  "error": "Invalid preferences format",
  "code": "VALIDATION_ERROR",
  "details": ["discover.gridColumns must be 1, 2, or 3"]
}
```

**Backend Logic**:
```javascript
// userPreferencesController.js
async function updatePreferences(req, res) {
  const { userId } = req.params;
  const requestingUser = req.user;
  const preferences = req.body;

  // Authorization check
  if (requestingUser.id !== userId && !requestingUser.roles.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Cannot update preferences for another user',
      code: 'FORBIDDEN'
    });
  }

  // Validation
  const validation = validatePreferences(preferences);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid preferences format',
      code: 'VALIDATION_ERROR',
      details: validation.errors
    });
  }

  // Ensure directory exists
  await fs.promises.mkdir(PREFS_DIR, { recursive: true });

  // Add metadata
  const now = new Date().toISOString();
  const prefsToSave = {
    ...preferences,
    userId,
    updatedAt: now,
    createdAt: preferences.createdAt || now
  };

  const filePath = path.join(PREFS_DIR, `${userId}.json`);
  const tempPath = `${filePath}.tmp`;

  try {
    // Atomic write: Write to temp file, then rename
    await fs.promises.writeFile(
      tempPath,
      JSON.stringify(prefsToSave, null, 2),
      'utf8'
    );
    await fs.promises.rename(tempPath, filePath);

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully',
      updatedAt: now
    });

  } catch (error) {
    console.error('Error saving preferences:', error);

    // Clean up temp file if it exists
    try {
      await fs.promises.unlink(tempPath);
    } catch {}

    return res.status(500).json({
      success: false,
      error: 'Failed to save preferences',
      code: 'INTERNAL_ERROR'
    });
  }
}
```

#### 3.2.3 DELETE /api/v1/users/:userId/preferences

**Description**: Delete user preferences file (revert to defaults)

**Authorization**: Requires authentication. Users can delete their own preferences, or admins can delete any.

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Preferences deleted successfully"
}
```

---

## 4. FRONTEND INTEGRATION

### 4.1 UserPreferencesService

**Location**: `frontend/src/app/core/services/user-preferences.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { CurrentUserService } from './current-user.service';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private readonly API_BASE = '/api/v1/users';

  // Observable state
  private preferencesSubject = new BehaviorSubject<UserPreferences | null>(null);
  public preferences$ = this.preferencesSubject.asObservable();

  // In-memory cache
  private currentPreferences: UserPreferences | null = null;

  constructor(
    private http: HttpClient,
    private currentUser: CurrentUserService
  ) {}

  /**
   * Load preferences for the current user
   * Called automatically after login
   */
  loadPreferences(): Observable<UserPreferences> {
    const userId = this.currentUser.getUserId();

    if (!userId) {
      console.error('Cannot load preferences: No user ID');
      return of(this.getDefaultPreferences());
    }

    return this.http.get<{ success: boolean; preferences: UserPreferences | null }>(
      `${this.API_BASE}/${userId}/preferences`
    ).pipe(
      map(response => {
        // If no preferences exist, use defaults
        if (!response.preferences) {
          return this.getDefaultPreferences(userId);
        }
        return response.preferences;
      }),
      tap(prefs => {
        this.currentPreferences = prefs;
        this.preferencesSubject.next(prefs);
      }),
      catchError(error => {
        console.error('Error loading preferences:', error);
        const defaults = this.getDefaultPreferences(userId);
        this.currentPreferences = defaults;
        this.preferencesSubject.next(defaults);
        return of(defaults);
      })
    );
  }

  /**
   * Save preferences to backend
   * Debounced to avoid excessive saves
   */
  savePreferences(preferences: UserPreferences): Observable<void> {
    const userId = this.currentUser.getUserId();

    if (!userId) {
      console.error('Cannot save preferences: No user ID');
      return of(undefined);
    }

    // Update timestamp
    preferences.updatedAt = new Date().toISOString();

    return this.http.put<{ success: boolean }>(
      `${this.API_BASE}/${userId}/preferences`,
      preferences
    ).pipe(
      tap(() => {
        this.currentPreferences = preferences;
        this.preferencesSubject.next(preferences);
      }),
      map(() => undefined),
      catchError(error => {
        console.error('Error saving preferences:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Get current preferences synchronously
   */
  getCurrentPreferences(): UserPreferences | null {
    return this.currentPreferences;
  }

  /**
   * Update discover preferences
   */
  updateDiscoverPreferences(discover: Partial<DiscoverPreferences>): void {
    if (!this.currentPreferences) return;

    this.currentPreferences.discover = {
      ...this.currentPreferences.discover,
      ...discover
    };

    this.savePreferences(this.currentPreferences).subscribe();
  }

  /**
   * Update table preferences for specific table
   */
  updateTablePreferences(tableId: string, prefs: Partial<TablePreferences>): void {
    if (!this.currentPreferences) return;

    this.currentPreferences.tables[tableId] = {
      ...this.currentPreferences.tables[tableId],
      ...prefs
    };

    this.savePreferences(this.currentPreferences).subscribe();
  }

  /**
   * Update chart preferences
   */
  updateChartPreferences(charts: Partial<ChartPreferences>): void {
    if (!this.currentPreferences) return;

    this.currentPreferences.charts = {
      ...this.currentPreferences.charts,
      ...charts
    };

    this.savePreferences(this.currentPreferences).subscribe();
  }

  /**
   * Clear preferences (used on logout)
   */
  clearPreferences(): void {
    this.currentPreferences = null;
    this.preferencesSubject.next(null);
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string = ''): UserPreferences {
    const now = new Date().toISOString();
    return {
      userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
      discover: {
        panelOrder: [
          'query-control',
          'manufacturer-chart',
          'model-chart',
          'year-chart',
          'body-class-chart',
          'data-source-chart',
          'results-table'
        ],
        panelCollapsed: {},
        gridColumns: 2
      },
      tables: {
        'vehicle-results': {
          columnOrder: ['manufacturer', 'model', 'year', 'bodyClass', 'dataSource', 'instanceCount'],
          columnVisibility: {
            manufacturer: true,
            model: true,
            year: true,
            bodyClass: true,
            dataSource: true,
            instanceCount: true
          },
          columnWidths: {},
          sortField: null,
          sortOrder: null,
          pageSize: 20
        }
      },
      filterDefaults: {},
      charts: {
        defaultChartType: 'bar',
        colorScheme: 'default',
        showLegend: true,
        animationsEnabled: true
      }
    };
  }
}
```

### 4.2 Integration with AuthService

Update AuthService to load preferences on login:

```typescript
// auth.service.ts (UPDATE EXISTING FILE)
import { UserPreferencesService } from './user-preferences.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authStorage: AuthStorageService,
    private currentUser: CurrentUserService,
    private userPreferences: UserPreferencesService  // NEW
  ) {
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

            // NEW: Load user preferences after successful login
            this.userPreferences.loadPreferences().subscribe();
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
        this.clearSession();
      }
    });
  }

  /**
   * Clear session and redirect to login
   */
  private clearSession(): void {
    this.authStorage.clearToken();
    this.currentUser.clearUser();
    this.userPreferences.clearPreferences();  // NEW: Clear preferences
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }
}
```

### 4.3 Usage in DiscoverComponent

```typescript
// discover.component.ts (UPDATE EXISTING FILE)
import { UserPreferencesService } from '../../core/services/user-preferences.service';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverComponent implements OnInit, OnDestroy {
  panels: Panel[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private userPrefs: UserPreferencesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load preferences and apply to UI
    this.userPrefs.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        if (prefs) {
          this.applyPreferences(prefs);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Apply loaded preferences to component state
   */
  private applyPreferences(prefs: UserPreferences): void {
    // Apply panel order
    this.panels = this.reorderPanels(prefs.discover.panelOrder);

    // Apply collapsed state
    this.panels.forEach(panel => {
      panel.collapsed = prefs.discover.panelCollapsed[panel.id] || false;
    });

    // Grid columns
    this.gridColumns = prefs.discover.gridColumns;
  }

  /**
   * Called when user drags panels to reorder
   */
  onPanelDrop(event: CdkDragDrop<Panel[]>): void {
    moveItemInArray(this.panels, event.previousIndex, event.currentIndex);

    // Save new order to preferences
    const panelOrder = this.panels.map(p => p.id);
    this.userPrefs.updateDiscoverPreferences({ panelOrder });
  }

  /**
   * Called when user collapses/expands a panel
   */
  onPanelToggle(panelId: string, collapsed: boolean): void {
    const currentPrefs = this.userPrefs.getCurrentPreferences();
    if (!currentPrefs) return;

    const panelCollapsed = {
      ...currentPrefs.discover.panelCollapsed,
      [panelId]: collapsed
    };

    this.userPrefs.updateDiscoverPreferences({ panelCollapsed });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 5. MIGRATION FROM LOCALSTORAGE

### 5.1 Migration Strategy

For users who have existing localStorage preferences, provide one-time migration:

```typescript
// user-preferences-migration.service.ts (NEW FILE)
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesMigrationService {

  /**
   * Migrate localStorage preferences to backend on first login
   */
  migrateLocalStoragePreferences(userId: string): UserPreferences | null {
    const legacyKeys = [
      'discover-panel-order',
      'table_prefs_vehicle-results',
      'chart-preferences'
    ];

    let hasLegacyData = false;
    const migratedPrefs: Partial<UserPreferences> = {};

    // Check for legacy panel order
    const panelOrder = localStorage.getItem('discover-panel-order');
    if (panelOrder) {
      try {
        migratedPrefs.discover = {
          panelOrder: JSON.parse(panelOrder),
          panelCollapsed: {},
          gridColumns: 2
        };
        hasLegacyData = true;
      } catch (e) {
        console.error('Error migrating panel order:', e);
      }
    }

    // Check for legacy table preferences
    const tablePrefs = localStorage.getItem('table_prefs_vehicle-results');
    if (tablePrefs) {
      try {
        migratedPrefs.tables = {
          'vehicle-results': JSON.parse(tablePrefs)
        };
        hasLegacyData = true;
      } catch (e) {
        console.error('Error migrating table preferences:', e);
      }
    }

    if (!hasLegacyData) {
      return null;
    }

    // Build complete preferences object
    const now = new Date().toISOString();
    const fullPrefs: UserPreferences = {
      userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
      discover: migratedPrefs.discover || this.getDefaultDiscover(),
      tables: migratedPrefs.tables || {},
      filterDefaults: {},
      charts: this.getDefaultCharts()
    };

    // Clear localStorage after successful migration
    legacyKeys.forEach(key => localStorage.removeItem(key));

    return fullPrefs;
  }

  private getDefaultDiscover(): DiscoverPreferences {
    return {
      panelOrder: ['query-control', 'manufacturer-chart', 'results-table'],
      panelCollapsed: {},
      gridColumns: 2
    };
  }

  private getDefaultCharts(): ChartPreferences {
    return {
      defaultChartType: 'bar',
      colorScheme: 'default',
      showLegend: true,
      animationsEnabled: true
    };
  }
}
```

**Migration Flow**:
1. User logs in for first time after migration
2. Check if backend has preferences file
3. If NOT, check localStorage for legacy data
4. If legacy data exists, migrate to backend
5. Clear localStorage
6. Future sessions use backend exclusively

---

## 6. VALIDATION

### 6.1 Backend Validation

```javascript
// userPreferencesValidator.js (NEW FILE)
function validatePreferences(prefs) {
  const errors = [];

  // Validate userId
  if (!prefs.userId || typeof prefs.userId !== 'string') {
    errors.push('userId is required and must be a string');
  }

  // Validate version
  if (typeof prefs.version !== 'number' || prefs.version < 1) {
    errors.push('version must be a number >= 1');
  }

  // Validate discover preferences
  if (prefs.discover) {
    if (!Array.isArray(prefs.discover.panelOrder)) {
      errors.push('discover.panelOrder must be an array');
    }

    if (typeof prefs.discover.gridColumns !== 'number' ||
        ![1, 2, 3].includes(prefs.discover.gridColumns)) {
      errors.push('discover.gridColumns must be 1, 2, or 3');
    }

    if (typeof prefs.discover.panelCollapsed !== 'object') {
      errors.push('discover.panelCollapsed must be an object');
    }
  } else {
    errors.push('discover preferences are required');
  }

  // Validate tables
  if (typeof prefs.tables !== 'object') {
    errors.push('tables must be an object');
  }

  // Validate charts
  if (prefs.charts) {
    const validChartTypes = ['bar', 'pie', 'line'];
    if (!validChartTypes.includes(prefs.charts.defaultChartType)) {
      errors.push('charts.defaultChartType must be one of: bar, pie, line');
    }

    if (typeof prefs.charts.showLegend !== 'boolean') {
      errors.push('charts.showLegend must be a boolean');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validatePreferences };
```

---

## 7. ERROR HANDLING

### 7.1 Backend Errors

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| File read error | 500 | `{ success: false, error: "Failed to load preferences" }` |
| File write error | 500 | `{ success: false, error: "Failed to save preferences" }` |
| Invalid JSON | 400 | `{ success: false, error: "Invalid preferences format" }` |
| Directory creation error | 500 | `{ success: false, error: "Storage error" }` |
| Permission denied | 500 | `{ success: false, error: "Storage permission error" }` |
| User ID mismatch | 403 | `{ success: false, error: "Cannot access another user's preferences" }` |

### 7.2 Frontend Error Handling

```typescript
// Error handling in UserPreferencesService
loadPreferences(): Observable<UserPreferences> {
  const userId = this.currentUser.getUserId();

  if (!userId) {
    console.error('Cannot load preferences: No user ID');
    return of(this.getDefaultPreferences());
  }

  return this.http.get<{ success: boolean; preferences: UserPreferences | null }>(
    `${this.API_BASE}/${userId}/preferences`
  ).pipe(
    map(response => response.preferences || this.getDefaultPreferences(userId)),
    tap(prefs => {
      this.currentPreferences = prefs;
      this.preferencesSubject.next(prefs);
    }),
    catchError(error => {
      console.error('Error loading preferences:', error);

      // Show user-friendly notification
      this.notificationService.showWarning(
        'Unable to load preferences. Using defaults.'
      );

      const defaults = this.getDefaultPreferences(userId);
      this.currentPreferences = defaults;
      this.preferencesSubject.next(defaults);
      return of(defaults);
    })
  );
}
```

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 Debounced Saves

Avoid saving on every keystroke or minor change:

```typescript
// Debounce save operations
private savePending = false;
private saveDebounceTimer: any = null;

private debouncedSave(preferences: UserPreferences): void {
  if (this.saveDebounceTimer) {
    clearTimeout(this.saveDebounceTimer);
  }

  this.saveDebounceTimer = setTimeout(() => {
    this.savePreferences(preferences).subscribe();
  }, 1000); // Wait 1 second after last change
}
```

### 8.2 Caching

- Frontend caches preferences in memory after initial load
- No repeated API calls on every component mount
- Only save to backend when preferences actually change

### 8.3 File Size Limits

- Maximum preference file size: **10 KB**
- Validation enforces reasonable limits on array lengths
- Prevents abuse (e.g., storing thousands of custom columns)

---

## 9. SECURITY CONSIDERATIONS

### 9.1 Authorization

- Users can ONLY access their own preferences
- Exception: Admins can access any user's preferences
- JWT token validation required for all endpoints
- User ID from token MUST match URL parameter

### 9.2 File System Security

- Preference files stored outside web root (not publicly accessible)
- Restrictive file permissions (644)
- No directory traversal attacks (validate user IDs)
- Atomic writes to prevent partial file corruption

### 9.3 Input Validation

- Validate all preference data on backend
- Sanitize user IDs (alphanumeric + hyphens only)
- Limit JSON depth and size
- Prevent injection attacks

---

## 10. TESTING STRATEGY

### 10.1 Backend Tests

```javascript
// userPreferencesController.test.js
describe('UserPreferencesController', () => {
  describe('GET /api/v1/users/:userId/preferences', () => {
    it('should return user preferences if file exists', async () => {
      // Create test file
      await createTestPrefsFile('user-123', testPrefs);

      const res = await request(app)
        .get('/api/v1/users/user-123/preferences')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.preferences.userId).toBe('user-123');
    });

    it('should return null if no preferences exist', async () => {
      const res = await request(app)
        .get('/api/v1/users/user-new/preferences')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.preferences).toBeNull();
    });

    it('should reject unauthorized access to other user prefs', async () => {
      const res = await request(app)
        .get('/api/v1/users/user-other/preferences')
        .set('Authorization', `Bearer ${userToken}`) // Non-admin token
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/v1/users/:userId/preferences', () => {
    it('should save valid preferences', async () => {
      const res = await request(app)
        .put('/api/v1/users/user-123/preferences')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validPreferences)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify file was created
      const filePath = path.join(PREFS_DIR, 'user-123.json');
      const exists = fs.existsSync(filePath);
      expect(exists).toBe(true);
    });

    it('should reject invalid preferences', async () => {
      const invalidPrefs = { ...validPreferences };
      delete invalidPrefs.discover;

      const res = await request(app)
        .put('/api/v1/users/user-123/preferences')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidPrefs)
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 10.2 Frontend Tests

```typescript
// user-preferences.service.spec.ts
describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserPreferencesService, CurrentUserService]
    });

    service = TestBed.inject(UserPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should load preferences from backend', () => {
    const mockPrefs: UserPreferences = { /* ... */ };

    service.loadPreferences().subscribe(prefs => {
      expect(prefs).toEqual(mockPrefs);
    });

    const req = httpMock.expectOne('/api/v1/users/user-123/preferences');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, preferences: mockPrefs });
  });

  it('should use defaults if no preferences exist', () => {
    service.loadPreferences().subscribe(prefs => {
      expect(prefs.discover.panelOrder).toBeDefined();
      expect(prefs.userId).toBe('user-123');
    });

    const req = httpMock.expectOne('/api/v1/users/user-123/preferences');
    req.flush({ success: true, preferences: null });
  });

  it('should save preferences to backend', () => {
    const prefsToSave: UserPreferences = { /* ... */ };

    service.savePreferences(prefsToSave).subscribe();

    const req = httpMock.expectOne('/api/v1/users/user-123/preferences');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(prefsToSave);
  });
});
```

### 10.3 E2E Tests

```typescript
// user-preferences.e2e.spec.ts
test('should persist panel order across sessions', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/discover');

  // Reorder panels
  await page.dragAndDrop('#panel-table', '#panel-chart');
  await page.waitForTimeout(1500); // Wait for debounced save

  // Logout
  await page.click('button[aria-label="Logout"]');
  await page.waitForURL('/login');

  // Login again
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('/discover');

  // Verify panel order persisted
  const firstPanel = await page.locator('.panel').first();
  await expect(firstPanel).toHaveAttribute('data-panel-id', 'table');
});
```

---

## 11. DEPLOYMENT

### 11.1 Environment Configuration

**Backend Environment Variables**:
```bash
# User preferences storage location
USER_PREFS_DIR=~/projects/auto-discovery-user-prefs

# Maximum preference file size (bytes)
MAX_PREFS_FILE_SIZE=10240  # 10 KB
```

### 11.2 Kubernetes Volume Mount

```yaml
# k8s/backend-deployment.yaml (UPDATE EXISTING FILE)
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: USER_PREFS_DIR
          value: "/app/user-prefs"
        volumeMounts:
        - name: user-preferences
          mountPath: /app/user-prefs
      volumes:
      - name: user-preferences
        hostPath:
          path: /home/odin/projects/auto-discovery-user-prefs
          type: DirectoryOrCreate
```

### 11.3 Initial Setup

```bash
# Create preferences directory on host
mkdir -p ~/projects/auto-discovery-user-prefs
chmod 755 ~/projects/auto-discovery-user-prefs

# Backend will create user files as needed with 644 permissions
```

---

## 12. ROADMAP INTEGRATION

### 12.1 Implementation Phases

**Phase 1: Backend Foundation** (Week 1)
- [ ] Create `~/projects/auto-discovery-user-prefs/` directory
- [ ] Implement preference file read/write utilities
- [ ] Implement validation logic
- [ ] Create GET /api/v1/users/:userId/preferences endpoint
- [ ] Create PUT /api/v1/users/:userId/preferences endpoint
- [ ] Create DELETE /api/v1/users/:userId/preferences endpoint
- [ ] Write backend unit tests (30+ tests)

**Phase 2: Frontend Service** (Week 1-2)
- [ ] Create UserPreferencesService
- [ ] Create TypeScript interfaces (UserPreferences, etc.)
- [ ] Integrate with AuthService (load on login, clear on logout)
- [ ] Implement debounced save logic
- [ ] Write frontend unit tests (25+ tests)

**Phase 3: Component Integration** (Week 2)
- [ ] Update DiscoverComponent to use UserPreferencesService
- [ ] Remove localStorage calls for panel order
- [ ] Remove localStorage calls for panel collapsed state
- [ ] Update BaseDataTableComponent for table preferences
- [ ] Remove localStorage calls for column visibility

**Phase 4: Migration** (Week 2-3)
- [ ] Implement UserPreferencesMigrationService
- [ ] Test migration from localStorage to backend
- [ ] One-time migration on first login after deployment

**Phase 5: Testing & Deployment** (Week 3)
- [ ] E2E tests for preference persistence
- [ ] Load testing (concurrent saves)
- [ ] Backup/restore procedures
- [ ] Production deployment
- [ ] Monitor for file system errors

---

## 13. SUCCESS CRITERIA

- ✅ All user preferences stored in files (NOT localStorage)
- ✅ Each user has unique preference file: `~/projects/auto-discovery-user-prefs/<userId>.json`
- ✅ Preferences load automatically on login
- ✅ Preferences save automatically on changes (debounced)
- ✅ Preferences cleared on logout
- ✅ Users cannot access other users' preferences
- ✅ Migration from localStorage works seamlessly
- ✅ 90%+ test coverage for preference service
- ✅ Zero localStorage usage for user preferences

---

## APPENDIX A: COMPLETE EXAMPLE

**User Preference File**: `~/projects/auto-discovery-user-prefs/user-12345.json`

```json
{
  "userId": "user-12345",
  "version": 1,
  "createdAt": "2025-11-15T00:00:00.000Z",
  "updatedAt": "2025-11-16T10:45:00.000Z",
  "discover": {
    "panelOrder": [
      "query-control",
      "manufacturer-chart",
      "model-chart",
      "results-table",
      "year-chart",
      "body-class-chart",
      "data-source-chart"
    ],
    "panelCollapsed": {
      "year-chart": true,
      "data-source-chart": true
    },
    "gridColumns": 2
  },
  "tables": {
    "vehicle-results": {
      "columnOrder": [
        "manufacturer",
        "model",
        "year",
        "bodyClass",
        "dataSource",
        "instanceCount",
        "vin"
      ],
      "columnVisibility": {
        "manufacturer": true,
        "model": true,
        "year": true,
        "bodyClass": true,
        "dataSource": true,
        "instanceCount": true,
        "vin": false,
        "trim": false
      },
      "columnWidths": {
        "manufacturer": 200,
        "model": 180,
        "year": 100
      },
      "sortField": "manufacturer",
      "sortOrder": "asc",
      "pageSize": 50
    }
  },
  "filterDefaults": {
    "manufacturer": ["Ford", "Toyota"],
    "yearMin": 2020
  },
  "charts": {
    "defaultChartType": "bar",
    "colorScheme": "default",
    "showLegend": true,
    "animationsEnabled": true
  }
}
```

---

**END OF SPECIFICATION**

This specification provides complete, implementation-ready requirements for file-based user preference storage that fully replaces localStorage and integrates with the authentication system.
