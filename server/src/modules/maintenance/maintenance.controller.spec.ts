import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { MaintenanceStatus, Priority } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';

const mockMaintenanceService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByProperty: jest.fn(),
  findByUnit: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
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

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: MaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: mockMaintenanceService,
        },
      ],
    }).compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
    service = module.get<MaintenanceService>(MaintenanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a maintenance request', async () => {
      const createDto: CreateMaintenanceDto = {
        title: 'Fix AC',
        description: 'AC leaking water',
        priority: Priority.MEDIUM,
        propertyId: 'property-1',
        unitId: 'unit-1',
      } as CreateMaintenanceDto;

      mockMaintenanceService.create.mockResolvedValue(mockMaintenanceRequest);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockMaintenanceRequest);
    });
  });

  describe('findAll', () => {
    it('should return paginated maintenance requests', async () => {
      const query: QueryMaintenanceDto = {
        page: 1,
        limit: 10,
      } as QueryMaintenanceDto;

      const paginatedResult = {
        data: [mockMaintenanceRequest],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockMaintenanceService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a maintenance request by id', async () => {
      mockMaintenanceService.findOne.mockResolvedValue(mockMaintenanceRequest);

      const result = await controller.findOne('maintenance-1');

      expect(service.findOne).toHaveBeenCalledWith('maintenance-1');
      expect(result).toEqual(mockMaintenanceRequest);
    });
  });

  describe('findByProperty', () => {
    it('should return maintenance requests by property id', async () => {
      const query: QueryMaintenanceDto = {} as QueryMaintenanceDto;
      const paginatedResult = {
        data: [mockMaintenanceRequest],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockMaintenanceService.findByProperty.mockResolvedValue(paginatedResult);

      const result = await controller.findByProperty('property-1', query);

      expect(service.findByProperty).toHaveBeenCalledWith('property-1', query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findByUnit', () => {
    it('should return maintenance requests by unit id', async () => {
      const query: QueryMaintenanceDto = {} as QueryMaintenanceDto;
      const paginatedResult = {
        data: [mockMaintenanceRequest],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockMaintenanceService.findByUnit.mockResolvedValue(paginatedResult);

      const result = await controller.findByUnit('unit-1', query);

      expect(service.findByUnit).toHaveBeenCalledWith('unit-1', query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('should update a maintenance request', async () => {
      const updateDto: UpdateMaintenanceDto = {
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date().toISOString(),
      } as UpdateMaintenanceDto;

      const updatedRequest = {
        ...mockMaintenanceRequest,
        status: MaintenanceStatus.COMPLETED,
        completedDate: new Date(),
      };

      mockMaintenanceService.update.mockResolvedValue(updatedRequest);

      const result = await controller.update('maintenance-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('maintenance-1', updateDto);
      expect(result).toEqual(updatedRequest);
    });
  });

  describe('remove', () => {
    it('should remove a maintenance request', async () => {
      mockMaintenanceService.remove.mockResolvedValue(mockMaintenanceRequest);

      const result = await controller.remove('maintenance-1');

      expect(service.remove).toHaveBeenCalledWith('maintenance-1');
      expect(result).toEqual(mockMaintenanceRequest);
    });
  });
}); 