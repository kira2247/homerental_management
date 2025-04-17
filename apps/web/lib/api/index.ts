/**
 * API Service Exports
 * File này xuất tất cả các API service để dễ dàng import và sử dụng trong ứng dụng
 */

import { authApiService as importedAuthApiService } from './auth-api-service';
import { userApiService as importedUserApiService } from './user-api-service';
import { propertyApiService as importedPropertyApiService } from './property-api-service';
import { tenantApiService as importedTenantApiService } from './tenant-api-service';
import { paymentApiService as importedPaymentApiService } from './payment-api-service';
import { maintenanceApiService as importedMaintenanceApiService } from './maintenance-api-service';
import { unitApiService as importedUnitApiService } from './unit-api-service';
import { DashboardApiService } from './dashboard-api-service';

import { DashboardApiService as FinancialDashboardApiService } from './financial/dashboard-api-service';
import { FinancialApiService } from './financial/financial-api-service';
import { TransactionsApiService } from './financial/transactions-api-service';

// Singleton instances of the API services
let authApiService: any = null;
let userApiService: any = null;
let propertyApiService: any = null;
let tenantApiService: any = null;
let contractApiService: any = null;
let paymentApiService: any = null;
let maintenanceApiService: any = null;
let unitApiService: any = null;
let dashboardApiService: DashboardApiService | null = null;

// Financial module singleton instances
let financialDashboardApiService: FinancialDashboardApiService | null = null;
let financialApiService: FinancialApiService | null = null;
let transactionsApiService: TransactionsApiService | null = null;

/**
 * Get AuthApiService instance (singleton)
 */
export function useAuthApi() {
  if (!authApiService) {
    authApiService = importedAuthApiService;
  }
  return authApiService;
}

/**
 * Get UserApiService instance (singleton)
 */
export function useUserApi() {
  if (!userApiService) {
    userApiService = importedUserApiService;
  }
  return userApiService;
}

/**
 * Get PropertyApiService instance (singleton)
 */
export function usePropertyApi() {
  if (!propertyApiService) {
    propertyApiService = importedPropertyApiService;
  }
  return propertyApiService;
}

/**
 * Get TenantApiService instance (singleton)
 */
export function useTenantApi() {
  if (!tenantApiService) {
    tenantApiService = importedTenantApiService;
  }
  return tenantApiService;
}


/**
 * Get PaymentApiService instance (singleton)
 */
export function usePaymentApi() {
  if (!paymentApiService) {
    paymentApiService = importedPaymentApiService;
  }
  return paymentApiService;
}

/**
 * Get MaintenanceApiService instance (singleton)
 */
export function useMaintenanceApi() {
  if (!maintenanceApiService) {
    maintenanceApiService = importedMaintenanceApiService;
  }
  return maintenanceApiService;
}

/**
 * Get UnitApiService instance (singleton)
 */
export function useUnitApi() {
  if (!unitApiService) {
    unitApiService = importedUnitApiService;
  }
  return unitApiService;
}

/**
 * Get DashboardApiService instance (singleton)
 */
export function useDashboardApi(): DashboardApiService {
  if (!dashboardApiService) {
    dashboardApiService = new DashboardApiService();
  }
  return dashboardApiService;
}

/**
 * Get Financial DashboardApiService instance (singleton)
 */
export function useFinancialDashboardApi(): FinancialDashboardApiService {
  if (!financialDashboardApiService) {
    financialDashboardApiService = new FinancialDashboardApiService();
  }
  return financialDashboardApiService;
}

/**
 * Get FinancialApiService instance (singleton)
 */
export function useFinancialApi(): FinancialApiService {
  if (!financialApiService) {
    financialApiService = new FinancialApiService();
  }
  return financialApiService;
}

/**
 * Get TransactionsApiService instance (singleton)
 */
export function useTransactionsApi(): TransactionsApiService {
  if (!transactionsApiService) {
    transactionsApiService = new TransactionsApiService();
  }
  return transactionsApiService;
}

// Export all API services
export { 
  importedAuthApiService as authApiService, 
  importedUserApiService as userApiService, 
  importedPropertyApiService as propertyApiService, 
  importedTenantApiService as tenantApiService,
  importedPaymentApiService as paymentApiService,
  importedMaintenanceApiService as maintenanceApiService,
  importedUnitApiService as unitApiService,
  DashboardApiService
};

// Export financial module API services
export { 
  FinancialDashboardApiService, 
  FinancialApiService, 
  TransactionsApiService 
};

// Financial module types export
export * from './financial/types';

// Base API service
export { BaseApiService } from './base-api-service';
export { type PaginatedResponse } from './types';
export { 
  type ApiResponse, 
  type ApiBaseResponse, 
  type ApiSuccessResponse, 
  type ApiErrorResponse,
  type UnwrapApiResponse,
  ErrorCode
} from './types';

// API Helper functions
export {
  isApiSuccess,
  parseResponse,
  extractNestedData,
  formatApiError,
  createErrorFromResponse,
  handleApiError,
  safeParseResponse
} from './helpers';

// Auth API service
export { 
  type User,
  type LoginCredentials,
  type RegisterCredentials,
  type AuthResponse,
  type ResetPasswordRequest,
  type ChangePasswordRequest,
  type VerifyEmailRequest
} from './auth-api-service';

// User API service
export {
  type UserFilters,
  type UpdateUserRequest
} from './user-api-service';

// Property API service
export {
  type Property,
  type PropertyType,
  type PropertyStatus,
  type PropertyFilters,
  type CreatePropertyRequest,
  type UpdatePropertyRequest
} from './property-api-service';

// Tenant API service
export {
  type TenantFilters,
  type CreateTenantRequest,
  type UpdateTenantRequest
} from './tenant-api-service';


// Payment API service
export {
  type Payment,
  type PaymentStatus,
  type PaymentMethod,
  type PaymentFilters,
  type CreatePaymentRequest,
  type UpdatePaymentRequest,
  type RecordPaymentRequest
} from './payment-api-service';

// Maintenance API service
export {
  type Maintenance,
  type MaintenanceStatus,
  type MaintenancePriority,
  type MaintenanceFilters,
  type CreateMaintenanceRequest,
  type UpdateMaintenanceRequest
} from './maintenance-api-service'; 