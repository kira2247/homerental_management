# Custom Hooks

This directory contains custom React hooks for the rental management application.

## Available Hooks

### Error Handling

- `useError`: A hook for handling errors in components
  - Provides error state and handling functions
  - Integrates with the toast notification system
  - Supports API error handling

```tsx
import { useError } from '@/lib/hooks';

function MyComponent() {
  const { 
    error,              // Current error state
    setError,           // Function to set an error
    clearError,         // Function to clear the error
    handleApiError,     // Function to handle API errors
    withErrorHandling,  // Wrapper for async functions
    isError             // Boolean indicating if there is an error
  } = useError();

  // Example: Handle API call with error handling
  const fetchData = async () => {
    try {
      const response = await api.getData();
      // Process data
    } catch (err) {
      handleApiError(err, 'fetchData');
    }
  };

  // Example: Wrap an async function with error handling
  const saveData = async () => {
    const result = await withErrorHandling(
      api.saveData(formData),
      'saveData'
    );
    
    if (result) {
      // Handle success
    }
  };

  return (
    <div>
      {error.hasError && <div className="error">{error.message}</div>}
      {/* Rest of component */}
    </div>
  );
}
```

### Other Hook Categories...

[Add documentation for other hook categories as they are implemented] 