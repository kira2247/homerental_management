import { redirect } from 'next/navigation';

export default function LocaleHome({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Redirect đến trang đăng nhập
  redirect(`/${locale}/login`);
  
  // This is never shown
  return null;
} 