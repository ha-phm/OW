'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSignup } from '../hooks/useAuthMutations'; 
import { signupSchema, SignupFormValues } from '../schema/client.schema';

type SignupFormProps = {
  onSuccess: () => void;
};

export default function SignupForm({ onSuccess }: SignupFormProps) {
  // Lấy hàm gọi API và trạng thái từ Hook
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
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
    // Đẩy data xuống Hook xử lý.
    // Thông báo lỗi/thành công đã được quản lý tập trung ở Hook.
    signup(data, {
      onSuccess: () => {
        onSuccess(); // Gọi hàm của component cha (vd: để đóng form/modal)
      },
    });
  };

  const inputClass = 'w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-[#4ade80] placeholder:text-white/40 transition-colors shadow-sm';
  const selectClass = 'w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-[#4ade80] transition-colors shadow-sm [&>option]:bg-slate-800';
  const labelClass = 'block text-white/80 font-medium text-sm mb-1 ml-1';
  const sectionTitleClass = 'text-xl font-semibold text-white mb-4 mt-6 border-b border-white/20 pb-2';
  const errorClass = 'text-red-400 text-xs mt-1 ml-1';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-4xl p-8 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold mb-2 text-white">Đăng Ký Tài Khoản</h2>
        <p className="text-white/60 italic">Điền thông tin định danh để tạo hồ sơ khách hàng</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className={sectionTitleClass}>1. Thông tin đăng nhập</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <h3 className={sectionTitleClass}>2. Thông tin cá nhân</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Họ *</label>
            <input {...register('lastName')} className={inputClass} placeholder="VD: Truong" />
            {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Tên đệm</label>
            <input {...register('middleName')} className={inputClass} placeholder="VD: Ha" />
          </div>
          <div>
            <label className={labelClass}>Tên *</label>
            <input {...register('firstName')} className={inputClass} placeholder="VD: Anh" />
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
            <label className={labelClass}>Tình trạng hôn nhân *</label>
            <select {...register('maritalStatusCode')} className={selectClass}>
              <option value="S">Độc thân (S)</option>
              <option value="M">Đã kết hôn (M)</option>
              <option value="D">Ly hôn (D)</option>
              <option value="W">Góa (W)</option>
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

        <h3 className={sectionTitleClass}>3. Giấy tờ định danh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2">
            <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
            <input {...register('identityCardDetails')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mã số thuế</label>
            <input {...register('individualTaxpayerNumber')} className={inputClass} />
          </div>
        </div>

        <h3 className={sectionTitleClass}>4. Liên hệ & Nghề nghiệp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Điện thoại di động *</label>
            <input type="tel" {...register('mobilePhone')} className={inputClass} />
            {errors.mobilePhone && <p className={errorClass}>{errors.mobilePhone.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Địa chỉ thường trú *</label>
            <input {...register('addressLine1')} className={inputClass} />
            {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Thành phố *</label>
            <input {...register('city')} className={inputClass} />
            {errors.city && <p className={errorClass}>{errors.city.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Công ty</label>
            <input {...register('companyName')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Chức danh / Nghề nghiệp</label>
            <input {...register('profession')} className={inputClass} />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto px-10 py-4 rounded-xl bg-[#4ade80] hover:bg-[#3ee075] text-slate-900 font-bold transition-colors disabled:opacity-50 shadow-lg"
          >
            {isPending ? 'Đang tạo hồ sơ...' : 'Tạo Tài Khoản & Hồ Sơ'}
          </button>
        </div>
      </form>
    </div>
  );
}