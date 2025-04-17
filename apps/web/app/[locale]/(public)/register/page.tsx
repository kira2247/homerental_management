'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { User, Mail, Lock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

// Import form components và validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { registerSchema, RegisterFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthLayout from '@/components/auth/auth-layout';
import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form-input';

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const { t } = useLocale();
  
  const [error, setError] = useState('');
  
  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    
    try {
      // Call API through auth context
      await registerUser({ 
        name: data.name, 
        email: data.email, 
        password: data.password 
      });
      
      // Redirect to login page with registered=true parameter
      router.push(`/${locale}/login?registered=true`);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('auth.register.validation.registrationFailed'));
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.register.title')}</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormInput
            name="name"
            label={t('auth.register.nameLabel')}
            type="text"
            placeholder={t('auth.register.namePlaceholder') || 'Nhập họ và tên'}
            required
            leftIcon={<User size={18} />}
          />

          <FormInput
            name="email"
            label={t('auth.register.emailLabel')}
            type="email"
            placeholder="example@email.com"
            required
            leftIcon={<Mail size={18} />}
          />

          <FormInput
            name="password"
            label={t('auth.register.passwordLabel')}
            type="password"
            required
            leftIcon={<Lock size={18} />}
          />

          <FormInput
            name="confirmPassword"
            label={t('auth.register.confirmPasswordLabel')}
            type="password"
            required
            leftIcon={<Lock size={18} />}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || isLoading}
          >
            {form.formState.isSubmitting || isLoading ? t('common.processing') : t('auth.register.register')}
          </Button>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">{t('auth.register.haveAccount')}</span>{' '}
            <Link
              href={`/${locale}/login`}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('auth.register.signIn')}
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
} 