import React from 'react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { PropertyStatus } from "@/lib/api/types";
import { useRouter, useParams } from "next/navigation";

interface PropertyHeroProps {
  name?: string;
  status?: PropertyStatus;
  isLoading?: boolean;
  onDelete?: () => void;
  showActions?: boolean;
}

export function PropertyHero({
  name,
  status,
  isLoading = false,
  onDelete,
  showActions = true
}: PropertyHeroProps) {
  const router = useRouter();
  const params = useParams<{ id: string; locale: string }>();
  const propertyId = params.id;

  const handleEdit = () => {
    router.push(`/properties/${propertyId}/edit`);
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const statusConfig = {
      [PropertyStatus.AVAILABLE]: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Available" },
      [PropertyStatus.OCCUPIED]: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Occupied" },
      [PropertyStatus.UNDER_MAINTENANCE]: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", label: "Maintenance" },
      [PropertyStatus.INACTIVE]: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Inactive" }
    };

    const config = statusConfig[status] || statusConfig[PropertyStatus.INACTIVE];

    return (
      <Badge className={`inline-flex items-center whitespace-nowrap ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
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
              name || 'Property Details'
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
      {showActions && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  );
} 