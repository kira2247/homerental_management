"use client";

import React, { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PropertyForm } from "@/components/properties/forms/property-form";
import { useCreateProperty } from "@/lib/hooks";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { useToast } from "@/lib/hooks/ui";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';
import { useAuth } from '@/lib/auth/auth-context';
import { propertyLogger } from '@/lib/utils/logging';

export default function AddPropertyPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const { locale } = params;
  const { toast } = useToast();
  const { t } = useLocale();
  const { user } = useAuth();
  const { mutate: createProperty, isPending } = useCreateProperty();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCreateProperty = useCallback((data: PropertyFormData | FormData) => {
    // Kiểm tra điều kiện trước khi xử lý
    if (isPending || isRedirecting || !user) return;
    
    // Nếu dữ liệu là FormData, cần chuyển đổi hoặc xử lý đặc biệt
    if (data instanceof FormData) {
      // Tạo đối tượng dữ liệu mới với các trường bắt buộc
      const propertyData: any = {
        userId: user.id,
        ownerId: user.id,
        // Thêm các trường bắt buộc từ FormData
        name: data.get('name') as string || '',
        type: data.get('type') as string || '',
        status: data.get('status') as string || '',
        address: data.get('address') as string || '',
        city: data.get('city') as string || '',
        district: data.get('district') as string || '',
        defaultElectricityRate: Number(data.get('defaultElectricityRate')) || 0,
        defaultWaterRate: Number(data.get('defaultWaterRate')) || 0
      };
      
      createProperty(propertyData, {
        onSuccess: (property) => {
          propertyLogger.debug('CreateProperty: Response data:', property);
          
          // Xử lý response và chuyển hướng
          let propertyId;
          if (property && typeof property === 'object') {
            if ('id' in property) {
              propertyId = property.id;
            } else if ('data' in property && (property as any).data && typeof (property as any).data === 'object') {
              propertyId = (property as any).data.id;
            }
          }
          
          if (propertyId) {
            setIsRedirecting(true);
            router.push(`/${locale}/properties/${propertyId}`);
          } else {
            router.push(`/${locale}/properties`);
          }
        },
        onError: (error: Error) => {
          propertyLogger.error('Error creating property:', error);
          toast({
            title: t('common.error'),
            description: error.message || t('properties.notifications.unexpectedError'),
            variant: "destructive"
          });
          setIsRedirecting(false);
        }
      });
      return;
    }
    
    // Xử lý khi dữ liệu là PropertyFormData
    
    // Chuẩn bị dữ liệu gửi đi
    const propertyData = {
      ...(data as PropertyFormData), 
      userId: user.id,
      ownerId: user.id
    };
    
    // Xóa thumbnail nếu rỗng hoặc là giá trị đặc biệt để backend xử lý giá trị mặc định
    if (propertyData.thumbnail === "" || !propertyData.thumbnail || propertyData.thumbnail === "pending_upload") {
      delete propertyData.thumbnail;
    }

    // Xử lý dữ liệu images nếu có
    const formDataWithImages = propertyData as any; // Sử dụng type assertion để tránh lỗi TypeScript
    
    if (typeof formDataWithImages.images === 'string') {
      try {
        formDataWithImages.images = JSON.parse(formDataWithImages.images);
      } catch (e) {
        formDataWithImages.images = [];
      }
    }

    // Xóa trường images nếu là mảng rỗng
    if (Array.isArray(formDataWithImages.images) && formDataWithImages.images.length === 0) {
      delete formDataWithImages.images;
    }

    createProperty(formDataWithImages, {
      onSuccess: (property) => {
        propertyLogger.debug('CreateProperty: Response data:', property);
        
        // Khởi tạo biến để lưu ID
        let propertyId;
        
        // Tìm ID trong cấu trúc dữ liệu trả về
        if (property && typeof property === 'object') {
          // Trường hợp 1: ID nằm trực tiếp trong property
          if ('id' in property) {
            propertyId = property.id;
          } 
          // Trường hợp 2: ID nằm trong property.data (cấu trúc từ backend)
          else if ('data' in property && (property as any).data && typeof (property as any).data === 'object') {
            propertyId = (property as any).data.id;
          }
        }
        
        propertyLogger.debug('CreateProperty: Extracted ID:', propertyId);
        
        if (propertyId) {
          // Đánh dấu đang chuyển hướng để tránh gọi nhiều lần
          setIsRedirecting(true);
          
          // Chuyển hướng đến trang chi tiết bất động sản
          const redirectUrl = `/${locale}/properties/${propertyId}`;
          propertyLogger.debug('CreateProperty: Redirecting to:', redirectUrl);
          router.push(redirectUrl);
          return;
        }
        
        // Nếu không tìm thấy ID
        propertyLogger.warn('CreateProperty: No valid property ID found in response:', property);
        // Không hiển thị thông báo thành công ở đây để tránh trùng lặp
        router.push(`/${locale}/properties`);
      },
      onError: (error: Error) => {
        propertyLogger.error('Error creating property:', error);
        
        toast({
          title: t('common.error'),
          description: error.message || t('properties.notifications.unexpectedError'),
          variant: "destructive"
        });
        
        setIsRedirecting(false);
      },
    });
  }, [user, isPending, isRedirecting, t, locale, router, toast, createProperty]);

  const handleCancel = useCallback(() => {
    router.push(`/${locale}/properties`);
  }, [locale, router]);

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
            <BreadcrumbPage>{t('properties.form.addNew.title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight mb-6">{t('properties.form.addNew.title')}</h1>

      <PropertyForm
        onSubmit={handleCreateProperty}
        onCancel={handleCancel}
        isLoading={isPending || isRedirecting}
        isCreateMode={true} // Đánh dấu đang ở chế độ tạo mới để ẩn thumbnail
      />
    </div>
  );
} 