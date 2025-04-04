import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    url: jest.fn(),
  },
}));

describe('CloudinaryProvider', () => {
  let provider: CloudinaryProvider;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('test'),
    path: '/tmp/test.jpg',
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'CLOUDINARY_CLOUD_NAME':
                  return 'test-cloud';
                case 'CLOUDINARY_API_KEY':
                  return 'test-key';
                case 'CLOUDINARY_API_SECRET':
                  return 'test-secret';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<CloudinaryProvider>(CloudinaryProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('uploadFile', () => {
    const mockUploadResult = {
      secure_url: 'https://example.com/test.jpg',
      public_id: 'test-id',
      asset_id: 'asset-id',
    };

    it('should upload file successfully', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(mockUploadResult);

      const result = await provider.uploadFile(mockFile, 'IMAGE');

      expect(result).toEqual({
        url: mockUploadResult.secure_url,
        publicId: mockUploadResult.public_id,
        provider: 'cloudinary',
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        id: mockUploadResult.asset_id,
      });
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(mockFile.path, {
        resource_type: 'image',
        folder: 'rental-management/image',
      });
    });

    it('should handle upload error', async () => {
      const error = new Error('Upload failed');
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(error);

      await expect(provider.uploadFile(mockFile, 'IMAGE')).rejects.toThrow('Failed to upload file to Cloudinary');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await provider.deleteFile('test-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-id');
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(error);

      await expect(provider.deleteFile('test-id')).rejects.toThrow('Failed to delete file from Cloudinary');
    });
  });

  describe('getFileUrl', () => {
    it('should return file URL', () => {
      const url = 'https://example.com/test.jpg';
      (cloudinary.url as jest.Mock).mockReturnValue(url);

      const result = provider.getFileUrl('test-id');

      expect(result).toBe(url);
      expect(cloudinary.url).toHaveBeenCalledWith('test-id');
    });
  });
}); 