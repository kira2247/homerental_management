/**
 * Property API Service - Quản lý các API liên quan đến bất động sản cho thuê
 */

import { BaseApiService, ApiResponse, PaginatedResponse } from './base-api-service';
import { PropertyType, PropertyStatus, Property, Unit, Document } from './types';

// Re-export types
export type { Property, PropertyType, PropertyStatus, Unit, Document };

// Types
export interface PropertyFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  city?: string;
  district?: string;
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  ownerId?: string;
  sortBy?: "price" | "area" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface CreatePropertyRequest {
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  district: string;
  ward?: string;
  defaultElectricityRate: number;
  defaultWaterRate: number;
  defaultInternetRate?: number;
  defaultGarbageRate?: number;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  parkingFee?: number;
  thumbnail?: string;
  defaultOtherFees?: Record<string, any>;
  additionalFacilities?: Record<string, any>;
  ownerId: string; // UUID của chủ sở hữu
  userId: string; // UUID của người tạo - Bắt buộc phải có
}

export interface UpdatePropertyRequest {
  name?: string;
  type?: PropertyType;
  status?: PropertyStatus;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  defaultElectricityRate?: number;
  defaultWaterRate?: number;
  defaultInternetRate?: number;
  defaultGarbageRate?: number;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  parkingFee?: number;
  thumbnail?: string;
  defaultOtherFees?: Record<string, any>;
  additionalFacilities?: Record<string, any>;
}

// PropertyApiService class
class PropertyApiService extends BaseApiService {
  constructor() {
    super('properties');
  }
  
  /**
   * Lấy danh sách bất động sản có phân trang
   * @param params Tham số cho request (page, limit, và các bộ lọc)
   */
  async getProperties(
    params: { page?: number; limit?: number } & PropertyFilters
  ): Promise<ApiResponse<PaginatedResponse<Property>>>;
  
  /**
   * Lấy danh sách bất động sản có phân trang (phương thức cũ)
   * @param page Trang hiện tại
   * @param limit Số lượng item mỗi trang
   * @param filters Bộ lọc bổ sung
   */
  async getProperties(
    page: number | { page?: number; limit?: number } & PropertyFilters,
    limit?: number,
    filters?: PropertyFilters
  ): Promise<ApiResponse<PaginatedResponse<Property>>> {
    // Xử lý tham số dựa trên cách gọi:
    // - Nếu page là object, đó là params tổng hợp
    // - Nếu không, sử dụng các tham số riêng lẻ
    let queryParams: Record<string, any> = {};
    
    if (typeof page === 'object') {
      // Hàm được gọi với một object params
      queryParams = { 
        page: page.page || 1,
        limit: page.limit || 10,
        ...page
      };
      console.log('[PropertyApiService] Fetching properties with object params:', queryParams);
    } else {
      // Hàm được gọi với các tham số riêng lẻ
      queryParams = {
        page: page || 1,
        limit: limit || 10,
        ...filters
      };
      console.log('[PropertyApiService] Fetching properties with individual params:', queryParams);
    }
    
    return this.getPaginated<Property>(queryParams);
  }
  
  /**
   * Lấy thông tin bất động sản theo ID
   */
  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    return this.getById<Property>(id);
  }
  
  /**
   * Lấy danh sách đơn vị (phòng) của một bất động sản
   */
  async getPropertyUnits(
    propertyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Unit>>> {
    return this.fetchApi<PaginatedResponse<Unit>>(
      'GET',
      `/${propertyId}/units`,
      undefined,
      { page, limit }
    );
  }
  
  /**
   * Lấy danh sách tài liệu của một bất động sản
   */
  async getPropertyDocuments(
    propertyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Document>>> {
    return this.fetchApi<PaginatedResponse<Document>>(
      'GET',
      `/${propertyId}/documents`,
      undefined,
      { page, limit }
    );
  }
  
  /**
   * Tạo bất động sản mới
   */
  async createProperty(propertyData: CreatePropertyRequest): Promise<ApiResponse<Property>> {
    console.log('PropertyApiService: Dữ liệu trước khi xử lý:', propertyData);
    
    // Đảm bảo các trường dữ liệu là đúng kiểu
    const formattedData = {
      ...propertyData,
      // Đảm bảo các trường số luôn là số
      defaultElectricityRate: Number(propertyData.defaultElectricityRate || 0),
      defaultWaterRate: Number(propertyData.defaultWaterRate || 0),
      defaultInternetRate: propertyData.defaultInternetRate ? Number(propertyData.defaultInternetRate) : undefined,
      defaultGarbageRate: propertyData.defaultGarbageRate ? Number(propertyData.defaultGarbageRate) : undefined,
      parkingFee: propertyData.parkingFee ? Number(propertyData.parkingFee) : undefined,
      
      // Đảm bảo các trường boolean đúng kiểu
      hasSecurity: propertyData.hasSecurity === true,
      hasElevator: propertyData.hasElevator === true,
      hasParking: propertyData.hasParking === true,
      
      // Không gán URL mặc định cho thumbnail, chỉ sử dụng giá trị người dùng nhập
      // Nếu không có giá trị, sẽ để undefined để backend xử lý
      thumbnail: propertyData.thumbnail || undefined,
      
      // Đảm bảo ownerId và userId luôn có giá trị và đúng định dạng
      ownerId: propertyData.ownerId?.trim() || "",
      userId: propertyData.userId?.trim() || ""
    };
    
    // Log dữ liệu đã xử lý để kiểm tra
    console.log('PropertyApiService: Dữ liệu sau khi xử lý:', formattedData);
    
    // Kiểm tra xem userId có tồn tại không
    if (!formattedData.userId) {
      return {
        success: false,
        error: {
          message: 'Thiếu thông tin người dùng (userId)',
          code: 'MISSING_USER_ID'
        }
      };
    }
    
    // Kiểm tra xem ownerId có tồn tại không
    if (!formattedData.ownerId) {
      return {
        success: false,
        error: {
          message: 'Thiếu thông tin chủ sở hữu (ownerId)',
          code: 'MISSING_OWNER_ID'
        }
      };
    }
    
    return this.create<Property>(formattedData);
  }
  
  /**
   * Cập nhật thông tin bất động sản
   */
  async updateProperty(id: string, propertyData: UpdatePropertyRequest): Promise<ApiResponse<Property>> {
    console.log('PropertyApiService.updateProperty: Dữ liệu gốc từ form:', propertyData);

    // Xử lý các trường dữ liệu để đảm bảo đúng kiểu
    const formattedData = {
      ...propertyData,
      // Xử lý các trường số
      ...(propertyData.defaultElectricityRate !== undefined && {
        defaultElectricityRate: Number(propertyData.defaultElectricityRate)
      }),
      ...(propertyData.defaultWaterRate !== undefined && {
        defaultWaterRate: Number(propertyData.defaultWaterRate)
      }),
      ...(propertyData.defaultInternetRate !== undefined && {
        defaultInternetRate: Number(propertyData.defaultInternetRate)
      }),
      ...(propertyData.defaultGarbageRate !== undefined && {
        defaultGarbageRate: Number(propertyData.defaultGarbageRate)
      }),
      ...(propertyData.parkingFee !== undefined && {
        parkingFee: Number(propertyData.parkingFee)
      }),
      
      // Xử lý các trường boolean
      ...(propertyData.hasSecurity !== undefined && {
        hasSecurity: propertyData.hasSecurity === true
      }),
      ...(propertyData.hasElevator !== undefined && {
        hasElevator: propertyData.hasElevator === true
      }),
      ...(propertyData.hasParking !== undefined && {
        hasParking: propertyData.hasParking === true
      }),
      
      // Đảm bảo thumbnail không bao giờ là null
      ...(propertyData.thumbnail === null && { thumbnail: undefined }),
    };
    
    console.log('PropertyApiService.updateProperty: Dữ liệu đã xử lý:', formattedData);
    
    return this.patch<Property>(id, formattedData);
  }
  
  /**
   * Xóa bất động sản
   */
  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }
  
  /**
   * Cập nhật trạng thái bất động sản
   */
  async updatePropertyStatus(id: string, status: PropertyStatus): Promise<ApiResponse<Property>> {
    return this.patch<Property>(id, { status }, { action: 'update-status' });
  }
  
  /**
   * Tải lên hình ảnh cho bất động sản
   */
  async uploadPropertyImages(id: string, images: File[]): Promise<ApiResponse<{ urls: string[] }>> {
    const formData = new FormData();
    
    images.forEach(image => {
      formData.append('images', image);
    });
    
    return this.fetchApi<{ urls: string[] }>(
      'POST',
      `/${id}/images`,
      formData,
      {},
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );
  }
  
  /**
   * Xóa hình ảnh của bất động sản
   */
  async deletePropertyImage(id: string, imageUrl: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.fetchApi<{ success: boolean }>(
      'DELETE',
      `/${id}/images`,
      { imageUrl },
      {}
    );
  }
  
  /**
   * Lấy danh sách bất động sản của chủ sở hữu
   */
  async getOwnerProperties(ownerId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Property>>> {
    return this.getPaginated<Property>({
      page,
      limit,
      ownerId
    });
  }
  
  /**
   * Lấy tổng số bất động sản dựa trên các bộ lọc
   */
  async getPropertyCount(filters?: PropertyFilters): Promise<ApiResponse<{ count: number }>> {
    try {
      // Gọi API với limit=1 chỉ để lấy tổng số lượng
      console.log('PropertyApiService: Sử dụng getProperties để đếm bất động sản với filters:', filters);
      const propertiesResponse = await this.getProperties({ page: 1, limit: 1, ...filters });
      
      if (propertiesResponse.success && propertiesResponse.data) {
        // Truy cập vào các thuộc tính khác nhau có thể chứa tổng số
        let count = 0;
        
        // Kiểm tra các trường hợp cấu trúc khác nhau của response
        if (typeof propertiesResponse.data === 'object') {
          // Trường hợp 1: Đối tượng có totalItems
          if ('totalItems' in propertiesResponse.data) {
            count = (propertiesResponse.data as any).totalItems;
          } 
          // Trường hợp 2: Đối tượng có total
          else if ('total' in propertiesResponse.data) {
            count = (propertiesResponse.data as any).total;
          }
          // Trường hợp 3: Đối tượng có meta.total hoặc meta.totalItems
          else if ('meta' in propertiesResponse.data && typeof (propertiesResponse.data as any).meta === 'object') {
            count = (propertiesResponse.data as any).meta.totalItems || 
                    (propertiesResponse.data as any).meta.total || 
                    0;
          }
        }
        
        console.log('PropertyApiService: Đã lấy được tổng số:', count);
        
        return {
          success: true,
          data: {
            count
          }
        };
      }
      
      // Nếu không lấy được dữ liệu, trả về 0
      console.warn('PropertyApiService: Không thể lấy được tổng số, trả về 0');
      return {
        success: true,
        data: {
          count: 0
        }
      };
    } catch (error) {
      console.error('PropertyApiService.getPropertyCount - Error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Lỗi không xác định khi đếm bất động sản',
          code: 'PROPERTY_COUNT_ERROR'
        }
      };
    }
  }
}

// Export singleton instance
export const propertyApiService = new PropertyApiService(); 