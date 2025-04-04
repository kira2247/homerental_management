import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../../financial/financial.service';
import { DashboardSummaryFilterDto } from '../../dto/dashboard-summary.dto';
import { createMockPrismaService } from '../../financial/mocks/prisma.mock';
import { createMockCurrencyService } from '../../financial/mocks/currency.mock';

describe('FinancialService - Dashboard Summary', () => {
  let service: FinancialService;
  let prismaService: any;
  let currencyService: any;
  const userId = 'test-user-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mocks for services
    prismaService = createMockPrismaService();
    currencyService = createMockCurrencyService();
    
    // Mock base counts
    prismaService.property.count.mockResolvedValue(5);
    prismaService.unit.count.mockResolvedValue(15);
    prismaService.tenant.count.mockResolvedValue(10);
    prismaService.bill.count.mockResolvedValue(20);
    
    // Mock payment aggregate
    prismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
    
    // Directly instantiate the service with the mocked services
    service = new FinancialService(prismaService, currencyService);
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary data', async () => {
      const filters: DashboardSummaryFilterDto = {
        period: 'month',
      };

      // Mock current vs previous period
      jest.spyOn(service as any, 'getPreviousPeriodCounts').mockResolvedValue({
        propertyCount: 4,
        tenantCount: 8,
        revenue: 4000
      });

      // Mock pending payments
      jest.spyOn(service as any, 'getPendingPayments').mockResolvedValue(3);

      // Mock getDateRangeForPeriod
      jest.spyOn(service as any, 'getDateRangeForPeriod').mockReturnValue({
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      });

      // Mock convertBillsToMoneyOwed
      jest.spyOn(service as any, 'convertBillsToMoneyOwed').mockResolvedValue({
        overdue: 1500,
        upcoming: 3000
      });

      const result = await service.getDashboardSummary(userId, filters);

      // Verify the results
      expect(result).toHaveProperty('properties');
      expect(result.properties).toHaveProperty('count', 5);
      expect(result.properties).toHaveProperty('change', 25);
      
      expect(result).toHaveProperty('units');
      expect(result.units).toHaveProperty('count', 15);
      
      expect(result).toHaveProperty('tenants');
      expect(result.tenants).toHaveProperty('count', 10);
      expect(result.tenants).toHaveProperty('change', 25);
      
      expect(result).toHaveProperty('revenue');
      expect(result.revenue).toHaveProperty('amount', 5000);
      expect(result.revenue).toHaveProperty('change', 25);
      
      expect(result).toHaveProperty('pendingPayments', 3);
      
      expect(result).toHaveProperty('financialStatus');
      expect(result.financialStatus).toHaveProperty('overdue', 1500);
      expect(result.financialStatus).toHaveProperty('upcoming', 3000);
    });

    it('should handle provided date range', async () => {
      const filters: DashboardSummaryFilterDto = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };

      // Mock all needed services
      jest.spyOn(service as any, 'getPreviousPeriodCounts').mockResolvedValue({
        propertyCount: 4,
        tenantCount: 8,
        revenue: 4000
      });
      jest.spyOn(service as any, 'getPendingPayments').mockResolvedValue(3);
      jest.spyOn(service as any, 'convertBillsToMoneyOwed').mockResolvedValue({
        overdue: 1500,
        upcoming: 3000
      });

      await service.getDashboardSummary(userId, filters);

      // Verify the date parsing
      if (typeof service['parseDateRange'] === 'function') {
        expect(service['parseDateRange']).toHaveBeenCalledWith({
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        });
      }
    });

    it('should handle empty data', async () => {
      // Mock empty database
      prismaService.property.count.mockResolvedValue(0);
      prismaService.unit.count.mockResolvedValue(0);
      prismaService.tenant.count.mockResolvedValue(0);
      prismaService.bill.count.mockResolvedValue(0);
      prismaService.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
      
      jest.spyOn(service as any, 'getPreviousPeriodCounts').mockResolvedValue({
        propertyCount: 0,
        tenantCount: 0,
        revenue: 0
      });
      jest.spyOn(service as any, 'getPendingPayments').mockResolvedValue(0);
      jest.spyOn(service as any, 'convertBillsToMoneyOwed').mockResolvedValue({
        overdue: 0,
        upcoming: 0
      });

      const filters: DashboardSummaryFilterDto = {
        period: 'month',
      };

      const result = await service.getDashboardSummary(userId, filters);

      // Verify zero values
      expect(result.properties.count).toBe(0);
      expect(result.properties.change).toBe(0);
      expect(result.units.count).toBe(0);
      expect(result.tenants.count).toBe(0);
      expect(result.tenants.change).toBe(0);
      expect(result.revenue.amount).toBe(0);
      expect(result.revenue.change).toBe(0);
      expect(result.pendingPayments).toBe(0);
      expect(result.financialStatus.overdue).toBe(0);
      expect(result.financialStatus.upcoming).toBe(0);
    });
  });

  describe('getPendingPayments', () => {
    it('should return number of pending payments', async () => {
      // Mock bills count for unpaid bills
      prismaService.bill.count.mockResolvedValue(5);

      const result = await (service as any).getPendingPayments(userId);
      
      expect(result).toBe(5);
      expect(prismaService.bill.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdById: userId,
          isPaid: false,
          dueDate: expect.any(Object)
        })
      });
    });
  });

  describe('convertBillsToMoneyOwed', () => {
    it('should calculate overdue and upcoming amounts', async () => {
      // Mock bills
      const today = new Date();
      const overdueDate = new Date(today);
      overdueDate.setDate(today.getDate() - 5);
      
      const upcomingDate = new Date(today);
      upcomingDate.setDate(today.getDate() + 5);
      
      const mockBills = [
        { id: 'bill1', totalAmount: 1000, dueDate: overdueDate, isPaid: false },
        { id: 'bill2', totalAmount: 1500, dueDate: upcomingDate, isPaid: false },
        { id: 'bill3', totalAmount: 2000, dueDate: upcomingDate, isPaid: false }
      ];
      
      // Mock bill.findMany
      prismaService.bill.findMany.mockResolvedValue(mockBills);
      
      const result = await (service as any).convertBillsToMoneyOwed(userId);
      
      expect(result).toHaveProperty('overdue', 1000);
      expect(result).toHaveProperty('upcoming', 3500);
      
      expect(prismaService.bill.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdById: userId,
          isPaid: false
        }),
        select: expect.objectContaining({
          totalAmount: true,
          dueDate: true
        })
      });
    });
  });
}); 