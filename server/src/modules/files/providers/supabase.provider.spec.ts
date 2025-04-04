// Định nghĩa mockStorage trước khi jest.mock
const mockStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn(),
  remove: jest.fn(),
  getPublicUrl: jest.fn(),
};

// Dùng jest.mock trước các import
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: mockStorage,
  }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseProvider } from './supabase.provider';
import { createClient } from '@supabase/supabase-js';

describe('SupabaseProvider', () => {
  let provider: SupabaseProvider;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_KEY: 'test-key',
        SUPABASE_BUCKET: 'test-bucket',
      };
      return config[key];
    }),
  };

  const mockFile = {
    originalname: 'test.txt',
    mimetype: 'text/plain',
    buffer: Buffer.from('test'),
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<SupabaseProvider>(SupabaseProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      mockStorage.upload.mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      });

      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/test.txt' },
      });

      const result = await provider.uploadFile(mockFile, 'TEXT');

      expect(result).toEqual({
        url: 'https://example.supabase.co/storage/v1/object/test.txt',
        publicId: expect.stringContaining('rental-management/text/'),
        provider: 'supabase',
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        id: 'test-id',
      });
      expect(mockStorage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(mockStorage.getPublicUrl).toHaveBeenCalled();
    });

    it('should handle upload error', async () => {
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: new Error('Upload failed'),
      });

      await expect(provider.uploadFile(mockFile, 'TEXT')).rejects.toThrow('Failed to upload file to Supabase');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockStorage.remove.mockResolvedValue({
        data: { id: 'test-id' },
        error: null,
      });

      await provider.deleteFile('test-path');

      expect(mockStorage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorage.remove).toHaveBeenCalledWith(['test-path']);
    });

    it('should handle delete error', async () => {
      mockStorage.remove.mockResolvedValue({
        data: null,
        error: new Error('Delete failed'),
      });

      await expect(provider.deleteFile('test-path')).rejects.toThrow('Failed to delete file from Supabase');
    });
  });

  describe('getFileUrl', () => {
    it('should return file URL', () => {
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.supabase.co/storage/v1/object/test.txt' },
      });

      const result = provider.getFileUrl('test-path');

      expect(result).toBe('https://example.supabase.co/storage/v1/object/test.txt');
      expect(mockStorage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith('test-path');
    });

    it('should handle get URL error', () => {
      const error = new Error('Get URL failed');
      mockStorage.getPublicUrl.mockImplementation(() => {
        throw error;
      });

      expect(() => provider.getFileUrl('test-path')).toThrow('Get URL failed');
    });
  });
}); 