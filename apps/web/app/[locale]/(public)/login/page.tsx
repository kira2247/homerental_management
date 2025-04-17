'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/client';
import { Mail, Lock } from 'lucide-react';
import { LoginCredentials, authApiService } from '@/lib/api';
import { ErrorCode, ErrorService } from '@/lib/errors/error-service';
import { useToast } from '@/lib/hooks/ui/use-toast';
import { useAuth } from '@/lib/auth/auth-context';

// Import form components và validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginSchema, LoginFormData } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/auth-layout';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form-input';



export default function LoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const { login } = useAuth();
  
  const [error, setError] = useState('');
  
  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

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

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    
    try {
      // Sử dụng hook login từ AuthContext
      // Note: LoginCredentials không có rememberMe, nên chỉ truyền email và password
      await login({ email: data.email, password: data.password });
      
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
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.login.title')}</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <FormInput
              name="email"
              label={t('auth.login.emailLabel')}
              type="email"
              placeholder="example@email.com"
              containerClassName="mb-1"
              leftIcon={<Mail size={18} />}
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
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
            <FormInput
              name="password"
              type="password"
              leftIcon={<Lock size={18} />}
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...form.register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              {t('auth.login.rememberMe')}
            </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t('common.processing') : t('auth.login.signIn')}
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
      </Form>
    </AuthLayout>
  );
} 