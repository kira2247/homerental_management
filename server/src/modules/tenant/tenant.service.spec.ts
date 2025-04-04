import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTenantDto, CreateTenantUnitDto, QueryTenantDto, UpdateTenantDto } from './dto';
import { TenantUnitStatus, IdentityType, ContractStatus } from '@prisma/client';

// Mock data
const mockTenant = {
  id: 'tenant-id-1',
  name: 'Nguyễn Văn A',
  phone: '+84912345678',
  email: 'example@gmail.com',
  identityNumber: '001200012345',
  identityType: IdentityType.CITIZEN_ID,
  dateOfBirth: new Date('1990-01-01'),
  permanentAddress: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
  emergencyContact: 'Nguyễn Văn B, 0987654321 (Anh/Em)',
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantUnits: [],
};

const mockUnit = {
  id: 'unit-id-1',
  name: 'Phòng 101',
  propertyId: 'property-id-1',
  status: 'VACANT',
  property: {
    id: 'property-id-1',
    name: 'Chung cư ABC',
    address: '123 Đường XYZ',
    userId: 'user-id-1',
    ownerId: 'owner-id-1',
  },
};

const mockTenantUnit = {
  id: 'tenant-unit-id-1',
  tenantId: 'tenant-id-1',
  unitId: 'unit-id-1',
  moveInDate: new Date(),
  moveOutDate: null,
  status: TenantUnitStatus.ACTIVE,
  isMainTenant: true,
  notes: 'Ghi chú',
  contractStatus: ContractStatus.ACTIVE,
  contractEndDate: new Date('2025-12-31'),
  tenant: mockTenant,
  unit: mockUnit,
};

// Mock PrismaService
const mockPrismaService = {
  tenant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  tenantUnit: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  unit: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  blacklistedTenant: {
    findFirst: jest.fn(),
  },
  bill: {
    count: jest.fn(),
  },
};

describe('TenantService', () => {
  let service: TenantService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Nguyễn Văn A',
        phone: '+84912345678',
        email: 'example@gmail.com',
        identityNumber: '001200012345',
        identityType: IdentityType.CITIZEN_ID,
        dateOfBirth: '1990-01-01',
        permanentAddress: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
        emergencyContact: 'Nguyễn Văn B, 0987654321 (Anh/Em)',
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { identityNumber: createTenantDto.identityNumber },
      });
      expect(mockPrismaService.blacklistedTenant.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: createTenantDto,
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw BadRequestException if tenant with same identityNumber exists', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Nguyễn Văn A',
        phone: '+84912345678',
        identityNumber: '001200012345',
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);

      await expect(service.create(createTenantDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.tenant.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant is blacklisted', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Nguyễn Văn A',
        phone: '+84912345678',
        identityNumber: '001200012345',
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue({
        id: 'blacklist-id-1',
        identityNumber: '001200012345',
        reason: 'Bad tenant',
        expiryDate: null,
      });

      await expect(service.create(createTenantDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.tenant.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return tenants with pagination', async () => {
      const queryDto: QueryTenantDto = {
        page: 1,
        limit: 10,
      };

      const mockTenants = [mockTenant];
      const totalCount = 1;
      
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);
      mockPrismaService.tenant.count.mockResolvedValue(totalCount);

      const result = await service.findAll(queryDto);

      expect(mockPrismaService.tenant.findMany).toHaveBeenCalled();
      expect(mockPrismaService.tenant.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockTenants,
        meta: {
          total: totalCount,
          page: queryDto.page,
          limit: queryDto.limit,
          totalPages: Math.ceil(totalCount / queryDto.limit),
        },
      });
    });

    it('should apply search filters correctly', async () => {
      const queryDto: QueryTenantDto = {
        page: 1,
        limit: 10,
        search: 'test',
        identityType: IdentityType.CITIZEN_ID,
        createdFrom: '2023-01-01',
        createdTo: '2023-12-31',
      };

      mockPrismaService.tenant.findMany.mockResolvedValue([]);
      mockPrismaService.tenant.count.mockResolvedValue(0);

      await service.findAll(queryDto);

      // Verify search filter
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
              { phone: { contains: 'test', mode: 'insensitive' } },
              { identityNumber: { contains: 'test', mode: 'insensitive' } },
            ],
            identityType: IdentityType.CITIZEN_ID,
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should apply unitId, propertyId, and activeOnly filters correctly', async () => {
      const queryDto: QueryTenantDto = {
        page: 1,
        limit: 10,
        unitId: 'unit-id-1',
        propertyId: 'property-id-1',
        activeOnly: true,
      };

      mockPrismaService.tenant.findMany.mockResolvedValue([]);
      mockPrismaService.tenant.count.mockResolvedValue(0);

      await service.findAll(queryDto);

      // Verify unit and property filters
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantUnits: {
              some: {
                unitId: 'unit-id-1',
                status: TenantUnitStatus.ACTIVE,
                unit: {
                  propertyId: 'property-id-1',
                },
              },
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      const id = 'tenant-id-1';
      
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        ...mockTenant,
        tenantUnits: [],
        vehicles: [],
        bills: [],
        payments: [],
        documents: [],
      });
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.bill.count.mockResolvedValue(0);

      const result = await service.findOne(id);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object),
      });
      expect(result).toMatchObject({
        ...mockTenant,
        isBlacklisted: false,
        activeUnits: [],
        unpaidBillsCount: 0,
      });
    });

    it('should return a tenant with blacklist info when blacklisted', async () => {
      const id = 'tenant-id-1';
      const blacklistInfo = {
        id: 'blacklist-id-1',
        identityNumber: '001200012345',
        reason: 'Bad tenant',
        expiryDate: null,
      };
      
      const mockTenantWithUnits = {
        ...mockTenant,
        tenantUnits: [
          {
            ...mockTenantUnit,
            status: TenantUnitStatus.ACTIVE,
            unit: mockUnit,
          },
        ],
        vehicles: [],
        bills: [],
        payments: [],
        documents: [],
      };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenantWithUnits);
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(blacklistInfo);
      mockPrismaService.bill.count.mockResolvedValue(2);

      const result = await service.findOne(id);

      expect(mockPrismaService.blacklistedTenant.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.bill.count).toHaveBeenCalled();
      expect(result).toMatchObject({
        ...mockTenant,
        isBlacklisted: true,
        blacklistInfo,
        activeUnits: [mockUnit],
        unpaidBillsCount: 2,
        tenantUnits: expect.any(Array),
      });
      expect(result.tenantUnits[0].unit).toEqual({
        id: mockUnit.id,
        name: mockUnit.name,
        property: mockUnit.property,
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      const id = 'non-existent-id';
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const updateTenantDto: UpdateTenantDto = {
        name: 'Nguyễn Văn A (Cập nhật)',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        ...updateTenantDto,
      });

      const result = await service.update('tenant-id-1', updateTenantDto);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-id-1' },
      });
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-id-1' },
        data: updateTenantDto,
      });
      expect(result).toEqual({
        ...mockTenant,
        ...updateTenantDto,
      });
    });

    it('should check for existing tenant when updating identityNumber', async () => {
      const updateTenantDto: UpdateTenantDto = {
        identityNumber: '002200023456',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        ...updateTenantDto,
      });

      await service.update('tenant-id-1', updateTenantDto);

      // Verify that we check for existing tenant with the same identity number
      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: {
          identityNumber: updateTenantDto.identityNumber,
          id: { not: 'tenant-id-1' },
        },
      });
    });

    it('should throw BadRequestException if updated identityNumber already exists', async () => {
      const updateTenantDto: UpdateTenantDto = {
        identityNumber: '002200023456',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        id: 'tenant-id-2',
        identityNumber: '002200023456',
      });

      await expect(service.update('tenant-id-1', updateTenantDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.tenant.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if tenant not found for update', async () => {
      const id = 'non-existent-id';
      const updateTenantDto: UpdateTenantDto = {
        name: 'Nguyễn Văn A - Cập nhật',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.update(id, updateTenantDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.tenant.update).not.toHaveBeenCalled();
    });

    it('should handle update error', async () => {
      const id = 'tenant-id-1';
      const updateTenantDto: UpdateTenantDto = {
        name: 'Nguyễn Văn A - Cập nhật',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.update(id, updateTenantDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('remove', () => {
    it('should remove a tenant', async () => {
      const id = 'tenant-id-1';
      const mockTenantWithUnits = {
        ...mockTenant,
        tenantUnits: [],
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenantWithUnits);
      mockPrismaService.tenant.delete.mockResolvedValue(mockTenant);

      const result = await service.remove(id);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          tenantUnits: {
            where: {
              status: TenantUnitStatus.ACTIVE,
            },
          },
        },
      });
      expect(mockPrismaService.tenant.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant not found for removal', async () => {
      const id = 'non-existent-id';

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.tenant.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant has active units', async () => {
      const tenantWithActiveUnits = {
        ...mockTenant,
        tenantUnits: [
          {
            id: 'tenant-unit-id-1',
            status: TenantUnitStatus.ACTIVE,
          },
        ],
      };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(tenantWithActiveUnits);

      await expect(service.remove('tenant-id-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.tenant.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.delete.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(service.remove('tenant-id-1')).rejects.toThrow('Database error');
    });
  });

  describe('endTenancy', () => {
    it('should end tenancy successfully and update unit to VACANT if last tenant', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const userId = 'user-id-1';

      const mockTenantUnit = {
        id: tenantUnitId,
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        status: 'ACTIVE',
        isMainTenant: true,
        contractStatus: 'ACTIVE',
        unit: {
          id: 'unit-id-1',
          property: {
            userId,
            ownerId: 'owner-id-1',
          },
        },
      };

      const updatedTenantUnit = {
        ...mockTenantUnit,
        status: 'INACTIVE',
        moveOutDate: expect.any(Date),
        contractStatus: 'TERMINATED',
        tenant: { id: 'tenant-id-1' },
        unit: { id: 'unit-id-1' },
      };

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(mockTenantUnit);
      mockPrismaService.tenantUnit.update.mockResolvedValue(updatedTenantUnit);
      mockPrismaService.tenantUnit.count.mockResolvedValue(0); // No other active tenants
      mockPrismaService.unit.update.mockResolvedValue({ id: 'unit-id-1', status: 'VACANT' });

      const result = await service.endTenancy(tenantUnitId, userId);

      expect(mockPrismaService.tenantUnit.findUnique).toHaveBeenCalledWith({
        where: { id: tenantUnitId },
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
      });

      expect(mockPrismaService.tenantUnit.update).toHaveBeenCalledWith({
        where: { id: tenantUnitId },
        data: {
          status: 'INACTIVE',
          moveOutDate: expect.any(Date),
          contractStatus: 'TERMINATED',
        },
        include: {
          tenant: true,
          unit: true,
        },
      });

      expect(mockPrismaService.unit.update).toHaveBeenCalledWith({
        where: { id: 'unit-id-1' },
        data: { status: 'VACANT' },
      });

      expect(result).toEqual(updatedTenantUnit);
    });

    it('should end tenancy successfully but not update unit status if other active tenants exist', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const userId = 'user-id-1';

      const mockTenantUnit = {
        id: tenantUnitId,
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        status: 'ACTIVE',
        isMainTenant: true,
        contractStatus: 'ACTIVE',
        unit: {
          id: 'unit-id-1',
          property: {
            userId,
            ownerId: 'owner-id-1',
          },
        },
      };

      const updatedTenantUnit = {
        ...mockTenantUnit,
        status: 'INACTIVE',
        moveOutDate: expect.any(Date),
        contractStatus: 'TERMINATED',
        tenant: { id: 'tenant-id-1' },
        unit: { id: 'unit-id-1' },
      };

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(mockTenantUnit);
      mockPrismaService.tenantUnit.update.mockResolvedValue(updatedTenantUnit);
      mockPrismaService.tenantUnit.count.mockResolvedValue(1); // Other active tenants exist

      const result = await service.endTenancy(tenantUnitId, userId);

      expect(mockPrismaService.tenantUnit.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.tenantUnit.update).toHaveBeenCalled();
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled(); // Should not update unit status
      expect(result).toEqual(updatedTenantUnit);
    });

    it('should throw NotFoundException when tenant unit does not exist', async () => {
      const tenantUnitId = 'non-existent-tenant-unit-id';
      const userId = 'user-id-1';

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(null);

      await expect(service.endTenancy(tenantUnitId, userId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.tenantUnit.update).not.toHaveBeenCalled();
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not have permission', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const userId = 'different-user-id';

      const mockTenantUnit = {
        id: tenantUnitId,
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        status: 'ACTIVE',
        unit: {
          id: 'unit-id-1',
          property: {
            userId: 'user-id-1',
            ownerId: 'owner-id-1',
          },
        },
      };

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(mockTenantUnit);

      await expect(service.endTenancy(tenantUnitId, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.tenantUnit.update).not.toHaveBeenCalled();
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenancy is already inactive', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const userId = 'user-id-1';

      const mockTenantUnit = {
        id: tenantUnitId,
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        status: 'INACTIVE', // Already inactive
        unit: {
          id: 'unit-id-1',
          property: {
            userId,
            ownerId: 'owner-id-1',
          },
        },
      };

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(mockTenantUnit);

      await expect(service.endTenancy(tenantUnitId, userId)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.tenantUnit.update).not.toHaveBeenCalled();
      expect(mockPrismaService.unit.update).not.toHaveBeenCalled();
    });

    it('should allow property owner to end tenancy', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const ownerId = 'owner-id-1';

      const mockTenantUnit = {
        id: tenantUnitId,
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        status: 'ACTIVE',
        isMainTenant: true,
        contractStatus: 'ACTIVE',
        unit: {
          id: 'unit-id-1',
          property: {
            userId: 'user-id-1',
            ownerId, // Owner ID matches
          },
        },
      };

      const updatedTenantUnit = {
        ...mockTenantUnit,
        status: 'INACTIVE',
        moveOutDate: expect.any(Date),
        contractStatus: 'TERMINATED',
        tenant: { id: 'tenant-id-1' },
        unit: { id: 'unit-id-1' },
      };

      mockPrismaService.tenantUnit.findUnique.mockResolvedValue(mockTenantUnit);
      mockPrismaService.tenantUnit.update.mockResolvedValue(updatedTenantUnit);
      mockPrismaService.tenantUnit.count.mockResolvedValue(0);
      mockPrismaService.unit.update.mockResolvedValue({ id: 'unit-id-1', status: 'VACANT' });

      const result = await service.endTenancy(tenantUnitId, ownerId);

      expect(mockPrismaService.tenantUnit.update).toHaveBeenCalled();
      expect(mockPrismaService.unit.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTenantUnit);
    });
  });

  describe('getTenantsByUnit', () => {
    it('should return tenants for a unit', async () => {
      const unitId = 'unit-id-1';
      const mockTenantUnits = [
        {
          id: 'tenant-unit-id-1',
          tenantId: 'tenant-id-1',
          tenant: { id: 'tenant-id-1', name: 'John Doe' },
          moveInDate: new Date('2022-01-01'),
        },
        {
          id: 'tenant-unit-id-2',
          tenantId: 'tenant-id-2',
          tenant: { id: 'tenant-id-2', name: 'Jane Smith' },
          moveInDate: new Date('2022-02-01'),
        },
      ];

      // Expected mapped results based on the service's transformation logic
      const expectedResults = [
        {
          tenantUnitId: 'tenant-unit-id-1',
          id: 'tenant-id-1',
          name: 'John Doe',
          isMainTenant: undefined,
          moveInDate: new Date('2022-01-01'),
          contractEndDate: undefined,
        },
        {
          tenantUnitId: 'tenant-unit-id-2',
          id: 'tenant-id-2',
          name: 'Jane Smith',
          isMainTenant: undefined,
          moveInDate: new Date('2022-02-01'),
          contractEndDate: undefined,
        },
      ];

      mockPrismaService.unit.findUnique.mockResolvedValue({ id: unitId });
      mockPrismaService.tenantUnit.findMany.mockResolvedValue(mockTenantUnits);

      const result = await service.getTenantsByUnit(unitId);

      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id: unitId },
      });
      expect(mockPrismaService.tenantUnit.findMany).toHaveBeenCalledWith({
        where: {
          unitId,
          status: 'ACTIVE',
        },
        include: {
          tenant: true,
        },
        orderBy: {
          moveInDate: 'asc',
        },
      });
      expect(result).toEqual(expectedResults);
    });

    it('should throw NotFoundException when unit does not exist', async () => {
      const unitId = 'non-existent-unit-id';

      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.getTenantsByUnit(unitId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.tenantUnit.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getUnitsByTenant', () => {
    it('should return units for a tenant', async () => {
      const tenantId = 'tenant-id-1';
      const mockTenantUnits = [
        {
          id: 'tenant-unit-id-1',
          unitId: 'unit-id-1',
          isMainTenant: true,
          moveInDate: new Date('2022-01-01'),
          contractEndDate: new Date('2023-01-01'),
          unit: { 
            id: 'unit-id-1', 
            name: 'Unit 101',
            property: { id: 'property-id-1', name: 'Property A' }
          },
        },
      ];

      // Expected mapped results based on the service's transformation logic
      const expectedResults = [
        {
          tenantUnitId: 'tenant-unit-id-1',
          id: 'unit-id-1',
          name: 'Unit 101',
          property: { id: 'property-id-1', name: 'Property A' },
          isMainTenant: true,
          moveInDate: new Date('2022-01-01'),
          contractEndDate: new Date('2023-01-01'),
        },
      ];

      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: tenantId });
      mockPrismaService.tenantUnit.findMany.mockResolvedValue(mockTenantUnits);

      const result = await service.getUnitsByTenant(tenantId);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
      expect(mockPrismaService.tenantUnit.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        include: {
          unit: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: {
          moveInDate: 'asc',
        },
      });
      expect(result).toEqual(expectedResults);
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      const tenantId = 'non-existent-tenant-id';

      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getUnitsByTenant(tenantId)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.tenantUnit.findMany).not.toHaveBeenCalled();
    });
  });

  describe('assignTenantToUnit', () => {
    it('should assign a tenant to a unit', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        isMainTenant: true,
      };
      const userId = 'user-id-1';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(null);
      mockPrismaService.tenantUnit.create.mockResolvedValue(mockTenantUnit);

      const result = await service.assignTenantToUnit(createTenantUnitDto, userId);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: createTenantUnitDto.tenantId },
      });
      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id: createTenantUnitDto.unitId },
        include: { property: true },
      });
      expect(mockPrismaService.tenantUnit.create).toHaveBeenCalled();
      expect(mockPrismaService.unit.update).toHaveBeenCalledWith({
        where: { id: createTenantUnitDto.unitId },
        data: { status: 'OCCUPIED' },
      });
      expect(result).toEqual(mockTenantUnit);
    });

    it('should throw ForbiddenException if user has no permission', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        isMainTenant: true,
      };
      const userId = 'different-user-id';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: {
          ...mockUnit.property,
          userId: 'user-id-1',
          ownerId: 'owner-id-1',
        },
      });

      await expect(service.assignTenantToUnit(createTenantUnitDto, userId)).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.tenantUnit.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if unit not found', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        isMainTenant: true,
      };
      const userId = 'user-id-1';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.assignTenantToUnit(createTenantUnitDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.tenantUnit.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant is blacklisted', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        isMainTenant: true,
      };
      const userId = 'user-id-1';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: {
          ...mockUnit.property,
          userId,
        },
      });
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue({
        id: 'blacklist-id-1',
        identityNumber: mockTenant.identityNumber,
        reason: 'Bad tenant',
        expiryDate: null,
      });

      await expect(service.assignTenantToUnit(createTenantUnitDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.tenantUnit.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if tenant is already assigned to unit', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        isMainTenant: true,
      };
      const userId = 'user-id-1';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: {
          ...mockUnit.property,
          userId,
        },
      });
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(mockTenantUnit);

      await expect(service.assignTenantToUnit(createTenantUnitDto, userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.tenantUnit.create).not.toHaveBeenCalled();
    });

    it('should assign a tenant to a unit with all date parameters', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
        moveOutDate: '2023-12-31',
        contractStartDate: '2023-01-01',
        contractEndDate: '2023-12-31',
        isMainTenant: true,
      };
      const userId = 'user-id-1';

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.unit.findUnique.mockResolvedValue({
        ...mockUnit,
        property: {
          ...mockUnit.property,
          userId,
        },
      });
      mockPrismaService.blacklistedTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(null);
      mockPrismaService.tenantUnit.create.mockResolvedValue(mockTenantUnit);

      const result = await service.assignTenantToUnit(createTenantUnitDto, userId);

      expect(mockPrismaService.tenantUnit.create).toHaveBeenCalledWith({
        data: {
          ...createTenantUnitDto,
          moveInDate: expect.any(Date),
          moveOutDate: expect.any(Date),
          contractStartDate: expect.any(Date),
          contractEndDate: expect.any(Date),
        },
        include: {
          tenant: true,
          unit: {
            include: {
              property: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTenantUnit);
    });
  });
});
