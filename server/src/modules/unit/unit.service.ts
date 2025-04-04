import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, QueryUnitDto, UpdateUnitDto } from './dto';
import { Prisma, UnitStatus, UtilityType } from '@prisma/client';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto, userId: string) {
    // Kiểm tra property có tồn tại không và user có quyền tạo unit không
    const property = await this.prisma.property.findUnique({
      where: { id: createUnitDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Không tìm thấy bất động sản với ID: ${createUnitDto.propertyId}`,
      );
    }

    // Kiểm tra quyền sở hữu hoặc quyền quản lý
    if (property.userId !== userId && property.ownerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo đơn vị cho bất động sản này',
      );
    }

    // Tạo unit mới
    return this.prisma.unit.create({
      data: {
        ...createUnitDto,
        // Set giá trị mặc định từ property nếu không được cung cấp
        electricityRate:
          createUnitDto.electricityRate ?? property.defaultElectricityRate,
        waterRate: createUnitDto.waterRate ?? property.defaultWaterRate,
        internetRate: createUnitDto.internetRate ?? property.defaultInternetRate,
        garbageRate: createUnitDto.garbageRate ?? property.defaultGarbageRate,
      },
    });
  }

  async findAll(queryDto: QueryUnitDto) {
    const {
      page = 1,
      limit = 10,
      propertyId,
      status,
      search,
      sortByPriceAsc,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      floor,
      hasFurniture,
      hasAirCon,
      hasWaterHeater,
      hasBalcony,
    } = queryDto;

    // Xây dựng điều kiện lọc
    const where: any = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (minArea !== undefined || maxArea !== undefined) {
      where.area = {};
      if (minArea !== undefined) {
        where.area.gte = minArea;
      }
      if (maxArea !== undefined) {
        where.area.lte = maxArea;
      }
    }

    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    if (bathrooms !== undefined) {
      where.bathrooms = bathrooms;
    }

    if (floor !== undefined) {
      where.floor = floor;
    }

    if (hasFurniture !== undefined) {
      where.hasFurniture = hasFurniture;
    }

    if (hasAirCon !== undefined) {
      where.hasAirCon = hasAirCon;
    }

    if (hasWaterHeater !== undefined) {
      where.hasWaterHeater = hasWaterHeater;
    }

    if (hasBalcony !== undefined) {
      where.hasBalcony = hasBalcony;
    }

    // Tính toán giá trị phân trang
    const skip = (page - 1) * limit;

    // Truy vấn dữ liệu với phân trang và sắp xếp
    const units = await this.prisma.unit.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortByPriceAsc ? { price: 'asc' } : { createdAt: 'desc' },
      include: {
        property: {
          select: {
            name: true,
            address: true,
            city: true,
            district: true,
          },
        },
      },
    });

    // Đếm tổng số bản ghi
    const total = await this.prisma.unit.count({ where });

    // Tính toán tổng số trang
    const totalPages = Math.ceil(total / limit);

    return {
      data: units,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            type: true,
          },
        },
        tenantUnits: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${id}`);
    }

    // Lấy thông tin chi tiết về hóa đơn gần nhất
    const latestBill = await this.prisma.bill.findFirst({
      where: {
        unitId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    // Lấy thông tin chi tiết về chỉ số tiện ích gần nhất cho từng loại tiện ích
    const electricityReading = await this.prisma.utilityReading.findFirst({
      where: {
        unitId: id,
        readingType: UtilityType.ELECTRICITY
      },
      orderBy: {
        readingDate: 'desc',
      },
    });

    const waterReading = await this.prisma.utilityReading.findFirst({
      where: {
        unitId: id,
        readingType: UtilityType.WATER
      },
      orderBy: {
        readingDate: 'desc',
      },
    });

    const latestUtilityReadings = [
      electricityReading,
      waterReading,
    ].filter(Boolean);

    return {
      ...unit,
      latestBill,
      latestUtilityReadings,
      isOccupied: unit.status === UnitStatus.OCCUPIED,
      tenants: unit.tenantUnits.map((tu) => tu.tenant),
    };
  }

  async update(id: string, updateUnitDto: UpdateUnitDto, userId: string) {
    // Kiểm tra unit có tồn tại không
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${id}`);
    }

    // Kiểm tra quyền sở hữu
    if (
      unit.property.userId !== userId &&
      unit.property.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa đơn vị cho thuê này',
      );
    }

    // Cập nhật unit
    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
    });
  }

  async remove(id: string, userId: string) {
    // Kiểm tra unit có tồn tại không
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
        tenantUnits: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${id}`);
    }

    // Kiểm tra quyền sở hữu
    if (
      unit.property.userId !== userId &&
      unit.property.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền xóa đơn vị cho thuê này',
      );
    }

    // Kiểm tra xem unit có đang được thuê không
    if (unit.tenantUnits && unit.tenantUnits.length > 0) {
      throw new BadRequestException(
        'Không thể xóa đơn vị cho thuê đang có người thuê',
      );
    }

    // Xóa unit
    return this.prisma.unit.delete({
      where: { id },
    });
  }

  async getVacantUnits(propertyId: string, userId: string) {
    // Kiểm tra property có tồn tại không
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(
        `Không tìm thấy bất động sản với ID: ${propertyId}`,
      );
    }

    // Kiểm tra quyền sở hữu
    if (property.userId !== userId && property.ownerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem đơn vị cho thuê của bất động sản này',
      );
    }

    // Lấy danh sách đơn vị trống
    return this.prisma.unit.findMany({
      where: {
        propertyId,
        status: UnitStatus.VACANT,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getUnitSummary(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            name: true,
            address: true,
          },
        },
        tenantUnits: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${id}`);
    }

    // Đếm số hóa đơn chưa thanh toán
    const unpaidBillsCount = await this.prisma.bill.count({
      where: {
        unitId: id,
        status: {
          equals: 'UNPAID',
        },
      } as Prisma.BillWhereInput,
    });

    // Tính tổng tiền chưa thanh toán
    const unpaidBillsTotal = await this.prisma.bill.aggregate({
      where: {
        unitId: id,
        status: {
          equals: 'UNPAID',
        },
      } as Prisma.BillWhereInput,
      _sum: {
        totalAmount: true,
      },
    });

    // Đếm số yêu cầu bảo trì đang mở
    const openMaintenanceRequestsCount = await this.prisma.maintenanceRequest.count({
      where: {
        unit: {
          id,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      } as Prisma.MaintenanceRequestWhereInput,
    });

    return {
      id: unit.id,
      name: unit.name,
      property: unit.property,
      status: unit.status,
      price: unit.price,
      area: unit.area,
      tenants: unit.tenantUnits.map((tu) => tu.tenant),
      isOccupied: unit.status === UnitStatus.OCCUPIED,
      occupiedSince: unit.tenantUnits.length > 0 ? unit.tenantUnits[0].moveInDate : null,
      unpaidBillsCount,
      unpaidBillsTotal: unpaidBillsTotal._sum.totalAmount || 0,
      openMaintenanceRequestsCount,
    };
  }
}
