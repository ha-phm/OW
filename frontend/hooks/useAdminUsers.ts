import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Role } from '@/types/user';
import { toast } from 'sonner';
import { GetAdminUsersParams } from '../types/admin-tables'; 

export function useAdminUsers(params: GetAdminUsersParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    
    // 👇 ĐÂY CHÍNH LÀ DÒNG MÀ REACT QUERY ĐANG BÁO THIẾU
    queryFn: () => adminService.listUsers(params), 
    
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => adminService.updateRole(id, role),
    onSuccess: () => {
      toast.success('Cập nhật quyền thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Không thể cập nhật quyền'),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Không thể vô hiệu hóa tài khoản'),
  });
}

// Nhớ export thêm useRestoreUser nhé
export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.restoreUser(id),
    onSuccess: () => {
      toast.success('Đã khôi phục tài khoản thành công');
      // Refetch lại danh sách user để giao diện cập nhật ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Không thể khôi phục tài khoản'),
  });
}