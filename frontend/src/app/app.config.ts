import { ErrorHandler, Injector } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpErrorInterceptor } from '../framework/services/http-error.interceptor';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { GlobalErrorHandler } from '../framework/services/global-error.handler';
import { DOMAIN_CONFIG } from '../framework/services/domain-config-registry.service';
import { createAutomobileDomainConfig } from '../domain-config/automobile';

/**
 * Application Configuration (Standalone Bootstrap - Angular 15)
 *
 * Configures the Generic-Prime application using Angular 15 standalone APIs.
 *
 * Providers:
 * - provideRouter: Configures application routing with standalone API
 * - provideHttpClient: Enables HTTP communication with interceptor support
 * - provideAnimations: Enables Angular animations for PrimeNG
 * - HTTP_INTERCEPTORS: Global HTTP error handling with HttpErrorInterceptor
 * - MessageService: PrimeNG toast/message service
 * - GlobalErrorHandler: Application-wide error handling
 * - DOMAIN_CONFIG: Domain configuration factory for automobile domain
 */
export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
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
