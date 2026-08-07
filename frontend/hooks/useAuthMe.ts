import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/api';
import { AuthMe } from '@/types/user';

export function useAuthMe() {
  return useQuery({
    queryKey: ['authMe'],
    queryFn: () => apiGet<AuthMe>('/auth/me'),
  });
}