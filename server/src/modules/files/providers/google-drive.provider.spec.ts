import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

// Cần mock trước khi import GoogleDriveProvider
const mockFiles = {
  create: jest.fn(),
  delete: jest.fn(),
};

const mockPermissions = {
  create: jest.fn(),
};

jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn().mockReturnValue({
      files: mockFiles,
      permissions: mockPermissions,
    }),
    auth: {
      GoogleAuth: jest.fn().mockImplementation(() => ({
        getClient: jest.fn().mockResolvedValue({}),
      })),
    },
  },
}));

// Import sau khi đã mock
import { GoogleDriveProvider } from './google-drive.provider';

describe('GoogleDriveProvider', () => {
  let provider: GoogleDriveProvider;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<GoogleDriveProvider>(GoogleDriveProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('uploadFile', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('test'),
      destination: '/tmp',
      filename: 'test.pdf',
      path: '/tmp/test.pdf',
      encoding: '7bit',
      stream: Readable.from(Buffer.from('test')),
    };

    it('should upload file successfully', async () => {
      const mockUploadResult = {
        data: {
          id: 'test-id',
          webViewLink: 'https://example.com/test.pdf',
        },
      };

      mockFiles.create.mockResolvedValue(mockUploadResult);

      const result = await provider.uploadFile(mockFile, 'PDF');

      expect(result).toEqual({
        id: mockUploadResult.data.id,
        url: mockUploadResult.data.webViewLink,
        publicId: mockUploadResult.data.id,
        provider: 'google-drive',
        mimetype: mockFile.mimetype,
        size: mockFile.size,
      });
      expect(mockFiles.create).toHaveBeenCalled();
      expect(mockPermissions.create).toHaveBeenCalled();
    });

    it('should handle upload error', async () => {
      const error = new Error('Upload failed');
      mockFiles.create.mockRejectedValue(error);

      await expect(provider.uploadFile(mockFile, 'PDF')).rejects.toThrow('Failed to upload file to Google Drive');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockFiles.delete.mockResolvedValue(undefined);

      await provider.deleteFile('test-id');

      expect(mockFiles.delete).toHaveBeenCalledWith({
        fileId: 'test-id',
      });
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      mockFiles.delete.mockRejectedValue(error);

      await expect(provider.deleteFile('test-id')).rejects.toThrow('Failed to delete file from Google Drive');
    });
  });

  describe('getFileUrl', () => {
    it('should return file URL with correct format', () => {
      const fileId = 'test-id';
      const result = provider.getFileUrl(fileId);
      expect(result).toBe(`https://drive.google.com/file/d/${fileId}/view`);
    });
  });
}); 