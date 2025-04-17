import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { PropertyStatus } from "@/lib/types";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { DEFAULT_IMAGES } from "@/lib/constants/images";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { propertyApiService, RelatedDataResponse } from "@/lib/api/property-api-service";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from '@/lib/i18n/client';

import { useDeleteItem, DeleteApiResponse } from "@/lib/hooks/shared/use-delete-item";

interface PropertyHeroProps {
  name?: string;
  status?: PropertyStatus;
  isLoading?: boolean;
  onDelete?: () => void;
  showActions?: boolean;
  thumbnail?: string;
  property?: any;
  onDeleteSuccess?: () => void;
}

export function PropertyHero({
  name,
  status,
  isLoading = false,
  onDelete,
  showActions = true,
  thumbnail,
  property,
  onDeleteSuccess
}: PropertyHeroProps) {
  const router = useRouter();
  const params = useParams<{ id: string; locale: string }>();
  const propertyId = params.id;
  const { t } = useLocale();
  const { toast } = useToast();
  
  // State để quản lý dialog xóa
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = () => {
    router.push(`/properties/${propertyId}/edit`);
  };
  
  // Sử dụng hook useDeleteItem để xử lý logic xóa property
  const { 
    isDeleting, 
    relatedData, 
    deleteItem, 
    forceDeleteItem 
  } = useDeleteItem<any>({
    deleteFn: (id: string, force: boolean): Promise<DeleteApiResponse> => {
      return propertyApiService.deleteProperty(id, force) as Promise<DeleteApiResponse>;
    },
    queryKey: ['properties', propertyId],
    itemType: 'property',
    onSuccess: (id) => {

      setShowDeleteDialog(false);
      
      // Gọi callback nếu có hoặc chuyển hướng về trang danh sách
      if (onDeleteSuccess) {

        onDeleteSuccess();
      } else {

        router.push('/properties');
      }
    },
    onError: (error) => {

    },
    onRelatedDataFound: (foundRelatedData, id) => {

    },
    debug: true
  });
  
  // Xử lý khi người dùng nhấn nút xóa
  const handleDeleteClick = () => {

    
    if (onDelete) {
      // Nếu có callback onDelete từ parent, sử dụng nó

      onDelete();
    } else {
      // Nếu không, hiển thị dialog xác nhận xóa

      setShowDeleteDialog(true);
    }
  };
  
  // Xử lý khi người dùng xác nhận xóa
  const handleConfirmDelete = () => {
    if (!propertyId) {

      return;
    }
    

    deleteItem(propertyId, name || t('properties.propertyDetail.noName') || 'Bất động sản');
  };
  
  // Xử lý khi người dùng xác nhận force delete
  const handleForceDelete = () => {
    if (!propertyId) {

      return;
    }
    


    
    forceDeleteItem(propertyId, name || t('properties.propertyDetail.noName') || 'Bất động sản');
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const statusConfig = {
      [PropertyStatus.AVAILABLE]: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Available" },
      [PropertyStatus.OCCUPIED]: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Occupied" },
      [PropertyStatus.UNDER_MAINTENANCE]: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", label: "Under Maintenance" },
      [PropertyStatus.INACTIVE]: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Inactive" }
    };

    // Đảm bảo sử dụng giá trị hợp lệ, fallback to INACTIVE nếu không tìm thấy
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[PropertyStatus.INACTIVE];

    return (
      <Badge className={`inline-flex items-center whitespace-nowrap ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  // Lấy thumbnail từ property nếu được truyền vào
  const thumbnailUrl = property?.thumbnail || thumbnail;

  return (
    <>
      <div className="mb-8 space-y-6">
        {/* Header với nút back, tên và trạng thái */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="h-8 w-8 mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isLoading ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  name || 'Chi tiết tài sản'
                )}
              </h1>
              <div className="flex mt-1 items-center">
                {isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  status && getStatusBadge(status)
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteClick}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </div>
          )}
        </div>
        
        {/* Hiển thị ảnh thumbnail */}
        <div className="relative w-full h-[300px] overflow-hidden rounded-lg">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <Image 
              src={thumbnailUrl || DEFAULT_IMAGES.PROPERTY}
              alt={name || 'Property thumbnail'}
              fill
              priority
              className="object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                // Fallback nếu ảnh không load được
                (e.target as HTMLImageElement).src = DEFAULT_IMAGES.PROPERTY;
              }}
            />
          )}
        </div>
      </div>
      
      {/* Dialog xóa property */}
      {showDeleteDialog && (
        <DeleteDialog
          isOpen={showDeleteDialog}
          isDeleting={isDeleting}
          itemName={name || t('properties.propertyDetail.noName') || 'Bất động sản'}
          itemType="property"
          relatedData={relatedData as RelatedDataResponse | undefined}
          onClose={() => {
            setShowDeleteDialog(false);
          }}
          onConfirm={handleConfirmDelete}
          onForceDelete={handleForceDelete}
        />
      )}
    </>
  );
}