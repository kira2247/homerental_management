import { Test, TestingModule } from '@nestjs/testing';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialOverviewFilterDto } from '../dto/financial-overview.dto';
import { PropertyDistributionFilterDto } from '../dto/property-distribution.dto';
import { TransactionFilterDto } from '../dto/transaction.dto';
import { DashboardSummaryFilterDto } from '../dto/dashboard-summary.dto';
import { PendingTasksFilterDto } from '../dto/pending-tasks.dto';
import { createMock } from '@golevelup/ts-jest';

describe('FinancialController', () => {
  let controller: FinancialController;
  let financialService: FinancialService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'OWNER',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialController],
      providers: [
        {
          provide: FinancialService,
          useValue: {
            getFinancialOverview: jest.fn(),
            getPropertyDistribution: jest.fn(),
            getTransactions: jest.fn(),
            getDashboardSummary: jest.fn(),
            getPendingTasks: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FinancialController>(FinancialController);
    financialService = module.get<FinancialService>(FinancialService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFinancialOverview', () => {
    it('should call financialService.getFinancialOverview with correct parameters', async () => {
      const filters: FinancialOverviewFilterDto = {
        period: 'month',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };
      
      const expected = { 
        totalRevenue: 5000,
        revenueChange: 10,
        totalExpenses: 2000,
        expenseChange: 5,
        netProfit: 3000,
        profitChange: 15,
        chartData: {
          income: [1000, 1200, 1400, 1400],
          expense: [500, 500, 500, 500],
          profit: [500, 700, 900, 900],
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        },
        currency: 'USD'
      };
      
      jest.spyOn(financialService, 'getFinancialOverview').mockResolvedValue(expected as any);
      
      const result = await controller.getFinancialOverview(filters, mockRequest as any);
      
      expect(financialService.getFinancialOverview).toHaveBeenCalledWith(mockUser.id, filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getPropertyDistribution', () => {
    it('should call financialService.getPropertyDistribution with correct parameters', async () => {
      const filters: PropertyDistributionFilterDto = {
        type: 'APARTMENT',
      };
      
      const expected = { 
        items: [
          { 
            id: 'prop-1', 
            name: 'Property A', 
            revenue: 3000, 
            expenses: 1000,
            profit: 2000,
            percentage: 60, 
            unitCount: 2 
          },
          { 
            id: 'prop-2', 
            name: 'Property B', 
            revenue: 2000, 
            expenses: 800,
            profit: 1200,
            percentage: 40, 
            unitCount: 1 
          },
        ],
        totalProperties: 2,
        totalUnits: 3,
        totalRevenue: 5000
      };
      
      jest.spyOn(financialService, 'getPropertyDistribution').mockResolvedValue(expected);
      
      const result = await controller.getPropertyDistribution(filters, mockRequest as any);
      
      expect(financialService.getPropertyDistribution).toHaveBeenCalledWith(mockUser.id, filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getTransactions', () => {
    it('should call financialService.getTransactions with correct parameters', async () => {
      const filters: TransactionFilterDto = {
        limit: 10,
        page: 1,
        sortBy: 'date',
        sortOrder: 'desc',
      };
      
      const expected = { 
        items: [],
        totalItems: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      };
      
      jest.spyOn(financialService, 'getTransactions').mockResolvedValue(expected);
      
      const result = await controller.getTransactions(filters, mockRequest as any);
      
      expect(financialService.getTransactions).toHaveBeenCalledWith(mockUser.id, filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getDashboardSummary', () => {
    it('should call financialService.getDashboardSummary with correct parameters', async () => {
      const filters: DashboardSummaryFilterDto = {};
      
      const expected = { 
        properties: { count: 3, change: 0 },
        units: { count: 12, change: 20 },
        tenants: { count: 5, change: 25 },
        revenue: { amount: 5000, change: 15 },
        pendingPayments: 2500,
        financialStatus: {
          overdue: 3,
          upcoming: 2
        }
      };
      
      jest.spyOn(financialService, 'getDashboardSummary').mockResolvedValue(expected);
      
      const result = await controller.getDashboardSummary(filters, mockRequest as any);
      
      expect(financialService.getDashboardSummary).toHaveBeenCalledWith(mockUser.id, filters);
      expect(result).toEqual(expected);
    });
  });

  describe('getPendingTasks', () => {
    it('should call financialService.getPendingTasks with correct parameters', async () => {
      const filters: PendingTasksFilterDto = {
        limit: 5,
        page: 1,
      };
      
      const expected = { 
        tasks: [],
        total: 0,
        page: 1,
        limit: 5,
      };
      
      jest.spyOn(financialService, 'getPendingTasks').mockResolvedValue(expected);
      
      const result = await controller.getPendingTasks(filters, mockRequest as any);
      
      expect(financialService.getPendingTasks).toHaveBeenCalledWith(mockUser.id, filters);
      expect(result).toEqual(expected);
    });
  });
}); 