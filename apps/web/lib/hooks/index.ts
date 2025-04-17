/**
 * Hooks - Tập hợp tất cả các hooks trong dự án
 */

// Các hooks theo domain - sử dụng export riêng để tránh xung đột
// 1. Properties hooks
export {
  // Query hooks
  useProperty,
  useProperties,
  usePropertyUnits,
  usePropertyDocuments,
  usePropertyCount,
  
  // Mutation hooks
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useUpdatePropertyStatus,
  useUploadPropertyImages,
  useOptimisticPropertyUpdate,
  useBulkUpdateProperties,
  
  // Cache management hooks
  usePrefetchProperty,
  useInvalidateProperty,
  useResetPropertyQueries,
  
  // Query key builders
  propertyKeys,
} from './properties';

// 2. Units hooks
export {
  // Query hooks
  usePropertyUnits as useUnitsOfProperty,
  useUnitDetails,
  useVacantUnits,
  useUnitSummary,
  
  // Mutation hooks
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  
  // Query key builders
  unitKeys,
} from './units';

// Export các module khác nguyên vẹn
export * from './auth';
export * from './financial';
export * from './ui';
export * from './units';

// Export form hooks
export * from '../form';

// Để các namespace import rõ ràng hơn, nên sử dụng cách sau:
// import { useProperty, useProperties } from '@/lib/hooks/properties';
// import { useAuthStatus } from '@/lib/hooks/auth';
// import { useToast } from '@/lib/hooks/ui';