import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Property } from "@/lib/types";
import { DEFAULT_IMAGES } from '@/lib/constants/images';

interface PropertyOverviewProps {
  property?: Property;
  isLoading?: boolean;
}

export function PropertyOverview({ property, isLoading = false }: PropertyOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* First row: Description and Property Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Description Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="p-0">
                <Skeleton className="h-[300px] w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          
          {/* Property Details Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Second row: Statistics */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-3/4" /></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const calculateOccupancyRate = () => {
    if (!property?.unitCount) return 0;
    const occupied = property.unitCount - (property.vacantUnitCount || 0);
    return Math.round((occupied / property.unitCount) * 100);
  };

  return (
    <div className="space-y-6">
      {/* First row: Description and Property Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Description Card */}
        <Card>
          <CardHeader className="p-0">
            <div className="relative h-[250px] w-full overflow-hidden rounded-t-lg">
              <Image 
                src={property?.thumbnail || DEFAULT_IMAGES.PROPERTY}
                alt={property?.name || "Property"}
                fill
                className="object-cover"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              {property?.description || "No description available."}
            </p>
          </CardContent>
        </Card>
        
        {/* Property Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{property?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{property?.status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Electricity Rate</p>
                <p className="font-medium">{property?.defaultElectricityRate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Water Rate</p>
                <p className="font-medium">{property?.defaultWaterRate || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">
                {property?.address || 'N/A'}, {property?.ward || ''}, {property?.district || ''}, {property?.city || ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {property?.hasSecurity && (
                <Badge variant="outline">Security</Badge>
              )}
              {property?.hasElevator && (
                <Badge variant="outline">Elevator</Badge>
              )}
              {property?.hasParking && (
                <Badge variant="outline">Parking</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Second row: Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-2xl font-semibold">{property?.unitCount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vacancy</p>
              <p className="text-2xl font-semibold">
                {property?.vacantUnitCount || 0} / {property?.unitCount || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <p className="text-2xl font-semibold">
                {calculateOccupancyRate()}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 