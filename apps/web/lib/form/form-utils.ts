import { Control, FieldValues } from "react-hook-form";

/**
 * Utility function to safely cast Control type
 * 
 * Giải quyết vấn đề TypeScript khi sử dụng Control với generic types
 * mà không cần sử dụng any
 * 
 * @param control Control instance from useForm or useFormContext
 * @returns The same control instance but with correct type
 */
export function castControl<T extends FieldValues>(
  control: Control<T> | undefined
): Control<FieldValues> | undefined {
  // Đây là một type assertion an toàn vì Control<T> và Control<FieldValues>
  // về cơ bản là cùng một type, chỉ khác nhau ở generic parameter
  // Chúng ta chỉ đang giúp TypeScript hiểu rằng control có thể được sử dụng
  // với FormField mà không gây ra lỗi type
  return control as unknown as Control<FieldValues> | undefined;
}
