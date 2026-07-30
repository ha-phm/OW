'use client';

import { useState } from 'react';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { CreateClientForm } from '../../../components/client/CreateClientForm';
import { apiGet } from '../../../lib/api';

export default function DashboardPage() {
  const { data, isLoading } = useCurrentUser(); // Nên lấy thêm isLoading nếu hook của bạn (như React Query) có hỗ trợ

  // State cục bộ lưu profile vừa tạo xong, để hiện ngay Dashboard chào mừng
  // mà không cần đợi useCurrentUser tự fetch lại hoặc reload trang.
  const [freshProfile, setFreshProfile] = useState<any>(null);

  // 1. Trạng thái đang gọi API: Hiện loading thay vì màn hình trắng
  if (isLoading) return <div className="p-8 text-center">Đang tải thông tin...</div>;
  if (!data) return null; // Fallback khi không có data hoàn toàn

  // 2. Lấy thông tin profile từ dữ liệu trả về (ưu tiên freshProfile nếu vừa tạo xong)
  const profile = freshProfile ?? data.IssClientDetailsV2APIRecord;

  // 3. LOGIC CHUYỂN TIẾP (ROUTING):
  // Nếu profile bị undefined/null (tức là user chưa có hồ sơ WAY4) -> Hiện Form
  if (!profile) {
    return (
      <div className="p-4 md:p-8">
        <CreateClientForm
          onCreated={async () => {
            try {
              // Gọi lại API lấy profile đầy đủ vừa tạo, không cần reload trang
              const me = await apiGet<{ IssClientDetailsV2APIRecord: any }>('/clients/me');
              setFreshProfile(me.IssClientDetailsV2APIRecord);
            } catch (err) {
              console.error('Không lấy được profile sau khi tạo:', err);
            }
          }}
        />
      </div>
    );
  }

  // 4. Nếu ĐÃ CÓ profile -> Hiện Dashboard thật
   const displayName =
    [profile.LastName, profile.MiddleName, profile.FirstName].filter(Boolean).join(' ') ||
    profile.FullName;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Xin chào, {displayName}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard label="Số điện thoại" value={String(profile.MobilePhone || 'Chưa cập nhật')} />
        <InfoCard label="Email" value={profile.EMail || 'Chưa cập nhật'} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}