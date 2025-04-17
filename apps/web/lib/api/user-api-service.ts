/**
 * User API Service - Quản lý các API liên quan đến người dùng
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api-types';
import { User } from './auth-api-service';

// Types
export interface UserFilters {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

// UserApiService class
class UserApiService extends BaseApiService {
  constructor() {
    super('users');
  }
  
  /**
   * Lấy danh sách người dùng có phân trang
   */
  async getUsers(
    page: number = 1, 
    limit: number = 10, 
    filters?: UserFilters
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    return this.getPaginated<User>({
      page,
      limit,
      ...filters
    });
  }
  
  /**
   * Lấy thông tin người dùng theo ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.getById<User>(id);
  }
  
  /**
   * Tạo người dùng mới
   */
  async createUser(userData: Omit<User, 'id'> & { password: string }): Promise<ApiResponse<User>> {
    return this.create<User>(userData);
  }
  
  /**
   * Cập nhật thông tin người dùng
   */
  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this.update<User>(id, userData);
  }
  
  /**
   * Xóa người dùng
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }
  
  /**
   * Kích hoạt người dùng
   */
  async activateUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.patch<{ success: boolean }>(id, { isActive: true }, { action: 'activate' });
  }
  
  /**
   * Vô hiệu hóa người dùng
   */
  async deactivateUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.patch<{ success: boolean }>(id, { isActive: false }, { action: 'deactivate' });
  }
  
  /**
   * Phân quyền cho người dùng
   */
  async assignRole(id: string, role: string): Promise<ApiResponse<User>> {
    return this.patch<User>(id, { role }, { action: 'assign-role' });
  }
}

// Export singleton instance
export const userApiService = new UserApiService(); 
