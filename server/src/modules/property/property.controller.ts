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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
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
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới bất động sản' })
  @ApiResponse({ status: 201, description: 'Tạo mới thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    // DEBUG LOGS - REMOVE AFTER DEBUGGING
    console.log('=== PROPERTY CONTROLLER: CREATE PROPERTY START ===');
    console.log('Request user object:', req.user);
    console.log('Request headers:', req.headers);
    console.log('Property DTO before processing:', JSON.stringify(createPropertyDto));
    
    // Kiểm tra thông tin user từ request
    if (!req.user || !req.user.id) {
      console.error('ERROR: Authentication appears successful but user ID is missing from request');
      console.error('This may indicate a middleware or guard issue');
      throw new Error('User authentication data is incomplete. Please contact support.');
    }
    
    // Nếu không có userId hoặc ownerId, sử dụng ID của người dùng hiện tại
    if (!createPropertyDto.userId) {
      console.log('userId missing, setting from request user');
      createPropertyDto.userId = req.user.id;
    }
    
    if (!createPropertyDto.ownerId) {
      console.log('ownerId missing, setting from request user');
      createPropertyDto.ownerId = req.user.id;
    }

    console.log('Property DTO after processing:', JSON.stringify({
      ...createPropertyDto,
      userId: createPropertyDto.userId,
      ownerId: createPropertyDto.ownerId
    }));
    
    // Xác nhận một lần nữa rằng đã có userId và ownerId
    if (!createPropertyDto.userId || !createPropertyDto.ownerId) {
      console.error('ERROR: Still missing userId or ownerId after processing');
      throw new Error('Unable to create property with missing user information');
    }
    
    console.log('Calling property service create method...');
    
    // Gọi service để tạo property
    const result = await this.propertyService.create(createPropertyDto);
    
    // Kiểm tra kết quả
    console.log('Property service returned result:');
    console.log('Success:', result.success);
    console.log('Has data:', !!result.data);
    
    if (result.success && result.data) {
      console.log('Property created successfully with ID:', result.data.id);
      
      // Kiểm tra đầy đủ thông tin
      if (!result.data.id) {
        console.error('WARNING: Property service returned success but ID is missing!');
        
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
      console.warn('Property service returned failure or no data:', result);
    }
    
    console.log('=== PROPERTY CONTROLLER: CREATE PROPERTY END ===');
    
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
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ) {
    return this.propertyService.update(id, updatePropertyDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa bất động sản' })
  @ApiParam({ name: 'id', description: 'ID của bất động sản' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bất động sản' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 400, description: 'Không thể xóa do còn các đơn vị thuộc về' })
  remove(@Param('id') id: string, @Request() req) {
    return this.propertyService.remove(id, req.user.id);
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
}
