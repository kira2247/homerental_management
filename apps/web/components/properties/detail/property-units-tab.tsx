import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Home } from "lucide-react";
import { UnitsList } from "@/components/units/UnitsList";
import { useTranslation } from '@/lib/i18n/use-translation';

interface PropertyUnitsTabProps {
  propertyId: string;
}

export function PropertyUnitsTab({ propertyId }: PropertyUnitsTabProps) {
  const { t } = useTranslation('vi');
  
  // Log propertyId để debug
  React.useEffect(() => {
    console.log('PropertyUnitsTab - propertyId:', propertyId);
  }, [propertyId]);
  
  // Xử lý xem chi tiết đơn vị
  const handleViewUnitDetails = (unitId: string) => {
    // Chuyển đến trang chi tiết đơn vị
    window.location.href = `/units/${unitId}`;
  };
  
  // Xử lý chỉnh sửa đơn vị
  const handleEditUnit = (unitId: string) => {
    // Chuyển đến trang chỉnh sửa đơn vị
    window.location.href = `/units/${unitId}/edit`;
  };

  // Không cần xử lý error ở đây vì UnitsList component đã xử lý

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="group relative">
          <CardTitle className="cursor-help">{t('units.title')}</CardTitle>
          <div className="absolute left-0 top-full mt-2 w-64 rounded bg-gray-800 p-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-10">
            {t('units.propertyDetail.tabs.unitsDescription')}
          </div>
        </div>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          {t('units.actions.add')} {t('units.title')}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Sử dụng UnitsList component đã triển khai */}
        <UnitsList 
          propertyId={propertyId} 
          onViewDetails={handleViewUnitDetails}
          onEdit={handleEditUnit}
        />
      </CardContent>
    </Card>
  );
} 