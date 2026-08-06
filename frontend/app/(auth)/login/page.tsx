'use client';

import Link from 'next/link';
import { LoginForm } from '../../../components/LoginForm';
import { GlassNavbar } from '../../../components/GlassNavbar';

export default function LoginPage() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-8"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="w-full max-w-300 h-175 bg-white/5 backdrop-blur-md border border-white/20 rounded-[40px] p-8 flex flex-col relative overflow-hidden shadow-2xl">
        
        <GlassNavbar />

        <div className="flex flex-1 items-center px-10">
          {/* Cột trái: Văn bản chào mừng */}
          <div className="flex-1 text-white">
            <h1 className="text-[5.5rem] font-bold leading-[1.1] mb-2 tracking-wide">
              Welcome<br />!
            </h1>
            <p className="text-2xl font-light italic text-white/80 font-serif">
              lalala
            </p>
          </div>

          {/* Cột phải: Form Đăng nhập */}
          <div className="w-105 bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-10 shadow-xl">
            {/* Thêm tiêu đề thay cho AuthTabs */}
            <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-wide">
              Đăng Nhập
            </h2>
            
            <LoginForm />

            {/* Điều hướng người dùng sang trang Signup mới */}
            <div className="mt-6 text-center text-sm text-white/70">
              Chưa có tài khoản?{' '}
              <Link href="/signup" className="text-[#4ade80] hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}