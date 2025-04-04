'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/AuthLayout';
import InputField from '@/components/auth/InputField';

export default function ForgotPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { t } = useLocale();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate email
      if (!email) {
        throw new Error(t('auth.register.validation.required'));
      }
      
      // Gọi API quên mật khẩu (mô phỏng)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Giả lập gửi email thành công
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h3 className="text-xl font-medium mb-4">{t('auth.forgotPassword.emailSent')}</h3>
          <p className="mb-6">
            {t('auth.forgotPassword.emailSentDesc', { email })}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/${params.locale}/login`)}
          >
            {t('auth.forgotPassword.backToLogin')}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.forgotPassword.title')}</h3>
        <p className="mt-2 text-gray-600">
          {t('auth.forgotPassword.instructions')}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <InputField
          id="email"
          label={t('auth.forgotPassword.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          disabled={isLoading}
        />

        <div className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('common.processing') : t('auth.forgotPassword.sendLink')}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/${params.locale}/login`)}
            disabled={isLoading}
          >
            {t('auth.forgotPassword.backToLogin')}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}