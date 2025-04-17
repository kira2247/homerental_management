/**
 * UI Components Barrel File
 * Exports all UI components for easier imports
 */

// Basic UI components
export * from './alert';
export * from './badge';
export * from './breadcrumb';
export * from './button';
export * from './card';
export * from './checkbox';
export * from './dialog';
export * from './dropdown-menu';
export * from './input';
export * from './label';
export * from './select';
export * from './skeleton';
export * from './switch';
export * from './table';
export * from './tabs';
export * from './textarea';
export * from './tooltip';

// Form components - cơ bản
export * from './form';

// Form components - nâng cao
// Lưu ý: không export trực tiếp từ form-components để tránh xung đột FormField
export { FormInput } from './form-input';
export { FormSelect } from './form-select';
export { FormSwitch } from './form-switch';
export { FormTextarea } from './form-textarea';

// Toast components
export * from './toast';
export * from './use-toast';
export * from './toaster';

// Specialized components
export * from './alert-dialog';
export * from './currency-selector';
export * from './health-indicator';
export * from './loading-spinner';
export * from './locale-switcher';
export * from './pagination';

export * from './user-profile';
export * from './validation-message';
export * from './visually-hidden';
