import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { UploadResult } from '../interfaces/upload-result.interface';
import * as fs from 'fs';

@Injectable()
export class SupabaseProvider implements StorageProvider {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY'),
    );
  }

  async uploadFile(file: Express.Multer.File, fileType: string): Promise<UploadResult> {
    try {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `rental-management/${fileType.toLowerCase()}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from(this.configService.get('SUPABASE_BUCKET'))
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.configService.get('SUPABASE_BUCKET'))
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        publicId: filePath,
        provider: 'supabase',
        mimetype: file.mimetype,
        size: file.size,
        id: data.id,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to Supabase: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.configService.get('SUPABASE_BUCKET'))
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }

  getFileUrl(filePath: string): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.configService.get('SUPABASE_BUCKET'))
      .getPublicUrl(filePath);

    return publicUrl;
  }
} 