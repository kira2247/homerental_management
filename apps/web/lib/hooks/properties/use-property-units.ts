import { useQuery } from '@tanstack/react-query';
import { usePropertyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { propertyKeys } from './property-keys';

interface UsePropertyUnitsProps {
  propertyId: string;
  enabled?: boolean;
}

/**
 * Hook để lấy danh sách đơn vị/phòng của một bất động sản
 */
export function usePropertyUnits(props: UsePropertyUnitsProps) {
  const { propertyId, enabled = true } = props;
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery({
    queryKey: propertyKeys.units(propertyId),
    queryFn: async () => {
      const response = await propertyApi.getPropertyUnits(propertyId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Không thể lấy danh sách đơn vị');
      }
      
      return response.data;
    },
    enabled: enabled && !!propertyId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
} 