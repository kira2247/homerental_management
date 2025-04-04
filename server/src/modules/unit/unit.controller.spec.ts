import { Test, TestingModule } from '@nestjs/testing';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';
import { CreateUnitDto, QueryUnitDto, UpdateUnitDto } from './dto';
import { UnitStatus } from '@prisma/client';

describe('UnitController', () => {
  let controller: UnitController;
  let service: UnitService;

  // Mock data
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

  const mockUnitService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getVacantUnits: jest.fn(),
    getUnitSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitController],
      providers: [
        {
          provide: UnitService,
          useValue: mockUnitService,
        },
      ],
    }).compile();

    controller = module.get<UnitController>(UnitController);
    service = module.get<UnitService>(UnitService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new unit', async () => {
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

      const req = { user: { id: 'user-id-1' } };

      mockUnitService.create.mockResolvedValue(mockUnit);

      const result = await controller.create(createUnitDto, req);

      expect(mockUnitService.create).toHaveBeenCalledWith(createUnitDto, req.user.id);
      expect(result).toEqual(mockUnit);
    });
  });

  describe('findAll', () => {
    it('should return paginated units', async () => {
      const queryDto: QueryUnitDto = {
        page: 1,
        limit: 10,
        propertyId: 'property-id-1',
      };

      const mockPaginatedResponse = {
        data: [mockUnit],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockUnitService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(queryDto);

      expect(mockUnitService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a unit by id', async () => {
      const id = 'unit-id-1';

      const mockUnitWithDetails = {
        ...mockUnit,
        property: {
          id: 'property-id-1',
          name: 'Chung cư ABC',
          address: '123 Đường XYZ',
        },
        latestBill: {
          id: 'bill-id-1',
          totalAmount: 6000000,
        },
        isOccupied: false,
        tenants: [],
      };

      mockUnitService.findOne.mockResolvedValue(mockUnitWithDetails);

      const result = await controller.findOne(id);

      expect(mockUnitService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUnitWithDetails);
    });
  });

  describe('update', () => {
    it('should update a unit', async () => {
      const id = 'unit-id-1';
      const updateUnitDto: UpdateUnitDto = {
        name: 'Căn hộ 101 (Cập nhật)',
        price: 6000000,
      };

      const req = { user: { id: 'user-id-1' } };

      const updatedUnit = {
        ...mockUnit,
        name: updateUnitDto.name,
        price: updateUnitDto.price,
      };
      mockUnitService.update.mockResolvedValue(updatedUnit);

      const result = await controller.update(id, updateUnitDto, req);

      expect(mockUnitService.update).toHaveBeenCalledWith(id, updateUnitDto, req.user.id);
      expect(result).toEqual(updatedUnit);
    });
  });

  describe('remove', () => {
    it('should delete a unit', async () => {
      const id = 'unit-id-1';
      const req = { user: { id: 'user-id-1' } };

      mockUnitService.remove.mockResolvedValue(mockUnit);

      const result = await controller.remove(id, req);

      expect(mockUnitService.remove).toHaveBeenCalledWith(id, req.user.id);
      expect(result).toEqual(mockUnit);
    });
  });

  describe('getVacantUnits', () => {
    it('should return vacant units for a property', async () => {
      const propertyId = 'property-id-1';
      const req = { user: { id: 'user-id-1' } };

      mockUnitService.getVacantUnits.mockResolvedValue([mockUnit]);

      const result = await controller.getVacantUnits(propertyId, req);

      expect(mockUnitService.getVacantUnits).toHaveBeenCalledWith(propertyId, req.user.id);
      expect(result).toEqual([mockUnit]);
    });
  });

  describe('getUnitSummary', () => {
    it('should return unit summary', async () => {
      const id = 'unit-id-1';

      const mockUnitSummary = {
        id: 'unit-id-1',
        name: 'Căn hộ 101',
        property: {
          id: 'property-id-1',
          name: 'Chung cư ABC',
        },
        status: UnitStatus.VACANT,
        tenantCount: 0,
        utilityStats: {
          electric: {
            lastReading: 1100,
            avgMonthlyConsumption: 100,
          },
          water: {
            lastReading: 50,
            avgMonthlyConsumption: 5,
          },
        },
      };

      mockUnitService.getUnitSummary.mockResolvedValue(mockUnitSummary);

      const result = await controller.getUnitSummary(id);

      expect(mockUnitService.getUnitSummary).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUnitSummary);
    });
  });
});
