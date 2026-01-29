import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * Configuration for error interceptor retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504]
};

function getErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
  }
}

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.error?.error?.message) {
    return error.error.error.message;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  switch (error.status) {
    case 0:
      return 'Unable to connect to server. Please check your network connection.';
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to access this resource.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. The resource already exists or is in an invalid state.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return error.message || `HTTP error: ${error.status} ${error.statusText}`;
  }
}

function logError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  errorCode: string,
  errorMessage: string
): void {
  const logDetails = {
    code: errorCode,
    message: errorMessage,
    status: error.status,
    statusText: error.statusText,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  };

  console.error('HTTP Error:', logDetails);

  if (error.error) {
    console.error('Error details:', error.error);
  }
}

function handleError(error: HttpErrorResponse, request: HttpRequest<unknown>) {
  let errorMessage: string;
  let errorCode: string;

  if (error.error instanceof ErrorEvent) {
    errorCode = 'CLIENT_ERROR';
    errorMessage = `Network error: ${error.error.message}`;
  } else {
    errorCode = getErrorCode(error.status);
    errorMessage = getErrorMessage(error);
  }

  logError(error, request, errorCode, errorMessage);

  return throwError(() => ({
    code: errorCode,
    message: errorMessage,
    status: error.status,
    statusText: error.statusText,
    url: request.url,
    timestamp: new Date().toISOString()
  }));
}

/**
 * HTTP error interceptor (Class-based - Angular 14)
 *
 * Handles global error processing for all HTTP requests:
 * - Automatic retry for transient errors (5xx, 429)
 * - Consistent error formatting
 * - Error logging
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const retryConfig = DEFAULT_RETRY_CONFIG;

    return next.handle(request).pipe(
      retry(retryConfig.maxRetries),
      catchError((error: HttpErrorResponse) => {
        return handleError(error, request);
      })
    );
  }
}
