import { Suspense } from 'react';
import PropertiesClient from '@/components/properties/properties-client';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesLoading />}>
      <PropertiesClient />
    </Suspense>
  );
}

// Inline loading component for Suspense
function PropertiesLoading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full" />
              </CardHeader>
              <CardContent className="p-4">
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
        
        <div className="flex justify-center mt-8">
          <Skeleton className="h-10 w-80 rounded-md" />
        </div>
      </div>
    </div>
  );
}