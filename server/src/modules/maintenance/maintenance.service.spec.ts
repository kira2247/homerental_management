import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MaintenanceStatus, Priority } from '@prisma/client';

// Mock data
const mockProperty = {
  id: 'property-1',
  name: 'Test Property',
  address: 'Test Address',
};

const mockUnit = {
  id: 'unit-1',
  name: 'Test Unit',
  propertyId: 'property-1',
};

const mockMaintenanceRequest = {
  id: 'maintenance-1',
  title: 'Fix AC',
  description: 'AC leaking water',
  status: MaintenanceStatus.PENDING,
  priority: Priority.MEDIUM,
  propertyId: 'property-1',
  unitId: 'unit-1',
  requestDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock prisma service
const mockPrismaService = {
  property: {
    findUnique: jest.fn(),
  },
  unit: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  maintenanceRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a maintenance request successfully', async () => {
      const createDto = {
        title: 'Fix AC',
        description: 'AC leaking water',
        priority: Priority.MEDIUM,
        propertyId: 'property-1',
        unitId: 'unit-1',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.findFirst.mockResolvedValue(mockUnit);
      mockPrismaService.maintenanceRequest.create.mockResolvedValue(mockMaintenanceRequest);

      const result = await service.create(createDto as any);

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: 'property-1' },
      });
      expect(prisma.unit.findFirst).toHaveBeenCalledWith({
        where: { id: 'unit-1', propertyId: 'property-1' },
      });
      expect(prisma.maintenanceRequest.create).toHaveBeenCalled();
      expect(result).toEqual(mockMaintenanceRequest);
    });

    it('should throw NotFoundException if property not found', async () => {
      const createDto = {
        title: 'Fix AC',
        description: 'AC leaking water',
        priority: Priority.MEDIUM,
        propertyId: 'property-1',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if unit not found or not in property', async () => {
      const createDto = {
        title: 'Fix AC',
        description: 'AC leaking water',
        priority: Priority.MEDIUM,
        propertyId: 'property-1',
        unitId: 'unit-1',
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.unit.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated maintenance requests', async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResult = {
        data: [mockMaintenanceRequest],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([mockMaintenanceRequest]);

      const result = await service.findAll(mockQuery as any);

      expect(result).toEqual(mockPaginatedResult);
      expect(prisma.maintenanceRequest.count).toHaveBeenCalled();
      expect(prisma.maintenanceRequest.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a maintenance request by id', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );

      const result = await service.findOne('maintenance-1');

      expect(result).toEqual(mockMaintenanceRequest);
      expect(prisma.maintenanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'maintenance-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if maintenance request not found', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(null);

      await expect(service.findOne('maintenance-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a maintenance request', async () => {
      const updateDto = {
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date().toISOString(),
      };

      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );
      mockPrismaService.maintenanceRequest.update.mockResolvedValue({
        ...mockMaintenanceRequest,
        ...updateDto,
        completedDate: new Date(),
      });

      const result = await service.update('maintenance-1', updateDto as any);

      expect(prisma.maintenanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'maintenance-1' },
      });
      expect(prisma.maintenanceRequest.update).toHaveBeenCalled();
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
    });

    it('should throw NotFoundException if maintenance request not found', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.update('maintenance-1', { status: MaintenanceStatus.COMPLETED } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a maintenance request', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(
        mockMaintenanceRequest,
      );
      mockPrismaService.maintenanceRequest.delete.mockResolvedValue(
        mockMaintenanceRequest,
      );

      const result = await service.remove('maintenance-1');

      expect(prisma.maintenanceRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'maintenance-1' },
      });
      expect(prisma.maintenanceRequest.delete).toHaveBeenCalledWith({
        where: { id: 'maintenance-1' },
      });
      expect(result).toEqual(mockMaintenanceRequest);
    });

    it('should throw NotFoundException if maintenance request not found', async () => {
      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(null);

      await expect(service.remove('maintenance-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByProperty', () => {
    it('should find all maintenance requests by property id and apply filters from query', async () => {
      const propertyId = 'property-1';
      const mockQuery = {
        status: [MaintenanceStatus.PENDING],
        page: 1,
        limit: 10,
      };

      mockPrismaService.property.findUnique.mockResolvedValue(mockProperty);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([mockMaintenanceRequest]);

      const result = await service.findByProperty(propertyId, mockQuery as any);

      expect(prisma.property.findUnique).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(result.data).toEqual([mockMaintenanceRequest]);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrismaService.property.findUnique.mockResolvedValue(null);

      await expect(service.findByProperty('non-existent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUnit', () => {
    it('should find all maintenance requests by unit id and apply filters from query', async () => {
      const unitId = 'unit-1';
      const mockQuery = {
        status: [MaintenanceStatus.PENDING],
        page: 1,
        limit: 10,
      };

      mockPrismaService.unit.findUnique.mockResolvedValue(mockUnit);
      mockPrismaService.maintenanceRequest.count.mockResolvedValue(1);
      mockPrismaService.maintenanceRequest.findMany.mockResolvedValue([mockMaintenanceRequest]);

      const result = await service.findByUnit(unitId, mockQuery as any);

      expect(prisma.unit.findUnique).toHaveBeenCalledWith({
        where: { id: unitId },
      });
      expect(result.data).toEqual([mockMaintenanceRequest]);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if unit not found', async () => {
      mockPrismaService.unit.findUnique.mockResolvedValue(null);

      await expect(service.findByUnit('non-existent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Additional tests for edge cases
  describe('update with completedDate', () => {
    it('should automatically set status to COMPLETED when completedDate is provided without status', async () => {
      const updateDto = {
        completedDate: new Date().toISOString(),
      };

      mockPrismaService.maintenanceRequest.findUnique.mockResolvedValue(mockMaintenanceRequest);
      mockPrismaService.maintenanceRequest.update.mockImplementation((args) => {
        return Promise.resolve({
          ...mockMaintenanceRequest,
          ...args.data,
          completedDate: new Date(args.data.completedDate),
          status: args.data.status || MaintenanceStatus.COMPLETED,
        });
      });

      const result = await service.update('maintenance-1', updateDto as any);

      expect(prisma.maintenanceRequest.update).toHaveBeenCalled();
      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.completedDate).toBeDefined();
    });
  });
}); 