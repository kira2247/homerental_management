"use client";

import React, { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PropertyForm } from "@/components/properties/forms/property-form";
import { useProperty, useUpdateProperty } from "@/lib/hooks";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { useToast } from "@/lib/hooks/ui";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, Loader2 } from 'lucide-react';
import { ApiResponse, Property } from "@/lib/api";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import { useLocale } from '@/lib/i18n/client';

export default function EditPropertyPage({
  params
}: {
  params: { locale: string; id: string }
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const propertyId = params.id;
  const locale = params.locale;
  
  // Fetch property
  const { data: property, isLoading: isLoadingProperty, error: loadingError, refetch } = useProperty({ id: propertyId });
  
  // Trigger refetch if property is not found but not loading
  useEffect(() => {
    if (!property && !isLoadingProperty && !loadingError) {
      refetch();
    }
  }, [property, isLoadingProperty, loadingError, refetch]);
  
  // Update property mutation
  const { mutate: updateProperty, isPending: isUpdating } = useUpdateProperty();
  
  // Hàm xử lý cập nhật thông tin bất động sản
  const handleUpdateProperty = useCallback((data: PropertyFormData) => {
    if (!propertyId || isUpdating) return;
    
    // Chuẩn bị dữ liệu gửi đi
    const updateData = { ...data };
    
    // Xóa thumbnail nếu rỗng để backend xử lý giá trị mặc định
    if (updateData.thumbnail === "" || !updateData.thumbnail) {
      delete updateData.thumbnail;
    }

    // Xử lý dữ liệu images 
    if (typeof updateData.images === 'string') {
      try {
        updateData.images = JSON.parse(updateData.images);
      } catch (e) {
        updateData.images = [];
      }
    }

    // Xóa trường images nếu là mảng rỗng
    if (Array.isArray(updateData.images) && updateData.images.length === 0) {
      delete updateData.images;
    }
    
    updateProperty({ id: propertyId, data: updateData as any }, {
      onSuccess: (property: Property) => {
        toast({ 
          title: t('properties.notifications.updateSuccess'),
          description: t('properties.notifications.updateSuccess') 
        });
        // Redirect back to the property detail page
        router.push(`/${locale}/properties/${propertyId}`);
      },
      onError: (error: Error) => {
        toast({
          title: t('common.error'),
          description: error.message || t('properties.notifications.unexpectedError'),
          variant: "destructive"
        });
      },
    });
  }, [propertyId, isUpdating, updateProperty, toast, t, router]);

  const handleCancel = () => {
    router.push(`/${locale}/properties/${propertyId}`);
  };

  // Add handleEdit function to navigate to edit page
  const handleEdit = () => {
    router.push(`/properties/${propertyId}/edit`);
  };

  if (isLoadingProperty) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-12 w-1/2 mb-6" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container py-6 text-center">
        <p className="text-red-500">
          {t('properties.errors.loadingError', { message: loadingError.message })}
        </p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          {t('properties.buttons.goBack')}
        </Button>
      </div>
    );
  }

  if (!property) {
     return (
      <div className="container py-6 text-center">
        <p>{t('properties.errors.notFound')}</p>
        <Button variant="outline" onClick={() => router.push(`/${locale}/properties`)} className="mt-4">
          {t('properties.buttons.backToProperties')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/properties`} className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              {t('properties.title')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${locale}/properties/${propertyId}`}>
              {property.name || t('properties.propertyDetail.title')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('properties.editProperty.title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {t('properties.editProperty.titleWithName', { name: property.name })}
      </h1>

      {/* Pass handleEdit to PropertyHero if needed, or handle navigation directly */}
      {/* Example: Modify PropertyHero or add button here */}
      {/* <Button onClick={handleEdit} variant="outline" className="mb-4">Edit Property</Button> */}
      
      <PropertyForm
        property={property}
        onSubmit={handleUpdateProperty}
        onCancel={handleCancel}
        isLoading={isUpdating}
      />
    </div>
  );
} 