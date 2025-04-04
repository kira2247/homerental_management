import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Property, PropertyStatus, PropertyType } from '@prisma/client';
import { CreatePropertyDto, UpdatePropertyDto, QueryPropertyDto } from './dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<ApiResponse<Property>> {
    // DEBUG LOGS - REMOVE AFTER DEBUGGING
    console.log('=== PROPERTY SERVICE: CREATE PROPERTY START ===');
    console.log('Received DTO:', JSON.stringify(createPropertyDto));
    
    try {
      console.log('Validating DTO values before creating property');
      
      // Log type conversions for numeric fields
      console.log('Numeric field checks:');
      console.log('- defaultElectricityRate:', typeof createPropertyDto.defaultElectricityRate, createPropertyDto.defaultElectricityRate);
      console.log('- defaultWaterRate:', typeof createPropertyDto.defaultWaterRate, createPropertyDto.defaultWaterRate);
      console.log('- defaultInternetRate:', typeof createPropertyDto.defaultInternetRate, createPropertyDto.defaultInternetRate);
      console.log('- defaultGarbageRate:', typeof createPropertyDto.defaultGarbageRate, createPropertyDto.defaultGarbageRate);
      console.log('- parkingFee:', typeof createPropertyDto.parkingFee, createPropertyDto.parkingFee);
      
      // Log boolean fields
      console.log('Boolean field checks:');
      console.log('- hasSecurity:', typeof createPropertyDto.hasSecurity, createPropertyDto.hasSecurity);
      console.log('- hasElevator:', typeof createPropertyDto.hasElevator, createPropertyDto.hasElevator);
      console.log('- hasParking:', typeof createPropertyDto.hasParking, createPropertyDto.hasParking);
      
      // Log critical ID fields
      console.log('ID field checks:');
      console.log('- userId:', createPropertyDto.userId);
      console.log('- ownerId:', createPropertyDto.ownerId);
      
      // Prepare data object for creating property
      const propertyData = {
        name: createPropertyDto.name,
        address: createPropertyDto.address,
        city: createPropertyDto.city,
        district: createPropertyDto.district,
        ward: createPropertyDto.ward,
        type: createPropertyDto.type,
        status: createPropertyDto.status || PropertyStatus.AVAILABLE,
        defaultElectricityRate: createPropertyDto.defaultElectricityRate || 0,
        defaultWaterRate: createPropertyDto.defaultWaterRate || 0,
        defaultInternetRate: createPropertyDto.defaultInternetRate || 0,
        defaultGarbageRate: createPropertyDto.defaultGarbageRate || 0,
        defaultOtherFees: createPropertyDto.defaultOtherFees as Prisma.JsonValue,
        hasSecurity: createPropertyDto.hasSecurity || false,
        hasElevator: createPropertyDto.hasElevator || false,
        hasParking: createPropertyDto.hasParking || false,
        parkingFee: createPropertyDto.parkingFee,
        additionalFacilities: createPropertyDto.additionalFacilities as Prisma.JsonValue,
        userId: createPropertyDto.userId,
        ownerId: createPropertyDto.ownerId,
        thumbnail: createPropertyDto.thumbnail || '/images/WMallingshowhome-67-720x479.jpg',
      };
      
      console.log('Final data being sent to Prisma:', JSON.stringify(propertyData));
      
      // Tạo bất động sản mới trong DB
      const property = await this.prisma.property.create({
        data: propertyData,
      });

      console.log('Property created successfully with ID:', property.id);
      
      // Kiểm tra kết quả trước khi trả về
      if (!property || !property.id) {
        console.error('Critical Error: Property created but has no ID or is invalid');
        throw new Error('Error creating property: Invalid property data');
      }
      
      // Log đối tượng đầy đủ để dễ debug
      console.log('Complete property object returned from database:');
      console.log(JSON.stringify(property, null, 2));
      
      // Đảm bảo tất cả các trường quan trọng đều có giá trị
      if (!property.id || !property.name || !property.ownerId) {
        console.warn('Warning: Created property missing important fields');
        console.warn('- id:', property.id);
        console.warn('- name:', property.name);
        console.warn('- ownerId:', property.ownerId);
      }
      
      // Trả về kết quả đầy đủ
      const response: ApiResponse<Property> = {
        success: true,
        data: property
      };
      
      console.log('=== PROPERTY SERVICE: CREATE PROPERTY COMPLETED SUCCESSFULLY ===');
      console.log('Final API response:');
      console.log(JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error('=== PROPERTY SERVICE: CREATE PROPERTY ERROR ===');
      console.error('Error creating property:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error message:', error.message);
        
        if (error.code === 'P2003') {
          console.error('Foreign key constraint failed - invalid userId or ownerId');
          throw new BadRequestException('ID người dùng hoặc chủ sở hữu không hợp lệ');
        }
      }
      
      console.error('=== PROPERTY SERVICE: CREATE PROPERTY ERROR END ===');
      
      // Trả về response lỗi chi tiết
      const errorResponse: ApiResponse<Property> = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error creating property',
          code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'UNKNOWN_ERROR'
        }
      };
      
      console.log('Error response being returned:');
      console.log(JSON.stringify(errorResponse, null, 2));
      
      throw error;
    }
  }

  async findAll(queryDto: QueryPropertyDto) {
    const {
      page = 1,
      limit = 10,
      search,
      city,
      district,
      status,
      type,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Xây dựng điều kiện tìm kiếm
    const where: Prisma.PropertyWhereInput = {};

    // Tìm kiếm theo tên hoặc địa chỉ
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Các điều kiện lọc khác
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (district) where.district = { contains: district, mode: 'insensitive' };
    if (status) where.status = status;
    if (type) where.type = type;
    if (ownerId) where.ownerId = ownerId;

    // Thực hiện truy vấn với phân trang và sắp xếp
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Thêm thông tin bổ sung cho mỗi property (số lượng units)
    const propertiesWithCounts = await Promise.all(
      data.map(async (property) => {
        const [unitCount, vacantUnitCount] = await Promise.all([
          this.prisma.unit.count({
            where: { propertyId: property.id },
          }),
          this.prisma.unit.count({
            where: { 
              propertyId: property.id,
              status: 'VACANT'
            },
          }),
        ]);
        
        return {
          ...property,
          unitCount,
          vacantUnitCount,
        };
      }),
    );

    return {
      data: propertiesWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${id}`);
    }

    // Thêm thông tin bổ sung
    const [unitCount, vacantUnitCount, units] = await Promise.all([
      this.prisma.unit.count({
        where: { propertyId: id },
      }),
      this.prisma.unit.count({
        where: { 
          propertyId: id,
          status: 'VACANT'
        },
      }),
      this.prisma.unit.findMany({
        where: { propertyId: id },
        select: { id: true, name: true, status: true, price: true },
      }),
    ]);

    // Tính toán doanh thu ước tính từ các unit
    const estimatedMonthlyRevenue = units.reduce((total, unit) => {
      // Chỉ tính các unit đang có người thuê
      if (unit.status === 'OCCUPIED') {
        return total + unit.price;
      }
      return total;
    }, 0);

    return {
      ...property,
      unitCount,
      vacantUnitCount,
      estimatedMonthlyRevenue,
      units,
    };
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
    // Kiểm tra xem property có tồn tại không
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${id}`);
    }

    // Kiểm tra quyền: chỉ owner hoặc người tạo mới có thể cập nhật
    if (property.ownerId !== userId && property.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật bất động sản này');
    }

    try {
      const updatedProperty = await this.prisma.property.update({
        where: { id },
        data: {
          name: updatePropertyDto.name,
          address: updatePropertyDto.address,
          city: updatePropertyDto.city,
          district: updatePropertyDto.district,
          ward: updatePropertyDto.ward,
          type: updatePropertyDto.type,
          status: updatePropertyDto.status,
          defaultElectricityRate: updatePropertyDto.defaultElectricityRate,
          defaultWaterRate: updatePropertyDto.defaultWaterRate,
          defaultInternetRate: updatePropertyDto.defaultInternetRate,
          defaultGarbageRate: updatePropertyDto.defaultGarbageRate,
          defaultOtherFees: updatePropertyDto.defaultOtherFees as Prisma.JsonValue,
          hasSecurity: updatePropertyDto.hasSecurity,
          hasElevator: updatePropertyDto.hasElevator,
          hasParking: updatePropertyDto.hasParking,
          parkingFee: updatePropertyDto.parkingFee,
          additionalFacilities: updatePropertyDto.additionalFacilities as Prisma.JsonValue,
          thumbnail: updatePropertyDto.thumbnail || undefined,
        },
      });

      return {
        success: true,
        data: updatedProperty,
      };
    } catch (error) {
      throw new Error('Không thể cập nhật bất động sản');
    }
  }

  async remove(id: string, userId: string) {
    // Kiểm tra xem property có tồn tại không
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${id}`);
    }

    // Kiểm tra quyền: chỉ owner hoặc người tạo mới có thể xóa
    if (property.ownerId !== userId && property.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bất động sản này');
    }

    // Kiểm tra xem property có units không
    const unitCount = await this.prisma.unit.count({
      where: { propertyId: id },
    });

    if (unitCount > 0) {
      throw new BadRequestException(
        'Không thể xóa bất động sản này vì đang có các đơn vị thuộc về nó. Vui lòng xóa các đơn vị trước.',
      );
    }

    return this.prisma.property.delete({
      where: { id },
    });
  }

  async getPropertySummary(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { 
        id: true,
        name: true,
        city: true,
        district: true,
        status: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${id}`);
    }

    const [unitCount, occupiedUnitCount, vacantUnitCount, totalRevenue, maintenanceCount] = await Promise.all([
      this.prisma.unit.count({
        where: { propertyId: id },
      }),
      this.prisma.unit.count({
        where: { 
          propertyId: id,
          status: 'OCCUPIED'
        },
      }),
      this.prisma.unit.count({
        where: { 
          propertyId: id,
          status: 'VACANT'
        },
      }),
      this.prisma.unit.aggregate({
        where: { 
          propertyId: id,
          status: 'OCCUPIED'
        },
        _sum: {
          price: true,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: { 
          propertyId: id,
          status: {
            in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
          }
        },
      }),
    ]);

    const occupancyRate = unitCount > 0 ? (occupiedUnitCount / unitCount) * 100 : 0;

    return {
      ...property,
      unitCount,
      occupiedUnitCount,
      vacantUnitCount,
      occupancyRate,
      estimatedMonthlyRevenue: totalRevenue._sum.price || 0,
      pendingMaintenanceCount: maintenanceCount,
    };
  }

  // Phương thức để kiểm tra quyền sở hữu
  async validateOwnership(propertyId: string, userId: string): Promise<boolean> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${propertyId}`);
    }

    return property.ownerId === userId || property.userId === userId;
  }
}
