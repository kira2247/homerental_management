"use client";

import { FieldError, FieldErrors, FieldValues, Path } from "react-hook-form";
import { ZodError, ZodSchema } from "zod";

/**
 * Kiểm tra giá trị field đối với schema
 * 
 * @param schema - Schema Zod cho toàn bộ đối tượng
 * @param fieldName - Tên trường cần validate
 * @param value - Giá trị của trường cần validate
 * @param data - Dữ liệu form đầy đủ (các trường khác cần thiết cho validation)
 * @returns Kết quả validation (success, message)
 * 
 * @example
 * ```ts
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 * 
 * const result = validateField(schema, "email", "test", formData);
 * console.log(result.success); // false
 * console.log(result.message); // "Invalid email"
 * ```
 */
export function validateField<T extends FieldValues>(
  schema: ZodSchema<T>,
  fieldName: Path<T>,
  value: unknown,
  data?: Partial<T>
): { success: boolean; message?: string } {
  try {
    // Tạo một đối tượng chỉ với field cần validate
    const partialData = {
      ...(data || {}),
      [fieldName]: value
    } as T;
    
    // Validate object với schema
    schema.parse(partialData);
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      // Tìm lỗi ứng với field
      const fieldError = error.errors.find(
        err => err.path.join('.') === String(fieldName)
      );
      
      if (fieldError) {
        return { success: false, message: fieldError.message };
      }
    }
    
    // Lỗi khác hoặc không tìm thấy lỗi cho field
    return { success: true };
  }
}

/**
 * Chuyển đổi ZodError thành FieldErrors cho react-hook-form
 * 
 * @param error - ZodError từ việc validate schema
 * @returns FieldErrors tương ứng có thể được sử dụng với react-hook-form
 * 
 * @example
 * ```ts
 * try {
 *   formSchema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     const fieldErrors = zodErrorToFieldErrors(error);
 *     Object.entries(fieldErrors).forEach(([name, error]) => {
 *       form.setError(name as Path<FormValues>, error);
 *     });
 *   }
 * }
 * ```
 */
export function zodErrorToFieldErrors<T extends FieldValues>(error: ZodError): FieldErrors<T> {
  const fieldErrors: Record<string, FieldError> = {};
  
  error.errors.forEach((err) => {
    if (!err.path.length) return;
    
    const path = err.path.join('.');
    fieldErrors[path] = {
      type: 'validation',
      message: err.message
    };
  });
  
  return fieldErrors as FieldErrors<T>;
}

/**
 * Định dạng thông báo lỗi từ nhiều nguồn khác nhau
 * 
 * @param error - Lỗi từ react-hook-form, ZodError, hoặc Error thông thường
 * @returns Thông báo lỗi đã định dạng
 * 
 * @example
 * ```ts
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   const errorMessage = formatValidationError(error);
 *   setError(errorMessage);
 * }
 * ```
 */
export function formatValidationError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.errors.map(e => e.message).join('; ');
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Đã xảy ra lỗi không xác định';
} 