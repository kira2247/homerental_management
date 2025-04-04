"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { useLocale } from '@/lib/i18n/client';
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/ui";

// Mock function để mô phỏng việc upload file lên server
// Trong thực tế, bạn sẽ cần triển khai API upload thực tế
const uploadImageToServer = async (file: File): Promise<string> => {
  // Giả lập thời gian upload
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Tạo URL tạm thời cho hình ảnh - Trong thực tế, đây sẽ là URL từ server trả về
  // URL này chỉ dùng cho demo, trong ứng dụng thực tế cần triển khai API upload thực
  return URL.createObjectURL(file);
};

interface PropertyImagesSectionProps {
  form: UseFormReturn<PropertyFormData>;
  getFieldDescription: (fieldName: keyof PropertyFormData) => string;
}

export function PropertyImagesSection({ form, getFieldDescription }: PropertyImagesSectionProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  
  // Khi component được load, khởi tạo imageUrls từ form nếu có
  React.useEffect(() => {
    const initialImages = form.getValues('images') || [];
    if (initialImages.length > 0) {
      setImageUrls(initialImages);
    }
  }, [form]);
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Upload từng file lên server và lấy về URLs
      const uploadPromises = Array.from(files).map(uploadImageToServer);
      const newUrls = await Promise.all(uploadPromises);
      
      // Cập nhật state và form
      setImageUrls(prevUrls => [...prevUrls, ...newUrls]);
      
      // Cập nhật giá trị trong form
      const currentUrls = form.getValues('images') || [];
      form.setValue('images', [...currentUrls, ...newUrls], { 
        shouldDirty: true,
        shouldValidate: true 
      });

      toast({
        title: t('common.success'),
        description: t('properties.form.fields.images.uploadSuccess'),
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: t('common.error'),
        description: t('properties.form.fields.images.uploadError'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      
      // Reset input value để có thể chọn cùng một file nhiều lần
      if (e.target) {
        e.target.value = '';
      }
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    // Remove from state
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    
    // Remove from form value
    const currentUrls = form.getValues('images') || [];
    const newUrls = currentUrls.filter((_, i) => i !== index);
    form.setValue('images', newUrls, { 
      shouldDirty: true,
      shouldValidate: true 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('properties.form.sections.images.title')}</CardTitle>
        <CardDescription>{t('properties.form.sections.images.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('properties.form.fields.thumbnail.label')}</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder={t('properties.form.fields.thumbnail.placeholder')} 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>{getFieldDescription('thumbnail')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="images">{t('properties.form.fields.images.label')}</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="images" 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className={uploading ? "opacity-50 cursor-not-allowed" : ""}
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-sm text-gray-500">
            {t('properties.form.fields.images.description')}
          </p>
        </div>
        
        {imageUrls.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">{t('properties.form.fields.images.previewTitle')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative rounded-md overflow-hidden border h-[120px]">
                  <Image
                    src={url}
                    alt={`Image preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} value={JSON.stringify(field.value || [])} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
} 