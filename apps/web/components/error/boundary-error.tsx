'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/lib/i18n/client';

interface BoundaryErrorProps {
  error?: Error | null;
  resetError?: () => void;
  title?: string;
  description?: string;
  showReload?: boolean;
  showTryAgain?: boolean;
  children?: React.ReactNode;
}

/**
 * BoundaryError component that displays error information with a consistent UI
 * Can be used directly or as a fallback for ErrorBoundary
 */
const BoundaryError: React.FC<BoundaryErrorProps> = ({
  error,
  resetError,
  title,
  description,
  showReload = true,
  showTryAgain = true,
  children
}) => {
  const { t } = useLocale();

  const errorTitle = title || t('errors.title');
  const errorDescription = description || t('errors.description');
  const errorMessage = error?.message || t('errors.unknownError');

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle />
            <CardTitle>{errorTitle}</CardTitle>
          </div>
          <CardDescription className="text-red-700/70 dark:text-red-300/70">
            {errorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {children || (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('errors.message')}
                </h3>
                <p className="mt-1 text-sm font-medium">{errorMessage}</p>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && error && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('errors.details')}
                </h3>
                <pre className="mt-1 text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded max-h-40">
                  {error.stack || error.toString()}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-2">
          {showReload && (
            <Button 
              variant="secondary" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('errors.reload')}
            </Button>
          )}
          
          {showTryAgain && resetError && (
            <Button onClick={resetError}>
              {t('errors.tryAgain')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default BoundaryError; 