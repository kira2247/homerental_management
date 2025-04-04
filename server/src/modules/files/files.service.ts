import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { GoogleDriveProvider } from './providers/google-drive.provider';
import { SupabaseProvider } from './providers/supabase.provider';
import { StorageProvider } from './interfaces/storage-provider.interface';
import { FileType } from '@prisma/client';

@Injectable()
export class FilesService {
  private providers: Map<FileType, StorageProvider>;

  constructor(
    private configService: ConfigService,
    private cloudinaryProvider: CloudinaryProvider,
    private googleDriveProvider: GoogleDriveProvider,
    private supabaseProvider: SupabaseProvider,
  ) {
    this.providers = new Map<FileType, StorageProvider>();
    this.providers.set(FileType.IMAGE, this.cloudinaryProvider);
    this.providers.set(FileType.PDF, this.googleDriveProvider);
    this.providers.set(FileType.WORD, this.googleDriveProvider);
    this.providers.set(FileType.EXCEL, this.googleDriveProvider);
    this.providers.set(FileType.TEXT, this.supabaseProvider);
  }

  /**
   * Xác định loại file dựa vào MIME type
   */
  detectFileType(mimetype: string): FileType {
    if (mimetype.includes('image')) return FileType.IMAGE;
    if (mimetype.includes('pdf')) return FileType.PDF;
    if (mimetype.includes('word') || mimetype.includes('doc')) {
      // Không phải Excel
      if (!mimetype.includes('excel') && !mimetype.includes('spreadsheet') && !mimetype.includes('sheet')) {
        return FileType.WORD;
      }
    }
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet') || mimetype.includes('sheet')) return FileType.EXCEL;
    if (mimetype.includes('text')) return FileType.TEXT;
    throw new BadRequestException(`Unsupported file type: ${mimetype}`);
  }

  async uploadFile(file: Express.Multer.File, fileType: FileType, provider?: string) {
    const storageProvider = provider ? this.getProviderByString(provider) : this.getProvider(fileType);
    if (!storageProvider) {
      throw new BadRequestException(provider ? `Unknown provider: ${provider}` : `No provider found for file type: ${fileType}`);
    }

    try {
      const result = await storageProvider.uploadFile(file, fileType.toString());
      return {
        ...result,
        mimetype: file.mimetype,
        size: file.size,
        id: result.publicId,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileId: string, provider: string) {
    const storageProvider = this.getProviderByString(provider);
    if (!storageProvider) {
      throw new BadRequestException(`Unknown provider: ${provider}`);
    }

    try {
      return storageProvider.deleteFile(fileId);
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  getFileUrl(fileId: string, provider: string) {
    const storageProvider = this.getProviderByString(provider);
    if (!storageProvider) {
      throw new BadRequestException(`Unknown provider: ${provider}`);
    }

    try {
      return storageProvider.getFileUrl(fileId);
    } catch (error) {
      throw new BadRequestException(`Get URL failed: ${error.message}`);
    }
  }

  private getProvider(fileType: FileType): StorageProvider {
    return this.providers.get(fileType);
  }

  private getProviderByString(provider: string): StorageProvider {
    switch (provider) {
      case 'cloudinary':
        return this.cloudinaryProvider;
      case 'google-drive':
        return this.googleDriveProvider;
      case 'supabase':
        return this.supabaseProvider;
      default:
        return null;
    }
  }
} 