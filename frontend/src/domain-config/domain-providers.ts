import { Provider } from '@angular/core';
import { DOMAIN_PROVIDER as automobileDomainProvider } from './automobile';

/**
 * Array of all domain configuration providers.
 *
 * Each domain should export a `DOMAIN_PROVIDER` that can be added to this array.
 * This allows for dynamic registration of domains at application startup.
 *
 * @example
 * ```typescript
 * // Add a new domain
 * import { DOMAIN_PROVIDER as newDomainProvider } from './new-domain';
 *
 * export const DOMAIN_PROVIDERS: Provider[] = [
 *  automobileDomainProvider,
 *  newDomainProvider
 * ];
 * ```
 */
export const DOMAIN_PROVIDERS: Provider[] = [
  automobileDomainProvider,
];
