import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { DocumentType, FileType, MaintenanceStatus, VehicleType } from '@prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { Readable } from 'stream';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DocumentService', () => {
  let service: DocumentService;
  let prismaService: PrismaService;
  let filesService: FilesService;

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

  const mockUploadResult = {
    publicId: 'test-id',
    url: 'https://example.com/test.pdf',
    provider: 'cloudinary',
    mimetype: 'application/pdf',
    size: 1024,
    id: 'test-id',
  };

  const mockDocument = {
    id: '1',
    name: 'Test Document',
    type: DocumentType.ID_CARD,
    fileType: FileType.PDF,
    url: 'https://example.com/test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    isImportant: false,
    description: 'Test Description',
    expiryDate: new Date(),
    contractDetails: null,
    tenantId: null,
    unitId: null,
    propertyId: null,
    vehicleId: null,
    maintenanceId: null,
    uploadedById: 'user-1',
    fileId: 'test-id',
    fileProvider: 'cloudinary',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocumentWithTenant = {
    ...mockDocument,
    tenantId: 'tenant-1',
    tenant: {
      id: 'tenant-1',
      name: 'Tenant Name',
      phone: '123456789',
    },
    vehicle: null,
    property: null,
    unit: null,
    maintenance: null,
    uploadedBy: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
  };

  const mockDocumentWithUnit = {
    ...mockDocument,
    unitId: 'unit-1',
    unit: {
      id: 'unit-1',
      name: 'Unit Name',
      property: { id: 'property-1', name: 'Property Name' },
    },
    tenant: null,
    vehicle: null,
    property: null,
    maintenance: null,
    uploadedBy: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
  };

  const mockDocumentWithProperty = {
    ...mockDocument,
    propertyId: 'property-1',
    property: {
      id: 'property-1',
      name: 'Property Name',
      address: '123 Main Street',
    },
    tenant: null,
    vehicle: null,
    unit: null,
    maintenance: null,
    uploadedBy: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
  };

  const mockDocumentWithVehicle = {
    ...mockDocument,
    vehicleId: 'vehicle-1',
    vehicle: {
      id: 'vehicle-1',
      type: VehicleType.CAR,
      licensePlate: 'ABC123',
    },
    tenant: null,
    property: null,
    unit: null,
    maintenance: null,
    uploadedBy: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
  };

  const mockDocumentWithMaintenance = {
    ...mockDocument,
    maintenanceId: 'maintenance-1',
    maintenance: {
      id: 'maintenance-1',
      title: 'Maintenance Title',
      description: 'Maintenance description',
      status: MaintenanceStatus.PENDING,
    },
    tenant: null,
    vehicle: null,
    property: null,
    unit: null,
    uploadedBy: { id: 'user-1', name: 'Admin User', email: 'admin@example.com' },
  };

  const mockDocuments = [
    mockDocument,
    {
      ...mockDocument,
      id: '2',
      name: 'Contract Document',
      type: DocumentType.CONTRACT,
      isImportant: true,
    },
    {
      ...mockDocument,
      id: '3',
      name: 'Invoice PDF',
      type: DocumentType.INVOICE,
      createdAt: new Date('2023-01-15'),
    },
    {
      ...mockDocument,
      id: '4',
      name: 'Property Image',
      type: DocumentType.PROPERTY_PHOTO,
      fileType: FileType.IMAGE,
      mimeType: 'image/jpeg',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: {
            document: {
              create: jest.fn().mockResolvedValue(mockDocument),
              findUnique: jest.fn().mockResolvedValue(mockDocument),
              findMany: jest.fn().mockResolvedValue(mockDocuments),
              update: jest.fn().mockResolvedValue(mockDocument),
              delete: jest.fn().mockResolvedValue(mockDocument),
              count: jest.fn().mockResolvedValue(mockDocuments.length),
            },
            tenant: {
              findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test Tenant' }),
            },
            unit: {
              findUnique: jest.fn().mockResolvedValue({ id: 'unit-1', name: 'Test Unit' }),
            },
            property: {
              findUnique: jest.fn().mockResolvedValue({ id: 'property-1', name: 'Test Property' }),
            },
            vehicle: {
              findUnique: jest.fn().mockResolvedValue({ id: 'vehicle-1', name: 'Test Vehicle' }),
            },
            maintenanceRequest: {
              findUnique: jest.fn().mockResolvedValue({ id: 'maintenance-1', title: 'Test Maintenance' }),
            },
          },
        },
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue(mockUploadResult),
            detectFileType: jest.fn().mockReturnValue(FileType.PDF),
            deleteFile: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    prismaService = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a document', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
      };

      const result = await service.create(createDocumentDto, 'user-1');

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...createDocumentDto,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: undefined,
          unit: undefined,
          property: undefined,
          vehicle: undefined,
          maintenance: undefined,
        },
      });
    });

    it('should create a document with tenant connection', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        tenantId: 'tenant-1',
      };

      await service.create(createDocumentDto, 'user-1');

      expect(prismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
      });
      
      // Tạo một bản sao của DTO mà không có tenantId
      const { tenantId, ...dtoCopy } = createDocumentDto;
      
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...dtoCopy,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: { connect: { id: 'tenant-1' } },
          unit: undefined,
          property: undefined,
          vehicle: undefined,
          maintenance: undefined,
        },
      });
    });

    it('should create a document with unit connection', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        unitId: 'unit-1',
      };

      await service.create(createDocumentDto, 'user-1');

      expect(prismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
      });
      
      // Tạo một bản sao của DTO mà không có unitId
      const { unitId, ...dtoCopy } = createDocumentDto;
      
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...dtoCopy,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: undefined,
          unit: { connect: { id: 'unit-1' } },
          property: undefined,
          vehicle: undefined,
          maintenance: undefined,
        },
      });
    });

    it('should create a document with property connection', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        propertyId: 'property-1',
      };

      await service.create(createDocumentDto, 'user-1');

      expect(prismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-1' },
      });
      
      // Tạo một bản sao của DTO mà không có propertyId
      const { propertyId, ...dtoCopy } = createDocumentDto;
      
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...dtoCopy,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: undefined,
          unit: undefined,
          property: { connect: { id: 'property-1' } },
          vehicle: undefined,
          maintenance: undefined,
        },
      });
    });

    it('should create a document with vehicle connection', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        vehicleId: 'vehicle-1',
      };

      await service.create(createDocumentDto, 'user-1');

      expect(prismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
      });
      
      // Tạo một bản sao của DTO mà không có vehicleId
      const { vehicleId, ...dtoCopy } = createDocumentDto;
      
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...dtoCopy,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: undefined,
          unit: undefined,
          property: undefined,
          vehicle: { connect: { id: 'vehicle-1' } },
          maintenance: undefined,
        },
      });
    });

    it('should create a document with maintenance connection', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
        maintenanceId: 'maintenance-1',
      };

      await service.create(createDocumentDto, 'user-1');

      expect(prismaService.maintenanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'maintenance-1' },
      });
      
      // Tạo một bản sao của DTO mà không có maintenanceId
      const { maintenanceId, ...dtoCopy } = createDocumentDto;
      
      expect(prismaService.document.create).toHaveBeenCalledWith({
        data: {
          ...dtoCopy,
          uploadedBy: { connect: { id: 'user-1' } },
          tenant: undefined,
          unit: undefined,
          property: undefined,
          vehicle: undefined,
          maintenance: { connect: { id: 'maintenance-1' } },
        },
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        tenantId: 'not-found-tenant',
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unit not found', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        unitId: 'not-found-unit',
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      jest.spyOn(prismaService.unit, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when property not found', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        propertyId: 'not-found-property',
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      jest.spyOn(prismaService.property, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        vehicleId: 'not-found-vehicle',
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when maintenance not found', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        maintenanceId: 'not-found-maintenance',
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      jest.spyOn(prismaService.maintenanceRequest, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.create).not.toHaveBeenCalled();
    });

    it('should handle create error', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
      };

      const error = new Error('Create failed');
      jest.spyOn(prismaService.document, 'create').mockRejectedValue(error);

      await expect(service.create(createDocumentDto, 'user-1')).rejects.toThrow('Create failed');
    });
  });

  describe('createWithFile', () => {
    it('should create a document with file', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf',
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
      };

      const result = await service.createWithFile(createDocumentDto, mockFile, 'user-1');

      expect(filesService.detectFileType).toHaveBeenCalledWith(mockFile.mimetype);
      expect(filesService.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF, 'documents');
      expect(result).toEqual(mockDocument);
    });

    it('should handle upload error', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      const error = new Error('Upload failed');
      jest.spyOn(filesService, 'uploadFile').mockRejectedValue(error);

      await expect(service.createWithFile(createDocumentDto, mockFile, 'user-1')).rejects.toThrow(
        'Không thể tạo tài liệu với file: Upload failed'
      );
    });
    
    it('should create a document with custom folder', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf',
        isImportant: false,
        description: 'Test Description',
        expiryDate: new Date().toISOString(),
      };
      
      const customFolder = 'custom-folder';
      const result = await service.createWithFile(createDocumentDto, mockFile, 'user-1', customFolder);

      expect(filesService.detectFileType).toHaveBeenCalledWith(mockFile.mimetype);
      expect(filesService.uploadFile).toHaveBeenCalledWith(mockFile, FileType.PDF, customFolder);
      expect(result).toEqual(mockDocument);
    });

    it('should handle create error', async () => {
      const createDocumentDto: CreateDocumentDto = {
        name: 'Test Document',
        type: DocumentType.ID_CARD,
        fileType: FileType.PDF,
        url: 'https://example.com/document.pdf'
      };

      const error = new Error('Create failed');
      jest.spyOn(service, 'create').mockRejectedValue(error);

      await expect(service.createWithFile(createDocumentDto, mockFile, 'user-1', 'documents')).rejects.toThrow(
        'Không thể tạo tài liệu với file: Create failed'
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const queryDto: QueryDocumentDto = {};

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        data: mockDocuments,
        meta: {
          total: mockDocuments.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(prismaService.document.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should filter documents by search term', async () => {
      const queryDto: QueryDocumentDto = {
        search: 'contract',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'contract', mode: 'insensitive' } },
              { description: { contains: 'contract', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter documents by document type', async () => {
      const queryDto: QueryDocumentDto = {
        type: [DocumentType.CONTRACT, DocumentType.INVOICE],
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: { in: [DocumentType.CONTRACT, DocumentType.INVOICE] },
          },
        })
      );
    });

    it('should filter documents by file type', async () => {
      const queryDto: QueryDocumentDto = {
        fileType: [FileType.PDF, FileType.IMAGE],
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fileType: { in: [FileType.PDF, FileType.IMAGE] },
          },
        })
      );
    });

    it('should filter documents by importance', async () => {
      const queryDto: QueryDocumentDto = {
        isImportant: true,
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isImportant: true,
          },
        })
      );
    });

    it('should filter documents by tenantId', async () => {
      const queryDto: QueryDocumentDto = {
        tenantId: 'tenant-1',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
          },
        })
      );
    });

    it('should filter documents by unitId', async () => {
      const queryDto: QueryDocumentDto = {
        unitId: 'unit-1',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            unitId: 'unit-1',
          },
        })
      );
    });

    it('should filter documents by propertyId', async () => {
      const queryDto: QueryDocumentDto = {
        propertyId: 'property-1',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            propertyId: 'property-1',
          },
        })
      );
    });

    it('should filter documents by vehicleId', async () => {
      const queryDto: QueryDocumentDto = {
        vehicleId: 'vehicle-1',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vehicleId: 'vehicle-1',
          },
        })
      );
    });

    it('should filter documents by maintenanceId', async () => {
      const queryDto: QueryDocumentDto = {
        maintenanceId: 'maintenance-1',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            maintenanceId: 'maintenance-1',
          },
        })
      );
    });

    it('should filter documents by created date range', async () => {
      const fromDate = '2023-01-01';
      const toDate = '2023-01-31';
      const queryDto: QueryDocumentDto = {
        fromDate,
        toDate,
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date(fromDate),
              lte: new Date(toDate),
            },
          },
        })
      );
    });

    it('should filter documents by expiry date range', async () => {
      const expiryFromDate = '2023-01-01';
      const expiryToDate = '2023-01-31';
      const queryDto: QueryDocumentDto = {
        expiryFromDate,
        expiryToDate,
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            expiryDate: {
              gte: new Date(expiryFromDate),
              lte: new Date(expiryToDate),
            },
          },
        })
      );
    });

    it('should support pagination', async () => {
      const queryDto: QueryDocumentDto = {
        page: 2,
        limit: 5,
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });

    it('should support sorting', async () => {
      const queryDto: QueryDocumentDto = {
        sortBy: 'name',
        sortOrder: 'asc',
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should combine multiple filters', async () => {
      const queryDto: QueryDocumentDto = {
        search: 'test',
        type: [DocumentType.CONTRACT],
        fileType: [FileType.PDF],
        isImportant: true,
        fromDate: '2023-01-01',
        toDate: '2023-01-31',
        page: 1,
        limit: 10,
      };

      await service.findAll(queryDto);

      expect(prismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
            type: { in: [DocumentType.CONTRACT] },
            fileType: { in: [FileType.PDF] },
            isImportant: true,
            createdAt: {
              gte: new Date('2023-01-01'),
              lte: new Date('2023-01-31'),
            },
          },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should handle findMany error', async () => {
      const queryDto: QueryDocumentDto = {
        type: [DocumentType.ID_CARD],
        fileType: [FileType.PDF],
        isImportant: false,
        search: 'Test',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const error = new Error('Find many failed');
      jest.spyOn(prismaService.document, 'count').mockRejectedValue(error);

      await expect(service.findAll(queryDto)).rejects.toThrow('Find many failed');
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      const result = await service.findOne('1');

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when document not found', async () => {
      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findOne('not-found')).rejects.toThrow(NotFoundException);
    });

    it('should handle findUnique error', async () => {
      const error = new Error('Find unique failed');
      jest.spyOn(prismaService.document, 'findUnique').mockRejectedValue(error);

      await expect(service.findOne('1')).rejects.toThrow('Find unique failed');
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDocumentDto,
      });
    });

    it('should handle nullifying tenant connection', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
        tenantId: null,
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Document',
          tenantId: null,
        },
      });
    });

    it('should handle nullifying unit connection', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
        unitId: null,
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Document',
          unitId: null,
        },
      });
    });

    it('should handle nullifying property connection', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
        propertyId: null,
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Document',
          propertyId: null,
        },
      });
    });

    it('should handle nullifying vehicle connection', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
        vehicleId: null,
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Document',
          vehicleId: null,
        },
      });
    });

    it('should handle nullifying maintenance connection', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
        maintenanceId: null,
      };

      const result = await service.update('1', updateDocumentDto);

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Document',
          maintenanceId: null,
        },
      });
    });

    it('should throw NotFoundException when tenant not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        tenantId: 'not-found-tenant',
      };

      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.document.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unit not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        unitId: 'not-found-unit',
      };

      jest.spyOn(prismaService.unit, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.document.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when property not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        propertyId: 'not-found-property',
      };

      jest.spyOn(prismaService.property, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.document.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vehicle not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        vehicleId: 'not-found-vehicle',
      };

      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.document.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when maintenance not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        maintenanceId: 'not-found-maintenance',
      };

      jest.spyOn(prismaService.maintenanceRequest, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.document.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when document not found for update', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
      };

      // Giả lập tìm không thấy document
      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('not-found', updateDocumentDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle update error', async () => {
      const updateDocumentDto: UpdateDocumentDto = {
        name: 'Updated Document',
      };

      const error = new Error('Update failed');
      jest.spyOn(prismaService.document, 'update').mockRejectedValue(error);

      await expect(service.update('1', updateDocumentDto)).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should remove a document', async () => {
      const mockDocumentWithFileInfo = {
        ...mockDocument,
        description: 'Test Description [Storage: cloudinary|file123]',
      };

      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(mockDocumentWithFileInfo);

      const result = await service.remove('1');

      expect(result).toEqual(mockDocument);
      expect(prismaService.document.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(filesService.deleteFile).toHaveBeenCalledWith('file123', 'cloudinary');
      expect(prismaService.document.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when document not found for removal', async () => {
      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.remove('not-found')).rejects.toThrow(NotFoundException);
      expect(prismaService.document.delete).not.toHaveBeenCalled();
    });

    it('should handle deletion even if file info not present', async () => {
      const mockDocWithoutFileInfo = {
        ...mockDocument,
        description: 'Test Description without file info',
      };

      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(mockDocWithoutFileInfo);

      await service.remove('1');

      expect(filesService.deleteFile).not.toHaveBeenCalled();
      expect(prismaService.document.delete).toHaveBeenCalled();
    });

    it('should handle deletion when description is null', async () => {
      const mockDocWithNullDescription = {
        ...mockDocument,
        description: null,
      };

      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(mockDocWithNullDescription);

      await service.remove('1');

      expect(filesService.deleteFile).not.toHaveBeenCalled();
      expect(prismaService.document.delete).toHaveBeenCalled();
    });

    it('should handle findUnique error', async () => {
      const error = new Error('Find unique failed');
      jest.spyOn(prismaService.document, 'findUnique').mockRejectedValue(error);

      await expect(service.remove('1')).rejects.toThrow('Find unique failed');
    });

    it('should handle deleteFile error', async () => {
      const mockDocumentWithFileInfo = {
        ...mockDocument,
        description: 'Test Description [Storage: cloudinary|file123]',
      };

      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(mockDocumentWithFileInfo);
      const error = new Error('Delete file failed');
      jest.spyOn(filesService, 'deleteFile').mockRejectedValue(error);

      await service.remove('1');

      // Should still delete the document even if file deletion fails
      expect(prismaService.document.delete).toHaveBeenCalled();
    });

    it('should log error when deleteFile fails', async () => {
      const mockDocumentWithFileInfo = {
        ...mockDocument,
        description: 'Test Description [Storage: cloudinary|file123]',
      };

      jest.spyOn(prismaService.document, 'findUnique').mockResolvedValueOnce(mockDocumentWithFileInfo);
      const error = new Error('Delete file failed');
      jest.spyOn(filesService, 'deleteFile').mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.remove('1');

      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith('Lỗi xóa file: Delete file failed');
      consoleSpy.mockRestore();
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      jest.spyOn(prismaService.document, 'delete').mockRejectedValue(error);

      await expect(service.remove('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('findByTenant', () => {
    it('should find documents by tenant id', async () => {
      const queryDto: QueryDocumentDto = {};
      const mockResponse = {
        data: [mockDocumentWithTenant],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockResponse as any);

      const result = await service.findByTenant('tenant-1', queryDto);

      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        tenantId: 'tenant-1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when tenant not found in findByTenant', async () => {
      const queryDto: QueryDocumentDto = {};
      
      jest.spyOn(prismaService.tenant, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByTenant('not-found-tenant', queryDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUnit', () => {
    it('should find documents by unit id', async () => {
      const queryDto: QueryDocumentDto = {};
      const mockResponse = {
        data: [mockDocumentWithUnit],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockResponse as any);

      const result = await service.findByUnit('unit-1', queryDto);

      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        unitId: 'unit-1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when unit not found in findByUnit', async () => {
      const queryDto: QueryDocumentDto = {};
      
      jest.spyOn(prismaService.unit, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByUnit('not-found-unit', queryDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByProperty', () => {
    it('should find documents by property id', async () => {
      const queryDto: QueryDocumentDto = {};
      const mockResponse = {
        data: [mockDocumentWithProperty],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockResponse as any);

      const result = await service.findByProperty('property-1', queryDto);

      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        propertyId: 'property-1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when property not found in findByProperty', async () => {
      const queryDto: QueryDocumentDto = {};
      
      jest.spyOn(prismaService.property, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByProperty('not-found-property', queryDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByVehicle', () => {
    it('should find documents by vehicle id', async () => {
      const queryDto: QueryDocumentDto = {};
      const mockResponse = {
        data: [mockDocumentWithVehicle],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockResponse as any);

      const result = await service.findByVehicle('vehicle-1', queryDto);

      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        vehicleId: 'vehicle-1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when vehicle not found in findByVehicle', async () => {
      const queryDto: QueryDocumentDto = {};
      
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByVehicle('not-found-vehicle', queryDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByMaintenance', () => {
    it('should find documents by maintenance id', async () => {
      const queryDto: QueryDocumentDto = {};
      const mockResponse = {
        data: [mockDocumentWithMaintenance],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockResponse as any);

      const result = await service.findByMaintenance('maintenance-1', queryDto);

      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        maintenanceId: 'maintenance-1',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw NotFoundException when maintenance not found in findByMaintenance', async () => {
      const queryDto: QueryDocumentDto = {};
      
      jest.spyOn(prismaService.maintenanceRequest, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findByMaintenance('not-found-maintenance', queryDto)).rejects.toThrow(NotFoundException);
    });
  });
}); 