/**
 * Maintenance API Service - Quản lý các API liên quan đến bảo trì bất động sản
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api-types';

// Types
export interface Maintenance {
  id: string;
  propertyId: string;
  unitId?: string;
  title: string;
  description: string;
  requestDate: string;
  scheduledDate?: string;
  completedDate?: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface MaintenanceFilters {
  propertyId?: string;
  unitId?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  startDate?: string;
  endDate?: string;
}

export interface CreateMaintenanceRequest {
  propertyId: string;
  unitId?: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  scheduledDate?: string;
  cost?: number;
  notes?: string;
}

export interface UpdateMaintenanceRequest {
  title?: string;
  description?: string;
  scheduledDate?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  cost?: number;
  notes?: string;
  completedDate?: string;
}

// MaintenanceApiService class
class MaintenanceApiService extends BaseApiService {
  constructor() {
    super('maintenance');
  }
  
  /**
   * Lấy danh sách bảo trì có phân trang
   */
  async getMaintenanceRequests(
    page: number = 1, 
    limit: number = 10, 
    filters?: MaintenanceFilters
  ): Promise<ApiResponse<PaginatedResponse<Maintenance>>> {
    return this.getPaginated<Maintenance>({
      page,
      limit,
      ...filters
    });
  }
  
  /**
   * Lấy thông tin bảo trì theo ID
   */
  async getMaintenanceById(id: string): Promise<ApiResponse<Maintenance>> {
    return this.getById<Maintenance>(id);
  }
  
  /**
   * Tạo yêu cầu bảo trì mới
   */
  async createMaintenance(maintenanceData: CreateMaintenanceRequest): Promise<ApiResponse<Maintenance>> {
    return this.create<Maintenance>(maintenanceData);
  }
  
  /**
   * Cập nhật thông tin bảo trì
   */
  async updateMaintenance(id: string, maintenanceData: UpdateMaintenanceRequest): Promise<ApiResponse<Maintenance>> {
    return this.update<Maintenance>(id, maintenanceData);
  }
  
  /**
   * Xóa yêu cầu bảo trì
   */
  async deleteMaintenance(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }
  
  /**
   * Cập nhật trạng thái bảo trì
   */
  async updateMaintenanceStatus(id: string, status: MaintenanceStatus, notes?: string): Promise<ApiResponse<Maintenance>> {
    return this.patch<Maintenance>(id, { status, notes }, { action: 'update-status' });
  }
  
  /**
   * Lên lịch bảo trì
   */
  async scheduleMaintenance(id: string, scheduledDate: string, assignedTo?: string): Promise<ApiResponse<Maintenance>> {
    return this.patch<Maintenance>(id, {
      status: MaintenanceStatus.SCHEDULED,
      scheduledDate,
      assignedTo
    }, { action: 'schedule' });
  }
  
  /**
   * Hoàn thành bảo trì
   */
  async completeMaintenance(id: string, completedDate: string, cost?: number, notes?: string): Promise<ApiResponse<Maintenance>> {
    return this.patch<Maintenance>(id, {
      status: MaintenanceStatus.COMPLETED,
      completedDate,
      cost,
      notes
    }, { action: 'complete' });
  }
  
  /**
   * Hủy yêu cầu bảo trì
   */
  async cancelMaintenance(id: string, reason: string): Promise<ApiResponse<Maintenance>> {
    return this.patch<Maintenance>(id, {
      status: MaintenanceStatus.CANCELLED,
      notes: reason
    }, { action: 'cancel' });
  }
  
  /**
   * Tải lên hình ảnh cho yêu cầu bảo trì
   */
  async uploadMaintenanceImages(id: string, images: File[]): Promise<ApiResponse<{ urls: string[] }>> {
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
   * Lấy thống kê bảo trì
   */
  async getMaintenanceStatistics(
    startDate: string, 
    endDate: string, 
    propertyId?: string
  ): Promise<ApiResponse<{
    totalCount: number;
    byStatus: Record<MaintenanceStatus, number>;
    byPriority: Record<MaintenancePriority, number>;
    averageResolutionTime: number;
    totalCost: number;
  }>> {
    return this.fetchApi<any>(
      'GET',
      '/statistics',
      undefined,
      {
        startDate,
        endDate,
        propertyId
      }
    );
  }
}

// Export singleton instance
export const maintenanceApiService = new MaintenanceApiService(); 









