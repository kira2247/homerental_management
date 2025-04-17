/**
 * Form related types for the application
 * These types are used for forms and validations throughout the application
 */

import { SelectOption } from './utility-types';

// Form field types
export interface FormField<T = any> {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  defaultValue?: T;
  validation?: ValidationRules;
  options?: SelectOption[];
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export interface FormFieldProps<T = any> {
  field: FormField<T>;
  value?: T;
  onChange?: (value: T) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
}

// Re-export for backward compatibility
export type { SelectOption };

// Validation types
export interface ValidationRules {
  required?: ValidationRule;
  minLength?: ValidationRule & { value: number };
  maxLength?: ValidationRule & { value: number };
  min?: ValidationRule & { value: number };
  max?: ValidationRule & { value: number };
  pattern?: ValidationRule & { value: RegExp };
  validate?: (value: any) => boolean | string;
  [key: string]: any;
}

export interface ValidationRule {
  value: boolean | number | RegExp | string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  message?: string;
}

// Form state types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  resetForm: () => void;
  setValues: (values: Partial<T>) => void;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
}

// Form submission types
export interface FormSubmitHandler<T> {
  (values: T, event?: React.FormEvent<HTMLFormElement>): void | Promise<void>;
}

export interface FormErrorHandler {
  (error: Error): void;
}

// Custom form component props
export interface FormControlProps {
  id: string;
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  className?: string;
}

export interface FormInputProps extends FormControlProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date';
  placeholder?: string;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export interface FormSelectProps extends FormControlProps {
  options: SelectOption[];
  defaultValue?: string | number;
  placeholder?: string;
  onChange?: (value: string | number) => void;
}

export interface FormTextareaProps extends FormControlProps {
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}
