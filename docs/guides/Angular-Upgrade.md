## **1. The Upgrade Integrity Rubric**

This rubric defines what constitutes a \"High Quality\" migration. An
upgrade that fails these criteria results in \"Zombie Code\"---code that
technically runs but is architecturally dead.

  -----------------------------------------------------------------------------
  **Criterion**     **High Quality          **Low Quality (Technical Debt)**
                    (Architectural          
                    Mastery)**              
  ----------------- ----------------------- -----------------------------------
  **Reactivity**    Transitions to          Still relies on zone.js and manual
                    **Signals** for state;  ChangeDetectorRef.markForCheck().
                    logic is \"Zoneless\"   
                    ready.                  

  **Dependency      Extensive use of the    Relying heavily on Constructor
  Injection**       inject() function;      Injection (limits utility
                    logic is functional.    functions).

  **Structural      Standalone-only; zero   Using \"SCAMs\" (Single Component
  Integrity**       NgModules.              Angular Modules) as a halfway
                                            house.

  **Testability**   Native **Vitest**       Legacy Karma/Jasmine setup or a
                    integration with ESM    custom, brittle Jest configuration.
                    support.                
  -----------------------------------------------------------------------------

## **2. The Version-by-Version Migration Checklist**

### **Phase 1: The Standalone Pivot (v13 → v15)**

-   **Action:** Run ng generate \@angular/core:standalone.

-   **Pitfall - The \"SharedModule\" Trap:** Do not just keep your
    SharedModule and make it standalone. **Mistake:** Assuming
    standalone just means adding standalone: true. **Failure:** If you
    don\'t delete the actual NgModule files, you miss out on
    tree-shaking and create a \"dependency soup\" where every component
    still loads the world.

### **Phase 2: The Reactivity Pivot (v16 → v18)**

-   **Action:** Replace BehaviorSubject with signal(). Use \@if and
    \@for block syntax.

-   **Pitfall - Signal Wrapping:** Do not wrap a FormGroup inside a
    Signal to make it \"reactive.\" **Mistake:** form = signal(new
    FormGroup(\...)). **Failure:** This doesn\'t actually make the
    form\'s internal values reactive; you\'re just putting a
    non-reactive object inside a reactive container. Use the v21 form()
    API instead.

-   **Action:** Adopt takeUntilDestroyed(). Stop managing manual
    destroy\$ subjects.

### **Phase 3: The Infrastructure Pivot (v19 → v21)**

-   **Action:** Enable provideZonelessChangeDetection().

-   **Pitfall - The \"Safe\" Hybrid Mode:** Many teams keep zone.js
    \"just in case.\" **Mistake:** Keeping zone.js while using Signals.
    **Failure:** You pay the 30KB bundle tax and the performance
    overhead of Zone\'s global monkey-patching, negating the primary
    benefit of the v21 engine.

-   **Action:** Migrate from **Karma/Jasmine to Vitest**.

    -   *Warning:* If you previously migrated to **Jest**, you are in a
        \"Dead End.\" Angular 21\'s default and most optimized path is
        Vitest.

## **3. Critical \"Dead Ends\" to Avoid**

### **The \"Reactive Forms\" Dead End**

For 10 years, ReactiveFormsModule was the gold standard.

-   **The Mistake:** Spending significant effort in 2024/2025 strictly
    typing your FormGroup and FormControl definitions.

-   **Why it\'s a Dead End:** In Angular 21, **Signal Forms**
    (experimental but stable-tracked) are a complete departure. They use
    a **model-first** approach rather than a control-first approach.

-   **The Better Way:** If you are on v13-v19, keep your forms simple.
    Don\'t build elaborate custom \"Typed Form\" wrappers. Wait to
    migrate directly to form(model) in v21.

### **The \"Karma-to-Jest\" Detour**

-   **The Mistake:** Moving your test suite to Jest because Karma was
    deprecated in v15.

-   **Why it\'s a Dead End:** Jest struggles with Angular\'s move to
    native ESM (ES Modules).

-   **The Better Way:** Move directly to **Vitest**. It uses the same
    Vite-based engine as the Angular dev server, meaning your tests run
    in the exact same environment as your app.

## **4. Summary of Failures to Adopt**

The most dangerous mistake in a large Angular app is **\"Legacy
Sentimentality\"**:

1.  **Keeping NgModules:** \"It still works, so why change it?\" Result:
    Your app remains incompatible with modern tools like **AnalogJS** or
    advanced **Vite** optimizations.

2.  **Using \*ngIf over \@if:** \"The directive is still supported.\"
    Result: You lose the performance benefits of the new control flow
    which is significantly faster and allows for better type inference.

3.  **Ignoring the inject() function:** Result: You cannot use
    \"Functional Providers\" or \"Component Stores\" effectively, as
    they rely on the injection context.
