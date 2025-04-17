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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { PropertyType, PropertyStatus } from "@/lib/types";
import { useLocale } from '@/lib/i18n/client';
import { ImageUploader } from "@/components/ui/image-uploader";
import { Property } from "@/lib/types";

interface PropertyBasicInfoSectionProps {
  form: UseFormReturn<PropertyFormData>;
  getFieldDescription: (fieldName: keyof PropertyFormData) => string;
  onThumbnailChange?: (file: File | null) => void;
  onThumbnailDelete?: () => void;
  property?: Property | null;
  thumbnailFile?: File | null;
  showThumbnail?: boolean; // Thêm prop để kiểm soát việc hiển thị thumbnail
}

export function PropertyBasicInfoSection({ 
  form, 
  getFieldDescription, 
  onThumbnailChange, 
  onThumbnailDelete,
  property,
  thumbnailFile,
  showThumbnail = true // Mặc định hiển thị thumbnail
}: PropertyBasicInfoSectionProps) {
  const { t } = useLocale();
  
  // Helper to render required indicator
  const requiredIndicator = <span className="text-red-500">*</span>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('properties.form.sections.basic.title')}</CardTitle>
        <CardDescription>{t('properties.form.sections.basic.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('properties.form.fields.name.label')} {requiredIndicator}</FormLabel>
              <FormControl>
                <Input placeholder={t('properties.form.fields.name.placeholder')} {...field} />
              </FormControl>
              <FormDescription>{getFieldDescription('name')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Thumbnail & Property Type/Status */}
        <div className={`grid grid-cols-1 ${showThumbnail ? 'md:grid-cols-3' : ''} gap-6`}>
          {/* Thumbnail - chỉ hiển thị khi showThumbnail = true */}
          {showThumbnail && (
            <div>
              <FormLabel className="block mb-2">{t('properties.form.fields.thumbnail.label')}</FormLabel>
              <ImageUploader
                currentImage={property?.thumbnail}
                onImageChange={(file) => onThumbnailChange?.(file)}
                onImageDelete={onThumbnailDelete}
                type="thumbnail"
                aspectRatio="landscape"
                maxSizeMB={5}
              />
              <FormDescription className="mt-1">{t('properties.form.fields.thumbnail.description')}</FormDescription>
            </div>
          )}
          
          {/* Type and Status */}
          <div className={showThumbnail ? "md:col-span-2" : "w-full"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.type.label')} {requiredIndicator}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.form.fields.type.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PropertyType).map((type) => (
                      <SelectItem key={type} value={type}>{t(`properties.types.${type.toLowerCase()}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{getFieldDescription('type')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.status.label')} {requiredIndicator}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.form.fields.status.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PropertyStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`properties.statuses.${status.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{getFieldDescription('status')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 