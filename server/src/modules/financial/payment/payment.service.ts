import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePaymentDto, PaymentFilterDto, UpdatePaymentDto } from './dto';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PaginatedResult } from '../../../modules/common/interfaces/paginated-result.interface';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo thanh toán mới cho hóa đơn
   */
  async create(userId: string, dto: CreatePaymentDto) {
    // Kiểm tra xem bill có tồn tại không
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: {
        payment: true,
        property: true,
        unit: true,
        tenant: true,
      },
    });

    if (!bill) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }

    // Kiểm tra xem bill đã được thanh toán chưa
    if (bill.isPaid || bill.payment) {
      throw new BadRequestException('Hóa đơn này đã được thanh toán');
    }

    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkPaymentAccess(userId, bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền tạo thanh toán cho hóa đơn này');
    }

    // Tạo số biên lai thanh toán
    const receiptNumber = this.generateReceiptNumber();

    // Lưu thông tin thanh toán
    const payment = await this.prisma.payment.create({
      data: {
        receiptNumber,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        paymentConfirmedById: userId,
        paymentConfirmedAt: new Date(),
        notes: dto.notes,
        attachmentUrl: dto.attachmentUrl,
        billId: dto.billId,
        tenantId: bill.tenantId,
      },
    });

    // Cập nhật trạng thái bill
    await this.prisma.bill.update({
      where: { id: dto.billId },
      data: {
        isPaid: true,
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
      },
    });

    return payment;
  }

  /**
   * Lấy danh sách thanh toán với phân trang và lọc
   */
  async findAll(userId: string, filters: PaymentFilterDto): Promise<PaginatedResult<any>> {
    const where: Prisma.PaymentWhereInput = {};
    
    // Áp dụng các bộ lọc
    if (filters.billId) {
      where.billId = filters.billId;
    }
    
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }
    
    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }
    
    if (filters.fromDate && filters.toDate) {
      where.paymentDate = {
        gte: new Date(filters.fromDate),
        lte: new Date(filters.toDate),
      };
    } else if (filters.fromDate) {
      where.paymentDate = {
        gte: new Date(filters.fromDate),
      };
    } else if (filters.toDate) {
      where.paymentDate = {
        lte: new Date(filters.toDate),
      };
    }
    
    if (filters.search) {
      where.receiptNumber = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }
    
    // Chỉ trả về hóa đơn của các property mà người dùng có quyền truy cập
    const userProperties = await this.prisma.property.findMany({
      where: {
        OR: [
          { userId }, // User đã tạo property
          { ownerId: userId }, // User là chủ sở hữu
        ],
      },
      select: { id: true },
    });
    
    const propertyIds = userProperties.map(property => property.id);
    
    // Lọc theo propertyId và unitId (cần join qua bill)
    const billWhere: Prisma.BillWhereInput = {
      propertyId: {
        in: propertyIds,
      },
    };
    
    if (filters.propertyId) {
      billWhere.propertyId = filters.propertyId;
    }
    
    if (filters.unitId) {
      billWhere.unitId = filters.unitId;
    }
    
    where.bill = billWhere;
    
    // Đếm tổng số thanh toán
    const total = await this.prisma.payment.count({ where });
    
    const page = filters.page || 1; // Default to page 1
    const limit = filters.limit || 10; // Default to 10 items per page
    
    // Lấy danh sách thanh toán với phân trang
    const payments = await this.prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: 'desc' },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            dueDate: true,
            unit: {
              select: {
                id: true,
                name: true,
                property: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        paymentConfirmedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tìm một thanh toán theo ID
   */
  async findOne(userId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        bill: {
          select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            dueDate: true,
            propertyId: true,
            unit: {
              select: {
                id: true,
                name: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        paymentConfirmedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!payment) {
      throw new NotFoundException('Không tìm thấy thanh toán');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkPaymentAccess(userId, payment.bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền truy cập thanh toán này');
    }
    
    return payment;
  }

  /**
   * Cập nhật thông tin thanh toán
   */
  async update(userId: string, id: string, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        bill: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    });
    
    if (!payment) {
      throw new NotFoundException('Không tìm thấy thanh toán');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkPaymentAccess(userId, payment.bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền cập nhật thanh toán này');
    }
    
    // Không cho phép thay đổi billId
    if (dto.billId && dto.billId !== payment.billId) {
      throw new BadRequestException('Không thể thay đổi hóa đơn của thanh toán');
    }
    
    // Cập nhật thông tin thanh toán
    return this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        attachmentUrl: dto.attachmentUrl,
      },
    });
  }

  /**
   * Xóa thanh toán
   */
  async remove(userId: string, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        bill: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    });
    
    if (!payment) {
      throw new NotFoundException('Không tìm thấy thanh toán');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkPaymentAccess(userId, payment.bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền xóa thanh toán này');
    }
    
    // Cập nhật trạng thái bill thành chưa thanh toán
    await this.prisma.bill.update({
      where: { id: payment.billId },
      data: {
        isPaid: false,
        paymentDate: null,
        paymentMethod: null,
      },
    });
    
    // Xóa thanh toán
    return this.prisma.payment.delete({
      where: { id },
    });
  }

  /**
   * Tạo số biên lai thanh toán duy nhất
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `RCPT-${year}${month}-${random}`;
  }

  /**
   * Kiểm tra quyền truy cập vào thanh toán
   */
  private async checkPaymentAccess(userId: string, propertyId: string): Promise<boolean> {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { userId }, // User đã tạo property
          { ownerId: userId }, // User là chủ sở hữu
        ],
      },
    });
    
    return !!property;
  }
} 