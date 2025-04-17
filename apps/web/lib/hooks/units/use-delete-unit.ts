import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { unitKeys } from './unit-keys';
import { propertyKeys } from '../properties/property-keys';

interface DeleteUnitParams {
  unitId: string;
  propertyId: string;
}

interface UseDeleteUnitOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook để xóa đơn vị cho thuê
 */
export function useDeleteUnit(options?: UseDeleteUnitOptions) {
  const unitApi = useUnitApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ unitId }: DeleteUnitParams) => {
      const response = await unitApi.deleteUnit(unitId);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      return response.data;
    },
    onSuccess: (_, variables) => {
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
        options.onSuccess();
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
