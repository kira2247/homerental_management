import { useQuery } from '@tanstack/react-query';
import { useUnitApi, isApiSuccess, createErrorFromResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth/auth-context';
import { unitKeys } from './unit-keys';
import { UnitWithProperty, PaginatedResponse, UnitFilter } from '@/lib/types';

interface UsePropertyUnitsProps {
  propertyId: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
  status?: string;
  /**
   * Tham số sắp xếp theo giá tăng dần (backend API)
   */
  sortByPriceAsc?: boolean;
  /**
   * @deprecated Sử dụng sortByPriceAsc thay cho sortBy và sortOrder
   */
  sortBy?: string;
  /**
   * @deprecated Sử dụng sortByPriceAsc thay cho sortBy và sortOrder
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook để lấy danh sách đơn vị cho thuê của một bất động sản
 */
export function usePropertyUnits(props: UsePropertyUnitsProps) {
  const { 
    propertyId, 
    enabled = true, 
    page = 1, 
    limit = 10,
    status,
    sortByPriceAsc,
    sortBy,
    sortOrder = 'asc'
  } = props;
  
  const unitApi = useUnitApi();
  const { isLoggingOut } = useAuth();
  
  // Chỉ thêm các tham số có giá trị vào filter
  const filters: UnitFilter = {
    page,
    limit
  };
  
  // Chỉ thêm các tham số không undefined
  if (status) filters.status = status;
  
  // Xử lý tham số sắp xếp
  if (sortByPriceAsc !== undefined) {
    // Ưu tiên sử dụng sortByPriceAsc nếu được cung cấp
    filters.sortByPriceAsc = sortByPriceAsc;
  } else if (sortBy === 'price') {
    // Hỗ trợ ngược dịch từ sortBy/sortOrder sang sortByPriceAsc
    filters.sortByPriceAsc = sortOrder === 'asc';
  }
  
  return useQuery<PaginatedResponse<UnitWithProperty>, Error>({
    queryKey: unitKeys.byProperty(propertyId, filters),
    queryFn: async () => {
      const response = await unitApi.getUnitsByPropertyId(propertyId, filters);
      
      if (!isApiSuccess(response)) {
        throw createErrorFromResponse(response);
      }
      
      // Kiểm tra cấu trúc dữ liệu trả về
      const responseDataObj = response.data as Record<string, any>;
      
      // Xử lý cả hai trường hợp cấu trúc dữ liệu
      let paginatedData: PaginatedResponse<UnitWithProperty>;
      
      // Trường hợp 1: response.data đã là PaginatedResponse
      if (responseDataObj && typeof responseDataObj === 'object' && 'items' in responseDataObj) {
        paginatedData = responseDataObj as PaginatedResponse<UnitWithProperty>;
      }
      // Trường hợp 2: response.data là một cấu trúc khác (có thể là cấu trúc cũ)
      else {
        // Trường hợp cấu trúc dữ liệu không như mong đợi, thử thích ứng
        
        // Thử tìm các trường dữ liệu có thể chứa items
        let possibleItemsArray: any[] = [];
        
        if (responseDataObj && typeof responseDataObj === 'object') {
          if ('units' in responseDataObj && Array.isArray(responseDataObj.units)) {
            possibleItemsArray = responseDataObj.units;
          } else if ('data' in responseDataObj && typeof responseDataObj.data === 'object') {
            const dataObj = responseDataObj.data as Record<string, any>;
            if ('items' in dataObj && Array.isArray(dataObj.items)) {
              possibleItemsArray = dataObj.items;
            } else if ('units' in dataObj && Array.isArray(dataObj.units)) {
              possibleItemsArray = dataObj.units;
            }
          }
        }
        
        paginatedData = {
          items: possibleItemsArray,
          totalItems: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        };
        
        // Lấy các thông tin phân trang nếu có
        if (responseDataObj && typeof responseDataObj === 'object') {
          if ('totalItems' in responseDataObj) paginatedData.totalItems = Number(responseDataObj.totalItems);
          else if ('total' in responseDataObj) paginatedData.totalItems = Number(responseDataObj.total);
          
          if ('page' in responseDataObj) paginatedData.page = Number(responseDataObj.page);
          if ('limit' in responseDataObj) paginatedData.limit = Number(responseDataObj.limit);
          if ('totalPages' in responseDataObj) paginatedData.totalPages = Number(responseDataObj.totalPages);
          
          // Kiểm tra trong trường data nếu có
          if ('data' in responseDataObj && typeof responseDataObj.data === 'object') {
            const dataObj = responseDataObj.data as Record<string, any>;
            
            if ('totalItems' in dataObj && !paginatedData.totalItems) {
              paginatedData.totalItems = Number(dataObj.totalItems);
            }
            if ('page' in dataObj && paginatedData.page === 1) {
              paginatedData.page = Number(dataObj.page);
            }
            if ('limit' in dataObj && paginatedData.limit === 10) {
              paginatedData.limit = Number(dataObj.limit);
            }
            if ('totalPages' in dataObj && paginatedData.totalPages === 1) {
              paginatedData.totalPages = Number(dataObj.totalPages);
            }
          }
        }
      }
      
      // Đảm bảo paginatedData.items tồn tại, nếu không thì gán một mảng rỗng
      if (!paginatedData.items) {
        paginatedData.items = [];
        // Nếu không có items, sử dụng mảng rỗng
      }
      
      return paginatedData;
    },
    enabled: enabled && !!propertyId && !isLoggingOut,
    staleTime: 60000, // 1 phút
  });
}
