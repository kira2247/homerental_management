'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/ui/use-toast';
import { useLocale } from '@/lib/i18n/client';
import { propertyKeys, toQueryKey } from '@/lib/hooks/properties/property-keys';

// Định nghĩa kiểu cho dữ liệu liên quan
export interface RelatedDataResponse {
  units?: number;
  maintenanceRequests?: number;
  documents?: number;
  bills?: number;
  total?: number;
}

// Định nghĩa kiểu phản hồi từ API xóa theo chuẩn discriminated union của dự án
export interface DeleteApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: {
      relatedData?: RelatedDataResponse;
    };
  };
}

export interface UseDeleteItemOptions<T> {
  /**
   * Function thực hiện việc xóa item
   * Tham số force: true để xóa tất cả dữ liệu liên quan, false để kiểm tra trước
   */
  deleteFn: (id: string, force: boolean) => Promise<DeleteApiResponse>;
  
  /**
   * Query key để invalidate sau khi xóa
   */
  queryKey: unknown[];
  
  /**
   * Loại item để lấy các key dịch phù hợp
   */
  itemType: 'property' | 'tenant' | 'unit' | 'document' | 'generic';
  
  /**
   * Callback khi xóa thành công
   */
  onSuccess?: (id: string) => void;
  
  /**
   * Callback khi xóa thất bại
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback khi phát hiện dữ liệu liên quan
   */
  onRelatedDataFound?: (relatedData: RelatedDataResponse, id: string) => void;
  
  /**
   * Bật chế độ debug
   */
  debug?: boolean;
}

export interface UseDeleteItemResult<T> {
  /**
   * Trạng thái đang xóa
   */
  isDeleting: boolean;
  
  /**
   * Trạng thái đã xóa thành công
   */
  isSuccess: boolean;
  
  /**
   * Lỗi nếu có
   */
  error: Error | null;
  
  /**
   * Dữ liệu liên quan (nếu có)
   */
  relatedData: RelatedDataResponse | null;
  
  /**
   * Hàm xóa item thông thường (kiểm tra dữ liệu liên quan)
   */
  deleteItem: (id: string, itemName: string) => Promise<boolean>;
  
  /**
   * Hàm force delete item (xóa tất cả dữ liệu liên quan)
   */
  forceDeleteItem: (id: string, itemName: string) => Promise<boolean>;
  
  /**
   * Reset trạng thái
   */
  reset: () => void;
}

/**
 * Hook để xử lý việc xóa một item (property, tenant, unit, ...)
 * Hỗ trợ cả xóa thông thường và force delete
 */
export function useDeleteItem<T>({
  deleteFn,
  queryKey,
  itemType,
  onSuccess,
  onError,
  onRelatedDataFound,
  debug = false
}: UseDeleteItemOptions<T>): UseDeleteItemResult<T> {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedDataResponse | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();
  
  // Lấy key dịch dựa trên loại item
  const getTranslationKey = (key: string): string => {
    const typeMap: Record<string, string> = {
      'property': 'properties.deleteDialog',
      'tenant': 'tenants.deleteDialog',
      'unit': 'units.deleteDialog',
      'document': 'documents.deleteDialog',
      'generic': 'common.deleteDialog'
    };
    
    const baseKey = typeMap[itemType] || 'common.deleteDialog';
    return `${baseKey}.${key}`;
  };
  
  // Reset trạng thái
  const reset = () => {
    setIsDeleting(false);
    setIsSuccess(false);
    setError(null);
    setRelatedData(null);
  };
  
  // Xử lý phản hồi thành công
  const handleSuccess = (id: string, itemName: string, isForceDelete: boolean) => {
    setIsSuccess(true);
    setRelatedData(null);
    
    // Đảm bảo các query được cập nhật
    setTimeout(() => {
      // Invalidate query chính
      queryClient.invalidateQueries({
        queryKey
      });
      
      // Invalidate query count nếu là property
      if (itemType === 'property') {
        // Invalidate tất cả các query count với bất kỳ filter nào
        queryClient.invalidateQueries({
          queryKey: toQueryKey(propertyKeys.count())
        });
        
        // Invalidate danh sách properties
        queryClient.invalidateQueries({
          queryKey: toQueryKey(propertyKeys.lists())
        });
      }
    }, 0); // Giảm thời gian chờ xuống 0 để cập nhật ngay lập tức
    
    // Hiển thị thông báo thành công
    const successKey = isForceDelete ? 'forceDeleteSuccess' : 'successTitle';
    const successDescKey = isForceDelete ? 'forceDeleteSuccessDescription' : 'successDescription';
    
    toast({
      title: t(getTranslationKey(successKey)) || t('common.success') || 'Thành công',
      description: t(getTranslationKey(successDescKey), { name: itemName }) || 
        isForceDelete 
          ? `Đã xóa "${itemName}" và tất cả dữ liệu liên quan thành công.`
          : `Đã xóa "${itemName}" thành công.`,
      variant: 'default',
    });
    
    // Gọi callback onSuccess nếu có
    if (onSuccess) {
      onSuccess(id);
    }
    
    if (debug) {

    }
  };
  
  // Xử lý phản hồi có dữ liệu liên quan
  const handleRelatedData = (foundRelatedData: RelatedDataResponse, id: string, itemName: string) => {

    
    // Đảm bảo relatedData có trường total
    if (!foundRelatedData.total) {

      foundRelatedData.total = (
        (foundRelatedData.units || 0) + 
        (foundRelatedData.maintenanceRequests || 0) + 
        (foundRelatedData.documents || 0) + 
        (foundRelatedData.bills || 0)
      );

    }
    
    // Cập nhật state

    setRelatedData(foundRelatedData);
    
    // Hiển thị toast cảnh báo
    const toastTitle = t(getTranslationKey('cannotDelete')) || 'Không thể xóa';
    const toastDesc = t(getTranslationKey('relatedDataMessage'), { 
      name: itemName,
      count: foundRelatedData.total 
    }) || `"${itemName}" có ${foundRelatedData.total} dữ liệu liên quan. Xem chi tiết trong hộp thoại.`;
    


    
    toast({
      title: toastTitle,
      description: toastDesc,
      variant: 'destructive',
      className: 'bg-white border border-red-400 text-red-800',
    });
    
    // Gọi callback nếu có
    if (onRelatedDataFound) {

      onRelatedDataFound(foundRelatedData, id);
    }
    
    if (debug) {

    }
  };
  
  // Hàm xóa item (kiểm tra dữ liệu liên quan trước)
  const deleteItem = async (id: string, itemName: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);
      setRelatedData(null);
      
      if (debug) {

      }
      
      // Tạm thời vô hiệu hóa các queries đang chạy để tránh lỗi
      await queryClient.cancelQueries();
      
      // Gọi API xóa với force=false để kiểm tra dữ liệu liên quan
      const response = await deleteFn(id, false);
      
      // Logger chi tiết cấu trúc response






      
      if (debug) {

      }
      
      // Xử lý phản hồi
      if (response.success) {

        handleSuccess(id, itemName, false);
        return true;
      } else {

        
        // Kiểm tra mã lỗi
        const errorCode = response.error?.code;
        
        // Kiểm tra xem có phải lỗi dữ liệu liên quan không
        if (errorCode === 'PROPERTY_HAS_RELATED_DATA' || errorCode === 'ITEM_HAS_RELATED_DATA') {

          
          // Truy xuất dữ liệu liên quan từ đường dẫn chuẩn response.error.details.relatedData
          const foundRelatedData = response.error?.details?.relatedData || null;

          

          
          if (foundRelatedData) {

            // Xử lý dữ liệu liên quan
            handleRelatedData(foundRelatedData, id, itemName);
            return false;
          } else {

          }
        } else {

        }
        
        // Các lỗi khác
        const errorMessage = response.error?.message || 'Đã xảy ra lỗi khi xóa.';
        const error = new Error(errorMessage);
        throw error;
      }
    } catch (err) {
      // Xử lý lỗi
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (debug) {

      }
      
      // Hiển thị thông báo lỗi
      toast({
        title: t(getTranslationKey('errorTitle')) || t('common.error') || 'Lỗi',
        description: error.message || t(getTranslationKey('errorDescription')) || 'Đã xảy ra lỗi khi xóa.',
        variant: 'destructive',
      });
      
      // Gọi callback onError nếu có
      if (onError) {
        onError(error);
      }
      
      return false;
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Hàm force delete item (xóa tất cả dữ liệu liên quan)
  const forceDeleteItem = async (id: string, itemName: string): Promise<boolean> => {
    try {



      // Đặt các state
      setIsDeleting(true);
      setError(null);
      setRelatedData(null); // Xóa thông tin dữ liệu liên quan khi force delete
      
      if (debug) {

      }
      
      // Tạm thời vô hiệu hóa các queries đang chạy để tránh lỗi
      try {
        await queryClient.cancelQueries();
      } catch (error) {

      }
      
      // Gọi API xóa với force=true để xóa tất cả dữ liệu liên quan

      
      // Ký hợp đồng kiểu dữ liệu
      let response: DeleteApiResponse;
      try {
        response = await deleteFn(id, true);

      } catch (apiError) {

        throw apiError;
      }
      
      // Xử lý phản hồi
      if (response.success) {

        // Xóa thành công
        handleSuccess(id, itemName, true);
        return true;
      } else {

        // Các lỗi khác
        const errorMessage = response.error?.message || 'Đã xảy ra lỗi khi xóa tất cả dữ liệu liên quan.';
        const error = new Error(errorMessage);
        throw error;
      }
    } catch (err) {
      // Xử lý lỗi
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (debug) {

      }
      
      // Hiển thị thông báo lỗi
      toast({
        title: t(getTranslationKey('errorTitle')) || t('common.error') || 'Lỗi',
        description: error.message || t(getTranslationKey('forceDeleteErrorDescription')) || 'Đã xảy ra lỗi khi xóa tất cả dữ liệu liên quan.',
        variant: 'destructive',
      });
      
      // Gọi callback onError nếu có
      if (onError) {
        onError(error);
      }
      
      return false;
    } finally {
      setIsDeleting(false);
    }
  };
  
  return {
    isDeleting,
    isSuccess,
    error,
    relatedData,
    deleteItem,
    forceDeleteItem,
    reset
  };
}
