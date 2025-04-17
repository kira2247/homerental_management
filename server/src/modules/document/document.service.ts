import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto, QueryDocumentDto } from './dto';
import { Document, DocumentType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { FilesService } from '../files/files.service';
import { FileType } from '../files/enums/file-type.enum';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * Tạo mới tài liệu
   */
  async create(createDocumentDto: CreateDocumentDto, userId: string): Promise<Document> {
    const { 
      tenantId, 
      unitId, 
      propertyId, 
      vehicleId,
      maintenanceId,
      ...data 
    } = createDocumentDto;

    // Kiểm tra xem tenant có tồn tại nếu tenantId được cung cấp
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException(`Không tìm thấy người thuê với ID ${tenantId}`);
      }
    }

    // Kiểm tra xem unit có tồn tại nếu unitId được cung cấp
    if (unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });
      if (!unit) {
        throw new NotFoundException(`Không tìm thấy phòng/căn hộ với ID ${unitId}`);
      }
    }

    // Kiểm tra xem property có tồn tại nếu propertyId được cung cấp
    if (propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });
      if (!property) {
        throw new NotFoundException(`Không tìm thấy bất động sản với ID ${propertyId}`);
      }
    }

    // Kiểm tra xem vehicle có tồn tại nếu vehicleId được cung cấp
    if (vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Không tìm thấy phương tiện với ID ${vehicleId}`);
      }
    }

    // Kiểm tra xem maintenance request có tồn tại nếu maintenanceId được cung cấp
    if (maintenanceId) {
      const maintenance = await this.prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceId },
      });
      if (!maintenance) {
        throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID ${maintenanceId}`);
      }
    }

    // Tạo tài liệu mới
    return this.prisma.document.create({
      data: {
        ...data,
        tenant: tenantId ? { connect: { id: tenantId } } : undefined,
        unit: unitId ? { connect: { id: unitId } } : undefined,
        property: propertyId ? { connect: { id: propertyId } } : undefined,
        vehicle: vehicleId ? { connect: { id: vehicleId } } : undefined,
        maintenance: maintenanceId ? { connect: { id: maintenanceId } } : undefined,
        uploadedBy: { connect: { id: userId } },
      },
    });
  }

  /**
   * Tạo mới tài liệu với file đính kèm
   */
  async createWithFile(
    createDocumentDto: CreateDocumentDto, 
    file: Express.Multer.File, 
    userId: string,
    folderId?: string
  ): Promise<Document> {
    try {
      // 1. Upload file đến storage provider thích hợp
      const fileType = this.filesService.detectFileType(file.mimetype);
      // Sử dụng folderId nếu có, mặc định là 'documents'
      const uploadResult = await this.filesService.uploadFile(file, fileType, folderId || 'documents');
      
      // 2. Tạo document sử dụng kết quả upload
      const document = await this.create({
        ...createDocumentDto,
        fileType: fileType as any, // Convert enum to string for Prisma
        url: uploadResult.url,
        mimeType: uploadResult.mimetype,
        size: uploadResult.size,
        // Lưu thêm thông tin về storage provider để sau này có thể xóa
        description: createDocumentDto.description 
          ? `${createDocumentDto.description} [Storage: ${uploadResult.provider}|${uploadResult.id}]`
          : `[Storage: ${uploadResult.provider}|${uploadResult.id}]`,
      }, userId);
      
      return document;
    } catch (error) {
      throw new Error(`Không thể tạo tài liệu với file: ${error.message}`);
    }
  }

  /**
   * Tìm tất cả tài liệu với các tùy chọn lọc và phân trang
   */
  async findAll(queryDto: QueryDocumentDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      type,
      fileType,
      isImportant,
      tenantId,
      unitId,
      propertyId,
      vehicleId,
      maintenanceId,
      fromDate,
      toDate,
      expiryFromDate,
      expiryToDate,
    } = queryDto;

    // Xây dựng where condition từ query parameters
    const where: Prisma.DocumentWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (fileType && fileType.length > 0) {
      where.fileType = { in: fileType };
    }

    if (isImportant !== undefined) {
      where.isImportant = isImportant;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (maintenanceId) {
      where.maintenanceId = maintenanceId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    if (expiryFromDate || expiryToDate) {
      where.expiryDate = {};
      if (expiryFromDate) {
        where.expiryDate.gte = new Date(expiryFromDate);
      }
      if (expiryToDate) {
        where.expiryDate.lte = new Date(expiryToDate);
      }
    }

    // Đếm tổng số tài liệu phù hợp với điều kiện
    const total = await this.prisma.document.count({ where });

    // Tính toán số trang
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Lấy dữ liệu
    const data = await this.prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
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
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            type: true,
          },
        },
        maintenance: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Trả về kết quả với metadata
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Tìm một tài liệu theo ID
   */
  async findOne(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
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
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            type: true,
          },
        },
        maintenance: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Không tìm thấy tài liệu với ID ${id}`);
    }

    return document;
  }

  /**
   * Cập nhật tài liệu
   */
  async update(id: string, updateDocumentDto: UpdateDocumentDto): Promise<Document> {
    // Kiểm tra tài liệu tồn tại
    const existingDocument = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!existingDocument) {
      throw new NotFoundException(`Không tìm thấy tài liệu với ID ${id}`);
    }

    const { 
      tenantId, 
      unitId, 
      propertyId, 
      vehicleId,
      maintenanceId,
      ...data 
    } = updateDocumentDto;

    // Validate references if provided
    if (tenantId !== undefined) {
      if (tenantId === null) {
        data['tenantId'] = null;
      } else {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
        });
        if (!tenant) {
          throw new NotFoundException(`Không tìm thấy người thuê với ID ${tenantId}`);
        }
      }
    }

    if (unitId !== undefined) {
      if (unitId === null) {
        data['unitId'] = null;
      } else {
        const unit = await this.prisma.unit.findUnique({
          where: { id: unitId },
        });
        if (!unit) {
          throw new NotFoundException(`Không tìm thấy phòng/căn hộ với ID ${unitId}`);
        }
      }
    }

    if (propertyId !== undefined) {
      if (propertyId === null) {
        data['propertyId'] = null;
      } else {
        const property = await this.prisma.property.findUnique({
          where: { id: propertyId },
        });
        if (!property) {
          throw new NotFoundException(`Không tìm thấy bất động sản với ID ${propertyId}`);
        }
      }
    }

    if (vehicleId !== undefined) {
      if (vehicleId === null) {
        data['vehicleId'] = null;
      } else {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: vehicleId },
        });
        if (!vehicle) {
          throw new NotFoundException(`Không tìm thấy phương tiện với ID ${vehicleId}`);
        }
      }
    }

    if (maintenanceId !== undefined) {
      if (maintenanceId === null) {
        data['maintenanceId'] = null;
      } else {
        const maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id: maintenanceId },
        });
        if (!maintenance) {
          throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID ${maintenanceId}`);
        }
      }
    }

    // Cập nhật tài liệu
    return this.prisma.document.update({
      where: { id },
      data: {
        ...data,
        tenantId: tenantId === undefined ? undefined : tenantId,
        unitId: unitId === undefined ? undefined : unitId,
        propertyId: propertyId === undefined ? undefined : propertyId,
        vehicleId: vehicleId === undefined ? undefined : vehicleId,
        maintenanceId: maintenanceId === undefined ? undefined : maintenanceId,
      },
    });
  }

  /**
   * Xóa tài liệu và file đính kèm
   */
  async remove(id: string): Promise<Document> {
    // Kiểm tra tài liệu tồn tại
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException(`Không tìm thấy tài liệu với ID ${id}`);
    }

    // Extract storage info from description (if available)
    const storageMatch = document.description?.match(/\[Storage: (.*?)\|(.*?)\]/);
    if (storageMatch) {
      const provider = storageMatch[1];
      const fileId = storageMatch[2];
      
      try {
        // Xóa file từ storage provider
        await this.filesService.deleteFile(fileId, provider);
      } catch (error) {
        console.error(`Lỗi xóa file: ${error.message}`);
        // Vẫn tiếp tục xóa document ngay cả khi không xóa được file
      }
    }

    // Xóa tài liệu
    return this.prisma.document.delete({
      where: { id },
    });
  }

  /**
   * Tìm tài liệu theo tenant
   */
  async findByTenant(tenantId: string, queryDto: QueryDocumentDto) {
    // Kiểm tra tenant tồn tại
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy người thuê với ID ${tenantId}`);
    }

    // Sử dụng lại findAll với tenantId được chỉ định
    return this.findAll({ ...queryDto, tenantId });
  }

  /**
   * Tìm tài liệu theo unit
   */
  async findByUnit(unitId: string, queryDto: QueryDocumentDto) {
    // Kiểm tra unit tồn tại
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException(`Không tìm thấy phòng/căn hộ với ID ${unitId}`);
    }

    // Sử dụng lại findAll với unitId được chỉ định
    return this.findAll({ ...queryDto, unitId });
  }

  /**
   * Tìm tài liệu theo property
   */
  async findByProperty(propertyId: string, queryDto: QueryDocumentDto) {
    // Kiểm tra property tồn tại
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID ${propertyId}`);
    }

    // Sử dụng lại findAll với propertyId được chỉ định
    return this.findAll({ ...queryDto, propertyId });
  }

  /**
   * Tìm tài liệu theo vehicle
   */
  async findByVehicle(vehicleId: string, queryDto: QueryDocumentDto) {
    // Kiểm tra vehicle tồn tại
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Không tìm thấy phương tiện với ID ${vehicleId}`);
    }

    // Sử dụng lại findAll với vehicleId được chỉ định
    return this.findAll({ ...queryDto, vehicleId });
  }

  /**
   * Tìm tài liệu theo maintenance
   */
  async findByMaintenance(maintenanceId: string, queryDto: QueryDocumentDto) {
    // Kiểm tra maintenance tồn tại
    const maintenance = await this.prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },
    });

    if (!maintenance) {
      throw new NotFoundException(`Không tìm thấy yêu cầu bảo trì với ID ${maintenanceId}`);
    }

    // Sử dụng lại findAll với maintenanceId được chỉ định
    return this.findAll({ ...queryDto, maintenanceId });
  }
} 