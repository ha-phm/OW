'use client';

import { useState, type SyntheticEvent } from 'react'; 
import { User, Lock } from 'lucide-react';
import { useLogin } from '../hooks/useAuthMutations';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate, isPending, error } = useLogin();

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(
      { email, password },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Báo lỗi nếu có */}
      {error && <p className="text-red-400 text-sm text-center">{error.message}</p>}

      {/* Input Email */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Email</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập địa chỉ email"
            required
            autoComplete="email"
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
          />
          <User className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
        </div>
      </div>

      {/* Input Password */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Mật khẩu</label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            required
            autoComplete="curent-password"
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
          />
          <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#4ade80] hover:bg-[#3ee075] text-white rounded-2xl py-4 font-bold text-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Đang xử lý...' : 'Đăng nhập'}
      </button>

      <button type="button" className="text-white/70 text-sm hover:text-white transition-colors mt-2">
        Quên mật khẩu?
      </button>
    </form>
  );
}