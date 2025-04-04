import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { UploadResult } from '../interfaces/upload-result.interface';

@Injectable()
export class GoogleDriveProvider implements StorageProvider {
  private driveClient;

  constructor(private configService: ConfigService) {
    const auth = new google.auth.GoogleAuth({
      keyFile: this.configService.get('GOOGLE_SERVICE_ACCOUNT_KEY_PATH'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    this.driveClient = google.drive({ version: 'v3', auth });
  }

  async uploadFile(file: Express.Multer.File, fileType: string): Promise<UploadResult> {
    try {
      const fileMetadata = {
        name: file.originalname,
        parents: [this.configService.get('GOOGLE_DRIVE_FOLDER_ID')],
      };

      const media = {
        mimeType: file.mimetype,
        body: file.buffer,
      };

      const response = await this.driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      // Set file permissions to anyone with the link can view
      await this.driveClient.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return {
        url: response.data.webViewLink,
        publicId: response.data.id,
        provider: 'google-drive',
        mimetype: file.mimetype,
        size: file.size,
        id: response.data.id,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.driveClient.files.delete({
        fileId: fileId,
      });
    } catch (error) {
      throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
    }
  }

  getFileUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
} 