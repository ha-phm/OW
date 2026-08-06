'use client';

import { useCurrentUser } from '../../../hooks/useCurrentUser';

export default function DashboardPage() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) return <div className="p-8 text-center">Đang tải thông tin...</div>;
  if (!data || !data.IssClientDetailsV2APIRecord) {
    return <div className="p-8 text-center text-slate-500">Lỗi: Không tìm thấy hồ sơ hệ thống.</div>;
  } 

  const profile = data.IssClientDetailsV2APIRecord;

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