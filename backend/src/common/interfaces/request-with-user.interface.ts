/**
 * Kiểu dữ liệu chuẩn cho `req.user` được inject bởi JwtStrategy sau khi
 * xác thực JWT. Dùng chung cho mọi controller thay vì định nghĩa lại
 * `RequestWithUser` tại từng file.
 */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
  clientId: string | null;
  clientNumber: string | null;
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
