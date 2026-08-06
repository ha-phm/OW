import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Role } from '@/types/user';
import { toast } from 'sonner';

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: adminService.getUsers });
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
      toast.success('Đã xoá người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Không thể xoá người dùng'),
  });
}