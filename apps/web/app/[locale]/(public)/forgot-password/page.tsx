'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

// Import form components và validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/auth-layout';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form-input';

export default function ForgotPasswordPage({
  params,
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { t } = useLocale();
  
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    
    try {
      // Lưu email để hiển thị trong thông báo thành công
      setSubmittedEmail(data.email);
      
      // Gọi API quên mật khẩu (mô phỏng)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Giả lập gửi email thành công
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || t('auth.forgotPassword.error'));
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h3 className="text-xl font-medium mb-4">{t('auth.forgotPassword.emailSent')}</h3>
          <p className="mb-6">
            {t('auth.forgotPassword.emailSentDesc', { email: submittedEmail })}
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
              label={t('auth.forgotPassword.emailLabel')}
              type="email"
              placeholder="example@email.com"
              required
              leftIcon={<Mail size={18} />}
            />
          </div>

          <div className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t('common.processing') : t('auth.forgotPassword.sendLink')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/${params.locale}/login`)}
              disabled={form.formState.isSubmitting}
            >
              {t('auth.forgotPassword.backToLogin')}
            </Button>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}