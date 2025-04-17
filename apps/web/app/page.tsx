import { redirect } from 'next/navigation';

export default function Home() {
  // Mặc định chuyển hướng đến tiếng Việt
  redirect('/vi');
  
  // This is never shown
  return null;
} 