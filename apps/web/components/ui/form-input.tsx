"use client";

import React, { useState, ReactNode } from "react";
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
import { Eye, EyeOff } from "lucide-react";

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

  /**
   * Icon hiển thị bên trái của input
   */
  leftIcon?: ReactNode;
}

/**
 * Component FormInput tích hợp với form context
 * 
 * @example
 * // Import trực tiếp
 * import { FormInput } from '@/components/ui/form-input';
 * 
 * // Sử dụng với React Hook Form
 * function MyForm() {
 *   const form = useForm({
 *     defaultValues: { email: '' }
 *   });
 * 
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormInput name="email" label="Email" placeholder="email@example.com" required />
 *         <button type="submit">Submit</button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
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
  leftIcon,
  ...rest
}: FormInputProps<T>) {
  // State để quản lý hiện/ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  
  // Sử dụng form context nếu có
  let formContext;
  try {
    formContext = useFormContext<T>();
  } catch (error) {
    // Form context không bắt buộc cho component này
  }
  
  // Helper để tạo required indicator
  const requiredIndicator = required ? <span className="text-destructive ml-1">*</span> : null;
  
  // Xác định loại input thực tế dựa trên type và trạng thái showPassword
  const actualType = type === "password" && showPassword ? "text" : type;
  
  // Kiểm tra có icon bên trái và có toggle password không
  const hasLeftIcon = !!leftIcon;
  const hasPasswordToggle = type === "password";
  
  // Toggle hiện/ẩn mật khẩu
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
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
            <div className="relative">
              <Input
                type={actualType}
                className={cn(
                  error && "border-destructive", 
                  hasLeftIcon && "pl-10",
                  hasPasswordToggle && "pr-10",
                  inputClassName
                )}
                placeholder={placeholder}
                {...field}
                {...rest}
              />
              {/* Left Icon if provided */}
              {leftIcon && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  {leftIcon}
                </div>
              )}
              {/* Password Toggle Button */}
              {hasPasswordToggle && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
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