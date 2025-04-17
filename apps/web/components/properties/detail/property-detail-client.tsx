'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Building, Users, FileText, FileBox, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyStatus, PropertyType } from "@/lib/types";
import { useProperty } from "@/lib/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { PropertyHero } from "@/components/properties/detail/property-hero";
import { PropertyOverviewTab } from '@/components/properties/detail/property-overview-tab';
import { PropertyUnitsTab } from '@/components/properties/detail/property-units-tab';
import { PropertyDocumentsTab } from '@/components/properties/detail/property-documents-tab';
import { notFound } from 'next/navigation';
import { useLocale } from '@/lib/i18n/client';

interface PropertyDetailClientProps {
  params: {
    id: string;
    locale: string;
  };
}

export default function PropertyDetailClient({ params }: PropertyDetailClientProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Tạo refs cho các tab content
  const overviewTabRef = useRef<HTMLDivElement>(null);
  const unitsTabRef = useRef<HTMLDivElement>(null);
  const documentsTabRef = useRef<HTMLDivElement>(null);
  
  const propertyId = params.id;
  const locale = params.locale;
  
  const { data: property, error, isLoading } = useProperty({ id: propertyId });

  // Show 404 if property not found
  if (error && error.toString().includes('not found')) {
    notFound();
  }

  // Error state
  if (error) {
    return (
      <div className="container py-6">
        <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-medium text-red-800 mb-2">{t('properties.propertyDetail.errorLoading.title')}</h3>
          <p className="text-red-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // If still loading or no property data
  if (isLoading || !property) return (
    <div className="container py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('properties.propertyDetail.loading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Đảm bảo property có đầy đủ dữ liệu cần thiết
  const propertyName = property?.name || t('properties.propertyDetail.noName');
  const propertyStatus = property?.status || PropertyStatus.INACTIVE;

  return (
    <div className="container py-6">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${locale}/properties`} className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                {t('properties.propertyDetail.breadcrumbs.properties')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{propertyName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Property Hero */}
      <PropertyHero 
        name={propertyName}
        status={propertyStatus}
        isLoading={isLoading}
        property={property}
      />

      {/* Tabs */}
      <Tabs 
        defaultValue="overview" 
        className="space-y-6"
        value={activeTab}
        onValueChange={(value: string) => {
          setActiveTab(value);
          
          // Chờ một khoảng thời gian ngắn để tab content được render
          setTimeout(() => {
            let targetRef = null;
            
            // Xác định ref của tab được chọn
            switch(value) {
              case 'overview':
                targetRef = overviewTabRef;
                break;
              case 'units':
                targetRef = unitsTabRef;
                break;
              case 'documents':
                targetRef = documentsTabRef;
                break;
            }
            
            // Cuộn đến tab content với hiệu ứng smooth
            if (targetRef?.current) {
              targetRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }
          }, 100);
        }}
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            {t('properties.propertyDetail.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center">
            <Home className="h-4 w-4 mr-2" />
            {t('properties.propertyDetail.tabs.unitsWithCount', { count: property.unitCount || 0 })}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <FileBox className="h-4 w-4 mr-2" />
            {t('properties.propertyDetail.tabs.documents')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div ref={overviewTabRef} className="scroll-mt-6">
            <PropertyOverviewTab property={property} />
          </div>
        </TabsContent>
        
        <TabsContent value="units">
          <div ref={unitsTabRef} className="scroll-mt-6">
            <PropertyUnitsTab propertyId={propertyId} />
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <div ref={documentsTabRef} className="scroll-mt-6">
            <PropertyDocumentsTab propertyId={propertyId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 