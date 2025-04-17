import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { UploadResult } from '../interfaces/upload-result.interface';

@Injectable()
export class CloudinaryProvider implements StorageProvider {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File, fileType: string, folderId?: string): Promise<UploadResult> {
    try {
      // Xác định loại tài nguyên (resource_type) dựa vào loại file
      // Cloudinary hỗ trợ 'image', 'video', 'raw', 'auto'
      let resourceType: 'raw' | 'image' | 'video' | 'auto' = 'raw';
      let uploadOptions: any = {
        folder: '',
        use_filename: true,
        unique_filename: true,
      };

      // Xác định loại tài nguyên và các tùy chọn đặc biệt theo loại
      if (file.mimetype.includes('image')) {
        resourceType = 'image';
        // Thêm các tùy chọn tối ưu cho hình ảnh
        uploadOptions = {
          ...uploadOptions,
          // Tự động tạo định dạng tối ưu (webp, jpg, png tùy theo trình duyệt)
          fetch_format: 'auto',
          // Nén hình ảnh với chất lượng 85% (giảm kích thước mà không mất chất lượng đáng kể)
          quality: 'auto:good',
          // Tự động tối ưu hóa
          optimization: true,
        };

        // Thêm các tùy chọn riêng cho các loại ảnh
        if (fileType === 'IMAGE') { // Ảnh thông thường
          // Không có xử lý đặc biệt
        } else if (fileType === 'THUMBNAIL') { // Thumbnails
          uploadOptions = {
            ...uploadOptions,
            // Thay đổi kích thước cho thumbnail (chiều rộng 400px, chiều cao tự động)
            transformation: [
              { width: 400, crop: 'scale' },
              { quality: 'auto:good' },
            ],
          };
        } else if (fileType === 'PROFILE') { // Ảnh hồ sơ người dùng
          uploadOptions = {
            ...uploadOptions,
            // Ảnh hồ sơ hình vuông với kích thước 300x300
            transformation: [
              { width: 300, height: 300, crop: 'fill', gravity: 'face' },
              { quality: 'auto:good' },
            ],
          };
        }
      } else if (file.mimetype.includes('video')) {
        resourceType = 'video';
        // Tùy chọn cho video
        uploadOptions = {
          ...uploadOptions,
          resource_type: 'video',
          // Các tùy chọn tối ưu cho video
          eager: [
            { quality: 'auto:good', format: 'mp4' },
          ],
          eager_async: true,
        };
      }

      // Xác định thư mục lưu trữ
      let folder = `rental-management/${fileType.toLowerCase()}`;
      
      // Nếu có folderId (ví dụ: property ID hoặc document ID), thêm vào đường dẫn thư mục
      if (folderId) {
        folder = `${folder}/${folderId}`;
      }

      // Cập nhật thư mục trong tùy chọn
      uploadOptions.folder = folder;

      console.log(`Uploading ${fileType} with options:`, uploadOptions);
      console.log(`File info: mimetype=${file.mimetype}, size=${file.size}, originalname=${file.originalname}`);
      
      let result;
      // Kiểm tra xem file có thuộc tính path không (Multer disk storage) hoặc buffer (Multer memory storage)
      if (file.path) {
        console.log(`Uploading file using path: ${file.path}`);
        result = await cloudinary.uploader.upload(file.path, uploadOptions);
      } else if (file.buffer) {
        console.log(`Uploading file using buffer`);
        
        // Sử dụng Promise để đợi kết quả từ upload_stream
        result = await new Promise((resolve, reject) => {
          // Tạo stream upload với callback xử lý kết quả
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, uploadResult) => {
              if (error) {
                console.error('Cloudinary stream upload error:', error);
                return reject(error);
              }
              return resolve(uploadResult);
            }
          );
          
          // Chuyển buffer thành stream và pipe vào Cloudinary stream
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
      } else {
        throw new Error('Invalid file format: Neither path nor buffer is available');
      }

      console.log(`Upload successful. Original size: ${file.size}, URL: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
        mimetype: file.mimetype,
        size: file.size,
        id: result.asset_id,
        // Thêm thông tin về biến đổi đã áp dụng nếu có
        transformations: result.eager ? result.eager : undefined,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }

  getFileUrl(publicId: string): string {
    return cloudinary.url(publicId);
  }

  /**
   * Di chuyển file từ vị trí tạm thời sang vị trí chính thức
   * @param sourcePublicId - Public ID của file nguồn (thư mục tạm)
   * @param targetFolder - Thư mục đích (ví dụ: properties/{id}/thumbnail)
   * @returns Thông tin file đã di chuyển
   */
  async moveFile(sourcePublicId: string, targetFolder: string): Promise<UploadResult> {
    try {
      console.log(`Moving file from ${sourcePublicId} to folder ${targetFolder}`);
      
      // Sử dụng Cloudinary API để rename file (di chuyển)
      // Cloudinary không có API di chuyển trực tiếp, nên chúng ta sẽ sử dụng rename
      const folder = `rental-management/${targetFolder}`;
      
      // Tạo public_id mới dựa trên thư mục đích
      // Lấy tên file từ public_id nguồn
      const sourceFileName = sourcePublicId.split('/').pop();
      const targetPublicId = `${folder}/${sourceFileName || 'file'}`;
      
      // Gọi API rename của Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.rename(
          sourcePublicId,
          targetPublicId,
          { overwrite: true },
          (error, result) => {
            if (error) {
              console.error('Cloudinary rename error:', error);
              return reject(error);
            }
            return resolve(result);
          }
        );
      });
      
      console.log(`File moved successfully to ${targetPublicId}`);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
        mimetype: result.resource_type,
        size: result.bytes,
        id: result.asset_id
      };
    } catch (error) {
      console.error('Cloudinary move error:', error);
      throw new Error(`Failed to move file in Cloudinary: ${error.message}`);
    }
  }
} 