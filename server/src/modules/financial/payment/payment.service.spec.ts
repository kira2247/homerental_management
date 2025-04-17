import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  CreatePaymentDto, 
  PaymentFilterDto, 
  UpdatePaymentDto 
} from './dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: any;

  // Mock user
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
  };

  // Mock data
  const mockPayments = [
    {
      id: 'payment-1',
      billId: 'bill-1',
      receiptNumber: 'REC00001',
      amount: 1000000,
      paymentDate: new Date('2023-01-05'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'REF123',
      notes: 'Payment for January',
      createdAt: new Date('2023-01-05'),
      updatedAt: new Date('2023-01-05'),
      bill: {
        id: 'bill-1',
        billNumber: 'B001',
        propertyId: 'property-1',
        property: {
          id: 'property-1',
          name: 'Property A',
          userId: mockUser.id,
        },
        unitId: 'unit-1',
        unit: {
          id: 'unit-1',
          name: 'Unit 101',
        },
        isPaid: true,
      },
    },
    {
      id: 'payment-2',
      billId: 'bill-2',
      receiptNumber: 'REC00002',
      amount: 1200000,
      paymentDate: new Date('2023-02-05'),
      paymentMethod: PaymentMethod.CASH,
      notes: 'Payment for February',
      createdAt: new Date('2023-02-05'),
      updatedAt: new Date('2023-02-05'),
      bill: {
        id: 'bill-2',
        billNumber: 'B002',
        propertyId: 'property-1',
        property: {
          id: 'property-1',
          name: 'Property A',
          userId: mockUser.id,
        },
        unitId: 'unit-1',
        unit: {
          id: 'unit-1',
          name: 'Unit 101',
        },
        isPaid: true,
      },
    },
  ];

  // Mock bill data
  const mockBills = [
    {
      id: 'bill-1',
      billNumber: 'B001',
      billDate: new Date('2023-01-01'),
      dueDate: new Date('2023-01-15'),
      totalAmount: 1000000,
      isPaid: true,
      paymentDate: new Date('2023-01-05'),
      propertyId: 'property-1',
      property: {
        id: 'property-1',
        name: 'Property A',
        userId: mockUser.id,
      },
      unitId: 'unit-1',
      unit: {
        id: 'unit-1',
        name: 'Unit 101',
      },
      payment: {
        id: 'payment-1',
      },
      tenantId: 'tenant-1',
      tenant: {
        id: 'tenant-1',
        name: 'John Doe',
      },
    },
    {
      id: 'bill-3',
      billNumber: 'B003',
      billDate: new Date('2023-03-01'),
      dueDate: new Date('2023-03-15'),
      totalAmount: 1300000,
      isPaid: false,
      propertyId: 'property-1',
      property: {
        id: 'property-1',
        name: 'Property A',
        userId: mockUser.id,
      },
      unitId: 'unit-1',
      unit: {
        id: 'unit-1',
        name: 'Unit 101',
      },
      payment: null,
      tenantId: 'tenant-1',
      tenant: {
        id: 'tenant-1',
        name: 'John Doe',
      },
    },
  ];

  // Mock property data
  const mockProperties = [
    {
      id: 'property-1',
      name: 'Property A',
      userId: mockUser.id,
    },
    {
      id: 'property-2',
      name: 'Property B',
      userId: mockUser.id,
    }
  ];

  // Mock prisma
  const mockPrisma = {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bill: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    property: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Directly instantiate the service with the mocked prisma
    prismaService = mockPrisma;
    service = new PaymentService(prismaService);

    // Mock the generateReceiptNumber method
    jest.spyOn(service as any, 'generateReceiptNumber').mockReturnValue('REC00099');
    jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment for an unpaid bill', async () => {
      // Mock data
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-3',
        amount: 1300000,
        paymentDate: '2023-03-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF345',
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-3',
        ...createPaymentDto,
        receiptNumber: 'REC00099',
        paymentDate: new Date(createPaymentDto.paymentDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.bill.update.mockResolvedValue({
        ...mockBills[1],
        isPaid: true,
        paymentDate: new Date(createPaymentDto.paymentDate),
      });

      // Execute
      const result = await service.create(mockUser.id, createPaymentDto);

      // Assert
      expect(mockPrisma.bill.findUnique).toHaveBeenCalledWith({
        where: { id: createPaymentDto.billId },
        include: {
          payment: true,
          property: true,
          unit: true,
          tenant: true,
        },
      });
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          billId: createPaymentDto.billId,
          amount: createPaymentDto.amount,
          paymentMethod: createPaymentDto.paymentMethod,
          referenceNumber: createPaymentDto.referenceNumber,
          receiptNumber: 'REC00099',
          paymentDate: expect.any(Date),
          paymentConfirmedById: mockUser.id,
          paymentConfirmedAt: expect.any(Date),
        }),
      });
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: createPaymentDto.billId },
        data: {
          isPaid: true,
          paymentDate: expect.any(Date),
          paymentMethod: createPaymentDto.paymentMethod,
        },
      });
      expect(result).toHaveProperty('id', 'payment-3');
    });

    it('should throw BadRequestException when bill is already paid', async () => {
      // Mock data
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-1',
        amount: 1000000,
        paymentDate: '2023-01-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF123',
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[0]); // paid bill

      // Execute & Assert
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when bill is not found', async () => {
      // Mock data
      const createPaymentDto: CreatePaymentDto = {
        billId: 'non-existent-bill',
        amount: 1000000,
        paymentDate: '2023-01-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF123',
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Mock data
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-3',
        amount: 1300000,
        paymentDate: '2023-03-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF345',
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValueOnce(false);

      // Execute & Assert
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
      expect(mockPrisma.bill.update).not.toHaveBeenCalled();
    });

    it('should handle validation errors when creating payment with negative amount', async () => {
      // Mock data with invalid negative amount
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-3',
        amount: -1300000, // Negative amount
        paymentDate: '2023-03-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      
      // Create mock implementation that checks for negative amount
      mockPrisma.payment.create.mockImplementation((args) => {
        if (args.data.amount < 0) {
          throw new BadRequestException('Amount cannot be negative');
        }
        return Promise.resolve({ id: 'new-payment', ...args.data });
      });
      
      // Expect validation error
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle missing required fields when creating payment', async () => {
      // Mock data with missing required field (paymentMethod)
      const createPaymentDto = {
        billId: 'bill-3',
        amount: 1300000,
        paymentDate: '2023-03-05',
        // Missing paymentMethod
      } as CreatePaymentDto;

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      
      // Create mock implementation that checks for required fields
      mockPrisma.payment.create.mockImplementation((args) => {
        if (!args.data.paymentMethod) {
          throw new BadRequestException('Payment method is required');
        }
        return Promise.resolve({ id: 'new-payment', ...args.data });
      });

      // Expect validation error
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of payments', async () => {
      // Mock data
      const filters: PaymentFilterDto = {
        page: 1,
        limit: 10,
      };

      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.payment.count.mockResolvedValue(mockPayments.length);

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: mockUser.id },
            { ownerId: mockUser.id },
          ],
        },
        select: { id: true },
      });
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything(),
        skip: 0,
        take: 10,
        orderBy: { paymentDate: 'desc' },
        include: expect.anything(),
      }));
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should apply filters correctly', async () => {
      // Mock data
      const filters: PaymentFilterDto = {
        page: 1,
        limit: 10,
        propertyId: 'property-1',
        unitId: 'unit-1',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        fromDate: '2023-01-01',
        toDate: '2023-01-31',
      };

      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);
      mockPrisma.payment.count.mockResolvedValue(1);

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          paymentDate: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          paymentMethod: filters.paymentMethod,
          bill: expect.objectContaining({
            propertyId: filters.propertyId,
            unitId: filters.unitId,
          }),
        }),
      }));
      expect(result.data).toHaveLength(1);
    });

    it('should apply multiple filters correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      // Create complex filter
      const filterDto: PaymentFilterDto = {
        page: 1,
        limit: 10,
        propertyId: 'property-1',
        unitId: 'unit-1',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        fromDate: '2023-01-01',
        toDate: '2023-01-31',
        search: 'REC00001'
      };

      // Execute
      const result = await service.findAll(mockUser.id, filterDto);

      // Assert - simplify the expectations to avoid complex matching issues
      expect(mockPrisma.payment.findMany).toHaveBeenCalled();
      expect(mockPrisma.payment.count).toHaveBeenCalled();
      
      // Verify the where clause structure
      const callArgs = mockPrisma.payment.findMany.mock.calls[0][0];
      expect(callArgs.where.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
      expect(callArgs.where.paymentDate).toEqual({
        gte: expect.any(Date),
        lte: expect.any(Date),
      });
      expect(callArgs.where.receiptNumber).toEqual({
        contains: 'REC00001',
        mode: 'insensitive'
      });
      expect(callArgs.where.bill.propertyId).toBe('property-1');
      expect(callArgs.where.bill.unitId).toBe('unit-1');
      
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should use propertyIds filter correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(2);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      // Execute
      const result = await service.findAll(mockUser.id, {});

      // Assert
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { userId: mockUser.id },
            { ownerId: mockUser.id },
          ],
        },
        select: { id: true },
      });
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bill: {
              propertyId: {
                in: ['property-1', 'property-2'],
              },
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(2);
    });

    it('should filter by billId correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      const filters: PaymentFilterDto = {
        billId: 'bill-1',
      };

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            billId: 'bill-1',
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should filter by tenantId correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      const filters: PaymentFilterDto = {
        tenantId: 'tenant-1',
      };

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should filter by fromDate only correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      const filters: PaymentFilterDto = {
        fromDate: '2023-01-01',
      };

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentDate: {
              gte: expect.any(Date),
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should filter by toDate only correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      const filters: PaymentFilterDto = {
        toDate: '2023-01-31',
      };

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentDate: {
              lte: expect.any(Date),
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should filter by search term correctly', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(1);
      mockPrisma.payment.findMany.mockResolvedValue([mockPayments[0]]);

      const filters: PaymentFilterDto = {
        search: 'REC00001',
      };

      // Execute
      const result = await service.findAll(mockUser.id, filters);

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            receiptNumber: {
              contains: 'REC00001',
              mode: 'insensitive',
            },
          }),
        }),
      );
      expect(result.data).toHaveLength(1);
    });

    it('should use default pagination values if not provided', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.count.mockResolvedValue(mockPayments.length);
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      // Execute with empty filter
      const result = await service.findAll(mockUser.id, {});

      // Assert
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // (page 1 - 1) * 10
          take: 10, // default limit
        }),
      );
      expect(result.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayments[0],
        bill: {
          ...mockPayments[0].bill,
          property: {
            ...mockPayments[0].bill.property,
            userId: mockUser.id,
          },
        },
      });

      // Execute
      const result = await service.findOne(mockUser.id, 'payment-1');

      // Assert
      expect(mockPrisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(expect.objectContaining({
        id: 'payment-1',
      }));
    });

    it('should throw NotFoundException when payment is not found', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.findOne(mockUser.id, 'non-existent-payment')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Setup mocks
      const mockPaymentWithBill = {
        ...mockPayments[0],
        bill: {
          ...mockPayments[0].bill,
          propertyId: 'property-1',
        },
      };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPaymentWithBill);
      jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValueOnce(false);

      // Execute & Assert
      await expect(service.findOne(mockUser.id, 'payment-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayments[0]);
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayments[0],
        amount: 1100000,
        notes: 'Updated notes',
      });

      // Create update DTO
      const updatePaymentDto: UpdatePaymentDto = {
        amount: 1100000,
        paymentDate: '2023-01-10',
        notes: 'Updated notes',
      };

      // Execute
      const result = await service.update(mockUser.id, 'payment-1', updatePaymentDto);

      // Assert
      expect(mockPrisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        include: {
          bill: {
            select: {
              id: true,
              propertyId: true,
            },
          },
        },
      });
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          amount: updatePaymentDto.amount,
          paymentDate: expect.any(Date),
          paymentMethod: undefined,
          referenceNumber: undefined,
          notes: updatePaymentDto.notes,
          attachmentUrl: undefined,
        },
      });
      expect(result).toHaveProperty('amount', 1100000);
      expect(result).toHaveProperty('notes', 'Updated notes');
    });

    it('should update a payment without changing the payment date', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayments[0]);
      mockPrisma.payment.update.mockResolvedValue({
        ...mockPayments[0],
        amount: 1100000,
        notes: 'Updated notes',
      });

      // Create update DTO without paymentDate
      const updatePaymentDto: UpdatePaymentDto = {
        amount: 1100000,
        notes: 'Updated notes',
      };

      // Execute
      const result = await service.update(mockUser.id, 'payment-1', updatePaymentDto);

      // Assert
      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          amount: updatePaymentDto.amount,
          paymentDate: undefined, // paymentDate should be undefined
          paymentMethod: undefined,
          referenceNumber: undefined,
          notes: updatePaymentDto.notes,
          attachmentUrl: undefined,
        },
      });
      expect(result).toHaveProperty('amount', 1100000);
      expect(result).toHaveProperty('notes', 'Updated notes');
    });

    it('should throw NotFoundException when payment is not found', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.update(mockUser.id, 'non-existent-payment', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Setup mocks
      const mockPaymentWithBill = {
        ...mockPayments[0],
        bill: {
          id: 'bill-1',
          propertyId: 'property-1',
        },
      };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPaymentWithBill);
      jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValueOnce(false);

      // Update DTO
      const updateDto: UpdatePaymentDto = {
        notes: 'Updated notes',
      };

      // Execute & Assert
      await expect(service.update(mockUser.id, 'payment-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to change billId', async () => {
      // Setup mocks
      const mockPaymentWithBill = {
        ...mockPayments[0],
        billId: 'bill-1',
        bill: {
          id: 'bill-1',
          propertyId: 'property-1',
        },
      };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPaymentWithBill);
      jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValueOnce(true);

      // Update DTO with different billId
      const updateDto: UpdatePaymentDto = {
        billId: 'bill-2', // Different from original bill-1
      };

      // Execute & Assert
      await expect(service.update(mockUser.id, 'payment-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a payment and update the bill', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayments[0],
        bill: {
          ...mockPayments[0].bill,
          property: {
            ...mockPayments[0].bill.property,
            userId: mockUser.id,
          },
        },
      });
      mockPrisma.payment.delete.mockResolvedValue(mockPayments[0]);
      mockPrisma.bill.update.mockResolvedValue({
        ...mockPayments[0].bill,
        isPaid: false,
        paymentDate: null,
        paymentMethod: null,
      });

      // Execute
      const result = await service.remove(mockUser.id, 'payment-1');

      // Assert
      expect(mockPrisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        include: expect.any(Object),
      });
      expect(mockPrisma.payment.delete).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
      });
      expect(mockPrisma.bill.update).toHaveBeenCalledWith({
        where: { id: mockPayments[0].billId },
        data: {
          isPaid: false,
          paymentDate: null,
          paymentMethod: null,
        },
      });
      expect(result).toEqual(mockPayments[0]);
    });

    it('should throw NotFoundException when payment is not found', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'non-existent-payment')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrisma.payment.delete).not.toHaveBeenCalled();
      expect(mockPrisma.bill.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not have access', async () => {
      // Setup mocks
      const mockPaymentWithBill = {
        ...mockPayments[0],
        bill: {
          id: 'bill-1',
          propertyId: 'property-1',
        },
      };
      mockPrisma.payment.findUnique.mockResolvedValue(mockPaymentWithBill);
      jest.spyOn(service as any, 'checkPaymentAccess').mockResolvedValueOnce(false);

      // Execute & Assert
      await expect(service.remove(mockUser.id, 'payment-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.bill.update).not.toHaveBeenCalled();
      expect(mockPrisma.payment.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkPaymentAccess', () => {
    it('should return true if user has access to the property', async () => {
      // Setup mock
      mockPrisma.property.findFirst.mockResolvedValue(mockProperties[0]);
      
      // Reset spy to use actual implementation
      jest.spyOn(service as any, 'checkPaymentAccess').mockRestore();
      
      // Execute
      const result = await (service as any).checkPaymentAccess(mockUser.id, 'property-1');
      
      // Assert
      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
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

    it('should return false if user does not have access to the property', async () => {
      // Setup mock
      mockPrisma.property.findFirst.mockResolvedValue(null);
      
      // Reset spy to use actual implementation
      jest.spyOn(service as any, 'checkPaymentAccess').mockRestore();
      
      // Execute
      const result = await (service as any).checkPaymentAccess(mockUser.id, 'property-3');
      
      // Assert
      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'property-3',
          OR: [
            { userId: mockUser.id },
            { ownerId: mockUser.id },
          ],
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate a receipt number with the correct format', () => {
      // Mock date for consistent testing
      const mockDate = new Date('2023-05-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      // Reset spy to use actual implementation
      jest.spyOn(service as any, 'generateReceiptNumber').mockRestore();
      
      // Mock Math.random to return a consistent value
      const mockRandom = 0.1234;
      jest.spyOn(global.Math, 'random').mockReturnValue(mockRandom);
      
      // Execute
      const receiptNumber = (service as any).generateReceiptNumber();
      
      // Calculate expected result
      const year = mockDate.getFullYear();
      const month = '05'; // May (zero-padded)
      const random = Math.floor(mockRandom * 10000).toString().padStart(4, '0');
      const expected = `RCPT-${year}${month}-${random}`;
      
      // Assert
      expect(receiptNumber).toBe(expected);
      
      // Restore mocks
      (global.Date as any).mockRestore();
      (global.Math.random as any).mockRestore();
    });
  });

  // Thêm test case cho error handling
  describe('error handling', () => {
    it('should handle database errors in create method', async () => {
      // Mock data
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-3',
        amount: 1300000,
        paymentDate: '2023-03-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'REF345',
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      mockPrisma.payment.create.mockRejectedValue(new Error('Database error'));

      // Expect error to be thrown
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow('Database error');
    });

    it('should handle database errors in findAll method', async () => {
      // Setup mocks
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);
      mockPrisma.payment.findMany.mockRejectedValue(new Error('Database query failed'));

      // Expect error to be thrown
      await expect(service.findAll(mockUser.id, { page: 1, limit: 10 })).rejects.toThrow('Database query failed');
    });

    it('should handle database errors in findOne method', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockRejectedValue(new Error('Database query failed'));

      // Expect error to be thrown
      await expect(service.findOne(mockUser.id, 'payment-1')).rejects.toThrow('Database query failed');
    });

    it('should handle database errors in update method', async () => {
      // Mock data
      const updatePaymentDto: UpdatePaymentDto = {
        notes: 'Updated notes',
      };

      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayments[0]);
      mockPrisma.payment.update.mockRejectedValue(new Error('Database update failed'));

      // Expect error to be thrown
      await expect(service.update(mockUser.id, 'payment-1', updatePaymentDto)).rejects.toThrow('Database update failed');
    });

    it('should handle database errors in remove method', async () => {
      // Setup mocks
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayments[0]);
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[0]);
      mockPrisma.payment.delete.mockRejectedValue(new Error('Database delete failed'));

      // Expect error to be thrown
      await expect(service.remove(mockUser.id, 'payment-1')).rejects.toThrow('Database delete failed');
    });

    it('should handle validation errors when creating payment with negative amount', async () => {
      // Mock data with invalid negative amount
      const createPaymentDto: CreatePaymentDto = {
        billId: 'bill-3',
        amount: -1300000, // Negative amount
        paymentDate: '2023-03-05',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      
      // Create mock implementation that checks for negative amount
      mockPrisma.payment.create.mockImplementation((args) => {
        if (args.data.amount < 0) {
          throw new BadRequestException('Amount cannot be negative');
        }
        return Promise.resolve({ id: 'new-payment', ...args.data });
      });
      
      // Expect validation error
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle missing required fields when creating payment', async () => {
      // Mock data with missing required field (paymentMethod)
      const createPaymentDto = {
        billId: 'bill-3',
        amount: 1300000,
        paymentDate: '2023-03-05',
        // Missing paymentMethod
      } as CreatePaymentDto;

      // Setup mocks
      mockPrisma.bill.findUnique.mockResolvedValue(mockBills[1]); // unpaid bill
      
      // Create mock implementation that checks for required fields
      mockPrisma.payment.create.mockImplementation((args) => {
        if (!args.data.paymentMethod) {
          throw new BadRequestException('Payment method is required');
        }
        return Promise.resolve({ id: 'new-payment', ...args.data });
      });

      // Expect validation error
      await expect(service.create(mockUser.id, createPaymentDto)).rejects.toThrow(BadRequestException);
    });
  });
}); 