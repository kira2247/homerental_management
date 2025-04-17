import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePropertyApi, CreatePropertyRequest, UpdatePropertyRequest, Property } from '@/lib/api';
import { ApiResponse, ApiErrorResponse } from '@/lib/types/api-types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { propertyKeys, toQueryKey } from './property-keys';
import { optimisticListUpdate } from '@/lib/utils/optimistic';
import { useOptimisticPropertyUpdate } from './use-optimistic-property-update';
import { isApiSuccess, formatApiError, createErrorFromResponse } from '@/lib/api/helpers';

/**
 * Type định nghĩa cho context trong optimistic update
 * Đảm bảo rõ ràng trường previousProperty
 */
interface PropertyMutationContext {
  previousProperty?: Property | unknown;
  id?: string;
}

interface UsePropertyMutationOptions {
  /** 
   * Kích hoạt logs debug thêm (chỉ trong môi trường development)
   */
  debug?: boolean;
  
  /**
   * Tự động invalidate các queries sau khi mutation thành công
   * @default true
   */
  autoInvalidateQueries?: boolean;
}

/**
 * Hook để tạo mới bất động sản
 * @param options Tùy chọn cấu hình cho mutation hook
 * @returns Mutation object cho việc tạo mới bất động sản
 */
export function useCreateProperty(options: UsePropertyMutationOptions = {}) {
  const { 
    debug = false, 
    autoInvalidateQueries = true 
  } = options;
  
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation<Property, Error, CreatePropertyRequest>({
    mutationFn: async (data: CreatePropertyRequest): Promise<Property> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        throw new Error('Không thể thực hiện khi đang đăng xuất');
      }
      
      try {
        // Kiểm tra thông tin userId và ownerId trước khi gửi request
        if (!data.userId) {
          console.error('useCreateProperty: Thiếu userId trong dữ liệu gửi đi');
          throw new Error('Thiếu thông tin người dùng (userId)');
        }
        
        if (!data.ownerId) {
          console.error('useCreateProperty: Thiếu ownerId trong dữ liệu gửi đi');
          throw new Error('Thiếu thông tin chủ sở hữu (ownerId)');
        }
        
        // Xóa thumbnail rỗng để backend xử lý mặc định
        const cleanedData = { ...data };
        if (cleanedData.thumbnail === "" || !cleanedData.thumbnail) {
          delete cleanedData.thumbnail;
        }
        
        if (debug) {
          console.debug('[useCreateProperty] Dữ liệu đã làm sạch trước khi gửi:', cleanedData);
        }
        
        const response = await propertyApi.createProperty(cleanedData);
        
        if (debug) {
          console.debug('[useCreateProperty] Phản hồi API gốc:', response);
        }
        
        // Kiểm tra response và đảm bảo dữ liệu đầy đủ
        if (isApiSuccess(response)) {
          // Trong trường hợp API trả về nested data object (data.data)
          if (response?.data && typeof response.data === 'object' && 'data' in response.data && response.data.data) {
            return response.data.data as Property;
          }
          
          // Trong trường hợp API trả về data trực tiếp
          return response.data as Property;
        } else {
          // Xử lý lỗi từ API sử dụng helper function
          console.error('[useCreateProperty] API trả về lỗi:', response.error);
          throw createErrorFromResponse(response);
        }
      } catch (error) {
        console.error('[useCreateProperty] Lỗi khi gọi API:', error);
        // Đảm bảo error được trả về với định dạng chuẩn
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Lỗi không xác định khi tạo bất động sản');
        }
      }
    },
    onSuccess: (property) => {
      // Xử lý dữ liệu trả về từ API
      if (debug) {
        console.debug('[useCreateProperty] onSuccess với dữ liệu:', property);
      }
      
      // Kiểm tra cả hai trường hợp cấu trúc dữ liệu
      // 1. Trường hợp property.id tồn tại (cấu trúc cũ)
      // 2. Trường hợp property.data.id tồn tại (cấu trúc mới/thực tế từ backend)
      let propertyId;
      
      if (property && typeof property === 'object') {
        if ('id' in property) {
          propertyId = (property as any).id;
        } else if ('data' in property && (property as any).data && typeof (property as any).data === 'object') {
          propertyId = (property as any).data.id;
        }
      }
      
      if (propertyId) {
        if (debug) {
          console.debug('[useCreateProperty] Đã trích xuất ID thành công:', propertyId);
        }
        
        if (autoInvalidateQueries) {
          // Invalidate tất cả các queries liên quan đến properties
          queryClient.invalidateQueries({ 
            queryKey: toQueryKey(propertyKeys.all())
          });
        }
        
        // Cache kết quả cho chi tiết bất động sản
        queryClient.setQueryData(
          toQueryKey(propertyKeys.detail(propertyId)), 
          property
        );
      } else {
        console.warn('[useCreateProperty] Không thể xác định ID từ phản hồi API:', property);
      }
    },
    onError: (error) => {
      // Sử dụng formatApiError để hiển thị lỗi một cách chuẩn hóa
      const formattedError = error instanceof Error ? error.message : formatApiError({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error)
        }
      });
      console.error('[useCreateProperty] onError:', formattedError);
    }
  });
}

/**
 * Hook để cập nhật bất động sản
 * @param options Tùy chọn cấu hình cho mutation hook
 * @returns Mutation object cho việc cập nhật bất động sản
 */
export function useUpdateProperty(options: UsePropertyMutationOptions = {}) {
  const { 
    debug = false, 
    autoInvalidateQueries = true 
  } = options;
  
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  const optimisticUpdate = useOptimisticPropertyUpdate({ debug });
  
  return useMutation<Property, Error, { id: string; data: UpdatePropertyRequest }>({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePropertyRequest }): Promise<Property> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        throw new Error('Không thể thực hiện khi đang đăng xuất');
      }
      
      try {
        const response = await propertyApi.updateProperty(id, data);
        
        if (isApiSuccess(response)) {
          // Thêm type assertion để đảm bảo TypeScript hiểu rằng đây là Property object
          return response.data as Property;
        } else {
          // Xử lý lỗi từ API sử dụng helper function
          console.error(`[useUpdateProperty] API trả về lỗi cho ID ${id}:`, response.error);
          throw createErrorFromResponse(response);
        }
      } catch (error) {
        console.error('[useUpdateProperty] Lỗi khi gọi API:', error);
        throw error;
      }
    },
    onMutate: async ({ id, data }): Promise<PropertyMutationContext> => {
      // Hủy các queries đang thực hiện để tránh overwrite optimistic update
      await queryClient.cancelQueries({ 
        queryKey: toQueryKey(propertyKeys.detail(id))
      });
      
      // Lưu trạng thái trước khi update
      const previousProperty = optimisticUpdate.saveOriginalProperty(id);
      
      // Thực hiện optimistic update
      optimisticUpdate.updatePropertyData(id, data as Partial<Property>);
      
      // Đảm bảo trả về object với đúng kiểu
      return { previousProperty, id };
    },
    onSuccess: (updatedProperty, { id }) => {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useUpdateProperty] onSuccess với dữ liệu:', updatedProperty);
      }
      
      if (autoInvalidateQueries) {
        // Cập nhật chi tiết bất động sản
        queryClient.setQueryData(
          toQueryKey(propertyKeys.detail(id)),
          updatedProperty
        );
        
        // Invalidate danh sách properties
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.lists())
        });
      }
    },
    onError: (error, { id }, context: unknown) => {
      // Sử dụng formatApiError để hiển thị lỗi một cách chuẩn hóa
      const formattedError = error instanceof Error ? error.message : formatApiError({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error)
        }
      });
      console.error(`[useUpdateProperty] onError cho ID ${id}:`, formattedError);
      
      // Khôi phục dữ liệu gốc nếu có
      if (context && (context as any)?.previousProperty) {
        optimisticUpdate.rollbackPropertyData(id, (context as any)?.previousProperty);
      }
    },
    onSettled: (_, __, { id }) => {
      if (autoInvalidateQueries) {
        // Đảm bảo dữ liệu đồng bộ với server
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.detail(id))
        });
      }
    }
  });
}

/**
 * Hook để xóa bất động sản
 * @param options Tùy chọn cấu hình cho mutation hook
 * @returns Mutation object cho việc xóa bất động sản
 */
export function useDeleteProperty(options: UsePropertyMutationOptions = {}) {
  const { 
    debug = false, 
    autoInvalidateQueries = true 
  } = options;
  
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        throw new Error('Không thể thực hiện khi đang đăng xuất');
      }
      
      try {
        const response = await propertyApi.deleteProperty(id);
        
        if (!isApiSuccess(response)) {
          const errorMessage = response.error?.message || 'Không thể xóa bất động sản';
          console.error('[useDeleteProperty] API trả về lỗi:', errorMessage);
          throw new Error(errorMessage);
        }
        
        return;
      } catch (error) {
        console.error('[useDeleteProperty] Lỗi khi gọi API:', error);
        throw error;
      }
    },
    onMutate: async (id: string): Promise<PropertyMutationContext> => {
      // Hủy các queries đang thực hiện
      await queryClient.cancelQueries({
        queryKey: toQueryKey(propertyKeys.detail(id))
      });
      
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useDeleteProperty] onMutate cho property ID:', id);
      }
      
      return { id };
    },
    onSuccess: (_, deletedId) => {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useDeleteProperty] onSuccess cho property ID:', deletedId);
      }
      
      if (autoInvalidateQueries) {
        // Xóa cache danh sách properties khi xóa thành công
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.lists())
        });
        
        // Xóa cache chi tiết property
        queryClient.removeQueries({
          queryKey: toQueryKey(propertyKeys.detail(deletedId))
        });
      }
    },
    onError: (error) => {
      // Sử dụng formatApiError để hiển thị lỗi một cách chuẩn hóa
      const formattedError = error instanceof Error ? error.message : formatApiError({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error)
        }
      });
      console.error('[useDeleteProperty] onError:', formattedError);
    }
  });
}

/**
 * Hook để cập nhật trạng thái bất động sản
 * @param options Tùy chọn cấu hình cho mutation hook
 * @returns Mutation object cho việc cập nhật trạng thái bất động sản
 */
export function useUpdatePropertyStatus(options: UsePropertyMutationOptions = {}) {
  const { 
    debug = false, 
    autoInvalidateQueries = true 
  } = options;
  
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  const optimisticUpdate = useOptimisticPropertyUpdate({ debug });
  
  return useMutation<Property, Error, { id: string; status: string }>({
    mutationFn: async ({ id, status }): Promise<Property> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        throw new Error('Không thể thực hiện khi đang đăng xuất');
      }
      
      try {
        const response = await propertyApi.updatePropertyStatus(id, status as any);
        
        if (isApiSuccess(response)) {
          // Thêm type assertion để đảm bảo TypeScript hiểu rằng đây là Property object
          return response.data as Property;
        } else {
          const errorMessage = response.error?.message || 'Không thể cập nhật trạng thái bất động sản';
          console.error('[useUpdatePropertyStatus] API trả về lỗi:', errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('[useUpdatePropertyStatus] Lỗi khi gọi API:', error);
        throw error;
      }
    },
    onMutate: async ({ id, status }): Promise<PropertyMutationContext> => {
      // Lưu trạng thái trước khi update
      const previousProperty = optimisticUpdate.saveOriginalProperty(id);
      
      // Thực hiện optimistic update
      optimisticUpdate.updatePropertyData(id, { status: status as any });
      
      // Đảm bảo trả về object với đúng kiểu
      return { previousProperty, id };
    },
    onSuccess: (updatedProperty, { id }) => {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useUpdatePropertyStatus] onSuccess cho property ID:', id);
      }
      
      if (autoInvalidateQueries) {
        // Cập nhật chi tiết bất động sản
        queryClient.setQueryData(
          toQueryKey(propertyKeys.detail(id)),
          updatedProperty
        );
        
        // Invalidate danh sách properties
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.lists())
        });
      }
    },
    onError: (error, { id }, context: unknown) => {
      // Sử dụng formatApiError để hiển thị lỗi một cách chuẩn hóa
      const formattedError = error instanceof Error ? error.message : formatApiError({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error)
        }
      });
      console.error('[useUpdatePropertyStatus] onError:', formattedError);
      
      // Khôi phục dữ liệu gốc nếu có
      if (context && (context as any)?.previousProperty) {
        optimisticUpdate.rollbackPropertyData(id, (context as any)?.previousProperty);
      }
    },
    onSettled: (_, __, { id }) => {
      if (autoInvalidateQueries) {
        // Đảm bảo dữ liệu đồng bộ với server
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.detail(id))
        });
      }
    }
  });
}

/**
 * Type mở rộng cho response của upload image API
 */
interface UploadImagesResponse {
  urls: string[];
}

/**
 * Hook để tải lên hình ảnh bất động sản
 * @param options Tùy chọn cấu hình cho mutation hook
 * @returns Mutation object cho việc tải lên hình ảnh bất động sản
 */
export function useUploadPropertyImages(options: UsePropertyMutationOptions = {}) {
  const { 
    debug = false, 
    autoInvalidateQueries = true 
  } = options;
  
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation<string[], Error, { id: string; images: File[] }>({
    mutationFn: async ({ id, images }): Promise<string[]> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        throw new Error('Không thể thực hiện khi đang đăng xuất');
      }
      
      try {
        const response = await propertyApi.uploadPropertyImages(id, images);
        
        if (isApiSuccess(response)) {
          // Thêm type assertion để giải quyết vấn đề với property 'urls'
          const responseData = response.data as UploadImagesResponse;
          
          if (responseData.urls && Array.isArray(responseData.urls)) {
            return responseData.urls;
          } else {
            throw new Error('Response không chứa danh sách URLs hợp lệ');
          }
        } else {
          // Xử lý lỗi từ API sử dụng helper function
          console.error('[useUploadPropertyImages] API trả về lỗi:', response.error);
          throw createErrorFromResponse(response);
        }
      } catch (error) {
        console.error('[useUploadPropertyImages] Lỗi khi gọi API:', error);
        throw error;
      }
    },
    onSuccess: (imageUrls, { id }) => {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useUploadPropertyImages] onSuccess với', imageUrls.length, 'hình ảnh đã tải lên');
      }
      
      if (autoInvalidateQueries) {
        // Xóa cache chi tiết property để đảm bảo load lại hình ảnh mới
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(propertyKeys.detail(id))
        });
      }
    },
    onError: (error) => {
      // Sử dụng formatApiError để hiển thị lỗi một cách chuẩn hóa
      const formattedError = error instanceof Error ? error.message : formatApiError({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: String(error)
        }
      });
      console.error('[useUploadPropertyImages] onError:', formattedError);
    }
  });
} 








