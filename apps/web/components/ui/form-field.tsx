"use client";

import React from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";
import { uiLogger } from '@/lib/utils/logging';
import { FormField as BaseFormField } from "./form";

interface FormFieldProps<T extends FieldValues> {
  /**
   * Tên của trường trong form
   */
  name: Path<T>;
  
  /**
   * Label hiển thị cho trường
   */
  label?: string;
  
  /**
   * Mô tả cho trường (hiển thị dưới control)
   */
  description?: string;
  
  /**
   * Hiển thị dấu * cho trường bắt buộc
   * @default false
   */
  required?: boolean;
  
  /**
   * Render function cho control
   */
  children: React.ReactNode | ((props: { field: any; error: any }) => React.ReactNode);
  
  /**
   * Lớp CSS tùy chỉnh cho container
   */
  className?: string;
}

/**
 * Component FormField nâng cao tích hợp với FormContext
 * 
 * @example
 * <FormField name="email" label="Email" required>
 *   {({ field, error }) => (
 *     <Input {...field} placeholder="email@example.com" />
 *   )}
 * </FormField>
 */
function FormField<T extends FieldValues>({
  name,
  label,
  description,
  required = false,
  children,
  className,
}: FormFieldProps<T>) {
  // Sử dụng form context
  const formContext = useFormContext<T>();
  
  // Nếu không có form context, hiển thị lỗi
  if (!formContext) {
    uiLogger.error("FormField must be used inside a FormProvider with a form instance");
    return null;
  }
  
  return (
    <BaseFormField
      control={formContext.control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={className}>
          {typeof children === "function" ? 
            children({ field, error: fieldState.error }) : 
            children}
        </div>
      )}
    />
  );
}

export { FormField };
export type { FormFieldProps }; 