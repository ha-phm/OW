import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { cardService } from '../services/card.service';

export const CARDS_QUERY_KEY = 'my-cards';

export function useCards(
  search: string, 
  page: number, 
  pageSize: number = 6,
  // 1. Thêm 2 tham số sắp xếp vào Hook
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) {
  return useQuery({
    // 2. Ném sortBy và sortOrder vào mảng queryKey. 
    // Nhờ vậy, mỗi lần bạn click cột trên bảng, React Query sẽ tự động gọi lại API.
    queryKey: [CARDS_QUERY_KEY, search, page, pageSize, sortBy, sortOrder],
    
    // 3. Truyền tiếp xuống file Service
    queryFn: () => cardService.listMine(search, page, pageSize, sortBy, sortOrder),
    
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}