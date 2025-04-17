import { Multer } from 'multer';
import { UploadResult } from './upload-result.interface';

export interface StorageProvider {
  uploadFile(file: Express.Multer.File, fileType: string, folderId?: string): Promise<UploadResult>;
  deleteFile(fileId: string): Promise<void>;
  getFileUrl(fileId: string): string;
}