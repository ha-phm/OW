export type Role = 'USER' | 'ADMIN';

export interface AdminUser {
  id: number;
  email: string;
  clientId: string | null;
  clientNumber: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthMe {
  userId: number;
  email: string;
  role: Role;
  clientId: string | null;
}