'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { apiPatch, ApiError } from '../api/api';
import { extractCode } from '../utils/client.utils';
import { IssClientDetailsV2APIRecord } from '../hooks/useCurrentUser';

// 1. IMPORT SCHEMA VÀ TYPE TỪ ZOD
import { profileEditSchema, EditFormData } from '../schema/client.schema';

interface ProfileEditProps {
  profile: IssClientDetailsV2APIRecord;
  clientId: string;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
}

export default function ProfileEdit({ profile, onCancel, onSuccess }: ProfileEditProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }, // 2. LẤY THÊM errors ĐỂ HIỂN THỊ
  } = useForm<EditFormData>({
    resolver: zodResolver(profileEditSchema), // 3. GẮN ZOD VÀO ĐÂY
    defaultValues: {
      firstName: profile.FirstName ?? '',
      middleName: profile.MiddleName ?? '',
      lastName: profile.LastName ?? '',
      birthDate: profile.BirthDate ?? '',
      gender: extractCode(profile.Gender) as 'M' | 'F',
      maritalStatusCode: extractCode(profile.MaritalStatus) as 'S' | 'M' | 'D' | 'W',
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
      await onSuccess();
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
  const errorClass = 'text-red-500 text-xs mt-1 ml-1'; // CSS cho câu thông báo lỗi

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
              <label className={labelClass}>Họ *</label>
              <input type="text" {...register('lastName')} className={inputClass} />
              {/* 4. IN LỖI RA GIAO DIỆN */}
              {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tên đệm</label>
              <input type="text" {...register('middleName')} className={inputClass} />
              {errors.middleName && <p className={errorClass}>{errors.middleName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tên *</label>
              <input type="text" {...register('firstName')} className={inputClass} />
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
              {errors.gender && <p className={errorClass}>{errors.gender.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tình trạng hôn nhân *</label>
              <select {...register('maritalStatusCode')} className={inputClass}>
                <option value="S">Độc thân (S)</option>
                <option value="M">Đã kết hôn (M)</option>
                <option value="D">Ly hôn (D)</option>
                <option value="W">Góa (W)</option>
              </select>
              {errors.maritalStatusCode && <p className={errorClass}>{errors.maritalStatusCode.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Quốc tịch (Mã Code) *</label>
              <input type="text" {...register('citizenship')} className={inputClass} placeholder="VD: VNM" />
              {errors.citizenship && <p className={errorClass}>{errors.citizenship.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Số CMND / CCCD *</label>
              <input type="text" {...register('identityCardNumber')} className={inputClass} />
              {errors.identityCardNumber && <p className={errorClass}>{errors.identityCardNumber.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
              <input type="text" {...register('identityCardDetails')} className={inputClass} />
              {errors.identityCardDetails && <p className={errorClass}>{errors.identityCardDetails.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Mã số thuế (MST)</label>
              <input type="text" {...register('individualTaxpayerNumber')} className={inputClass} />
              {errors.individualTaxpayerNumber && <p className={errorClass}>{errors.individualTaxpayerNumber.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Số BHXH *</label>
              <input type="text" {...register('socialSecurityNumber')} className={inputClass} />
              {errors.socialSecurityNumber && <p className={errorClass}>{errors.socialSecurityNumber.message}</p>}
            </div>
          </div>
        </div>

        {/* Nhóm 2: Liên hệ & Công việc */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Liên hệ & Công việc</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div>
              <label className={labelClass}>Điện thoại nhà</label>
              <input type="tel" {...register('homePhone')} className={inputClass} />
              {errors.homePhone && <p className={errorClass}>{errors.homePhone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Địa chỉ thường trú *</label>
              <input type="text" {...register('addressLine1')} className={inputClass} />
              {errors.addressLine1 && <p className={errorClass}>{errors.addressLine1.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Thành phố *</label>
              <input type="text" {...register('city')} className={inputClass} />
              {errors.city && <p className={errorClass}>{errors.city.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Công ty</label>
              <input type="text" {...register('companyName')} className={inputClass} />
              {errors.companyName && <p className={errorClass}>{errors.companyName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Nghề nghiệp</label>
              <input type="text" {...register('profession')} className={inputClass} />
              {errors.profession && <p className={errorClass}>{errors.profession.message}</p>}
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