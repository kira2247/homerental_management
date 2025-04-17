"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { propertySchema, PropertyFormData } from "@/lib/schemas/property.schema";
import { Property } from "@/lib/types";
import { Save, X, Image } from "lucide-react";
import { useLocale } from '@/lib/i18n/client';
import { propertyApiService } from "@/lib/api/property-api-service";
import { toast } from "@/components/ui/use-toast";

// Import section components
import { PropertyBasicInfoSection } from "./property-basic-info-section";
import { PropertyLocationSection } from "./property-location-section";
import { PropertyUtilitiesSection } from "./property-utilities-section";
interface PropertyFormProps {
  property?: Property | null; // Property data for editing, null/undefined for creating
  onSubmit: (data: PropertyFormData | FormData) => void;
  onCreate?: (data: PropertyFormData | FormData) => void; // Tách riêng hàm tạo mới nếu cần
  onCancel: () => void;
  isLoading?: boolean;
  onChange?: (data: PropertyFormData) => void; // Callback khi form thay đổi
  isChanged?: boolean; // Trạng thái form đã thay đổi (do component cha kiểm soát)
  isCreateMode?: boolean; // Xác định form đang ở chế độ tạo mới
}

export function PropertyForm({
  property,
  onSubmit,
  onCreate,
  onCancel,
  isLoading = false,
  onChange,
  isChanged,
  isCreateMode = false, // Mặc định là false (chế độ chỉnh sửa)
}: PropertyFormProps) {
  // State variables for thumbnail management
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [deleteThumbnail, setDeleteThumbnail] = React.useState<boolean>(false);
  // Thêm state để theo dõi trạng thái đang xử lý form
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const { t } = useLocale();
  
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
      defaultOtherFees: property?.defaultOtherFees || {},
      additionalFacilities: property?.additionalFacilities || {},      
    },
  });

  // Helper to get description from schema
  const getFieldDescription = (fieldName: keyof PropertyFormData): string => {
    const description = propertySchema.shape[fieldName]?.description;
    return description || "";
  }
  
  // Handle thumbnail file change
  const handleThumbnailChange = (file: File | null) => {
    setThumbnailFile(file);
    setDeleteThumbnail(false); // Reset delete flag when a new thumbnail is selected
    
    // Thông báo thay đổi cho component cha nếu có callback onChange
    if (onChange) {
      const currentFormData = form.getValues();
      onChange(currentFormData);
    }
  };
  
  // Handle thumbnail deletion
  const handleThumbnailDelete = () => {
    setThumbnailFile(null);
    setDeleteThumbnail(true);
    
    // Thông báo thay đổi cho component cha nếu có callback onChange
    if (onChange) {
      const currentFormData = form.getValues();
      onChange(currentFormData);
    }
  };

  // Sử dụng isDirty từ form nếu không có isChanged từ component cha
  const { isDirty } = form.formState;
  // Cập nhật hasChanges để tính cả việc thay đổi ảnh
  const hasChanges = isChanged !== undefined ? isChanged : (isDirty || thumbnailFile !== null || deleteThumbnail);
  const isEditMode = !!property;
  
  // Theo dõi sự thay đổi và thông báo lên component cha
  React.useEffect(() => {
    if (onChange) {
      const subscription = form.watch((formData) => {
        onChange(formData as PropertyFormData);
      });
      
      return () => subscription.unsubscribe();
    }
    
    // Return empty function nếu không có onChange
    return () => {};
  }, [form, onChange]);

  // Hàm xử lý submit form data - tách riêng phần upload thumbnail và submit dữ liệu
  const handleSubmit = async (data: PropertyFormData) => {
    try {
      // Đánh dấu bắt đầu xử lý form
      setIsSubmitting(true);
      
      // Tạo bản sao để xử lý dữ liệu an toàn
      const processedData = { ...data };
      
      // Đảm bảo ownerId và userId được gửi đi
      if (isEditMode && property) {
        // Khi cập nhật, sử dụng ownerId và userId từ property hiện tại nếu có
        if (property.ownerId) {
          processedData.ownerId = property.ownerId;
        }
        if (property.userId) {
          processedData.userId = property.userId;
        }
      }
      
      // Chỉ xử lý thumbnail khi KHÔNG ở chế độ tạo mới
      if (!isCreateMode) {
        // STEP 1: Xử lý upload thumbnail riêng biệt nếu có file mới
        if (thumbnailFile) {
          
          try {
            // Nếu có thumbnail mới, upload riêng
            let thumbnailUrl = data.thumbnail;
            
            if (thumbnailFile) {
              try {
                // Nếu đang cập nhật property đã tồn tại và có file mới
                if (isEditMode && property?.id) {
                  const thumbnailResponse = await propertyApiService.uploadPropertyThumbnail(
                    property.id,
                    thumbnailFile
                  );
                  
                  if (thumbnailResponse.success && thumbnailResponse.data) {
                    thumbnailUrl = thumbnailResponse.data.url;
                  } else {
                    console.error('Error uploading thumbnail:', thumbnailResponse.error);
                    toast({
                      title: "Lỗi upload ảnh",
                      description: thumbnailResponse.error?.message || "Không xác định",
                      variant: "destructive",
                    });
                    return; // Dừng quá trình submit nếu upload thất bại
                  }
                }
              } catch (error) {
                console.error('Error uploading thumbnail:', error);
                toast({
                  title: "Lỗi upload ảnh",
                  description: error instanceof Error ? error.message : "Không xác định",
                  variant: "destructive",
                });
                return; // Dừng quá trình submit nếu upload thất bại
              }
            }
            
            // Thành công: Lưu URL thumbnail vào dữ liệu
            if (thumbnailUrl) {
              processedData.thumbnail = thumbnailUrl;
            } else {
              toast({
                title: "Lỗi upload ảnh",
                description: "Không nhận được URL ảnh sau khi upload",
                variant: "destructive",
              });
              return; // Dừng quá trình submit nếu không có URL
            }
          } catch (uploadError) {
            console.error('Error during thumbnail upload:', uploadError);
            toast({
              title: "Lỗi upload ảnh",
              description: uploadError instanceof Error ? uploadError.message : "Không xác định",
              variant: "destructive",
            });
            return; // Dừng quá trình submit nếu upload thất bại
          }
        }
        
        // STEP 2: Xử lý flag xóa thumbnail nếu cần
        if (deleteThumbnail) {
          console.log('Setting deleteThumbnail flag in data');
          processedData.deleteThumbnail = true;
          processedData.thumbnail = null; // Đặt thumbnail thành null để xóa
        }
      } else {
        // Khi ở chế độ tạo mới, xóa hoàn toàn các trường liên quan đến thumbnail
        delete processedData.thumbnail;
        // Không cần xóa thumbnailId vì nó không có trong PropertyFormData
        delete processedData.deleteThumbnail;
      }
      
      // STEP 3: Submit dữ liệu JSON thông thường (không có file)
      console.log('Submitting property data as JSON:', processedData);
      return submitForm(processedData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Lỗi xử lý form",
        description: error instanceof Error ? error.message : "Lỗi không xác định khi xử lý form",
        variant: "destructive",
      });
    } finally {
      // Đánh dấu kết thúc xử lý form dù thành công hay thất bại
      setIsSubmitting(false);
    }
  };

  // Hàm submit form - đã đơn giản hóa vì không cần xử lý FormData nữa
  const submitForm = async (processedData: PropertyFormData) => {
    try {      
      // Đánh dấu bắt đầu xử lý form (đảm bảo nút vẫn bị vô hiệu hóa)
      setIsSubmitting(true);
      
      // Enhanced logging - log chi tiết dữ liệu trước khi gửi
      console.log(`%c[PropertyForm] Submitting form data for ${isEditMode ? 'update' : 'create'} operation...`, 'color: #4CAF50; font-weight: bold');
      console.log('%c[PropertyForm] Request details:', 'color: #2196F3; font-weight: bold', {
        isEditMode: isEditMode,
        propertyId: property?.id,
        userId: property?.userId, // Log userId từ property
        ownerId: property?.ownerId, // Log ownerId từ property
      });
      
      // Gửi dữ liệu form
      let messageDisplayed = false;

      if (isEditMode && property?.id) {
        // Cập nhật property
        console.log(`Updating existing property with ID: ${property.id}`);
        await onSubmit(processedData);
        console.log('Update request completed successfully');
        
        // Hiển thị thông báo thành công chỉ khi cập nhật
        toast({
          title: "Cập nhật thành công",
          description: "Thông tin bất động sản đã được cập nhật",
          variant: "default",
        });
        messageDisplayed = true;
      } else {
        // Tạo mới property
        console.log('Creating new property...');
        if (onCreate) {
          await onCreate(processedData);
        } else {
          await onSubmit(processedData);
        }
        console.log('Create request completed successfully');
        
        // Hiển thị thông báo thành công chỉ khi tạo mới
        if (!messageDisplayed) {
          toast({
            title: "Tạo mới thành công",
            description: "Bất động sản mới đã được tạo thành công",
            variant: "default",
          });
        }
        
        // Reset form và các state liên quan nếu create thành công
        console.log('Resetting form after successful create');
        form.reset();
        
        // Chỉ reset các state liên quan đến thumbnail nếu không ở chế độ tạo mới
        // Vì ở chế độ tạo mới, chúng ta đã loại bỏ hoàn toàn phần thumbnail
        if (!isCreateMode) {
          setThumbnailFile(null);
          setDeleteThumbnail(false);
        }
      }
    } catch (error) {
      console.error('Error in submitForm:', error);
      
      // Hiển thị thông báo chi tiết về lỗi
      let errorMessage = 'Lỗi không xác định khi gửi form';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Kiểm tra nếu là ApiErrorResponse
        if ('error' in error && typeof error.error === 'object' && error.error !== null) {
          if ('message' in error.error) {
            errorMessage = String(error.error.message);
          }
        }
      }
      
      console.error('Detailed error:', errorMessage);
      
      // Hiển thị thông báo lỗi cho người dùng
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Re-throw lỗi để component cha có thể xử lý nếu cần
      throw error;
    } finally {
      // Đánh dấu kết thúc xử lý form dù thành công hay thất bại
      setIsSubmitting(false);
    }
  };
  
  return (
    <>

      
      {/* Form chỉ để render các trường, KHÔNG có sự kiện submit */}
      <Form {...form}>
      <form 
        onSubmit={(e) => {
          // Chặn hành vi submit mặc định
          e.preventDefault();
          return false;
        }} 
        className="space-y-8"
      >
        {/* Section: Basic Information */}
        <PropertyBasicInfoSection 
          form={form} 
          getFieldDescription={getFieldDescription}
          property={property}
          onThumbnailChange={handleThumbnailChange}
          onThumbnailDelete={handleThumbnailDelete}
          thumbnailFile={thumbnailFile}
          showThumbnail={!isCreateMode} // Ẩn thumbnail trong chế độ tạo mới
        />
        
        {/* Section: Location */}
        <PropertyLocationSection form={form} getFieldDescription={getFieldDescription} />
        
        {/* Section: Utilities & Rates */}
        <PropertyUtilitiesSection form={form} getFieldDescription={getFieldDescription} />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            {t('properties.buttons.cancel')}
          </Button>
          
          {/* Nút Lưu được thay đổi thành button type="button" và gọi trực tiếp submitForm */}
          <Button 
            type="button"
            onClick={() => form.handleSubmit(handleSubmit)()}
            disabled={isLoading || isSubmitting || !hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading || isSubmitting ? t('properties.buttons.saving') : (isEditMode ? t('properties.buttons.save') : t('properties.buttons.create'))}
          </Button>
        </div>
      </form>
    </Form>
    </>

  );
} 