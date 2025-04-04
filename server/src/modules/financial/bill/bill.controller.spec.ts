import { Test, TestingModule } from '@nestjs/testing';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillFilterDto } from './dto/bill-filter.dto';

describe('BillController', () => {
  let controller: BillController;
  let service: BillService;

  const mockUserId = 'user-1';
  const mockBill = {
    id: 'bill-1',
    billNumber: 'BILL-202303-0001',
    billDate: new Date(),
    dueDate: new Date(),
    totalAmount: 1000000,
    rentAmount: 1000000,
    isPaid: false,
    propertyId: 'property-1',
    unitId: 'unit-1',
    createdById: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBillService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillController],
      providers: [
        {
          provide: BillService,
          useValue: mockBillService,
        },
      ],
    }).compile();

    controller = module.get<BillController>(BillController);
    service = module.get<BillService>(BillService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bill', async () => {
      // Setup mocks
      const createBillDto: CreateBillDto = {
        billDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        rentAmount: 1000000,
        unitId: 'unit-1',
      };
      mockBillService.create.mockResolvedValue(mockBill);

      // Create mock request
      const mockRequest = {
        user: { id: mockUserId },
      };

      // Execute
      const result = await controller.create(mockRequest, createBillDto);

      // Assert
      expect(mockBillService.create).toHaveBeenCalledWith(
        mockUserId,
        createBillDto,
      );
      expect(result).toEqual(mockBill);
    });
  });

  describe('findAll', () => {
    it('should return an array of bills', async () => {
      // Setup mocks
      const mockPagination = {
        data: [mockBill],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockBillService.findAll.mockResolvedValue(mockPagination);

      // Create mock request
      const mockRequest = {
        user: { id: mockUserId },
      };

      // Create mock filter
      const mockFilter: BillFilterDto = {
        page: 1,
        limit: 10,
      };

      // Execute
      const result = await controller.findAll(mockRequest, mockFilter);

      // Assert
      expect(mockBillService.findAll).toHaveBeenCalledWith(
        mockUserId,
        mockFilter,
      );
      expect(result).toEqual(mockPagination);
    });
  });

  describe('findOne', () => {
    it('should return a bill by id', async () => {
      // Setup mocks
      mockBillService.findOne.mockResolvedValue(mockBill);

      // Create mock request
      const mockRequest = {
        user: { id: mockUserId },
      };

      // Execute
      const result = await controller.findOne(mockRequest, mockBill.id);

      // Assert
      expect(mockBillService.findOne).toHaveBeenCalledWith(
        mockUserId,
        mockBill.id,
      );
      expect(result).toEqual(mockBill);
    });
  });

  describe('update', () => {
    it('should update a bill', async () => {
      // Setup mocks
      const updateBillDto: UpdateBillDto = {
        notes: 'Updated notes',
      };
      const updatedBill = { ...mockBill, notes: 'Updated notes' };
      mockBillService.update.mockResolvedValue(updatedBill);

      // Create mock request
      const mockRequest = {
        user: { id: mockUserId },
      };

      // Execute
      const result = await controller.update(
        mockRequest,
        mockBill.id,
        updateBillDto,
      );

      // Assert
      expect(mockBillService.update).toHaveBeenCalledWith(
        mockUserId,
        mockBill.id,
        updateBillDto,
      );
      expect(result).toEqual(updatedBill);
    });
  });

  describe('remove', () => {
    it('should remove a bill', async () => {
      // Setup mocks
      mockBillService.remove.mockResolvedValue(mockBill);

      // Create mock request
      const mockRequest = {
        user: { id: mockUserId },
      };

      // Execute
      const result = await controller.remove(mockRequest, mockBill.id);

      // Assert
      expect(mockBillService.remove).toHaveBeenCalledWith(
        mockUserId,
        mockBill.id,
      );
      expect(result).toEqual(mockBill);
    });
  });
}); 