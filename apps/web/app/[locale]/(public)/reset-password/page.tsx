'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

// Import form components và validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form-input';
import AuthLayout from '@/components/auth/auth-layout';

export default function ResetPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Kiểm tra xem có token không
  useEffect(() => {
    if (!token) {
      setError(t('auth.resetPassword.invalidToken'));
    }
  }, [token, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || t('auth.resetPassword.unexpectedError'));
      }
      
      // Xử lý thành công
      setIsSuccess(true);
      
      // Chuyển hướng đến trang đăng nhập sau 3 giây
      setTimeout(() => {
        router.push(`/${params.locale}/login?reset=success`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetPassword.unexpectedError'));
      console.error('Failed to reset password:', err);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.resetPassword.title')}</h3>
        <p className="mt-2 text-gray-600">
          {t('auth.resetPassword.instructions')}
        </p>
      </div>

      {isSuccess ? (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {t('auth.resetPassword.success')}
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{t('auth.resetPassword.redirectMessage')}</p>
              </div>
              <div className="mt-4">
                <Link
                  href={`/${params.locale}/login`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('auth.resetPassword.goToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-1 mb-4">
              <FormInput
                name="password"
                label={t('auth.resetPassword.passwordLabel')}
                type="password"
                required
                disabled={!token}
                leftIcon={<Lock size={18} />}
              />
            </div>

            <div className="space-y-1">
              <FormInput
                name="confirmPassword"
                label={t('auth.resetPassword.confirmPasswordLabel')}
                type="password"
                required
                disabled={!token}
                leftIcon={<Lock size={18} />}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || !token}
            >
              {form.formState.isSubmitting ? t('common.processing') : t('auth.resetPassword.resetButton')}
            </Button>
            
            <div className="text-center mt-4">
              <Link
                href={`/${params.locale}/login`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {t('auth.resetPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}