import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { FileType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { Readable } from 'stream';

describe('FilesService', () => {
  let service: FilesService;
  let cloudinaryProvider: CloudinaryProvider;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-key',
        CLOUDINARY_API_SECRET: 'test-secret',
      };
      return config[key];
    }),
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
    stream: Readable.from(Buffer.from('test')),
    destination: '/tmp',
    filename: 'test.pdf',
    path: '/tmp/test.pdf',
  } as Express.Multer.File;

  const mockUploadResult = {
    url: 'https://example.com/test.pdf',
    publicId: 'test-id',
    provider: 'cloudinary',
    mimetype: 'application/pdf',
    size: 1024,
    id: 'test-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CloudinaryProvider,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue(mockUploadResult),
            deleteFile: jest.fn().mockResolvedValue(true),
            getFileUrl: jest.fn().mockReturnValue(mockUploadResult.url),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    cloudinaryProvider = module.get<CloudinaryProvider>(CloudinaryProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectFileType', () => {
    it('should detect image file type', () => {
      expect(service.detectFileType('image/jpeg')).toBe(FileType.IMAGE);
      expect(service.detectFileType('image/png')).toBe(FileType.IMAGE);
    });

    it('should detect PDF file type', () => {
      expect(service.detectFileType('application/pdf')).toBe(FileType.PDF);
    });

    it('should detect WORD file type', () => {
      expect(service.detectFileType('application/msword')).toBe(FileType.WORD);
      expect(service.detectFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(FileType.WORD);
    });

    it('should detect EXCEL file type', () => {
      expect(service.detectFileType('application/vnd.ms-excel')).toBe(FileType.EXCEL);
      expect(service.detectFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(FileType.EXCEL);
    });

    it('should detect text file type', () => {
      expect(service.detectFileType('text/plain')).toBe(FileType.TEXT);
    });

    it('should throw BadRequestException for unsupported file type', () => {
      expect(() => service.detectFileType('application/unknown')).toThrow('Unsupported file type: application/unknown');
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const result = await service.uploadFile(mockFile, FileType.PDF);

      expect(result).toEqual({
        ...mockUploadResult,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        id: mockUploadResult.publicId,
      });
      expect(cloudinaryProvider.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF.toString(), undefined);
    });

    it('should upload file with folderId', async () => {
      const result = await service.uploadFile(mockFile, FileType.PDF, 'documents');

      expect(result).toEqual({
        ...mockUploadResult,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        id: mockUploadResult.publicId,
      });
      expect(cloudinaryProvider.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF.toString(), 'documents');
    });

    it('should handle upload error', async () => {
      const error = new Error('Upload failed');
      jest.spyOn(cloudinaryProvider, 'uploadFile').mockRejectedValue(error);

      await expect(service.uploadFile(mockFile, FileType.PDF)).rejects.toThrow('Upload failed: Upload failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const result = await service.deleteFile('test-id', 'cloudinary');

      expect(result).toBe(true);
      expect(cloudinaryProvider.deleteFile).toHaveBeenCalledWith('test-id');
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      jest.spyOn(cloudinaryProvider, 'deleteFile').mockRejectedValue(error);

      await expect(service.deleteFile('test-id', 'cloudinary')).rejects.toThrow('Delete failed');
    });

    it('should throw BadRequestException for non-cloudinary provider', async () => {
      await expect(service.deleteFile('test-id', 'other-provider')).rejects.toThrow('Chỉ hỗ trợ provider Cloudinary');
    });
  });

  describe('getFileUrl', () => {
    it('should get file URL successfully', () => {
      const result = service.getFileUrl('test-id', 'cloudinary');

      expect(result).toBe(mockUploadResult.url);
      expect(cloudinaryProvider.getFileUrl).toHaveBeenCalledWith('test-id');
    });

    it('should handle get URL error', () => {
      const error = new Error('Get URL failed');
      jest.spyOn(cloudinaryProvider, 'getFileUrl').mockImplementation(() => {
        throw error;
      });

      expect(() => service.getFileUrl('test-id', 'cloudinary')).toThrow('Get URL failed');
    });

    it('should throw BadRequestException for non-cloudinary provider', () => {
      expect(() => service.getFileUrl('test-id', 'other-provider')).toThrow('Chỉ hỗ trợ provider Cloudinary');
    });
  });
}); 