import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { propertyLogger } from '../../common/logging';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Property, PropertyStatus, PropertyType } from '@prisma/client';
import { CreatePropertyDto, UpdatePropertyDto, QueryPropertyDto } from './dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto): Promise<ApiResponse<Property>> {
    // DEBUG LOGS - REMOVE AFTER DEBUGGING
    propertyLogger.log('=== CREATE PROPERTY START ===');
    propertyLogger.debug('Received DTO:', JSON.stringify(createPropertyDto));
    
    try {
      propertyLogger.debug('Validating DTO values before creating property');
      
      // Log type conversions for numeric fields
      propertyLogger.debug('Numeric field checks:');
      propertyLogger.debug(`- defaultElectricityRate: ${typeof createPropertyDto.defaultElectricityRate} ${createPropertyDto.defaultElectricityRate}`);
      propertyLogger.debug(`- defaultWaterRate: ${typeof createPropertyDto.defaultWaterRate} ${createPropertyDto.defaultWaterRate}`);
      propertyLogger.debug(`- defaultInternetRate: ${typeof createPropertyDto.defaultInternetRate} ${createPropertyDto.defaultInternetRate}`);
      propertyLogger.debug(`- defaultGarbageRate: ${typeof createPropertyDto.defaultGarbageRate} ${createPropertyDto.defaultGarbageRate}`);
      propertyLogger.debug(`- parkingFee: ${typeof createPropertyDto.parkingFee} ${createPropertyDto.parkingFee}`);
      
      // Log boolean fields
      propertyLogger.debug('Boolean field checks:');
      propertyLogger.debug(`- hasSecurity: ${typeof createPropertyDto.hasSecurity} ${createPropertyDto.hasSecurity}`);
      propertyLogger.debug(`- hasElevator: ${typeof createPropertyDto.hasElevator} ${createPropertyDto.hasElevator}`);
      propertyLogger.debug(`- hasParking: ${typeof createPropertyDto.hasParking} ${createPropertyDto.hasParking}`);
      
      // Log critical ID fields
      propertyLogger.debug('ID field checks:');
      propertyLogger.debug(`- userId: ${createPropertyDto.userId}`);
      propertyLogger.debug(`- ownerId: ${createPropertyDto.ownerId}`);
      
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
        thumbnail: null,
        thumbnailId: null,
      };
      
      propertyLogger.debug('Final data being sent to Prisma:', JSON.stringify(propertyData));
      
      // Tạo bất động sản mới trong DB
      const property = await this.prisma.property.create({
        data: propertyData,
      });

      propertyLogger.log(`Property created successfully with ID: ${property.id}`);
      
      // Kiểm tra kết quả trước khi trả về
      if (!property || !property.id) {
        propertyLogger.error('Critical Error: Property created but has no ID or is invalid');
        throw new Error('Error creating property: Invalid property data');
      }
      
      // Log đối tượng đầy đủ để dễ debug
      propertyLogger.debug('Complete property object returned from database:');
      propertyLogger.debug(JSON.stringify(property, null, 2));
      
      // Đảm bảo tất cả các trường quan trọng đều có giá trị
      if (!property.id || !property.name || !property.ownerId) {
        propertyLogger.warn('Warning: Created property missing important fields');
        propertyLogger.warn(`- id: ${property.id}`);
        propertyLogger.warn(`- name: ${property.name}`);
        propertyLogger.warn(`- ownerId: ${property.ownerId}`);
      }
      
      // Trả về kết quả đầy đủ
      const response: ApiResponse<Property> = {
        success: true,
        data: property
      };
      
      propertyLogger.log('=== CREATE PROPERTY COMPLETED SUCCESSFULLY ===');
      propertyLogger.debug('Final API response:');
      propertyLogger.debug(JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      propertyLogger.error('=== CREATE PROPERTY ERROR ===');
      propertyLogger.error('Error creating property:', error);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        propertyLogger.error('Prisma error code:', error.code);
        propertyLogger.error('Prisma error message:', error.message);
        
        if (error.code === 'P2003') {
          propertyLogger.error('Foreign key constraint failed - invalid userId or ownerId');
          throw new BadRequestException('ID người dùng hoặc chủ sở hữu không hợp lệ');
        }
      }
      
      propertyLogger.error('=== CREATE PROPERTY ERROR END ===');
      
      // Trả về response lỗi chi tiết
      const errorResponse: ApiResponse<Property> = {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error creating property',
          code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'UNKNOWN_ERROR'
        }
      };
      
      propertyLogger.debug('Error response being returned:');
      propertyLogger.debug(JSON.stringify(errorResponse, null, 2));
      
      throw error;
    }
  }

  async findAll(queryDto: QueryPropertyDto) {
    propertyLogger.log('=== FINDING ALL PROPERTIES ===');
    propertyLogger.debug(`Query parameters: ${JSON.stringify(queryDto)}`);
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

    const result = {
      data: propertiesWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  
    propertyLogger.log(`Found ${total} properties, returning ${propertiesWithCounts.length} items for page ${page}`);
    propertyLogger.log('=== COMPLETED FINDING ALL PROPERTIES ===');
    return result;
  }

  /**
   * Tìm kiếm property theo ID
   * @param id ID của property cần tìm
   * @returns ApiResponse với property nếu tìm thấy, hoặc lỗi nếu không tìm thấy
   */
  async findOne(id: string): Promise<ApiResponse<Property & { unitCount: number; vacantUnitCount: number; estimatedMonthlyRevenue: number; units: any[] }>> {
    propertyLogger.log(`=== FINDING PROPERTY WITH ID: ${id} ===`);
    
    try {
      const property = await this.prisma.property.findUnique({
        where: { id },
      });

      if (!property) {
        return {
          success: false,
          error: {
            message: `Không tìm thấy bất động sản với ID: ${id}`,
            code: 'PROPERTY_NOT_FOUND'
          }
        };
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

      const result = {
        ...property,
        unitCount,
        vacantUnitCount,
        estimatedMonthlyRevenue,
        units,
      };
      
      propertyLogger.log(`=== COMPLETED FINDING PROPERTY WITH ID: ${id} ===`);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      propertyLogger.error(`Lỗi khi tìm property ID ${id}: ${error.message}`);
      return {
        success: false,
        error: {
          message: `Có lỗi xảy ra: ${error.message}`,
          code: 'FIND_PROPERTY_ERROR',
          details: error
        }
      };
    }
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string): Promise<ApiResponse<Property>> {
    propertyLogger.log(`=== UPDATING PROPERTY WITH ID: ${id} ===`);
    propertyLogger.debug(`Update data: ${JSON.stringify(updatePropertyDto)}`);
    propertyLogger.debug(`User ID performing update: ${userId}`);
    
    try {
      // Kiểm tra xem property có tồn tại không
      const property = await this.prisma.property.findUnique({
        where: { id },
      });

      if (!property) {
        propertyLogger.warn(`Property with ID ${id} not found for update`);
        return {
          success: false,
          error: {
            message: `Không tìm thấy bất động sản với ID: ${id}`,
            code: 'PROPERTY_NOT_FOUND'
          }
        };
      }

      // Kiểm tra quyền: chỉ owner hoặc người tạo mới có thể cập nhật
      if (property.ownerId !== userId && property.userId !== userId) {
        propertyLogger.warn(`User ${userId} attempted to update property ${id} without permission`);
        return {
          success: false,
          error: {
            message: 'Bạn không có quyền cập nhật bất động sản này',
            code: 'ACCESS_DENIED'
          }
        };
      }
      propertyLogger.debug(`User ${userId} has permission to update property ${id}`);

      // Cập nhật property (không bao gồm thumbnail)
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
          // Đã loại bỏ cập nhật thumbnail và thumbnailId
        },
      });

      propertyLogger.log(`Successfully updated property with ID: ${id}`);
      return {
        success: true,
        data: updatedProperty,
      };
    } catch (error) {
      propertyLogger.error(`Error updating property with ID: ${id}`, error);
      return {
        success: false,
        error: {
          message: `Không thể cập nhật bất động sản: ${error.message}`,
          code: 'UPDATE_PROPERTY_ERROR',
          details: error
        }
      };
    }
  }

  async remove(id: string, userId: string, forceDelete: boolean = false) {
    propertyLogger.log(`=== REMOVING PROPERTY WITH ID: ${id} ===`);
    propertyLogger.log(`Bắt đầu quá trình xóa property ID: ${id} bởi user ID: ${userId}, forceDelete: ${forceDelete}`);
    
    // Kiểm tra xem property có tồn tại không
    propertyLogger.debug(`Kiểm tra sự tồn tại của property ID: ${id}`);
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      propertyLogger.warn(`Property ID: ${id} không tồn tại trong hệ thống`);
      throw new NotFoundException(`Không tìm thấy bất động sản với ID: ${id}`);
    }
    propertyLogger.debug(`Tìm thấy property: ${property.name}, ID: ${id}`);

    // Kiểm tra quyền: chỉ owner hoặc người tạo mới có thể xóa
    propertyLogger.debug(`Kiểm tra quyền xóa: User ID: ${userId}, Property Owner ID: ${property.ownerId}, Property Creator ID: ${property.userId}`);
    if (property.ownerId !== userId && property.userId !== userId) {
      propertyLogger.warn(`User ${userId} cố gắng xóa property ${id} mà không có quyền. Owner ID: ${property.ownerId}, Creator ID: ${property.userId}`);
      throw new ForbiddenException('Bạn không có quyền xóa bất động sản này');
    }
    propertyLogger.log(`User ${userId} có quyền xóa property ${id} - ${property.name}`);

    // Kiểm tra tất cả các ràng buộc liên quan đến property
    const [
      unitCount,
      maintenanceCount,
      documentCount,
      billCount
    ] = await Promise.all([
      this.prisma.unit.count({ where: { propertyId: id } }),
      this.prisma.maintenanceRequest.count({ where: { propertyId: id } }),
      this.prisma.document.count({ where: { propertyId: id } }),
      this.prisma.bill.count({ where: { propertyId: id } })
    ]);

    // Tạo đối tượng chứa thông tin về dữ liệu liên quan
    const relatedData = {
      units: unitCount,
      maintenanceRequests: maintenanceCount,
      documents: documentCount,
      bills: billCount
    };

    // Nếu có dữ liệu liên quan và không phải force delete, trả về lỗi với thông tin chi tiết
    const hasRelatedData = unitCount > 0 || maintenanceCount > 0 || documentCount > 0 || billCount > 0;
    
    if (hasRelatedData && !forceDelete) {
      // Tạo thông báo về dữ liệu liên quan
      const relatedDataMessages = [];
      if (unitCount > 0) relatedDataMessages.push(`${unitCount} đơn vị`);
      if (maintenanceCount > 0) relatedDataMessages.push(`${maintenanceCount} yêu cầu bảo trì`);
      if (documentCount > 0) relatedDataMessages.push(`${documentCount} tài liệu`);
      if (billCount > 0) relatedDataMessages.push(`${billCount} hóa đơn`);

      const errorMessage = `Không thể xóa bất động sản này vì vẫn còn dữ liệu liên quan: ${relatedDataMessages.join(', ')}. Sử dụng force=true để xóa tất cả.`;
      propertyLogger.warn(`Không thể xóa property ID: ${id} - ${property.name}: ${errorMessage}`);
      
      // Tạo response object
      const responseObj = {
        success: false,
        error: {
          message: errorMessage,
          code: 'PROPERTY_HAS_RELATED_DATA',
          details: { relatedData }
        }
      };
      
      // Trả về lỗi với thông tin chi tiết về dữ liệu liên quan
      return responseObj;
    }
    
    if (!hasRelatedData) {
      propertyLogger.log(`Property ID: ${id} - ${property.name} không có dữ liệu liên quan và có thể xóa an toàn`);
    } else {
      propertyLogger.warn(`Property ID: ${id} - ${property.name} có dữ liệu liên quan và sẽ được force delete`);
    }

    // Bắt đầu transaction để xóa property và tất cả dữ liệu liên quan
    try {
      // Xóa property và tất cả dữ liệu liên quan trong một transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Xóa tất cả units liên quan đến property (nếu có)
        if (unitCount > 0) {

          await prisma.unit.deleteMany({
            where: { propertyId: id },
          });

        }
        
        // Xóa tất cả documents liên quan đến property (nếu có)
        if (documentCount > 0) {

          await prisma.document.deleteMany({
            where: { propertyId: id },
          });

        }

        // Xóa tất cả maintenance requests liên quan đến property (nếu có)
        if (maintenanceCount > 0) {

          await prisma.maintenanceRequest.deleteMany({
            where: { propertyId: id },
          });

        }

        // Xóa tất cả bills liên quan đến property (nếu có)
        if (billCount > 0) {

          await prisma.bill.deleteMany({
            where: { propertyId: id },
          });

        }

        // Xóa property

        const deletedProperty = await prisma.property.delete({
          where: { id },
        });

        
        return deletedProperty;
      });

      propertyLogger.log(`=== XÓA THÀNH CÔNG PROPERTY ID: ${id} - ${property.name} VÀ TẤT CẢ DỮ LIỆU LIÊN QUAN ===`);
      
      // Tạo audit log với thông tin về force delete

      await this.prisma.auditLog.create({
        data: {
          action: 'DELETE_PROPERTY',
          entityType: 'Property',
          entityId: id,
          description: `Xóa bất động sản: ${property.name}${forceDelete ? ' (force delete)' : ''}`,
          userId: userId,
          metadata: { 
            propertyName: property.name, 
            propertyAddress: property.address,
            forceDelete,
            relatedData
          }
        }
      });

      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errorResponse = {
        success: false,
        error: {
          message: `Có lỗi xảy ra khi xóa bất động sản: ${error.message}`,
          code: error.code || 'DELETE_PROPERTY_ERROR'
        }
      };
      
      return errorResponse;;
    }
  }

  async getPropertySummary(id: string) {
    propertyLogger.log(`=== GETTING PROPERTY SUMMARY FOR ID: ${id} ===`);
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

    const result = {
      ...property,
      unitCount,
      occupiedUnitCount,
      vacantUnitCount,
      occupancyRate,
      estimatedMonthlyRevenue: totalRevenue._sum.price || 0,
      pendingMaintenanceCount: maintenanceCount,
    };
  
  propertyLogger.log(`Successfully generated summary for property with ID: ${id}`);
  propertyLogger.log(`=== COMPLETED PROPERTY SUMMARY FOR ID: ${id} ===`);
  return result;
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

  /**
   * Cập nhật URL thumbnail cho một property
   * @param id ID của property cần cập nhật
   * @param thumbnailUrl URL của thumbnail mới
   * @returns Promise<ApiResponse<Property>> Property đã được cập nhật
   */
  async updateThumbnail(id: string, thumbnailUrl: string, userId: string, thumbnailId?: string): Promise<ApiResponse<Property>> {
    propertyLogger.log(`=== UPDATING THUMBNAIL FOR PROPERTY ID: ${id} ===`);
    propertyLogger.debug(`New thumbnail URL: ${thumbnailUrl}`);
    propertyLogger.debug(`User ID performing thumbnail update: ${userId}`);
    
    try {
      // Kiểm tra property có tồn tại không
      const existingProperty = await this.prisma.property.findUnique({
        where: { id },
      });

      if (!existingProperty) {
        propertyLogger.warn(`Property with ID ${id} not found for thumbnail update`);
        return {
          success: false,
          error: {
            message: `Không tìm thấy bất động sản với ID: ${id}`,
            code: 'PROPERTY_NOT_FOUND'
          }
        };
      }

      // Kiểm tra quyền: chỉ owner hoặc người tạo mới có thể cập nhật
      if (existingProperty.ownerId !== userId && existingProperty.userId !== userId) {
        propertyLogger.warn(`User ${userId} attempted to update thumbnail for property ${id} without permission`);
        return {
          success: false,
          error: {
            message: 'Bạn không có quyền cập nhật thumbnail cho bất động sản này',
            code: 'ACCESS_DENIED'
          }
        };
      }
      propertyLogger.debug(`User ${userId} has permission to update thumbnail for property ${id}`);

      // Cập nhật thumbnail URL
      const updatedProperty = await this.prisma.property.update({
        where: { id },
        data: { thumbnail: thumbnailUrl, thumbnailId: thumbnailId || undefined },
      });

      propertyLogger.log(`Successfully updated thumbnail for property ${id}`);
      
      return {
        success: true,
        data: updatedProperty
      };
    } catch (error) {
      propertyLogger.error(`Error updating thumbnail for property ${id}: ${error.message}`);
      return {
        success: false,
        error: {
          message: `Có lỗi xảy ra khi cập nhật thumbnail: ${error.message}`,
          code: 'UPDATE_THUMBNAIL_ERROR',
          details: error
        }
      };
    }
  }
}
