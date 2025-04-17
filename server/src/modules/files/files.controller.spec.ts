import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Express } from 'express';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  const mockUploadResult = {
    url: 'https://example.com/test.pdf',
    publicId: 'test-id',
    provider: 'cloudinary',
    mimetype: 'application/pdf',
    size: 1024,
    id: 'test-id',
  };

  const mockFilesService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      mockFilesService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadFile(mockFile, FileType.PDF);

      expect(result).toEqual(mockUploadResult);
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF, undefined);
    });
    
    it('should upload a file with folderId', async () => {
      mockFilesService.uploadFile.mockResolvedValue(mockUploadResult);

      const result = await controller.uploadFile(mockFile, FileType.PDF, 'documents');

      expect(result).toEqual(mockUploadResult);
      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF, 'documents');
    });

    it('should throw BadRequestException if file upload fails', async () => {
      const error = new BadRequestException('Invalid file type');
      mockFilesService.uploadFile.mockRejectedValue(error);

      await expect(controller.uploadFile(mockFile, FileType.PDF)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      mockFilesService.deleteFile.mockResolvedValue(undefined);

      await controller.deleteFile('test-id', 'cloudinary');

      expect(service.deleteFile).toHaveBeenCalledWith('test-id', 'cloudinary');
    });

    it('should throw NotFoundException if file not found', async () => {
      const error = new NotFoundException('File not found');
      mockFilesService.deleteFile.mockRejectedValue(error);

      await expect(controller.deleteFile('test-id', 'cloudinary')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if deletion fails', async () => {
      const error = new Error('Failed to delete file');
      mockFilesService.deleteFile.mockRejectedValue(error);

      await expect(controller.deleteFile('test-id', 'cloudinary')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFileUrl', () => {
    it('should get file URL', async () => {
      const fileUrl = 'https://example.com/test.pdf';
      mockFilesService.getFileUrl.mockResolvedValue(fileUrl);

      const result = await controller.getFileUrl('test-id', 'cloudinary');

      expect(result).toBe(fileUrl);
      expect(service.getFileUrl).toHaveBeenCalledWith('test-id', 'cloudinary');
    });

    it('should throw NotFoundException if file not found', async () => {
      const error = new NotFoundException('File not found');
      mockFilesService.getFileUrl.mockRejectedValue(error);

      await expect(controller.getFileUrl('test-id', 'cloudinary')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if getting URL fails', async () => {
      const error = new Error('Failed to get file URL');
      mockFilesService.getFileUrl.mockRejectedValue(error);

      await expect(controller.getFileUrl('test-id', 'cloudinary')).rejects.toThrow(BadRequestException);
    });
  });
}); 