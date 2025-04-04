import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast/use-toast';
import { ErrorService, ApiError, ErrorCode } from '@/lib/errors/error-service';
import { useLocale } from '@/lib/i18n/client';

interface ErrorState {
  hasError: boolean;
  message: string;
  code: string;
  details?: any;
}

interface UseErrorOptions {
  showToast?: boolean;
  logToService?: boolean;
}

/**
 * Custom hook for managing errors in components
 * @param options Configuration options
 * @returns Error state and handler functions
 */
export function useError(options: UseErrorOptions = {}) {
  const { showToast = true, logToService = true } = options;
  const { toast } = useToast();
  const { t } = useLocale();
  
  const [error, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: '',
    code: '',
    details: undefined
  });

  /**
   * Set an error with a message and optional code
   */
  const setError = useCallback((message: string, code: string = ErrorCode.UNKNOWN_ERROR, details?: any) => {
    // Update error state
    setErrorState({
      hasError: true,
      message,
      code,
      details
    });

    // Show toast if enabled
    if (showToast) {
      toast({
        variant: 'destructive',
        title: t('errors.errorOccurred'),
        description: message,
      });
    }

    // Log error if enabled
    if (logToService) {
      const errorObj = new Error(message);
      (errorObj as any).code = code;
      (errorObj as any).details = details;
      
      ErrorService.logError(errorObj, 'useError');
    }
  }, [showToast, toast, t, logToService]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      message: '',
      code: '',
      details: undefined
    });
  }, []);

  /**
   * Handle error from API
   */
  const handleApiError = useCallback(async (apiError: any, context?: string) => {
    try {
      // Use ErrorService to parse the API error
      const parsedError: ApiError = await ErrorService.handleApiError(apiError);
      
      // Get user-friendly message
      const userMessage = ErrorService.getUserMessage(
        parsedError.code || ErrorCode.UNKNOWN_ERROR,
        parsedError.message
      );
      
      // Set the error
      setError(userMessage, parsedError.code || ErrorCode.UNKNOWN_ERROR, parsedError.details);
      
      return parsedError;
    } catch (err) {
      console.error('Error handling API error:', err);
      
      setError(
        t('errors.unknownError'),
        ErrorCode.UNKNOWN_ERROR
      );
      
      return {
        code: ErrorCode.UNKNOWN_ERROR,
        message: t('errors.unknownError')
      };
    }
  }, [setError, t]);

  /**
   * Wrap a promise with error handling
   * @param promise The promise to wrap with error handling
   * @param errorContext Optional context for logging
   * @returns The resolved promise value or undefined if error occurred
   */
  const withErrorHandling = useCallback(async <T>(
    promise: Promise<T>, 
    errorContext?: string
  ): Promise<T | undefined> => {
    try {
      return await promise;
    } catch (err) {
      await handleApiError(err, errorContext);
      return undefined;
    }
  }, [handleApiError]);

  return {
    error,
    setError,
    clearError,
    handleApiError,
    withErrorHandling,
    isError: error.hasError
  };
}

export default useError; 