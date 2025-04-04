import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
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

  async uploadFile(file: Express.Multer.File, fileType: string): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: fileType === 'IMAGE' ? 'image' : 'raw',
        folder: `rental-management/${fileType.toLowerCase()}`,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
        mimetype: file.mimetype,
        size: file.size,
        id: result.asset_id,
      };
    } catch (error) {
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
} 