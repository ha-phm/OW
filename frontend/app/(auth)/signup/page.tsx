'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignupForm from '../../../components/SignupForm';
import Navbar from '../../../components/NavBar'; // Nhớ check lại đường dẫn import

export default function SignupPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0d1410] overflow-x-hidden font-sans relative selection:bg-green-500 selection:text-black flex flex-col">
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,50 Q25,0 50,50 T100,50" fill="none" stroke="#22c55e" strokeWidth="0.2"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
        <Navbar />

        {/* Lớp flex-1 này giúp khối nội dung tự động chiếm toàn bộ chiều cao còn lại và căn giữa đều (items-center) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-12 relative z-10 flex-1 py-8 lg:py-0">
          
          {/* ================= CỘT TRÁI: Nội dung text ================= */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 lg:gap-8 items-center lg:items-start text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-[64px] font-bold leading-[1.2] lg:leading-[1.1] text-white">
              Discover the Perfect <br className="hidden sm:block" />
              <span className="relative inline-block mt-2 lg:mt-4">
                Credit Card
                <svg 
                  className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-8 sm:h-10 text-green-500 scale-110" 
                  viewBox="0 0 200 40" fill="none" preserveAspectRatio="none"
                >
                  <path d="M5 25 Q 50 5, 100 20 T 195 25" stroke="currentColor" strokeWidth="3" fill="transparent" strokeLinecap="round"/>
                  <path d="M5 30 Q 50 15, 100 25 T 195 20" stroke="currentColor" strokeWidth="1.5" fill="transparent" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </span> for You
            </h1>

            <p className="text-gray-400 max-w-md text-sm sm:text-base leading-relaxed mt-2 lg:mt-4">
              Discover the power of our secure and rewarding credit cards. Explore our range of credit cards and take control of your finances today.
            </p>

            {/* Nút bấm và Users */}
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mt-4 w-full sm:w-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto justify-center px-8 py-3.5 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                Login 
              </Link>
              <Link 
                href="/signup" 
                className="w-full sm:w-auto justify-center px-8 py-3.5 bg-transparent border border-green-500 text-green-500 font-semibold rounded-full hover:bg-green-500 hover:text-black transition-all flex items-center gap-2"
              >
                Sign Up 
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-30">👱🏼‍♂️</div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-20">👨🏻</div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-300 border-2 border-[#0d1410] flex items-center justify-center text-xs z-10">👩🏽</div>
                </div>
                <div className="text-left text-sm">
                  <div className="font-bold text-white leading-tight">10.2k+</div>
                  <div className="text-[10px] sm:text-xs text-gray-400">Active users around the<br/>world</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-0 sm:top-12 left-4 sm:left-10 text-green-500 text-xl sm:text-2xl animate-pulse">✦</div>
          <div className="absolute bottom-4 sm:bottom-10 right-10 sm:right-24 text-green-500 text-xl sm:text-2xl animate-pulse">✦</div>

          {/* CỘT PHẢI: Form Đăng ký Step-by-step */}
          <div className="w-full lg:w-1/2 relative flex justify-center items-center mt-10 lg:mt-0">
            
            
            <div className="absolute top-0 sm:top-12 left-4 sm:left-10 text-green-500 text-xl sm:text-2xl animate-pulse">✦</div>

            <div className="relative z-10 w-full max-w-175 max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none bg-white/10 backdrop-blur-xl border border-white/20 rounded-4xl p-6 sm:p-8 shadow-2xl flex flex-col">
              
              <SignupForm 
                onSuccess={() => {
                  router.push('/login');
                }} 
              />

              <div className="mt-6 pb-2 text-center text-sm text-white/70">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-[#4ade80] hover:text-[#22c55e] hover:underline font-medium transition-colors">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}