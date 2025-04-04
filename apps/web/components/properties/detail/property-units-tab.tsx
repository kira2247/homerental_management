import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Unit, UnitStatus } from "@/lib/api/types";
import { usePropertyUnits } from "@/lib/hooks/properties";
import { PlusCircle, Edit2, Trash, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyUnitsTabProps {
  propertyId: string;
}

export function PropertyUnitsTab({ propertyId }: PropertyUnitsTabProps) {
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(5);

  const { data: units, isLoading, error } = usePropertyUnits({
    propertyId,
    enabled: !!propertyId
  });

  // Status badge component
  const getStatusBadge = (status: UnitStatus) => {
    const statusConfig = {
      [UnitStatus.VACANT]: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Available" },
      [UnitStatus.OCCUPIED]: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Occupied" },
      [UnitStatus.MAINTENANCE]: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", label: "Maintenance" },
      [UnitStatus.RESERVED]: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", label: "Reserved" },
      [UnitStatus.INACTIVE]: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Inactive" }
    };

    const config = statusConfig[status] || statusConfig[UnitStatus.INACTIVE];

    return (
      <Badge className={`inline-flex items-center whitespace-nowrap ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Units</CardTitle>
          <CardDescription>Manage units for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-500">Error loading units: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <Button variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Units</CardTitle>
          <CardDescription>Manage units for this property</CardDescription>
        </div>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : units && units.items.length > 0 ? (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Area (m²)</TableHead>
                  <TableHead>Bedrooms</TableHead>
                  <TableHead>Bathrooms</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.items.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.floor || 'N/A'}</TableCell>
                    <TableCell>{unit.area}</TableCell>
                    <TableCell>{unit.bedrooms}</TableCell>
                    <TableCell>{unit.bathrooms}</TableCell>
                    <TableCell>{unit.price.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(unit.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <Home className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {units.totalPages > 1 && (
              <div className="flex justify-end mt-4">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Page {page} of {units.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === units.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No Units Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              This property doesn't have any units yet. Add your first unit to get started.
            </p>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Unit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 