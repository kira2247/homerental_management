"use client";

import React from "react";
import { FieldValues, Path } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormSelectProps<T extends FieldValues> {
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
   * Placeholder cho select khi chưa chọn
   */
  placeholder?: string;
  
  /**
   * Danh sách options cho select
   */
  options: SelectOption[];
  
  /**
   * Hiển thị dấu * cho trường bắt buộc
   * @default false
   */
  required?: boolean;
  
  /**
   * Vô hiệu hóa select
   * @default false
   */
  disabled?: boolean;
  
  /**
   * CSS class cho container
   */
  containerClassName?: string;
  
  /**
   * CSS class cho label
   */
  labelClassName?: string;
  
  /**
   * CSS class cho select trigger
   */
  selectClassName?: string;
  
  /**
   * CSS class cho description
   */
  descriptionClassName?: string;
}

/**
 * Component FormSelect tích hợp với form context
 * 
 * @example
 * // Import trực tiếp
 * import { FormSelect } from '@/components/ui/form-select';
 * 
 * // Sử dụng với React Hook Form
 * function MyForm() {
 *   const form = useForm({
 *     defaultValues: { country: '' }
 *   });
 * 
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormSelect 
 *           name="country" 
 *           label="Country" 
 *           placeholder="Select a country"
 *           options={[
 *             { value: "us", label: "United States" },
 *             { value: "ca", label: "Canada" },
 *           ]}
 *           required 
 *         />
 *         <button type="submit">Submit</button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
 */
function FormSelect<T extends FieldValues>({
  name,
  label,
  description,
  placeholder = "Select an option",
  options = [],
  required = false,
  disabled = false,
  containerClassName,
  labelClassName,
  selectClassName,
  descriptionClassName,
}: FormSelectProps<T>) {
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
      render={({ field }) => (
        <FormItem className={containerClassName}>
          {label && (
            <FormLabel className={labelClassName}>
              {label}
              {requiredIndicator}
            </FormLabel>
          )}
          <Select
            disabled={disabled}
            onValueChange={field.onChange}
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger className={selectClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

export { FormSelect };
export type { FormSelectProps }; 