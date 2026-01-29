import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * Configuration for error interceptor retry behavior
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;

  /**
   * HTTP status codes that should trigger a retry
   * Default: 5xx errors and 429 (too many requests)
   */
  retryableStatusCodes: number[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504]
};

/**
 * Get error code based on HTTP status
 */
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

/**
 * Extract error message from response
 */
function getErrorMessage(error: HttpErrorResponse): string {
  // Try to extract message from structured error response
  if (error.error?.error?.message) {
    return error.error.error.message;
  }

  // Try to extract message from simple error response
  if (error.error?.message) {
    return error.error.message;
  }

  // Fallback to generic messages based on status
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

/**
 * Log error details for debugging
 */
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

  // Log full error in development
  if (error.error) {
    console.error('Error details:', error.error);
  }
}

/**
 * Handle HTTP errors with appropriate logging and formatting
 */
function handleError(error: HttpErrorResponse, request: HttpRequest<unknown>) {
  let errorMessage: string;
  let errorCode: string;

  if (error.error instanceof ErrorEvent) {
    // Client-side or network error
    errorCode = 'CLIENT_ERROR';
    errorMessage = `Network error: ${error.error.message}`;
  } else {
    // Backend error
    errorCode = getErrorCode(error.status);
    errorMessage = getErrorMessage(error);
  }

  // Log error details
  logError(error, request, errorCode, errorMessage);

  // Return formatted error
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
 * HTTP error interceptor (Functional - Angular 17+)
 *
 * Handles global error processing for all HTTP requests:
 * - Automatic retry for transient errors (5xx, 429)
 * - Consistent error formatting
 * - Error logging
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { httpErrorInterceptor } from './framework/services/http-error.interceptor';
 *
 * provideHttpClient(withInterceptors([httpErrorInterceptor]))
 * ```
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const retryConfig = DEFAULT_RETRY_CONFIG;

  return next(request).pipe(
    // Retry on transient errors
    retry({
      count: retryConfig.maxRetries,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Only retry on specific status codes
        if (
          error instanceof HttpErrorResponse &&
          retryConfig.retryableStatusCodes.includes(error.status)
        ) {
          console.warn(
            `Retrying request (attempt ${retryCount + 1}/${
              retryConfig.maxRetries + 1
            }): ${request.method} ${request.url}`
          );
          return throwError(() => error);
        }
        // Don't retry - throw immediately
        throw error;
      }
    }),

    // Handle errors
    catchError((error: HttpErrorResponse) => {
      return handleError(error, request);
    })
  );
};
