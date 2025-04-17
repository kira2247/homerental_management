/**
 * Tenant API Service - Quản lý các API liên quan đến người thuê
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api-types';

// Types
export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber?: string;
  address?: string;
  occupation?: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

export interface TenantFilters {
  name?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  phone: string;
  idNumber?: string;
  address?: string;
  occupation?: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  address?: string;
  occupation?: string;
  birthdate?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

// TenantApiService class
class TenantApiService extends BaseApiService {
  constructor() {
    super('tenants');
  }
  
  /**
   * Lấy danh sách người thuê có phân trang
   */
  async getTenants(
    page: number = 1, 
    limit: number = 10, 
    filters?: TenantFilters
  ): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    return this.getPaginated<Tenant>({
      page,
      limit,
      ...filters
    });
  }
  
  /**
   * Lấy thông tin người thuê theo ID
   */
  async getTenantById(id: string): Promise<ApiResponse<Tenant>> {
    return this.getById<Tenant>(id);
  }
  
  /**
   * Tạo người thuê mới
   */
  async createTenant(tenantData: CreateTenantRequest): Promise<ApiResponse<Tenant>> {
    return this.create<Tenant>(tenantData);
  }
  
  /**
   * Cập nhật thông tin người thuê
   */
  async updateTenant(id: string, tenantData: UpdateTenantRequest): Promise<ApiResponse<Tenant>> {
    return this.update<Tenant>(id, tenantData);
  }
  
  /**
   * Xóa người thuê
   */
  async deleteTenant(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }
  
  /**
   * Tải lên tài liệu cho người thuê
   */
  async uploadTenantDocument(id: string, document: File, type: string): Promise<ApiResponse<{ documentUrl: string }>> {
    const formData = new FormData();
    formData.append('document', document);
    formData.append('type', type);
    
    return this.fetchApi<{ documentUrl: string }>(
      'POST',
      `/${id}/documents`,
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
   * Lấy danh sách tài liệu của người thuê
   */
  async getTenantDocuments(id: string): Promise<ApiResponse<{ type: string, url: string }[]>> {
    return this.fetchApi<{ type: string, url: string }[]>(
      'GET',
      `/${id}/documents`,
      undefined,
      {}
    );
  }
  
  /**
   * Tìm kiếm người thuê theo số CMND/CCCD
   */
  async findTenantByIdNumber(idNumber: string): Promise<ApiResponse<Tenant>> {
    return this.fetchApi<Tenant>(
      'GET',
      '/search/id-number',
      undefined,
      { idNumber }
    );
  }
}

// Export singleton instance
export const tenantApiService = new TenantApiService(); 









