import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { unitKeys } from './unit-keys';
import { propertyKeys } from '../properties/property-keys';
import { UpdateUnitRequest, UnitDetail } from '@/lib/types';

interface UpdateUnitParams {
  unitId: string;
  data: UpdateUnitRequest;
}

interface UseUpdateUnitOptions {
  onSuccess?: (data: UnitDetail) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook để cập nhật thông tin đơn vị cho thuê
 */
export function useUpdateUnit(options?: UseUpdateUnitOptions) {
  const unitApi = useUnitApi();
  const queryClient = useQueryClient();
  
  return useMutation<UnitDetail, Error, UpdateUnitParams>({
    mutationFn: async ({ unitId, data }: UpdateUnitParams) => {
      const response = await unitApi.updateUnit(unitId, data);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data as UnitDetail;
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.detail(variables.unitId) });
      queryClient.invalidateQueries({ queryKey: unitKeys.summary(variables.unitId) });
      
      // Nếu có propertyId trong data, invalidate các queries liên quan đến property
      const unitData = data as UnitDetail;
      if (unitData.propertyId) {
        queryClient.invalidateQueries({ 
          queryKey: unitKeys.byProperty(unitData.propertyId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: propertyKeys.detail(unitData.propertyId) 
        });
      }
      
      // Gọi callback onSuccess nếu có
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: Error) => {
      // Gọi callback onError nếu có
      if (options?.onError) {
        options.onError(error);
      }
    }
  });
}
