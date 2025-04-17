"use client";

import React, { useEffect, useCallback, useState, useRef } from 'react';
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
  
  // State theo dõi thay đổi form
  const [formData, setFormData] = useState<PropertyFormData | null>(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const originalDataRef = useRef<PropertyFormData | null>(null);
  
  // Fetch property
  const { data: property, isLoading: isLoadingProperty, error: loadingError, refetch } = useProperty({ id: propertyId });
  
  // Lưu trữ dữ liệu gốc để so sánh
  useEffect(() => {
    if (property && !originalDataRef.current) {
      originalDataRef.current = property as unknown as PropertyFormData;
    }
  }, [property]);
  
  // Trigger refetch if property is not found but not loading
  useEffect(() => {
    if (!property && !isLoadingProperty && !loadingError) {
      refetch();
    }
  }, [property, isLoadingProperty, loadingError, refetch]);
  
  // Update property mutation
  const { mutate: updateProperty, isPending: isUpdating } = useUpdateProperty();
  
  // Xử lý thay đổi form
  const handleFormChange = (data: PropertyFormData) => {
    setFormData(data);
    // Kiểm tra xem form có thay đổi không
    if (originalDataRef.current) {
      const hasChanges = JSON.stringify(data) !== JSON.stringify(originalDataRef.current);
      setIsFormChanged(hasChanges);
    }
  };
  
  
  // Hàm xử lý cập nhật thông tin bất động sản - hỗ trợ cả FormData và JSON
  const handleUpdateProperty = useCallback((data: PropertyFormData | FormData, hasFile?: boolean) => {
    if (!propertyId || isUpdating) {
      console.error('Cannot update: Missing propertyId or already updating');
      return;
    }
    
    if (data instanceof FormData) {
      // TH1: Dữ liệu là FormData - gửi trực tiếp lên backend
      
      // Gọi API multipart/form-data - sử dụng XHR trực tiếp hoặc fetch API để gửi file
      // Backend cần có API endpoint riêng để xử lý file upload
      // Tạm thời sử dụng mutation của tanstack query (cần backend hỗ trợ multipart/form-data)
      updateProperty({ id: propertyId, data: data as any }, {
        onSuccess: handleSuccess,
        onError: handleError
      });
    } else {
      // TH2: Dữ liệu là JSON object thông thường
      // Sao chép dữ liệu và LOẠI BỎ CÁC TRƯỜNG GÂY LỖI
      const updateData = { ...data };
      
      // Xóa hẳn các trường gây lỗi với backend API       
      delete (updateData as any)._dirtyFlag;
      
      
      // Gọi trực tiếp mutation với dữ liệu đã lọc sạch
      updateProperty({ id: propertyId, data: updateData as any }, {
      onSuccess: handleSuccess,
      onError: handleError,
    });
    }
  }, [propertyId, isUpdating, updateProperty]);
  
  // Tách các hàm xử lý success/error thành hàm riêng để tái sử dụng
  const handleSuccess = useCallback((property: Property) => {
    // Loại bỏ thông báo toast ở đây để tránh hiển thị thông báo trùng lặp
    // Thông báo đã được hiển thị trong PropertyForm.submitForm
    
    // Redirect back to the property detail page
    router.push(`/${locale}/properties/${propertyId}`);
  }, [router, locale, propertyId]);
  
  const handleError = useCallback((error: Error) => {
    console.error('Update ERROR:', error);
    toast({
      title: t('common.error'),
      description: error.message || t('properties.notifications.unexpectedError'),
      variant: "destructive"
    });
  }, [toast, t]);

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
            
      <PropertyForm
        property={property}
        onSubmit={handleUpdateProperty}
        onCancel={handleCancel}
        isLoading={isUpdating}
        onChange={handleFormChange}
        isChanged={isFormChanged}
      />
    </div>
  );
} 