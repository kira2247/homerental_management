import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { Prisma, MaintenanceStatus } from '@prisma/client';
import { PaginatedResult } from '../common/interfaces';

// Định nghĩa một type cố định cho các option include
const maintenanceInclude = {
  property: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  unit: {
    select: {
      id: true,
      name: true,
    },
  },
  documents: {
    select: {
      id: true,
      name: true,
      url: true,
      fileType: true,
    },
  },
} as const;

// Định nghĩa một type chi tiết hơn cho documents khi xem chi tiết
const maintenanceDetailInclude = {
  ...maintenanceInclude,
  documents: {
    select: {
      id: true,
      name: true,
      url: true,
      fileType: true,
      type: true,
      description: true,
    },
  },
} as const;

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới yêu cầu bảo trì
   */
  async create(createMaintenanceDto: CreateMaintenanceDto) {
    const { propertyId, unitId } = createMaintenanceDto;

    // Kiểm tra bất động sản tồn tại
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${propertyId}`);
    }

    // Nếu có unitId, kiểm tra unit tồn tại và thuộc property
    if (unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: {
          id: unitId,
          propertyId,
        },
      });

      if (!unit) {
        throw new NotFoundException(
          `Không tìm thấy unit với ID: ${unitId} thuộc bất động sản có ID: ${propertyId}`
        );
      }
    }

    // Tạo yêu cầu bảo trì
    return this.prisma.maintenanceRequest.create({
      data: {
        ...createMaintenanceDto,
        status: MaintenanceStatus.PENDING,
        scheduledDate: createMaintenanceDto.scheduledDate 
          ? new Date(createMaintenanceDto.scheduledDate) 
          : null,
      },
    });
  }

  /**
   * Tìm tất cả yêu cầu bảo trì với các bộ lọc
   */
  async findAll(query: QueryMaintenanceDto): Promise<PaginatedResult<any>> {
    const { 
      propertyId, 
      unitId, 
      status, 
      priority, 
      startDate, 
      endDate,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Xây dựng where condition
    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (unitId) {
      (where as any).unitId = unitId; // Type assertion cho unitId
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (priority && priority.length > 0) {
      where.priority = { in: priority };
    }

    if (startDate && endDate) {
      where.requestDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.requestDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.requestDate = {
        lte: new Date(endDate),
      };
    }

    // Count tổng số bản ghi phù hợp với điều kiện
    const total = await this.prisma.maintenanceRequest.count({ where });

    // Lấy dữ liệu với phân trang
    const data = await this.prisma.maintenanceRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: maintenanceInclude as any,
    });

    // Trả về kết quả phân trang
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tìm một yêu cầu bảo trì theo ID
   */
  async findOne(id: string) {
    const maintenance = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: maintenanceDetailInclude as any,
    });

    if (!maintenance) {
      throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID: ${id}`);
    }

    return maintenance;
  }

  /**
   * Tìm các yêu cầu bảo trì theo bất động sản
   */
  async findByProperty(propertyId: string, query: QueryMaintenanceDto) {
    // Kiểm tra bất động sản tồn tại
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${propertyId}`);
    }

    // Gọi method findAll với propertyId
    return this.findAll({
      ...query,
      propertyId,
    });
  }

  /**
   * Tìm các yêu cầu bảo trì theo unit
   */
  async findByUnit(unitId: string, query: QueryMaintenanceDto) {
    // Kiểm tra unit tồn tại
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy unit với ID: ${unitId}`);
    }

    // Gọi method findAll với unitId
    return this.findAll({
      ...query,
      unitId,
    });
  }

  /**
   * Cập nhật thông tin yêu cầu bảo trì
   */
  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    // Kiểm tra yêu cầu bảo trì tồn tại
    const maintenance = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!maintenance) {
      throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID: ${id}`);
    }

    // Cập nhật thông tin
    const dataToUpdate: any = { ...updateMaintenanceDto };

    // Xử lý các trường ngày tháng
    if (updateMaintenanceDto.scheduledDate) {
      dataToUpdate.scheduledDate = new Date(updateMaintenanceDto.scheduledDate);
    }
    
    if (updateMaintenanceDto.completedDate) {
      dataToUpdate.completedDate = new Date(updateMaintenanceDto.completedDate);
      
      // Tự động cập nhật status thành COMPLETED nếu có completedDate
      if (!updateMaintenanceDto.status) {
        dataToUpdate.status = MaintenanceStatus.COMPLETED;
      }
    }

    // Cập nhật trong DB
    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Xóa yêu cầu bảo trì
   */
  async remove(id: string) {
    // Kiểm tra yêu cầu bảo trì tồn tại
    const maintenance = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!maintenance) {
      throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID: ${id}`);
    }

    // Xóa các document liên quan (onDelete: SetNull đã được cấu hình trong schema)
    
    // Xóa yêu cầu bảo trì
    return this.prisma.maintenanceRequest.delete({
      where: { id },
    });
  }
} 