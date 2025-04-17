import { Test, TestingModule } from '@nestjs/testing';
import { UnitService } from './unit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateUnitDto, QueryUnitDto, UpdateUnitDto } from './dto';
import { UnitStatus, UtilityType } from '@prisma/client';

// Mock data
const mockProperty = {
  id: 'property-id-1',
  name: 'Chung cư ABC',
  address: '123 Đường XYZ',
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  type: 'APARTMENT',
  userId: 'user-id-1',
  ownerId: 'owner-id-1',
  defaultElectricityRate: 3500,
  defaultWaterRate: 15000,
  defaultInternetRate: 200000,
  defaultGarbageRate: 100000,
};

// Mock property with only userId set 
const mockProperty2 = {
  id: 'property-id-2',
  name: 'Chung cư XYZ',
  address: '456 Đường ABC',
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 2',
  type: 'APARTMENT',
  userId: 'user-id-1',
  ownerId: null, // Không có owner
  defaultElectricityRate: 3500,
  defaultWaterRate: 15000,
  defaultInternetRate: 200000,
  defaultGarbageRate: 100000,
};

// Mock property with only ownerId set
const mockProperty3 = {
  id: 'property-id-3',
  name: 'Chung cư DEF',
  address: '789 Đường GHI',
  city: 'TP. Hồ Chí Minh',
  district: 'Quận 3',
  type: 'APARTMENT',
  userId: null, // Không có manager
  ownerId: 'owner-id-1',
  defaultElectricityRate: 3500,
  defaultWaterRate: 15000,
  defaultInternetRate: 200000,
  defaultGarbageRate: 100000,
};

const mockUnit = {
  id: 'unit-id-1',
  name: 'Căn hộ 101',
  propertyId: 'property-id-1',
  floor: 1,
  area: 50,
  bedrooms: 2,
  bathrooms: 1,
  price: 5000000,
  depositAmount: 10000000,
  status: UnitStatus.VACANT,
  electricityRate: 3500,
  waterRate: 15000,
  internetRate: 200000,
  garbageRate: 100000,
  hasFurniture: true,
  hasAirCon: true,
  hasWaterHeater: true,
  hasBalcony: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTenantUnit = {
  id: 'tenant-unit-id-1',
  tenantId: 'tenant-id-1',
  unitId: 'unit-id-1',
  moveInDate: new Date(),
  moveOutDate: null,
  status: 'ACTIVE',
  isMainTenant: true,
  tenant: {
    id: 'tenant-id-1',
    name: 'Nguyễn Văn A',
    phone: '+84912345678',
  },
};

const mockBill = {
  id: 'bill-id-1',
  unitId: 'unit-id-1',
  dueDate: new Date(),
  status: 'UNPAID',
  totalAmount: 6000000,
};

const mockUtilityReading = {
  id: 'utility-reading-id-1',
  unitId: 'unit-id-1',
  readingType: UtilityType.ELECTRICITY,
  previousReading: 1000,
  currentReading: 1100,
  readingDate: new Date(),
  consumption: 100,
};

// Mock PrismaService
const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
  },
  unit: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  tenantUnit: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  bill: {
    findFirst: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  utilityReading: {
    findFirst: jest.fn(),
  },
  maintenanceRequest: {
    count: jest.fn(),
  },
};

describe('UnitService', () => {
  let service: UnitService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UnitService>(UnitService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new unit successfully', async () => {
      const createUnitDto: CreateUnitDto = {
        name: 'Căn hộ 101',
        propertyId: 'property-id-1',
        floor: 1,
        area: 50,
        bedrooms: 2,
        bathrooms: 1,
        price: 5000000,
        depositAmount: 10000000,
        electricityRate: 3500,
        waterRate: 15000,
        internetRate: 200000,
        garbageRate: 100000,
      };
      const userId = 'user-id-1';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.create.mockResolvedValue(mockUnit);

      const result = await service.create(createUnitDto, userId);

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: createUnitDto.propertyId },
      });
      expect(mockPrismaService.unit.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createUnitDto),
      });
      expect(result).toEqual(mockUnit);
    });

    it('should throw NotFoundException if property not found', async () => {
      const createUnitDto: CreateUnitDto = {
        name: 'Căn hộ 101',
        propertyId: 'non-existent-property-id',
        area: 50,
        bedrooms: 2,
        bathrooms: 1,
        price: 5000000,
        depositAmount: 10000000,
        electricityRate: 3500,
        waterRate: 15000,
        internetRate: 200000,
        garbageRate: 100000,
      };
      const userId = 'user-id-1';

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.create(createUnitDto, userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.unit.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const createUnitDto: CreateUnitDto = {
        name: 'Căn hộ 101',
        propertyId: 'property-id-1',
        area: 50,
        bedrooms: 2,
        bathrooms: 1,
        price: 5000000,
        depositAmount: 10000000,
        electricityRate: 3500,
        waterRate: 15000,
        internetRate: 200000,
        garbageRate: 100000,
      };
      const userId = 'different-user-id';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.create(createUnitDto, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.unit.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return units with pagination', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        propertyId: 'property-id-1',
      };

      const mockUnits = [mockUnit];
      const totalCount = 1;
      
      mockPrismaService.unit.findMany.mockResolvedValue(mockUnits);
      mockPrismaService.unit.count.mockResolvedValue(totalCount);

      const result = await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ propertyId: queryDto.propertyId }),
        skip: 0,
        take: 10,
      }));
      expect(mockPrismaService.unit.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockUnits,
        meta: {
          total: totalCount,
          page: queryDto.page,
          limit: queryDto.limit,
          totalPages: Math.ceil(totalCount / queryDto.limit),
        },
      });
    });

    it('should apply filtering by status', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        status: UnitStatus.VACANT,
      };

      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrismaService.unit.count.mockResolvedValue(1);

      await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: UnitStatus.VACANT }),
      }));
    });

    it('should apply price range filtering', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        minPrice: 3000000,
        maxPrice: 7000000,
      };

      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrismaService.unit.count.mockResolvedValue(1);

      await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          price: {
            gte: queryDto.minPrice,
            lte: queryDto.maxPrice,
          },
        }),
      }));
    });

    it('should apply area range filtering', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        minArea: 40,
        maxArea: 100,
      };

      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrismaService.unit.count.mockResolvedValue(1);

      await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          area: {
            gte: queryDto.minArea,
            lte: queryDto.maxArea,
          },
        }),
      }));
    });
    
    it('should apply all amenities filters', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        hasFurniture: true,
        hasAirCon: true,
        hasWaterHeater: true,
        hasBalcony: true,
        bedrooms: 2,
        bathrooms: 1,
        floor: 1,
      };

      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrismaService.unit.count.mockResolvedValue(1);

      await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          hasFurniture: true,
          hasAirCon: true,
          hasWaterHeater: true,
          hasBalcony: true,
          bedrooms: 2,
          bathrooms: 1,
          floor: 1,
        }),
      }));
    });

    it('should apply search and sort by price', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        search: 'căn hộ',
        sortByPriceAsc: true,
      };

      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);
      mockPrismaService.unit.count.mockResolvedValue(1);

      await service.findAll(queryDto);

      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'căn hộ', mode: 'insensitive' },
        }),
        orderBy: { price: 'asc' },
      }));
    });
  });

  describe('findOne', () => {
    it('should return a unit by id with related data', async () => {
      const id = 'unit-id-1';
      
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
        tenantUnits: [mockTenantUnit],
      });
      mockPrismaService.bill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.utilityReading.findFirst
        .mockResolvedValueOnce(mockUtilityReading) // Electricity
        .mockResolvedValueOnce(null); // Water

      const result = await service.findOne(id);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object),
      });
      expect(mockPrismaService.bill.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.utilityReading.findFirst).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        ...mockUnit,
        property: expect.any(Object),
        latestBill: mockBill,
        latestUtilityReadings: [mockUtilityReading],
        isOccupied: false,
        tenants: expect.any(Array),
      });
    });

    it('should throw NotFoundException if unit not found', async () => {
      const id = 'non-existent-id';
      
      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a unit successfully', async () => {
      const id = 'unit-id-1';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
        price: 6000000,
      };
      const userId = 'user-id-1';

      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
      });
      
      const updatedUnit = {
        ...mockUnit,
        name: updateUnitDto.name,
        price: updateUnitDto.price,
      };
      mockPrismaService.unit.update.mockResolvedValue(updatedUnit);

      const result = await service.update(id, updateUnitDto, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { property: true },
      });
      expect(mockPrismaService.unit.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUnitDto,
      });
      expect(result).toEqual(updatedUnit);
    });

    it('should update a unit successfully when user is manager (userId)', async () => {
      const id = 'unit-id-1';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
        price: 6000000,
      };
      const userId = 'user-id-1';

      // Mock a property with only userId set (no ownerId)
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty2,
      });
      
      const updatedUnit = {
        ...mockUnit,
        name: updateUnitDto.name,
        price: updateUnitDto.price,
      };
      mockPrismaService.unit.update.mockResolvedValue(updatedUnit);

      const result = await service.update(id, updateUnitDto, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { property: true },
      });
      expect(mockPrismaService.unit.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUnitDto,
      });
      expect(result).toEqual(updatedUnit);
    });

    it('should update a unit successfully when user is owner only (ownerId)', async () => {
      const id = 'unit-id-1';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
        price: 6000000,
      };
      const userId = 'owner-id-1';

      // Mock a property with only ownerId set (no userId)
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty3,
      });
      
      const updatedUnit = {
        ...mockUnit,
        name: updateUnitDto.name,
        price: updateUnitDto.price,
      };
      mockPrismaService.unit.update.mockResolvedValue(updatedUnit);

      const result = await service.update(id, updateUnitDto, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { property: true },
      });
      expect(mockPrismaService.unit.update).toHaveBeenCalledWith({
        where: { id },
        data: updateUnitDto,
      });
      expect(result).toEqual(updatedUnit);
    });

    it('should throw NotFoundException if unit not found', async () => {
      const id = 'non-existent-id';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
      };
      const userId = 'user-id-1';

      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.update(id, updateUnitDto, userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const id = 'unit-id-1';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
      };
      const userId = 'different-user-id';

      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
      });

      await expect(service.update(id, updateUnitDto, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a unit successfully', async () => {
      const id = 'unit-id-1';
      const userId = 'user-id-1';

      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
        tenantUnits: [], // Unit không có người thuê
      });
      mockPrismaService.unit.delete.mockResolvedValue(mockUnit);

      const result = await service.remove(id, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { 
          property: true,
          tenantUnits: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });
      expect(mockPrismaService.unit.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockUnit);
    });

    it('should remove a unit successfully when user is manager only (userId)', async () => {
      const id = 'unit-id-1';
      const userId = 'user-id-1';

      // Mock a property with only userId set (no ownerId)
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty2,
        tenantUnits: [], // Unit không có người thuê
      });
      mockPrismaService.unit.delete.mockResolvedValue(mockUnit);

      const result = await service.remove(id, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { 
          property: true,
          tenantUnits: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });
      expect(mockPrismaService.unit.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockUnit);
    });

    it('should remove a unit successfully when user is owner only (ownerId)', async () => {
      const id = 'unit-id-1';
      const userId = 'owner-id-1';

      // Mock a property with only ownerId set (no userId)
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty3,
        tenantUnits: [], // Unit không có người thuê
      });
      mockPrismaService.unit.delete.mockResolvedValue(mockUnit);

      const result = await service.remove(id, userId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { 
          property: true,
          tenantUnits: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });
      expect(mockPrismaService.unit.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockUnit);
    });

    it('should throw BadRequestException if unit has active tenants', async () => {
      const id = 'unit-id-1';
      const userId = 'user-id-1';

      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
        tenantUnits: [{
          id: 'tenant-unit-id-1',
          status: 'ACTIVE'
        }]
      });
      
      await expect(service.remove(id, userId)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.unit.delete).not.toHaveBeenCalled();
    });
  });

  describe('getVacantUnits', () => {
    it('should return vacant units for a property', async () => {
      const propertyId = 'property-id-1';
      const userId = 'user-id-1';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);

      const result = await service.getVacantUnits(propertyId, userId);

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith({
        where: {
          propertyId,
          status: UnitStatus.VACANT,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockUnit]);
    });

    it('should return vacant units for a property when user is manager only', async () => {
      const propertyId = 'property-id-2';
      const userId = 'user-id-1';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty2);
      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);

      const result = await service.getVacantUnits(propertyId, userId);

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith({
        where: {
          propertyId,
          status: UnitStatus.VACANT,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockUnit]);
    });

    it('should return vacant units for a property when user is owner only', async () => {
      const propertyId = 'property-id-3';
      const userId = 'owner-id-1';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty3);
      mockPrismaService.unit.findMany.mockResolvedValue([mockUnit]);

      const result = await service.getVacantUnits(propertyId, userId);

      expect(mockPrismaService.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(mockPrismaService.unit.findMany).toHaveBeenCalledWith({
        where: {
          propertyId,
          status: UnitStatus.VACANT,
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockUnit]);
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const propertyId = 'property-id-1';
      const userId = 'different-user-id';

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);

      await expect(service.getVacantUnits(propertyId, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.unit.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getUnitSummary', () => {
    it('should return unit summary with all statistics', async () => {
      const id = 'unit-id-1';
      
      // Mock unit with tenants
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
        tenantUnits: [
          {
            ...mockTenantUnit,
            moveInDate: new Date('2023-01-01'),
          },
        ],
        status: UnitStatus.OCCUPIED,
      });

      // Mock unpaid bills
      mockPrismaService.bill.count.mockResolvedValue(2);
      mockPrismaService.bill.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: 8000000,
        },
      });

      // Mock maintenance requests
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(3);

      const result = await service.getUnitSummary(id);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          property: {
            select: {
              name: true,
              address: true,
            },
          },
          tenantUnits: {
            where: {
              status: 'ACTIVE',
            },
            include: {
              tenant: true,
            },
          },
        },
      });

      expect(mockPrismaService.bill.count).toHaveBeenCalledWith({
        where: {
          unitId: id,
          status: {
            equals: 'UNPAID',
          },
        },
      });

      expect(mockPrismaService.bill.aggregate).toHaveBeenCalledWith({
        where: {
          unitId: id,
          status: {
            equals: 'UNPAID',
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      expect(mockPrismaService.maintenanceRequest.count).toHaveBeenCalledWith({
        where: {
          unit: {
            id,
          },
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
      });

      expect(result).toEqual({
        id: mockUnit.id,
        name: mockUnit.name,
        property: mockProperty,
        status: UnitStatus.OCCUPIED,
        price: mockUnit.price,
        area: mockUnit.area,
        tenants: [mockTenantUnit.tenant],
        isOccupied: true,
        occupiedSince: new Date('2023-01-01'),
        unpaidBillsCount: 2,
        unpaidBillsTotal: 8000000,
        openMaintenanceRequestsCount: 3,
      });
    });

    it('should return unit summary for vacant unit', async () => {
      const id = 'unit-id-1';
      
      // Mock vacant unit
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: mockProperty,
        tenantUnits: [],
        status: UnitStatus.VACANT,
      });

      // Mock no unpaid bills
      mockPrismaService.bill.count.mockResolvedValue(0);
      mockPrismaService.bill.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: null,
        },
      });

      // Mock no maintenance requests
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(0);

      const result = await service.getUnitSummary(id);

      expect(result).toEqual({
        id: mockUnit.id,
        name: mockUnit.name,
        property: mockProperty,
        status: UnitStatus.VACANT,
        price: mockUnit.price,
        area: mockUnit.area,
        tenants: [],
        isOccupied: false,
        occupiedSince: null,
        unpaidBillsCount: 0,
        unpaidBillsTotal: 0,
        openMaintenanceRequestsCount: 0,
      });
    });

    it('should throw NotFoundException if unit not found', async () => {
      const id = 'non-existent-id';
      
      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.getUnitSummary(id)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.bill.count).not.toHaveBeenCalled();
      expect(mockPrismaService.bill.aggregate).not.toHaveBeenCalled();
      expect(mockPrismaService.maintenanceRequest.count).not.toHaveBeenCalled();
    });
  });
});
