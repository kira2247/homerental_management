import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../../financial/financial.service';
import { TransactionFilterDto } from '../../dto/transaction.dto';
import { createMockPrismaService } from '../../financial/mocks/prisma.mock';
import { createMockCurrencyService } from '../../financial/mocks/currency.mock';

describe('FinancialService - Transactions', () => {
  let service: FinancialService;
  let prismaService: any;
  let currencyService: any;
  const userId = 'test-user-id';

  // Mock data for payments
  const mockPayments = [
    {
      id: 'payment-1',
      amount: 1000,
      paymentDate: new Date('2023-01-10'),
      paymentMethod: 'BANK_TRANSFER',
      status: 'completed',
      billId: 'bill-1',
      tenantId: 'tenant-1',
      bill: {
        id: 'bill-1',
        propertyId: 'property-1',
        property: { name: 'Property A' },
        unitId: 'unit-1',
        unit: { name: 'Unit 101' },
        rentAmount: 800,
        paymentConfirmed: true,
        createdById: userId
      },
      tenant: { name: 'John Doe' },
    },
    {
      id: 'payment-2',
      amount: 1200,
      paymentDate: new Date('2023-01-15'),
      paymentMethod: 'CASH',
      status: 'completed',
      billId: 'bill-2',
      tenantId: 'tenant-2',
      bill: {
        id: 'bill-2',
        propertyId: 'property-2',
        property: { name: 'Property B' },
        unitId: 'unit-2',
        unit: { name: 'Unit 202' },
        rentAmount: 1200,
        paymentConfirmed: true,
        createdById: userId
      },
      tenant: { name: 'Jane Smith' },
    }
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mocks for services
    prismaService = createMockPrismaService();
    currencyService = createMockCurrencyService();
    
    // Mock payment.findMany and payment.count
    prismaService.payment.findMany.mockResolvedValue(mockPayments);
    prismaService.payment.count.mockResolvedValue(mockPayments.length);
    
    // Directly instantiate the service with the mocked services
    service = new FinancialService(prismaService, currencyService);
  });

  describe('getTransactions', () => {
    it('should return transactions with pagination', async () => {
      const filters: TransactionFilterDto = {
        page: 1,
        limit: 10,
      };

      // Mock getDateRangeForPeriod if used
      if (typeof service['getDateRangeForPeriod'] === 'function') {
        jest.spyOn(service as any, 'getDateRangeForPeriod').mockReturnValue({
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31'),
        });
      }

      const result = await service.getTransactions(userId, filters);

      // Verify the results
      expect(result).toHaveProperty('totalItems', 2);
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
      
      // Verify pagination params
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('totalPages', 1);
      
      // Verify transaction details
      const transaction1 = result.items[0];
      expect(transaction1).toHaveProperty('id', 'payment-1');
      expect(transaction1).toHaveProperty('amount', 1000);
      expect(transaction1).toHaveProperty('paymentMethod', 'BANK_TRANSFER');
      expect(transaction1).toHaveProperty('propertyName', 'Property A');
      expect(transaction1).toHaveProperty('unitName', 'Unit 101');
      expect(transaction1).toHaveProperty('tenantName', 'John Doe');

      // Verify query parameters
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: expect.objectContaining({
            bill: {
              property: {
                userId
              }
            }
          }),
          orderBy: expect.any(Object),
          include: expect.any(Object)
        })
      );
    });

    it('should apply date range filters when provided', async () => {
      const filters: TransactionFilterDto = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        page: 1,
        limit: 10,
      };

      await service.getTransactions(userId, filters);

      // Verify date range is applied to query
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            paymentDate: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            }
          })
        })
      );
    });

    it('should apply property and status filters when provided', async () => {
      const filters: TransactionFilterDto = {
        propertyId: 'property-1',
        status: 'completed',
        page: 1,
        limit: 10,
      };

      await service.getTransactions(userId, filters);

      // Verify property and status filters are applied
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'completed',
            bill: expect.objectContaining({
              propertyId: 'property-1',
              property: {
                userId
              }
            })
          })
        })
      );
    });

    it('should handle empty transaction list', async () => {
      // Mock empty payment list
      prismaService.payment.findMany.mockResolvedValue([]);
      prismaService.payment.count.mockResolvedValue(0);
      
      const filters: TransactionFilterDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.getTransactions(userId, filters);

      // Verify empty results
      expect(result).toHaveProperty('totalItems', 0);
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(0);
      expect(result).toHaveProperty('totalPages', 0);
    });

    it('should handle search query', async () => {
      const filters: TransactionFilterDto = {
        search: 'John',
        page: 1,
        limit: 10,
      };

      await service.getTransactions(userId, filters);

      // Verify search query is applied
      expect(prismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                tenant: expect.objectContaining({
                  name: expect.objectContaining({
                    contains: 'John',
                    mode: 'insensitive'
                  })
                })
              })
            ])
          })
        })
      );
    });
  });
}); 