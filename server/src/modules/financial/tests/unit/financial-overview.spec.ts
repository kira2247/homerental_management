import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from '../../financial/financial.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FinancialOverviewFilterDto } from '../../dto/financial-overview.dto';
import { Prisma } from '@prisma/client';
import { createMockPrismaService } from '../../financial/mocks/prisma.mock';
import { createMockCurrencyService } from '../../financial/mocks/currency.mock';

// Thêm type TimePeriod để đồng bộ với code trong service
type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

describe('FinancialService - Financial Overview', () => {
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
      status: 'COMPLETED',
      billId: 'bill-1',
      tenantId: 'tenant-1',
      bill: {
        id: 'bill-1',
        propertyId: 'property-1',
        property: { name: 'Property A' },
        rentAmount: 800,
        paymentConfirmed: true,
        createdById: userId
      },
      tenant: { name: 'John Doe' },
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mocks for services
    prismaService = createMockPrismaService();
    currencyService = createMockCurrencyService();
    
    // Directly instantiate the service with the mocked services
    service = new FinancialService(prismaService, currencyService);
  });

  describe('getFinancialOverview', () => {
    it('should return financial overview based on period', async () => {
      const filters: FinancialOverviewFilterDto = {
        period: 'month',
      };

      // Mock getDateRangeForPeriod
      const dateRange = {
        startDate: new Date('2023-04-01'),
        endDate: new Date('2023-04-30'),
      };
      jest.spyOn(service as any, 'getDateRangeForPeriod').mockReturnValue(dateRange);

      // Mock getDateRangeForPreviousPeriod
      const prevDateRange = {
        startDate: new Date('2023-03-01'),
        endDate: new Date('2023-03-31'),
      };
      jest.spyOn(service as any, 'getDateRangeForPreviousPeriod').mockReturnValue(prevDateRange);

      // Mock getRevenueAndExpenses
      jest.spyOn(service as any, 'getRevenueAndExpenses').mockImplementation(
        (userId: string, startDate: Date, endDate: Date) => {
          if (startDate.getMonth() === 3) { // Tháng hiện tại (Tháng 4)
            return Promise.resolve({
              revenue: 2000,
              expenses: 500
            });
          } else { // Tháng trước (Tháng 3)
            return Promise.resolve({
              revenue: 1800,
              expenses: 400
            });
          }
        });

      // Mock calculateFinancialChanges
      jest.spyOn(service as any, 'calculateFinancialChanges').mockReturnValue({
        netProfit: 1500,
        prevNetProfit: 1400,
        revenueChange: 11.1,
        expenseChange: 25.0,
        profitChange: 7.1
      });

      // Mock getChartDataForPeriod
      jest.spyOn(service as any, 'getChartDataForPeriod').mockResolvedValue({
        income: [500, 500, 500, 500],
        expense: [125, 125, 125, 125],
        profit: [375, 375, 375, 375],
        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']
      });

      // Khi gọi phương thức thực tế
      const result = await service.getFinancialOverview(userId, filters);

      // Kiểm tra kết quả 
      expect(result).toHaveProperty('totalRevenue', 2000);
      expect(result).toHaveProperty('totalExpenses', 500);
      expect(result).toHaveProperty('netProfit', 1500);
      expect(result).toHaveProperty('revenueChange', 11.1);
      expect(result).toHaveProperty('expenseChange', 25.0);
      expect(result).toHaveProperty('profitChange', 7.1);
      expect(result).toHaveProperty('chartData');
      expect(result.chartData).toHaveProperty('income');
      expect(result.chartData).toHaveProperty('expense');
      expect(result.chartData).toHaveProperty('profit');
      expect(result.chartData).toHaveProperty('labels');
    });

    it('should filter by date range when provided', async () => {
      const filters: FinancialOverviewFilterDto = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      // Cần làm sạch mock trước để tránh tác động từ test trước
      jest.restoreAllMocks();
      
      // Khi cung cấp date range cụ thể, cần kiểm tra phương thức không bị gọi bằng cách spy sau
      const dateRangeSpy = jest.spyOn(service as any, 'getDateRangeForPeriod');
      
      // Mock getDateRangeForPreviousPeriod
      const prevDateRange = {
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
      };
      jest.spyOn(service as any, 'getDateRangeForPreviousPeriod').mockReturnValue(prevDateRange);

      // Mock getRevenueAndExpenses
      jest.spyOn(service as any, 'getRevenueAndExpenses').mockResolvedValue({
        revenue: 5000,
        expenses: 2000
      });

      // Mock calculateFinancialChanges
      jest.spyOn(service as any, 'calculateFinancialChanges').mockReturnValue({
        netProfit: 3000,
        prevNetProfit: 2500,
        revenueChange: 15,
        expenseChange: 10,
        profitChange: 20
      });

      // Mock getChartDataForPeriod
      jest.spyOn(service as any, 'getChartDataForPeriod').mockResolvedValue({
        income: [1000, 1000, 1500, 1500],
        expense: [400, 500, 500, 600],
        profit: [600, 500, 1000, 900],
        labels: ['Q1', 'Q2', 'Q3', 'Q4']
      });

      // Mock phương thức parse date trong service nếu có
      if (typeof service['parseDateRange'] === 'function') {
        jest.spyOn(service as any, 'parseDateRange').mockReturnValue({
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31')
        });
      }

      const result = await service.getFinancialOverview(userId, filters);

      // Kiểm tra kết quả
      expect(result).toHaveProperty('totalRevenue', 5000);
      expect(result).toHaveProperty('netProfit', 3000);
      
      // Xác minh getRevenueAndExpenses được gọi với đúng tham số
      expect(service['getRevenueAndExpenses']).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('getChartDataForPeriod', () => {
    it('should handle chart data generation for monthly period', async () => {
      // Mock getIndexForDate to map dates to correct week index
      jest.spyOn(service as any, 'getIndexForDate').mockImplementation((date: Date, period: TimePeriod) => {
        const day = date.getDate();
        if (day <= 7) return 0;
        if (day <= 14) return 1;
        if (day <= 21) return 2;
        return 3;
      });
      
      // Setup mock payments data
      const mockPayments = [
        {
          id: 'payment1',
          amount: 1000,
          paymentDate: new Date('2023-01-05T10:00:00Z'),
          bill: { rentAmount: 0 }
        },
        {
          id: 'payment2',
          amount: 2000,
          paymentDate: new Date('2023-01-20T10:00:00Z'),
          bill: { rentAmount: 0 }
        },
        {
          id: 'payment3',
          amount: 500,
          paymentDate: new Date('2023-01-10T10:00:00Z'),
          bill: { rentAmount: 500 }
        },
        {
          id: 'payment4',
          amount: 800,
          paymentDate: new Date('2023-01-25T10:00:00Z'),
          bill: { rentAmount: 800 }
        }
      ];
      
      prismaService.payment.findMany.mockResolvedValue(mockPayments);
      
      // Execute method and check result
      const result = await (service as any).getChartDataForPeriod('test-user-id', 'month');
      
      // Assert results
      expect(prismaService.payment.findMany).toHaveBeenCalled();
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('expense');
      expect(result).toHaveProperty('profit');
      expect(result).toHaveProperty('labels');
      expect(result.labels).toEqual(['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']);
    });
  });
}); 