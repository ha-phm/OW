import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { AdminUser, Role } from '@/types/user';

export const adminService = {
  getUsers: () => apiGet<AdminUser[]>('/admin/users'),
  updateRole: (id: number, role: Role) =>
    apiPatch<AdminUser, { role: Role }>(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: number) => apiDelete<{ message: string }>(`/admin/users/${id}`),
};