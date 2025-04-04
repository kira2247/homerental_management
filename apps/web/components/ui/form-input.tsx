"use client";

import React from "react";
import { FieldValues, Path } from "react-hook-form";
import { Input, InputProps } from "./input";
import { 
  FormField,
  FormItem,
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage
} from "./form";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/lib/form";

interface FormInputProps<T extends FieldValues> extends Omit<InputProps, "name"> {
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
   * Placeholder cho input
   */
  placeholder?: string;
  
  /**
   * Hiển thị dấu * cho trường bắt buộc
   * @default false
   */
  required?: boolean;
  
  /**
   * CSS class cho container
   */
  containerClassName?: string;
  
  /**
   * CSS class cho label
   */
  labelClassName?: string;
  
  /**
   * CSS class cho input
   */
  inputClassName?: string;
  
  /**
   * CSS class cho description
   */
  descriptionClassName?: string;
}

/**
 * Component FormInput tích hợp với form context
 * 
 * @example
 * <FormInput name="email" label="Email" placeholder="email@example.com" required />
 */
function FormInput<T extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  required = false,
  containerClassName,
  labelClassName,
  inputClassName,
  descriptionClassName,
  type = "text",
  ...rest
}: FormInputProps<T>) {
  // Sử dụng form context nếu có
  let formContext;
  try {
    formContext = useFormContext<T>();
  } catch (error) {
    // Form context không bắt buộc cho component này
  }
  
  // Helper để tạo required indicator
  const requiredIndicator = required ? <span className="text-destructive ml-1">*</span> : null;
  
  return (
    <FormField
      control={formContext?.form?.control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <FormItem className={containerClassName}>
          {label && (
            <FormLabel className={labelClassName}>
              {label}
              {requiredIndicator}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type={type}
              className={cn(error && "border-destructive", inputClassName)}
              placeholder={placeholder}
              {...field}
              {...rest}
            />
          </FormControl>
          {description && (
            <FormDescription className={descriptionClassName}>
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { FormInput };
export type { FormInputProps }; 