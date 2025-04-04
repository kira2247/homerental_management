import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBillDto, UpdateBillDto } from './dto';
import { BillFilterDto } from './dto/bill-filter.dto';
import { PaginatedResult } from '../../common/interfaces';

@Injectable()
export class BillService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo hóa đơn mới
   */
  async create(userId: string, dto: CreateBillDto) {
    // Kiểm tra xem unit có tồn tại không
    const unit = await this.prisma.unit.findUnique({
      where: { id: dto.unitId },
      include: { property: true }
    });

    if (!unit) {
      throw new NotFoundException('Đơn vị cho thuê không tồn tại');
    }

    // Kiểm tra tenant nếu có
    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: dto.tenantId }
      });

      if (!tenant) {
        throw new NotFoundException('Người thuê không tồn tại');
      }

      // Kiểm tra xem tenant có thuê unit này không
      const tenantUnit = await this.prisma.tenantUnit.findFirst({
        where: {
          tenantId: dto.tenantId,
          unitId: dto.unitId,
        }
      });

      if (!tenantUnit) {
        throw new BadRequestException('Người thuê này không thuê đơn vị này');
      }
    }

    // Tính toán lượng tiêu thụ và tiền điện, nước
    let electricityConsumption = null;
    let electricityAmount = null;
    if (dto.electricityPreviousReading !== undefined && 
        dto.electricityCurrentReading !== undefined) {
      electricityConsumption = dto.electricityCurrentReading - dto.electricityPreviousReading;
      
      if (electricityConsumption < 0) {
        throw new BadRequestException('Chỉ số điện hiện tại không thể nhỏ hơn chỉ số kỳ trước');
      }
      
      if (dto.usesTieredPricing && dto.electricityTierDetails && dto.electricityTierDetails.length > 0) {
        // Tính tiền điện theo bậc thang
        electricityAmount = this.calculateTieredElectricityAmount(
          electricityConsumption, 
          dto.electricityTierDetails
        );
      } else if (dto.electricityRate) {
        // Tính tiền điện theo đơn giá cố định
        electricityAmount = electricityConsumption * dto.electricityRate;
      }
    }

    let waterConsumption = null;
    let waterAmount = null;
    if (dto.waterPreviousReading !== undefined && 
        dto.waterCurrentReading !== undefined && 
        dto.waterRate !== undefined) {
      waterConsumption = dto.waterCurrentReading - dto.waterPreviousReading;
      
      if (waterConsumption < 0) {
        throw new BadRequestException('Chỉ số nước hiện tại không thể nhỏ hơn chỉ số kỳ trước');
      }
      
      waterAmount = waterConsumption * dto.waterRate;
    }

    // Tính tổng tiền
    let totalAmount = dto.rentAmount;
    if (electricityAmount) totalAmount += electricityAmount;
    if (waterAmount) totalAmount += waterAmount;
    if (dto.additionalFees && dto.additionalFees.length > 0) {
      totalAmount += dto.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
    }

    // Tạo số hóa đơn unique
    const billNumber = `BILL-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Tạo hóa đơn mới
    const newBill = await this.prisma.bill.create({
      data: {
        billNumber,
        billDate: new Date(dto.billDate),
        dueDate: new Date(dto.dueDate),
        totalAmount,
        rentAmount: dto.rentAmount,
        
        // Thông tin điện
        electricityPreviousReading: dto.electricityPreviousReading,
        electricityCurrentReading: dto.electricityCurrentReading,
        electricityConsumption,
        electricityRate: dto.electricityRate,
        electricityAmount,
        usesTieredPricing: dto.usesTieredPricing || false,
        // Chuyển đổi electricityTierDetails thành JSON object
        electricityTierDetails: dto.electricityTierDetails ? 
          JSON.stringify(dto.electricityTierDetails) : 
          undefined,
        
        // Thông tin nước
        waterPreviousReading: dto.waterPreviousReading,
        waterCurrentReading: dto.waterCurrentReading,
        waterConsumption,
        waterRate: dto.waterRate,
        waterAmount,
        
        // Các chi phí khác - chuyển đổi thành JSON object
        additionalFees: dto.additionalFees ? 
          JSON.stringify(dto.additionalFees) : 
          undefined,
        
        // Thông tin hóa đơn
        notes: dto.notes,
        templateId: dto.templateId,
        
        // Quan hệ
        propertyId: unit.propertyId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        createdById: userId,
      }
    });

    return newBill;
  }

  /**
   * Tìm tất cả hóa đơn với phân trang và lọc
   */
  async findAll(userId: string, filters: BillFilterDto): Promise<PaginatedResult<any>> {
    const where: Prisma.BillWhereInput = {};
    
    // Áp dụng các bộ lọc
    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }
    
    if (filters.unitId) {
      where.unitId = filters.unitId;
    }
    
    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }
    
    if (filters.isPaid !== undefined) {
      where.isPaid = filters.isPaid;
    }
    
    if (filters.fromDate && filters.toDate) {
      where.billDate = {
        gte: new Date(filters.fromDate),
        lte: new Date(filters.toDate),
      };
    } else if (filters.fromDate) {
      where.billDate = {
        gte: new Date(filters.fromDate),
      };
    } else if (filters.toDate) {
      where.billDate = {
        lte: new Date(filters.toDate),
      };
    }
    
    if (filters.search) {
      where.billNumber = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }
    
    // Chỉ trả về hóa đơn của các property mà người dùng có quyền truy cập
    // Tìm các property mà user sở hữu hoặc đã tạo
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
    
    // Thêm điều kiện lọc theo property
    where.propertyId = {
      in: propertyIds,
      ...(where.propertyId ? { equals: where.propertyId as string } : {}),
    };
    
    // Đếm tổng số hóa đơn
    const total = await this.prisma.bill.count({ where });
    
    // Lấy danh sách hóa đơn với phân trang
    const bills = await this.prisma.bill.findMany({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { billDate: 'desc' },
      include: {
        unit: {
          select: {
            name: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
        tenant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });
    
    return {
      data: bills,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * Tìm một hóa đơn theo ID
   */
  async findOne(userId: string, id: string) {
    // Tìm hóa đơn và đảm bảo user có quyền truy cập
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        unit: {
          select: {
            name: true,
            floor: true,
            area: true,
            bedrooms: true,
            bathrooms: true,
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                district: true,
                ward: true,
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
        payment: {
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            referenceNumber: true,
            paymentConfirmedAt: true,
            notes: true,
            attachmentUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!bill) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkBillAccess(userId, bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền truy cập hóa đơn này');
    }
    
    return bill;
  }

  /**
   * Cập nhật hóa đơn
   */
  async update(userId: string, id: string, dto: UpdateBillDto) {
    // Kiểm tra hóa đơn tồn tại
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });
    
    if (!bill) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkBillAccess(userId, bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền cập nhật hóa đơn này');
    }
    
    // Xử lý khi đánh dấu đã thanh toán
    if (dto.isPaid === true && !bill.isPaid) {
      // Cập nhật ngày thanh toán là ngày hiện tại nếu không được cung cấp
      const paymentDate = new Date();
      
      // Tạo dữ liệu cập nhật
      // Cần chuyển đổi các trường JSON cho đúng định dạng Prisma
      const updateData: Prisma.BillUpdateInput = {
        ...dto,
        paymentDate,
        // Chuyển đổi electricityTierDetails thành JSON object nếu có
        electricityTierDetails: dto.electricityTierDetails ? 
          JSON.stringify(dto.electricityTierDetails) : 
          undefined,
        // Chuyển đổi additionalFees thành JSON object nếu có
        additionalFees: dto.additionalFees ? 
          JSON.stringify(dto.additionalFees) : 
          undefined,
      };
      
      // Cập nhật hóa đơn
      return this.prisma.bill.update({
        where: { id },
        data: updateData,
      });
    }
    
    // Chuẩn bị dữ liệu cập nhật cho trường hợp thông thường
    const updateData: Prisma.BillUpdateInput = {
      ...dto,
      // Chuyển đổi electricityTierDetails thành JSON object nếu có
      electricityTierDetails: dto.electricityTierDetails ? 
        JSON.stringify(dto.electricityTierDetails) : 
        undefined,
      // Chuyển đổi additionalFees thành JSON object nếu có
      additionalFees: dto.additionalFees ? 
        JSON.stringify(dto.additionalFees) : 
        undefined,
    };
    
    // Cập nhật hóa đơn thông thường
    return this.prisma.bill.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Xóa hóa đơn
   */
  async remove(userId: string, id: string) {
    // Kiểm tra hóa đơn tồn tại
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });
    
    if (!bill) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    
    // Kiểm tra quyền truy cập
    const hasAccess = await this.checkBillAccess(userId, bill.propertyId);
    if (!hasAccess) {
      throw new BadRequestException('Bạn không có quyền xóa hóa đơn này');
    }
    
    // Kiểm tra xem hóa đơn đã thanh toán chưa
    if (bill.isPaid || bill.payment) {
      throw new BadRequestException('Không thể xóa hóa đơn đã thanh toán');
    }
    
    // Xóa hóa đơn
    return this.prisma.bill.delete({
      where: { id },
    });
  }
  
  /**
   * Tính tiền điện theo bậc thang
   */
  private calculateTieredElectricityAmount(consumption: number, tiers: any[]) {
    // Sắp xếp tiers theo limit tăng dần
    const sortedTiers = [...tiers].sort((a, b) => a.limit - b.limit);
    let remainingConsumption = consumption;
    let totalAmount = 0;
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const currentTier = sortedTiers[i];
      const previousLimit = i > 0 ? sortedTiers[i - 1].limit : 0;
      const tierLimit = currentTier.limit - previousLimit;
      
      if (remainingConsumption <= 0) {
        break;
      }
      
      const consumptionInTier = Math.min(remainingConsumption, tierLimit);
      totalAmount += consumptionInTier * currentTier.rate;
      remainingConsumption -= consumptionInTier;
    }
    
    // Nếu vẫn còn lượng tiêu thụ chưa tính
    if (remainingConsumption > 0 && sortedTiers.length > 0) {
      // Sử dụng mức giá của bậc thang cao nhất
      totalAmount += remainingConsumption * sortedTiers[sortedTiers.length - 1].rate;
    }
    
    return totalAmount;
  }
  
  /**
   * Kiểm tra quyền truy cập vào hóa đơn
   */
  private async checkBillAccess(userId: string, propertyId: string): Promise<boolean> {
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