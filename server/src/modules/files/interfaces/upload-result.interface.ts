export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 'google-drive' | 'supabase';
  mimetype: string;
  size: number;
  id: string;
  transformations?: any; // Thông tin về các biến đổi đã áp dụng cho file
} 