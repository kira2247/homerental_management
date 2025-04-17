import { useQuery } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { unitKeys } from './unit-keys';
import { UnitSummary } from '@/lib/types';

interface UseUnitSummaryProps {
  unitId: string;
  enabled?: boolean;
}

/**
 * Hook để lấy thông tin tóm tắt của một đơn vị cho thuê
 */
export function useUnitSummary(props: UseUnitSummaryProps) {
  const { unitId, enabled = true } = props;
  const unitApi = useUnitApi();
  const { isLoggingOut } = useAuth();
  
  return useQuery<UnitSummary, Error>({
    queryKey: unitKeys.summary(unitId),
    queryFn: async () => {
      const response = await unitApi.getUnitSummary(unitId);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data as UnitSummary;
    },
    enabled: enabled && !!unitId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
}
