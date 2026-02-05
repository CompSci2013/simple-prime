/**
 * Agriculture Domain - Barrel Exports
 *
 * Public API for the Agriculture domain configuration.
 * This domain demonstrates NgModule pattern (Angular 13 style)
 * with the Generic Discovery Framework.
 */

// Models (must be exported first - other modules depend on these)
export * from './models';

// Adapters
export * from './adapters';

// UI Configurations
export * from './configs';

// Chart Data Sources
export * from './chart-sources';

// Domain Configuration (must be last - depends on all above)
export * from './agriculture.domain-config';
