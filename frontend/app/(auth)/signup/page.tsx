'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignupForm from '../../../components/SignupForm';

export default function SignupPage() {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 md:p-8 relative"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      
      <SignupForm 
        onSuccess={() => {
          router.push('/login');
        }} 
      />

      
      <div className="mt-6 text-center text-sm text-white/80 drop-shadow-md">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-[#4ade80] hover:underline font-medium">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}