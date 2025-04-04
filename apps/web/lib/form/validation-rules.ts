"use client";

import { z } from "zod";

/**
 * Quy tắc validation cho email
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho email validation
 */
export function emailRule(message = 'Email không hợp lệ'): z.ZodString {
  return z.string().email({ message });
}

/**
 * Quy tắc validation cho password (tối thiểu 8 ký tự)
 * 
 * @param minLength - Số ký tự tối thiểu (mặc định: 8)
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho password validation
 */
export function passwordRule(
  minLength = 8,
  message = `Mật khẩu phải có ít nhất ${minLength} ký tự`
): z.ZodString {
  return z.string().min(minLength, { message });
}

/**
 * Quy tắc validation cho password yêu cầu chữ hoa, chữ thường và số
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho password phức tạp
 */
export function strongPasswordRule(
  message = 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'
): z.ZodString {
  return z.string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    { message }
  );
}

/**
 * Quy tắc validation cho trường bắt buộc
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho trường bắt buộc
 */
export function requiredStringRule(message = 'Trường này là bắt buộc'): z.ZodString {
  return z.string().min(1, { message });
}

/**
 * Quy tắc validation cho URL
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho URL validation
 */
export function urlRule(message = 'URL không hợp lệ'): z.ZodString {
  return z.string().url({ message });
}

/**
 * Quy tắc validation cho số điện thoại Việt Nam
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho phone validation
 */
export function phoneRule(message = 'Số điện thoại không hợp lệ'): z.ZodString {
  return z.string().regex(
    /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
    { message }
  );
}

/**
 * Quy tắc validation cho số
 * 
 * @param min - Giá trị tối thiểu
 * @param max - Giá trị tối đa
 * @param minMessage - Thông báo lỗi khi dưới giá trị tối thiểu
 * @param maxMessage - Thông báo lỗi khi trên giá trị tối đa
 * @returns Một ZodType cho number validation
 */
export function numberRule(
  min?: number,
  max?: number,
  minMessage?: string,
  maxMessage?: string
): z.ZodNumber {
  let schema = z.number();
  
  if (min !== undefined) {
    schema = schema.min(min, { message: minMessage || `Giá trị tối thiểu là ${min}` });
  }
  
  if (max !== undefined) {
    schema = schema.max(max, { message: maxMessage || `Giá trị tối đa là ${max}` });
  }
  
  return schema;
}

/**
 * Quy tắc validation cho ngày trong quá khứ
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho ngày trong quá khứ
 */
export function pastDateRule(message = 'Ngày phải trong quá khứ'): z.ZodDate {
  return z.date().max(new Date(), { message });
}

/**
 * Quy tắc validation cho ngày trong tương lai
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho ngày trong tương lai
 */
export function futureDateRule(message = 'Ngày phải trong tương lai'): z.ZodDate {
  return z.date().min(new Date(), { message });
}

/**
 * Quy tắc validation cho mã bưu chính
 * 
 * @param message - Thông báo lỗi tùy chỉnh
 * @returns Một ZodType cho mã bưu chính
 */
export function zipCodeRule(message = 'Mã bưu chính không hợp lệ'): z.ZodString {
  return z.string().regex(/^\d{5}$/, { message });
}

/**
 * Quy tắc validation cho khoảng giá trị
 * 
 * @param name - Tên của trường hiển thị trong thông báo
 * @param min - Giá trị tối thiểu
 * @param max - Giá trị tối đa
 * @returns Một ZodType cho khoảng giá trị
 */
export function rangeRule(name: string, min: number, max: number): z.ZodNumber {
  return z.number()
    .min(min, { message: `${name} không được nhỏ hơn ${min}` })
    .max(max, { message: `${name} không được lớn hơn ${max}` });
}

/**
 * Quy tắc validation cho độ dài chuỗi
 * 
 * @param name - Tên của trường hiển thị trong thông báo
 * @param min - Độ dài tối thiểu
 * @param max - Độ dài tối đa
 * @returns Một ZodType cho độ dài chuỗi
 */
export function stringLengthRule(name: string, min: number, max: number): z.ZodString {
  return z.string()
    .min(min, { message: `${name} phải có ít nhất ${min} ký tự` })
    .max(max, { message: `${name} không được vượt quá ${max} ký tự` });
} 