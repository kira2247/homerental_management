import { z } from 'zod';

/**
 * Schema validation cho form đăng nhập
 */
export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email không được để trống' })
    .email({ message: 'Email không hợp lệ' }),
  password: z.string()
    .min(1, { message: 'Mật khẩu không được để trống' }),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Type inference cho form đăng nhập
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema validation cho form đăng ký
 * (Sẽ được implement khi cập nhật trang register)
 */
export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Họ và tên không được để trống' }),
  email: z.string()
    .min(1, { message: 'Email không được để trống' })
    .email({ message: 'Email không hợp lệ' }),
  password: z.string()
    .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' }),
  confirmPassword: z.string()
    .min(1, { message: 'Vui lòng xác nhận mật khẩu' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

/**
 * Type inference cho form đăng ký
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema validation cho form quên mật khẩu
 * (Sẽ được implement khi cập nhật trang forgot-password)
 */
export const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email không được để trống' })
    .email({ message: 'Email không hợp lệ' }),
});

/**
 * Type inference cho form quên mật khẩu
 */
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema validation cho form đặt lại mật khẩu
 * (Sẽ được implement khi cập nhật trang reset-password)
 */
export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' }),
  confirmPassword: z.string()
    .min(1, { message: 'Vui lòng xác nhận mật khẩu' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

/**
 * Type inference cho form đặt lại mật khẩu
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
