/**
 * File API Service
 * Cung cấp các phương thức để tương tác với API quản lý file
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse } from '@/lib/types/api-types';

export interface FileUploadResponse {
  id: string;
  url: string;
  provider: string;
  fileType: string;
  originalName: string;
  size: number;
  createdAt: string;
}

export class FileApiService extends BaseApiService {
  constructor() {
    super('files');
  }

  /**
   * Upload file lên server
   * @param file - File cần upload
   * @param fileType - Loại file (IMAGE, PDF, DOC, XLS, TEXT)
   * @param options - Các tùy chọn khi upload file
   * @param options.propertyId - ID của property nếu file liên quan đến property
   * @param options.folder - Thư mục con để lưu file (ví dụ: 'thumbnail')
   * @returns Promise với response chứa thông tin file đã upload
   */
  async uploadFile(
    file: File, 
    fileType: string, 
    options?: { propertyId?: string; folder?: string }
  ): Promise<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Đảm bảo fileType được viết hoa để khớp với enum FileType ở backend
    const normalizedFileType = fileType.toUpperCase();
    
    // Xây dựng URL với các tham số query
    let url = `/upload?type=${normalizedFileType}`;
    
    // Thêm propertyId vào URL nếu có
    if (options?.propertyId) {
      url += `&propertyId=${options.propertyId}`;
    }

    // Thêm folder vào URL nếu có
    if (options?.folder) {
      url += `&folder=${options.folder}`;
    }
    
    return this.fetchApi('POST', url, formData, {}, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  
  /**
   * Xóa file từ server
   * @param fileId - ID của file cần xóa (public_id từ Cloudinary)
   * @param provider - Nhà cung cấp lưu trữ (mặc định là 'cloudinary')
   * @returns Promise với response xác nhận file đã được xóa
   */
  async deleteFile(fileId: string, provider: string = 'cloudinary'): Promise<ApiResponse<void>> {
    // Đảm bảo đường dẫn API chính xác theo cấu trúc của controller
    return this.fetchApi('DELETE', `${fileId}?provider=${provider}`);
  }

  /**
   * Lấy URL của file
   * @param fileId - ID của file
   * @param provider - Provider lưu trữ file (cloudinary, supabase, etc.)
   * @returns Promise với URL của file
   */
  async getFileUrl(fileId: string, provider: string = 'cloudinary'): Promise<ApiResponse<{ url: string }>> {
    return this.fetchApi('GET', `/${fileId}/url?provider=${provider}`);
  }
  
  /**
   * Upload thumbnail cho bất động sản
   * @param propertyId - ID của bất động sản
   * @param file - File ảnh thumbnail
   * @returns Promise với response chứa thông tin file đã upload
   */
  async uploadPropertyThumbnail(propertyId: string, file: File): Promise<ApiResponse<FileUploadResponse>> {
    return this.uploadFile(file, 'IMAGE', {
      propertyId,
      folder: `rental-management/properties/${propertyId}/thumbnail`
    });
  }

  /**
   * Xóa thumbnail của bất động sản
   * @param propertyId - ID của bất động sản
   * @param fileId - ID của file thumbnail (public_id từ Cloudinary)
   * @returns Promise với response xác nhận file đã được xóa
   */
  async deletePropertyThumbnail(propertyId: string, fileId: string): Promise<ApiResponse<void>> {
    return this.deleteFile(fileId);
  }
}



// Tạo và export instance của FileApiService
export const fileApiService = new FileApiService();
