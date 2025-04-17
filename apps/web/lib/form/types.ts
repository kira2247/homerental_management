"use client";

import { FieldError, FieldErrors, FieldValues, Path } from "react-hook-form";
import { ZodIssue } from "zod";

/**
 * Loại lỗi validation có thể xảy ra
 */
export enum ValidationErrorType {
  REQUIRED = "required",
  PATTERN = "pattern",
  MIN_LENGTH = "minLength",
  MAX_LENGTH = "maxLength",
  MIN = "min",
  MAX = "max",
  VALIDATE = "validate",
  VALUE_AS_NUMBER = "valueAsNumber",
  VALUE_AS_DATE = "valueAsDate",
  VALUE_AS_ARRAY = "valueAsArray",
  CUSTOM = "custom",
  ZOD = "zod"
}

/**
 * Thông tin về một lỗi validation cụ thể
 */
export interface ValidationError {
  /**
   * Loại lỗi validation
   */
  type: ValidationErrorType | string;
  
  /**
   * Thông báo lỗi
   */
  message: string;
  
  /**
   * Dữ liệu thêm về lỗi (tùy chọn)
   */
  data?: unknown;
}

/**
 * Kiểu dữ liệu type-safe cho lỗi validation trên form
 * 
 * Sử dụng kiểu dữ liệu này thay vì Record<string, string> để có được
 * hỗ trợ TypeScript và tự động hoàn thành tên trường
 */
export type FormErrors<T extends FieldValues> = {
  [K in Path<T>]?: ValidationError;
};

/**
 * Chuyển đổi ZodIssue sang ValidationError
 * 
 * @param issue - ZodIssue từ Zod validation
 * @returns ValidationError tương ứng
 */
export function zodIssueToValidationError(issue: ZodIssue): ValidationError {
  return {
    type: ValidationErrorType.ZOD,
    message: issue.message,
    data: issue
  };
}

/**
 * Chuyển đổi FieldError từ react-hook-form sang ValidationError
 * 
 * @param error - FieldError từ react-hook-form
 * @returns ValidationError tương ứng
 */
export function fieldErrorToValidationError(error: FieldError): ValidationError {
  return {
    type: error.type,
    message: error.message || 'Trường không hợp lệ',
    data: error
  };
}

/**
 * Chuyển đổi FieldErrors từ react-hook-form sang FormErrors
 * 
 * @param errors - FieldErrors từ react-hook-form
 * @returns FormErrors tương ứng
 */
export function fieldErrorsToFormErrors<T extends FieldValues>(
  errors: FieldErrors<T>
): FormErrors<T> {
  const formErrors: FormErrors<T> = {};
  
  Object.entries(errors).forEach(([key, error]) => {
    if (error) {
      formErrors[key as Path<T>] = fieldErrorToValidationError(error as FieldError);
    }
  });
  
  return formErrors;
} 