'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useLocale } from '@/lib/i18n/client';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useLocale();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage(t('auth.verify_email.invalid_token'));
          return;
        }
        
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(t('auth.verify_email.success'));
        } else {
          setStatus('error');
          setMessage(data.error || t('auth.verify_email.failed'));
        }
      } catch (error) {
        setStatus('error');
        setMessage(t('auth.verify_email.error'));
        console.error('Email verification error:', error);
      }
    };
    
    verifyEmail();
  }, [searchParams, t]);
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {t('auth.verify_email.title')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <LoadingSpinner type="beat" color="#3b82f6" size={15} />
              <p>{t('auth.verify_email.processing')}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-lg font-medium">{t('auth.verify_email.success_title')}</h3>
              <p>{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <XCircle className="h-16 w-16 text-red-500" />
              <h3 className="text-lg font-medium">{t('auth.verify_email.error_title')}</h3>
              <p>{message}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t p-6">
          <Button 
            onClick={() => router.push(`/${locale}/login`)}
            className="w-full"
          >
            {status === 'success' 
              ? t('auth.verify_email.go_to_login') 
              : t('auth.verify_email.back_to_login')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 