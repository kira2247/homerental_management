'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { User, Mail, Lock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

import { Button } from '../../../../components/ui/button';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import AuthLayout from '../../../../components/auth/AuthLayout';
import InputField from '../../../../components/auth/InputField';

export default function RegisterPage({
  params,
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const { t } = useLocale();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Validate form
      if (!name || !email || !password || !confirmPassword) {
        throw new Error(t('auth.register.validation.required'));
      }
      
      if (password !== confirmPassword) {
        throw new Error(t('auth.register.validation.passwordMismatch'));
      }
      
      if (password.length < 6) {
        throw new Error(t('auth.register.validation.passwordLength'));
      }
      
      // Call API through auth context
      await register({ name, email, password });
      
      // Redirect to dashboard on success
      router.push(`/${params.locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || t('auth.register.validation.registrationFailed'));
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium">{t('auth.register.title')}</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <InputField
          id="name"
          label={t('auth.register.nameLabel')}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={User}
          disabled={isLoading}
        />
        
        <InputField
          id="email"
          label={t('auth.register.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          disabled={isLoading}
        />
        
        <InputField
          id="password"
          label={t('auth.register.passwordLabel')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          disabled={isLoading}
        />
        
        <InputField
          id="confirmPassword"
          label={t('auth.register.confirmPasswordLabel')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={Lock}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t('common.processing') : t('auth.register.register')}
        </Button>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">{t('auth.register.haveAccount')}</span>{' '}
          <Link
            href={`/${params.locale}/login`}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            {t('auth.register.signIn')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
} 