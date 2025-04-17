import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTenantDto,
  CreateTenantUnitDto,
  QueryTenantDto,
  UpdateTenantDto,
} from './dto';
import { TenantUnitStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo một tenant mới
   */
  async create(createTenantDto: CreateTenantDto) {
    // Kiểm tra xem tenant có tồn tại với identityNumber đã được cung cấp chưa
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        identityNumber: createTenantDto.identityNumber,
      },
    });

    if (existingTenant) {
      throw new BadRequestException(
        `Người thuê với số CMND/CCCD ${createTenantDto.identityNumber} đã tồn tại`,
      );
    }

    // Kiểm tra xem tenant có nằm trong danh sách đen không
    const blacklisted = await this.prisma.blacklistedTenant.findFirst({
      where: {
        identityNumber: createTenantDto.identityNumber,
        // Chỉ xem xét blacklist vẫn còn hiệu lực
        OR: [
          { expiryDate: null }, // Blacklist vĩnh viễn
          { expiryDate: { gt: new Date() } }, // Blacklist chưa hết hạn
        ],
      },
    });

    if (blacklisted) {
      throw new BadRequestException(
        `Người thuê với số CMND/CCCD ${createTenantDto.identityNumber} đang nằm trong danh sách đen.`,
      );
    }

    // Tạo tenant mới
    return this.prisma.tenant.create({
      data: createTenantDto,
    });
  }

  /**
   * Lấy danh sách tenant với phân trang và lọc
   */
  async findAll(queryDto: QueryTenantDto) {
    const {
      page = 1,
      limit = 10,
      search,
      identityType,
      sortByLatest = true,
      createdFrom,
      createdTo,
      unitId,
      propertyId,
      activeOnly,
    } = queryDto;

    // Xây dựng điều kiện lọc
    const where: any = {};

    // Tìm kiếm theo nhiều trường
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { identityNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Lọc theo loại giấy tờ
    if (identityType) {
      where.identityType = identityType;
    }

    // Lọc theo khoảng thời gian tạo
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    // Lọc theo unit hoặc property
    if (unitId || propertyId || activeOnly) {
      where.tenantUnits = {
        some: {
          ...(unitId && { unitId }),
          ...(activeOnly && { status: TenantUnitStatus.ACTIVE }),
          ...(propertyId && {
            unit: {
              propertyId,
            },
          }),
        },
      };
    }

    // Tính toán giá trị phân trang
    const skip = (page - 1) * limit;

    // Truy vấn dữ liệu với phân trang và sắp xếp
    const tenants = await this.prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortByLatest ? { createdAt: 'desc' } : { name: 'asc' },
      include: {
        tenantUnits: {
          where: {
            status: TenantUnitStatus.ACTIVE,
          },
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                propertyId: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        vehicles: true,
      },
    });

    // Đếm tổng số bản ghi
    const total = await this.prisma.tenant.count({ where });

    // Tính toán tổng số trang
    const totalPages = Math.ceil(total / limit);

    return {
      data: tenants,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Lấy thông tin chi tiết một tenant
   */
  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantUnits: {
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
        vehicles: true,
        bills: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID: ${id}`);
    }

    // Xác định xem tenant có đang trong blacklist không
    const blacklisted = await this.prisma.blacklistedTenant.findFirst({
      where: {
        identityNumber: tenant.identityNumber,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
    });

    // Lấy thông tin các đơn vị đang thuê
    const activeUnits = tenant.tenantUnits
      .filter((tu) => tu.status === TenantUnitStatus.ACTIVE)
      .map((tu) => tu.unit);

    // Lấy tổng số hóa đơn chưa thanh toán
    const unpaidBillsCount = await this.prisma.bill.count({
      where: {
        tenantId: id,
        isPaid: false,
      },
    });

    return {
      ...tenant,
      isBlacklisted: !!blacklisted,
      blacklistInfo: blacklisted,
      activeUnits,
      unpaidBillsCount,
      // Loại bỏ một số thông tin không cần thiết trong response
      tenantUnits: tenant.tenantUnits.map((tu) => ({
        ...tu,
        unit: {
          id: tu.unit.id,
          name: tu.unit.name,
          property: tu.unit.property,
        },
      })),
    };
  }

  /**
   * Cập nhật thông tin tenant
   */
  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // Kiểm tra xem tenant có tồn tại không
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID: ${id}`);
    }

    // Nếu cập nhật identityNumber, kiểm tra xem có trùng với tenant khác không
    if (
      updateTenantDto.identityNumber &&
      updateTenantDto.identityNumber !== tenant.identityNumber
    ) {
      const existingTenant = await this.prisma.tenant.findFirst({
        where: {
          identityNumber: updateTenantDto.identityNumber,
          id: { not: id },
        },
      });

      if (existingTenant) {
        throw new BadRequestException(
          `Người thuê với số CMND/CCCD ${updateTenantDto.identityNumber} đã tồn tại`,
        );
      }
    }

    // Cập nhật tenant
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  /**
   * Xóa tenant (chỉ xóa được nếu không có mối quan hệ với unit nào)
   */
  async remove(id: string) {
    // Kiểm tra xem tenant có tồn tại không
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        tenantUnits: {
          where: {
            status: TenantUnitStatus.ACTIVE,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID: ${id}`);
    }

    // Kiểm tra xem tenant có đang thuê unit nào không
    if (tenant.tenantUnits.length > 0) {
      throw new BadRequestException(
        'Không thể xóa người thuê đang có hợp đồng thuê',
      );
    }

    // Xóa tenant
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Tạo mối quan hệ giữa tenant và unit (gán tenant vào unit)
   */
  async assignTenantToUnit(
    createTenantUnitDto: CreateTenantUnitDto,
    userId: string,
  ) {
    const { tenantId, unitId } = createTenantUnitDto;

    // Kiểm tra tenant tồn tại
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID: ${tenantId}`);
    }

    // Kiểm tra unit tồn tại
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        property: true,
      },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${unitId}`);
    }

    // Kiểm tra quyền sở hữu
    if (
      unit.property.userId !== userId &&
      unit.property.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý đơn vị cho thuê này',
      );
    }

    // Kiểm tra xem tenant có nằm trong blacklist không
    const blacklisted = await this.prisma.blacklistedTenant.findFirst({
      where: {
        identityNumber: tenant.identityNumber,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
    });

    if (blacklisted) {
      throw new BadRequestException(
        `Người thuê với ID ${tenantId} đang nằm trong danh sách đen`,
      );
    }

    // Kiểm tra xem tenant đã được gán vào unit này chưa
    const existingTenantUnit = await this.prisma.tenantUnit.findFirst({
      where: {
        tenantId,
        unitId,
        status: TenantUnitStatus.ACTIVE,
      },
    });

    if (existingTenantUnit) {
      throw new BadRequestException(
        `Người thuê đã được gán vào đơn vị này`,
      );
    }

    // Tạo mối quan hệ TenantUnit
    const tenantUnit = await this.prisma.tenantUnit.create({
      data: {
        ...createTenantUnitDto,
        moveInDate: new Date(createTenantUnitDto.moveInDate),
        moveOutDate: createTenantUnitDto.moveOutDate
          ? new Date(createTenantUnitDto.moveOutDate)
          : undefined,
        // Xử lý các trường hợp đồng nếu có
        ...(createTenantUnitDto.contractStartDate ? {
          contractStartDate: new Date(createTenantUnitDto.contractStartDate)
        } : {}),
        ...(createTenantUnitDto.contractEndDate ? {
          contractEndDate: new Date(createTenantUnitDto.contractEndDate)
        } : {}),
        ...(createTenantUnitDto.contractStatus ? {
          contractStatus: createTenantUnitDto.contractStatus
        } : {}),
        ...(createTenantUnitDto.monthlyRent ? {
          monthlyRent: createTenantUnitDto.monthlyRent
        } : {}),
        ...(createTenantUnitDto.depositAmount ? {
          depositAmount: createTenantUnitDto.depositAmount
        } : {}),
        ...(createTenantUnitDto.contractDocumentId ? {
          contractDocumentId: createTenantUnitDto.contractDocumentId
        } : {})
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    // Cập nhật trạng thái unit thành OCCUPIED nếu chưa
    if (unit.status !== 'OCCUPIED') {
      await this.prisma.unit.update({
        where: { id: unitId },
        data: { status: 'OCCUPIED' },
      });
    }

    return tenantUnit;
  }

  /**
   * Kết thúc hợp đồng thuê (tenant rời khỏi unit)
   */
  async endTenancy(tenantUnitId: string, userId: string) {
    // Kiểm tra TenantUnit tồn tại
    const tenantUnit = await this.prisma.tenantUnit.findUnique({
      where: { id: tenantUnitId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!tenantUnit) {
      throw new NotFoundException(`Không tìm thấy hợp đồng thuê với ID: ${tenantUnitId}`);
    }

    // Kiểm tra quyền sở hữu
    if (
      tenantUnit.unit.property.userId !== userId &&
      tenantUnit.unit.property.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý đơn vị cho thuê này',
      );
    }

    // Kiểm tra xem TenantUnit có đang active không
    if (tenantUnit.status !== TenantUnitStatus.ACTIVE) {
      throw new BadRequestException(
        `Hợp đồng thuê này đã kết thúc trước đó`,
      );
    }

    // Cập nhật TenantUnit
    const updatedTenantUnit = await this.prisma.tenantUnit.update({
      where: { id: tenantUnitId },
      data: {
        status: TenantUnitStatus.INACTIVE,
        moveOutDate: new Date(),
        // Cập nhật trạng thái hợp đồng nếu có
        ...(tenantUnit.contractStatus ? { contractStatus: 'TERMINATED' } : {}),
      },
      include: {
        tenant: true,
        unit: true,
      },
    });

    // Kiểm tra xem unit có còn tenant active nào khác không
    const activeTenantsCount = await this.prisma.tenantUnit.count({
      where: {
        unitId: tenantUnit.unitId,
        status: TenantUnitStatus.ACTIVE,
      },
    });

    // Nếu không còn tenant active nào, cập nhật trạng thái unit thành VACANT
    if (activeTenantsCount === 0) {
      await this.prisma.unit.update({
        where: { id: tenantUnit.unitId },
        data: { status: 'VACANT' },
      });
    }

    return updatedTenantUnit;
  }

  /**
   * Lấy danh sách các tenant đang thuê trong một unit
   */
  async getTenantsByUnit(unitId: string) {
    // Kiểm tra unit tồn tại
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy đơn vị cho thuê với ID: ${unitId}`);
    }

    // Lấy danh sách tenant đang thuê unit này
    const tenantUnits = await this.prisma.tenantUnit.findMany({
      where: {
        unitId,
        status: TenantUnitStatus.ACTIVE,
      },
      include: {
        tenant: true,
      },
      orderBy: {
        moveInDate: 'asc',
      },
    });

    return tenantUnits.map((tu) => {
      const result: any = {
        tenantUnitId: tu.id,
        ...tu.tenant,
        isMainTenant: tu.isMainTenant,
        moveInDate: tu.moveInDate,
      };
      
      // Thêm các trường hợp đồng nếu có
      if ('contractEndDate' in tu) {
        result.contractEndDate = tu.contractEndDate;
      }
      
      return result;
    });
  }

  /**
   * Lấy danh sách các unit đang được thuê bởi một tenant
   */
  async getUnitsByTenant(tenantId: string) {
    // Kiểm tra tenant tồn tại
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID: ${tenantId}`);
    }

    // Lấy danh sách unit đang được thuê bởi tenant này
    const tenantUnits = await this.prisma.tenantUnit.findMany({
      where: {
        tenantId,
        status: TenantUnitStatus.ACTIVE,
      },
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        moveInDate: 'asc',
      },
    });

    return tenantUnits.map((tu) => {
      const result: any = {
        tenantUnitId: tu.id,
        ...tu.unit,
        property: tu.unit.property,
        isMainTenant: tu.isMainTenant,
        moveInDate: tu.moveInDate,
      };
      
      // Thêm các trường hợp đồng nếu có
      if ('contractEndDate' in tu) {
        result.contractEndDate = tu.contractEndDate;
      }
      
      return result;
    });
  }
}
