import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

const pageSizeOptions = [6, 12, 24, 48];

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: PaginationProps) {
  // Tạo mảng các số trang để hiển thị
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Hiển thị tất cả các trang nếu tổng số trang ít hơn hoặc bằng maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu, trang cuối và các trang xung quanh trang hiện tại
      if (currentPage <= 3) {
        // Đang ở gần đầu
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Đang ở gần cuối
        pages.push(1);
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Ở giữa
        pages.push(1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {totalItems > 0 ? (
          <span>Hiển thị {startItem} - {endItem} trên {totalItems} kết quả</span>
        ) : (
          <span>Không có kết quả nào</span>
        )}
        {/* Đã loại bỏ selector pageSize vì đã cố định kích thước trang */}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Trang đầu</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Trang trước</span>
        </Button>

        {pageNumbers.map((pageNumber, index) => {
          const isGap = index > 0 && pageNumber - pageNumbers[index - 1] > 1;
          
          return (
            <React.Fragment key={pageNumber}>
              {isGap && <span className="px-2 text-gray-400">...</span>}
              <Button
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
              >
                {pageNumber}
              </Button>
            </React.Fragment>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Trang sau</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Trang cuối</span>
        </Button>
      </div>
    </div>
  );
} 