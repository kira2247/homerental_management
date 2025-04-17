"use client";

import { useState, useCallback, useMemo } from "react";
import { FieldError, FieldErrors, FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ZodError, ZodSchema, z } from "zod";

export type ValidationMode = "onSubmit" | "onChange" | "onBlur";

// Helper type để hỗ trợ kiểu dữ liệu input cho UseFormValidation
export type SchemaType<T, Z extends ZodSchema<any>> = T & z.infer<Z>;

export interface UseFormValidationOptions<
  TFormValues extends FieldValues,
  TSchema extends ZodSchema<any> = ZodSchema<any>
> {
  /**
   * Schema Zod để validate dữ liệu form
   */
  schema?: TSchema;
  
  /**
   * Form instance từ react-hook-form
   */
  form?: UseFormReturn<TFormValues>;
  
  /**
   * Chế độ validation
   * @default "onSubmit"
   */
  mode?: ValidationMode;
  
  /**
   * Xử lý lỗi Zod không được expected
   */
  onZodError?: (error: ZodError) => void;
}

export interface FormValidationState<TFormValues extends FieldValues> {
  /**
   * Lỗi validation hiện tại
   */
  errors: FieldErrors<TFormValues>;
  
  /**
   * Trạng thái validation chung của form
   */
  isValid: boolean;
  
  /**
   * Form đã được validate ít nhất một lần
   */
  isValidated: boolean;
  
  /**
   * Form đang được validate
   */
  isValidating: boolean;
}

export interface FormValidationActions<TFormValues extends FieldValues> {
  /**
   * Validate toàn bộ form
   */
  validateForm: () => Promise<boolean>;
  
  /**
   * Validate một field cụ thể
   */
  validateField: (name: Path<TFormValues>) => Promise<boolean>;
  
  /**
   * Cập nhật lỗi cho một field cụ thể
   */
  setFieldError: (name: Path<TFormValues>, error: FieldError | null) => void;
  
  /**
   * Clear tất cả lỗi
   */
  clearErrors: () => void;
  
  /**
   * Kiểm tra một field cụ thể có lỗi không
   */
  hasError: (name: Path<TFormValues>) => boolean;
  
  /**
   * Lấy thông báo lỗi cho field cụ thể
   */
  getErrorMessage: (name: Path<TFormValues>) => string | undefined;
}

export type UseFormValidationReturn<TFormValues extends FieldValues> = [
  FormValidationState<TFormValues>,
  FormValidationActions<TFormValues>
];

/**
 * Hook quản lý validation form dựa trên react-hook-form và Zod
 * 
 * @example
 * ```tsx
 * const formSchema = z.object({
 *   email: z.string().email({ message: "Email không hợp lệ" }),
 *   password: z.string().min(8, { message: "Mật khẩu cần ít nhất 8 ký tự" })
 * });
 * 
 * const form = useForm<z.infer<typeof formSchema>>();
 * const [validation, validationActions] = useFormValidation({
 *   schema: formSchema,
 *   form
 * });
 * 
 * // Kiểm tra form có lỗi không
 * if (!validation.isValid) {
 *   console.log("Form có lỗi:", validation.errors);
 * }
 * 
 * // Validate field email
 * await validationActions.validateField("email");
 * 
 * // Lấy lỗi cho field password
 * const passwordError = validationActions.getErrorMessage("password");
 * ```
 */
export function useFormValidation<
  TFormValues extends FieldValues,
  TSchema extends ZodSchema<any> = ZodSchema<any>
>({
  schema,
  form,
  mode = "onSubmit",
  onZodError
}: UseFormValidationOptions<TFormValues, TSchema> = {}): UseFormValidationReturn<TFormValues> {
  // State lưu trữ trạng thái validation
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<TFormValues>>({});

  // Validate form hoặc field dựa trên schema (nếu có)
  const validateWithSchema = useCallback(async (
    data: TFormValues, 
    fieldName?: Path<TFormValues>
  ): Promise<{ success: boolean; errors?: FieldErrors<TFormValues> }> => {
    if (!schema) return { success: true };
    
    try {
      if (fieldName) {
        // Nếu validate một field cụ thể
        const fieldValue = data[fieldName as unknown as keyof TFormValues];
        
        // Chúng ta không thể truy cập schema.shape trực tiếp, nên validate toàn bộ
        // và lọc lỗi cho field cụ thể sau
        try {
          schema.parse(data);
          return { success: true };
        } catch (error) {
          if (error instanceof ZodError) {
            // Lọc lỗi chỉ cho field cần thiết
            const fieldErrors = error.errors.filter(err => 
              err.path.join('.') === String(fieldName)
            );
            
            if (fieldErrors.length === 0) {
              return { success: true };
            }
            
            throw error;
          }
          throw error;
        }
      } else {
        // Validate toàn bộ form
        schema.parse(data);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof ZodError) {
        if (onZodError) onZodError(error);
        
        // Chuyển đổi ZodError thành FieldErrors
        // Sử dụng Record<string, any> thay vì FieldErrors<TFormValues> để tránh lỗi type
        const fieldErrors: Record<string, any> = {};
        
        error.errors.forEach((err) => {
          if (!err.path || err.path.length === 0) return;
          
          const fieldPath = err.path.join(".");
          
          if (!fieldName || fieldPath === String(fieldName)) {
            fieldErrors[fieldPath] = {
              type: "validation",
              message: err.message
            };
          }
        });
        
        // Chuyển đổi sang FieldErrors<TFormValues> sau khi đã gán các giá trị
        return { success: false, errors: fieldErrors as unknown as FieldErrors<TFormValues> };
      }
      
      console.error("Lỗi không xác định trong quá trình validation:", error);
      return { success: false };
    }
  }, [schema, onZodError]);

  // Validate toàn bộ form
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!form) return false;
    
    setIsValidating(true);
    
    try {
      // Kết hợp validation của react-hook-form và schema
      const isFormValid = await form.trigger();
      
      if (schema) {
        const data = form.getValues();
        const { success, errors: schemaErrors } = await validateWithSchema(data);
        
        if (!success && schemaErrors) {
          // Cập nhật lỗi từ schema validation
          Object.entries(schemaErrors).forEach(([key, value]) => {
            // Kiểm tra xem value có phải là FieldError không
            const errorValue = typeof value === 'object' && value !== null 
              ? value 
              : { type: 'validation', message: String(value) };
              
            form.setError(key as Path<TFormValues>, errorValue as FieldError);
          });
          
          setErrors({ ...form.formState.errors });
          setIsValidated(true);
          return false;
        }
      }
      
      setErrors(form.formState.errors);
      setIsValidated(true);
      return isFormValid;
    } finally {
      setIsValidating(false);
    }
  }, [form, schema, validateWithSchema]);

  // Validate một field cụ thể
  const validateField = useCallback(async (name: Path<TFormValues>): Promise<boolean> => {
    if (!form) return false;
    
    // Validate field với react-hook-form
    const isValid = await form.trigger(name);
    
    // Nếu có schema, validate thêm với schema
    if (schema) {
      const data = form.getValues();
      const { success, errors: schemaErrors } = await validateWithSchema(data, name);
      
      if (!success && schemaErrors) {
        // Sử dụng cách tiếp cận an toàn hơn với kiểu dữ liệu
        const schemaErrorsRecord = schemaErrors as Record<string, any>;
        const nameStr = String(name);
        
        if (schemaErrorsRecord && schemaErrorsRecord[nameStr]) {
          const error = schemaErrorsRecord[nameStr];
          
          form.setError(name, {
            type: error.type || 'validation',
            message: error.message || 'Giá trị không hợp lệ'
          });
          
          setErrors({ ...form.formState.errors });
          return false;
        }
      }
    }
    
    setErrors({ ...form.formState.errors });
    return isValid;
  }, [form, schema, validateWithSchema]);

  // Set lỗi cho một field cụ thể
  const setFieldError = useCallback((name: Path<TFormValues>, error: FieldError | null) => {
    if (!form) return;
    
    if (error) {
      form.setError(name, error);
    } else {
      form.clearErrors(name);
    }
    
    setErrors({ ...form.formState.errors });
  }, [form]);

  // Clear tất cả lỗi
  const clearErrors = useCallback(() => {
    if (!form) return;
    form.clearErrors();
    setErrors({});
  }, [form]);

  // Kiểm tra một field có lỗi không
  const hasError = useCallback((name: Path<TFormValues>): boolean => {
    const fieldErrors = errors as Record<string, unknown>;
    return Boolean(fieldErrors[name as string]);
  }, [errors]);

  // Lấy thông báo lỗi cho một field cụ thể
  const getErrorMessage = useCallback((name: Path<TFormValues>): string | undefined => {
    const fieldErrors = errors as Record<string, FieldError | undefined>;
    const error = fieldErrors[name as string];
    return error?.message;
  }, [errors]);

  // State và actions cho validation
  const validationState: FormValidationState<TFormValues> = useMemo(() => ({
    errors,
    isValid: form ? !form.formState.isDirty || Object.keys(errors).length === 0 : true,
    isValidated,
    isValidating
  }), [errors, form, isValidated, isValidating]);

  const validationActions: FormValidationActions<TFormValues> = useMemo(() => ({
    validateForm,
    validateField,
    setFieldError,
    clearErrors,
    hasError,
    getErrorMessage
  }), [validateForm, validateField, setFieldError, clearErrors, hasError, getErrorMessage]);

  return [validationState, validationActions];
} 