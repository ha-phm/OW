'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import ProfileView from '../../../components/client/ProfileView';
import ProfileEdit from '../../../components/client/ProfileEdit';

export function CustomerProfilePage() {
  const { data, isLoading, refetch } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-center">Đang tải hồ sơ...</div>;

  const profile = data?.IssClientDetailsV2APIRecord;
  const clientId = data?.clientId;

  if (!profile || !clientId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Bạn chưa có hồ sơ khách hàng. Vui lòng tạo hồ sơ ở trang Tổng quan.
      </div>
    );
  }

  const handleEditSuccess = async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    setIsEditing(false);
  };

  return (
    <>
      {!isEditing ? (
        <ProfileView profile={profile} onEdit={() => setIsEditing(true)} />
      ) : (
        <ProfileEdit 
          profile={profile} 
          clientId={clientId} 
          onCancel={() => setIsEditing(false)} 
          onSuccess={handleEditSuccess} 
        />
      )}
    </>
  );
}

export default CustomerProfilePage;