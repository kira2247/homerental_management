import { Suspense } from 'react';
import DashboardContent from '@/components/dashboard/dashboard-content';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

// Inline loading component for use with Suspense
function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stat Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-10 w-24 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="p-4">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Tasks Skeleton */}
      <Card>
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 