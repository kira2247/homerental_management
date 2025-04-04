import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { DocumentType, FileType } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import { Document } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Express } from 'express';
import { Readable } from 'stream';

const mockDocumentService = {
  create: jest.fn(),
  createWithFile: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByTenant: jest.fn(),
  findByUnit: jest.fn(),
  findByProperty: jest.fn(),
  findByVehicle: jest.fn(),
  findByMaintenance: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockDocument = {
  id: 'document-1',
  name: 'Test Document',
  type: DocumentType.CONTRACT,
  fileType: FileType.PDF,
  url: 'https://example.com/test.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  isImportant: true,
  description: 'Test Description',
  expiryDate: new Date(),
  propertyId: '1',
  tenantId: '1',
  unitId: '1',
  uploadedById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFile = {
  fieldname: 'file',
  originalname: 'test.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
  stream: Readable.from(Buffer.from('test')),
  destination: '/tmp',
  filename: 'test.pdf',
  path: '/tmp/test.pdf',
} as Express.Multer.File;

const mockReq = {
  user: {
    id: 'user-1',
  },
};

describe('DocumentController', () => {
  let controller: DocumentController;
  let documentService: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDocument),
            createWithFile: jest.fn().mockResolvedValue(mockDocument),
            findAll: jest.fn().mockResolvedValue([mockDocument]),
            findOne: jest.fn().mockResolvedValue(mockDocument),
            findByTenant: jest.fn().mockResolvedValue({
              data: [mockDocument],
              meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              },
            }),
            findByUnit: jest.fn().mockResolvedValue({
              data: [mockDocument],
              meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              },
            }),
            findByProperty: jest.fn().mockResolvedValue({
              data: [mockDocument],
              meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              },
            }),
            findByVehicle: jest.fn().mockResolvedValue({
              data: [mockDocument],
              meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              },
            }),
            findByMaintenance: jest.fn().mockResolvedValue({
              data: [mockDocument],
              meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
              },
            }),
            update: jest.fn().mockResolvedValue(mockDocument),
            remove: jest.fn().mockResolvedValue(mockDocument),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
    documentService = module.get<DocumentService>(DocumentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createDocumentDto: CreateDocumentDto = {
      name: 'Test Document',
      type: DocumentType.CONTRACT,
      fileType: FileType.PDF,
      url: 'https://example.com/test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      isImportant: true,
      description: 'Test document description',
      expiryDate: new Date().toISOString(),
      propertyId: '1',
      tenantId: '1',
      unitId: '1',
    };

    it('should create document successfully', async () => {
      const result = await controller.create(createDocumentDto, mockReq);

      expect(result).toEqual(mockDocument);
      expect(documentService.create).toHaveBeenCalledWith(createDocumentDto, mockReq.user.id);
    });

    it('should handle create error', async () => {
      const error = new Error('Create failed');
      jest.spyOn(documentService, 'create').mockRejectedValue(error);

      await expect(controller.create(createDocumentDto, mockReq)).rejects.toThrow(error);
    });
  });

  describe('createWithFile', () => {
    it('should create document with file successfully', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: true,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        propertyId: '1',
        tenantId: '1',
        unitId: '1',
      };

      const result = await controller.createWithFile(createDocumentDto, mockFile, mockReq);

      expect(result).toEqual(mockDocument);
      expect(documentService.createWithFile).toHaveBeenCalledWith(createDocumentDto, mockFile, mockReq.user.id);
    });

    it('should handle file upload error', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.CONTRACT,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: true,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        propertyId: '1',
        tenantId: '1',
        unitId: '1',
      };

      const error = new Error('Upload failed');
      jest.spyOn(documentService, 'createWithFile').mockRejectedValue(error);

      await expect(controller.createWithFile(createDocumentDto, mockFile, mockReq)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const result = await controller.findAll({});

      expect(result).toEqual([mockDocument]);
      expect(documentService.findAll).toHaveBeenCalledWith({});
    });

    it('should apply filters correctly', async () => {
      const filters = {
        tenantId: '1',
        propertyId: '1',
        unitId: '1',
        userId: '1',
      };

      await controller.findAll(filters);

      expect(documentService.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findOne', () => {
    it('should return document by id', async () => {
      const result = await controller.findOne('1');

      expect(result).toEqual(mockDocument);
      expect(documentService.findOne).toHaveBeenCalledWith('1');
    });

    it('should handle find one error', async () => {
      const error = new NotFoundException('Document not found');
      jest.spyOn(documentService, 'findOne').mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDocumentDto: UpdateDocumentDto = {
      name: 'Updated Document',
      description: 'Updated description',
    };

    it('should update document successfully', async () => {
      const result = await controller.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(documentService.update).toHaveBeenCalledWith('1', updateDocumentDto);
    });

    it('should handle update error', async () => {
      const error = new NotFoundException('Document not found');
      jest.spyOn(documentService, 'update').mockRejectedValue(error);

      await expect(controller.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove document successfully', async () => {
      const result = await controller.remove('1');

      expect(result).toEqual(mockDocument);
      expect(documentService.remove).toHaveBeenCalledWith('1');
    });

    it('should handle remove error', async () => {
      const error = new NotFoundException('Document not found');
      jest.spyOn(documentService, 'remove').mockRejectedValue(error);

      await expect(controller.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTenant', () => {
    it('should return documents by tenant id', async () => {
      const query: QueryDocumentDto = {} as QueryDocumentDto;
      const result = await controller.findByTenant('tenant-1', query);

      expect(documentService.findByTenant).toHaveBeenCalledWith('tenant-1', query);
      expect(result).toEqual({
        data: [mockDocument],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('findByUnit', () => {
    it('should return documents by unit id', async () => {
      const query: QueryDocumentDto = {} as QueryDocumentDto;
      const result = await controller.findByUnit('unit-1', query);

      expect(documentService.findByUnit).toHaveBeenCalledWith('unit-1', query);
      expect(result).toEqual({
        data: [mockDocument],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('findByProperty', () => {
    it('should return documents by property id', async () => {
      const query: QueryDocumentDto = {} as QueryDocumentDto;
      const result = await controller.findByProperty('property-1', query);

      expect(documentService.findByProperty).toHaveBeenCalledWith('property-1', query);
      expect(result).toEqual({
        data: [mockDocument],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('findByVehicle', () => {
    it('should return documents by vehicle id', async () => {
      const query: QueryDocumentDto = {} as QueryDocumentDto;
      const result = await controller.findByVehicle('vehicle-1', query);

      expect(documentService.findByVehicle).toHaveBeenCalledWith('vehicle-1', query);
      expect(result).toEqual({
        data: [mockDocument],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('findByMaintenance', () => {
    it('should return documents by maintenance id', async () => {
      const query: QueryDocumentDto = {} as QueryDocumentDto;
      const result = await controller.findByMaintenance('maintenance-1', query);

      expect(documentService.findByMaintenance).toHaveBeenCalledWith('maintenance-1', query);
      expect(result).toEqual({
        data: [mockDocument],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });
}); 