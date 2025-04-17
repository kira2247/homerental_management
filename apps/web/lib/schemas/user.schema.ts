import { z } from 'zod';

/**
 * Schema validation cho form profile
 */
export const profileSchema = z.object({
  name: z.string().min(1, { message: 'Họ và tên không được để trống' }),
  email: z.string()
    .min(1, { message: 'Email không được để trống' })
    .email({ message: 'Email không hợp lệ' }),
});

/**
 * Type inference cho form profile
 */
export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Schema validation cho form thay đổi mật khẩu
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Vui lòng nhập mật khẩu hiện tại' }),
  newPassword: z.string().min(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' }),
  confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu mới' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

/**
 * Type inference cho form thay đổi mật khẩu
 */
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
