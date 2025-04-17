/**
 * Central Types Index
 * Cấu trúc types tập trung cho toàn bộ ứng dụng
 * Tổ chức theo module và chức năng
 */

// Re-export common utility types từ utility-types.ts
export type {
  Nullable,
  Optional,
  VoidFunction,
  ErrorCallback,
  SuccessCallback
} from './utility-types';

// Re-export types từ api-types.ts
export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError,
  PaginatedResponse,
  UnitFilter,
  UnitListResponse,
  UnitWithProperty,
  UnitDetail,
  UnitSummary,
  CreateUnitRequest,
  UpdateUnitRequest,
  } from './api-types';

// Re-export enums từ api-types.ts
export { ErrorCode } from './api-types';

// Re-export types từ model-types.ts
export type {
  Property,
  Unit,
  User,
  Tenant,
  TenantUnit,
  Document,
  MaintenanceRequest
} from './model-types';

// Re-export enums từ model-types.ts
export {
  PropertyStatus,
  PropertyType,
  UnitStatus,
  UnitType,
  UserRole,
  IdentificationType,
  TenantUnitStatus,
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  MaintenancePriority,
  MaintenanceStatus,
  DocumentType,
  FileType
} from './model-types';

// Re-export types từ utility-types.ts
export type {
  PaginatedData,
  PaginationParams,
  BaseFilterOptions,
  DateRange,
  SelectOption
} from './utility-types';

// Re-export types từ form-types.ts
export type {
  FormControlProps,
  FormFieldProps,
  FormState,
  ValidationRules,
  ValidationResult
} from './form-types';

// Re-export types từ auth-types.ts
export type {
  UserBase,
  UserPreferences,
  AuthTokens,
  TokenPayload,
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetConfirmation,
  PasswordChangeRequest,
  AuthState,
  UserDto,
  AuthTokensDto,
  LoginCredentialsDto,
  RegistrationDataDto
} from './auth-types';

// Re-export enums từ auth-types.ts
export { Role } from './auth-types';

// Re-export types từ financial-types.ts
export type {
  DashboardSummary,
  DashboardSummaryDto,
  DashboardSummaryFilter,
  DashboardSummaryFilterDto,
  PropertyDistribution,
  PropertyDistributionDto,
  PropertyDistributionFilter,
  PropertyDistributionFilterDto,
  FinancialOverview,
  FinancialOverviewDto,
  FinancialOverviewFilter,
  FinancialOverviewFilterDto,
  PendingTask,
  PendingTaskDto,
  TimePeriod
} from './financial-types';

// Re-export types từ notification-types.ts
export type {
  Notification,
  NotificationRecipient,
  NotificationPreferences as UserNotificationPreferences,
  NotificationFilterOptions,
  CreateNotificationOptions,
  UpdateNotificationOptions,
  NotificationCount,
  NotificationDto,
  NotificationRecipientDto,
  NotificationPreferencesDto,
  NotificationFilterOptionsDto,
  CreateNotificationOptionsDto,
  UpdateNotificationOptionsDto,
  NotificationCountDto
} from './notification-types';

// Re-export enums từ notification-types.ts
export {
  NotificationType,
  NotificationSource,
  NotificationPriority,
  NotificationStatus
} from './notification-types';

// Re-export types từ transaction-types.ts
export type {
  Transaction as TransactionDetail,
  TransactionList,
  TransactionFilter,
  TransactionFormData,
  TransactionSummary,
  TransactionMutationContext,
  TransactionDto,
  TransactionListDto,
  TransactionFilterDto,
  TransactionFormDataDto,
  TransactionSummaryDto
} from './transaction-types';

// Export từ api-helpers 
export {
  isApiSuccess,
  isApiError,
  extractApiData,
  getApiErrorMessage,
  toApiSuccess,
  toApiError,
  createApiErrorFromError,
  isApiResponse,
  parseResponse,
  extractNestedData,
  formatApiError,
  formatApiErrorI18n,
  createErrorFromResponse,
  createErrorFromResponseI18n,
  handleApiError,
  safeParseResponse,
  ERROR_CODE_TO_I18N_KEY
} from './api-helpers';

