// components/client/CreateClientForm.tsx
'use client';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiPost, ApiError } from '../../lib/api';
import { createClientSchema, CreateClientFormValues } from './client.schema';

type CreateClientResponse = { success: boolean; clientId: string };

type CreateClientFormProps = {
  onCreated?: (clientId: string) => void | Promise<void>;
};

export function CreateClientForm({ onCreated }: CreateClientFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      gender: 'M',
      salutationCode: 'MR',
      maritalStatusCode: 'S',
      branch: '0101',
      city: 'HaNoi',
    },
  });

  const onSubmit: SubmitHandler<CreateClientFormValues> = async (data) => {
    setSubmitError(null);
    try {
      const response = await apiPost<CreateClientResponse, CreateClientFormValues>(
        '/clients',
        data,
      );
      if (!response?.success) {
        setSubmitError('Tạo hồ sơ thất bại, vui lòng thử lại.');
        return;
      }
      await onCreated?.(response.clientId);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ Backend!';
      setSubmitError(errorMsg);
    }
  };

  const inputClass =
    'w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-colors shadow-sm';
  const labelClass = 'block text-slate-700 font-medium text-sm mb-1 ml-1';
  const sectionTitleClass =
    'text-xl font-semibold text-slate-800 mb-4 mt-6 border-b border-slate-200 pb-2';
  const errorClass = 'text-red-500 text-sm mt-1';

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-xl border border-slate-200 rounded-4xl p-8 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold mb-2 text-slate-900">Tạo Hồ Sơ Khách Hàng</h2>
        <p className="text-slate-500 italic">
          Vui lòng cung cấp đầy đủ thông tin để định danh trên hệ thống
        </p>
      </div>

      {submitError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <h3 className={sectionTitleClass}>1. Thông tin cá nhân</h3>
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
            <input type="date" {...register('birthDate')} className={inputClass} />
            {errors.birthDate && <p className={errorClass}>{errors.birthDate.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Giới tính *</label>
            <select {...register('gender')} className={inputClass}>
              <option value="M">Nam (M)</option>
              <option value="F">Nữ (F)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Danh xưng *</label>
            <select {...register('salutationCode')} className={inputClass}>
              <option value="MR">Ông (MR)</option>
              <option value="MRS">Bà (MRS)</option>
              <option value="MS">Cô (MS)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tình trạng hôn nhân *</label>
            <select {...register('maritalStatusCode')} className={inputClass}>
              <option value="S">Độc thân (S)</option>
              <option value="M">Đã kết hôn (M)</option>
              <option value="D">Ly hôn (D)</option>
              <option value="W">Góa (W)</option>
            </select>
          </div>
        </div>

        <h3 className={sectionTitleClass}>2. Giấy tờ định danh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Số CMND / CCCD *</label>
            <input {...register('identityCardNumber')} className={inputClass} />
            {errors.identityCardNumber && <p className={errorClass}>{errors.identityCardNumber.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Số BHXH *</label>
            <input {...register('socialSecurityNumber')} className={inputClass} placeholder="VD: 012345678" />
            {errors.socialSecurityNumber && <p className={errorClass}>{errors.socialSecurityNumber.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
            <input {...register('identityCardDetails')} className={inputClass} placeholder="VD: 232445213 Ha Noi" />
          </div>
          <div>
            <label className={labelClass}>Mã số thuế (Tùy chọn)</label>
            <input {...register('individualTaxpayerNumber')} className={inputClass} />
          </div>
        </div>

        <h3 className={sectionTitleClass}>3. Liên hệ & Nghề nghiệp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" {...register('email')} className={inputClass} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
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
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? 'Đang khởi tạo...' : 'Gửi Yêu Cầu Tạo Hồ Sơ'}
          </button>
        </div>
      </form>
    </div>
  );
}