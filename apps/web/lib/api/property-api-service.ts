/**
 * Property API Service - Quản lý các API liên quan đến bất động sản cho thuê
 */

import { BaseApiService } from './base-api-service';
import { 
  PropertyType, 
  PropertyStatus, 
  Property, 
  Unit, 
  Document, 
  PropertyFilters,
  RelatedDataResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest
} from './types';
import { propertyLogger } from '../utils/logging';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api-types';

// Re-export types
export type { 
  Property, 
  PropertyType, 
  PropertyStatus, 
  Unit, 
  Document, 
  PropertyFilters,
  RelatedDataResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest
};

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
      propertyLogger.debug('Fetching properties with object params:', queryParams);
    } else {
      // Hàm được gọi với các tham số riêng lẻ
      queryParams = {
        page: page || 1,
        limit: limit || 10,
        ...filters
      };
      propertyLogger.debug('Fetching properties with individual params:', queryParams);
    }
    

    const response = await this.getPaginated<Property>(queryParams);
    

    if (response.success) {

      // Sử dụng type assertion để xử lý các cấu trúc dữ liệu khác nhau
      const responseData = response.data as any;
      
      const paginatedData: PaginatedResponse<Property> = {
        // Kiểm tra cấu trúc phản hồi từ server
        items: Array.isArray(responseData) ? responseData :
               responseData?.items || 
               responseData?.data || [],
        totalItems: responseData?.totalItems || 
               responseData?.total || 
               responseData?.meta?.total || 0,
        page: responseData?.page || 
              responseData?.meta?.page || 1,
        limit: responseData?.limit || 
               responseData?.meta?.limit || 10,
        totalPages: responseData?.totalPages || 
                    responseData?.meta?.totalPages || 0
      };
      
      return {
        success: true as const,
        data: paginatedData
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Lấy thông tin bất động sản theo ID
   */
  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    const response = await this.getById<Property>(id);

    if (response.success) {
      return {
        success: true as const,
        data: response.data as Property
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Lấy danh sách đơn vị (phòng) của một bất động sản
   */
  async getPropertyUnits(
    propertyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Unit>>> {
    const response = await this.fetchApi<PaginatedResponse<Unit>>(
      'GET',
      `/${propertyId}/units`,
      {},
      { page, limit }
    );
    

    if (response.success) {
      // Đảm bảo dữ liệu phân trang đúng định dạng
      const paginatedData: PaginatedResponse<Unit> = {
        items: response.data?.items || [],
        totalItems: (response.data as any)?.totalItems || (response.data as any)?.total || 0,
        page: response.data?.page || page,
        limit: response.data?.limit || limit,
        totalPages: response.data?.totalPages || 0
      };
      
      return {
        success: true as const,
        data: paginatedData
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Lấy danh sách tài liệu của một bất động sản
   */
  async getPropertyDocuments(
    propertyId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Document>>> {
    const response = await this.fetchApi<PaginatedResponse<Document>>(
      'GET',
      `/${propertyId}/documents`,
      {},
      { page, limit }
    );
    

    if (response.success) {
      // Đảm bảo dữ liệu phân trang đúng định dạng
      const paginatedData: PaginatedResponse<Document> = {
        items: response.data?.items || [],
        totalItems: (response.data as any)?.totalItems || (response.data as any)?.total || 0,
        page: response.data?.page || page,
        limit: response.data?.limit || limit,
        totalPages: response.data?.totalPages || 0
      };
      
      return {
        success: true as const,
        data: paginatedData
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Tạo bất động sản mới
   */
  async createProperty(propertyData: CreatePropertyRequest): Promise<ApiResponse<Property>> {
    // Xử lý dữ liệu trước khi gửi đi
    const formattedData = { ...propertyData };
    
    // Loại bỏ các trường không hợp lệ nếu có
    if (formattedData.defaultOtherFees && typeof formattedData.defaultOtherFees !== 'object') {
      delete formattedData.defaultOtherFees;
    }
    
    if (formattedData.additionalFacilities && typeof formattedData.additionalFacilities !== 'object') {
      delete formattedData.additionalFacilities;
    }
    
    // Đảm bảo các giá trị số hợp lệ
    if (formattedData.defaultElectricityRate) {
      formattedData.defaultElectricityRate = Number(formattedData.defaultElectricityRate);
    }
    
    if (formattedData.defaultWaterRate) {
      formattedData.defaultWaterRate = Number(formattedData.defaultWaterRate);
    }
    
    if (formattedData.defaultInternetRate) {
      formattedData.defaultInternetRate = Number(formattedData.defaultInternetRate);
    }
    
    if (formattedData.defaultGarbageRate) {
      formattedData.defaultGarbageRate = Number(formattedData.defaultGarbageRate);
    }
    
    if (formattedData.parkingFee) {
      formattedData.parkingFee = Number(formattedData.parkingFee);
    }
    
    // Đảm bảo các giá trị boolean hợp lệ
    formattedData.hasSecurity = Boolean(formattedData.hasSecurity);
    formattedData.hasElevator = Boolean(formattedData.hasElevator);
    formattedData.hasParking = Boolean(formattedData.hasParking);
    
    propertyLogger.debug('createProperty: Dữ liệu đã xử lý:', formattedData);
    
    const response = await this.create<Property>(formattedData);
    

    if (response.success) {
      return {
        success: true as const,
        data: response.data as Property
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Cập nhật thông tin bất động sản
   */
  async updateProperty(id: string, propertyData: UpdatePropertyRequest): Promise<ApiResponse<Property>> {
    // Xử lý dữ liệu trước khi gửi đi
    const formattedData = { ...propertyData };
    
    // Loại bỏ các trường không hợp lệ nếu có
    if (formattedData.defaultOtherFees && typeof formattedData.defaultOtherFees !== 'object') {
      delete formattedData.defaultOtherFees;
    }
    
    if (formattedData.additionalFacilities && typeof formattedData.additionalFacilities !== 'object') {
      delete formattedData.additionalFacilities;
    }
    
    // Đảm bảo các giá trị số hợp lệ nếu có
    if (formattedData.defaultElectricityRate) {
      formattedData.defaultElectricityRate = Number(formattedData.defaultElectricityRate);
    }
    
    if (formattedData.defaultWaterRate) {
      formattedData.defaultWaterRate = Number(formattedData.defaultWaterRate);
    }
    
    if (formattedData.defaultInternetRate) {
      formattedData.defaultInternetRate = Number(formattedData.defaultInternetRate);
    }
    
    if (formattedData.defaultGarbageRate) {
      formattedData.defaultGarbageRate = Number(formattedData.defaultGarbageRate);
    }
    
    if (formattedData.parkingFee) {
      formattedData.parkingFee = Number(formattedData.parkingFee);
    }
    
    // Đảm bảo các giá trị boolean hợp lệ nếu có
    if (formattedData.hasSecurity !== undefined) {
      formattedData.hasSecurity = Boolean(formattedData.hasSecurity);
    }
    
    if (formattedData.hasElevator !== undefined) {
      formattedData.hasElevator = Boolean(formattedData.hasElevator);
    }
    
    if (formattedData.hasParking !== undefined) {
      formattedData.hasParking = Boolean(formattedData.hasParking);
    }
    
    propertyLogger.debug('updateProperty: Dữ liệu đã xử lý:', formattedData);
    
    // Đóng gói dữ liệu vào trường 'data' dưới dạng JSON string theo yêu cầu của backend
    const requestBody = {
      data: JSON.stringify(formattedData)
    };
    
    // Sử dụng patch vì backend đang sử dụng @Patch
    const response = await this.patch<Property>(id, requestBody);
    

    if (response.success) {
      return {
        success: true as const,
        data: response.data as Property
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  // Sử dụng RelatedDataResponse đã được định nghĩa ở đầu file

  /**
   * Xóa bất động sản
   * @param id ID của bất động sản cần xóa
   * @param force Nếu true, sẽ xóa tất cả dữ liệu liên quan đến bất động sản
   * @returns Kết quả xóa bất động sản hoặc thông tin về dữ liệu liên quan nếu không thể xóa
   */
  async deleteProperty(id: string, force: boolean = false): Promise<ApiResponse<void>> {

    
    // Truyền force qua queryParams thay vì options
    const queryParams = force ? { force: 'true' } : {};

    
    try {
      try {
        // Gọi API xóa property và log raw response để debug

        
        // Thêm token vào headers nếu cần
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // Thực hiện request
        const rawResponse = await fetch(`/api/properties/${id}${this.buildQueryString(queryParams)}`, {
          method: 'DELETE',
          headers,
          credentials: 'include'
        });
        
        // Log raw response status để debug


        
        // Kiểm tra nếu response là 204 No Content
        if (rawResponse.status === 204) {

          return {
            success: true as const,
            data: undefined
          };
        }
        
        // Lấy nội dung phản hồi dưới dạng text trước
        const responseText = await rawResponse.text();

        
        // Kiểm tra nếu response text rỗng
        if (!responseText || responseText.trim() === '') {

          
          // Nếu status code là 2xx, coi như thành công
          if (rawResponse.status >= 200 && rawResponse.status < 300) {
            return {
              success: true as const,
              data: undefined
            };
          } else {
            return {
              success: false as const,
              error: {
                code: `HTTP_${rawResponse.status}`,
                message: rawResponse.statusText || 'Lỗi không xác định'
              }
            };
          }
        }
        
        // Parse JSON từ response text
        let responseData: any;
        try {
          responseData = JSON.parse(responseText);

          
          // Log chi tiết hơn về cấu trúc phản hồi



          if (responseData.error) {



            if (responseData.error.details) {

              if (responseData.error.details.relatedData) {

              }
            }
          }
          
          // Kiểm tra cấu trúc phản hồi để đảm bảo đúng định dạng ApiResponse
          if (responseData === null || responseData === undefined) {
            return {
              success: false as const,
              error: {
                code: 'INVALID_RESPONSE',
                message: 'Phản hồi từ server không hợp lệ'
              }
            };
          } 
          
          // Kiểm tra xem phản hồi có trường success không
          if (typeof responseData.success !== 'boolean') {
            return {
              success: false as const,
              error: {
                code: 'INVALID_RESPONSE_FORMAT',
                message: 'Phản hồi không đúng định dạng'
              }
            };
          }
          
          // Xử lý phản hồi thành công
          if (responseData.success === true) {
            return {
              success: true as const,
              data: undefined
            };
          } 
          
          // Xử lý phản hồi lỗi
          
          // Kiểm tra xem lỗi có phải do dữ liệu liên quan không
          const errorCode = responseData.error?.code;
          const isRelatedDataError = errorCode === 'PROPERTY_HAS_RELATED_DATA';
          
          // Truy xuất dữ liệu liên quan từ cấu trúc phản hồi
          const relatedData = responseData.error?.details?.relatedData as RelatedDataResponse | undefined;
          
          if (isRelatedDataError && relatedData) {
            
            // Tính tổng số dữ liệu liên quan nếu chưa có
            if (!relatedData.total) {
              relatedData.total = (relatedData.units || 0) + 
                                (relatedData.maintenanceRequests || 0) + 
                                (relatedData.documents || 0) + 
                                (relatedData.bills || 0);
            }
            
            return {
              success: false as const,
              error: {
                code: errorCode || 'PROPERTY_HAS_RELATED_DATA',
                message: responseData.error?.message || 'Không thể xóa bất động sản do có dữ liệu liên quan',
                details: { relatedData }
              }
            };
          } else {
            
            return {
              success: false as const,
              error: {
                code: errorCode || 'UNKNOWN_ERROR',
                message: responseData.error?.message || 'Lỗi không xác định khi xóa bất động sản'
              }
            };
          }
        } catch (parseError) {
          
          return {
            success: false as const,
            error: {
              code: 'PARSE_ERROR',
              message: 'Lỗi khi xử lý phản hồi từ server'
            }
          };
        }
      } catch (fetchError) {
        // Xử lý lỗi fetch
        propertyLogger.error('Lỗi khi xóa property:', fetchError);
        return {
          success: false as const,
          error: {
            code: 'NETWORK_ERROR',
            message: fetchError instanceof Error ? fetchError.message : 'Lỗi kết nối đến server'
          }
        };
      }
    } catch (error) {
      propertyLogger.error(`Exception khi xóa property ID: ${id}`, error);
      return {
        success: false as const,
        error: {
          code: 'CLIENT_ERROR',
          message: error instanceof Error ? error.message : 'Lỗi không xác định khi xóa bất động sản'
        }
      };
    }
  }
  
  /**
   * Cập nhật trạng thái bất động sản
   */
  async updatePropertyStatus(id: string, status: PropertyStatus): Promise<ApiResponse<Property>> {
    const response = await this.patch<Property>(id, { status }, { action: 'update-status' });

    if (response.success) {
      return {
        success: true as const,
        data: response.data as Property
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Tải lên hình ảnh cho bất động sản
   */
  async uploadPropertyImages(id: string, images: File[]): Promise<ApiResponse<{ urls: string[] }>> {
    const formData = new FormData();
    
    images.forEach(image => {
      formData.append('images', image);
    });
    
    const response = await this.fetchApi<{ urls: string[] }>(
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
    

    if (response.success) {
      return {
        success: true as const,
        data: response.data as { urls: string[] }
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Xóa hình ảnh của bất động sản
   */
  async deletePropertyImage(id: string, imageUrl: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.fetchApi<{ success: boolean }>(
      'DELETE',
      `/${id}/images`,
      { imageUrl },
      {}
    );
    

    if (response.success) {
      return {
        success: true as const,
        data: response.data as { success: boolean }
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Lấy danh sách bất động sản của chủ sở hữu
   */
  async getOwnerProperties(ownerId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse<Property>>> {
    const response = await this.getPaginated<Property>({
      page,
      limit,
      ownerId
    });
    

    if (response.success) {

      const paginatedData: PaginatedResponse<Property> = {
        items: response.data?.items || [],
        totalItems: (response.data as any)?.total || 0,
        page: response.data?.page || page,
        limit: response.data?.limit || limit,
        totalPages: response.data?.totalPages || 0
      };
      
      return {
        success: true as const,
        data: paginatedData
      };
    } else {
      return {
        success: false as const,
        error: {
          code: response.error?.code || 'UNKNOWN_ERROR',
          message: response.error?.message || 'Unknown error'
        }
      };
    }
  }
  
  /**
   * Lấy tổng số bất động sản dựa trên các bộ lọc
   */
  async getPropertyCount(filters?: PropertyFilters): Promise<ApiResponse<{ count: number }>> {
    try {
      // Gọi API với limit=1 chỉ để lấy tổng số lượng
      propertyLogger.debug('Sử dụng getProperties để đếm bất động sản với filters:', filters);
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
        
        propertyLogger.debug('Đã lấy được tổng số:', count);
        
        return {
          success: true as const,
          data: {
            count
          }
        };
      }
      
      // Nếu không lấy được dữ liệu, trả về 0
      propertyLogger.warn('Không thể lấy được tổng số, trả về 0');
      return {
        success: true as const,
        data: {
          count: 0
        }
      };
    } catch (error) {
      propertyLogger.error('getPropertyCount - Error:', error);
      return {
        success: false as const,
        error: {
          message: error instanceof Error ? error.message : 'Lỗi không xác định khi đếm bất động sản',
          code: 'PROPERTY_COUNT_ERROR'
        }
      };
    }
  }
  
  /**
   * Helper function to handle upload errors
   * @private
   */
  private handleUploadError(error: unknown): ApiResponse<never> {
    return {
      success: false as const,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error during upload'
      }
    };
  }
  
  /**
   * Upload thumbnail cho một property đã tồn tại sử dụng endpoint riêng biệt
   * @param propertyId ID của property cần upload thumbnail
   * @param file File ảnh cần upload
   * @returns URL của ảnh đã upload
   */
  async uploadPropertyThumbnail(propertyId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      // Tạo FormData để gửi file
      const formData = new FormData();
      formData.append('file', file);
      
      // Gọi API endpoint riêng biệt cho upload thumbnail
      const response = await this.postFormData<{ url: string; message: string; success: boolean }>(
        `/${propertyId}/thumbnail`, 
        formData
      );
      
      if (response.success && response.data) {
        return {
          success: true as const,
          data: {
            url: response.data.url || ''
          }
        };
      } else {
        return {
          success: false as const,
          error: {
            code: response.error?.code || 'UPLOAD_ERROR',
            message: response.error?.message || 'Failed to upload thumbnail'
          }
        };
      }
    } catch (error) {
      return this.handleUploadError(error);
    }
  }
}

// Export singleton instance
export const propertyApiService = new PropertyApiService();

