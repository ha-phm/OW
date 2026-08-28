export type Role = 'USER' | 'ADMIN';

export interface AdminUser {
  id: number;
  email: string;
  clientId: string | null;
  clientNumber: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthMe {
  userId: number;
  email: string;
  role: Role;
  clientId: string | null;
}