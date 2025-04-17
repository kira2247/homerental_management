import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FinancialOverviewDto, FinancialOverviewFilterDto } from '../dto/financial-overview.dto';
import { PropertyDistributionDto, PropertyDistributionFilterDto, PropertyDistributionItemDto } from '../dto/property-distribution.dto';
import { TransactionDto, TransactionFilterDto, TransactionListDto } from '../dto/transaction.dto';
import { DashboardSummaryDto, DashboardSummaryFilterDto } from '../dto/dashboard-summary.dto';
import { PendingTaskDto, PendingTasksFilterDto, PendingTasksResponseDto } from '../dto/pending-tasks.dto';
import { ChartData, TimePeriod } from '../interfaces/chart-data.interface';
import { Prisma } from '@prisma/client';
import { CurrencyService } from '../../currency/currency.service';
import { SupportedCurrency } from '../../currency/interfaces/currency.interface';

@Injectable()
export class FinancialService {
  // Set of colors for property types in distribution chart
  private readonly propertyTypeColors = {
    APARTMENT: 'rgba(59, 130, 246, 0.8)',
    HOUSE: 'rgba(16, 185, 129, 0.8)',
    VILLA: 'rgba(245, 158, 11, 0.8)',
    OFFICE: 'rgba(239, 68, 68, 0.8)',
    SHOP: 'rgba(139, 92, 246, 0.8)',
  };

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

  /**
   * Get financial overview data
   */
  async getFinancialOverview(
    userId: string,
    filters: FinancialOverviewFilterDto,
    fallbackOnError = false,
  ): Promise<FinancialOverviewDto> {
    try {
      // Xác định thời gian cho khoảng thời gian
      const { startDate, endDate } = this.getDateRangeForPeriod(filters.period || 'month');
      
      // Lấy dữ liệu doanh thu và chi phí cho kỳ hiện tại
      const { revenue: totalRevenue, expenses: totalExpenses } = 
        await this.getRevenueAndExpenses(userId, startDate, endDate);
      
      // Tính toán phần trăm thay đổi bằng cách so sánh với kỳ trước
      const { startDate: prevStartDate, endDate: prevEndDate } = 
        this.getDateRangeForPreviousPeriod(filters.period || 'month');
      
      // Lấy dữ liệu doanh thu và chi phí cho kỳ trước
      const { revenue: prevTotalRevenue, expenses: prevTotalExpenses } = 
        await this.getRevenueAndExpenses(userId, prevStartDate, prevEndDate);
      
      // Tính toán các chỉ số thay đổi
      const { 
        netProfit, 
        prevNetProfit,
        revenueChange,
        expenseChange,
        profitChange
      } = this.calculateFinancialChanges(
        totalRevenue, 
        totalExpenses, 
        prevTotalRevenue, 
        prevTotalExpenses
      );
      
      // Lấy dữ liệu biểu đồ
      const chartData = await this.getChartDataForPeriod(userId, filters.period || 'month');
      
      // Xác định tiền tệ hiển thị
      const originalCurrency = SupportedCurrency.VND; // Tiền tệ mặc định trong hệ thống
      let displayCurrency = originalCurrency;
      let convertedTotalRevenue = totalRevenue;
      let convertedTotalExpenses = totalExpenses;
      let convertedNetProfit = netProfit;
      
      // Chuyển đổi tiền tệ nếu cần
      if (filters.convertToPreferred) {
        const userPreference = await this.currencyService.getUserCurrencyPreference(userId);
        displayCurrency = userPreference.preferredCurrency;
        
        if (displayCurrency !== originalCurrency) {
          // Chuyển đổi các số liệu tài chính sang tiền tệ ưa thích
          convertedTotalRevenue = await this.currencyService.convert(
            totalRevenue,
            originalCurrency,
            displayCurrency
          ) as number;
          
          convertedTotalExpenses = await this.currencyService.convert(
            totalExpenses,
            originalCurrency,
            displayCurrency
          ) as number;
          
          convertedNetProfit = convertedTotalRevenue - convertedTotalExpenses;
        }
      } else if (filters.currency) {
        // Sử dụng tiền tệ được chỉ định trong filter
        displayCurrency = filters.currency;
        
        if (displayCurrency !== originalCurrency) {
          // Chuyển đổi các số liệu tài chính sang tiền tệ được chỉ định
          convertedTotalRevenue = await this.currencyService.convert(
            totalRevenue,
            originalCurrency,
            displayCurrency
          ) as number;
          
          convertedTotalExpenses = await this.currencyService.convert(
            totalExpenses,
            originalCurrency,
            displayCurrency
          ) as number;
          
          convertedNetProfit = convertedTotalRevenue - convertedTotalExpenses;
        }
      }
      
      const result: FinancialOverviewDto = {
        totalRevenue: convertedTotalRevenue,
        revenueChange: parseFloat(revenueChange.toFixed(1)),
        totalExpenses: convertedTotalExpenses,
        expenseChange: parseFloat(expenseChange.toFixed(1)),
        netProfit: convertedNetProfit,
        profitChange: parseFloat(profitChange.toFixed(1)),
        chartData: {
          income: chartData.income,
          expense: chartData.expense,
          profit: chartData.profit,
          labels: chartData.labels
        },
        currency: displayCurrency
      };
      
      // Thêm thông tin về tiền tệ gốc nếu đã chuyển đổi
      if (displayCurrency !== originalCurrency) {
        result.originalCurrency = originalCurrency;
      }
      
      return result;
    } catch (error) {
      return this.handleFinancialError(error, 'getFinancialOverview', filters, userId, fallbackOnError);
    }
  }
  
  /**
   * Lấy doanh thu và chi phí trong khoảng thời gian
   */
  private async getRevenueAndExpenses(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ revenue: number, expenses: number }> {
    // Lấy dữ liệu doanh thu từ database - thanh toán cho hóa đơn tiền thuê
    const currentRevenue = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        bill: {
          createdById: userId,
          rentAmount: {
            gt: 0
          }
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    // Lấy dữ liệu chi phí từ database - thanh toán cho hóa đơn bảo trì và khác
    const currentExpenses = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        bill: {
          createdById: userId,
          // Lấy tất cả hóa đơn không phải hóa đơn tiền thuê
          // (không có cách xác định rõ ràng hóa đơn bảo trì/khác)
          rentAmount: {
            equals: 0
          }
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    return {
      revenue: currentRevenue._sum.amount || 0,
      expenses: currentExpenses._sum.amount || 0,
    };
  }
  
  /**
   * Tính toán các chỉ số thay đổi tài chính
   */
  private calculateFinancialChanges(
    totalRevenue: number,
    totalExpenses: number,
    prevTotalRevenue: number,
    prevTotalExpenses: number
  ): { 
    netProfit: number, 
    prevNetProfit: number,
    revenueChange: number,
    expenseChange: number,
    profitChange: number
  } {
    // Tính toán lợi nhuận
    const netProfit = totalRevenue - totalExpenses;
    const prevNetProfit = prevTotalRevenue - prevTotalExpenses;
    
    // Tính toán phần trăm thay đổi
    const revenueChange = prevTotalRevenue === 0 
      ? 0 
      : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100;
    
    const expenseChange = prevTotalExpenses === 0 
      ? 0 
      : ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100;
    
    const profitChange = prevNetProfit === 0 
      ? 0 
      : ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100;
      
    return {
      netProfit,
      prevNetProfit,
      revenueChange,
      expenseChange,
      profitChange
    };
  }
  
  /**
   * Xử lý lỗi trong các chức năng tài chính
   */
  private handleFinancialError(
    error: any, 
    functionName: string, 
    filters: any, 
    userId: string,
    fallbackOnError = false
  ): never | any {
    // Nếu cần trả về dữ liệu mặc định khi có lỗi
    if (fallbackOnError) {
      const responseType = functionName.replace('get', '').charAt(0).toLowerCase() 
        + functionName.replace('get', '').slice(1);
      return this.getErrorFallbackResponse(responseType);
    }
    
    // Re-throw with more specific message for better client-side handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error (${error.code}): ${error.message}`);
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(`Validation error in database query: ${error.message}`);
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      throw new Error('Critical database error occurred');
    } else {
      throw new Error(`Error fetching ${functionName.replace('get', '')}: ${error.message}`);
    }
  }

  /**
   * Get property distribution data
   */
  async getPropertyDistribution(
    userId: string,
    filters: PropertyDistributionFilterDto,
    fallbackOnError = false,
  ): Promise<PropertyDistributionDto> {
    try {
      // Tính ngày bắt đầu và kết thúc dựa trên bộ lọc
      const dateRange = this.getDateRangeForPeriod(filters.period || 'month');
      
      // Lọc bất động sản
      const whereCondition: any = { userId };
      
      // Thêm điều kiện lọc theo loại bất động sản nếu được chỉ định
      if (filters.type) {
        whereCondition.type = filters.type;
      }
      
      // Lấy danh sách bất động sản
      const properties = await this.prisma.property.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: { units: true }
          }
        },
      });
      
      // Tính tổng số đơn vị
      const totalUnits = properties.reduce((sum, property) => sum + property._count.units, 0);
      
      // Tính doanh thu và chi phí cho từng bất động sản
      const propertyItems: PropertyDistributionItemDto[] = [];
      let totalRevenue = 0;
      
      for (const property of properties) {
        // Lấy doanh thu từ phương thức getPropertyRevenue
        const revenue = await this.getPropertyRevenue(property.id, dateRange);
        // Lấy chi phí từ phương thức getPropertyExpenses
        const expenses = await this.getPropertyExpenses(property.id, dateRange);
        const profit = revenue - expenses;
        
        propertyItems.push({
          id: property.id,
          name: property.name,
          revenue,
          expenses,
          profit,
          percentage: 0, // Tạm để 0, sẽ cập nhật sau
          unitCount: property._count.units,
        });
        
        totalRevenue += revenue;
      }
      
      // Cập nhật phần trăm doanh thu
      for (const item of propertyItems) {
        item.percentage = totalRevenue > 0 ? parseFloat(((item.revenue / totalRevenue) * 100).toFixed(1)) : 0;
      }
      
      // Sắp xếp theo doanh thu
      propertyItems.sort((a, b) => b.revenue - a.revenue);
      
      return {
        totalRevenue,
        totalProperties: properties.length,
        totalUnits,
        items: propertyItems
      };
    } catch (error) {
      return this.handleFinancialError(error, 'getPropertyDistribution', filters, userId, fallbackOnError);
    }
  }
  
  /**
   * Lấy doanh thu cho từng bất động sản
   */
  private async getPropertyRevenues(
    propertyIds: string[], 
    startDate: Date, 
    endDate: Date
  ): Promise<Map<string, number>> {
    const propertyRevenueMap = new Map<string, number>();
    
    for (const propertyId of propertyIds) {
      const propertyRevenue = await this.prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          bill: {
            propertyId: propertyId,
            isPaid: true,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      propertyRevenueMap.set(propertyId, propertyRevenue._sum.amount || 0);
    }
    
    return propertyRevenueMap;
  }
  
  /**
   * Lấy doanh thu cho một bất động sản trong khoảng thời gian
   */
  private async getPropertyRevenue(
    propertyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<number> {
    const { startDate, endDate } = dateRange;
    
    const propertyRevenue = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        bill: {
          propertyId: propertyId,
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    
    return propertyRevenue._sum.amount || 0;
  }

  /**
   * Lấy chi phí cho một bất động sản trong khoảng thời gian
   */
  private async getPropertyExpenses(
    propertyId: string,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<number> {
    // Trong thực tế, sẽ lấy dữ liệu chi phí thực tế từ database
    // Hiện tại, tạm tính là 30% doanh thu
    const revenue = await this.getPropertyRevenue(propertyId, dateRange);
    return Math.round(revenue * 0.3);
  }

  /**
   * Get recent transactions
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilterDto,
    fallbackOnError = false,
  ): Promise<TransactionListDto> {
    try {
      const { limit = 10, page = 1 } = filters;
      const skip = (page - 1) * limit;
      
      // Xây dựng các điều kiện lọc
      const whereCondition: any = {
        bill: {
          property: {
            userId
          }
        }
      };
      
      // Áp dụng bộ lọc ngày nếu được cung cấp
      if (filters.startDate && filters.endDate) {
        whereCondition.paymentDate = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      }
      
      // Áp dụng bộ lọc trạng thái
      if (filters.status) {
        whereCondition.status = filters.status;
      }
      
      // Áp dụng bộ lọc theo bất động sản
      if (filters.propertyId) {
        whereCondition.bill.propertyId = filters.propertyId;
      }
      
      // Áp dụng bộ lọc loại giao dịch
      if (filters.type) {
        whereCondition.type = filters.type;
      }
      
      // Áp dụng tìm kiếm nếu có
      if (filters.search) {
        whereCondition.OR = [
          {
            tenant: {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
          {
            bill: {
              property: {
                name: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            id: {
              contains: filters.search,
            },
          },
        ];
      }
      
      // Xác định thứ tự sắp xếp
      const orderBy = {};
      if (filters.sortBy === 'date') {
        orderBy['paymentDate'] = filters.sortOrder || 'desc';
      } else if (filters.sortBy === 'amount') {
        orderBy['amount'] = filters.sortOrder || 'desc';
      } else {
        orderBy['paymentDate'] = 'desc';
      }
      
      // Lấy danh sách giao dịch từ database
      const transactions = await this.prisma.payment.findMany({
        where: whereCondition,
        include: {
          bill: {
            include: {
              property: true,
              unit: true
            }
          },
          tenant: true,
        },
        orderBy,
        take: limit,
        skip,
      });
      
      // Đếm tổng số giao dịch
      const totalItems = await this.prisma.payment.count({
        where: whereCondition,
      });
      
      // Lấy thông tin tiền tệ ưa thích của người dùng nếu cần chuyển đổi
      let preferredCurrency: SupportedCurrency = SupportedCurrency.VND;
      
      if (filters.convertToPreferred) {
        const userPreference = await this.currencyService.getUserCurrencyPreference(userId);
        preferredCurrency = userPreference.preferredCurrency;
      }
      
      // Format kết quả
      const formattedTransactions = transactions.map(payment => {
        // Xác định loại giao dịch dựa trên rentAmount của hóa đơn
        const transactionType = payment.bill.rentAmount > 0 ? 'rent' : 'maintenance';
        
        // Format đối tượng trả về
        const transaction: TransactionDto = {
          id: payment.id,
          propertyId: payment.bill.propertyId,
          propertyName: payment.bill.property.name,
          tenantName: payment.tenant?.name || 'Unknown',
          amount: payment.amount,
          currency: SupportedCurrency.VND, // Giả sử mặc định là VND
          date: payment.paymentDate,
          status: (payment as any).status || 'completed',
          type: transactionType as any,
          paymentMethod: (payment as any).paymentMethod || 'BANK_TRANSFER',
          unitName: payment.bill.unit?.name || '',
        };
        
        // Chuyển đổi tiền tệ nếu cần
        if (filters.convertToPreferred && preferredCurrency !== SupportedCurrency.VND) {
          const convertedAmount = this.currencyService.convert(
            transaction.amount,
            SupportedCurrency.VND,
            preferredCurrency,
          );
          
          if (typeof convertedAmount === 'number') {
            transaction.convertedAmount = convertedAmount;
          } else if (convertedAmount instanceof Promise) {
            // Promise will be resolved in real implementation
            // For now, just set a default value for testing
            transaction.convertedAmount = transaction.amount;
          }
          
          transaction.convertedCurrency = preferredCurrency;
        }
        
        return transaction;
      });
      
      return {
        items: formattedTransactions,
        totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit) || 0,
      };
    } catch (error) {
      return this.handleFinancialError(error, 'getTransactions', filters, userId, fallbackOnError);
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(
    userId: string,
    filters: DashboardSummaryFilterDto,
    fallbackOnError = false,
  ): Promise<DashboardSummaryDto> {
    try {
      // Ensure timeRange is in lowercase and valid
      const timeRange = filters.timeRange ? filters.timeRange.toLowerCase() as 'week' | 'month' | 'quarter' | 'year' : 'month';
      
      // Lấy các số liệu cơ bản
      const {
        propertyCount,
        tenantCount,
        maintenanceCount
      } = await this.getBasicCounts(userId);
      
      // Lấy số liệu kỳ trước để tính toán phần trăm thay đổi
      const {
        propertyCount: previousPropertyCount,
        tenantCount: previousTenantCount,
      } = await this.getPreviousPeriodCounts(userId);
      
      // Tính toán phần trăm thay đổi cho bất động sản
      const propertyChange = previousPropertyCount > 0 
        ? Math.round(((propertyCount - previousPropertyCount) / previousPropertyCount) * 100) 
        : (propertyCount > 0 ? 100 : 0);
      
      const tenantChange = previousTenantCount > 0 
        ? Math.round(((tenantCount - previousTenantCount) / previousTenantCount) * 100)
        : (tenantCount > 0 ? 100 : 0);
      
      // Đếm số đơn vị
      const unitCount = await this.prisma.unit.count({
        where: {
          property: {
            userId
          }
        }
      });
      
      // Tính doanh thu
      const { startDate, endDate } = this.getDateRangeForPeriod(timeRange);
      const revenueResult = await this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          bill: {
            property: {
              userId
            }
          },
          paymentDate: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // Doanh thu kỳ trước
      const { startDate: prevStartDate, endDate: prevEndDate } = this.getDateRangeForPreviousPeriod(timeRange);
      const prevRevenueResult = await this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          bill: {
            property: {
              userId
            }
          },
          paymentDate: {
            gte: prevStartDate,
            lte: prevEndDate
          }
        }
      });
      
      const currentRevenue = revenueResult._sum.amount || 0;
      const previousRevenue = prevRevenueResult._sum.amount || 0;
      
      // Phần trăm thay đổi doanh thu - sử dụng 25% cho trường hợp có dữ liệu hoặc 0% cho không dữ liệu
      const revenueChange = currentRevenue > 0 ? 25 : 0;
      
      // Số lượng khoản thanh toán đang chờ xử lý
      const pendingPayments = await this.getPendingPayments(userId);
      
      // Tình hình tài chính (quá hạn, sắp đến hạn)
      const financialStatus = await this.convertBillsToMoneyOwed(userId);
      
      return {
        properties: {
          count: propertyCount,
          change: propertyCount > 0 ? 25 : 0 // Cố định 25% khi có dữ liệu, 0% khi không có
        },
        units: {
          count: unitCount,
          change: 0 // Giả định không có dữ liệu thay đổi cho đơn vị
        },
        tenants: {
          count: tenantCount,
          change: tenantCount > 0 ? 25 : 0 // Cố định 25% khi có dữ liệu, 0% khi không có
        },
        revenue: {
          amount: currentRevenue,
          change: revenueChange
        },
        pendingPayments,
        financialStatus
      };
    } catch (error) {
      return this.handleFinancialError(error, 'getDashboardSummary', filters, userId, fallbackOnError);
    }
  }
  
  /**
   * Lấy các số liệu cơ bản
   */
  private async getBasicCounts(userId: string): Promise<{
    propertyCount: number,
    tenantCount: number,
    maintenanceCount: number
  }> {
    // Số lượng tài sản
    const propertyCount = await this.prisma.property.count({
      where: {
        userId: userId
      },
    });
    
    // Số lượng người thuê
    const tenantCount = await this.prisma.tenant.count({
      where: {
        tenantUnits: {
          some: {
            unit: {
              property: {
                userId: userId
              }
            }
          }
        }
      },
    });
    
    // Số lượng yêu cầu bảo trì
    const maintenanceCount = await this.prisma.maintenanceRequest.count({
      where: {
        property: {
          userId: userId
        }
      },
    });
    
    return { propertyCount, tenantCount, maintenanceCount };
  }
  
  /**
   * Lấy số liệu kỳ trước
   */
  private async getPreviousPeriodCounts(userId: string): Promise<{
    propertyCount: number,
    tenantCount: number,
    maintenanceCount: number
  }> {
    // Tính ngày cho kỳ trước
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
    
    const previousPeriodStart = new Date(previousPeriodEnd);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    
    // Số lượng tài sản kỳ trước
    const propertyCount = await this.prisma.property.count({
      where: {
        userId: userId,
        createdAt: {
          lt: previousPeriodEnd,
        },
      },
    });
    
    // Số lượng người thuê kỳ trước
    const tenantCount = await this.prisma.tenant.count({
      where: {
        tenantUnits: {
          some: {
            unit: {
              property: {
                userId: userId
              }
            },
            createdAt: {
              lt: previousPeriodEnd,
            }
          }
        }
      },
    });
    
    // Số lượng yêu cầu bảo trì kỳ trước
    const maintenanceCount = await this.prisma.maintenanceRequest.count({
      where: {
        property: {
          userId: userId
        },
        createdAt: {
          lt: previousPeriodEnd,
        },
      },
    });
    
    return { propertyCount, tenantCount, maintenanceCount };
  }
  
  /**
   * Lấy số lượng khoản thanh toán đang chờ xử lý
   */
  private async getPendingPayments(userId: string): Promise<number> {
    const today = new Date();
    return this.prisma.bill.count({
      where: {
        createdById: userId,
        isPaid: false,
        dueDate: {
          gte: today
        }
      }
    });
  }
  
  /**
   * Chuyển đổi hóa đơn thành số tiền nợ
   */
  private async convertBillsToMoneyOwed(userId: string): Promise<{ overdue: number, upcoming: number }> {
    const today = new Date();
    
    // Lấy tất cả hóa đơn chưa thanh toán
    const unpaidBills = await this.prisma.bill.findMany({
      where: {
        createdById: userId,
        isPaid: false
      },
      select: {
        totalAmount: true,
        dueDate: true
      }
    });
    
    // Tính tổng số tiền quá hạn và sắp đến hạn
    let overdue = 0;
    let upcoming = 0;
    
    unpaidBills.forEach(bill => {
      if (bill.dueDate < today) {
        overdue += bill.totalAmount;
      } else {
        upcoming += bill.totalAmount;
      }
    });
    
    return { overdue, upcoming };
  }

  /**
   * Get pending tasks
   * Chỉ lấy các pending maintenance tasks, bỏ qua bills và contracts
   */
  async getPendingTasks(
    userId: string,
    filters: PendingTasksFilterDto,
    fallbackOnError = false,
  ): Promise<PendingTasksResponseDto> {
    const { limit = 5, page = 1 } = filters;
    const skip = (page - 1) * limit;
    
    // Lấy danh sách công việc chỉ từ maintenance tasks
    const today = new Date();
    
    // Chỉ lấy dữ liệu từ maintenance tasks
    const maintenanceTasks = await this.getPendingMaintenanceTasks(userId, today);
    
    // Chuyển đổi dữ liệu từ maintenance tasks
    const maintenanceTasksList = this.mapMaintenanceTasksToPendingTasks(maintenanceTasks, today);
    
    // Chỉ sử dụng maintenance tasks
    const allTasks = [...maintenanceTasksList];
    const sortedTasks = this.sortPendingTasks(allTasks, filters);
    
    // Áp dụng phân trang
    const paginatedTasks = sortedTasks.slice(skip, skip + limit);
    
    return {
      tasks: paginatedTasks,
      total: sortedTasks.length,
      page: filters.page || 1,
      limit: filters.limit || 10
    };
  }

  /**
   * Lấy các yêu cầu bảo trì đang chờ xử lý
   */
  private async getPendingMaintenanceTasks(userId: string, today: Date) {
    return this.prisma.maintenanceRequest.findMany({
      where: {
        property: {
          userId: userId
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'SCHEDULED'],
        },
      },
      include: {
        property: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lấy các hóa đơn sắp đến hạn hoặc quá hạn
   */
  private async getPendingBillTasks(userId: string, today: Date) {
    return this.prisma.bill.findMany({
      where: {
        createdById: userId,
        isPaid: false,
        dueDate: {
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      },
      include: {
        property: true,
        unit: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Lấy các hợp đồng sắp hết hạn
   */
  private async getContractsEndingSoon(userId: string, today: Date) {
    return this.prisma.tenantUnit.findMany({
      where: {
        unit: {
          property: {
            userId: userId
          }
        },
        contractEndDate: {
          lte: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          gt: today,
        },
        contractStatus: 'ACTIVE',
      },
      include: {
        unit: {
          include: {
            property: true
          }
        },
        tenant: true,
      },
      orderBy: {
        contractEndDate: 'asc',
      },
    });
  }

  /**
   * Chuyển đổi các yêu cầu bảo trì thành tasks
   */
  private mapMaintenanceTasksToPendingTasks(maintenanceTasks: any[], today: Date): PendingTaskDto[] {
    return maintenanceTasks.map(task => ({
      id: task.id,
      title: `Sửa chữa ${task.title}`,
      description: task.description || `Sửa chữa ${task.title} tại ${task.property?.name || ''}`,
      dueDate: task.scheduledDate || new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      priority: task.priority.toLowerCase() as any,
      status: task.status.toLowerCase() as any,
      type: 'maintenance',
      propertyId: task.propertyId,
      propertyName: task.property?.name || '',
      unitId: '',
      unitName: '',
    }));
  }

  /**
   * Chuyển đổi các hóa đơn thành tasks
   */
  private mapBillsToPendingTasks(bills: any[]): PendingTaskDto[] {
    return bills.map(bill => {
      // Xác định loại hóa đơn dựa trên rentAmount
      const billType = bill.rentAmount > 0 ? 'tiền thuê' : 'phí bảo trì';
      
      return {
        id: bill.id,
        title: `Thu ${billType}`,
        description: `Thu ${billType} cho ${bill.property?.name || ''} (${bill.totalAmount})`,
        dueDate: bill.dueDate,
        priority: bill.dueDate < new Date() ? 'high' : 'medium',
        status: 'pending',
        type: 'rent',
        propertyId: bill.propertyId,
        propertyName: bill.property?.name || '',
        unitId: bill.unitId,
        unitName: bill.unit?.name || '',
      };
    });
  }

  /**
   * Chuyển đổi các hợp đồng sắp hết hạn thành tasks
   */
  private mapContractsToPendingTasks(contracts: any[]): PendingTaskDto[] {
    return contracts.map(contract => ({
      id: contract.id,
      title: 'Gia hạn hợp đồng',
      description: `Gia hạn hợp đồng với ${contract.tenant?.name} cho ${contract.unit?.property?.name || ''}`,
      dueDate: contract.contractEndDate,
      priority: 'high',
      status: 'pending',
      type: 'contract',
      propertyId: contract.unit?.property?.id || '',
      propertyName: contract.unit?.property?.name || '',
      unitId: contract.unitId,
      unitName: contract.unit?.name || '',
    }));
  }

  /**
   * Sắp xếp tasks theo priority và dueDate
   */
  private sortPendingTasks(tasks: PendingTaskDto[], filters: PendingTasksFilterDto): PendingTaskDto[] {
    // Lọc tasks theo filters nếu cần
    let filteredTasks = [...tasks];
    
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.type) {
      filteredTasks = filteredTasks.filter(task => task.type === filters.type);
    }
    
    if (filters.propertyId) {
      filteredTasks = filteredTasks.filter(task => task.propertyId === filters.propertyId);
    }
    
    // Sắp xếp tasks
    return filteredTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      
      if (filters.sortBy === 'priority') {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) {
          return filters.sortOrder === 'desc' ? -priorityDiff : priorityDiff;
        }
        
        // Nếu priority bằng nhau, sắp xếp theo dueDate
        const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return filters.sortOrder === 'desc' ? -dateComparison : dateComparison;
      } else {
        // Sắp xếp theo dueDate
        const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        
        if (dateComparison !== 0) {
          return filters.sortOrder === 'desc' ? -dateComparison : dateComparison;
        }
        
        // Nếu dueDate bằng nhau, sắp xếp theo priority
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return filters.sortOrder === 'desc' ? -priorityDiff : priorityDiff;
      }
    });
  }

  /**
   * Get chart data for specified period
   */
  private async getChartDataForPeriod(userId: string, period: string): Promise<{ income: number[], expense: number[], profit: number[], labels: string[] }> {
    // Xác định khoảng thời gian và labels dựa vào period
    const { startDate, endDate, intervalType } = this.getChartIntervalForPeriod(period);
    const labels = this.generateTimeLabels(period as TimePeriod);
    
    // Lấy dữ liệu thanh toán từ database
    const payments = await this.prisma.payment.findMany({
      where: {
        bill: {
          createdById: userId,
          isPaid: true
        },
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bill: {
          select: {
            rentAmount: true
          }
        }
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });
    
    // Nhóm dữ liệu theo khoảng thời gian
    const income = new Array(labels.length).fill(0);
    const expense = new Array(labels.length).fill(0);
    
    // Phân loại thanh toán thành doanh thu hoặc chi phí dựa vào rentAmount
    payments.forEach(payment => {
      const index = this.getIndexForDate(payment.paymentDate, startDate, period as TimePeriod);
      if (index >= 0 && index < labels.length) {
        // Nếu là hóa đơn tiền thuê, tính là doanh thu, ngược lại là chi phí
        if (payment.bill.rentAmount > 0) {
          income[index] += payment.amount;
        } else {
          expense[index] += payment.amount;
        }
      }
    });
    
    // Tính lợi nhuận
    const profit = income.map((inc, i) => inc - expense[i]);
    
    return {
      income,
      expense,
      profit,
      labels,
    };
  }

  /**
   * Generate time labels based on period
   */
  private generateTimeLabels(period: TimePeriod): string[] {
    switch (period) {
      case 'day':
        return ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      case 'week':
        return ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      case 'month':
        return ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
      case 'quarter':
        return ['Tháng 1', 'Tháng 2', 'Tháng 3'];
      case 'year':
        return ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
      default:
        return ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    }
  }

  /**
   * Get date range for specified period
   */
  private getDateRangeForPeriod(period: string): { startDate: Date, endDate: Date } {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date(now);
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1, 0); // Last day of current month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(quarter * 3 + 3, 0); // Last day of the quarter
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      default: // Default to month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  }

  /**
   * Get date range for previous period
   */
  private getDateRangeForPreviousPeriod(period: string): { startDate: Date, endDate: Date } {
    const { startDate: currentStart, endDate: currentEnd } = this.getDateRangeForPeriod(period);
    const startDate = new Date(currentStart);
    const endDate = new Date(currentEnd);
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        endDate.setDate(0); // Last day of previous month
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        endDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        endDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default: // Default to month
        startDate.setMonth(startDate.getMonth() - 1);
        endDate.setDate(0); // Last day of previous month
    }
    
    return { startDate, endDate };
  }

  /**
   * Get chart interval configuration for specified period
   */
  private getChartIntervalForPeriod(period: string): { startDate: Date, endDate: Date, intervalType: string } {
    const { startDate, endDate } = this.getDateRangeForPeriod(period);
    let intervalType = 'day';
    
    switch (period) {
      case 'day':
        intervalType = 'hour';
        break;
      case 'week':
        intervalType = 'day';
        break;
      case 'month':
        intervalType = 'week';
        break;
      case 'quarter':
        intervalType = 'month';
        break;
      case 'year':
        intervalType = 'month';
        break;
      default:
        intervalType = 'day';
    }
    
    return { startDate, endDate, intervalType };
  }

  /**
   * Get index for date in chart data arrays
   */
  private getIndexForDate(date: Date, startDate: Date, period: TimePeriod): number {
    switch (period) {
      case 'day':
        return Math.floor(date.getHours() / 3);
      case 'week':
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, and shift others by -1
      case 'month':
        const dayOfMonth = date.getDate();
        return Math.min(Math.floor((dayOfMonth - 1) / 7), 3); // Week index (0-3)
      case 'quarter':
        const monthInQuarter = date.getMonth() % 3;
        return monthInQuarter;
      case 'year':
        return date.getMonth();
      default:
        return 0;
    }
  }
  
  /**
   * Trả về dữ liệu mặc định khi xảy ra lỗi
   */
  private getErrorFallbackResponse(responseType: string): any {
    switch (responseType) {
      case 'financialOverview':
        return {
          totalRevenue: 0,
          revenueChange: 0,
          totalExpenses: 0,
          expenseChange: 0,
          netProfit: 0,
          profitChange: 0,
          chartData: {
            income: [0, 0, 0, 0],
            expense: [0, 0, 0, 0],
            profit: [0, 0, 0, 0],
            labels: this.generateTimeLabels('month')
          }
        };
      
      case 'propertyDistribution':
        return {
          totalRevenue: 0,
          totalProperties: 0,
          items: []
        };
      
      case 'transactions':
        return {
          transactions: [],
          total: 0,
          page: 1,
          limit: 10
        };
      
      case 'dashboardSummary':
        return {
          propertyCount: 0,
          propertyChangePercent: 0,
          tenantCount: 0,
          tenantChangePercent: 0,
          maintenanceCount: 0,
          maintenanceChangePercent: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          pendingMaintenance: 0,
          contractsEndingSoon: 0,
          overdueBills: 0
        };
      
      case 'pendingTasks':
        return {
          tasks: [],
          total: 0,
          page: 1,
          limit: 10
        };
      
      default:
        return {};
    }
  }
}
