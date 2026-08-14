import { apiGet, apiPatch, apiDelete } from '../api/api';
import { AdminUser, Role } from '../types/user';
import {
  PaginatedAdminContracts,
  PaginatedAdminCards,
  GetAdminContractsParams,
  GetAdminCardsParams,
} from '../types/admin-tables';

export const adminService = {
  getUsers: () => apiGet<AdminUser[]>('/admin/users'),

  updateRole: (id: number, role: Role) =>
    apiPatch<AdminUser, { role: Role }>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: number) =>
    apiDelete<{ message: string }>(`/admin/users/${id}`),

  listContracts: (
    params: GetAdminContractsParams,
  ): Promise<PaginatedAdminContracts> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.type) query.set('type', params.type);
    return apiGet<PaginatedAdminContracts>(
      `/admin/contracts?${query.toString()}`,
    );
  },

  listCards: (params: GetAdminCardsParams): Promise<PaginatedAdminCards> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    return apiGet<PaginatedAdminCards>(`/admin/cards?${query.toString()}`);
  },
};
