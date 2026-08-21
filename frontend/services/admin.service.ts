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
    // THAY ĐỔI: Dùng unknown thay vì any để vượt qua ESLint
    params: GetAdminContractsParams & Record<string, unknown>,
  ): Promise<PaginatedAdminContracts> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    
    if (params.search && typeof params.search === 'string') {
      query.set('search', params.search.trim());
    }
    if (params.type && typeof params.type === 'string') {
      query.set('type', params.type);
    }

    // 1. Quét toàn bộ các biến lọc dạng phẳng (flat) từ Zustand
    const excludeKeys = ['page', 'pageSize', 'search', 'type', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

    // 2. Vẫn giữ lại params.filters đề phòng trường hợp dùng ở nơi khác
    if (params.filters && typeof params.filters === 'object') {
      Object.entries(params.filters as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value));
        }
      });
    }

    return apiGet<PaginatedAdminContracts>(
      `/admin/contracts?${query.toString()}`,
    );
  },

  listCards: (
    // THAY ĐỔI: Dùng unknown thay vì any để vượt qua ESLint
    params: GetAdminCardsParams & Record<string, unknown>
  ): Promise<PaginatedAdminCards> => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    
    if (params.search && typeof params.search === 'string') {
      query.set('search', params.search.trim());
    }

    // 1. Quét toàn bộ các biến lọc dạng phẳng (flat) từ Zustand
    const excludeKeys = ['page', 'pageSize', 'search', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

    // 2. Vẫn giữ lại params.filters 
    if (params.filters && typeof params.filters === 'object') {
      Object.entries(params.filters as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.set(key, String(value));
        }
      });
    }
    
    return apiGet<PaginatedAdminCards>(`/admin/cards?${query.toString()}`);
  },

  getStats: () => apiGet<AdminDashboardStats>('/admin/stats'),
};