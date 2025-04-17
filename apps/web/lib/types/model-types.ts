/**
 * Model Types
 * Định nghĩa các interface cho các model chính trong ứng dụng
 */

// Property related types
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  status: PropertyStatus;
  type: PropertyType;
  thumbnail?: string;
  thumbnailId?: string;
  ownerId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  defaultElectricityRate: number;
  defaultWaterRate: number;
  defaultInternetRate: number;
  defaultGarbageRate: number;
  defaultOtherFees?: Record<string, any>;
  hasSecurity: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  parkingFee: number;
  additionalFacilities?: Record<string, any>;
  unitCount?: number;
  vacantUnitCount?: number;
  description?: string;
  images?: string[];
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  OFFICE = 'OFFICE',
  SHOP = 'SHOP'
}

// Unit related types
export interface Unit {
  id: string;
  name: string;
  propertyId: string;
  status: UnitStatus;
  floor?: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  depositAmount: number;
  electricityRate: number;
  waterRate: number;
  internetRate: number;
  garbageRate: number;
  maintenanceFee: number;
  otherFees?: Record<string, any>;
  hasFurniture: boolean;
  hasAirCon: boolean;
  hasWaterHeater: boolean;
  hasBalcony: boolean;
  furnitureDetails?: Record<string, any>;
  hasUtilityManagement: boolean;
  hasSeparateElectricMeter: boolean;
  hasSeparateWaterMeter: boolean;
  usesTieredElectricityPricing: boolean;
  electricityTiers?: Record<string, any>;
  initialElectricityReading?: number;
  initialWaterReading?: number;
  initialReadingDate?: string;
  handoverDate?: string;
  lastElectricityReading?: number;
  lastWaterReading?: number;
  lastReadingDate?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  tenantUnits?: TenantUnit[];
}

export enum UnitStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
  INACTIVE = 'INACTIVE'
}

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BEDROOM = 'ONE_BEDROOM',
  TWO_BEDROOM = 'TWO_BEDROOM',
  THREE_BEDROOM = 'THREE_BEDROOM',
  PENTHOUSE = 'PENTHOUSE',
  DUPLEX = 'DUPLEX',
  LOFT = 'LOFT',
  APARTMENT = 'APARTMENT',
  ROOM = 'ROOM',
  HOUSE = 'HOUSE',
  VILLA = 'VILLA',
  OFFICE = 'OFFICE',
  RETAIL = 'RETAIL',
  WAREHOUSE = 'WAREHOUSE',
  OTHER = 'OTHER'
}

// User related types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  OWNER = 'OWNER',
  TENANT = 'TENANT'
}

// Tenant related types
export interface Tenant {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  identificationNumber: string;
  identificationType: IdentificationType;
  emergencyContact?: string;
  occupation?: string;
  createdAt: string;
  updatedAt: string;
}

export enum IdentificationType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE'
}

// TenantUnit related types
export interface TenantUnit {
  id: string;
  tenantId: string;
  unitId: string;
  status: TenantUnitStatus;
  startDate: string;
  endDate: string;
  contractNumber?: string;
  contractFile?: string;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidDate?: string;
  depositRefunded?: boolean;
  depositRefundedDate?: string;
  rentAmount: number;
  rentDueDay: number;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  unit?: Unit;
}

export enum TenantUnitStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED'
}

// Financial related types
export interface Transaction {
  id: string;
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  status: TransactionStatus;
  dueDate?: string;
  paidDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionCategory {
  RENT = 'RENT',
  DEPOSIT = 'DEPOSIT',
  UTILITY = 'UTILITY',
  MAINTENANCE = 'MAINTENANCE',
  TAX = 'TAX',
  INSURANCE = 'INSURANCE',
  OTHER = 'OTHER'
}

export enum TransactionStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

// Maintenance related types
export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD'
}

// Document related types
export interface Document {
  id: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileSize: number;
  size: number;
  mimeType: string;
  uploadedById: string;
  isImportant?: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  LEASE_AGREEMENT = 'LEASE_AGREEMENT',
  IDENTIFICATION = 'IDENTIFICATION',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  CERTIFICATE = 'CERTIFICATE',
  PERMIT = 'PERMIT',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  INSURANCE = 'INSURANCE',
  REPORT = 'REPORT',
  // Giữ lại các giá trị cũ để đảm bảo tính tương thích
  LEASE = 'LEASE',
  MAINTENANCE = 'MAINTENANCE',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER'
}

/**
 * Enum định nghĩa các loại file được hỗ trợ
 * Chuyển từ lib/api/types.ts
 */
export enum FileType {
  PDF = "PDF",
  WORD = "WORD",
  EXCEL = "EXCEL",
  IMAGE = "IMAGE",
  TEXT = "TEXT",
  OTHER = "OTHER"
}
