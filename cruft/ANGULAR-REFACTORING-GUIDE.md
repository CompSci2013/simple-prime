# Angular Refactoring Guide: Anti-patterns, Circular Dependencies & Architecture Cleanup

**Status**: Active Reference Guide
**Scope**: Mid-sized Angular 14+ applications (100+ components, 10+ modules)
**Focus**: Circular dependencies, inheritance anti-patterns, module re-exports, component composition
**Last Updated**: 2025-12-18

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Anti-pattern Categories](#anti-pattern-categories)
3. [Detection Methods](#detection-methods)
4. [Root Cause Analysis](#root-cause-analysis)
5. [Refactoring Patterns](#refactoring-patterns)
6. [Implementation Strategy](#implementation-strategy)
7. [Tools & Automation](#tools--automation)
8. [Real-world Scenarios](#real-world-scenarios)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 3-Step Process

**Step 1: Identify** (Which anti-patterns exist?)
- Run automated detection scripts
- Manual code review
- Build with diagnostics

**Step 2: Understand** (Why did this happen?)
- Trace dependency chains
- Document root causes
- Assess impact scope

**Step 3: Refactor** (How do we fix it?)
- Apply pattern-specific fixes
- Verify no regressions
- Document decisions

### Priority Order

1. **Circular Dependencies** (Blocks code splitting, tree-shaking, module loading)
2. **Module Re-exports** (Creates hidden dependencies)
3. **Component Inheritance Anti-pattern** (Breaks composition principle)
4. **Unused Imports/Exports** (Code bloat, confusion)
5. **Over-abstraction** (Performance, maintainability)

---

## Anti-pattern Categories

### Category 1: Circular Dependencies

#### Pattern: File-Level Circular Import

```typescript
// ❌ BAD: file-a.ts
import { ServiceB } from './file-b';
export class ServiceA {
  constructor(b: ServiceB) {}
}

// ❌ BAD: file-b.ts
import { ServiceA } from './file-a';
export class ServiceB {
  constructor(a: ServiceA) {}
}
```

**Impact**:
- Module loading order undefined
- Tree-shaking broken
- Code splitting fails
- Runtime errors unpredictable

**How It Happens**:
- Organic feature growth
- Utilities "convenience" refactoring
- Bidirectional service communication
- Barrel exports (index.ts) at wrong level

**Detection**:
```bash
# Webpack analysis
npm install --save-dev circular-dependency-plugin

# Static analysis
npm install --save-dev madge
madge --circular src/

# TSLint
npm install --save-dev codelyzer
```

---

#### Pattern: Service-Level Circular Dependency

```typescript
// ❌ BAD: user.service.ts
export class UserService {
  constructor(private http: HttpClient, private company: CompanyService) {}

  getUser(id: string) {
    return this.company.getCompanyUser(id);  // UserService → CompanyService
  }
}

// ❌ BAD: company.service.ts
export class CompanyService {
  constructor(private http: HttpClient, private user: UserService) {}

  getCompanyUser(id: string) {
    return this.user.getUser(id);  // CompanyService → UserService (CIRCULAR!)
  }
}
```

**Root Causes**:
- Shared data model needs both services
- Convenience method placed in wrong service
- Insufficient facade/coordinator pattern
- Over-coupled business logic

**Fix Pattern: Extract Facade Service**

```typescript
// ✅ CORRECT: user-company.facade.ts
@Injectable()
export class UserCompanyFacade {
  constructor(
    private user: UserService,
    private company: CompanyService
  ) {}

  getCompanyUser(id: string) {
    // Single responsibility: coordinate between services
    return this.company.getCompanyConfig()
      .pipe(
        switchMap(config => this.user.getUser(id, config))
      );
  }
}

// user.service.ts - NO import of CompanyService
export class UserService {
  constructor(private http: HttpClient) {}
  getUser(id: string, config: CompanyConfig) {
    return this.http.get(`/users/${id}`);
  }
}

// company.service.ts - NO import of UserService
export class CompanyService {
  constructor(private http: HttpClient) {}
  getCompanyConfig() {
    return this.http.get(`/company/config`);
  }
}
```

---

#### Pattern: Module-Level Circular Dependency

```typescript
// ❌ BAD: feature-a.module.ts
@NgModule({
  imports: [FeatureBModule]  // Feature A imports Feature B
})
export class FeatureAModule { }

// ❌ BAD: feature-b.module.ts
@NgModule({
  imports: [FeatureAModule]  // Feature B imports Feature A (CIRCULAR!)
})
export class FeatureBModule { }

// ❌ BAD: app.module.ts
@NgModule({
  imports: [FeatureAModule, FeatureBModule]  // Both imported
})
export class AppModule { }
```

**Root Causes**:
- Shared components living in wrong module
- Features evolved without boundary management
- Barrel exports without clear ownership
- Cross-feature dependencies

**Fix Pattern: Extract Shared Module**

```typescript
// ✅ CORRECT: shared.module.ts
@NgModule({
  declarations: [SharedHeaderComponent, SharedFooterComponent],
  exports: [SharedHeaderComponent, SharedFooterComponent]
})
export class SharedModule { }

// feature-a.module.ts
@NgModule({
  imports: [SharedModule]  // Import shared, NOT FeatureBModule
})
export class FeatureAModule { }

// feature-b.module.ts
@NgModule({
  imports: [SharedModule]  // Import shared, NOT FeatureAModule
})
export class FeatureBModule { }

// app.module.ts
@NgModule({
  imports: [SharedModule, FeatureAModule, FeatureBModule]
})
export class AppModule { }
```

---

### Category 2: Component Inheritance Anti-pattern

#### Pattern: Unnecessary Component Inheritance

```typescript
// ❌ BAD: base-card.component.ts
@Component({
  selector: 'app-base-card',
  template: `
    <div class="card">
      <ng-content></ng-content>
    </div>
  `
})
export class BaseCardComponent {
  @Input() title: string;
  @Input() padding: string = '16px';

  toggleCard() { }
}

// ❌ BAD: user-card.component.ts - EXTENDS base card
@Component({
  selector: 'app-user-card',
  template: `
    <div [title]="userName">
      {{ userEmail }}
    </div>
  `
})
export class UserCardComponent extends BaseCardComponent {  // ← WRONG!
  @Input() userName: string;
  @Input() userEmail: string;

  ngOnInit() {
    this.title = this.userName;
  }
}

// ❌ BAD: product-card.component.ts - ALSO EXTENDS base card
@Component({
  selector: 'app-product-card',
  template: `
    <div [title]="productName">
      {{ productPrice | currency }}
    </div>
  `
})
export class ProductCardComponent extends BaseCardComponent {  // ← WRONG!
  @Input() productName: string;
  @Input() productPrice: number;
}
```

**Problems**:
1. **Fragile Hierarchy**: Changes to BaseCardComponent affect all children
2. **Hidden Coupling**: BaseCardComponent properties appear in UserCardComponent
3. **Difficult Testing**: Must test base class behavior through derived class
4. **Code Reuse Myth**: Actually reuses 1-2 properties, not logic
5. **Type Confusion**: UserCardComponent IS-A CardComponent (wrong semantic)

**When Inheritance IS Appropriate**:
- Sharing complex lifecycle logic (99% of time: NO)
- Base class with 10+ methods (1-2% of components)
- Clear "is-a" relationship (rare in UI components)

```typescript
// ✅ RARE ACCEPTABLE CASE: Complex lifecycle shared logic
export class DataGridBase {
  data: T[];
  sortBy: string;
  filterBy: string;

  sort() { /* complex sorting logic */ }
  filter() { /* complex filtering logic */ }
  paginate() { /* complex pagination */ }
}

export class UserDataGridComponent extends DataGridBase {
  // Makes sense: IS-A data grid with specialized behavior
}
```

**Better Approach: Composition Over Inheritance**

```typescript
// ✅ CORRECT: Reusable card component via composition
@Component({
  selector: 'app-card',
  template: `
    <div class="card" [style.padding]="padding">
      <div class="card-header" *ngIf="title">{{ title }}</div>
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() title: string;
  @Input() padding: string = '16px';
}

// user-card.component.ts - COMPOSES card
@Component({
  selector: 'app-user-card',
  template: `
    <app-card [title]="userName" padding="20px">
      <div class="user-email">{{ userEmail }}</div>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent]
})
export class UserCardComponent {
  @Input() userName: string;
  @Input() userEmail: string;
  // NO extends, NO BaseCardComponent inheritance
}

// product-card.component.ts - COMPOSES card
@Component({
  selector: 'app-product-card',
  template: `
    <app-card [title]="productName" padding="24px">
      <div class="product-price">{{ productPrice | currency }}</div>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent]
})
export class ProductCardComponent {
  @Input() productName: string;
  @Input() productPrice: number;
  // NO extends, NO BaseCardComponent inheritance
}
```

**Composition Benefits**:
- ✅ Clear responsibility (UserCardComponent has user UI)
- ✅ Flexible (can swap CardComponent for different styling)
- ✅ Testable (test CardComponent and UserCardComponent separately)
- ✅ Reusable (CardComponent used everywhere)
- ✅ Maintainable (changes to one don't affect others)

---

#### Pattern: Component Extending Component (Wrong Semantic)

```typescript
// ❌ BAD: form-base.component.ts
@Component({
  template: `
    <form [formGroup]="form">
      <ng-content></ng-content>
      <button type="submit">{{ submitLabel }}</button>
    </form>
  `
})
export class FormBaseComponent {
  @Input() submitLabel = 'Submit';
  @Output() submitted = new EventEmitter();
  form: FormGroup;

  onSubmit() {
    this.submitted.emit(this.form.value);
  }
}

// ❌ BAD: user-form.component.ts - EXTENDS FormBase
@Component({
  selector: 'app-user-form',
  template: `
    <div>
      <input formControl="userName" />
    </div>
  `
})
export class UserFormComponent extends FormBaseComponent {
  // Problem: UserFormComponent IS-A FormBaseComponent? Wrong!
  // Should be: UserFormComponent USES FormBaseComponent
}
```

**Issue**: Semantic meaning is wrong
- UserFormComponent is NOT-A FormComponent
- UserFormComponent USES a form container

**Fix: Use Composition**

```typescript
// ✅ CORRECT: form-container.component.ts
@Component({
  selector: 'app-form-container',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <ng-content></ng-content>
      <button type="submit">{{ submitLabel }}</button>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerComponent {
  @Input() form: FormGroup;
  @Input() submitLabel = 'Submit';
  @Output() submitted = new EventEmitter();

  onSubmit() {
    this.submitted.emit(this.form.value);
  }
}

// user-form.component.ts - COMPOSES form container
@Component({
  selector: 'app-user-form',
  template: `
    <app-form-container
      [form]="form"
      submitLabel="Create User"
      (submitted)="onSubmitForm($event)">

      <div class="form-group">
        <label>Name</label>
        <input formControl="userName" />
      </div>

    </app-form-container>
  `,
  standalone: true,
  imports: [FormContainerComponent, ReactiveFormsModule]
})
export class UserFormComponent {
  form = this.fb.group({
    userName: ['', Validators.required]
  });

  constructor(private fb: FormBuilder) {}

  onSubmitForm(data: any) {
    // Handle submit
  }
}
```

---

### Category 3: Module Re-export Anti-pattern

(See MODULE-ARCHITECTURE-AUDIT.md for full details)

```typescript
// ❌ BAD: Hides dependencies
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [CommonModule, FormsModule, PrimengModule]  // Re-exports
})
export class FrameworkModule { }

// ✅ CORRECT: Explicit dependencies only
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [MyComponent]  // Only what you declare
})
export class FrameworkModule { }
```

---

### Category 4: Over-abstraction Anti-pattern

```typescript
// ❌ BAD: Abstract class for 2 methods reused once
export abstract class BaseEntity {
  abstract getId(): string;
  abstract getName(): string;
}

export class User extends BaseEntity {
  getId() { return this.id; }
  getName() { return this.name; }
}

export class Product extends BaseEntity {
  getId() { return this.sku; }
  getName() { return this.productName; }
}
```

**Problem**: Abstraction adds complexity for minimal code reuse

**Fix**: Use interfaces when enough reuse exists

```typescript
// ✅ CORRECT: Interface defines shape, no inheritance
export interface Entity {
  getId(): string;
  getName(): string;
}

export class User implements Entity {
  constructor(private id: string, private name: string) {}
  getId() { return this.id; }
  getName() { return this.name; }
}

export class Product implements Entity {
  constructor(private sku: string, private productName: string) {}
  getId() { return this.sku; }
  getName() { return this.productName; }
}

// Usage: Both implement Entity interface (structural typing)
function displayEntity(entity: Entity) {
  console.log(entity.getId(), entity.getName());
}
```

---

## Detection Methods

### Method 1: Build-time Analysis

```bash
# Angular Diagnostics
ng build --configuration development --diagnostics

# Circular Dependency Plugin
npm install --save-dev circular-dependency-plugin
# Then configure in webpack config
```

**What to look for**:
- NG0200: Circular dependency in DI
- NG8113: Unused standalone imports
- Any "circular" warnings

---

### Method 2: Static Analysis Tools

#### madge (Dependency Graph Analysis)

```bash
npm install --save-dev madge

# Find circular dependencies
madge --circular src/

# Generate dependency graph
madge --image output.png src/

# Output formats: text, json, json-compact
madge --format json src/ > deps.json
```

**Example Output**:
```
Circular dependencies:
user.service.ts -> company.service.ts -> user.service.ts
feature-a.module.ts -> feature-b.module.ts -> feature-a.module.ts
```

---

#### Depcheck (Unused Dependencies)

```bash
npm install --save-dev depcheck

# Find unused imports
depcheck src/

# Find missing imports
depcheck --missing src/
```

---

#### TSLint / ESLint Rules

```bash
npm install --save-dev @typescript-eslint/eslint-plugin

# Add to .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        "patterns": ["src/**/index"]  // Prevent barrel export overuse
      }
    ]
  }
}
```

---

### Method 3: Compodoc Analysis

```bash
npm run docs:gen  # Generate Compodoc

# Analyze generated JSON
cat dist/documentation/coverage.json | jq '.modules[] | select(.dependencies | length > 5)'
```

**In Compodoc UI**:
1. Navigate to Modules
2. Check each module's "Local Dependencies"
3. Look for bidirectional imports (A→B and B→A)

---

### Method 4: IDE Analysis

**VSCode Extensions**:
- `TODO Highlight` - Mark circular references
- `Dependency Analytics` - Visualize dependencies
- `Ts-circle-checker` - Find circular imports

**Manual Pattern Search**:
```bash
# Find files importing each other
grep -r "import.*from.*service-a" src/ | grep -l "service-b"
grep -r "import.*from.*service-b" src/ | grep -l "service-a"

# Find component inheritance
grep -r "extends.*Component" src/ --include="*.ts"

# Find module re-exports
grep -r "export.*import" src/ --include="*.ts"
```

---

### Method 5: Custom Audit Script

Create `scripts/audit-architecture.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

/**
 * Audit script to find architecture anti-patterns
 */

const issues = {
  circularDeps: [],
  componentExtends: [],
  moduleReexports: [],
  unusedImports: []
};

function findComponentExtends(filePath, content) {
  // Find: class X extends Y {  where both are @Component
  const regex = /export\s+class\s+(\w+)\s+extends\s+(\w+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Check if both are components (would need AST parsing for accuracy)
    if (content.includes('@Component')) {
      issues.componentExtends.push({
        file: filePath,
        derived: match[1],
        base: match[2]
      });
    }
  }
}

function findModuleReexports(filePath, content) {
  // Find: @NgModule with same items in imports and exports
  const ngModuleMatch = content.match(/@NgModule\s*\(([\s\S]*?)\)/);
  if (!ngModuleMatch) return;

  const importsMatch = ngModuleMatch[1].match(/imports:\s*\[([\s\S]*?)\]/);
  const exportsMatch = ngModuleMatch[1].match(/exports:\s*\[([\s\S]*?)\]/);

  if (!importsMatch || !exportsMatch) return;

  const imports = importsMatch[1].split(',').map(s => s.trim());
  const exports = exportsMatch[1].split(',').map(s => s.trim());

  const reexports = imports.filter(i => exports.includes(i));
  if (reexports.length > 0) {
    issues.moduleReexports.push({
      file: filePath,
      reexports: reexports
    });
  }
}

// Scan all TypeScript files
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.includes('node_modules')) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      findComponentExtends(fullPath, content);
      findModuleReexports(fullPath, content);
    }
  });
}

// Run audit
scanDirectory('src/');

// Report
console.log('╔════════════════════════════════════════╗');
console.log('║     ARCHITECTURE AUDIT REPORT          ║');
console.log('╚════════════════════════════════════════╝\n');

if (issues.componentExtends.length > 0) {
  console.log(`⚠️  Component Inheritance Anti-pattern (${issues.componentExtends.length}):`);
  issues.componentExtends.forEach(i => {
    console.log(`   ${i.file}: ${i.derived} extends ${i.base}`);
  });
  console.log();
}

if (issues.moduleReexports.length > 0) {
  console.log(`⚠️  Module Re-exports (${issues.moduleReexports.length}):`);
  issues.moduleReexports.forEach(i => {
    console.log(`   ${i.file}: Re-exports ${i.reexports.join(', ')}`);
  });
  console.log();
}

console.log('\n📊 Summary:');
console.log(`   Component Inheritance Issues: ${issues.componentExtends.length}`);
console.log(`   Module Re-export Issues: ${issues.moduleReexports.length}`);

process.exit(issues.componentExtends.length > 0 || issues.moduleReexports.length > 0 ? 1 : 0);
```

**Run it**:
```bash
chmod +x scripts/audit-architecture.js
node scripts/audit-architecture.js
```

---

## Root Cause Analysis

### Why Do Anti-patterns Emerge?

#### 1. **Organic Growth Without Boundaries**
- Started with clear structure
- Features added without architecture review
- No dependency constraints enforced

**Prevention**:
- Code review checklist for module imports
- Automated architecture tests
- Clear module boundaries documented

#### 2. **Convenience Over Correctness**
- "Re-export this module for convenience"
- "Extend this base class to save time"
- "Just import from component, easier than service"

**Prevention**:
- Team guidelines (see ANGULAR-MODULE-GUIDELINES.md)
- Pre-commit hooks with validation
- Architecture ADRs (Architectural Decision Records)

#### 3. **Insufficient Knowledge**
- Developer doesn't know composition is better
- Not familiar with dependency inversion
- Doesn't understand module boundaries

**Prevention**:
- Architecture documentation
- Code review education
- Architecture decision records

#### 4. **Technical Debt Accumulation**
- Quick fix becomes permanent
- Refactoring deferred "for later"
- No time allocated for architecture maintenance

**Prevention**:
- Architecture sprints (20% time)
- Technical debt backlog item
- Quality metrics tracked

---

## Refactoring Patterns

### Pattern 1: Breaking Circular Dependencies

#### Scenario: Service-to-Service Circular

```typescript
// BEFORE: Circular dependency
// user.service.ts
export class UserService {
  constructor(private company: CompanyService) {}

  getUser(id) {
    return this.company.getCompanyUser(id);  // → CompanyService
  }
}

// company.service.ts
export class CompanyService {
  constructor(private user: UserService) {}

  getCompanyUser(id) {
    return this.user.getUser(id);  // → UserService (CIRCULAR!)
  }
}
```

#### Fix: Extract Coordinator Service

```typescript
// AFTER: No circular dependency

// user.service.ts (ONLY handles users)
@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  validateUser(user: User): boolean {
    return user.id && user.email;
  }
}

// company.service.ts (ONLY handles companies)
@Injectable()
export class CompanyService {
  constructor(private http: HttpClient) {}

  getCompanyById(id: string): Observable<Company> {
    return this.http.get<Company>(`/api/companies/${id}`);
  }
}

// NEW: user-company.coordinator.ts (COORDINATES both)
@Injectable()
export class UserCompanyCoordinator {
  constructor(
    private user: UserService,
    private company: CompanyService
  ) {}

  getUserWithCompanyInfo(userId: string): Observable<UserWithCompany> {
    return this.user.getUser(userId).pipe(
      switchMap(user =>
        this.company.getCompanyById(user.companyId).pipe(
          map(company => ({ user, company }))
        )
      )
    );
  }
}

// In component:
export class UserDetailComponent implements OnInit {
  user$: Observable<UserWithCompany>;

  constructor(private coordinator: UserCompanyCoordinator) {}

  ngOnInit() {
    this.user$ = this.coordinator.getUserWithCompanyInfo(this.userId);
  }
}
```

---

#### Scenario: Module-to-Module Circular

```typescript
// BEFORE: Circular modules
// feature-a.module.ts imports feature-b.module.ts
// feature-b.module.ts imports feature-a.module.ts

// AFTER: Shared module approach
// shared/shared.module.ts
@NgModule({
  declarations: [SharedHeaderComponent, SharedFooterComponent, SharedNavComponent],
  exports: [SharedHeaderComponent, SharedFooterComponent, SharedNavComponent]
})
export class SharedModule { }

// feature-a.module.ts
@NgModule({
  imports: [SharedModule]  // Import SHARED, not FeatureB
})
export class FeatureAModule { }

// feature-b.module.ts
@NgModule({
  imports: [SharedModule]  // Import SHARED, not FeatureA
})
export class FeatureBModule { }

// Architecture:
//   FeatureAModule ──┐
//                    ├─→ SharedModule
//   FeatureBModule ──┘
//
// No circular path!
```

---

### Pattern 2: Converting Inheritance to Composition

#### Scenario: Component Inheritance

```typescript
// BEFORE: Inheritance anti-pattern
export class BaseCardComponent {
  @Input() title: string;
  @Input() content: string;

  toggleExpanded() { }
}

export class UserCardComponent extends BaseCardComponent {
  @Input() user: User;
}

export class ProductCardComponent extends BaseCardComponent {
  @Input() product: Product;
}

// AFTER: Composition

// reusable-card.component.ts
@Component({
  selector: 'app-reusable-card',
  template: `
    <div class="card">
      <div class="card-header" (click)="expanded = !expanded">
        {{ title }}
      </div>
      <div class="card-content" *ngIf="expanded">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReusableCardComponent {
  @Input() title: string;
  expanded = false;
}

// user-card.component.ts
@Component({
  selector: 'app-user-card',
  template: `
    <app-reusable-card [title]="'User: ' + user.name">
      <div class="user-info">
        <p>Email: {{ user.email }}</p>
        <p>Phone: {{ user.phone }}</p>
      </div>
    </app-reusable-card>
  `,
  standalone: true,
  imports: [ReusableCardComponent, CommonModule]
})
export class UserCardComponent {
  @Input() user: User;
}

// product-card.component.ts
@Component({
  selector: 'app-product-card',
  template: `
    <app-reusable-card [title]="product.name">
      <div class="product-info">
        <p>Price: {{ product.price | currency }}</p>
        <p>Stock: {{ product.stock }}</p>
      </div>
    </app-reusable-card>
  `,
  standalone: true,
  imports: [ReusableCardComponent, CommonModule]
})
export class ProductCardComponent {
  @Input() product: Product;
}
```

**Benefits**:
- ✅ ReusableCardComponent is 20 lines
- ✅ UserCardComponent is 10 lines (clear responsibility)
- ✅ ProductCardComponent is 10 lines (clear responsibility)
- ✅ No inheritance hierarchy to maintain
- ✅ Easy to test each independently
- ✅ Easy to swap card styling without affecting content

---

#### Scenario: Service Base Class

```typescript
// BEFORE: Service inheritance
export class BaseDataService<T> {
  // 100 lines of generic logic
}

export class UserService extends BaseDataService<User> {
  // 20 lines specific to users
}

export class ProductService extends BaseDataService<Product> {
  // 20 lines specific to products
}

// AFTER: Generic service with composition

// data.service.ts (reusable generic service)
@Injectable()
export class DataService<T> {
  constructor(private http: HttpClient) {}

  fetch(url: string): Observable<T[]> {
    return this.http.get<T[]>(url);
  }

  create(url: string, data: T): Observable<T> {
    return this.http.post<T>(url, data);
  }
}

// user.service.ts (specific to users)
@Injectable()
export class UserService {
  constructor(private data: DataService<User>) {}

  getUsers(): Observable<User[]> {
    return this.data.fetch('/api/users');
  }

  createUser(user: User): Observable<User> {
    return this.data.create('/api/users', user);
  }
}

// product.service.ts (specific to products)
@Injectable()
export class ProductService {
  constructor(private data: DataService<Product>) {}

  getProducts(): Observable<Product[]> {
    return this.data.fetch('/api/products');
  }
}
```

---

### Pattern 3: Module Re-export Cleanup

(See MODULE-ARCHITECTURE-AUDIT.md for detailed approach)

```typescript
// BEFORE: Hidden dependencies via re-exports
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [CommonModule, FormsModule, PrimengModule]  // ← Problem
})
export class FrameworkModule { }

// AFTER: Only export what you declare
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [MyComponent, MyDirective, MyPipe]  // ← Only declared items
})
export class FrameworkModule { }

// Downstream modules must explicitly import what they need
@NgModule({
  imports: [FrameworkModule, CommonModule, FormsModule]  // ← Explicit
})
export class FeatureModule { }
```

---

## Implementation Strategy

### Phase 1: Audit (Week 1)

#### Step 1.1: Run All Detection Methods
```bash
# Build diagnostics
ng build --diagnostics 2>&1 | grep -i circular

# Madge analysis
madge --circular src/

# Custom audit
node scripts/audit-architecture.js

# Compodoc
npm run docs:gen && open dist/documentation/modules/
```

#### Step 1.2: Create Audit Report
```markdown
# Architecture Audit Report

## Circular Dependencies Found: 5
- user.service.ts ↔ company.service.ts
- feature-a.module.ts ↔ feature-b.module.ts
- [...]

## Component Inheritance: 12
- UserCardComponent extends BaseCardComponent
- ProductCardComponent extends BaseCardComponent
- [...]

## Module Re-exports: 3
- FrameworkModule re-exports CommonModule, FormsModule
- [...]
```

#### Step 1.3: Prioritize Issues
```
Priority 1: Circular dependencies (5 issues, risk: HIGH)
Priority 2: Component inheritance (12 issues, risk: MEDIUM)
Priority 3: Module re-exports (3 issues, risk: MEDIUM)
```

---

### Phase 2: Plan (Week 1-2)

#### Step 2.1: Categorize by Component/Module
```
UserModule circular deps (2 files, 1 hour)
FeatureAModule ↔ FeatureBModule (2 files, 2 hours)
CardComponent inheritance (4 files, 3 hours)
[...]
```

#### Step 2.2: Create Refactoring Plan
```
Week 2, Day 1: Fix UserModule circular deps
Week 2, Day 2: Fix FeatureA/B circular deps
Week 2, Day 3: Convert CardComponent hierarchy
Week 2, Day 4: Module re-export cleanup
Week 2, Day 5: Testing & verification
```

#### Step 2.3: Identify Testing Requirements
```
- Unit tests for UserService (no circular path)
- Unit tests for UserCardComponent (composition works)
- E2E tests for user feature flow
- Build verification (no warnings)
```

---

### Phase 3: Implement (Week 2-3)

#### For Each Issue:

1. **Branch Creation**
   ```bash
   git checkout -b refactor/fix-user-service-circular
   ```

2. **Refactoring**
   - Create facade/coordinator service
   - Update imports
   - Update tests
   - Verify build

3. **Testing**
   ```bash
   ng test --watch=false
   ng build --configuration development
   npm run test:e2e
   ```

4. **Code Review**
   - Pair review with team
   - Verify no regressions
   - Check performance

5. **Merge**
   ```bash
   git commit -m "refactor: break circular dependency in user.service"
   git push origin refactor/fix-user-service-circular
   # Create PR, review, merge
   ```

---

### Phase 4: Verify (Week 3-4)

#### Step 4.1: Re-run Detection
```bash
ng build --diagnostics  # Should show: 0 warnings
madge --circular src/   # Should show: 0 circular
npm run test:e2e        # Should show: 100% passing
```

#### Step 4.2: Performance Check
```bash
ng build --prod --stats-json
webpack-bundle-analyzer dist/stats.json

# Should see:
# - Smaller bundles
# - Better tree-shaking
# - Faster builds
```

#### Step 4.3: Documentation
```markdown
# Refactoring Summary

## What Changed
- Broke 5 circular dependencies
- Converted 12 components from inheritance to composition
- Cleaned up 3 module re-exports

## Files Modified
- src/services/user.service.ts
- src/services/company.service.ts
- src/services/user-company.coordinator.ts (new)
- src/components/card/ (4 files)
- [...]

## Verification Results
- ✅ Build: 0 warnings
- ✅ Circular deps: 0
- ✅ Tests: 100% passing
- ✅ Bundle size: -12%

## Learnings
- [Documentation of decisions for next session]
```

---

## Tools & Automation

### Tool 1: ESLint Restrictions

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        "patterns": [
          "src/**/index",  // Prevent barrel export over-use
          "**/*.module"    // Prevent importing modules in services
        ],
        "paths": [
          {
            "name": "user.service",
            "message": "Use UserFacade instead"
          }
        ]
      }
    ]
  }
}
```

---

### Tool 2: Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Running architecture checks..."

# Check for circular dependencies
madge --circular src/ && CIRCULAR=0 || CIRCULAR=1

# Check for component extends
grep -r "extends.*Component" src/ --include="*.ts" | grep -v "node_modules" && EXTENDS=1 || EXTENDS=0

# Check for module re-exports
node scripts/audit-architecture.js && AUDIT=0 || AUDIT=1

if [ $CIRCULAR -eq 0 ] && [ $EXTENDS -eq 0 ] && [ $AUDIT -eq 0 ]; then
  echo "✅ Architecture checks passed"
  exit 0
else
  echo "❌ Architecture violations found"
  exit 1
fi
```

---

### Tool 3: CI/CD Pipeline

```yaml
# .github/workflows/architecture-check.yml
name: Architecture Check

on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Check circular dependencies
        run: npx madge --circular src/

      - name: Check component inheritance
        run: npm run audit:architecture

      - name: Build with diagnostics
        run: ng build --diagnostics

      - name: Run tests
        run: npm run test:ci
```

---

### Tool 4: Automated Refactoring

```bash
#!/usr/bin/env node
// scripts/auto-fix-inheritance.js

/**
 * Automatically suggests and applies inheritance-to-composition fixes
 * WARNING: Review all changes before committing!
 */

const fs = require('fs');
const path = require('path');

function findComponentExtends() {
  // Find all: export class X extends Y
  // Where both have @Component decorator

  // Generate suggested fixes
  // Apply transformations
  // Create backup files
}

// Usage: node scripts/auto-fix-inheritance.js --dry-run
// Usage: node scripts/auto-fix-inheritance.js --apply
```

---

## Real-world Scenarios

### Scenario 1: Large Admin Dashboard

**Initial State**:
- 200+ components
- 50+ services
- 15 modules
- 8 circular dependencies (service-to-service)
- 30+ component inheritance chains
- 5 module re-exports

**Refactoring Approach**:
1. Create facade services for circular deps (3-4 new services)
2. Extract shared components (card, table, form, modal)
3. Replace inheritance with composition (batch refactoring)
4. Clean up module exports
5. Add ESLint rules to prevent regression

**Timeline**:
- Week 1: Audit, planning, setup automation
- Week 2-3: Implement phase 1 (services)
- Week 3-4: Implement phase 2 (components)
- Week 4-5: Testing, verification, polish

**Results**:
- Build size: -15%
- Build time: -20%
- Test suite: +10% coverage
- Developer velocity: +30% (clearer code)

---

### Scenario 2: Multi-tenant SaaS Platform

**Initial State**:
- Complex module interdependencies (tenant, admin, user features)
- Shared service across modules
- Base classes for standardization

**Refactoring Approach**:
1. Create shared module hierarchy (tenant-shared, admin-shared, user-shared)
2. Extract coordinator services
3. Break inheritance in favor of mixins or composition
4. Establish clear module boundaries

**Key Decision**:
```
OLD: TenantModule → UserModule → SharedModule
              ↓        ↓          ↑
     (imports UserModule, uses SharedModule)

NEW: TenantModule ──┐
                    ├─→ SharedModule
AdminModule ────────┤
                    │
UserModule ─────────┘

(One-way dependency: Features → Shared)
```

---

### Scenario 3: Evolving to Standalone Components

**Initial State**:
- NgModule-based architecture
- Heavy component inheritance (legacy pattern)
- Many barrel exports

**Migration Path**:
1. Keep NgModules for now
2. Convert reusable components to standalone
3. Replace inheritance with composition
4. Remove barrel exports gradually
5. Eventually: convert entire app to standalone

**Example**:
```typescript
// STEP 1: Convert CardComponent to standalone
@Component({
  selector: 'app-card',
  template: '...',
  standalone: true
})
export class CardComponent { }

// STEP 2: UserCardComponent uses standalone CardComponent
@Component({
  selector: 'app-user-card',
  template: '...',
  standalone: true,
  imports: [CardComponent]  // Direct import, no module
})
export class UserCardComponent { }

// STEP 3: Eventually all components are standalone
// STEP 4: Remove NgModules if desired
```

---

## Troubleshooting

### Issue: Circular Dependency "Too Obscure to Find"

```typescript
// File A imports File B
// File B imports File C
// File C imports File A (circular chain)

// Solution: Use madge to visualize
madge --image circular.png src/
// Shows visual chain of dependencies
```

---

### Issue: Inheritance Extends Deep Tree

```typescript
// BaseComponent
//   ↓ extends
// FormComponent
//   ↓ extends
// UserFormComponent
//   ↓ extends
// AdminUserFormComponent (5-level inheritance!)

// Solution: Flatten via composition
// AdminUserFormComponent uses FormComponent + UserFormComponent + BaseComponent
```

---

### Issue: Refactoring Breaks Tests

```typescript
// BEFORE:
export class UserCardComponent extends BaseCardComponent {
  // Inherits: toggleExpanded(), title, content properties
}

// AFTER:
export class UserCardComponent {
  constructor(private cardRef: ReusableCardComponent) {}
  // Must now use: this.cardRef.toggleExpanded(), etc.
}

// Fix: Update tests
// OLD: component.toggleExpanded()
// NEW: component.cardRef.toggleExpanded()
```

---

### Issue: Performance Degradation After Refactoring

```typescript
// Problem: Too many service instances
// OLD: 1 BaseDataService instance (shared inheritance)
// NEW: 3 DataService<T> instances (separate services)

// Solution: Add providedIn: 'root' to make singleton
@Injectable({ providedIn: 'root' })
export class DataService<T> { }

// Or share at module level:
@NgModule({
  providers: [DataService]  // Singleton for this module
})
```

---

## Quick Reference Checklist

### Before Refactoring
- [ ] Audit complete (run all detection tools)
- [ ] Issues categorized and prioritized
- [ ] Refactoring plan created
- [ ] Team agrees on approach
- [ ] Backup created (git branch)
- [ ] CI/CD green on main

### During Refactoring
- [ ] One issue per branch/commit
- [ ] Tests pass locally
- [ ] Build succeeds with no warnings
- [ ] Code review approved
- [ ] Performance verified (bundle size, build time)

### After Refactoring
- [ ] All tests passing
- [ ] Build successful with 0 warnings
- [ ] Circular deps: 0
- [ ] Component inheritance: 0 (or justified)
- [ ] Module re-exports: 0 (or justified)
- [ ] Performance maintained or improved
- [ ] Documentation updated

---

## Comparison: Before vs After

### Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Circular Deps | 8 | 0 | 100% |
| Component Classes | 230 | 220 | +10 less |
| Inheritance Chains | 15 | 0 | 100% |
| Module Re-exports | 5 | 0 | 100% |
| Build Size | 2.5 MB | 2.1 MB | -16% |
| Build Time | 45s | 36s | -20% |
| Test Pass Rate | 95% | 100% | +5% |
| Code Duplication | 12% | 8% | -4% |

---

## Summary: The 80/20 Rule

**80% of architectural problems come from:**
1. Circular dependencies (high impact)
2. Component inheritance misuse (high impact)
3. Module re-exports (medium impact)

**20% effort breaks 80% of problems**:
1. Create facade services (40% of effort, 30% of problems fixed)
2. Convert inheritance to composition (30% of effort, 40% of problems fixed)
3. Clean module exports (30% of effort, 30% of problems fixed)

**ROI**:
- 1-2 weeks effort
- 3-6 months of ongoing benefit
- Better: developer velocity, code clarity, build performance, test reliability

---

## References

- [Angular: Avoiding Circular Dependencies](https://angular.io/guide/dependency-injection-in-action#avoiding-circular-dependencies)
- [Angular: Component Interaction](https://angular.io/guide/component-interaction)
- [Martin Fowler: Composition Over Inheritance](https://martinfowler.com/articles/composition-vs-inheritance.html)
- [madge: Find and Visualize Circular Dependencies](https://github.com/pahen/madge)
- [Architectural Decision Records](https://adr.github.io/)
- [MODULE-ARCHITECTURE-AUDIT.md](./claude/MODULE-ARCHITECTURE-AUDIT.md)
- [ANGULAR-MODULE-GUIDELINES.md](./ANGULAR-MODULE-GUIDELINES.md)

---

**Last Updated**: 2025-12-18
**Status**: Production Ready
**Maintenance**: Update as new anti-patterns discovered
