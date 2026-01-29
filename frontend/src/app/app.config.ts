import { ErrorHandler, importProvidersFrom, Injector } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorInterceptor } from '../framework/services/http-error.interceptor';
import { MessageService } from 'primeng/api';

import { routes } from './app.routes';
import { GlobalErrorHandler } from '../framework/services/global-error.handler';
import { DOMAIN_CONFIG } from '../framework/services/domain-config-registry.service';
import { createAutomobileDomainConfig } from '../domain-config/automobile';

/**
 * Application Configuration (Standalone Bootstrap - Angular 14)
 *
 * Configures the Generic-Prime application using Angular 14 standalone APIs.
 *
 * Providers:
 * - RouterModule: Configures application routing
 * - HttpClientModule: Enables HTTP communication
 * - HTTP_INTERCEPTORS: Global HTTP error handling with HttpErrorInterceptor
 * - BrowserAnimationsModule: Enables Angular animations for PrimeNG
 * - MessageService: PrimeNG toast/message service
 * - GlobalErrorHandler: Application-wide error handling
 * - DOMAIN_CONFIG: Domain configuration factory for automobile domain
 */
export const appConfig = {
  providers: [
    importProvidersFrom(
      RouterModule.forRoot(routes),
      HttpClientModule,
      BrowserAnimationsModule
    ),
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
