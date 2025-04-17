import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { BillService } from './bill.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateBillDto, UpdateBillDto } from './dto';
import { BillFilterDto } from './dto/bill-filter.dto';

@ApiTags('Hóa đơn')
@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hóa đơn mới', description: 'Tạo hóa đơn mới với thông tin chi tiết về đơn vị, dịch vụ và số tiền' })
  @ApiResponse({ status: 201, description: 'Hóa đơn đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn vị cho thuê' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  create(@Req() req, @Body() createBillDto: CreateBillDto) {
    return this.billService.create(req.user.id, createBillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn với phân trang và lọc', description: 'Trả về danh sách hóa đơn với các tùy chọn phân trang và lọc theo nhiều tiêu chí' })
  @ApiResponse({ status: 200, description: 'Danh sách hóa đơn được trả về thành công' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi trên mỗi trang' })
  @ApiQuery({ name: 'propertyId', required: false, description: 'Lọc theo ID của bất động sản' })
  @ApiQuery({ name: 'unitId', required: false, description: 'Lọc theo ID của đơn vị cho thuê' })
  @ApiQuery({ name: 'isPaid', required: false, description: 'Lọc theo trạng thái thanh toán' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Lọc từ ngày (định dạng YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Lọc đến ngày (định dạng YYYY-MM-DD)' })
  findAll(@Req() req, @Query() filter: BillFilterDto) {
    return this.billService.findAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một hóa đơn', description: 'Trả về thông tin chi tiết của một hóa đơn dựa trên ID' })
  @ApiResponse({ status: 200, description: 'Thông tin hóa đơn được trả về thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiParam({ name: 'id', description: 'ID của hóa đơn' })
  findOne(@Req() req, @Param('id') id: string) {
    return this.billService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hóa đơn', description: 'Cập nhật thông tin của một hóa đơn dựa trên ID' })
  @ApiResponse({ status: 200, description: 'Hóa đơn đã được cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiParam({ name: 'id', description: 'ID của hóa đơn' })
  update(@Req() req, @Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billService.update(req.user.id, id, updateBillDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một hóa đơn', description: 'Xóa một hóa đơn dựa trên ID' })
  @ApiResponse({ status: 200, description: 'Hóa đơn đã được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hóa đơn' })
  @ApiResponse({ status: 400, description: 'Không thể xóa hóa đơn (đã thanh toán hoặc có ràng buộc)' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  @ApiParam({ name: 'id', description: 'ID của hóa đơn' })
  remove(@Req() req, @Param('id') id: string) {
    return this.billService.remove(req.user.id, id);
  }
} 