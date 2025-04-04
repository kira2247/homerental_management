/**
 * Standardized API Response Types
 */

/**
 * Base API response structure
 */
export interface ApiBaseResponse<T> {
  success: boolean;
  message?: string;
  timestamp?: string;
}

/**
 * Error response structure
 */
export interface ApiErrorResponse extends ApiBaseResponse<null> {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T> extends ApiBaseResponse<T> {
  success: true;
  data: T;
}

/**
 * Union type for all possible API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Utility type to extract the data type from an API response
 */
export type UnwrapApiResponse<T> = T extends ApiSuccessResponse<infer U> ? U : never;

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication errors (100-199)
  UNAUTHORIZED = "AUTH_001",
  INVALID_CREDENTIALS = "AUTH_002",
  TOKEN_EXPIRED = "AUTH_003",
  ACCESS_DENIED = "AUTH_004",
  
  // Resource errors (200-299)
  RESOURCE_NOT_FOUND = "RES_001",
  RESOURCE_ALREADY_EXISTS = "RES_002",
  RESOURCE_CONFLICT = "RES_003",
  
  // Validation errors (300-399)
  VALIDATION_ERROR = "VAL_001",
  INVALID_REQUEST = "VAL_002",
  INVALID_PARAMETER = "VAL_003",
  
  // System errors (400-499)
  INTERNAL_ERROR = "SYS_001",
  SERVICE_UNAVAILABLE = "SYS_002",
  DATABASE_ERROR = "SYS_003",
  PARSE_ERROR = "SYS_004",
  
  // Business logic errors (500-599)
  BUSINESS_RULE_VIOLATION = "BUS_001",
  OPERATION_NOT_ALLOWED = "BUS_002",
  
  // File/upload errors (600-699)
  FILE_UPLOAD_ERROR = "FILE_001",
  FILE_SIZE_EXCEEDED = "FILE_002",
  INVALID_FILE_TYPE = "FILE_003",
  
  // Rate limiting (700-799)
  RATE_LIMIT_EXCEEDED = "RATE_001"
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestOptions {
  signal?: AbortSignal;
  cache?: RequestCache;
  headers?: Record<string, string>;
}

export enum PropertyStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
  INACTIVE = "INACTIVE"
}

export enum PropertyType {
  APARTMENT = "APARTMENT",
  HOUSE = "HOUSE",
  VILLA = "VILLA",
  OFFICE = "OFFICE",
  SHOP = "SHOP"
}

export interface PropertyFilters {
  type?: PropertyType;
  status?: PropertyStatus;
  sortBy?: 'price' | 'area' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  type: PropertyType;
  status: PropertyStatus;
  thumbnail?: string;
  images?: string[];
  description?: string;
  defaultElectricityRate: number;
  defaultWaterRate: number;
  defaultInternetRate: number;
  defaultGarbageRate: number;
  defaultOtherFees: Record<string, any>;
  hasSecurity: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  parkingFee?: number;
  additionalFacilities: Record<string, any>;
  userId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  unitCount?: number;
  vacantUnitCount?: number;
}

export enum UnitStatus {
  VACANT = "VACANT",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED",
  INACTIVE = "INACTIVE"
}

export interface Unit {
  id: string;
  name: string;
  floor?: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  depositAmount: number;
  status: UnitStatus;
  electricityRate: number;
  waterRate: number;
  internetRate: number;
  garbageRate: number;
  maintenanceFee: number;
  hasFurniture: boolean;
  hasAirCon: boolean;
  hasWaterHeater: boolean;
  hasBalcony: boolean;
  propertyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  CONTRACT = "CONTRACT",
  LEASE = "LEASE",
  INVOICE = "INVOICE",
  RECEIPT = "RECEIPT",
  MAINTENANCE = "MAINTENANCE",
  LEGAL = "LEGAL",
  INSURANCE = "INSURANCE",
  OTHER = "OTHER"
}

export enum FileType {
  PDF = "PDF",
  WORD = "WORD",
  EXCEL = "EXCEL",
  IMAGE = "IMAGE",
  TEXT = "TEXT",
  OTHER = "OTHER"
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileType: FileType;
  url: string;
  mimeType?: string;
  size?: number;
  isImportant: boolean;
  description?: string;
  expiryDate?: Date;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  maintenanceId?: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
} 