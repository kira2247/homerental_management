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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới yêu cầu bảo trì' })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu bảo trì thành công' })
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu bảo trì có phân trang và lọc' })
  findAll(@Query() query: QueryMaintenanceDto) {
    return this.maintenanceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một yêu cầu bảo trì' })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu bảo trì' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu bảo trì theo bất động sản' })
  @ApiParam({ name: 'propertyId', description: 'ID của bất động sản' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() query: QueryMaintenanceDto,
  ) {
    return this.maintenanceService.findByProperty(propertyId, query);
  }

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu bảo trì theo unit' })
  @ApiParam({ name: 'unitId', description: 'ID của unit' })
  findByUnit(
    @Param('unitId') unitId: string,
    @Query() query: QueryMaintenanceDto,
  ) {
    return this.maintenanceService.findByUnit(unitId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin yêu cầu bảo trì' })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu bảo trì' })
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa một yêu cầu bảo trì' })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu bảo trì' })
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(id);
  }
} 