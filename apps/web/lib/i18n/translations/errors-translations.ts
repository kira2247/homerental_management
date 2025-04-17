import { TranslationDictionary } from '@/lib/i18n/types';

export const errors: TranslationDictionary = {
  unknownError: {
    en: 'An unknown error occurred',
    vi: 'Đã Xảy Ra Lỗi Không Xác Định'
  },
  errorOccurred: {
    en: 'Error',
    vi: 'Lỗi'
  },
  common: {
    unknown: {
      en: 'An unknown error occurred',
      vi: 'Đã Xảy Ra Lỗi Không Xác Định'
    },
    server: {
      en: 'Server error',
      vi: 'Lỗi Máy Chủ'
    },
    networkError: {
      en: 'Network error',
      vi: 'Lỗi Kết Nối'
    }
  },
  validation: {
    required: {
      en: 'This field is required',
      vi: 'Trường Này Là Bắt Buộc'
    },
    email: {
      en: 'Invalid email address',
      vi: 'Địa Chỉ Email Không Hợp Lệ'
    },
    minLength: {
      en: 'Must be at least {{min}} characters',
      vi: 'Phải Có Ít Nhất {{min}} Ký Tự'
    },
    maxLength: {
      en: 'Must be at most {{max}} characters',
      vi: 'Không Được Vượt Quá {{max}} Ký Tự'
    },
    passwordMismatch: {
      en: 'Passwords do not match',
      vi: 'Mật Khẩu Không Khớp'
    },
    invalidFormat: {
      en: 'Invalid format',
      vi: 'Định Dạng Không Hợp Lệ'
    },
    invalidNumber: {
      en: 'Please enter a valid number',
      vi: 'Vui Lòng Nhập Số Hợp Lệ'
    },
    invalidDate: {
      en: 'Please enter a valid date',
      vi: 'Vui Lòng Nhập Ngày Hợp Lệ'
    }
  },
  auth: {
    invalidCredentials: {
      en: 'Invalid email or password',
      vi: 'Email Hoặc Mật Khẩu Không Hợp Lệ'
    },
    userNotFound: {
      en: 'User not found',
      vi: 'Không Tìm Thấy Người Dùng'
    },
    emailAlreadyExists: {
      en: 'Email already exists',
      vi: 'Email Đã Tồn Tại'
    },
    unauthorized: {
      en: 'Unauthorized access',
      vi: 'Truy Cập Không Được Phép'
    },
    sessionExpired: {
      en: 'Your session has expired. Please log in again',
      vi: 'Phiên Làm Việc Đã Hết Hạn. Vui Lòng Đăng Nhập Lại'
    }
  }
}; 