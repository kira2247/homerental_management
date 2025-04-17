"use client";

import React from "react";
import { FieldValues, Path } from "react-hook-form";
import { Textarea } from "./textarea";
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

interface FormTextareaProps<T extends FieldValues> extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
   * Placeholder cho textarea
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
   * CSS class cho textarea
   */
  textareaClassName?: string;
  
  /**
   * CSS class cho description
   */
  descriptionClassName?: string;
  
  /**
   * Số hàng hiển thị mặc định
   * @default 3
   */
  rows?: number;
  
  /**
   * Giới hạn số ký tự
   */
  maxLength?: number;
}

/**
 * Component FormTextarea tích hợp với form context
 * 
 * @example
 * // Import trực tiếp
 * import { FormTextarea } from '@/components/ui/form-textarea';
 * 
 * // Sử dụng với React Hook Form
 * function MyForm() {
 *   const form = useForm({
 *     defaultValues: { description: '' }
 *   });
 * 
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormTextarea 
 *           name="description" 
 *           label="Description" 
 *           placeholder="Enter description"
 *           rows={4}
 *           required 
 *         />
 *         <button type="submit">Submit</button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
 */
function FormTextarea<T extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  required = false,
  containerClassName,
  labelClassName,
  textareaClassName,
  descriptionClassName,
  rows = 3,
  maxLength,
  ...rest
}: FormTextareaProps<T>) {
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
            <Textarea
              className={cn(error && "border-destructive", textareaClassName)}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
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

export { FormTextarea };
export type { FormTextareaProps }; 