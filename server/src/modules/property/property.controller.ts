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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { propertyLogger } from '../../common/logging';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { PropertyService } from './property.service';
import { CreatePropertyDto, UpdatePropertyDto, QueryPropertyDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly filesService: FilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới bất động sản' })
  @ApiResponse({ status: 201, description: 'Tạo mới thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Request() req: any,
  ) {
    
    // Kiểm tra thông tin user từ request
    if (!req.user || !req.user.id) {
      throw new BadRequestException('User authentication data is incomplete. Please contact support.');
    }
    
    // Nếu không có userId hoặc ownerId, sử dụng ID của người dùng hiện tại
    if (!createPropertyDto.userId) {
      createPropertyDto.userId = req.user.id;
    }
    
    if (!createPropertyDto.ownerId) {
      createPropertyDto.ownerId = req.user.id;
    }
    
    // Xác nhận một lần nữa rằng đã có userId và ownerId
    if (!createPropertyDto.userId || !createPropertyDto.ownerId) {
      throw new BadRequestException('Unable to create property with missing user information');
    }
    
    // Loại bỏ hoàn toàn logic xử lý thumbnail trong quá trình tạo property
    // Xóa trường thumbnail và thumbnailId nếu có trong DTO để đảm bảo không có dữ liệu thumbnail nào được gửi đi
    delete createPropertyDto.thumbnail;
    delete createPropertyDto.thumbnailId;
    
    // Create property (không có thumbnail)
    const result = await this.propertyService.create(createPropertyDto);
    propertyLogger.log('Property service returned result:');
    propertyLogger.log(`Success: ${result.success}`);
    
    // Sử dụng type guard với discriminated union
    if (result.success === true) {
      propertyLogger.log(`Property created successfully with ID: ${result.data.id}`);
      
      // Kiểm tra đầy đủ thông tin
      if (!result.data.id) {
        propertyLogger.warn('WARNING: Property service returned success but ID is missing!');
        
        // Trả về lỗi rõ ràng cho client
        return {
          success: false,
          error: {
            message: 'Đã tạo bất động sản nhưng không nhận được ID',
            code: 'MISSING_CREATED_ID'
          }
        };
      }
    } else {
      propertyLogger.warn(`Property service returned failure or no data: ${JSON.stringify(result)}`);
    }
    
    propertyLogger.log('=== PROPERTY CONTROLLER: CREATE PROPERTY END ===');
    
    // Trả về kết quả đầy đủ
    return result;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách bất động sản' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findAll(@Query() queryDto: QueryPropertyDto, @Request() req) {
    // Nếu không có ownerId trong query, sử dụng ID của người dùng hiện tại
    if (!queryDto.ownerId) {
      queryDto.ownerId = req.user.id;
    }
    
    return this.propertyService.findAll(queryDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản cần cập nhật' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  async update(
    @Param('id') id: string, 
    @Body('data') updatePropertyDtoString: string,
    @Request() req,
  ) {
    // Parse DTO từ string JSON
    let updatePropertyDto: UpdatePropertyDto;
    
    // Kiểm tra xem updatePropertyDtoString có tồn tại không
    if (!updatePropertyDtoString) {
      // Tạo một DTO rỗng để tránh lỗi
      updatePropertyDto = {} as UpdatePropertyDto;
    } else {
      try {
        updatePropertyDto = JSON.parse(updatePropertyDtoString);
      } catch (error) {
        throw new BadRequestException('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      }
    }
  
    propertyLogger.log(`=== PROPERTY CONTROLLER: FINDING PROPERTY ${id} ===`);
    // Kiểm tra property có tồn tại không
    const propertyResponse = await this.propertyService.findOne(id);
  
    if (!propertyResponse.success || !propertyResponse.data) {
      propertyLogger.warn(`Property not found or error: ${JSON.stringify(propertyResponse)}`);
      return propertyResponse; // Trả về lỗi không tìm thấy property
    }
  
    const property = propertyResponse.data;
    propertyLogger.debug(`Found property: ${property.id}`);
  
    // Gọi service để cập nhật property
    return this.propertyService.update(id, updatePropertyDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiParam({ name: 'force', description: 'Xóa bắt buộc kể cả có dữ liệu liên quan', required: false })
  @ApiResponse({ status: 200, description: 'Xóa thành công hoặc thông tin về dữ liệu liên quan' })
  @ApiResponse({ status: 204, description: 'Xóa thành công (không có nội dung trả về)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 400, description: 'Không thể xóa do còn dữ liệu liên quan' })
  @ApiResponse({ status: 409, description: 'Dữ liệu liên quan cần xóa bằng force=true' })
  async remove(
    @Param('id') id: string, 
    @Query('force') force?: string,
    @Request() req?
  ) {
    // Kiểm tra property trước khi xóa để lấy thông tin thumbnail
    const property = await this.propertyService.findOne(id); 

    if (property.success && property.data && property.data.thumbnailId) {
      
      try {
        // Xóa thumbnail trên Cloudinary
        await this.filesService.deleteFile(property.data.thumbnailId, 'cloudinary');

      } catch (error) {
        // Bỏ qua lỗi xóa thumbnail, vẫn tiếp tục xóa property
      }
    }
    
    // Chuyển đổi tham số force từ string sang boolean
    const forceDelete = force === 'true';
    
    // Tiến hành xóa property và các dữ liệu liên quan
    const result = await this.propertyService.remove(id, req.user.id, forceDelete);
    
    // Sử dụng type guard để kiểm tra response
    if (!result.success && 'error' in result) {  
      
      // Trả về status 409 Conflict nếu có dữ liệu liên quan
      if (result.error.code === 'PROPERTY_HAS_RELATED_DATA') {
        return result;
      }
      
      // Trả về status 400 với các lỗi khác
      return result;
    }
    
    // Chỉ trả về status 204 No Content khi xóa thành công (success = true)
    if (result.success) {      
      return result;
    }
    
    return result;
  }

  @Get(':id/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tóm tắt bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin tóm tắt thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getPropertySummary(@Param('id') id: string) {
    return this.propertyService.getPropertySummary(id);
  }

  @Post('thumbnail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chức năng này đã bị loại bỏ' })
  @ApiResponse({ status: 400, description: 'Chức năng này đã bị loại bỏ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async uploadNewThumbnail(
    @Request() req: any,
  ) {
    // Chức năng upload thumbnail trước khi tạo property đã bị loại bỏ
    propertyLogger.warn(`Attempt to use deprecated uploadNewThumbnail endpoint by user ${req.user?.id}`);
    
    throw new BadRequestException({
      success: false,
      message: 'Chức năng upload thumbnail trước khi tạo property đã bị loại bỏ',
      code: 'FEATURE_DEPRECATED'
    });
  }

  @Post(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload thumbnail cho bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiResponse({ status: 200, description: 'Upload thumbnail thành công' })
  @ApiResponse({ status: 400, description: 'File không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền upload' })
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpeg|png|webp)/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Request() req: any,
  ) {
    try {
      // Kiểm tra property có tồn tại không
      const propertyResponse = await this.propertyService.findOne(id);
      
      // Sử dụng type guard với discriminated union
      if (propertyResponse.success === false) {
        return {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: `Không tìm thấy bất động sản với ID: ${id}`,
            details: null
          }
        };
      }
      
      const property = propertyResponse.data;
      
      // Kiểm tra quyền (chỉ owner hoặc admin mới được upload)
      if (property.userId !== req.user.id && property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Bạn không có quyền upload thumbnail cho bất động sản này'
          }
        };
      }
      
      // Xóa thumbnail cũ nếu có
      if (property.thumbnailId) {
        try {
          propertyLogger.log(`Deleting old thumbnail for property ${id} with public_id: ${property.thumbnailId}`);
          await this.filesService.deleteFile(property.thumbnailId, 'cloudinary');
          propertyLogger.log(`Successfully deleted old thumbnail with public_id: ${property.thumbnailId}`);
        } catch (error) {
          // Chỉ log lỗi, không dừng quá trình upload
          propertyLogger.warn(`Failed to delete old thumbnail: ${error.message}`);
        }
      } else if (property.thumbnail && !property.thumbnail.includes('/images/default-property.jpg')) {
        // Nếu không có thumbnailId nhưng có thumbnail URL, thử xóa với public_id chuẩn
        try {
          const standardPublicId = `properties/${id}/thumbnail`;
          propertyLogger.log(`Attempting to delete old thumbnail with standard public_id: ${standardPublicId}`);
          await this.filesService.deleteFile(standardPublicId, 'cloudinary');
          propertyLogger.log(`Successfully deleted old thumbnail with standard public_id`);
        } catch (error) {
          // Chỉ log lỗi, không dừng quá trình upload
          propertyLogger.warn(`Failed to delete old thumbnail with standard public_id: ${error.message}`);
        }
      }
      
      // Upload thumbnail mới lên Cloudinary
      propertyLogger.log(`Uploading new thumbnail for property ${id}`);
      const uploadResult = await this.filesService.uploadFile(
        file, 
        'IMAGE', 
        `properties/${id}/thumbnail`
      );
      propertyLogger.log(`New thumbnail uploaded successfully: ${uploadResult.url}`);
      
      // Cập nhật URL thumbnail trong database
      const updateResult = await this.propertyService.updateThumbnail(id, uploadResult.url, req.user.id, uploadResult.publicId);
      
      // Sử dụng type guard với discriminated union
      if (updateResult.success === false) {
        return updateResult; // Trả về lỗi nếu cập nhật database thất bại
      }
      
      // Trả về kết quả theo cấu trúc cũ để đảm bảo tương thích với frontend
      return {
        success: true,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        message: 'Upload thumbnail thành công'
      };
    } catch (error) {
      // Throw exception để đảm bảo tương thích với frontend
      throw new BadRequestException(`Upload thumbnail thất bại: ${error.message}`);
    }
  }
}
