# Error Components

This directory contains components for error handling and display.

## Components

### ErrorBoundary

A React error boundary component that catches JavaScript errors in child component trees and displays a fallback UI.

```tsx
import { ErrorBoundary } from '@/components/error';

// Basic usage
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary 
  fallback={<CustomErrorComponent />}
  onError={(error, errorInfo) => {
    // Custom error handling logic
    logErrorToService(error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### BoundaryError

A standalone error display component that can be used directly or as a fallback UI for ErrorBoundary.

```tsx
import { BoundaryError } from '@/components/error';

// Basic usage
<BoundaryError 
  error={error}
  resetError={() => setError(null)}
/>

// With custom content
<BoundaryError 
  title="Custom Error Title"
  description="A more detailed error description"
  showReload={false}
>
  <div>Custom error content</div>
</BoundaryError>
```

## Best Practices

1. Wrap route components with ErrorBoundary to prevent the entire app from crashing
2. Use BoundaryError for presenting errors from API calls or other runtime errors
3. Combine with the useError hook for comprehensive error handling
4. Keep error messages user-friendly and provide clear next steps for users 