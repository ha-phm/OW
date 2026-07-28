'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { apiPatch, ApiError } from '../../../lib/api';

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
};

// Chuyển các mã dạng "3;Divorced" -> "3" để khớp với option value trong form edit
function extractCode(value?: string): string {
  if (!value) return '';
  return value.split(';')[0].trim();
}

export function CustomerProfilePage() {
  const { data, isLoading, refetch } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const profile = data?.IssClientDetailsV2APIRecord;
  const clientId = data?.clientId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<EditFormData>();

  if (isLoading) return <div className="p-8 text-center">Đang tải hồ sơ...</div>;

  if (!profile || !clientId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Bạn chưa có hồ sơ khách hàng. Vui lòng tạo hồ sơ ở trang Tổng quan.
      </div>
    );
  }

  const startEdit = () => {
    setSubmitError(null);
    reset({
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
    });
    setIsEditing(true);
  };

  const onSubmit: SubmitHandler<EditFormData> = async (formData) => {
    setSubmitError(null);
    try {
      await apiPatch(`/clients/${clientId}`, formData);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
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
  const labelClass = 'block text-slate-700 font-medium text-sm mb-1 ml-1';

  // ==== CHẾ ĐỘ XEM ====
  if (!isEditing) {
    const displayName =
      [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') ||
      profile.FullName;

    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Hồ sơ khách hàng</h2>
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ViewField label="Họ và tên" value={displayName} />
            <ViewField label="Ngày sinh" value={profile.BirthDate} />
            <ViewField label="Giới tính" value={profile.Gender} />
            <ViewField label="Tình trạng hôn nhân" value={profile.MaritalStatus} />
            <ViewField label="Email" value={profile.EMail} />
            <ViewField label="Điện thoại di động" value={String(profile.MobilePhone ?? '')} />
            <ViewField label="Điện thoại nhà" value={profile.HomePhone} />
            <ViewField label="Số CMND/CCCD" value={profile.IdentityCardNumber} />
            <ViewField label="Chi tiết giấy tờ" value={profile.IdentityCardDetails} />
            <ViewField label="Địa chỉ" value={profile.AddressLine1} />
            <ViewField label="Thành phố" value={profile.City} />
            <ViewField label="Công ty" value={profile.CompanyName} />
            <ViewField label="Nghề nghiệp" value={profile.Profession} />
          </div>
        </div>
      </div>
    );
  }

  // ==== CHẾ ĐỘ CHỈNH SỬA ====
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa hồ sơ</h2>
        <button
          onClick={() => setIsEditing(false)}
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
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
          <div>
            <label className={labelClass}>Số CMND / CCCD</label>
            <input type="text" {...register('identityCardNumber')} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
            <input type="text" {...register('identityCardDetails')} className={inputClass} />
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

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
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

function ViewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || 'Chưa cập nhật'}</p>
    </div>
  );
}

export default CustomerProfilePage;