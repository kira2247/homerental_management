import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, DocumentType } from "@/lib/api/types";
import { usePropertyDocuments } from "@/lib/hooks/properties";
import { PlusCircle, Download, Trash, FileText, Star, StarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyDocumentsTabProps {
  propertyId: string;
}

export function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const { data: documents, isLoading, error } = usePropertyDocuments({
    propertyId,
    enabled: !!propertyId
  });

  // Document type badge component
  const getDocumentTypeBadge = (type: DocumentType) => {
    const typeConfig = {
      [DocumentType.CONTRACT]: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Contract" },
      [DocumentType.INVOICE]: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Invoice" },
      [DocumentType.RECEIPT]: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Receipt" },
      [DocumentType.LEGAL]: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Legal" },
      [DocumentType.OTHER]: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Other" }
    };

    const config = typeConfig[type] || typeConfig[DocumentType.OTHER];

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
          <CardTitle className="text-xl">Documents</CardTitle>
          <CardDescription>Manage documents for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-500">Error loading documents: {error instanceof Error ? error.message : 'Unknown error'}</p>
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
          <CardTitle className="text-xl">Documents</CardTitle>
          <CardDescription>Manage documents for this property</CardDescription>
        </div>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Upload Document
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
        ) : documents && documents.items.length > 0 ? (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead>Important</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.items.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.name}</TableCell>
                    <TableCell>{getDocumentTypeBadge(document.type)}</TableCell>
                    <TableCell className="uppercase">{document.fileType}</TableCell>
                    <TableCell>
                      {document.isImportant ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={document.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
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
            
            {documents.totalPages > 1 && (
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
                    Page {page} of {documents.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === documents.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold">No Documents Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              This property doesn't have any documents yet. Upload your first document to get started.
            </p>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload First Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}