import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Property, PropertyStatus, PropertyType } from "@/lib/types";
import { MapPin, Home, Calendar, Tag, UserSquare, DollarSign, Droplets, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from '@/lib/i18n/client';
import { DEFAULT_IMAGES } from '@/lib/constants/images';

interface PropertyOverviewTabProps {
  property: Property;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const { t } = useLocale();

  // Kiểm tra xem property có tồn tại không
  if (!property) {
    return (
      <div className="p-4 text-center">
        <p>{t('properties.propertyDetail.loading')}</p>
      </div>
    );
  }

  // Helper for displaying status badge with appropriate color
  const getStatusBadge = (status: PropertyStatus) => {
    // Xác định className dựa trên status
    let className = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"; // Default style
    
    // Sử dụng switch-case thay vì object indexing để tránh lỗi TypeScript
    switch(status) {
      case PropertyStatus.AVAILABLE:
        className = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        break;
      case PropertyStatus.OCCUPIED:
        className = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
        break;
      case PropertyStatus.UNDER_MAINTENANCE:
        className = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
        break;
      case PropertyStatus.INACTIVE:
      default:
        // Sử dụng giá trị mặc định đã khai báo
        break;
    }
    
    return (
      <Badge className={`inline-flex items-center whitespace-nowrap ${className}`}>
        {t(`properties.statuses.${(status || PropertyStatus.INACTIVE).toLowerCase()}`)}
      </Badge>
    );
  };

  // Đảm bảo các giá trị số tồn tại và có thể sử dụng định dạng
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  // Đảm bảo ngày tồn tại trước khi định dạng
  const formatDate = (dateStr?: string | Date): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('properties.propertyDetail.overview.title')}</CardTitle>
          <CardDescription>{t('properties.propertyDetail.overview.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Home className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t('properties.propertyDetail.overview.propertyType')}</p>
                <p className="font-medium">{t(`properties.types.${(property.type || PropertyType.HOUSE).toLowerCase()}`)}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t('properties.propertyDetail.overview.status')}</p>
                <div>{getStatusBadge(property.status)}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t('properties.propertyDetail.overview.address')}</p>
                <p className="font-medium">
                  {property.address || '-'}{property.district ? `, ${property.district}` : ''}{property.city ? `, ${property.city}` : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <UserSquare className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t('properties.propertyDetail.overview.units')}</p>
                <p className="font-medium">
                  {t('properties.propertyDetail.overview.totalUnits', { 
                    count: property.unitCount || 0, 
                    vacant: property.vacantUnitCount || 0 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">{t('properties.propertyDetail.overview.addedDate')}</p>
                <p className="font-medium">
                  {formatDate(property.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Utilities & Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('properties.propertyDetail.utilities.title')}</CardTitle>
          <CardDescription>{t('properties.propertyDetail.utilities.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium mb-3">{t('properties.propertyDetail.utilities.utilityRates')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{t('properties.propertyDetail.utilities.waterRate')}</span>
                  </div>
                  <span className="font-medium">
                    {t('properties.propertyDetail.utilities.waterValue', { value: formatNumber(property.defaultWaterRate) })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{t('properties.propertyDetail.utilities.electricityRate')}</span>
                  </div>
                  <span className="font-medium">
                    {t('properties.propertyDetail.utilities.electricityValue', { value: formatNumber(property.defaultElectricityRate) })}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-3">{t('properties.propertyDetail.utilities.amenities')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${property.hasSecurity === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                    {property.hasSecurity === true ? '✓' : '×'}
                  </div>
                  <span className="text-sm">{t('properties.propertyDetail.utilities.security')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${property.hasElevator === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                    {property.hasElevator === true ? '✓' : '×'}
                  </div>
                  <span className="text-sm">{t('properties.propertyDetail.utilities.elevator')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${property.hasParking === true ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                    {property.hasParking === true ? '✓' : '×'}
                  </div>
                  <span className="text-sm">{t('properties.propertyDetail.utilities.parking')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Description */}
      {property.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('properties.propertyDetail.description.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Images */}
      {property.images && Array.isArray(property.images) && property.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('properties.propertyDetail.images.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.images.map((image, index) => (
                <div key={index} className="aspect-video rounded-md overflow-hidden">
                  <img 
                    src={image} 
                    alt={t('properties.propertyDetail.images.altText', { index: index + 1 })} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGES.PROPERTY; 
                      (e.target as HTMLImageElement).alt = t('properties.propertyDetail.images.loadError');
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Thumbnail */}
      {!property.images || !Array.isArray(property.images) || property.images.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('properties.propertyDetail.images.thumbnail')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-hidden max-w-md mx-auto">
              <img 
                src={property.thumbnail || DEFAULT_IMAGES.PROPERTY} 
                alt={t('properties.propertyDetail.images.thumbnailAlt')} 
                className="w-full h-auto object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGES.PROPERTY; 
                  (e.target as HTMLImageElement).alt = t('properties.propertyDetail.images.loadError');
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
