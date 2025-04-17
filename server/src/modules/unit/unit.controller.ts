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
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto, QueryUnitDto, UpdateUnitDto } from './dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse as SwaggerApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('units')
@Controller('units')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Tạo đơn vị cho thuê mới',
    description: 'Tạo một đơn vị cho thuê mới trong bất động sản đã có' 
  })
  @SwaggerApiResponse({ status: 201, description: 'Đơn vị cho thuê đã được tạo thành công' })
  @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @SwaggerApiResponse({ status: 403, description: 'Không có quyền tạo đơn vị trong bất động sản này' })
  create(@Body() createUnitDto: CreateUnitDto, @Req() req) {
    return this.unitService.create(createUnitDto, req.user.id);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách đơn vị cho thuê với bộ lọc',
    description: 'Trả về danh sách đơn vị cho thuê với các tùy chọn lọc và phân trang'
  })
  @SwaggerApiResponse({ status: 200, description: 'Danh sách đơn vị cho thuê được trả về thành công' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi trên mỗi trang' })
  @ApiQuery({ name: 'propertyId', required: false, description: 'Lọc theo ID bất động sản' })
  @ApiQuery({ name: 'status', required: false, enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'], description: 'Lọc theo trạng thái đơn vị' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Giá thấp nhất' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Giá cao nhất' })
  @ApiQuery({ name: 'minArea', required: false, description: 'Diện tích tối thiểu' })
  @ApiQuery({ name: 'maxArea', required: false, description: 'Diện tích tối đa' })
  findAll(@Query() queryDto: QueryUnitDto) {
    return this.unitService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy thông tin chi tiết một đơn vị cho thuê',
    description: 'Trả về thông tin chi tiết của một đơn vị cho thuê dựa trên ID'
  })
  @SwaggerApiResponse({ status: 200, description: 'Thông tin đơn vị cho thuê được trả về thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn vị cho thuê' })
  @ApiParam({ name: 'id', description: 'ID của đơn vị cho thuê' })
  findOne(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin đơn vị cho thuê',
    description: 'Cập nhật thông tin của một đơn vị cho thuê dựa trên ID'
  })
  @SwaggerApiResponse({ status: 200, description: 'Đơn vị cho thuê đã được cập nhật thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn vị cho thuê' })
  @SwaggerApiResponse({ status: 403, description: 'Không có quyền chỉnh sửa đơn vị cho thuê này' })
  @SwaggerApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiParam({ name: 'id', description: 'ID của đơn vị cho thuê' })
  update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
    @Req() req,
  ) {
    return this.unitService.update(id, updateUnitDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa đơn vị cho thuê',
    description: 'Xóa một đơn vị cho thuê dựa trên ID. Các liên kết với người thuê và dữ liệu liên quan sẽ được gỡ bỏ tự động.'
  })
  @SwaggerApiResponse({ status: 200, description: 'Đơn vị cho thuê đã được xóa thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn vị cho thuê' })
  @SwaggerApiResponse({ status: 403, description: 'Không có quyền xóa đơn vị cho thuê này' })
  @SwaggerApiResponse({ status: 400, description: 'Có lỗi xảy ra khi xóa đơn vị cho thuê' })
  @ApiParam({ name: 'id', description: 'ID của đơn vị cho thuê' })
  remove(@Param('id') id: string, @Req() req) {
    return this.unitService.remove(id, req.user.id);
  }

  @Get('property/:propertyId')
  @ApiOperation({ 
    summary: 'Lấy danh sách đơn vị cho thuê của một bất động sản',
    description: 'Trả về danh sách các đơn vị cho thuê trong một bất động sản với các tùy chọn lọc và phân trang'
  })
  @SwaggerApiResponse({ status: 200, description: 'Danh sách đơn vị cho thuê được trả về thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @SwaggerApiResponse({ status: 403, description: 'Không có quyền xem thông tin bất động sản này' })
  @ApiParam({ name: 'propertyId', description: 'ID của bất động sản' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng bản ghi trên mỗi trang' })
  @ApiQuery({ name: 'status', required: false, enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'], description: 'Lọc theo trạng thái đơn vị' })
  getUnitsByPropertyId(
    @Param('propertyId') propertyId: string, 
    @Query() queryDto: QueryUnitDto,
    @Req() req
  ) {
    return this.unitService.getUnitsByPropertyId(propertyId, queryDto, req.user.id);
  }

  @Get('property/:propertyId/vacant')
  @ApiOperation({ 
    summary: 'Lấy danh sách đơn vị cho thuê còn trống của một bất động sản',
    description: 'Trả về danh sách các đơn vị cho thuê còn trống (status=VACANT) trong một bất động sản'
  })
  @SwaggerApiResponse({ status: 200, description: 'Danh sách đơn vị cho thuê trống được trả về thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @SwaggerApiResponse({ status: 403, description: 'Không có quyền xem thông tin bất động sản này' })
  @ApiParam({ name: 'propertyId', description: 'ID của bất động sản' })
  getVacantUnits(@Param('propertyId') propertyId: string, @Req() req) {
    return this.unitService.getVacantUnits(propertyId, req.user.id);
  }

  @Get(':id/summary')
  @ApiOperation({ 
    summary: 'Lấy tóm tắt thông tin đơn vị cho thuê',
    description: 'Trả về thông tin tóm tắt về đơn vị cho thuê, bao gồm trạng thái hiện tại và thông tin người thuê nếu có'
  })
  @SwaggerApiResponse({ status: 200, description: 'Thông tin tóm tắt được trả về thành công' })
  @SwaggerApiResponse({ status: 404, description: 'Không tìm thấy đơn vị cho thuê' })
  @ApiParam({ name: 'id', description: 'ID của đơn vị cho thuê' })
  getUnitSummary(@Param('id') id: string) {
    return this.unitService.getUnitSummary(id);
  }
}
