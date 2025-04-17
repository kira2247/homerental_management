import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePropertyApi, UpdatePropertyRequest, Property } from '@/lib/api';
import { propertyKeys, toQueryKey } from './property-keys';
import { useAuthStatus } from '@/lib/hooks/auth';
import { formatApiError, createErrorFromResponse, handleApiError, isApiSuccess } from '@/lib/api/helpers';
import { ApiResponse } from '@/lib/types/api-types';

interface BulkUpdatePropertiesRequest {
  /**
   * Array of property IDs to update
   */
  propertyIds: string[];
  
  /**
   * Data to update for all selected properties
   */
  data: Partial<UpdatePropertyRequest>;
}

interface BulkUpdateResponse {
  /**
   * Number of successfully updated properties
   */
  updatedCount: number;
  
  /**
   * Array of updated property data
   */
  updatedProperties: Property[];
  
  /**
   * Array of errors for failed updates
   */
  errors: Array<{
    propertyId: string;
    message: string;
  }>;
}

interface UseBulkUpdatePropertiesProps {
  /**
   * Whether to log debug information in development mode
   */
  debug?: boolean;
}

/**
 * Hook để cập nhật hàng loạt bất động sản cùng một lúc
 * @param options Tùy chọn cấu hình
 * @returns Mutation cho việc cập nhật hàng loạt bất động sản
 */
export function useBulkUpdateProperties(options: UseBulkUpdatePropertiesProps = {}) {
  const { debug = false } = options;
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation<ApiResponse<BulkUpdateResponse>, Error, BulkUpdatePropertiesRequest>({
    mutationFn: async ({ propertyIds, data }: BulkUpdatePropertiesRequest): Promise<ApiResponse<BulkUpdateResponse>> => {
      // Kiểm tra nếu đang trong quá trình logout
      if (isLoggingOut) {
        return {
          success: false,
          error: {
            message: 'Không thể thực hiện khi đang đăng xuất',
            code: 'USER_LOGGING_OUT' // Sử dụng mã lỗi chuẩn hóa từ ErrorCode
          }
        };
      }
      
      if (!propertyIds || propertyIds.length === 0) {
        return {
          success: false,
          error: {
            message: 'Không có bất động sản nào được chọn để cập nhật',
            code: 'INVALID_PARAMETER' // Sử dụng mã lỗi chuẩn hóa từ ErrorCode
          }
        };
      }
      
      if (!data || Object.keys(data).length === 0) {
        return {
          success: false,
          error: {
            message: 'Không có dữ liệu nào được cung cấp để cập nhật',
            code: 'INVALID_REQUEST' // Sử dụng mã lỗi chuẩn hóa từ ErrorCode
          }
        };
      }
      
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useBulkUpdateProperties] Bắt đầu cập nhật hàng loạt', {
          propertyCount: propertyIds.length,
          updateData: data
        });
      }
      
      // Thực hiện các request cập nhật song song
      const updatePromises = propertyIds.map(id => 
        propertyApi.updateProperty(id, data)
          .then((response: ApiResponse<any>) => ({ id, response, success: response.success }))
          .catch((error: Error) => {
            // Sử dụng formatApiError để xử lý lỗi một cách chuẩn hóa
            const errorMessage = error instanceof Error ? error.message : formatApiError({
              success: false,
              error: {
                code: 'UNKNOWN_ERROR',
                message: String(error)
              }
            });
            return { 
              id, 
              success: false, 
              error: errorMessage
            };
          })
      );
      
      const results = await Promise.all(updatePromises);
      
      // Tính số lượng cập nhật thành công và thất bại
      const successResults = results.filter(result => result.success);
      const failedResults = results.filter(result => !result.success);
      
      // Lấy các property đã cập nhật thành công
      const updatedProperties = successResults
        .map(result => (result as any).response?.data)
        .filter(Boolean);
      
      // Định dạng thông tin lỗi
      const errors = failedResults.map(result => ({
        propertyId: result.id,
        message: (result as any).error?.message || (result as any).response?.error?.message || 'Lỗi không xác định'
      }));
      
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useBulkUpdateProperties] Kết quả cập nhật hàng loạt', {
          totalUpdated: successResults.length,
          totalFailed: failedResults.length,
          errors: errors.length > 0 ? errors : 'None'
        });
      }
      
      // Thay đổi cách trả về kết quả, đảm bảo success luôn là true/false chính xác
      if (successResults.length > 0) {
        // Trường hợp thành công (ít nhất 1 item)
        return {
          success: true,
          data: {
            updatedCount: successResults.length,
            updatedProperties,
            errors
          }
        };
      } else {
        // Trường hợp tất cả đều thất bại
        return {
          success: false,
          error: {
            message: `Tất cả ${failedResults.length} bất động sản cập nhật không thành công`,
            code: 'OPERATION_NOT_ALLOWED' // Sử dụng mã lỗi chuẩn hóa từ ErrorCode
          }
        };
      }
    },
    onSuccess: (data) => {
      // Chỉ xử lý khi response thành công và có dữ liệu
      if (isApiSuccess(data)) {
        const { updatedProperties } = data.data;
        
        // Cập nhật cache cho từng property đã cập nhật thành công
        updatedProperties.forEach((property: Property) => {
          const propertyId = property.id;
          
          // Cập nhật cache chi tiết
          queryClient.setQueryData(
            toQueryKey(propertyKeys.detail(propertyId)),
            property
          );
        });
        
        // Invalidate danh sách properties để đảm bảo dữ liệu mới nhất
        queryClient.invalidateQueries({
          queryKey: toQueryKey(propertyKeys.lists())
        });
        
        if (debug && process.env.NODE_ENV !== 'production') {
          console.debug('[useBulkUpdateProperties] Đã cập nhật cache sau khi cập nhật hàng loạt', {
            updatedCount: updatedProperties.length
          });
        }
      } else if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useBulkUpdateProperties] Không có dữ liệu cập nhật thành công');
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
      console.error('[useBulkUpdateProperties] Lỗi khi cập nhật hàng loạt:', formattedError);
    }
  });
} 











