import { useQuery } from '@tanstack/react-query';
import { usePropertyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { propertyKeys } from './property-keys';

interface UsePropertyDocumentsProps {
  propertyId: string;
  enabled?: boolean;
}

/**
 * Hook để lấy danh sách tài liệu của một bất động sản
 */
export function usePropertyDocuments(props: UsePropertyDocumentsProps) {
  const { propertyId, enabled = true } = props;
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery({
    queryKey: propertyKeys.documents(propertyId),
    queryFn: async () => {
      const response = await propertyApi.getPropertyDocuments(propertyId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Không thể lấy danh sách tài liệu');
      }
      
      return response.data;
    },
    enabled: enabled && !!propertyId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
} 