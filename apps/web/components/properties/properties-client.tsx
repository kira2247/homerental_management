'use client';

import { useState, useEffect, useRef } from "react";
import { Plus, Building2, MoreHorizontal, Edit, Eye, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Button,
  Card, CardContent, CardHeader, 
  Input,
  Skeleton,
  Alert, AlertDescription,
  Badge,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Pagination,
  useToast
} from "@/components/ui";
import { useProperties, usePropertyCount } from "@/lib/hooks/properties";
import { PropertyStatus, PropertyType } from "@/lib/types";
import type { Property } from "@/lib/types";
import { FilterDialog, FilterOptions } from "@/components/properties/filter-dialog";
// Sử dụng DEFAULT_IMAGES.PROPERTY thay vì import trực tiếp
import { useViewMode } from '@/lib/view/view-mode-context';
import { uiLogger } from '@/lib/utils/logging';
import { BsGrid, BsListUl } from 'react-icons/bs';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n/client';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ErrorBoundary } from "@/components/error";
import { DEFAULT_IMAGES } from '@/lib/constants/images';
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { propertyApiService, RelatedDataResponse } from "@/lib/api/property-api-service";
import { useDeleteItem, DeleteApiResponse } from "@/lib/hooks/shared/use-delete-item";

export default function PropertiesClient() {
  // View mode handling
  let viewMode = 'grid';
  let toggleViewMode = () => {};
  
  try {
    const viewModeContext = useViewMode();
    viewMode = viewModeContext.viewMode;
    toggleViewMode = viewModeContext.toggleViewMode;
  } catch (e) {
    uiLogger.error('ViewMode context không khả dụng:', e);
  }

  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useParams();
  const { t } = useLocale();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // State cho tính năng xóa property
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Control initial rendering
  const isInitialMount = useRef(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Chuyển đổi FilterOptions thành PropertyFilters
  const propertyFilters = {
    type: filters.type === "ALL" ? undefined : filters.type as PropertyType | undefined,
    status: filters.status === "ALL" ? undefined : filters.status as PropertyStatus | undefined,
    sortBy: filters.sortBy === "ALL" ? undefined : filters.sortBy,
    sortOrder: filters.sortOrder,
    search: debouncedQuery
  };

  // Fetch property list
  const { 
    data: properties = [], 
    error, 
    isLoading, 
    isError 
  } = useProperties({
    page: currentPage,
    limit: 9,
    filters: propertyFilters as any, // Type casting để tránh xung đột kiểu dữ liệu trong quá trình migration
    enabled: true
  });

  // Fetch property count
  const { 
    data: propertyCount = 0,
  } = usePropertyCount({
    filters: propertyFilters as any // Type casting để tránh xung đột kiểu dữ liệu trong quá trình migration
  });

  // Reset page when filter or search changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    setCurrentPage(1);
  }, [filters, debouncedQuery]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    // Fixed page size at 9, function kept for interface compatibility
  };

  // Handle filter change
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };
  
  // Xử lý mở dialog xóa property
  const handleOpenDeleteDialog = (property: Property) => {

    setPropertyToDelete(property);
    setShowDeleteDialog(true);

  };
  
  // Xử lý đóng dialog xóa property
  const handleCloseDeleteDialog = () => {

    setShowDeleteDialog(false);
  };
  
  // Sử dụng hook useDeleteItem để xử lý logic xóa property
  const { 
    isDeleting, 
    relatedData, 
    deleteItem: deleteItemAction, 
    forceDeleteItem: forceDeleteItemAction 
  } = useDeleteItem<Property>({
    deleteFn: async (id: string, force: boolean): Promise<DeleteApiResponse> => {

      const response = await propertyApiService.deleteProperty(id, force);



      if (!response.success) {


      }
      return response as DeleteApiResponse;
    },
    queryKey: ['properties'],
    itemType: 'property',
    onSuccess: (id) => {

      setShowDeleteDialog(false);
    },
    onError: (error) => {

    },
    onRelatedDataFound: (foundRelatedData, id) => {

    },
    debug: true
  });
  
  // Xử lý xác nhận xóa property (không force delete)
  const handleConfirmDelete = () => {
    if (!propertyToDelete?.id) {

      return;
    }
    

    deleteItemAction(propertyToDelete.id, propertyToDelete.name || t('properties.propertyDetail.noName') || 'Bất động sản');
  };
  
  // Xử lý xác nhận force delete property
  const handleForceDelete = () => {    
    if (!propertyToDelete?.id) {
      return;
    }    
    try {
      // Gọi hàm forceDeleteItemAction với thông tin property
      forceDeleteItemAction(propertyToDelete.id, propertyToDelete.name || t('properties.propertyDetail.noName') || 'Bất động sản');
      
      // Đóng dialog sau khi gọi hàm
      setShowDeleteDialog(false);
    } catch (error) {
      // Xử lý lỗi nếu có
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setCurrentPage(1);
  };

  // Display status badge
  const getStatusBadge = (status: PropertyStatus) => {
    const statusMap = {
      [PropertyStatus.AVAILABLE]: { variant: "available", label: t('properties.statuses.available') },
      [PropertyStatus.OCCUPIED]: { variant: "info", label: t('properties.statuses.occupied') },
      [PropertyStatus.UNDER_MAINTENANCE]: { variant: "warning", label: t('properties.statuses.under_maintenance') },
      [PropertyStatus.INACTIVE]: { variant: "unavailable", label: t('properties.statuses.inactive') }
    };
    
    // Đảm bảo luôn có statusInfo mặc định nếu status không có trong statusMap
    const statusInfo = statusMap[status] || { variant: "default", label: status };
    
    return (
      <div className="inline-flex">
        <Badge variant={statusInfo.variant as any} className="whitespace-nowrap">
          {statusInfo.label}
        </Badge>
      </div>
    );
  };

  // Handle image display based on aspect ratio
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    const isPortrait = img.naturalHeight > img.naturalWidth;
    
    if (isPortrait) {
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
      img.style.height = '100%';
      img.style.width = 'auto';
    } else {
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
      img.style.width = '100%';
      img.style.height = '100%';
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('properties.title')}</h2>
            <p className="text-muted-foreground">
              {t('properties.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleViewMode}
              className="h-8 w-8"
            >
              {viewMode === 'grid' ? <BsListUl size={16} /> : <BsGrid size={16} />}
              <span className="sr-only">
                {viewMode === 'grid' ? t('properties.viewMode.grid') : t('properties.viewMode.list')}
              </span>
            </Button>
            <FilterDialog 
              onFilterChange={handleFilterChange}
              currentFilters={filters}
              isLoading={isLoading}
            />
            <Button onClick={() => router.push(`/${locale}/properties/add`)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>{t('properties.addProperty')}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              placeholder={t('properties.searchPlaceholder')}
              className="h-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {error instanceof Error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className={`overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                    <CardHeader className={`p-0 ${viewMode === 'list' ? 'w-48' : ''}`}>
                      <Skeleton className={viewMode === 'grid' ? 'h-40 w-full' : 'h-full w-full'} />
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : properties.length ? (
            <div className="space-y-4">
              <motion.div 
                className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}
                layout
              >
                <AnimatePresence mode="popLayout">
                  {properties.map((property: any, index: number) => (
                    <motion.div
                      key={property.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={`group overflow-hidden bg-white hover:shadow-lg dark:bg-gray-800/90 transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-800 ${viewMode === 'list' ? 'flex' : ''}`}>
                        <div onClick={(e) => {
                          e.preventDefault();
                          router.push(`/${locale}/properties/${property.id}`);
                        }} className="cursor-pointer">
                          <CardHeader className={`p-0 overflow-hidden ${viewMode === 'list' ? 'w-48' : ''}`}>
                            <div className={`relative ${viewMode === 'grid' ? 'h-40' : 'h-full'} overflow-hidden`}>
                              <Image 
                                src={property.thumbnail || DEFAULT_IMAGES.PROPERTY}
                                alt={property.name}
                                width={600}
                                height={400}
                                priority={index === 0}
                                className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
                                onLoad={handleImageLoad}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  // Fallback nếu ảnh không load được
                                  (e.target as HTMLImageElement).src = DEFAULT_IMAGES.PROPERTY;
                                }}
                              />
                            </div>
                          </CardHeader>
                        </div>
                        <div onClick={(e) => {
                          e.preventDefault();
                          router.push(`/${locale}/properties/${property.id}`);
                        }} className="cursor-pointer flex-1">
                          <CardContent className="p-4 flex-1">
                            <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'items-center'} justify-between gap-2`}>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold truncate group-hover:text-primary transition-colors duration-200">
                                  {property.name}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {property.address}, {property.district}, {property.city}
                                </p>
                              </div>
                              {viewMode === 'list' && (
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge(property.status)}
                                </div>
                              )}
                            </div>
                            
                            {viewMode === 'grid' && (
                              <div className={`mt-3 flex justify-between items-center`}>
                                {getStatusBadge(property.status)}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t('properties.actions')}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('properties.actionLabel')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}`);
                                    }}>
                                      <Eye className="mr-2 h-4 w-4" /> {t('properties.viewDetailsAction')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}/edit`);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" /> {t('properties.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600 dark:text-red-500 focus:bg-red-100/50 dark:focus:bg-red-900/50 focus:text-red-600 dark:focus:text-red-500"
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleOpenDeleteDialog(property);
                                      }}
                                    >
                                      <Trash className="mr-2 h-4 w-4" /> {t('properties.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                            {viewMode === 'list' && (
                              <div className="mt-2 flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t('properties.actions')}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('properties.actionLabel')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}`);
                                    }}>
                                      <Eye className="mr-2 h-4 w-4" /> {t('properties.viewDetailsAction')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}/edit`);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" /> {t('properties.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600 dark:text-red-500 focus:bg-red-100/50 dark:focus:bg-red-900/50 focus:text-red-600 dark:focus:text-red-500"
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleOpenDeleteDialog(property);
                                      }}
                                    >
                                      <Trash className="mr-2 h-4 w-4" /> {t('properties.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(propertyCount / 9)}
                pageSize={9}
                totalItems={propertyCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">{t('properties.noPropertiesFound')}</h3>
              <p className="mt-2 text-gray-500">
                {searchQuery
                  ? t('properties.noSearchResults')
                  : t('properties.createFirstProperty')}
              </p>
              {!searchQuery && (
                <Button 
                  className="mt-4" 
                  onClick={() => router.push(`/${locale}/properties/add`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>{t('properties.addProperty')}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        isDeleting={isDeleting}
        itemName={propertyToDelete?.name || 'bất động sản này'}
        itemType="property"
        relatedData={relatedData as RelatedDataResponse | undefined}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        onForceDelete={handleForceDelete}
      />
    </ErrorBoundary>
  );
}
