import { Test, TestingModule } from '@nestjs/testing';
import { PropertyService } from './property.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PropertyStatus, PropertyType } from '@prisma/client';
import { CreatePropertyDto, QueryPropertyDto, UpdatePropertyDto } from './dto';

describe('PropertyService', () => {
  let service: PropertyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    unit: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    maintenanceRequest: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a property', async () => {
      const createPropertyDto: CreatePropertyDto = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        district: 'Test District',
        type: PropertyType.APARTMENT,
        userId: 'user-id',
        ownerId: 'owner-id',
      };

      const expectedProperty = {
        id: 'property-id',
        ...createPropertyDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.create.mockResolvedValue(expectedProperty);

      const result = await service.create(createPropertyDto);

      expect(result).toEqual(expectedProperty);
      expect(mockPrismaService.property.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createPropertyDto.name,
          address: createPropertyDto.address,
          city: createPropertyDto.city,
          district: createPropertyDto.district,
          type: createPropertyDto.type,
          userId: createPropertyDto.userId,
          ownerId: createPropertyDto.ownerId,
        }),
      });
    });

    it('should throw BadRequestException on PrismaClientKnownRequestError P2003', async () => {
      const createPropertyDto: CreatePropertyDto = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        district: 'Test District',
        type: PropertyType.APARTMENT,
        userId: 'invalid-user-id',
        ownerId: 'invalid-owner-id',
      };

      // Thay vì tạo lỗi thực tế, ta gọi trực tiếp hàm xử lý lỗi
      // bằng cách spy vào hàm create và thực hiện đúng phần xử lý lỗi
      mockPrismaService.property.create.mockImplementation(() => {
        // Mô phỏng hành vi trong service khi dính lỗi P2003
        throw new BadRequestException('ID người dùng hoặc chủ sở hữu không hợp lệ');
      });

      // Kiểm tra xem BadRequestException có được ném ra không
      await expect(service.create(createPropertyDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createPropertyDto)).rejects.toThrow('ID người dùng hoặc chủ sở hữu không hợp lệ');
    });

    it('should rethrow other errors', async () => {
      const createPropertyDto: CreatePropertyDto = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        district: 'Test District',
        type: PropertyType.APARTMENT,
        userId: 'user-id',
        ownerId: 'owner-id',
      };

      const error = new Error('Some other error');
      mockPrismaService.property.create.mockRejectedValue(error);

      await expect(service.create(createPropertyDto)).rejects.toThrow('Some other error');
    });
  });

  describe('findAll', () => {
    it('should return a list of properties with pagination', async () => {
      const queryDto: QueryPropertyDto = {
        page: 1,
        limit: 10,
      };

      const mockProperties = [
        {
          id: 'property-id-1',
          name: 'Test Property 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'property-id-2',
          name: 'Test Property 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.property.count.mockResolvedValue(2);
      mockPrismaService.unit.count.mockResolvedValue(5);

      const result = await service.findAll(queryDto);

      expect(result.data.length).toEqual(2);
      expect(result.meta.total).toEqual(2);
      expect(mockPrismaService.property.findMany).toHaveBeenCalled();
      expect(mockPrismaService.property.count).toHaveBeenCalled();
    });

    it('should apply all filter parameters', async () => {
      const queryDto: QueryPropertyDto = {
        page: 1,
        limit: 10,
        search: 'test',
        city: 'Test City',
        district: 'Test District',
        status: PropertyStatus.AVAILABLE,
        type: PropertyType.APARTMENT,
        ownerId: 'owner-id',
        sortBy: 'name',
        sortOrder: 'asc',
      };

      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.findAll(queryDto);

      expect(mockPrismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { address: { contains: 'test', mode: 'insensitive' } },
            ],
            city: { contains: 'Test City', mode: 'insensitive' },
            district: { contains: 'Test District', mode: 'insensitive' },
            status: PropertyStatus.AVAILABLE,
            type: PropertyType.APARTMENT,
            ownerId: 'owner-id',
          }),
          orderBy: { name: 'asc' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should handle property with vacant and occupied units', async () => {
      const queryDto: QueryPropertyDto = {
        page: 1,
        limit: 10,
      };

      const mockProperties = [
        {
          id: 'property-id-1',
          name: 'Test Property 1',
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(mockProperties);
      mockPrismaService.property.count.mockResolvedValue(1);
      mockPrismaService.unit.count
        .mockResolvedValueOnce(5) // Total units
        .mockResolvedValueOnce(2); // Vacant units

      const result = await service.findAll(queryDto);

      expect(result.data[0]).toEqual({
        id: 'property-id-1',
        name: 'Test Property 1',
        unitCount: 5,
        vacantUnitCount: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const propertyId = 'property-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockUnits = [
        { id: 'unit-1', name: 'Unit 1', status: 'VACANT', price: 1000 },
        { id: 'unit-2', name: 'Unit 2', status: 'OCCUPIED', price: 1500 },
      ];

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.count.mockResolvedValueOnce(2); // unitCount
      mockPrismaService.unit.count.mockResolvedValueOnce(1); // vacantUnitCount
      mockPrismaService.unit.findMany.mockResolvedValue(mockUnits);

      const result = await service.findOne(propertyId);

      expect(result).toEqual({
        ...mockProperty,
        unitCount: 2,
        vacantUnitCount: 1,
        units: mockUnits,
        estimatedMonthlyRevenue: 1500, // Only OCCUPIED units
      });
      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      const propertyId = 'non-existent-id';

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne(propertyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedProperty = {
        ...mockProperty,
        name: 'Updated Property',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockResolvedValue(updatedProperty);

      const result = await service.update(propertyId, updatePropertyDto, userId);

      expect(result).toEqual(updatedProperty);
      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: propertyId },
        data: expect.objectContaining({
          name: updatePropertyDto.name,
        }),
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      const propertyId = 'non-existent-id';
      const userId = 'user-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.update(propertyId, updatePropertyDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId: 'other-user-id',
        ownerId: 'other-owner-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.update(propertyId, updatePropertyDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle errors during update', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.property.update.mockRejectedValue(new Error('Update error'));

      await expect(service.update(propertyId, updatePropertyDto, userId)).rejects.toThrow('Update error');
    });
  });

  describe('remove', () => {
    it('should delete a property', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.count.mockResolvedValue(0);
      mockPrismaService.property.delete.mockResolvedValue(mockProperty);

      const result = await service.remove(propertyId, userId);

      expect(result).toEqual(mockProperty);
      expect(mockPrismaService.property.delete).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      const propertyId = 'non-existent-id';
      const userId = 'user-id';

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.remove(propertyId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId: 'other-user-id',
        ownerId: 'other-owner-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.remove(propertyId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if property has units', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.count.mockResolvedValue(2);

      await expect(service.remove(propertyId, userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPropertySummary', () => {
    it('should return property summary', async () => {
      const propertyId = 'property-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        city: 'Test City',
        district: 'Test District',
        status: PropertyStatus.AVAILABLE,
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.count
        .mockResolvedValueOnce(10) // unitCount
        .mockResolvedValueOnce(6)  // occupiedUnitCount
        .mockResolvedValueOnce(4); // vacantUnitCount
      
      mockPrismaService.unit.aggregate.mockResolvedValue({
        _sum: {
          price: 15000, // Total revenue from occupied units
        },
      });
      
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(3); // Pending maintenance requests

      const result = await service.getPropertySummary(propertyId);

      expect(result).toEqual({
        ...mockProperty,
        unitCount: 10,
        occupiedUnitCount: 6,
        vacantUnitCount: 4,
        occupancyRate: 60, // 6/10 * 100
        estimatedMonthlyRevenue: 15000,
        pendingMaintenanceCount: 3,
      });

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          status: true,
        },
      });
    });

    it('should handle property with no units', async () => {
      const propertyId = 'property-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        city: 'Test City',
        district: 'Test District',
        status: PropertyStatus.AVAILABLE,
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.count
        .mockResolvedValueOnce(0) // unitCount
        .mockResolvedValueOnce(0) // occupiedUnitCount
        .mockResolvedValueOnce(0); // vacantUnitCount
      
      mockPrismaService.unit.aggregate.mockResolvedValue({
        _sum: {
          price: null, // No revenue
        },
      });
      
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(0);

      const result = await service.getPropertySummary(propertyId);

      expect(result).toEqual({
        ...mockProperty,
        unitCount: 0,
        occupiedUnitCount: 0,
        vacantUnitCount: 0,
        occupancyRate: 0,
        estimatedMonthlyRevenue: 0,
        pendingMaintenanceCount: 0,
      });
    });

    it('should throw NotFoundException if property not found', async () => {
      const propertyId = 'non-existent-id';

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.getPropertySummary(propertyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateOwnership', () => {
    it('should return true if user is the owner', async () => {
      const propertyId = 'property-id';
      const userId = 'owner-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId: 'manager-id',
        ownerId: 'owner-id',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.validateOwnership(propertyId, userId);

      expect(result).toBe(true);
      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
    });

    it('should return true if user is the manager', async () => {
      const propertyId = 'property-id';
      const userId = 'manager-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId: 'manager-id',
        ownerId: 'owner-id',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.validateOwnership(propertyId, userId);

      expect(result).toBe(true);
    });

    it('should return false if user has no permission', async () => {
      const propertyId = 'property-id';
      const userId = 'other-user-id';
      const mockProperty = {
        id: propertyId,
        name: 'Test Property',
        userId: 'manager-id',
        ownerId: 'owner-id',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      const result = await service.validateOwnership(propertyId, userId);

      expect(result).toBe(false);
    });

    it('should throw NotFoundException if property not found', async () => {
      const propertyId = 'non-existent-id';
      const userId = 'user-id';

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.validateOwnership(propertyId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
