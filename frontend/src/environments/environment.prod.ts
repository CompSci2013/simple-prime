/**
 * Production Environment Configuration
 *
 * @fileoverview
 * Environment configuration for production builds. This file defines runtime settings
 * for the application when deployed to production (Kubernetes, cloud, etc.).
 *
 * @remarks
 * **Build-Time Usage**:
 * This file is automatically used when building with the production configuration:
 * ```bash
 * ng build --configuration production
 * ```
 *
 * The build system uses the `fileReplacements` array in angular.json to automatically
 * replace environment.ts (development) with this file during the production build process.
 *
 * **Configuration Details**:
 * - `production`: true - Enables production optimizations and disables debugging
 * - `apiBaseUrl`: Production backend endpoint (identical to development for convenience)
 * - `includeTestIds`: false - Strips test-id attributes to reduce HTML output
 *
 * **Backend Access**:
 * The API endpoint (http://generic-prime.minilab/api/specs/v1) is identical to development
 * because all requests route through the Kubernetes Traefik ingress controller on Loki,
 * regardless of where the frontend is deployed (development server or Kubernetes).
 *
 * **Test Attributes**:
 * In production builds, all [attr.data-testid] attributes are stripped by Angular's build
 * optimizer because includeTestIds is false. This reduces the final HTML output size
 * and prevents test-specific attributes from leaking into production.
 *
 * **Angular Optimizations**:
 * When production is true, Angular CLI applies:
 * - AoT (Ahead-of-Time) compilation
 * - Minification and code obfuscation
 * - Tree-shaking of unused code
 * - Splitting into multiple bundles
 * - Optimization of bundle size
 *
 * @see environment.ts - Development environment configuration
 * @see angular.json - Build configuration with fileReplacements array
 * @see ORIENTATION.md - Infrastructure and network configuration
 *
 * @version 1.0
 * @since 1.0.0
 */

/**
 * Environment object containing runtime configuration for production
 *
 * @type {Object}
 * @property {boolean} production - Whether running in production mode (true for production builds)
 * @property {string} apiBaseUrl - Base URL for backend API calls
 * @property {boolean} includeTestIds - Enable test-id attributes (false in production)
 */
export const environment = {
  /** Production mode flag - enables optimizations and disables debugging */
  production: true,

  /**
   * Backend API endpoint for production
   *
   * URL pattern: http://generic-prime.minilab/api/specs/v1
   *
   * **Important**: This is IDENTICAL to the development endpoint because:
   * - All requests route through Kubernetes Traefik ingress on Loki (192.168.0.110)
   * - The frontend can be deployed anywhere (dev container, Kubernetes, cloud)
   * - Traefik handles routing to backend pods regardless of frontend location
   * - Single hostname simplifies configuration and deployment
   *
   * Traefik routing:
   * - Hostname: generic-prime.minilab (maps to Loki control plane)
   * - Route /api/* → generic-prime-backend-api service (port 3000)
   * - Route / → generic-prime-frontend service (port 80)
   *
   * This unified endpoint strategy works for:
   * - Development (ng serve on port 4205)
   * - Production (Kubernetes deployed on Loki or Thor)
   * - E2E tests (Playwright container)
   * - Windows client (with /etc/hosts entry)
   */
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',

  /**
   * E2E test attribute flag for production
   *
   * Set to false in production to:
   * - Remove all [attr.data-testid] attributes from HTML
   * - Reduce final bundle size (smaller HTML output)
   * - Prevent test infrastructure from leaking to production
   * - Comply with security best practices (don't expose test hooks)
   *
   * Angular's build optimizer automatically strips test-id attributes when
   * this flag is false, reducing HTML output without code changes.
   *
   * Production build process:
   * 1. Angular CLI detects production: true
   * 2. Applies AoT compilation and optimizations
   * 3. Strips [attr.data-testid] conditionals where includeTestIds is false
   * 4. Minifies and optimizes all code
   * 5. Outputs optimized production bundle
   */
  includeTestIds: false
};
