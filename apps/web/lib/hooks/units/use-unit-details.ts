import { useQuery } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { unitKeys } from './unit-keys';
import { UnitDetail } from '@/lib/types';

interface UseUnitDetailsProps {
  unitId: string;
  enabled?: boolean;
}

/**
 * Hook để lấy thông tin chi tiết của một đơn vị cho thuê
 */
export function useUnitDetails(props: UseUnitDetailsProps) {
  const { unitId, enabled = true } = props;
  const unitApi = useUnitApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery<UnitDetail, Error>({
    queryKey: unitKeys.detail(unitId),
    queryFn: async () => {
      const response = await unitApi.getUnitById(unitId);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data as UnitDetail;
    },
    enabled: enabled && !!unitId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
}
