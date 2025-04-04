import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../../financial/financial.service';
import { PropertyDistributionFilterDto } from '../../dto/property-distribution.dto';
import { createMockPrismaService } from '../../financial/mocks/prisma.mock';
import { createMockCurrencyService } from '../../financial/mocks/currency.mock';

describe('FinancialService - Property Distribution', () => {
  let service: FinancialService;
  let prismaService: any;
  let currencyService: any;
  const userId = 'test-user-id';

  // Mock data for properties
  const mockProperties = [
    {
      id: 'property-1',
      name: 'Property A',
      address: '123 Main St',
      city: 'Anytown',
      district: 'Downtown',
      ward: 'Ward 1',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      userId: userId,
      ownerId: userId,
      _count: { units: 3 },
    },
    {
      id: 'property-2',
      name: 'Property B',
      address: '456 Oak St',
      city: 'Othertown',
      district: 'Uptown',
      ward: 'Ward 2',
      type: 'HOUSE',
      status: 'AVAILABLE',
      userId: userId,
      ownerId: userId,
      _count: { units: 2 },
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mocks for services
    prismaService = createMockPrismaService();
    currencyService = createMockCurrencyService();
    
    // Mock property.findMany
    prismaService.property.findMany.mockResolvedValue(mockProperties);
    
    // Mock payment.aggregate for revenue
    prismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
    
    // Directly instantiate the service with the mocked services
    service = new FinancialService(prismaService, currencyService);
  });

  describe('getPropertyDistribution', () => {
    it('should return property distribution data', async () => {
      const filters: PropertyDistributionFilterDto = {
        period: 'month',
      };

      // Mock property revenue calculation
      jest.spyOn(service as any, 'getPropertyRevenue').mockImplementation((propertyId: string) => {
        if (propertyId === 'property-1') return Promise.resolve(3000);
        if (propertyId === 'property-2') return Promise.resolve(2000);
        return Promise.resolve(0);
      });

      // Mock property expense calculation
      jest.spyOn(service as any, 'getPropertyExpenses').mockImplementation((propertyId: string) => {
        if (propertyId === 'property-1') return Promise.resolve(1000);
        if (propertyId === 'property-2') return Promise.resolve(500);
        return Promise.resolve(0);
      });

      // Mock getDateRangeForPeriod
      jest.spyOn(service as any, 'getDateRangeForPeriod').mockReturnValue({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      });

      const result = await service.getPropertyDistribution(userId, filters);

      // Verify the results
      expect(result).toHaveProperty('totalProperties', 2);
      expect(result).toHaveProperty('totalUnits', 5);
      expect(result).toHaveProperty('totalRevenue', 5000);
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
      
      // Verify property details
      const property1 = result.items.find(item => item.id === 'property-1');
      expect(property1).toBeDefined();
      expect(property1?.name).toBe('Property A');
      expect(property1?.revenue).toBe(3000);
      expect(property1?.expenses).toBe(1000);
      expect(property1?.profit).toBe(2000);
      expect(property1?.unitCount).toBe(3);
      
      const property2 = result.items.find(item => item.id === 'property-2');
      expect(property2).toBeDefined();
      expect(property2?.name).toBe('Property B');
      expect(property2?.revenue).toBe(2000);
      expect(property2?.expenses).toBe(500);
      expect(property2?.profit).toBe(1500);
      expect(property2?.unitCount).toBe(2);
    });

    it('should handle filters by property type', async () => {
      const filters: PropertyDistributionFilterDto = {
        period: 'month',
        type: 'APARTMENT',
      };

      // Mock property revenue and expenses
      jest.spyOn(service as any, 'getPropertyRevenue').mockResolvedValue(3000);
      jest.spyOn(service as any, 'getPropertyExpenses').mockResolvedValue(1000);

      // Call the method
      const result = await service.getPropertyDistribution(userId, filters);

      // Verify property query includes the type filter
      expect(prismaService.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            type: 'APARTMENT',
          })
        })
      );
    });

    it('should handle empty property list', async () => {
      // Mock empty property list
      prismaService.property.findMany.mockResolvedValue([]);
      
      const filters: PropertyDistributionFilterDto = {
        period: 'month',
      };

      const result = await service.getPropertyDistribution(userId, filters);

      // Verify the results for empty list
      expect(result).toHaveProperty('totalProperties', 0);
      expect(result).toHaveProperty('totalUnits', 0);
      expect(result).toHaveProperty('totalRevenue', 0);
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getPropertyRevenue', () => {
    it('should calculate property revenue for given period', async () => {
      // Setup date range
      const dateRange = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      // Set revenue for specific property
      prismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: 3000 } });

      // Call the method
      const revenue = await (service as any).getPropertyRevenue('property-1', dateRange);

      // Verify result
      expect(revenue).toBe(3000);
      
      // Verify correct query parameters
      expect(prismaService.payment.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _sum: { amount: true },
          where: expect.objectContaining({
            bill: {
              propertyId: 'property-1'
            },
            paymentDate: {
              gte: dateRange.startDate,
              lte: dateRange.endDate
            }
          })
        })
      );
    });

    it('should handle null revenue', async () => {
      // Setup date range
      const dateRange = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      // Mock null revenue
      prismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });

      // Call the method
      const revenue = await (service as any).getPropertyRevenue('property-1', dateRange);

      // Verify result
      expect(revenue).toBe(0);
    });
  });
}); 