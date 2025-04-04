export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 'google-drive' | 'supabase';
  mimetype: string;
  size: number;
  id: string;
} 