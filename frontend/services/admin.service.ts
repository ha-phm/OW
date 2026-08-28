import { apiGet, apiPatch, apiDelete } from '../api/api';
import { AdminUser, Role } from '../types/user';
import {
  PaginatedAdminContracts,
  PaginatedAdminCards,
  PaginatedAdminUsers, 
  GetAdminContractsParams,
  GetAdminCardsParams,
  GetAdminUsersParams, 
} from '../types/admin-tables';

export interface AdminDashboardStats {
  totalUsers: number;
  totalContracts: number;
  totalCards: number;
  avgCardsPerUser: number;
}

export const adminService = {
  // ---------------------------------------------------------------------
  // QUẢN LÝ NGƯỜI DÙNG
  // ---------------------------------------------------------------------
  listUsers: (
    params: GetAdminUsersParams & Record<string, unknown>
  ): Promise<PaginatedAdminUsers> => {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    });
    
    if (params.search && typeof params.search === 'string') {
      query.set('search', params.search.trim());
    }

    const excludeKeys = ['page', 'pageSize', 'search', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

    return apiGet<PaginatedAdminUsers>(`/admin/users?${query.toString()}`);
  },

  updateRole: (id: number, role: Role) =>
    apiPatch<AdminUser, { role: Role }>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: number) =>
    apiDelete<{ message: string }>(`/admin/users/${id}`),

  // ---------------------------------------------------------------------
  // QUẢN LÝ HỢP ĐỒNG
  // ---------------------------------------------------------------------
  listContracts: (
    params: GetAdminContractsParams & Record<string, unknown>,
  ): Promise<PaginatedAdminContracts> => {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    });
    
    if (params.search && typeof params.search === 'string') {
      query.set('search', params.search.trim());
    }
    if (params.type && typeof params.type === 'string') {
      query.set('type', params.type);
    }

    const excludeKeys = ['page', 'pageSize', 'search', 'type', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

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

  // ---------------------------------------------------------------------
  // QUẢN LÝ THẺ
  // ---------------------------------------------------------------------
  listCards: (
    params: GetAdminCardsParams & Record<string, unknown>
  ): Promise<PaginatedAdminCards> => {
    const query = new URLSearchParams({
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    });
    
    if (params.search && typeof params.search === 'string') {
      query.set('search', params.search.trim());
    }

    const excludeKeys = ['page', 'pageSize', 'search', 'filters', 'columnFilters'];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !excludeKeys.includes(key)) {
        query.set(key, String(value));
      }
    });

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