import {  
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, QueryUnitDto, UpdateUnitDto } from './dto';
import { Prisma, UnitStatus, UtilityType, Unit } from '@prisma/client';
import { ApiResponse } from '../../lib/types/api-response.types';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto, userId: string): Promise<ApiResponse<Unit>> {
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

    try {
      // Tạo unit mới
      const newUnit = await this.prisma.unit.create({
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
      
      return {
        success: true,
        data: newUnit
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_UNIT_ERROR',
          message: `Có lỗi xảy ra khi tạo đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async findAll(queryDto: QueryUnitDto): Promise<ApiResponse<any>> {
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

    try {
      return {
        success: true,
        data: {
          items: units,
          meta: {
            total,
            page,
            limit,
            totalPages,
          },
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FIND_UNITS_ERROR',
          message: `Có lỗi xảy ra khi lấy danh sách đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
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
      return {
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: `Không tìm thấy đơn vị cho thuê với ID: ${id}`
        }
      };
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

    try {
      return {
        success: true,
        data: {
          ...unit,
          latestBill,
          latestUtilityReadings,
          isOccupied: unit.status === UnitStatus.OCCUPIED,
          tenants: unit.tenantUnits.map((tu) => tu.tenant),
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FIND_UNIT_ERROR',
          message: `Có lỗi xảy ra khi lấy thông tin đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async update(id: string, updateUnitDto: UpdateUnitDto, userId: string): Promise<ApiResponse<Unit>> {
    // Kiểm tra unit có tồn tại không
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!unit) {
      return {
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: `Không tìm thấy đơn vị cho thuê với ID: ${id}`
        }
      };
    }

    // Kiểm tra quyền sở hữu
    if (
      unit.property.userId !== userId &&
      unit.property.ownerId !== userId
    ) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bạn không có quyền chỉnh sửa đơn vị cho thuê này'
        }
      };
    }

    try {
      // Cập nhật unit
      const updatedUnit = await this.prisma.unit.update({
        where: { id },
        data: updateUnitDto,
      });
      
      return {
        success: true,
        data: updatedUnit
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_UNIT_ERROR',
          message: `Có lỗi xảy ra khi cập nhật đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async remove(id: string, userId: string): Promise<ApiResponse<Unit>> {
    // Kiểm tra unit có tồn tại không
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
        tenantUnits: true,
      },
    });

    if (!unit) {
      return {
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: `Không tìm thấy đơn vị cho thuê với ID: ${id}`
        }
      };
    }

    // Kiểm tra quyền sở hữu
    if (unit.property.userId !== userId && unit.property.ownerId !== userId) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bạn không có quyền xóa đơn vị cho thuê này'
        }
      };
    }

    try {
      // Thực hiện trong transaction để đảm bảo tính nhất quán
      return await this.prisma.$transaction(async (tx) => {
        // 1. Gỡ liên kết người thuê (nếu có)
        let tenantUnitsCount = 0;
        if (unit.tenantUnits && unit.tenantUnits.length > 0) {
          const result = await tx.tenantUnit.deleteMany({
            where: { unitId: id }
          });
          tenantUnitsCount = result.count;
        }

        // 2. Cập nhật các hóa đơn liên quan
        const billsResult = await tx.bill.updateMany({
          where: { unitId: id },
          data: { 
            unitId: null, 
            notes: `Unit đã bị xóa (ID: ${id}, Tên: ${unit.name})` 
          }
        });

        // 3. Cập nhật các tài liệu liên quan
        const documentsResult = await tx.document.updateMany({
          where: { unitId: id },
          data: { unitId: null }
        });

        // 4. Cập nhật các yêu cầu bảo trì
        const maintenanceResult = await tx.maintenanceRequest.updateMany({
          where: { unitId: id },
          data: { 
            unitId: null, 
            notes: `Unit đã bị xóa (ID: ${id}, Tên: ${unit.name})` 
          }
        });

        // 5. UtilityReading có onDelete: Cascade nên sẽ tự động xóa

        // 6. Xóa unit
        const deletedUnit = await tx.unit.delete({
          where: { id }
        });

        // 7. Tạo audit log
        await tx.auditLog.create({
          data: {
            action: 'DELETE_UNIT',
            entityType: 'Unit',
            entityId: id,
            description: `Xóa đơn vị cho thuê: ${unit.name}`,
            userId: userId,
            metadata: { 
              unitName: unit.name, 
              propertyId: unit.propertyId,
              relatedDataHandled: {
                tenantUnits: tenantUnitsCount,
                bills: billsResult.count,
                documents: documentsResult.count,
                maintenanceRequests: maintenanceResult.count
              }
            }
          }
        });

        return {
          success: true,
          data: deletedUnit
        };
      });
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_UNIT_ERROR',
          message: `Có lỗi xảy ra khi xóa đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async getVacantUnits(propertyId: string, userId: string): Promise<ApiResponse<Unit[]>> {
    // Kiểm tra property có tồn tại không
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return {
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: `Không tìm thấy bất động sản với ID: ${propertyId}`
        }
      };
    }

    // Kiểm tra quyền sở hữu
    if (property.userId !== userId && property.ownerId !== userId) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bạn không có quyền xem đơn vị cho thuê của bất động sản này'
        }
      };
    }

    try {
      // Lấy danh sách đơn vị trống
      const vacantUnits = await this.prisma.unit.findMany({
        where: {
          propertyId,
          status: UnitStatus.VACANT,
        },
        orderBy: {
          name: 'asc',
        },
      });
      
      return {
        success: true,
        data: vacantUnits
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_VACANT_UNITS_ERROR',
          message: `Có lỗi xảy ra khi lấy danh sách đơn vị cho thuê còn trống: ${error.message}`
        }
      };
    }
  }

  async getUnitsByPropertyId(propertyId: string, queryDto: QueryUnitDto, userId: string): Promise<ApiResponse<any>> {
    console.log(`[DEBUG] getUnitsByPropertyId - Start - propertyId: ${propertyId}, userId: ${userId}`);
    console.log(`[DEBUG] getUnitsByPropertyId - queryDto:`, JSON.stringify(queryDto, null, 2));
    
    // Kiểm tra property có tồn tại không
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    console.log(`[DEBUG] getUnitsByPropertyId - Property found:`, property ? 'Yes' : 'No');

    if (!property) {
      console.log(`[ERROR] getUnitsByPropertyId - Property not found with ID: ${propertyId}`);
      return {
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: `Không tìm thấy bất động sản với ID: ${propertyId}`
        }
      };
    }

    // Kiểm tra quyền truy cập
    if (property.userId !== userId && property.ownerId !== userId) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Bạn không có quyền xem đơn vị cho thuê của bất động sản này'
        }
      };
    }

    // Thiết lập các tham số truy vấn
    const {
      page = 1,
      limit = 10,
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
    const where: any = {
      propertyId: propertyId // Luôn lọc theo propertyId
    };

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

    try {
      console.log(`[DEBUG] getUnitsByPropertyId - Query params:`, {
        where,
        skip,
        take: limit,
        orderBy: sortByPriceAsc ? { price: 'asc' } : { createdAt: 'desc' }
      });
      
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
          tenantUnits: {
            where: {
              status: 'ACTIVE',
            },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      console.log(`[DEBUG] getUnitsByPropertyId - Units found: ${units.length}`);
      // Log chi tiết về các unit đầu tiên (nếu có)
      if (units.length > 0) {
        console.log(`[DEBUG] getUnitsByPropertyId - First unit:`, JSON.stringify({
          id: units[0].id,
          name: units[0].name,
          status: units[0].status,
          propertyId: units[0].propertyId
        }, null, 2));
      } else {
        console.log(`[DEBUG] getUnitsByPropertyId - No units found for property ${propertyId}`);
      }

      // Đếm tổng số bản ghi
      const total = await this.prisma.unit.count({ where });
      console.log(`[DEBUG] getUnitsByPropertyId - Total units count: ${total}`);

      // Tính toán tổng số trang
      const totalPages = Math.ceil(total / limit);

      // Biến đổi dữ liệu để bao gồm thông tin người thuê
      const unitsWithTenants = units.map(unit => ({
        ...unit,
        tenants: unit.tenantUnits.map(tu => tu.tenant),
        isOccupied: unit.status === 'OCCUPIED',
      }));

      // Sử dụng const assertion để TypeScript hiểu success là literal type 'true'
      // Đảm bảo cấu trúc response phù hợp với PaginatedResponse<T> mà frontend mong đợi
      const response = {
        success: true as const,
        data: {
          items: unitsWithTenants,
          totalItems: total,
          page,
          limit,
          totalPages,
        }
      };
      console.log(`[DEBUG] getUnitsByPropertyId - Response data:`, {
        success: response.success,
        itemsCount: response.data.items.length,
        totalItems: response.data.totalItems,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FIND_UNITS_ERROR',
          message: `Có lỗi xảy ra khi lấy danh sách đơn vị cho thuê: ${error.message}`
        }
      };
    }
  }

  async getUnitSummary(id: string): Promise<ApiResponse<any>> {
    try {
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
      return {
        success: false,
        error: {
          code: 'UNIT_NOT_FOUND',
          message: `Không tìm thấy đơn vị cho thuê với ID: ${id}`
        }
      };
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
      success: true,
      data: {
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
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'GET_UNIT_SUMMARY_ERROR',
        message: `Có lỗi xảy ra khi lấy tóm tắt đơn vị cho thuê: ${error.message}`
      }
    };
  }
  }
}
