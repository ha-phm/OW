import { useState } from 'react';
import { useSignup } from '../../hooks/useSignup';
import { User, Lock } from 'lucide-react';

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const signupMutation = useSignup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          alert('Đăng ký thành công! Mời bạn đăng nhập.');
          onSuccess(); // Chuyển về tab login
        },
        onError: (error) => {
          console.error('Lỗi đăng ký:', error);
          alert('Đăng ký thất bại, vui lòng thử lại.');
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
          placeholder="Enter email" 
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
          placeholder="Enter password"
          autoComplete="new-password"
        />
        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
      </div>
      
      <button 
        type="submit" 
        disabled={signupMutation.isPending}
        className="w-full bg-[#4ade80] hover:bg-[#3ee075] text-white rounded-2xl py-4 font-bold text-lg transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {signupMutation.isPending ? 'Đang xử lý...' : 'Đăng ký ngay'}
      </button>
    </form>
  );
}