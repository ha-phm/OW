'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiPost } from '../../../lib/api'; // Đường dẫn tới axios interceptor của bạn
import { createClientSchema, CreateClientFormValues } from '../../../schema/client.schema';

export default function CreateClientPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      gender: 'F',
      salutationCode: 'MR',
      maritalStatusCode: 'S',
      branch: '0101', // Mặc định như template
    },
  });

  const onSubmit = async (data: CreateClientFormValues) => {
    try {
      console.log('Dữ liệu chuẩn bị gửi xuống NestJS:', data);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiPost<any, CreateClientFormValues>('/clients', data);
      
      if (response.data?.success) {
        alert('Tạo khách hàng thành công!');
        // Xử lý logic tiếp theo (chuyển trang, load lại dữ liệu...)
      }
    } catch (error) {
      console.error('Lỗi khi tạo client:', error);
      alert('Tạo khách hàng thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 border-b pb-2">Đăng ký Hồ sơ Khách hàng</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Nhóm Thông tin cá nhân */}
        <fieldset className="border p-4 rounded-md">
          <legend className="font-semibold text-lg px-2 text-blue-600">Thông tin cá nhân</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div>
              <label className="block font-medium mb-1">Họ *</label>
              <input {...register('lastName')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Tên đệm</label>
              <input {...register('middleName')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Tên *</label>
              <input {...register('firstName')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày sinh *</label>
              <input type="date" {...register('birthDate')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Giới tính *</label>
              <select {...register('gender')} className="w-full border border-gray-400 p-2 rounded bg-white">
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Danh xưng *</label>
              <select {...register('salutationCode')} className="w-full border border-gray-400 p-2 rounded bg-white">
                <option value="MR">Ông (MR)</option>
                <option value="MRS">Bà (MRS)</option>
                <option value="MS">Cô (MS)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Hôn nhân *</label>
              <select {...register('maritalStatusCode')} className="w-full border border-gray-400 p-2 rounded bg-white">
                <option value="S">Độc thân</option>
                <option value="M">Đã kết hôn</option>
                <option value="D">Ly dị</option>
                <option value="W">Góa</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Nhóm Liên hệ & Định danh */}
        <fieldset className="border p-4 rounded-md">
          <legend className="font-semibold text-lg px-2 text-blue-600">Liên hệ & Định danh</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block font-medium mb-1">Số điện thoại *</label>
              <input {...register('mobilePhone')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.mobilePhone && <p className="text-red-500 text-sm mt-1">{errors.mobilePhone.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Email *</label>
              <input type="email" {...register('email')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">CCCD / CMND *</label>
              <input {...register('identityCardNumber')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.identityCardNumber && <p className="text-red-500 text-sm mt-1">{errors.identityCardNumber.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Nơi cấp / Chi tiết CCCD</label>
              <input {...register('identityCardDetails')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Mã số BHXH *</label>
              <input {...register('socialSecurityNumber')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.socialSecurityNumber && <p className="text-red-500 text-sm mt-1">{errors.socialSecurityNumber.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Mã số thuế (Tùy chọn)</label>
              <input {...register('individualTaxpayerNumber')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
          </div>
        </fieldset>

        {/* Nhóm Địa chỉ & Nghề nghiệp */}
        <fieldset className="border p-4 rounded-md">
          <legend className="font-semibold text-lg px-2 text-blue-600">Địa chỉ & Công việc</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Địa chỉ (Số nhà, đường) *</label>
              <input {...register('addressLine1')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Thành phố *</label>
              <input {...register('city')} className="w-full border border-gray-400 p-2 rounded" />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block font-medium mb-1">Tên Công ty</label>
              <input {...register('companyName')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Nghề nghiệp</label>
              <input {...register('profession')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
            <div>
              <label className="block font-medium mb-1">Mã Chi nhánh (Branch)</label>
              <input {...register('branch')} className="w-full border border-gray-400 p-2 rounded" />
            </div>
          </div>
        </fieldset>

        {/* Nút Submit */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Tạo Hồ Sơ'}
          </button>
        </div>

      </form>
    </div>
  );
}