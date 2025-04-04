'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Plus, Building2, MoreHorizontal, Edit, Eye, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useProperties, usePropertyCount } from "@/lib/hooks/properties";
import { PropertyStatus, PropertyType } from "@/lib/api/types";
import type { Property } from "@/lib/api/types";
import { Pagination } from "@/components/ui/pagination";
import { FilterDialog, FilterOptions } from "@/components/properties/filter-dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import defaultPropertyImage from "@/public/images/WMallingshowhome-67-720x479.jpg";
import { useViewMode } from '@/lib/view/view-mode-context';
import { BsGrid, BsListUl } from 'react-icons/bs';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n/client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ErrorBoundary } from "@/components/error";

export default function PropertiesClient() {
  // View mode handling
  let viewMode = 'grid';
  let toggleViewMode = () => {};
  
  try {
    const viewModeContext = useViewMode();
    viewMode = viewModeContext.viewMode;
    toggleViewMode = viewModeContext.toggleViewMode;
  } catch (e) {
    console.error('ViewMode context không khả dụng:', e);
  }

  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useParams();
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [currentPage, setCurrentPage] = useState(1);
  
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
    type: filters.type === "ALL" ? undefined : filters.type,
    status: filters.status === "ALL" ? undefined : filters.status,
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
    filters: propertyFilters,
    enabled: true
  });

  // Fetch property count
  const { 
    data: propertyCount = 0,
  } = usePropertyCount({
    filters: propertyFilters
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
      [PropertyStatus.UNDER_MAINTENANCE]: { variant: "warning", label: t('properties.statuses.maintenance') },
      [PropertyStatus.INACTIVE]: { variant: "unavailable", label: t('properties.statuses.inactive') }
    };
    
    const statusInfo = statusMap[status];
    
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
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              {propertyCount ? (
                <>{t('properties.totalCount', { count: propertyCount })}</>
              ) : null}
            </p>
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
                  {properties.map((property: Property, index: number) => (
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
                          router.push(`/${locale}/properties/${property.id}/edit`);
                        }} className="cursor-pointer">
                          <CardHeader className={`p-0 overflow-hidden ${viewMode === 'list' ? 'w-48' : ''}`}>
                            <div className={`relative ${viewMode === 'grid' ? 'h-40' : 'h-full'} overflow-hidden`}>
                              <Image 
                                src={property.thumbnail || "/images/WMallingshowhome-67-720x479.jpg"}
                                alt={property.name}
                                width={600}
                                height={400}
                                priority={index === 0}
                                className="group-hover:scale-105 transition-transform duration-300 ease-in-out"
                                onLoad={handleImageLoad}
                                onError={(e) => {
                                  // Fallback nếu ảnh không load được
                                  (e.target as any).src = '/images/default-property.jpg';
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
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t('properties.actions')}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('properties.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}`);
                                    }}>
                                      <Eye className="mr-2 h-4 w-4" /> {t('properties.viewDetails')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}/edit`);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" /> {t('properties.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600 dark:text-red-500 focus:bg-red-100/50 dark:focus:bg-red-900/50 focus:text-red-600 dark:focus:text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle property deletion (would add confirmation dialog)
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
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">{t('properties.actions')}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('properties.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}`);
                                    }}>
                                      <Eye className="mr-2 h-4 w-4" /> {t('properties.viewDetails')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/${locale}/properties/${property.id}/edit`);
                                    }}>
                                      <Edit className="mr-2 h-4 w-4" /> {t('properties.edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600 dark:text-red-500 focus:bg-red-100/50 dark:focus:bg-red-900/50 focus:text-red-600 dark:focus:text-red-500"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle property deletion (would add confirmation dialog)
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
    </ErrorBoundary>
  );
} 