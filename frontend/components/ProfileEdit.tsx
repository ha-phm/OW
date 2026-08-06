'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { X } from 'lucide-react';
import { apiPatch, ApiError } from '../lib/api';
import { extractCode } from '../utils/client.utils';
import { IssClientDetailsV2APIRecord } from '../hooks/useCurrentUser'

interface ProfileEditProps {
  profile: IssClientDetailsV2APIRecord;
  clientId: string;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
}

type EditFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  maritalStatusCode: string;
  mobilePhone: string;
  email: string;
  identityCardNumber: string;
  identityCardDetails: string;
  addressLine1: string;
  city: string;
  homePhone: string;
  companyName: string;
  profession: string;
  citizenship: string;
  individualTaxpayerNumber: string;
  socialSecurityNumber: string;
};

export default function ProfileEdit({ profile, onCancel, onSuccess }: ProfileEditProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EditFormData>({
    defaultValues: {
      firstName: profile.FirstName ?? '',
      middleName: profile.MiddleName ?? '',
      lastName: profile.LastName ?? '',
      birthDate: profile.BirthDate ?? '',
      gender: extractCode(profile.Gender),
      maritalStatusCode: extractCode(profile.MaritalStatus),
      mobilePhone: String(profile.MobilePhone ?? ''),
      email: profile.EMail ?? '',
      identityCardNumber: profile.IdentityCardNumber ?? '',
      identityCardDetails: profile.IdentityCardDetails ?? '',
      addressLine1: profile.AddressLine1 ?? '',
      city: profile.City ?? '',
      homePhone: profile.HomePhone ?? '',
      companyName: profile.CompanyName ?? '',
      profession: profile.Profession ?? '',
      citizenship: extractCode(profile.Citizenship),
      individualTaxpayerNumber: profile.IndividualTaxpayerNumber ?? '',
      socialSecurityNumber: profile.SocialSecurityNumber ?? '',
    },
  });

  const onSubmit: SubmitHandler<EditFormData> = async (formData) => {
    setSubmitError(null);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData)
          .filter(([, value]) => value !== '' && value !== null && value !== undefined)
          .map(([key, value]) => [key, String(value)])
      );

      await apiPatch(`/clients/me`, cleanData);
      await onSuccess(); // Gọi hàm refetch từ component cha truyền xuống
    } catch (error: unknown) {
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Không thể cập nhật hồ sơ.';
      setSubmitError(errorMsg);
    }
  };

  const inputClass =
    'w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm';
  const labelClass = 'mb-1 ml-1 block text-sm font-medium text-slate-700';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa hồ sơ</h2>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
          Hủy
        </button>
      </div>

      {submitError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Nhóm 1: Thông tin cá nhân */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Họ</label>
              <input type="text" {...register('lastName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tên đệm</label>
              <input type="text" {...register('middleName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tên</label>
              <input type="text" {...register('firstName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ngày sinh</label>
              <input type="date" {...register('birthDate')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Giới tính</label>
              <select {...register('gender')} className={inputClass}>
                <option value="M">Nam (M)</option>
                <option value="F">Nữ (F)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tình trạng hôn nhân</label>
              <select {...register('maritalStatusCode')} className={inputClass}>
                <option value="S">Độc thân (S)</option>
                <option value="M">Đã kết hôn (M)</option>
                <option value="D">Ly hôn (D)</option>
                <option value="W">Góa (W)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Quốc tịch (Mã Code)</label>
              <input type="text" {...register('citizenship')} className={inputClass} placeholder="VD: VNM" />
            </div>
            <div>
              <label className={labelClass}>Số CMND / CCCD</label>
              <input type="text" {...register('identityCardNumber')} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
              <input type="text" {...register('identityCardDetails')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mã số thuế (MST)</label>
              <input type="text" {...register('individualTaxpayerNumber')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Số BHXH</label>
              <input type="text" {...register('socialSecurityNumber')} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Nhóm 2: Liên hệ & Công việc */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Liên hệ & Công việc</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" {...register('email')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Điện thoại di động</label>
              <input type="tel" {...register('mobilePhone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Điện thoại nhà</label>
              <input type="tel" {...register('homePhone')} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Địa chỉ thường trú</label>
              <input type="text" {...register('addressLine1')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Thành phố</label>
              <input type="text" {...register('city')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Công ty</label>
              <input type="text" {...register('companyName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nghề nghiệp</label>
              <input type="text" {...register('profession')} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}