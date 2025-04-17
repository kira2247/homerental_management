import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import {
  CreateTenantDto,
  CreateTenantUnitDto,
  QueryTenantDto,
  UpdateTenantDto,
} from './dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo người thuê mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo người thuê mới thành công',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ hoặc người thuê đã tồn tại',
  })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người thuê' })
  findAll(@Query() queryDto: QueryTenantDto) {
    return this.tenantService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người thuê' })
  @ApiParam({ name: 'id', description: 'ID của người thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thông tin chi tiết người thuê',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người thuê',
  })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người thuê' })
  @ApiParam({ name: 'id', description: 'ID của người thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin người thuê thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người thuê',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa người thuê' })
  @ApiParam({ name: 'id', description: 'ID của người thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa người thuê thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người thuê',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Không thể xóa người thuê đang có hợp đồng thuê',
  })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Gán người thuê vào đơn vị cho thuê' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Gán người thuê vào đơn vị cho thuê thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người thuê hoặc đơn vị cho thuê',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Không thể gán người thuê vào đơn vị cho thuê này',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền gán người thuê vào đơn vị cho thuê này',
  })
  assignTenantToUnit(
    @Body() createTenantUnitDto: CreateTenantUnitDto,
    @Req() req,
  ) {
    return this.tenantService.assignTenantToUnit(
      createTenantUnitDto,
      req.user.id,
    );
  }

  @Post('end-tenancy/:tenantUnitId')
  @ApiOperation({ summary: 'Kết thúc hợp đồng thuê' })
  @ApiParam({ name: 'tenantUnitId', description: 'ID của hợp đồng thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kết thúc hợp đồng thuê thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hợp đồng thuê',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Hợp đồng thuê này đã kết thúc trước đó',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền kết thúc hợp đồng thuê này',
  })
  endTenancy(@Param('tenantUnitId') tenantUnitId: string, @Req() req) {
    return this.tenantService.endTenancy(tenantUnitId, req.user.id);
  }

  @Get('by-unit/:unitId')
  @ApiOperation({ summary: 'Lấy danh sách người thuê đang thuê một đơn vị' })
  @ApiParam({ name: 'unitId', description: 'ID của đơn vị cho thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách người thuê',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn vị cho thuê',
  })
  getTenantsByUnit(@Param('unitId') unitId: string) {
    return this.tenantService.getTenantsByUnit(unitId);
  }

  @Get(':id/units')
  @ApiOperation({ summary: 'Lấy danh sách đơn vị đang được thuê bởi một người thuê' })
  @ApiParam({ name: 'id', description: 'ID của người thuê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách đơn vị cho thuê',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người thuê',
  })
  getUnitsByTenant(@Param('id') id: string) {
    return this.tenantService.getUnitsByTenant(id);
  }
}
