# Angular Refactoring: Quick Reference Guide

**For**: Developers actively refactoring mid-sized Angular apps
**Use with**: ANGULAR-REFACTORING-GUIDE.md (comprehensive version)

---

## The 5 Anti-patterns & Quick Fixes

### 1️⃣ Circular Dependencies (File-Level)

**Detect**:
```bash
madge --circular src/
# Output: user.service.ts -> company.service.ts -> user.service.ts
```

**Fix Template**:
```typescript
// OLD: Both import each other
// user.service.ts imports CompanyService
// company.service.ts imports UserService

// NEW: Extract coordinator
@Injectable()
export class UserCompanyCoordinator {  // ← NEW
  constructor(user: UserService, company: CompanyService) {}

  getCompanyUser(id) {
    return this.user.getUser(id)
      .pipe(switchMap(user => this.company.getCompanyById(user.companyId)));
  }
}
```

**Time**: 30 minutes per dependency

---

### 2️⃣ Component Inheritance (Wrong Pattern)

**Detect**:
```bash
grep -r "extends.*Component" src/ --include="*.ts" | head -20

# Output:
# user-card.component.ts: export class UserCardComponent extends BaseCardComponent
# product-card.component.ts: export class ProductCardComponent extends BaseCardComponent
```

**Fix Template**:
```typescript
// OLD: Inheritance
export class UserCardComponent extends BaseCardComponent {
  @Input() user: User;
}

// NEW: Composition
@Component({
  template: `
    <app-card [title]="'User: ' + user.name">
      <p>{{ user.email }}</p>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent]
})
export class UserCardComponent {
  @Input() user: User;
}
```

**Time**: 15 minutes per component

---

### 3️⃣ Module Re-exports (Hidden Dependencies)

**Detect**:
```bash
node scripts/check-module-reexports.js src/

# Output:
# framework.module.ts: Re-exports CommonModule, FormsModule, PrimengModule
```

**Fix Template**:
```typescript
// OLD: Re-exports everything
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [CommonModule, FormsModule, PrimengModule]  // ← Problem
})
export class FrameworkModule { }

// NEW: Only export what you declare
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [MyComponent, MyDirective]  // ← Only declared
})
export class FrameworkModule { }
```

**Time**: 5 minutes per module

---

### 4️⃣ Service-to-Service Circular

**Detect**:
```bash
# Check for bidirectional imports
grep -l "import.*CompanyService" src/services/user.service.ts
grep -l "import.*UserService" src/services/company.service.ts
# Both? Circular!
```

**Fix**:
Create **Facade/Coordinator Service** (see Template #1 above)

**Time**: 30 minutes

---

### 5️⃣ Module-to-Module Circular

**Detect**:
```bash
# Does FeatureA import FeatureB?
grep "FeatureBModule" src/feature-a/feature-a.module.ts
# Does FeatureB import FeatureA?
grep "FeatureAModule" src/feature-b/feature-b.module.ts
# Both? Circular!
```

**Fix**:
Extract **Shared Module** between them

```typescript
// shared.module.ts
@NgModule({
  declarations: [SharedHeaderComponent],
  exports: [SharedHeaderComponent]
})
export class SharedModule { }

// feature-a.module.ts
@NgModule({
  imports: [SharedModule]  // ← Not FeatureBModule
})
export class FeatureAModule { }

// feature-b.module.ts
@NgModule({
  imports: [SharedModule]  // ← Not FeatureAModule
})
export class FeatureBModule { }
```

**Time**: 45 minutes

---

## One-Page Decision Tree

```
Does your app have architecture issues?
│
├─ Build warnings about circular deps?
│  └─ YES → Run: madge --circular src/
│           Fix: Extract Coordinator Service (30 min)
│
├─ Components extending other components?
│  └─ YES → Convert to Composition (15 min each)
│
├─ Modules re-exporting other modules?
│  └─ YES → Remove re-exports (5 min each)
│
├─ Services importing each other bidirectionally?
│  └─ YES → Extract Facade Service (30 min)
│
└─ Modules importing each other bidirectionally?
   └─ YES → Extract Shared Module (45 min)
```

---

## Refactoring Checklist (Per Issue)

### For Each Circular Dependency

- [ ] **1. Create Issue Ticket**
  - Title: "Break circular: X.service ↔ Y.service"
  - Description: What are the two imports?

- [ ] **2. Create Branch**
  ```bash
  git checkout -b refactor/break-circular-x-y
  ```

- [ ] **3. Analyze Dependency**
  - Why do A and B import each other?
  - What's the shared concern?
  - Where should coordination happen?

- [ ] **4. Create Coordinator/Facade**
  ```typescript
  // New file: x-y.coordinator.ts
  @Injectable()
  export class XYCoordinator {
    constructor(private x: XService, private y: YService) {}
    // Coordination logic here
  }
  ```

- [ ] **5. Update Original Services**
  - Remove import of other service
  - Remove methods that call other service
  - Make sure tests still pass

- [ ] **6. Update All Consumers**
  - Find: `constructor(x: XService, y: YService) {}`
  - Replace with: `constructor(coordinator: XYCoordinator) {}`

- [ ] **7. Test**
  ```bash
  npm run test:ci
  ng build --configuration development
  ng build --prod
  ```

- [ ] **8. Verify Fix**
  ```bash
  madge --circular src/ | grep -i "x.service\|y.service"
  # Should show: 0 results
  ```

- [ ] **9. Code Review**
  - Pair review with team
  - Verify no performance regression
  - Approve for merge

- [ ] **10. Merge**
  ```bash
  git commit -m "refactor: break circular dependency between X and Y services"
  git push && create PR && merge
  ```

---

## Before/After Templates

### Template A: Service Circular → Facade

**BEFORE** (Circular):
```typescript
// user.service.ts
export class UserService {
  constructor(private company: CompanyService) {}  // ← Imports CompanyService

  getUser(id) {
    return this.company.getCompanyUser(id);  // ← Uses CompanyService
  }
}

// company.service.ts
export class CompanyService {
  constructor(private user: UserService) {}  // ← Imports UserService (CIRCULAR!)

  getCompanyUser(id) {
    return this.user.getUser(id);  // ← Uses UserService
  }
}
```

**AFTER** (Fixed):
```typescript
// user.service.ts (no imports from company.service)
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id) {
    return this.http.get(`/api/users/${id}`);
  }
}

// company.service.ts (no imports from user.service)
export class CompanyService {
  constructor(private http: HttpClient) {}

  getCompanyById(id) {
    return this.http.get(`/api/companies/${id}`);
  }
}

// user-company.coordinator.ts (NEW - coordinates both)
@Injectable()
export class UserCompanyCoordinator {
  constructor(
    private user: UserService,
    private company: CompanyService
  ) {}

  getCompanyUser(id) {
    return this.user.getUser(id)
      .pipe(
        switchMap(user =>
          this.company.getCompanyById(user.companyId)
            .pipe(
              map(company => ({ user, company }))
            )
        )
      );
  }
}
```

---

### Template B: Component Inheritance → Composition

**BEFORE** (Inheritance):
```typescript
// base-card.component.ts
@Component({
  template: `<div class="card"><ng-content></ng-content></div>`
})
export class BaseCardComponent {
  @Input() title: string;
}

// user-card.component.ts
@Component({
  template: `<div [title]="user.name">...</div>`
})
export class UserCardComponent extends BaseCardComponent {  // ← EXTENDS
  @Input() user: User;
}

// product-card.component.ts
@Component({
  template: `<div [title]="product.name">...</div>`
})
export class ProductCardComponent extends BaseCardComponent {  // ← EXTENDS
  @Input() product: Product;
}
```

**AFTER** (Composition):
```typescript
// card.component.ts (reusable)
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-title" *ngIf="title">{{ title }}</div>
      <ng-content></ng-content>
    </div>
  `,
  standalone: true
})
export class CardComponent {
  @Input() title: string;
}

// user-card.component.ts (uses card)
@Component({
  selector: 'app-user-card',
  template: `
    <app-card [title]="user.name">
      <p>{{ user.email }}</p>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent]
})
export class UserCardComponent {
  @Input() user: User;
}

// product-card.component.ts (uses card)
@Component({
  selector: 'app-product-card',
  template: `
    <app-card [title]="product.name">
      <p>{{ product.price | currency }}</p>
    </app-card>
  `,
  standalone: true,
  imports: [CardComponent]
})
export class ProductCardComponent {
  @Input() product: Product;
}
```

---

### Template C: Module Re-export → Clean Exports

**BEFORE** (Re-exports):
```typescript
// framework.module.ts
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [CommonModule, FormsModule, PrimengModule]  // ← Re-exports all
})
export class FrameworkModule { }

// feature.module.ts (hidden dependency)
@NgModule({
  imports: [FrameworkModule]  // ← Gets PrimengModule for free
})
export class FeatureModule { }

// feature.component.ts
@Component({
  template: `<p-button>Click</p-button>`  // ← Uses PrimeNG without knowing it
})
export class FeatureComponent { }
```

**AFTER** (Clean):
```typescript
// framework.module.ts
@NgModule({
  imports: [CommonModule, FormsModule, PrimengModule],
  exports: [MyComponent]  // ← Only declares
})
export class FrameworkModule { }

// feature.module.ts (explicit dependency)
@NgModule({
  imports: [FrameworkModule, PrimengModule]  // ← Explicit: I use PrimengModule
})
export class FeatureModule { }

// feature.component.ts
@Component({
  template: `<p-button>Click</p-button>`  // ← Clear: FeatureModule imports PrimengModule
})
export class FeatureComponent { }
```

---

## Command Reference

### Find Issues
```bash
# Circular dependencies
madge --circular src/

# Component inheritance
grep -r "extends.*Component" src/ --include="*.ts"

# Module re-exports
node scripts/check-module-reexports.js src/

# Unused imports
depcheck src/

# All diagnostics
ng build --diagnostics
```

### Fix Issues
```bash
# Build test
ng build --configuration development

# Unit tests
npm run test:ci

# E2E tests
npm run test:e2e

# Verify no circular
madge --circular src/ && echo "✅ No circular deps"
```

### Review Changes
```bash
# Show diff
git diff

# Show affected files
git diff --name-only

# Show summary
git diff --stat
```

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Removing import without updating code | Build fails | Search for usage first |
| Not testing after fix | Breaks in prod | Run full test suite |
| Creating too many new files | Complexity increases | Batch related fixes |
| Coordinator becomes too complex | New circular risk | Extract sub-coordinators |
| Component inheritance still used | Anti-pattern persists | Code review checklist |
| Module re-exports return | Hidden deps return | ESLint rule (no re-exports) |

---

## Estimated Effort

| Issue Type | Quantity | Time/Each | Total |
|------------|----------|-----------|-------|
| Circular Service | 5 | 30 min | 2.5 hrs |
| Component Inheritance | 12 | 15 min | 3 hrs |
| Module Re-export | 3 | 5 min | 15 min |
| Circular Module | 2 | 45 min | 1.5 hrs |
| Testing & Verification | - | - | 2 hrs |
| **TOTAL** | - | - | **9.5 hours** |

**Typical**: 1-2 weeks (1-2 hours/day dedicated)

---

## Success Metrics

After refactoring, verify:

```bash
# 1. No circular dependencies
madge --circular src/ | wc -l  # Should be: 0

# 2. No component inheritance (grep for "extends.*Component")
grep -r "extends.*Component" src/ --include="*.ts" | wc -l  # Should be: 0

# 3. No module re-exports
node scripts/check-module-reexports.js src/  # Should pass: 0 violations

# 4. Build clean
ng build --diagnostics 2>&1 | grep -i "error\|warning" | wc -l  # Should be: 0

# 5. Tests pass
npm run test:ci 2>&1 | tail -1  # Should show: PASSED

# 6. Performance maintained
ng build --prod --stats-json
# Compare bundle sizes: should be same or smaller
```

---

## When to Stop

✅ Stop refactoring when:
- Build: 0 warnings
- Tests: 100% passing
- Circular deps: 0
- Component extends Component: 0
- Module re-exports: 0

❌ Don't over-refactor:
- Inheritance is fine if justified (rare: 1-2% of classes)
- Some component composition is OK if single-use
- Facades are OK if used consistently

---

## Resources

- **Full Guide**: ANGULAR-REFACTORING-GUIDE.md
- **Module Guidelines**: ANGULAR-MODULE-GUIDELINES.md
- **Module Audit**: MODULE-ARCHITECTURE-AUDIT.md
- **madge**: https://github.com/pahen/madge
- **Composition vs Inheritance**: https://martinfowler.com/articles/composition-vs-inheritance.html

---

**Print this page for your desk!** 📋

Use as reference while refactoring. For detailed explanations, see ANGULAR-REFACTORING-GUIDE.md.
