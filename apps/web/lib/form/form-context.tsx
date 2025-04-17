"use client";

import React, { createContext, useContext, useState } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";

// Định nghĩa các loại trạng thái form có thể có
export type FormStatus = "idle" | "submitting" | "success" | "error";

// Định nghĩa kiểu dữ liệu cho FormContextType (sử dụng Generic để hỗ trợ nhiều loại form)
export interface FormContextType<T extends FieldValues = any> {
  // Trạng thái và thông tin của form
  status: FormStatus;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  
  // Function để cập nhật trạng thái
  setStatus: (status: FormStatus) => void;
  setError: (message: string) => void;
  setSuccess: (message: string) => void;
  reset: () => void;
  
  // Form instance từ react-hook-form (optional)
  form?: UseFormReturn<T>;
  
  // Xử lý submit
  handleSubmit: (callback: (data: T) => Promise<void> | void) => (e: React.FormEvent) => void;
}

// Tạo context với giá trị mặc định
const FormContext = createContext<FormContextType | undefined>(undefined);

// Provider props
export interface FormProviderProps<T extends FieldValues = any> {
  children: React.ReactNode;
  form?: UseFormReturn<T>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// FormProvider component
export function FormProvider<T extends FieldValues = any>({
  children,
  form,
  onSuccess,
  onError,
}: FormProviderProps<T>) {
  // Khởi tạo state
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Tính toán các giá trị phụ thuộc
  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";
  const isError = status === "error";
  
  // Function để đặt thông báo lỗi
  const setError = (message: string) => {
    setStatus("error");
    setErrorMessage(message);
    setSuccessMessage(null);
    if (onError) onError(message);
  };
  
  // Function để đặt thông báo thành công
  const setSuccess = (message: string) => {
    setStatus("success");
    setSuccessMessage(message);
    setErrorMessage(null);
    if (onSuccess) onSuccess(message);
  };
  
  // Function để reset form về trạng thái ban đầu
  const reset = () => {
    setStatus("idle");
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Nếu có form instance, gọi reset() trên form
    if (form) {
      form.reset();
    }
  };
  
  // Function xử lý submit
  const handleSubmit = (callback: (data: T) => Promise<void> | void) => async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nếu đang submit, không làm gì cả
    if (isSubmitting) return;
    
    setStatus("submitting");
    
    try {
      // Nếu có form instance, sử dụng handleSubmit của react-hook-form
      if (form) {
        await form.handleSubmit(async (data) => {
          try {
            await callback(data);
          } catch (error) {
            if (error instanceof Error) {
              setError(error.message);
            } else {
              setError("Có lỗi xảy ra khi xử lý form");
            }
          }
        })(e);
      } else {
        // Nếu không có form instance, gọi callback trực tiếp
        await callback({} as T);
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Có lỗi xảy ra khi xử lý form");
      }
    }
  };
  
  // Giá trị context
  const value: FormContextType<T> = {
    status,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    successMessage,
    setStatus,
    setError,
    setSuccess,
    reset,
    form,
    handleSubmit,
  };
  
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

// Custom hook để sử dụng FormContext
export function useFormContext<T extends FieldValues = any>(): FormContextType<T> {
  const context = useContext(FormContext);
  
  if (!context) {
    throw new Error("useFormContext phải được sử dụng bên trong FormProvider");
  }
  
  return context as FormContextType<T>;
}

export default FormContext; 