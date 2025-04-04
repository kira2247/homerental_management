import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { FinancialService } from './financial.service';
import { FinancialOverviewFilterDto } from '../dto/financial-overview.dto';
import { PropertyDistributionFilterDto } from '../dto/property-distribution.dto';
import { TransactionFilterDto } from '../dto/transaction.dto';
import { DashboardSummaryFilterDto } from '../dto/dashboard-summary.dto';
import { PendingTasksFilterDto } from '../dto/pending-tasks.dto';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

// Extend Express Request interface to include user
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('financial')
@Controller('financial')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  /**
   * Get financial overview
   */
  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan tài chính', description: 'Lấy thông tin tổng quan tài chính bao gồm doanh thu, chi phí, lợi nhuận và xu hướng' })
  @ApiResponse({ status: 200, description: 'Trả về dữ liệu tổng quan tài chính' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'], description: 'Khoảng thời gian thống kê' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Ngày bắt đầu (định dạng YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Ngày kết thúc (định dạng YYYY-MM-DD)' })
  @ApiQuery({ name: 'propertyId', required: false, type: String, description: 'ID của bất động sản (để lọc theo bất động sản)' })
  @ApiQuery({ name: 'compareWithPrevious', required: false, type: Boolean, description: 'So sánh với kỳ trước đó' })
  async getFinancialOverview(
    @Query() filters: FinancialOverviewFilterDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.financialService.getFinancialOverview(userId, filters);
  }

  /**
   * Get property distribution
   */
  @Get('property-distribution')
  @ApiOperation({ summary: 'Phân bổ tài chính theo bất động sản', description: 'Lấy thông tin phân bổ doanh thu/chi phí theo từng bất động sản' })
  @ApiResponse({ status: 200, description: 'Trả về dữ liệu phân bổ tài chính theo bất động sản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiQuery({ name: 'period', required: false, enum: ['month', 'quarter', 'year'], description: 'Khoảng thời gian thống kê' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Ngày bắt đầu (định dạng YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Ngày kết thúc (định dạng YYYY-MM-DD)' })
  async getPropertyDistribution(
    @Query() filters: PropertyDistributionFilterDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.financialService.getPropertyDistribution(userId, filters);
  }

  /**
   * Get recent transactions
   */
  @Get('transactions')
  @ApiOperation({ summary: 'Danh sách giao dịch', description: 'Lấy danh sách các giao dịch thu/chi gần đây' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách giao dịch' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mục trên mỗi trang (mặc định: 10)' })
  @ApiQuery({ name: 'propertyId', required: false, type: String, description: 'Lọc theo ID bất động sản' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'completed'], description: 'Trạng thái giao dịch' })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'], description: 'Loại giao dịch' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['date', 'amount'], description: 'Sắp xếp theo trường' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Thứ tự sắp xếp' })
  async getTransactions(
    @Query() filters: TransactionFilterDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.financialService.getTransactions(userId, filters);
  }

  /**
   * Get dashboard summary
   */
  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Tóm tắt bảng điều khiển', description: 'Lấy thông tin tóm tắt cho bảng điều khiển quản lý' })
  @ApiResponse({ status: 200, description: 'Trả về dữ liệu tóm tắt cho bảng điều khiển' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['week', 'month', 'quarter', 'year'], description: 'Khoảng thời gian thống kê' })
  async getDashboardSummary(
    @Query() filters: DashboardSummaryFilterDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.financialService.getDashboardSummary(userId, filters);
  }

  /**
   * Get pending tasks
   */
  @Get('pending-tasks')
  @ApiOperation({ summary: 'Danh sách công việc cần xử lý', description: 'Lấy danh sách các công việc cần xử lý như hóa đơn quá hạn, bảo trì đến hạn, hợp đồng sắp hết hạn' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách công việc cần xử lý' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mục trên mỗi trang (mặc định: 5)' })
  @ApiQuery({ name: 'type', required: false, enum: ['bill', 'maintenance', 'contract'], description: 'Loại công việc' })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high'], description: 'Độ ưu tiên' })
  @ApiQuery({ name: 'propertyId', required: false, type: String, description: 'Lọc theo ID bất động sản' })
  async getPendingTasks(
    @Query() filters: PendingTasksFilterDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user.id;
    return this.financialService.getPendingTasks(userId, filters);
  }
}
