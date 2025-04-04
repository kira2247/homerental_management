"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { propertySchema, PropertyFormData } from "@/lib/schemas/property.schema";
import { Property } from "@/lib/api/types";
import { Save, X } from "lucide-react";
import { useLocale } from '@/lib/i18n/client';

// Import section components
import { PropertyBasicInfoSection } from "./property-basic-info-section";
import { PropertyLocationSection } from "./property-location-section";
import { PropertyUtilitiesSection } from "./property-utilities-section";
import { PropertyImagesSection } from "./property-images-section";

interface PropertyFormProps {
  property?: Property | null; // Property data for editing, null/undefined for creating
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({ property, onSubmit, onCancel, isLoading = false }: PropertyFormProps) {
  const { t } = useLocale();
  
  // Xác định URL ảnh mặc định để xử lý đặc biệt
  const DEFAULT_THUMBNAIL_URL = "/images/WMallingshowhome-67-720x479.jpg";
  
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property?.name || "",
      type: property?.type || undefined,
      status: property?.status || undefined,
      address: property?.address || "",
      city: property?.city || "",
      district: property?.district || "",
      ward: property?.ward || "",
      defaultElectricityRate: property?.defaultElectricityRate || 0,
      defaultWaterRate: property?.defaultWaterRate || 0,
      defaultInternetRate: property?.defaultInternetRate || 0,
      defaultGarbageRate: property?.defaultGarbageRate || 0,
      hasSecurity: property?.hasSecurity || false,
      hasElevator: property?.hasElevator || false,
      hasParking: property?.hasParking || false,
      parkingFee: property?.parkingFee || 0,
      // Nếu thumbnail là URL mặc định, hiển thị trống
      thumbnail: (property?.thumbnail === DEFAULT_THUMBNAIL_URL) ? "" : (property?.thumbnail || ""),
      defaultOtherFees: property?.defaultOtherFees || {},
      additionalFacilities: property?.additionalFacilities || {},
      images: property?.images || [],
    },
  });

  // Helper to get description from schema
  const getFieldDescription = (fieldName: keyof PropertyFormData): string => {
    return propertySchema.shape[fieldName]?.description || "";
  }

  // Check if form has been modified
  const { isDirty } = form.formState;
  const isEditMode = !!property;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section: Basic Information */}
        <PropertyBasicInfoSection form={form} getFieldDescription={getFieldDescription} />
        
        {/* Section: Location */}
        <PropertyLocationSection form={form} getFieldDescription={getFieldDescription} />
        
        {/* Section: Utilities & Rates */}
        <PropertyUtilitiesSection form={form} getFieldDescription={getFieldDescription} />
        
        {/* Section: Images */}
        <PropertyImagesSection form={form} getFieldDescription={getFieldDescription} />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="mr-2 h-4 w-4" />
            {t('properties.buttons.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !isDirty}
            title={!isDirty ? t('properties.buttons.noChanges') : ''}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? t('properties.buttons.saving') : (isEditMode ? t('properties.buttons.save') : t('properties.buttons.create'))}
          </Button>
        </div>
      </form>
    </Form>
  );
} 