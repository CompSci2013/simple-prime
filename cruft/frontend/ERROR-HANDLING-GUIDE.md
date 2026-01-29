# Error Handling System (F9)

Comprehensive error handling and notification system using PrimeNG Toast for user-facing messages.

---

## Overview

The error handling system provides:

- **GlobalErrorHandler**: Catches all unhandled errors
- **ErrorNotificationService**: Displays user-friendly error messages
- **Error Categorization**: Classifies errors by type
- **Deduplication**: Prevents duplicate error messages
- **PrimeNG Toast Integration**: Beautiful, consistent notifications

---

## Architecture

### Components

1. **ErrorNotification Interface** ([error-notification.interface.ts](../models/error-notification.interface.ts))
   - Error categorization (NETWORK, VALIDATION, AUTHORIZATION, etc.)
   - Severity levels (error, warn, info, success)
   - Error notification data structure

2. **ErrorNotificationService** ([error-notification.service.ts](./error-notification.service.ts))
   - Display toast notifications
   - Error deduplication (3-second window)
   - Categorization and formatting
   - Console logging

3. **GlobalErrorHandler** ([global-error.handler.ts](./global-error.handler.ts))
   - Angular ErrorHandler implementation
   - Catches all unhandled errors
   - Routes errors to ErrorNotificationService

4. **HttpErrorInterceptor** (Already exists from F2)
   - Intercepts HTTP errors
   - Automatic retry for transient errors
   - Consistent error formatting

---

## Setup

The error handling system is **already configured** in `app.module.ts`:

```typescript
import { NgModule, ErrorHandler } from '@angular/core';
import { MessageService } from 'primeng/api';
import { GlobalErrorHandler } from '../framework/services/global-error.handler';

@NgModule({
  providers: [
    MessageService,                    // Required for PrimeNG Toast
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler     // Global error handler
    }
  ]
})
export class AppModule { }
```

Add Toast component to **app.component.html**:

```html
<!-- Global Toast Notifications -->
<p-toast key="app-toast" position="top-right"></p-toast>

<router-outlet></router-outlet>
```

---

## Usage

### 1. Display Custom Errors

```typescript
import { ErrorNotificationService } from '@/framework/services/error-notification.service';

export class MyComponent {
  constructor(private errorNotification: ErrorNotificationService) {}

  onSave(): void {
    if (!this.isValid()) {
      this.errorNotification.showError(
        'Validation Failed',
        'Please fill in all required fields.'
      );
      return;
    }

    // Save logic...
  }
}
```

### 2. Display Success Messages

```typescript
onSaveSuccess(): void {
  this.errorNotification.showSuccess(
    'Saved',
    'Your changes have been saved successfully.'
  );
}
```

### 3. Display Warnings

```typescript
onDataModified(): void {
  this.errorNotification.showWarning(
    'Data Modified',
    'Some fields were automatically corrected.'
  );
}
```

### 4. Display Info Messages

```typescript
onProcessing(): void {
  this.errorNotification.showInfo(
    'Processing',
    'Your request is being processed. This may take a few moments.'
  );
}
```

### 5. Handle HTTP Errors

HTTP errors are **automatically caught** by the interceptor, but you can manually display them:

```typescript
this.apiService.get<Vehicle[]>('/api/vehicles').subscribe({
  next: (vehicles) => {
    this.data = vehicles;
  },
  error: (error) => {
    // Error is already formatted by interceptor
    this.errorNotification.showHttpError(error);
  }
});
```

### 6. Handle Generic Errors

```typescript
try {
  this.processData();
} catch (error) {
  this.errorNotification.showGenericError(error as Error);
}
```

### 7. Custom Display Options

```typescript
this.errorNotification.show(
  {
    category: ErrorCategory.APPLICATION,
    severity: 'error',
    summary: 'Critical Error',
    detail: 'A critical error occurred. Please contact support.',
    timestamp: new Date().toISOString()
  },
  {
    sticky: true,      // Don't auto-hide
    life: 0,           // Infinite duration
    closable: true     // Show close button
  }
);
```

---

## Error Categories

Errors are automatically categorized:

```typescript
enum ErrorCategory {
  NETWORK       // Connection errors, timeouts
  VALIDATION    // Invalid input, business rules
  AUTHORIZATION // 401, 403 errors
  SERVER        // 5xx errors
  CLIENT        // JavaScript errors
  APPLICATION   // Business logic errors
  UNKNOWN       // Uncategorized
}
```

**Automatic Categorization**:
- HTTP status codes → `ErrorCategory` (via `getErrorCategoryFromStatus`)
- Error codes → `ErrorCategory` (via `getErrorCategoryFromCode`)

---

## Severity Levels

Maps to PrimeNG Toast severity:

```typescript
type ErrorSeverity = 'success' | 'info' | 'warn' | 'error';
```

**Default Mapping**:
```typescript
NETWORK       → 'error'
VALIDATION    → 'warn'
AUTHORIZATION → 'warn'
SERVER        → 'error'
CLIENT        → 'error'
APPLICATION   → 'error'
UNKNOWN       → 'error'
```

---

## Deduplication

Prevents showing the same error multiple times within a 3-second window.

**Signature**: `${category}:${summary}:${detail}`

```typescript
// First call - displays toast
this.errorNotification.showError('Save Failed', 'Network error');

// Second call within 3 seconds - suppressed
this.errorNotification.showError('Save Failed', 'Network error');

// After 3 seconds - displays again
setTimeout(() => {
  this.errorNotification.showError('Save Failed', 'Network error'); // Shows
}, 3500);
```

---

## Global Error Handling

The `GlobalErrorHandler` automatically catches:

1. **Unhandled HTTP Errors** (if not caught in subscriptions)
2. **Promise Rejections** (unhandled async errors)
3. **Component Errors** (TypeErrors, ReferenceErrors, etc.)
4. **Chunk Load Errors** (lazy-loaded module failures)

**Example - Automatic Handling**:

```typescript
// This error is automatically caught and displayed
throw new Error('Something went wrong!');

// This promise rejection is automatically caught
Promise.reject(new Error('Async error'));

// This HTTP error bubbles up and is caught
this.http.get('/api/data').subscribe(); // No error handler
```

---

## Display Options

```typescript
interface ErrorDisplayOptions {
  life?: number;        // Auto-hide duration (ms), default: 5000
  closable?: boolean;   // Show close button, default: true
  sticky?: boolean;     // Prevent auto-hide, default: false
  styleClass?: string;  // Custom CSS class
  key?: string;         // Toast key, default: 'app-toast'
}
```

**Examples**:

```typescript
// Auto-hide after 3 seconds
this.errorNotification.showError('Error', 'Message', { life: 3000 });

// Sticky (no auto-hide)
this.errorNotification.showError('Error', 'Message', { sticky: true });

// Custom CSS class
this.errorNotification.showError('Error', 'Message', {
  styleClass: 'custom-error-toast'
});
```

---

## Toast Positions

Available positions for PrimeNG Toast:

```html
<!-- Top positions -->
<p-toast position="top-left"></p-toast>
<p-toast position="top-center"></p-toast>
<p-toast position="top-right"></p-toast>  <!-- Default -->

<!-- Bottom positions -->
<p-toast position="bottom-left"></p-toast>
<p-toast position="bottom-center"></p-toast>
<p-toast position="bottom-right"></p-toast>

<!-- Center -->
<p-toast position="center"></p-toast>
```

---

## Clearing Toasts

```typescript
// Clear all toasts
this.errorNotification.clearAll();

// Clear toasts by key
this.errorNotification.clear('app-toast');
```

---

## HTTP Error Handling Flow

```
User Action
    ↓
HTTP Request
    ↓
HttpErrorInterceptor (F2)
    ├─ Retry (if 429, 5xx)
    └─ Format Error
        ↓
Component Error Handler (optional)
    ↓
GlobalErrorHandler (if uncaught)
    ↓
ErrorNotificationService
    ├─ Check Duplication
    ├─ Categorize
    ├─ Log to Console
    └─ Display Toast
```

---

## Error Logging

All errors are logged to console with structured data:

**Error Severity**:
```javascript
console.error('[Error Notification]', {
  category: 'NETWORK',
  severity: 'error',
  summary: 'Connection Error',
  detail: 'Unable to connect to server',
  code: 'NETWORK_ERROR',
  timestamp: '2025-11-20T12:00:00.000Z',
  url: '/api/vehicles',
  status: 0
});
```

**Warning Severity**:
```javascript
console.warn('[Warning Notification]', { ... });
```

**Info/Success Severity**:
```javascript
console.info('[Info Notification]', { ... });
console.log('[Success Notification]', { ... });
```

---

## Best Practices

### 1. Use Appropriate Severity

```typescript
// ❌ Wrong
this.errorNotification.showError('Data Saved', 'Success!');

// ✅ Correct
this.errorNotification.showSuccess('Data Saved', 'Your changes have been saved.');
```

### 2. Provide Actionable Messages

```typescript
// ❌ Vague
this.errorNotification.showError('Error', 'Something went wrong');

// ✅ Actionable
this.errorNotification.showError(
  'Save Failed',
  'Unable to save changes. Please check your internet connection and try again.'
);
```

### 3. Handle Expected Errors Gracefully

```typescript
// ❌ Let all errors bubble to GlobalErrorHandler
this.apiService.save(data).subscribe();

// ✅ Handle expected errors
this.apiService.save(data).subscribe({
  next: () => {
    this.errorNotification.showSuccess('Saved', 'Changes saved successfully.');
  },
  error: (error) => {
    if (error.status === 409) {
      this.errorNotification.showWarning(
        'Conflict',
        'This record was modified by another user. Please refresh and try again.'
      );
    } else {
      this.errorNotification.showHttpError(error);
    }
  }
});
```

### 4. Use Sticky for Critical Errors

```typescript
// Critical errors requiring user acknowledgment
this.errorNotification.show(
  {
    category: ErrorCategory.APPLICATION,
    severity: 'error',
    summary: 'Data Loss Warning',
    detail: 'Your session has expired. Unsaved changes will be lost.',
    timestamp: new Date().toISOString()
  },
  {
    sticky: true,
    life: 0
  }
);
```

### 5. Clear Toasts on Navigation

```typescript
export class MyComponent implements OnDestroy {
  constructor(private errorNotification: ErrorNotificationService) {}

  ngOnDestroy(): void {
    // Clear toasts when component is destroyed
    this.errorNotification.clearAll();
  }
}
```

---

## Testing

### Mocking ErrorNotificationService

```typescript
describe('MyComponent', () => {
  let errorNotificationSpy: jasmine.SpyObj<ErrorNotificationService>;

  beforeEach(() => {
    errorNotificationSpy = jasmine.createSpyObj('ErrorNotificationService', [
      'showError',
      'showSuccess',
      'showWarning',
      'showInfo'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorNotificationService, useValue: errorNotificationSpy }
      ]
    });
  });

  it('should show error on validation failure', () => {
    component.onSave();

    expect(errorNotificationSpy.showError).toHaveBeenCalledWith(
      'Validation Failed',
      'Please fill in all required fields.'
    );
  });
});
```

---

## Troubleshooting

### Toast Not Appearing

1. **Check MessageService registration**:
   ```typescript
   // In app.module.ts
   providers: [MessageService]
   ```

2. **Check Toast component in template**:
   ```html
   <!-- In app.component.html -->
   <p-toast key="app-toast"></p-toast>
   ```

3. **Check ToastModule import**:
   ```typescript
   // In primeng.module.ts
   import { ToastModule } from 'primeng/toast';
   ```

### Errors Not Being Caught

1. **Check GlobalErrorHandler registration**:
   ```typescript
   providers: [
     { provide: ErrorHandler, useClass: GlobalErrorHandler }
   ]
   ```

2. **Check if error is being caught in component**:
   ```typescript
   // If error is caught here, GlobalErrorHandler won't see it
   try {
     throw new Error('Test');
   } catch (e) {
     // Caught - won't reach GlobalErrorHandler
   }
   ```

### Duplicate Errors

Deduplication window is 3 seconds. If you're seeing duplicates, check:

1. Multiple subscriptions to same observable
2. Error being thrown in multiple places
3. Retry logic causing multiple errors

---

## Future Enhancements

The error handling system is designed to support:

1. **External Error Logging** (Sentry, LogRocket, etc.)
   ```typescript
   // In GlobalErrorHandler
   private sendErrorToLoggingService(error: any): void {
     // TODO: Implement
   }
   ```

2. **User Feedback Integration**
   - Report error button
   - Error details dialog
   - Copy error details

3. **Error Analytics**
   - Track error frequency
   - Identify common errors
   - User experience metrics

---

## Related Documentation

- [PrimeNG Toast](https://primeng.org/toast)
- [Angular ErrorHandler](https://angular.io/api/core/ErrorHandler)
- [F2: HTTP Error Interceptor](./http-error.interceptor.ts)
- [Specification: 08 - Non-Functional Requirements](../../../specs/08-non-functional-requirements.md)

---

**Implementation Status**: ✅ Complete (Milestone F9)
**Last Updated**: 2025-11-20
