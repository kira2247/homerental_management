"use client";

import { useState, useCallback, useEffect } from "react";
import { FieldValues, UseFormReturn, useForm } from "react-hook-form";
import { useFormContext } from "./form-context";

interface UseFormStateOptions<T extends FieldValues> {
  /**
   * Giá trị ban đầu của form
   */
  defaultValues?: T;
  
  /**
   * Form instance từ react-hook-form (optional)
   * Nếu không cung cấp, sẽ tạo mới form instance
   */
  form?: UseFormReturn<T>;
  
  /**
   * Callback được gọi khi giá trị form thay đổi
   */
  onChange?: (values: T) => void;
  
  /**
   * Tự động cập nhật FormContext
   * @default true
   */
  updateContext?: boolean;
  
  /**
   * Kích hoạt debug mode để hiển thị logs
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook để quản lý trạng thái dữ liệu của form
 * 
 * @param options Tùy chọn cấu hình
 * @returns Object chứa trạng thái và các phương thức để quản lý form
 */
function useFormState<T extends FieldValues>(options: UseFormStateOptions<T> = {}) {
  const {
    defaultValues,
    form: externalForm,
    onChange,
    updateContext = true,
    debug = false,
  } = options;
  
  // Lấy context từ FormProvider (nếu có)
  const formContext = useUpdateableFormContext<T>(updateContext);
  
  // Sử dụng form từ tham số hoặc tạo mới
  const formInstance = externalForm || useForm<T>({ 
    defaultValues: defaultValues as any 
  });
  
  // Lấy các method và state từ form instance
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { isDirty, isSubmitting, errors },
  } = formInstance;
  
  // Trạng thái form nội bộ
  const [values, setValues] = useState<T>(defaultValues || ({} as T));
  const [hasChanges, setHasChanges] = useState(false);
  
  // Theo dõi sự thay đổi giá trị form
  useEffect(() => {
    const subscription = watch((formValues) => {
      const newValues = formValues as T;
      setValues(newValues);
      setHasChanges(isDirty);
      
      if (onChange) {
        onChange(newValues);
      }
      
      if (debug) {
        console.debug("[useFormState] Form values changed:", newValues);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, onChange, isDirty, debug]);
  
  // Cập nhật form context nếu được yêu cầu
  useEffect(() => {
    if (updateContext && formContext) {
      formContext.form = formInstance;
      
      if (debug) {
        console.debug("[useFormState] Updated form context");
      }
    }
  }, [formInstance, formContext, updateContext, debug]);
  
  // Xử lý submit form
  const submitHandler = useCallback(
    (onSubmit: (data: T) => Promise<void> | void) => {
      return handleSubmit(async (data) => {
        try {
          if (debug) {
            console.debug("[useFormState] Submitting form with data:", data);
          }
          
          // Gọi callback onSubmit với dữ liệu form
          await onSubmit(data);
          
          // Đặt trạng thái thành công nếu có context
          if (formContext) {
            formContext.setStatus("success");
          }
        } catch (error) {
          if (debug) {
            console.debug("[useFormState] Form submission error:", error);
          }
          
          // Xử lý lỗi nếu có context
          if (formContext) {
            if (error instanceof Error) {
              formContext.setError(error.message);
            } else {
              formContext.setError("Có lỗi xảy ra khi xử lý form");
            }
          }
          
          // Ném lại lỗi để xử lý bên ngoài nếu cần
          throw error;
        }
      });
    },
    [handleSubmit, formContext, debug]
  );
  
  // Đặt lại form
  const resetForm = useCallback((newValues?: T) => {
    reset(newValues as any);
    setValues(newValues || defaultValues || ({} as T));
    setHasChanges(false);
    
    if (formContext) {
      formContext.reset();
    }
    
    if (debug) {
      console.debug("[useFormState] Form reset with values:", newValues || defaultValues);
    }
  }, [reset, defaultValues, formContext, debug]);
  
  // Cập nhật trường form
  const updateField = useCallback(
    (name: keyof T, value: any) => {
      setValue(name as any, value, { shouldDirty: true, shouldValidate: true });
      
      if (debug) {
        console.debug(`[useFormState] Field ${String(name)} updated:`, value);
      }
    },
    [setValue, debug]
  );
  
  return {
    // Form instance và properties
    form: formInstance,
    control,
    
    // Giá trị và trạng thái
    values,
    hasChanges,
    isDirty,
    isSubmitting,
    errors,
    
    // Methods
    setValue: updateField,
    getValues,
    reset: resetForm,
    handleSubmit: submitHandler,
  };
}

/**
 * Hook helper để lấy FormContext (nếu có)
 */
function useUpdateableFormContext<T extends FieldValues>(updateContext: boolean) {
  try {
    return updateContext ? useFormContext<T>() : undefined;
  } catch {
    // Trả về undefined nếu không tìm thấy context
    return undefined;
  }
}

export { useFormState };
export type { UseFormStateOptions }; 