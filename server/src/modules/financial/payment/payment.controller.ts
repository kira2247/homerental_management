import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { PaymentService } from './payment.service';
import { 
  CreatePaymentDto, 
  PaymentFilterDto, 
  PaymentResponseDto, 
  UpdatePaymentDto 
} from './dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  @ApiResponse({ 
    status: 201, 
    description: 'Thanh toán đã được tạo thành công',
    type: PaymentResponseDto 
  })
  create(@GetUser('id') userId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thanh toán' })
  @ApiResponse({ 
    status: 200, 
    description: 'Danh sách thanh toán được trả về thành công' 
  })
  findAll(
    @GetUser('id') userId: string,
    @Query() filters: PaymentFilterDto
  ) {
    return this.paymentService.findAll(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một thanh toán' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thông tin thanh toán được trả về thành công',
    type: PaymentResponseDto 
  })
  findOne(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.paymentService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thanh toán' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thanh toán đã được cập nhật thành công',
    type: PaymentResponseDto 
  })
  update(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto
  ) {
    return this.paymentService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thanh toán' })
  @ApiResponse({ 
    status: 200, 
    description: 'Thanh toán đã được xóa thành công' 
  })
  remove(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.paymentService.remove(userId, id);
  }
} 