import { apiGet, apiPatch, apiDelete } from '../api/api';
import { AdminUser, Role } from '../types/user';
import {
  PaginatedAdminContracts,
  PaginatedAdminCards,
  GetAdminContractsParams,
  GetAdminCardsParams,
} from '../types/admin-tables';

export interface AdminDashboardStats {
  totalUsers: number;
  totalContracts: number;
  totalCards: number;
  avgCardsPerUser: number;
}

export const adminService = {
  getUsers: () => apiGet<AdminUser[]>('/admin/users'),

  updateRole: (id: number, role: Role) =>
    apiPatch<AdminUser, { role: Role }>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: number) =>
    apiDelete<{ message: string }>(`/admin/users/${id}`),

  listContracts: (
    params: GetAdminContractsParams & Record<string, any>,
  ): Promise<PaginatedAdminContracts> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.type) query.set('type', params.type);

    // 1. Quét toàn bộ các biến lọc dạng phẳng (flat) từ Zustand
    // Đã thêm 'columnFilters' vào danh sách đen để NestJS không báo lỗi 400
    const excludeKeys = ['page', 'pageSize', 'search', 'type', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

    // 2. Vẫn giữ lại params.filters đề phòng trường hợp dùng ở nơi khác
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) query.set(key, String(value));
      });
    }

    return apiGet<PaginatedAdminContracts>(
      `/admin/contracts?${query.toString()}`,
    );
  },

  listCards: (
    params: GetAdminCardsParams & Record<string, any>
  ): Promise<PaginatedAdminCards> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    
    if (params.search?.trim()) query.set('search', params.search.trim());

    // 1. Quét toàn bộ các biến lọc dạng phẳng (flat) từ Zustand
    // Đã thêm 'columnFilters' vào danh sách đen để NestJS không báo lỗi 400
    const excludeKeys = ['page', 'pageSize', 'search', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

    // 2. Vẫn giữ lại params.filters 
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) query.set(key, String(value));
      });
    }
    
    return apiGet<PaginatedAdminCards>(`/admin/cards?${query.toString()}`);
  },

  getStats: () => apiGet<AdminDashboardStats>('/admin/stats'),
};