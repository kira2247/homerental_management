import { useQuery } from '@tanstack/react-query';
import { usePropertyApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { propertyKeys } from './property-keys';
import { Document, PaginatedData } from '@/lib/types';

interface UsePropertyDocumentsProps {
  propertyId: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Hook để lấy danh sách tài liệu của một bất động sản
 */
export function usePropertyDocuments(props: UsePropertyDocumentsProps) {
  const { propertyId, enabled = true, page = 1, limit = 10 } = props;
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery<PaginatedData<Document>>({
    queryKey: propertyKeys.documents(propertyId, { page, limit }),
    queryFn: async () => {
      const response = await propertyApi.getPropertyDocuments(propertyId, { page, limit });
      
      if (!isApiSuccess(response)) {
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
        throw createErrorFromResponse(response);
      }
      
      return response.data as PaginatedData<Document>;
    },
    enabled: enabled && !!propertyId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
}