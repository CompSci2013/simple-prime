import { ErrorHandler, Injector } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from '../framework/services/http-error.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

import { routes } from './app.routes';
import { GlobalErrorHandler } from '../framework/services/global-error.handler';
import { DOMAIN_CONFIG } from '../framework/services/domain-config-registry.service';
import { createAutomobileDomainConfig } from '../domain-config/automobile';

/**
 * Application Configuration (Standalone Bootstrap)
 *
 * Configures the Generic-Prime application using Angular 21+ standalone APIs.
 *
 * Angular 21 Updates:
 * - provideAnimationsAsync: Deprecated in Angular 20.2, will be removed in v23.
 *   PrimeNG 21 uses CSS-based animations but still requires this for compatibility.
 * - providePrimeNG: PrimeNG 21 theme configuration with design tokens
 * - Lara theme from @primeuix/themes (PrimeNG unified theming)
 *
 * Providers:
 * - provideRouter: Configures application routing
 * - provideHttpClient: Enables HTTP communication with error interceptor
 * - httpErrorInterceptor: Global HTTP error handling with retries
 * - provideAnimationsAsync: Enables async Angular animations for PrimeNG
 * - providePrimeNG: Configures PrimeNG 21 theming
 * - MessageService: PrimeNG toast/message service
 * - GlobalErrorHandler: Application-wide error handling
 * - DOMAIN_CONFIG: Domain configuration factory for automobile domain
 */
export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: '.p-dark'
        }
      },
      ripple: true
    }),
    MessageService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: DOMAIN_CONFIG,
      useFactory: createAutomobileDomainConfig,
      deps: [Injector]
    }
  ]
};
