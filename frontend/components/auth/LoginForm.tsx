'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock } from 'lucide-react';
import { useLogin } from '../../hooks/useLogin';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  
  const { mutate, isPending, error } = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutate(
      { email, password },
      { onSuccess: () => router.push('/dashboard') },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Báo lỗi nếu có */}
      {error && <p className="text-red-400 text-sm text-center">{error.message}</p>}

      {/* Input Username/Email */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('loginForm.emailPlaceholder')}
          required
          autoComplete="nope"
          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
        />
        <User className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
      </div>

      {/* Input Password */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('loginForm.passwordPlaceholder')}
          required
          autoComplete="new-password"
          className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
        />
        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
      </div>

      {/* Nút Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#4ade80] hover:bg-[#3ee075] text-white rounded-2xl py-4 font-bold text-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? t('loginForm.processing') : t('loginForm.submitBtn')}
      </button>

      {/* Quên mật khẩu */}
      <button type="button" className="text-white/70 text-sm hover:text-white transition-colors mt-2">
        {t('loginForm.forgotPassword')}
      </button>
    </form>
  );
}