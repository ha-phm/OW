'use client';

import { Pencil } from 'lucide-react';
import { extractText } from '../utils/client.utils';
import { IssClientDetailsV2APIRecord } from '../hooks/useCurrentUser'
// Khai báo type cho props
interface ProfileViewProps {
  profile: IssClientDetailsV2APIRecord; // Thay 'any' bằng type IssClientDetailsV2APIRecord của bạn nếu có
  onEdit: () => void;
}

export default function ProfileView({ profile, onEdit }: ProfileViewProps) {
  const displayName =
    [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') ||
    profile.FullName;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Hồ sơ khách hàng</h2>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          <Pencil className="h-4 w-4" />
          Chỉnh sửa
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Nhóm 1: Thông tin hệ thống */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Định danh hệ thống</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <ViewField label="Mã khách hàng (Client Number)" value={profile.ClientNumber} />
            <ViewField label="ID Hệ thống" value={profile.ID} />
            <ViewField label="Phân hạng khách hàng" value={extractText(profile.ClientCategory)} />
            <ViewField label="Loại khách hàng" value={extractText(profile.ClientType)} />
            <ViewField label="Trạng thái hồ sơ" value={extractText(profile.LastApplicationStatus)} />
            <ViewField label="Ngày đăng ký" value={profile.RegistrationDate?.split('T')[0]} />
          </div>
        </div>

        {/* Nhóm 2: Thông tin cá nhân & Giấy tờ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <ViewField label="Họ và tên" value={displayName} />
            <ViewField label="Ngày sinh" value={profile.BirthDate} />
            <ViewField label="Giới tính" value={extractText(profile.Gender)} />
            <ViewField label="Quốc tịch" value={extractText(profile.Citizenship)} />
            <ViewField label="Tình trạng hôn nhân" value={extractText(profile.MaritalStatus)} />
            <ViewField label="Số CMND/CCCD" value={profile.IdentityCardNumber} />
            <ViewField label="Chi tiết giấy tờ" value={profile.IdentityCardDetails} />
            <ViewField label="Mã số thuế (MST)" value={profile.IndividualTaxpayerNumber} />
            <ViewField label="Số BHXH" value={profile.SocialSecurityNumber} />
          </div>
        </div>

        {/* Nhóm 3: Thông tin liên lạc & Nghề nghiệp */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-slate-800">Liên hệ & Công việc</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <ViewField label="Email" value={profile.EMail} />
            <ViewField label="Điện thoại di động" value={String(profile.MobilePhone ?? '')} />
            <ViewField label="Điện thoại nhà" value={profile.HomePhone} />
            <ViewField label="Địa chỉ thường trú" value={profile.AddressLine1} />
            <ViewField label="Thành phố" value={profile.City} />
            <ViewField label="Công ty" value={profile.CompanyName} />
            <ViewField label="Nghề nghiệp" value={profile.Profession} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Giữ ViewField ở dạng private component trong file này vì chỉ có ProfileView dùng đến nó
function ViewField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || 'Chưa cập nhật'}</p>
    </div>
  );
}