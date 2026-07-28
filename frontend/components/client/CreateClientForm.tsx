'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { apiPost, ApiError } from '../../lib/api';

// Khai báo Type để TypeScript hỗ trợ gợi ý code và bắt lỗi
type ClientFormData = {
  lastName: string;
  middleName: string;
  firstName: string;
  birthDate: string;
  gender: string;
  maritalStatusCode: string;
  socialSecurityNumber: string;
  identityCardNumber: string;
  identityCardDetails: string;
  email: string;
  mobilePhone: string;
  homePhone: string;
  addressLine1: string;
  city: string;
  companyName: string;
  profession: string;
};

// Response thực tế trả về từ backend (xem client.service.ts -> createClient)
type CreateClientResponse = {
  success: boolean;
  clientId: string;
};

// Hàm suy luận danh xưng từ giới tính + tình trạng hôn nhân
function inferSalutationCode(gender: string, maritalStatusCode: string): string {
  if (gender === 'M') return 'MR';
  return 'MRS'; // Tạm thời dùng MRS cho mọi nữ giới, do WAY4 chưa có mã MS
}

type CreateClientFormProps = {
  // Được gọi khi tạo hồ sơ thành công. Component cha dùng callback này
  // để chuyển sang giao diện khác (VD: chào mừng khách mới) mà không cần reload trang.
  onCreated?: (clientId: string) => void | Promise<void>;
};

export function CreateClientForm({ onCreated }: CreateClientFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ClientFormData>({
    defaultValues: {
      gender: 'M',
      maritalStatusCode: 'S',
      city: 'HaNoi',
      socialSecurityNumber: '',
    },
  });

  // Hàm xử lý khi submit form
  const onSubmit: SubmitHandler<ClientFormData> = async (data) => {
    setSubmitError(null);
    try {
      const payload = {
        ...data,
        salutationCode: inferSalutationCode(data.gender, data.maritalStatusCode),
      };

      const response = await apiPost<CreateClientResponse, typeof payload>('/clients', payload);

      if (!response?.success) {
        setSubmitError('Tạo hồ sơ thất bại, vui lòng thử lại.');
        return;
      }

      // Không hiện clientId cho khách, chỉ báo cho component cha biết đã xong
      await onCreated?.(response.clientId);
    } catch (error: unknown) {
      console.error('Lỗi khi gọi API:', error);
      const errorMsg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ Backend!';
      setSubmitError(errorMsg);
    }
  };

  // Cấu hình lại CSS class sang Light Mode để nhìn rõ trên nền sáng
  const inputClass =
    'w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-colors shadow-sm';
  const labelClass = 'block text-slate-700 font-medium text-sm mb-1 ml-1';
  const sectionTitleClass =
    'text-xl font-semibold text-slate-800 mb-4 mt-6 border-b border-slate-200 pb-2';

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
        {/* === SECTION 1: THÔNG TIN CÁ NHÂN === */}
        <h3 className={sectionTitleClass}>1. Thông tin cá nhân</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Họ</label>
            <input
              type="text"
              {...register('lastName', { required: true })}
              className={inputClass}
              placeholder="VD: Truong"
            />
          </div>
          <div>
            <label className={labelClass}>Tên đệm</label>
            <input
              type="text"
              {...register('middleName')}
              className={inputClass}
              placeholder="VD: Ha"
            />
          </div>
          <div>
            <label className={labelClass}>Tên</label>
            <input
              type="text"
              {...register('firstName', { required: true })}
              className={inputClass}
              placeholder="VD: Anh"
            />
          </div>

          <div>
            <label className={labelClass}>Ngày sinh</label>
            <input
              type="date"
              {...register('birthDate', { required: true })}
              className={inputClass}
            />
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
            </select>
          </div>
        </div>

        {/* === SECTION 2: GIẤY TỜ TÙY THÂN === */}
        <h3 className={sectionTitleClass}>2. Giấy tờ định danh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Số CMND / CCCD</label>
            <input
              type="text"
              {...register('identityCardNumber', { required: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Số bảo hiểm xã hội (SSN)</label>
            <input
              type="text"
              {...register('socialSecurityNumber', { required: true })}
              className={inputClass}
              placeholder="VD: 012345678"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Chi tiết nơi cấp / ngày cấp</label>
            <input
              type="text"
              {...register('identityCardDetails', { required: true })}
              className={inputClass}
              placeholder="VD: 232445213 Ha Noi"
            />
          </div>
        </div>

        {/* === SECTION 3: LIÊN HỆ & NGHỀ NGHIỆP === */}
        <h3 className={sectionTitleClass}>3. Liên hệ & Nghề nghiệp</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              {...register('email', { required: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Điện thoại di động</label>
            <input
              type="tel"
              {...register('mobilePhone', { required: true })}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Địa chỉ thường trú</label>
            <input
              type="text"
              {...register('addressLine1', { required: true })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Công ty</label>
            <input
              type="text"
              {...register('companyName')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Chức danh / Nghề nghiệp</label>
            <input
              type="text"
              {...register('profession')}
              className={inputClass}
            />
          </div>
        </div>

        {/* === SUBMIT BUTTON === */}
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