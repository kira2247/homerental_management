import { Test, TestingModule } from '@nestjs/testing';
import { BillService } from './bill.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { Prisma } from '@prisma/client';

describe('BillService', () => {
  let service: BillService;
  let prismaService: PrismaService;

  // Mock data
  const mockUser = { id: 'user-1', name: 'Test User' };
  const mockUnit = {
    id: 'unit-1',
    name: 'Unit 1',
    propertyId: 'property-1',
    property: {
      id: 'property-1',
      name: 'Property 1',
      userId: mockUser.id,
      ownerId: mockUser.id,
    },
  };
  const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
  const mockTenantUnit = {
    id: 'tenant-unit-1',
    tenantId: mockTenant.id,
    unitId: mockUnit.id,
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  };

  // Mock PrismaService
  const mockPrismaService = {
    unit: {
      findUnique: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    tenantUnit: {
      findFirst: jest.fn(),
    },
    bill: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillService>(BillService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bill successfully', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.bill.create.mockResolvedValue({
        id: 'bill-1',
        billNumber: 'BILL-202303-0001',
        unitId: mockUnit.id,
        propertyId: mockUnit.propertyId,
        totalAmount: 1000000,
        createdById: mockUser.id,
      });

      // Create DTO
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days later
        rentAmount: 1000000,
        unitId: mockUnit.id,
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Assert
      expect(mockPrismaService.unit.findUnique).toHaveBeenCalledWith({
        where: { id: createBillDto.unitId },
        include: { property: true },
      });
      expect(mockPrismaService.bill.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('bill-1');
      expect(result.totalAmount).toBe(1000000);
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      // Create DTO
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: 'non-existent-unit',
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.bill.create).not.toHaveBeenCalled();
    });

    it('should include tenant information if tenantId is provided', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(mockTenantUnit);
      mockPrismaService.bill.create.mockResolvedValue({
        id: 'bill-1',
        billNumber: 'BILL-202303-0001',
        unitId: mockUnit.id,
        propertyId: mockUnit.propertyId,
        tenantId: mockTenant.id,
        totalAmount: 1000000,
        createdById: mockUser.id,
      });

      // Create DTO
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        tenantId: mockTenant.id,
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Assert
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: createBillDto.tenantId },
      });
      expect(mockPrismaService.tenantUnit.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: createBillDto.tenantId,
          unitId: createBillDto.unitId,
        },
      });
      expect(mockPrismaService.bill.create).toHaveBeenCalled();
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should calculate electricity consumption and amount correctly', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.bill.create.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO with electricity readings
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        electricityPreviousReading: 100,
        electricityCurrentReading: 200,
        electricityRate: 3000, // 3000 VND per kWh
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Assert
      expect(result.electricityConsumption).toBe(100); // 200 - 100
      expect(result.electricityAmount).toBe(300000); // 100 kWh * 3000 VND
      expect(result.totalAmount).toBe(1300000); // 1000000 + 300000
    });
    
    it('should throw BadRequestException if current electricity reading is less than previous', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      
      // Create DTO with invalid readings (current < previous)
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        electricityPreviousReading: 200,
        electricityCurrentReading: 100, // Invalid: less than previous
        electricityRate: 3000,
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.create).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestException if current water reading is less than previous', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      
      // Create DTO with invalid water readings (current < previous)
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        waterPreviousReading: 50,
        waterCurrentReading: 30, // Invalid: less than previous
        waterRate: 15000,
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.create).not.toHaveBeenCalled();
    });
    
    it('should calculate water consumption and amount correctly', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.bill.create.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO with water readings
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        waterPreviousReading: 50,
        waterCurrentReading: 60,
        waterRate: 15000, // 15000 VND per m3
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Assert
      expect(result.waterConsumption).toBe(10); // 60 - 50
      expect(result.waterAmount).toBe(150000); // 10 m3 * 15000 VND
      expect(result.totalAmount).toBe(1150000); // 1000000 + 150000
    });
    
    it('should calculate total with additional fees', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.bill.create.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO with additional fees
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        additionalFees: [
          { name: 'Internet', amount: 200000 },
          { name: 'Cleaning', amount: 150000 },
        ],
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Assert
      expect(result.totalAmount).toBe(1350000); // 1000000 + 200000 + 150000
      expect(JSON.parse(result.additionalFees as string)).toEqual([
        { name: 'Internet', amount: 200000 },
        { name: 'Cleaning', amount: 150000 },
      ]);
    });
    
    it('should throw NotFoundException if tenant does not exist', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      
      // Create DTO with non-existent tenant
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        tenantId: 'non-existent-tenant',
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.bill.create).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestException if tenant is not renting the unit', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenantUnit.findFirst.mockResolvedValue(null); // No tenant-unit relation
      
      // Create DTO with tenant not renting the unit
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        tenantId: mockTenant.id,
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.create).not.toHaveBeenCalled();
    });
    
    it('should calculate electricity using tiered pricing', async () => {
      // Setup mocks
      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.bill.create.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO with tiered pricing
      const tiers = [
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
        { limit: 200, rate: 2014 },
      ];
      
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000000,
        unitId: mockUnit.id,
        electricityPreviousReading: 100,
        electricityCurrentReading: 250, // 150 kWh consumption
        usesTieredPricing: true,
        electricityTierDetails: tiers,
      };

      // Execute
      const result = await service.create(mockUser.id, createBillDto);

      // Calculate expected amount
      // First 50 kWh: 50 * 1678 = 83,900
      // Next 50 kWh: 50 * 1734 = 86,700
      // Last 50 kWh: 50 * 2014 = 100,700
      const expectedElectricityAmount = 83900 + 86700 + 100700;

      // Assert
      expect(result.electricityConsumption).toBe(150);
      expect(result.electricityAmount).toBeCloseTo(expectedElectricityAmount, 0);
      expect(result.totalAmount).toBeCloseTo(1000000 + expectedElectricityAmount, 0);
      expect(result.usesTieredPricing).toBe(true);
      expect(JSON.parse(result.electricityTierDetails as string)).toEqual(tiers);
    });
  });

  describe('findAll', () => {
    it('should return bills with pagination', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
        { id: 'property-2' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(2);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
        {
          id: 'bill-2',
          billNumber: 'BILL-202303-0002',
          billDate: new Date(),
          unitId: 'unit-2',
          propertyId: 'property-2',
          totalAmount: 1500000,
        },
      ]);

      // Execute
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
      });

      // Assert
      expect(mockPrismaService.property.findMany).toHaveBeenCalled();
      expect(mockPrismaService.bill.count).toHaveBeenCalled();
      expect(mockPrismaService.bill.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
          isPaid: true,
        },
      ]);

      // Execute with filters
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        propertyId: 'property-1',
        isPaid: true,
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            propertyId: expect.objectContaining({
              in: ['property-1'],
              equals: 'property-1',
            }),
            isPaid: true,
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by unitId correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with unitId filter
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        unitId: 'unit-1',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            unitId: 'unit-1',
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by tenantId correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          tenantId: 'tenant-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with tenantId filter
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        tenantId: 'tenant-1',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by date range (fromDate and toDate) correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date('2023-03-15'),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with date range filter
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        fromDate: '2023-03-01',
        toDate: '2023-03-31',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by fromDate only correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date('2023-03-15'),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with fromDate only
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        fromDate: '2023-03-01',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billDate: {
              gte: expect.any(Date),
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by toDate only correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date('2023-03-15'),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with toDate only
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        toDate: '2023-03-31',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billDate: {
              lte: expect.any(Date),
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should filter by search term (bill number) correctly', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(1);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
      ]);

      // Execute with search filter
      const result = await service.findAll(mockUser.id, {
        page: 1,
        limit: 10,
        search: 'BILL-202303',
      });

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billNumber: {
              contains: 'BILL-202303',
              mode: 'insensitive',
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });
    
    it('should use default pagination values if not provided', async () => {
      // Setup mocks
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.count.mockResolvedValue(2);
      mockPrismaService.bill.findMany.mockResolvedValue([
        {
          id: 'bill-1',
          billNumber: 'BILL-202303-0001',
          billDate: new Date(),
          unitId: 'unit-1',
          propertyId: 'property-1',
          totalAmount: 1000000,
        },
        {
          id: 'bill-2',
          billNumber: 'BILL-202303-0002',
          billDate: new Date(),
          unitId: 'unit-2',
          propertyId: 'property-1',
          totalAmount: 1500000,
        },
      ]);

      // Execute without pagination parameters
      const result = await service.findAll(mockUser.id, {});

      // Assert
      expect(mockPrismaService.bill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // page 1
          take: 10, // default limit
        }),
      );
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a bill by id', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        unitId: 'unit-1',
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });

      // Execute
      const result = await service.findOne(mockUser.id, 'bill-1');

      // Assert
      expect(mockPrismaService.bill.findUnique).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        include: expect.any(Object),
      });
      expect(mockPrismaService.property.findFirst).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('bill-1');
    });

    it('should throw NotFoundException if bill does not exist', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.findOne(mockUser.id, 'non-existent-bill')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user does not have access', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
      });
      mockPrismaService.property.findFirst.mockResolvedValue(null); // User has no access

      // Execute & Assert
      await expect(service.findOne(mockUser.id, 'bill-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a bill successfully', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      mockPrismaService.bill.update.mockResolvedValue({
        id: 'bill-1',
        notes: 'Updated notes',
      });

      // Create DTO
      const updateBillDto: UpdateBillDto = {
        notes: 'Updated notes',
      };

      // Execute
      const result = await service.update(mockUser.id, 'bill-1', updateBillDto);

      // Assert
      expect(mockPrismaService.bill.findUnique).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        include: { payment: true },
      });
      expect(mockPrismaService.property.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.bill.update).toHaveBeenCalled();
      expect(result.notes).toBe('Updated notes');
    });

    it('should update payment status and date when marking as paid', async () => {
      // Setup mocks
      const mockDate = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      mockPrismaService.bill.update.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO
      const updateBillDto: UpdateBillDto = {
        isPaid: true,
      };

      // Execute
      const result = await service.update(mockUser.id, 'bill-1', updateBillDto);

      // Assert
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: expect.objectContaining({
          isPaid: true,
          paymentDate: mockDate,
        }),
      });
      expect(result.isPaid).toBe(true);
      expect(result.paymentDate).toBe(mockDate);

      // Restore Date
      jest.restoreAllMocks();
    });
    
    it('should throw NotFoundException if bill does not exist on update', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue(null);
      
      // Create DTO
      const updateBillDto: UpdateBillDto = {
        notes: 'Updated notes',
      };

      // Execute & Assert
      await expect(
        service.update(mockUser.id, 'non-existent-bill', updateBillDto)
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.bill.update).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestException if user does not have access to update', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
      });
      mockPrismaService.property.findFirst.mockResolvedValue(null); // User has no access
      
      // Create DTO
      const updateBillDto: UpdateBillDto = {
        notes: 'Updated notes',
      };

      // Execute & Assert
      await expect(
        service.update(mockUser.id, 'bill-1', updateBillDto)
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.bill.update).not.toHaveBeenCalled();
    });
    
    it('should update bill with JSON fields correctly', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      mockPrismaService.bill.update.mockImplementation((args) => Promise.resolve({
        id: 'bill-1',
        ...args.data,
      }));

      // Create DTO with JSON fields
      const updateBillDto: UpdateBillDto = {
        electricityTierDetails: [
          { limit: 50, rate: 1678 },
          { limit: 100, rate: 1734 },
        ],
        additionalFees: [
          { name: 'Internet', amount: 200000 },
          { name: 'Cleaning', amount: 150000 },
        ],
      };

      // Execute
      const result = await service.update(mockUser.id, 'bill-1', updateBillDto);

      // Assert
      expect(mockPrismaService.bill.update).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        data: expect.objectContaining({
          electricityTierDetails: JSON.stringify(updateBillDto.electricityTierDetails),
          additionalFees: JSON.stringify(updateBillDto.additionalFees),
        }),
      });
      
      // Verify JSON stringification
      expect(result.electricityTierDetails).toBe(JSON.stringify(updateBillDto.electricityTierDetails));
      expect(result.additionalFees).toBe(JSON.stringify(updateBillDto.additionalFees));
    });
  });

  describe('remove', () => {
    it('should delete a bill successfully', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
        payment: null,
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      mockPrismaService.bill.delete.mockResolvedValue({
        id: 'bill-1',
      });

      // Execute
      const result = await service.remove(mockUser.id, 'bill-1');

      // Assert
      expect(mockPrismaService.bill.findUnique).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
        include: { payment: true },
      });
      expect(mockPrismaService.property.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.bill.delete).toHaveBeenCalledWith({
        where: { id: 'bill-1' },
      });
      expect(result.id).toBe('bill-1');
    });

    it('should throw BadRequestException if bill is already paid', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: true,
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'bill-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if bill has payment', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
        payment: { id: 'payment-1' },
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'bill-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user does not have access to the bill', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue({
        id: 'bill-1',
        propertyId: 'property-1',
        isPaid: false,
        payment: null,
      });
      mockPrismaService.property.findFirst.mockResolvedValue(null); // No property found - user doesn't have access

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'bill-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.bill.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if bill does not exist', async () => {
      // Setup mocks
      mockPrismaService.bill.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'non-existent-bill')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.bill.delete).not.toHaveBeenCalled();
    });
  });

  describe('calculateTieredElectricityAmount', () => {
    it('should calculate tiered pricing correctly', async () => {
      // Define tiers
      const tiers = [
        { limit: 50, rate: 1678 }, // 0-50 kWh: 1,678 VND/kWh
        { limit: 100, rate: 1734 }, // 51-100 kWh: 1,734 VND/kWh
        { limit: 200, rate: 2014 }, // 101-200 kWh: 2,014 VND/kWh
        { limit: 300, rate: 2536 }, // 201-300 kWh: 2,536 VND/kWh
        { limit: 400, rate: 2834 }, // 301-400 kWh: 2,834 VND/kWh
      ];

      // Test case: 120 kWh
      // Expected calculation:
      // First 50 kWh at 1,678 VND/kWh = 83,900 VND
      // Next 50 kWh at 1,734 VND/kWh = 86,700 VND
      // Next 20 kWh at 2,014 VND/kWh = 40,280 VND
      // Total: 210,880 VND
      const consumption = 120;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // First tier (0-50 kWh)
      const firstTierAmount = 50 * 1678; // 83,900
      // Second tier (51-100 kWh)
      const secondTierAmount = 50 * 1734; // 86,700
      // Third tier (101-120 kWh)
      const thirdTierAmount = 20 * 2014; // 40,280
      
      const expectedTotal = firstTierAmount + secondTierAmount + thirdTierAmount; // 210,880
      
      // Assert with small tolerance for floating point errors
      expect(result).toBeCloseTo(expectedTotal, 0);
    });
    
    it('should handle consumption in the highest tier', () => {
      // Define tiers
      const tiers = [
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
        { limit: 200, rate: 2014 },
      ];
      
      // Test consumption above the highest tier (250 kWh)
      const consumption = 250;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // First tier (0-50 kWh)
      const firstTierAmount = 50 * 1678; // 83,900
      // Second tier (51-100 kWh)
      const secondTierAmount = 50 * 1734; // 86,700
      // Third tier (101-200 kWh)
      const thirdTierAmount = 100 * 2014; // 201,400
      // Remaining 50 kWh using the highest rate
      const remainingAmount = 50 * 2014; // 100,700
      
      const expectedTotal = firstTierAmount + secondTierAmount + thirdTierAmount + remainingAmount;
      
      expect(result).toBeCloseTo(expectedTotal, 0);
    });
    
    it('should handle consumption exactly at tier limits', () => {
      // Define tiers
      const tiers = [
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
        { limit: 200, rate: 2014 },
      ];
      
      // Test consumption exactly at second tier limit (100 kWh)
      const consumption = 100;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // First tier (0-50 kWh)
      const firstTierAmount = 50 * 1678; // 83,900
      // Second tier (51-100 kWh)
      const secondTierAmount = 50 * 1734; // 86,700
      
      const expectedTotal = firstTierAmount + secondTierAmount;
      
      expect(result).toBeCloseTo(expectedTotal, 0);
    });
    
    it('should handle consumption below the first tier', () => {
      // Define tiers
      const tiers = [
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
      ];
      
      // Test consumption below first tier limit (30 kWh)
      const consumption = 30;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // Only first tier, partial
      const expectedTotal = 30 * 1678; // 50,340
      
      expect(result).toBeCloseTo(expectedTotal, 0);
    });
    
    it('should handle unsorted tiers correctly', () => {
      // Define unsorted tiers
      const tiers = [
        { limit: 200, rate: 2014 }, // Highest limit first
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
      ];
      
      // Test with unsorted tiers (120 kWh)
      const consumption = 120;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // First tier (0-50 kWh)
      const firstTierAmount = 50 * 1678; // 83,900
      // Second tier (51-100 kWh)
      const secondTierAmount = 50 * 1734; // 86,700
      // Third tier (101-120 kWh)
      const thirdTierAmount = 20 * 2014; // 40,280
      
      const expectedTotal = firstTierAmount + secondTierAmount + thirdTierAmount; // 210,880
      
      expect(result).toBeCloseTo(expectedTotal, 0);
    });
    
    it('should handle empty tiers array', () => {
      // Test with empty tiers
      const consumption = 100;
      const result = service['calculateTieredElectricityAmount'](consumption, []);
      
      // No tiers means no calculation
      expect(result).toBe(0);
    });
    
    it('should handle zero consumption', () => {
      // Define tiers
      const tiers = [
        { limit: 50, rate: 1678 },
        { limit: 100, rate: 1734 },
      ];
      
      // Test zero consumption
      const consumption = 0;
      const result = service['calculateTieredElectricityAmount'](consumption, tiers);
      
      // Zero consumption means zero cost
      expect(result).toBe(0);
    });
  });

  describe('checkBillAccess', () => {
    it('should return true if user is the property owner', async () => {
      // Setup mocks
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });

      // Execute
      const result = await service['checkBillAccess'](mockUser.id, 'property-1');

      // Assert
      expect(mockPrismaService.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'property-1',
          OR: [
            { userId: mockUser.id },
            { ownerId: mockUser.id },
          ],
        },
      });
      expect(result).toBe(true);
    });

    it('should return true if user is the property manager', async () => {
      // Setup mocks
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: 'other-user',
        ownerId: mockUser.id,
      });

      // Execute
      const result = await service['checkBillAccess'](mockUser.id, 'property-1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user has no access to property', async () => {
      // Setup mocks
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      // Execute
      const result = await service['checkBillAccess'](mockUser.id, 'property-1');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle Prisma errors in create method', async () => {
      // Setup mock to throw error
      const prismaError = new Prisma.PrismaClientKnownRequestError('Database error', {
        code: 'P2002',
        clientVersion: '2.15.0'
      });
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      mockPrismaService.bill.create.mockRejectedValue(prismaError);

      // Create DTO
      const createBillDto: CreateBillDto = {
        unitId: 'unit-1',
        billDate: '2023-05-01',
        dueDate: '2023-05-15',
        rentAmount: 5000000,
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow(/Database error/);
    });

    it('should handle Prisma errors in findAll method', async () => {
      // Setup mock to throw error
      const prismaError = new Prisma.PrismaClientKnownRequestError('Database query failed', {
        code: 'P2001',
        clientVersion: '2.15.0'
      });
      mockPrismaService.property.findMany.mockResolvedValue([
        { id: 'property-1' },
      ]);
      mockPrismaService.bill.findMany.mockRejectedValue(prismaError);

      // Execute & Assert
      await expect(service.findAll(mockUser.id, { page: 1, limit: 10 })).rejects.toThrow(/Database query failed/);
    });

    it('should handle validation errors during bill creation', async () => {
      // Setup mocks
      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'property-1',
        userId: mockUser.id,
      });
      // Create invalid DTO with negative amount
      const createBillDto: CreateBillDto = {
        unitId: 'unit-1',
        billDate: '2023-05-01',
        dueDate: '2023-05-15',
        rentAmount: -5000000, // Negative amount should cause validation error
        waterRate: 10000,
        electricityRate: 3000,
      };

      // Execute & Assert
      await expect(service.create(mockUser.id, createBillDto)).rejects.toThrow();
    });

    it('should handle unexpected errors in calculatePastDue', () => {
      // Create unusual date to trigger error
      const billDate = "invalid date";
      const dueDate = new Date();

      // Execute & Assert
      expect(() => service['calculatePastDue'](billDate as any, dueDate)).toThrow();
    });
  });
}); 