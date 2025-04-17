import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { unitKeys } from './unit-keys';
import { propertyKeys } from '../properties/property-keys';
import { CreateUnitRequest, UnitDetail } from '@/lib/types';

interface UseCreateUnitOptions {
  onSuccess?: (data: UnitDetail) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook để tạo đơn vị cho thuê mới
 */
export function useCreateUnit(options?: UseCreateUnitOptions) {
  const unitApi = useUnitApi();
  const queryClient = useQueryClient();
  
  return useMutation<UnitDetail, Error, CreateUnitRequest>({
    mutationFn: async (data: CreateUnitRequest) => {
      const response = await unitApi.createUnit(data);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data as UnitDetail;
    },
    onSuccess: (data, variables) => {
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: unitKeys.all() });
      queryClient.invalidateQueries({ 
        queryKey: unitKeys.byProperty(variables.propertyId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: propertyKeys.detail(variables.propertyId) 
      });
      
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
