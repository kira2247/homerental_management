"use client";

import { useCallback } from "react";
import { FieldValues } from "react-hook-form";
import { useFormContext } from "./form-context";

interface UseFormActionsOptions {
  /**
   * Callback được gọi khi form submit thành công
   */
  onSuccess?: (data: any) => void;
  
  /**
   * Callback được gọi khi xảy ra lỗi trong quá trình submit form
   */
  onError?: (error: Error) => void;
  
  /**
   * Message hiển thị khi submit thành công
   */
  successMessage?: string;
  
  /**
   * Tự động reset form sau khi submit thành công
   * @default false
   */
  resetOnSuccess?: boolean;
  
  /**
   * Kích hoạt debug mode để hiển thị logs
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook cung cấp các actions cho form như submit, reset, và xử lý lỗi
 * 
 * @param options Tùy chọn cấu hình
 * @returns Object chứa các actions để quản lý form
 */
function useFormActions<T extends FieldValues = any>(options: UseFormActionsOptions = {}) {
  const {
    onSuccess,
    onError,
    successMessage = "Thao tác hoàn tất thành công!",
    resetOnSuccess = false,
    debug = false,
  } = options;
  
  // Lấy context từ FormProvider
  const formContext = useFormContext<T>();
  
  /**
   * Submit form với callback xử lý dữ liệu
   */
  const submitForm = useCallback(
    async (handler: (data: T) => Promise<void> | void) => {
      try {
        // Kiểm tra xem form đang submit không
        if (formContext.isSubmitting) {
          if (debug) {
            console.debug("[useFormActions] Form đang trong quá trình submit, bỏ qua yêu cầu");
          }
          return;
        }
        
        // Đặt trạng thái submitting
        formContext.setStatus("submitting");
        
        if (debug) {
          console.debug("[useFormActions] Bắt đầu submit form");
        }
        
        // Thực hiện submit với react-hook-form (nếu có)
        if (formContext.form) {
          await formContext.form.handleSubmit(async (data) => {
            try {
              await handler(data);
              handleSuccess(data);
            } catch (error) {
              handleError(error);
              throw error;
            }
          })();
        } else {
          // Nếu không có form instance, thực hiện trực tiếp
          const data = {} as T;
          await handler(data);
          handleSuccess(data);
        }
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [formContext, debug]
  );
  
  /**
   * Xử lý khi submit thành công
   */
  const handleSuccess = useCallback(
    (data: T) => {
      // Cập nhật trạng thái thành công
      formContext.setStatus("success");
      formContext.setSuccess(successMessage);
      
      if (debug) {
        console.debug("[useFormActions] Form submit thành công:", data);
      }
      
      // Thực hiện callback onSuccess nếu có
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Reset form nếu được yêu cầu
      if (resetOnSuccess && formContext.form) {
        formContext.form.reset();
        
        if (debug) {
          console.debug("[useFormActions] Reset form sau khi submit thành công");
        }
      }
    },
    [formContext, successMessage, onSuccess, resetOnSuccess, debug]
  );
  
  /**
   * Xử lý khi xảy ra lỗi
   */
  const handleError = useCallback(
    (error: unknown) => {
      // Cập nhật trạng thái lỗi
      formContext.setStatus("error");
      
      let errorMessage = "Có lỗi xảy ra khi xử lý form";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      formContext.setError(errorMessage);
      
      if (debug) {
        console.debug("[useFormActions] Form submit thất bại:", error);
      }
      
      // Thực hiện callback onError nếu có
      if (onError && error instanceof Error) {
        onError(error);
      }
    },
    [formContext, onError, debug]
  );
  
  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    // Reset form trong context
    formContext.reset();
    
    // Reset form instance nếu có
    if (formContext.form) {
      formContext.form.reset();
    }
    
    if (debug) {
      console.debug("[useFormActions] Form đã được reset");
    }
  }, [formContext, debug]);
  
  /**
   * Đặt lại trạng thái form về ban đầu
   */
  const clearFormStatus = useCallback(() => {
    formContext.setStatus("idle");
    
    if (debug) {
      console.debug("[useFormActions] Trạng thái form đã được đặt lại");
    }
  }, [formContext, debug]);
  
  /**
   * Set lỗi thủ công
   */
  const setFormError = useCallback(
    (message: string) => {
      formContext.setError(message);
      
      if (debug) {
        console.debug("[useFormActions] Đặt lỗi form:", message);
      }
    },
    [formContext, debug]
  );
  
  /**
   * Set thành công thủ công
   */
  const setFormSuccess = useCallback(
    (message: string) => {
      formContext.setSuccess(message);
      
      if (debug) {
        console.debug("[useFormActions] Đặt thành công form:", message);
      }
    },
    [formContext, debug]
  );
  
  return {
    // Actions
    submitForm,
    resetForm,
    clearFormStatus,
    setFormError,
    setFormSuccess,
    
    // Trạng thái của form
    isSubmitting: formContext.isSubmitting,
    isSuccess: formContext.isSuccess,
    isError: formContext.isError,
    errorMessage: formContext.errorMessage,
    successMessage: formContext.successMessage,
  };
}

export { useFormActions };
export type { UseFormActionsOptions }; 