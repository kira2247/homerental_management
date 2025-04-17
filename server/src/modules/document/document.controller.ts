import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentType } from '@prisma/client';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới tài liệu' })
  @ApiResponse({ status: 201, description: 'Tài liệu đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  create(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentService.create(createDocumentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tài liệu với các bộ lọc' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  findAll(@Query() queryDto: QueryDocumentDto) {
    return this.documentService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin một tài liệu theo ID' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  @ApiResponse({ status: 200, description: 'Thông tin tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  @ApiResponse({ status: 200, description: 'Tài liệu đã được cập nhật' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  @ApiResponse({ status: 200, description: 'Tài liệu đã được xóa' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tài liệu' })
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo người thuê' })
  @ApiParam({ name: 'tenantId', description: 'ID của người thuê' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người thuê' })
  findByTenant(
    @Param('tenantId') tenantId: string,
    @Query() queryDto: QueryDocumentDto,
  ) {
    return this.documentService.findByTenant(tenantId, queryDto);
  }

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo căn hộ/phòng' })
  @ApiParam({ name: 'unitId', description: 'ID của căn hộ/phòng' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy căn hộ/phòng' })
  findByUnit(
    @Param('unitId') unitId: string,
    @Query() queryDto: QueryDocumentDto,
  ) {
    return this.documentService.findByUnit(unitId, queryDto);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo bất động sản' })
  @ApiParam({ name: 'propertyId', description: 'ID của bất động sản' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  findByProperty(
    @Param('propertyId') propertyId: string,
    @Query() queryDto: QueryDocumentDto,
  ) {
    return this.documentService.findByProperty(propertyId, queryDto);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo phương tiện' })
  @ApiParam({ name: 'vehicleId', description: 'ID của phương tiện' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phương tiện' })
  findByVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query() queryDto: QueryDocumentDto,
  ) {
    return this.documentService.findByVehicle(vehicleId, queryDto);
  }

  @Get('maintenance/:maintenanceId')
  @ApiOperation({ summary: 'Lấy danh sách tài liệu theo yêu cầu bảo trì' })
  @ApiParam({ name: 'maintenanceId', description: 'ID của yêu cầu bảo trì' })
  @ApiResponse({ status: 200, description: 'Danh sách tài liệu' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu bảo trì' })
  findByMaintenance(
    @Param('maintenanceId') maintenanceId: string,
    @Query() queryDto: QueryDocumentDto,
  ) {
    return this.documentService.findByMaintenance(maintenanceId, queryDto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Tạo mới tài liệu kèm upload file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        type: { type: 'string', enum: Object.values(DocumentType) },
        isImportant: { type: 'boolean' },
        description: { type: 'string' },
        expiryDate: { type: 'string', format: 'date-time' },
        contractDetails: { type: 'object' },
        tenantId: { type: 'string' },
        unitId: { type: 'string' },
        propertyId: { type: 'string' },
        vehicleId: { type: 'string' },
        maintenanceId: { type: 'string' },
        folderId: { type: 'string', description: 'ID của thư mục trên Cloudinary (tùy chọn)' },
      },
      required: ['file', 'name', 'type'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tài liệu đã được tạo thành công kèm file' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @UseInterceptors(FileInterceptor('file'))
  async createWithFile(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Query('folderId') folderId?: string
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }
    return this.documentService.createWithFile(createDocumentDto, file, req.user.id, folderId);
  }
} 