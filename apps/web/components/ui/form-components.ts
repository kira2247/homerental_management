/**
 * Form Components - Các components tùy chỉnh cho form
 */

// Re-export các form field components
export { FormField } from './form-field';
export type { FormFieldProps } from './form-field';

export { FormInput } from './form-input';
export type { FormInputProps } from './form-input';

export { FormSelect } from './form-select';
export type { FormSelectProps, SelectOption } from './form-select';

export { FormTextarea } from './form-textarea';
export type { FormTextareaProps } from './form-textarea';

export { FormSwitch } from './form-switch';
export type { FormSwitchProps } from './form-switch';

// Re-export các components cơ bản từ shadcn/ui form
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from './form';

/**
 * Cách sử dụng:
 * 
 * 1. Sử dụng các components riêng lẻ:
 * 
 * ```tsx
 * import { FormInput, FormSelect, FormTextarea, FormSwitch } from '@/components/ui/form-components';
 * 
 * function MyForm() {
 *   return (
 *     <form>
 *       <FormInput name="name" label="Họ tên" required />
 *       <FormSelect 
 *         name="country" 
 *         label="Quốc gia" 
 *         options={[
 *           { value: "vn", label: "Việt Nam" },
 *           { value: "us", label: "Hoa Kỳ" }
 *         ]} 
 *       />
 *       <FormTextarea name="description" label="Mô tả" rows={4} />
 *       <FormSwitch name="active" label="Kích hoạt" />
 *     </form>
 *   );
 * }
 * ```
 * 
 * 2. Sử dụng với FormContext và FormProvider:
 * 
 * ```tsx
 * import { useForm } from 'react-hook-form';
 * import { FormProvider } from '@/lib/form';
 * import { FormInput, FormSelect } from '@/components/ui/form-components';
 * 
 * function MyFormWithContext() {
 *   const form = useForm({
 *     defaultValues: {
 *       name: '',
 *       country: '',
 *     }
 *   });
 * 
 *   return (
 *     <FormProvider form={form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormInput name="name" label="Họ tên" required />
 *         <FormSelect name="country" label="Quốc gia" options={options} />
 *         <button type="submit">Submit</button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
 * ```
 */ 