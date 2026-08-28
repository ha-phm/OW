'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignup } from '../../hooks/useAuthMutations'; 
import { signupSchema, SignupFormValues } from '../../schema/client.schema';

type SignupFormProps = {
  onSuccess: () => void;
};

const STEPS = [
  { id: 1, title: 'Đăng nhập', fields: ['email', 'password'] },
  { id: 2, title: 'Cá nhân', fields: ['lastName', 'middleName', 'firstName', 'birthDate', 'gender', 'maritalStatusCode', 'salutationCode'] },
  { id: 3, title: 'Định danh', fields: ['identityCardNumber', 'socialSecurityNumber', 'identityCardDetails', 'individualTaxpayerNumber'] },
  { id: 4, title: 'Liên hệ', fields: ['mobilePhone', 'addressLine1', 'city', 'companyName', 'profession'] }
];

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    trigger, 
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      gender: 'M',
      salutationCode: 'MR',
      maritalStatusCode: 'S',
      branch: '0101',
      city: 'HaNoi',
    },
  });

  const onSubmit: SubmitHandler<SignupFormValues> = (data) => {
    signup(data, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const nextStep = async () => {
    const fieldsToValidate = STEPS[currentStep - 1].fields as (keyof SignupFormValues)[];
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const inputClass = 'w-full p-2.5 rounded-xl bg-white/5 border border-white/20 text-white outline-none focus:border-[#4ade80] placeholder:text-white/40 transition-colors text-sm';
  const selectClass = 'w-full p-2.5 rounded-xl bg-white/5 border border-white/20 text-white outline-none focus:border-[#4ade80] transition-colors text-sm [&>option]:bg-slate-800';
  const labelClass = 'block text-white/80 font-medium text-xs mb-1 ml-1';
  const errorClass = 'text-red-400 text-[10px] mt-0.5 ml-1 absolute';

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Đăng Ký Tài Khoản</h2>
        
        <div className="flex justify-between items-center mt-4">
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                currentStep >= step.id ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/10 text-white/50'
              }`}>
                {step.id}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-green-400' : 'text-white/40'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
        
        <div className="relative -mt-7 sm:-mt-9 mx-8 h-0.5 bg-white/10 -z-10">
          <div 
            className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        
        {/* ================= BƯỚC 1: ĐĂNG NHẬP ================= */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" {...register('email')} className={inputClass} placeholder="Nhập email" />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Mật khẩu *</label>
              <input type="password" {...register('password')} className={inputClass} placeholder="Tạo mật khẩu" />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </div>
          </div>
        )}

        {/* ================= BƯỚC 2: CÁ NHÂN ================= */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className={labelClass}>Họ *</label>
              <input {...register('lastName')} className={inputClass} placeholder="Họ" />
              {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tên đệm & Tên *</label>
              <div className="flex gap-2">
                <input {...register('middleName')} className={`${inputClass} w-1/2`} placeholder="Đệm" />
                <input {...register('firstName')} className={`${inputClass} w-1/2`} placeholder="Tên" />
              </div>
              {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Ngày sinh *</label>
              <input type="date" {...register('birthDate')} className={inputClass} style={{ colorScheme: 'dark' }} />
              {errors.birthDate && <p className={errorClass}>{errors.birthDate.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Giới tính *</label>
              <select {...register('gender')} className={selectClass}>
                <option value="M">Nam (M)</option>
                <option value="F">Nữ (F)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Hôn nhân *</label>
              <select {...register('maritalStatusCode')} className={selectClass}>
                <option value="S">Độc thân</option>
                <option value="M">Đã kết hôn</option>
                <option value="D">Ly hôn</option>
                <option value="W">Góa</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Danh xưng *</label>
              <select {...register('salutationCode')} className={selectClass}>
                <option value="MR">Ông (MR)</option>
                <option value="MRS">Bà (MRS)</option>
                <option value="MS">Cô (MISS)</option>
              </select>
            </div>
          </div>
        )}

        {/* ================= BƯỚC 3: ĐỊNH DANH ================= */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className={labelClass}>Số CMND / CCCD *</label>
              <input {...register('identityCardNumber')} className={inputClass} />
              {errors.identityCardNumber && <p className={errorClass}>{errors.identityCardNumber.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Số BHXH *</label>
              <input {...register('socialSecurityNumber')} className={inputClass} />
              {errors.socialSecurityNumber && <p className={errorClass}>{errors.socialSecurityNumber.message}</p>}
            </div>
            {/* ĐÃ SỬA: Cho trường này chiếm trọn 2 cột vì nội dung dài */}
            <div className="md:col-span-2">
              <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
              <input {...register('identityCardDetails')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Mã số thuế</label>
              <input {...register('individualTaxpayerNumber')} className={inputClass} />
            </div>
          </div>
        )}


        {/* ================= BƯỚC 4: LIÊN HỆ ================= */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className={labelClass}>Điện thoại *</label>
              <input type="tel" {...register('mobilePhone')} className={inputClass} />
              {errors.mobilePhone && <p className={errorClass}>{errors.mobilePhone.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Thành phố *</label>
              <input {...register('city')} className={inputClass} />
              {errors.city && <p className={errorClass}>{errors.city.message}</p>}
            </div>
            {/* Trường địa chỉ chiếm 2 cột */}
            <div className="md:col-span-2">
              <label className={labelClass}>Địa chỉ thường trú *</label>
              <input {...register('addressLine1')} className={inputClass} />
              {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Công ty</label>
              <input {...register('companyName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nghề nghiệp</label>
              <input {...register('profession')} className={inputClass} />
            </div>
          </div>
        )}

        {/* ================= NÚT ĐIỀU HƯỚNG ================= */}
        <div className="mt-8 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Quay lại
            </button>
          ) : (
            <div></div> 
          )}

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              Tiếp tục &rarr;
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              {isPending ? 'Đang xử lý...' : 'Hoàn tất Đăng ký'}
            </button>
          )}
        </div>

      </form>
    </div>
  );
}