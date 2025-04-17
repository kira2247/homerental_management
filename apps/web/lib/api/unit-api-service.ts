/**
 * Unit API Service - Quản lý các API liên quan đến đơn vị cho thuê
 */

import { BaseApiService } from './base-api-service';
import { 
  ApiResponse, 
  PaginatedResponse,
  UnitFilter,
  UnitListResponse,
  UnitDetail,
  UnitSummary,
  CreateUnitRequest,
  UpdateUnitRequest,
  UnitWithProperty
} from '@/lib/types';
import { apiLogger } from '../utils/logging';

// Re-export types
export type { 
  UnitFilter,
  UnitListResponse,
  UnitDetail,
  UnitSummary,
  CreateUnitRequest,
  UpdateUnitRequest,
  UnitWithProperty
};

// UnitApiService class
class UnitApiService extends BaseApiService {
  constructor() {
    super('units');
    
    // Ghi log để debug
    apiLogger.debug('UnitApiService initialized with baseUrl:', `/api/units`);
    
    // Ghi log các đường dẫn API được sử dụng trong controller
    apiLogger.debug('API endpoints in UnitController:', {
      getUnitsByPropertyId: '/api/units/property/:propertyId',
      getVacantUnitsByPropertyId: '/api/units/property/:propertyId/vacant',
      getUnitById: '/api/units/:id'
    });
  }
  
  /**
   * Lấy danh sách đơn vị cho thuê với bộ lọc và phân trang
   * @param params Tham số cho request (page, limit, và các bộ lọc)
   */
  async getUnits(
    params: UnitFilter = {}
  ): Promise<ApiResponse<PaginatedResponse<UnitWithProperty>>> {
    apiLogger.debug('Fetching units with params:', params);
    
    const queryParams: Record<string, any> = { 
      page: params.page || 1,
      limit: params.limit || 10,
      ...params
    };
    
    const response = await this.getPaginated<UnitWithProperty>(queryParams);
    return response;
  }
  
  /**
   * Lấy danh sách đơn vị cho thuê của một bất động sản cụ thể
   * @param propertyId ID của bất động sản
   * @param params Tham số cho request (page, limit, status, etc.)
   */
  async getUnitsByPropertyId(
    propertyId: string,
    params: Omit<UnitFilter, 'propertyId'> = {}
  ): Promise<ApiResponse<PaginatedResponse<UnitWithProperty>>> {
    // Kiểm tra propertyId
    if (!propertyId) {
      apiLogger.error('getUnitsByPropertyId called with invalid propertyId:', propertyId);
      return {
        success: false,
        error: {
          code: 'INVALID_PROPERTY_ID',
          message: 'ID bất động sản không hợp lệ'
        }
      };
    }
    
    apiLogger.debug(`Fetching units for property ${propertyId} with params:`, params);
    
    // Chuẩn hóa tham số để phù hợp với backend
    const queryParams: Record<string, any> = { 
      page: params.page || 1,
      limit: params.limit || 10
    };
    
    // Chỉ thêm các tham số không undefined
    if (params.status) queryParams.status = params.status;
    if (params.search) queryParams.search = params.search;
    if (params.minPrice) queryParams.minPrice = params.minPrice;
    if (params.maxPrice) queryParams.maxPrice = params.maxPrice;
    if (params.minArea) queryParams.minArea = params.minArea;
    if (params.maxArea) queryParams.maxArea = params.maxArea;
    if (params.bedrooms) queryParams.bedrooms = params.bedrooms;
    if (params.bathrooms) queryParams.bathrooms = params.bathrooms;
    if (params.hasFurniture !== undefined) queryParams.hasFurniture = params.hasFurniture;
    if (params.hasAirCon !== undefined) queryParams.hasAirCon = params.hasAirCon;
    if (params.hasWaterHeater !== undefined) queryParams.hasWaterHeater = params.hasWaterHeater;
    if (params.hasBalcony !== undefined) queryParams.hasBalcony = params.hasBalcony;
    
    // Xử lý tham số sắp xếp theo đúng backend API
    if (params.sortByPriceAsc !== undefined) {
      // Backend sử dụng sortByPriceAsc
      queryParams.sortByPriceAsc = params.sortByPriceAsc;
    } else if (params.sortBy === 'price' && params.sortOrder) {
      // Hỗ trợ ngược dịch từ sortBy/sortOrder sang sortByPriceAsc
      queryParams.sortByPriceAsc = params.sortOrder === 'asc';
    }
    
    // Ghi log chi tiết về API call để debug
    apiLogger.debug(`Calling units API with propertyId: ${propertyId}`, {
      path: `/property/${propertyId}`,
      fullUrl: `/api/units/property/${propertyId}`,
      queryParams
    });
    
    try {
      // Gọi API với đường dẫn đúng
      return await this.fetchApi<PaginatedResponse<UnitWithProperty>>('GET', `/property/${propertyId}`, undefined, queryParams);
    } catch (error) {
      apiLogger.error(`Error fetching units for property ${propertyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Lấy thông tin chi tiết của một đơn vị cho thuê
   * @param id ID của đơn vị cho thuê
   */
  async getUnitById(id: string): Promise<ApiResponse<UnitDetail>> {
    apiLogger.debug(`Fetching unit details for ${id}`);
    return this.getById<UnitDetail>(id);
  }
  
  /**
   * Tạo đơn vị cho thuê mới
   * @param data Dữ liệu của đơn vị cho thuê mới
   */
  async createUnit(data: CreateUnitRequest): Promise<ApiResponse<UnitDetail>> {
    apiLogger.debug('Creating new unit with data:', data);
    return this.create<UnitDetail, CreateUnitRequest>(data);
  }
  
  /**
   * Cập nhật thông tin đơn vị cho thuê
   * @param id ID của đơn vị cho thuê
   * @param data Dữ liệu cập nhật cho đơn vị cho thuê
   */
  async updateUnit(id: string, data: UpdateUnitRequest): Promise<ApiResponse<UnitDetail>> {
    apiLogger.debug(`Updating unit ${id} with data:`, data);
    return this.patch(id, data);
  }
  
  /**
   * Xóa đơn vị cho thuê
   * @param id ID của đơn vị cho thuê
   */
  async deleteUnit(id: string): Promise<ApiResponse<void>> {
    apiLogger.debug(`Deleting unit ${id}`);
    return this.delete(id);
  }
  
  /**
   * Lấy danh sách đơn vị cho thuê còn trống của một bất động sản
   * @param propertyId ID của bất động sản
   */
  async getVacantUnits(propertyId: string): Promise<ApiResponse<UnitWithProperty[]>> {
    apiLogger.debug(`Fetching vacant units for property ${propertyId}`);
    return this.fetchApi<UnitWithProperty[]>('GET', `/property/${propertyId}/vacant`);
  }
  
  /**
   * Lấy thông tin tóm tắt của một đơn vị cho thuê
   * @param id ID của đơn vị cho thuê
   */
  async getUnitSummary(id: string): Promise<ApiResponse<UnitSummary>> {
    apiLogger.debug(`Fetching summary for unit ${id}`);
    return this.fetchApi<UnitSummary>('GET', `/${id}/summary`);
  }
}

// Export singleton instance
export const unitApiService = new UnitApiService();
