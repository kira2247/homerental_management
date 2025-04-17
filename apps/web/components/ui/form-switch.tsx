"use client";

import * as React from "react";
import type { FieldValues, Path } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface FormSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> {
  /**
   * Tên field trong form
   */
  name: TName;
  /**
   * Nhãn hiển thị cho field
   */
  label?: string;
  /**
   * Mô tả giải thích thêm về field
   */
  description?: string;
  /**
   * Vô hiệu hóa field
   */
  disabled?: boolean;
  /**
   * CSS classes để điều chỉnh style cho container
   */
  className?: string;
  /**
   * CSS classes để điều chỉnh style cho form item
   */
  formItemClassName?: string;
  /**
   * CSS classes để điều chỉnh style cho switch container
   */
  switchContainerClassName?: string;
  /**
   * Vị trí của nhãn: "start" (bên trái) hoặc "end" (bên phải)
   */
  labelPosition?: "start" | "end";
}

/**
 * Component FormSwitch tích hợp với form context
 * 
 * @example
 * // Import trực tiếp
 * import { FormSwitch } from '@/components/ui/form-switch';
 * 
 * // Sử dụng với React Hook Form
 * function MyForm() {
 *   const form = useForm({
 *     defaultValues: { notifications: false }
 *   });
 * 
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormSwitch 
 *           name="notifications" 
 *           label="Enable notifications" 
 *           description="Receive email notifications"
 *         />
 *         <button type="submit">Submit</button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
 */
export function FormSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>({
  name,
  label,
  description,
  disabled,
  className,
  formItemClassName,
  switchContainerClassName,
  labelPosition = "end",
}: FormSwitchProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between rounded-lg border p-4",
            formItemClassName
          )}
        >
          <div className={cn("space-y-0.5", labelPosition === "end" && "order-first", labelPosition === "start" && "order-last")}>
            {label && <FormLabel className="text-base">{label}</FormLabel>}
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
          </div>
          <FormControl>
            <div className={cn("flex items-center", switchContainerClassName)}>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
                className={className}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
} 