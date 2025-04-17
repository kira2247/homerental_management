import { Test, TestingModule } from '@nestjs/testing';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { CreatePropertyDto, QueryPropertyDto, UpdatePropertyDto } from './dto';
import { PropertyType } from '@prisma/client';

describe('PropertyController', () => {
  let controller: PropertyController;
  let service: PropertyService;

  const mockPropertyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPropertySummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [
        {
          provide: PropertyService,
          useValue: mockPropertyService,
        },
      ],
    }).compile();

    controller = module.get<PropertyController>(PropertyController);
    service = module.get<PropertyService>(PropertyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      mockPropertyService.create.mockResolvedValue(expectedProperty);

      const req = { user: { id: 'user-id' } };
      const result = await controller.create(createPropertyDto, undefined, req);

      expect(result).toEqual(expectedProperty);
      expect(mockPropertyService.create).toHaveBeenCalledWith(createPropertyDto);
    });

    it('should set userId and ownerId if not provided', async () => {
      const createPropertyDto: Omit<CreatePropertyDto, 'userId' | 'ownerId'> = {
        name: 'Test Property',
        address: '123 Test St',
        city: 'Test City',
        district: 'Test District',
        type: PropertyType.APARTMENT,
      };

      const userId = 'user-id';
      const req = { user: { id: userId } };

      await controller.create(createPropertyDto as CreatePropertyDto, undefined, req);

      expect(mockPropertyService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          ownerId: userId,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return a list of properties', async () => {
      const queryDto: QueryPropertyDto = {
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [
          {
            id: 'property-id-1',
            name: 'Test Property 1',
          },
          {
            id: 'property-id-2',
            name: 'Test Property 2',
          },
        ],
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockPropertyService.findAll.mockResolvedValue(expectedResult);

      const req = { user: { id: 'user-id' } };
      const result = await controller.findAll(queryDto, req);

      expect(result).toEqual(expectedResult);
      expect(mockPropertyService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          ownerId: 'user-id',
        }),
      );
    });

    it('should use custom ownerId if provided', async () => {
      const queryDto: QueryPropertyDto = {
        page: 1,
        limit: 10,
        ownerId: 'custom-owner-id',
      };

      const req = { user: { id: 'user-id' } };
      
      await controller.findAll(queryDto, req);

      expect(mockPropertyService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'custom-owner-id',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const propertyId = 'property-id';
      const expectedProperty = {
        id: propertyId,
        name: 'Test Property',
      };

      mockPropertyService.findOne.mockResolvedValue(expectedProperty);

      const result = await controller.findOne(propertyId);

      expect(result).toEqual(expectedProperty);
      expect(mockPropertyService.findOne).toHaveBeenCalledWith(propertyId);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };
      const userId = 'user-id';
      const req = { user: { id: userId } };
      const updatedProperty = {
        id: propertyId,
        name: 'Updated Property',
      };

      mockPropertyService.update.mockResolvedValue(updatedProperty);

      // Chuyển đổi DTO thành chuỗi JSON để phù hợp với signature mới
      const updatePropertyDtoString = JSON.stringify(updatePropertyDto);
      
      const result = await controller.update(
        propertyId, 
        updatePropertyDtoString, 
        false, // deleteThumbnail
        req, // req
        undefined // file
      );

      expect(result).toEqual(updatedProperty);
      expect(mockPropertyService.update).toHaveBeenCalledWith(propertyId, updatePropertyDto, userId);
    });
  });

  describe('remove', () => {
    it('should remove a property', async () => {
      const propertyId = 'property-id';
      const userId = 'user-id';
      const req = { user: { id: userId } };
      const deletedProperty = {
        id: propertyId,
        name: 'Test Property',
      };

      mockPropertyService.remove.mockResolvedValue(deletedProperty);

      const result = await controller.remove(propertyId, req);

      expect(result).toEqual(deletedProperty);
      expect(mockPropertyService.remove).toHaveBeenCalledWith(propertyId, userId);
    });
  });

  describe('getPropertySummary', () => {
    it('should return property summary', async () => {
      const propertyId = 'property-id';
      const expectedSummary = {
        id: propertyId,
        name: 'Test Property',
        unitCount: 5,
        vacantUnitCount: 2,
        occupancyRate: 60,
      };

      mockPropertyService.getPropertySummary.mockResolvedValue(expectedSummary);

      const result = await controller.getPropertySummary(propertyId);

      expect(result).toEqual(expectedSummary);
      expect(mockPropertyService.getPropertySummary).toHaveBeenCalledWith(propertyId);
    });
  });
});
