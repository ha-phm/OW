import { useState } from 'react';
import { useSignup } from '../../hooks/useSignup';
import { User, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signupMutation = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          alert(t('signupForm.successAlert'));
          onSuccess(); 
        },
        onError: (error) => {
          console.error('Lỗi đăng ký:', error);
          alert(t('signupForm.errorAlert'));
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <label className="text-white/80 block mb-1">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-white/50"
          required
          autoComplete="nope"
          placeholder={t('signupForm.emailPlaceholder')}
        />
        <User className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
      </div>
      <div className="relative">
        <label className="text-white/80 block mb-1">Mật khẩu</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-white/50"
          required 
          minLength={6}
          placeholder={t('signupForm.passwordPlaceholder')}
          autoComplete="new-password"
        />
        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
      </div>
      
      <button 
        type="submit" 
        disabled={signupMutation.isPending}
        className="w-full bg-[#4ade80] hover:bg-[#3ee075] text-white rounded-2xl py-4 font-bold text-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {signupMutation.isPending ? t('signupForm.processing') : t('signupForm.submitBtn')}
      </button>
    </form>
  );
}