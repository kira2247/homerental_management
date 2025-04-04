import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentFilterDto, UpdatePaymentDto } from './dto';
import { PaymentMethod } from '@prisma/client';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  // Mock user ID for testing
  const userId = 'user-id';

  // Mock service methods
  const mockPaymentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct parameters', async () => {
      const dto: CreatePaymentDto = {
        billId: 'bill-id',
        amount: 1500000,
        paymentDate: '2023-06-01',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF123',
      };

      const expectedResult = { id: 'payment-id', ...dto };
      mockPaymentService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(userId, dto);

      expect(service.create).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with correct parameters', async () => {
      const filters: PaymentFilterDto = {
        page: 1,
        limit: 10,
      };

      const expectedResult = {
        data: [{ id: 'payment-id' }],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
      mockPaymentService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(userId, filters);

      expect(service.findAll).toHaveBeenCalledWith(userId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with correct parameters', async () => {
      const paymentId = 'payment-id';
      const expectedResult = { id: paymentId };
      mockPaymentService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(userId, paymentId);

      expect(service.findOne).toHaveBeenCalledWith(userId, paymentId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call service.update with correct parameters', async () => {
      const paymentId = 'payment-id';
      const dto: UpdatePaymentDto = {
        amount: 2000000,
        notes: 'Updated notes',
      };

      const expectedResult = { id: paymentId, ...dto };
      mockPaymentService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(userId, paymentId, dto);

      expect(service.update).toHaveBeenCalledWith(userId, paymentId, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call service.remove with correct parameters', async () => {
      const paymentId = 'payment-id';
      const expectedResult = { id: paymentId };
      mockPaymentService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(userId, paymentId);

      expect(service.remove).toHaveBeenCalledWith(userId, paymentId);
      expect(result).toEqual(expectedResult);
    });
  });
}); 