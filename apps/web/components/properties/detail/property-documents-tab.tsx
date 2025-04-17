import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, DocumentType, PaginatedData } from "@/lib/types";
import { usePropertyDocuments } from "@/lib/hooks/properties";
import { PlusCircle, Download, Trash, FileText, Star, StarOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PropertyDocumentsTabProps {
  propertyId: string;
}

export function PropertyDocumentsTab({ propertyId }: PropertyDocumentsTabProps) {
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(5);

  const { data: documents, isLoading, error } = usePropertyDocuments({
    propertyId,
    enabled: !!propertyId,
    page,
    limit
  });

  // Document type badge component
  const getDocumentTypeBadge = (type: DocumentType) => {
    const typeConfig = {
      [DocumentType.CONTRACT]: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", label: "Contract" },
      [DocumentType.INVOICE]: { className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", label: "Invoice" },
      [DocumentType.RECEIPT]: { className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", label: "Receipt" },
      [DocumentType.LEASE_AGREEMENT]: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", label: "Lease Agreement" },
      [DocumentType.IDENTIFICATION]: { className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300", label: "Identification" },
      [DocumentType.LEASE]: { className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", label: "Lease" },
      [DocumentType.MAINTENANCE]: { className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", label: "Maintenance" },
      [DocumentType.INSURANCE]: { className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300", label: "Insurance" },
      [DocumentType.LEGAL]: { className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", label: "Legal" },
      [DocumentType.OTHER]: { className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", label: "Other" }
    };

    // Đảm bảo lấy đúng config hoặc fallback nếu type không hợp lệ
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig[DocumentType.OTHER];

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
          <CardTitle>Tài liệu</CardTitle>
          <CardDescription>Quản lý tất cả tài liệu liên quan đến bất động sản.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-red-500">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Tài liệu</CardTitle>
          <CardDescription>Quản lý tất cả tài liệu liên quan đến bất động sản.</CardDescription>
        </div>
        <Button className="ml-auto" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm tài liệu
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : documents && documents.items.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên tài liệu</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.items.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      {doc.name}
                      {doc.isImportant && (
                        <Star className="h-4 w-4 text-yellow-400 inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell>
                      {getDocumentTypeBadge(doc.type)}
                    </TableCell>
                    <TableCell>
                      {formatFileSize(doc.size)}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.updatedAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost">
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Tải xuống</span>
                      </Button>
                      <Button size="icon" variant="ghost">
                        {doc.isImportant ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {doc.isImportant ? "Bỏ đánh dấu quan trọng" : "Đánh dấu quan trọng"}
                        </span>
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Xóa</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">
                Hiển thị {documents.items.length} trong tổng số {documents.totalItems} tài liệu
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-500">
                  Trang {page} / {documents.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === documents.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Chưa có tài liệu nào</h3>
            <p className="text-gray-500 mt-2 mb-4">
              Tạo tài liệu đầu tiên cho bất động sản này.
            </p>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Thêm tài liệu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}