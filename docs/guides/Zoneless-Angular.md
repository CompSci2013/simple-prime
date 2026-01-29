As of late 2025, the Angular ecosystem has reached a major milestone
with the release of **Angular 21**, which serves as the definitive
version for these two features.

Here is the breakdown of the specific versions where these capabilities
transitioned from experimental \"Developer Preview\" to \"Stable\" and
\"Default\" status.

## **1. Zoneless Change Detection**

Zoneless is the architectural shift that removes the dependency on
zone.js, making applications faster and more predictable by only running
change detection when explicitly triggered (usually by Signals).

-   **Earliest Experimental Support (v18.0):** Angular 18 introduced the
    provideExperimentalZonelessChangeDetection() provider. It was
    intended for early testing and not recommended for critical
    production systems.

-   **Stability Reached (v20.2):** This is the version where the
    Zoneless API was officially promoted to **Stable**. The naming
    shifted from \"Experimental\" to a standard stable provider.

-   **The \"Zoneless Default\" (v21.0):** Starting with Angular 21, all
    new projects created via the Angular CLI (ng new) are **zoneless by
    default**. You no longer need to manually add the provider; it is
    the framework\'s baseline configuration.

## **2. Signal Forms**

This is perhaps the most anticipated change for enterprise developers,
moving away from the heavy boilerplate of Reactive Forms to a
composable, signal-driven model.

-   **Earliest Support (v21.0):** Angular 21 is the first version to
    officially include **Signal Forms**.

-   **Status:** While included in v21, they are currently in
    **Experimental/Developer Preview**.

-   **Key Features:** It introduces new directives like \[field\] and
    concepts like FieldTree and FieldState.

    -   *Note:* Because it is experimental in v21, the API might see
        small \"breaking\" refinements in v22, but this is the version
        where you can begin building with it.

## **Summary Table**

  ------------------------------------------------------------------------------
  **Feature**    **Experimental**   **Stable**            **Default for New
                                                          Projects**
  -------------- ------------------ --------------------- ----------------------
  **Zoneless     v18.0              v20.2                 **v21.0**
  Mode**                                                  

  **Signal       **v21.0**          TBD (Estimated        N/A
  Forms**                           v22/v23)              
  ------------------------------------------------------------------------------
