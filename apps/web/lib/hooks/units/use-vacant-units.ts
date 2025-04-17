import { useQuery } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { unitKeys } from './unit-keys';
import { UnitWithProperty } from '@/lib/types';

interface UseVacantUnitsProps {
  propertyId: string;
  enabled?: boolean;
}

/**
 * Hook để lấy danh sách đơn vị cho thuê còn trống của một bất động sản
 */
export function useVacantUnits(props: UseVacantUnitsProps) {
  const { propertyId, enabled = true } = props;
  const unitApi = useUnitApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery<UnitWithProperty[], Error>({
    queryKey: unitKeys.vacantByProperty(propertyId),
    queryFn: async () => {
      const response = await unitApi.getVacantUnits(propertyId);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data as UnitWithProperty[];
    },
    enabled: enabled && !!propertyId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
}
