'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/client';
import { Mail, Lock } from 'lucide-react';
import { LoginCredentials, authApiService } from '@/lib/api';
import { ErrorCode, ErrorService } from '@/lib/errors/error-service';
import { useToast } from '@/components/ui/toast/index';
import { useAuth } from '@/lib/auth/auth-context';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import InputField from '@/components/auth/InputField';

export default function LoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessageKey = (errorCode: string): string => {
    const errorMap: Record<string, string> = {
      [ErrorCode.INVALID_CREDENTIALS]: 'auth.login.invalidCredentials',
      [ErrorCode.NETWORK_ERROR]: 'errors.networkError',
      [ErrorCode.UNAUTHORIZED]: 'errors.authenticationError',
      [ErrorCode.SESSION_EXPIRED]: 'errors.sessionExpired',
      [ErrorCode.FORBIDDEN]: 'errors.unauthorized',
      [ErrorCode.VALIDATION_ERROR]: 'errors.validationError',
      [ErrorCode.SERVER_ERROR]: 'errors.serverError',
      [ErrorCode.UNKNOWN_ERROR]: 'errors.unknownError'
    };

    return errorMap[errorCode] || 'errors.unknownError';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate form
      if (!email.trim()) {
        setError(t('auth.login.emailRequired'));
        return;
      }
      
      if (!password) {
        setError(t('auth.login.passwordRequired'));
        return;
      }
      
      setIsLoading(true);
      
      // Sử dụng hook login từ AuthContext
      await login({ email, password });
      
      toast({
        title: t('auth.login.loginSuccess'),
        description: t('auth.login.redirecting')
      });
      
      // AuthContext sẽ tự động chuyển hướng, không cần router.push
    } catch (err: any) {
      console.error('Login form error:', err);
      
      try {
        const apiError = await ErrorService.handleApiError(err);
        
        const errorMessageKey = getErrorMessageKey(apiError.code || ErrorCode.UNKNOWN_ERROR);
        const errorMessage = t(errorMessageKey);
        
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: t('auth.login.loginFailed'),
          description: errorMessage
        });
      } catch (e) {
        console.error('Error handling login error:', e);
        setError(t('errors.unknownError'));
        toast({
          variant: "destructive",
          title: t('common.error'),
          description: t('errors.unknownError')
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.login.title')}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <InputField
          id="email"
          label={t('auth.login.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          disabled={isLoading}
        />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-gray-700 font-medium text-sm group-hover:text-blue-600 transition-colors">
              {t('auth.login.passwordLabel')}
            </label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline"
            >
              {t('auth.login.forgotPassword.title')}
            </Link>
          </div>
          <div className="relative">
            <InputField
              id="password"
              label=""
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            {t('auth.login.rememberMe')}
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t('common.processing') : t('auth.login.signIn')}
        </Button>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">{t('auth.login.noAccount')}</span>{' '}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {t('auth.login.createAccount')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 