/**
 * Form Module - Cung cấp các hooks và components cho quản lý form
 */

// Export from form-context
export { useFormContext, FormProvider } from './form-context';

// Export from use-form-state
export { useFormState } from './use-form-state';

// Export from use-form-actions
export { useFormActions } from './use-form-actions';

// Export from use-form-validation
export { 
  useFormValidation,
  type UseFormValidationOptions,
  type FormValidationState,
  type FormValidationActions,
  type UseFormValidationReturn,
  type ValidationMode,
  type SchemaType
} from './use-form-validation';

// Export from validation-utils
export {
  validateField,
  zodErrorToFieldErrors,
  formatValidationError
} from './validation-utils';

// Export from validation-rules
export {
  emailRule,
  passwordRule,
  strongPasswordRule,
  requiredStringRule,
  urlRule,
  phoneRule,
  numberRule,
  pastDateRule,
  futureDateRule,
  zipCodeRule,
  rangeRule,
  stringLengthRule
} from './validation-rules';

// Export from types
export {
  ValidationErrorType,
  type ValidationError,
  type FormErrors,
  zodIssueToValidationError,
  fieldErrorToValidationError,
  fieldErrorsToFormErrors
} from './types';

/**
 * Form Module cung cấp các hooks và components để xây dựng và quản lý form trong ứng dụng.
 * Module bao gồm các thành phần chính:
 * 
 * 1. FormContext và FormProvider: Cung cấp context cho quản lý trạng thái form
 * 2. useFormContext: Hook để truy cập context form từ bất kỳ component con nào
 * 3. useFormState: Hook để quản lý trạng thái và giá trị của form
 * 4. useFormActions: Hook cung cấp các actions như submit, reset, xử lý lỗi
 * 
 * Có hai cách chính để sử dụng form module:
 * 
 * 1. Sử dụng FormProvider + useFormContext để quản lý form qua Context API
 * 2. Sử dụng useFormState trực tiếp trong component form
 * 
 * Xem tài liệu đầy đủ để biết thêm chi tiết và ví dụ.
 */ 