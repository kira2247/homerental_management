import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { CreateTenantDto, CreateTenantUnitDto, QueryTenantDto, UpdateTenantDto } from './dto';
import { IdentityType, TenantUnitStatus } from '@prisma/client';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantService;

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
  };

  const mockTenantService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignTenantToUnit: jest.fn(),
    endTenancy: jest.fn(),
    getTenantsByUnit: jest.fn(),
    getUnitsByTenant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'Nguyễn Văn A',
        phone: '+84912345678',
        email: 'example@gmail.com',
        identityNumber: '001200012345',
      };

      mockTenantService.create.mockResolvedValue(mockTenant);

      const result = await controller.create(createTenantDto);

      expect(mockTenantService.create).toHaveBeenCalledWith(createTenantDto);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const queryDto: QueryTenantDto = {
        page: 1,
        limit: 10,
      };

      const mockPaginatedResponse = {
        data: [mockTenant],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockTenantService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(queryDto);

      expect(mockTenantService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      const id = 'tenant-id-1';

      mockTenantService.findOne.mockResolvedValue(mockTenant);

      const result = await controller.findOne(id);

      expect(mockTenantService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const id = 'tenant-id-1';
      const updateTenantDto: UpdateTenantDto = {
        name: 'Nguyễn Văn A Updated',
      };

      const updatedTenant = { ...mockTenant, name: 'Nguyễn Văn A Updated' };
      mockTenantService.update.mockResolvedValue(updatedTenant);

      const result = await controller.update(id, updateTenantDto);

      expect(mockTenantService.update).toHaveBeenCalledWith(id, updateTenantDto);
      expect(result).toEqual(updatedTenant);
    });
  });

  describe('remove', () => {
    it('should delete a tenant', async () => {
      const id = 'tenant-id-1';

      mockTenantService.remove.mockResolvedValue(mockTenant);

      const result = await controller.remove(id);

      expect(mockTenantService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('assignTenantToUnit', () => {
    it('should assign a tenant to a unit', async () => {
      const createTenantUnitDto: CreateTenantUnitDto = {
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: '2023-01-01',
      };

      const req = { user: { id: 'user-id-1' } };

      const mockTenantUnit = {
        id: 'tenant-unit-id-1',
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: new Date('2023-01-01'),
        status: TenantUnitStatus.ACTIVE,
      };

      mockTenantService.assignTenantToUnit.mockResolvedValue(mockTenantUnit);

      const result = await controller.assignTenantToUnit(createTenantUnitDto, req);

      expect(mockTenantService.assignTenantToUnit).toHaveBeenCalledWith(
        createTenantUnitDto,
        req.user.id,
      );
      expect(result).toEqual(mockTenantUnit);
    });
  });

  describe('endTenancy', () => {
    it('should end a tenancy', async () => {
      const tenantUnitId = 'tenant-unit-id-1';
      const req = { user: { id: 'user-id-1' } };

      const mockTenantUnit = {
        id: 'tenant-unit-id-1',
        tenantId: 'tenant-id-1',
        unitId: 'unit-id-1',
        moveInDate: new Date('2023-01-01'),
        moveOutDate: new Date(),
        status: TenantUnitStatus.INACTIVE,
      };

      mockTenantService.endTenancy.mockResolvedValue(mockTenantUnit);

      const result = await controller.endTenancy(tenantUnitId, req);

      expect(mockTenantService.endTenancy).toHaveBeenCalledWith(tenantUnitId, req.user.id);
      expect(result).toEqual(mockTenantUnit);
    });
  });

  describe('getTenantsByUnit', () => {
    it('should get tenants by unit id', async () => {
      const unitId = 'unit-id-1';
      const mockTenants = [{
        tenantUnitId: 'tenant-unit-id-1',
        ...mockTenant,
        isMainTenant: true,
        moveInDate: new Date('2023-01-01'),
      }];

      mockTenantService.getTenantsByUnit.mockResolvedValue(mockTenants);

      const result = await controller.getTenantsByUnit(unitId);

      expect(mockTenantService.getTenantsByUnit).toHaveBeenCalledWith(unitId);
      expect(result).toEqual(mockTenants);
    });
  });

  describe('getUnitsByTenant', () => {
    it('should get units by tenant id', async () => {
      const tenantId = 'tenant-id-1';
      const mockUnits = [{
        tenantUnitId: 'tenant-unit-id-1',
        id: 'unit-id-1',
        name: 'Phòng 101',
        property: {
          id: 'property-id-1',
          name: 'Chung cư ABC',
          address: '123 Đường XYZ',
        },
        isMainTenant: true,
        moveInDate: new Date('2023-01-01'),
      }];

      mockTenantService.getUnitsByTenant.mockResolvedValue(mockUnits);

      const result = await controller.getUnitsByTenant(tenantId);

      expect(mockTenantService.getUnitsByTenant).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(mockUnits);
    });
  });
});
