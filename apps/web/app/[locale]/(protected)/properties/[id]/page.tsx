import { Suspense } from 'react';
import PropertyDetailClient from '@/components/properties/detail/property-detail-client';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

// Property details page with suspense for better user experience
export default function PropertyDetailPage({ params }: { params: { id: string; locale: string } }) {
  return (
    <Suspense fallback={<PropertyDetailLoading />}>
      <PropertyDetailClient params={params} />
    </Suspense>
  );
}

// Loading state component shown during data fetching
function PropertyDetailLoading() {
  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <Skeleton className="h-6 w-64" />
      </div>

      {/* Hero Section Skeleton */}
      <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b mb-6">
        <Skeleton className="h-10 w-full max-w-md mb-4" />
      </div>

      {/* Tab Content Skeleton - Overview */}
      <div className="space-y-6">
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Utilities */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 