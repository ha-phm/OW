'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Lock } from 'lucide-react';
import { useLogin } from '../../hooks/useAuthMutations';
import { loginSchema, LoginFormValues } from '../../schema/client.schema'; 

export function LoginForm() {
  const { mutate, isPending, error: apiError } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), 
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {apiError && <p className="text-red-400 text-sm text-center">{apiError.message}</p>}

      {/* Input Email */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Email</label>
        <div className="relative">
          <input
            type="email"
            placeholder="Nhập địa chỉ email"
            autoComplete="email"
            maxLength={100} // Lớp khiên bảo vệ giao diện
            {...register('email')}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
          />
          <User className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
        </div>
        {/* Lỗi được trả tự động từ Zod Schema */}
        {errors.email && <p className="text-red-400 text-xs mt-1 absolute">{errors.email.message}</p>}
      </div>

      {/* Input Password */}
      <div className="relative">
        <label className="text-white/80 block mb-1">Mật khẩu</label>
        <div className="relative">
          <input
            type="password"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            maxLength={50} // Giới hạn chiều dài mật khẩu
            {...register('password')}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-6 pr-12 text-white placeholder:text-white/70 focus:outline-none focus:border-white/50 transition-colors"
          />
          <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70" size={20} />
        </div>
        {/* Lỗi được trả tự động từ Zod Schema */}
        {errors.password && <p className="text-red-400 text-xs mt-1 absolute">{errors.password.message}</p>}
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