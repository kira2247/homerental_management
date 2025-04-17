import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePropertyUnits } from '@/lib/hooks/units/use-property-units';
import { UnitWithProperty, UnitStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useDeleteUnit } from '@/lib/hooks/units/use-delete-unit';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

interface UnitsListProps {
  propertyId: string;
  onViewDetails?: (unitId: string) => void;
  onEdit?: (unitId: string) => void;
}

/**
 * Hiển thị danh sách các đơn vị cho thuê của một bất động sản
 */
export const UnitsList: React.FC<UnitsListProps> = ({ propertyId, onViewDetails, onEdit }) => {
  const router = useRouter();
  const { t } = useTranslation('vi'); // Sử dụng tiếng Việt theo mặc định
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChangingPage, setIsChangingPage] = useState(false);
  const tableRef = React.useRef<HTMLDivElement>(null);
  
  // Tham số truy vấn API
  const queryParams = {
    propertyId,
    page,
    limit,
    status: statusFilter,
    sortByPriceAsc: true, // Sắp xếp theo giá tăng dần theo mặc định
  };
  
  // Sử dụng hook usePropertyUnits với các tham số phân trang và lọc
  // Lưu ý: Đặc trưng của React Query như keepPreviousData được xử lý bên trong hook
  const { data, isLoading, isError, error } = usePropertyUnits(queryParams);
  
  // Lưu trữ dữ liệu trước đó để tránh hiệu ứng nhấp nháy (flashing)
  const [previousData, setPreviousData] = useState<typeof data | null>(null);
  
  // Cache dữ liệu cho mỗi trang đã tải
  const pageCache = useRef<Record<number, typeof data>>({});
  
  // Xử lý khi có dữ liệu trả về và log kết quả
  useEffect(() => {
    if (data) {
      // Lưu vào cache 
      pageCache.current[page] = data;
      
      // Lưu dữ liệu hiện tại để sử dụng khi chuyển trang
      setPreviousData(data);
      
      // Đặt lại trạng thái isChangingPage khi dữ liệu đã được tải xong
      // Thêm delay nhỏ để tránh hiệu ứng nhấp nháy khi chuyển dữ liệu
      setTimeout(() => {
        setIsChangingPage(false);
      }, 150);
    } else if (isError) {
      setIsChangingPage(false);
    }
  }, [data, isError, page]);
  
  // Hook xóa đơn vị
  const deleteUnit = useDeleteUnit({
    onSuccess: () => {
      // Không cần làm gì thêm vì usePropertyUnits sẽ tự động refetch
    },
  });
  
  // Xử lý xem chi tiết
  const handleViewDetails = useCallback((unitId: string) => {
    if (onViewDetails) {
      onViewDetails(unitId);
    } else {
      router.push(`/units/${unitId}`);
    }
  }, [onViewDetails, router]);
  
  // Xử lý chỉnh sửa
  const handleEdit = useCallback((unitId: string) => {
    if (onEdit) {
      onEdit(unitId);
    } else {
      router.push(`/units/${unitId}/edit`);
    }
  }, [onEdit, router]);
  
  // Xử lý xóa
  const handleDelete = useCallback((unitId: string) => {
    if (confirm(t('units.actions.confirmDelete'))) {
      deleteUnit.mutate({
        unitId,
        propertyId
      });
    }
  }, [t, deleteUnit, propertyId]);
  
  // Xử lý thay đổi trang
  const handlePageChange = useCallback((newPage: number) => {
    // Đặt trạng thái đang chuyển trang
    setIsChangingPage(true);
    
    // Thay đổi trang
    setPage(newPage);
    
    // Cuộn lên đầu bảng
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  // Xử lý thay đổi kích thước trang
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setLimit(newPageSize);
    setPage(1); // Reset về trang đầu tiên khi thay đổi kích thước trang
  }, []);
  
  // Xử lý gửi hóa đơn (placeholder)
  const handleSendBill = useCallback((unitId: string) => {
    // Placeholder - sẽ được triển khai đầy đủ sau
    alert(t('units.actions.sendBillConfirm', { defaultValue: `Đã gửi hóa đơn cho đơn vị ${unitId}` }));
    // TODO: Triển khai chức năng gửi hóa đơn thực tế
  }, [t]);
  
  // Xử lý hiển thị dữ liệu
  const getDisplayData = useCallback(() => {
    // Nếu đang chuyển trang và trang mới chưa có trong cache
    if (isChangingPage) {
      // Nếu trang mục tiêu đã có trong cache, sử dụng dữ liệu cache
      if (pageCache.current[page]) {
        return pageCache.current[page];
      }
      // Nếu không, sử dụng dữ liệu trước đó
      return previousData;
    }
    // Sử dụng dữ liệu hiện tại nếu không trong quá trình chuyển trang
    return data;
  }, [isChangingPage, page, previousData, data]);

  // Sử dụng giá trị trả về từ hook dể lọc dữ liệu
  const displayData = getDisplayData();
  const items = displayData?.items || [];
  const filteredItems = searchQuery
    ? items.filter(unit => unit.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  // Xử lý loading được xử lý trong bảng, không cần trả về riêng

  if (isError) {
    return (
      <div className="py-8 text-center">
        <div className="text-red-500 font-semibold mb-2">
          {t('units.list.error', { message: error?.message || t('common.errors.unknownError') })}
        </div>
        <div className="text-gray-500 text-sm">
          {t('units.list.tryAgain')}
          <button 
            className="ml-2 text-blue-500 hover:underline focus:outline-none"
            onClick={() => window.location.reload()}
          >
            {t('common.actions.refresh')}
          </button>
        </div>
      </div>
    );
  }
  
  // Hiển thị trạng thái không có dữ liệu
  // Thêm kiểm tra chặt chẽ hơn để tránh lỗi khi data.items là undefined
  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="space-y-4">
        {/* Thanh tìm kiếm và lọc */}
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder={t('units.list.search.placeholder')}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
          >
            <option value="">{t('units.list.filter.allStatuses')}</option>
            <option value="VACANT">{t('units.status.vacant')}</option>
            <option value="OCCUPIED">{t('units.status.occupied')}</option>
            <option value="MAINTENANCE">{t('units.status.maintenance')}</option>
            <option value="RESERVED">{t('units.status.reserved')}</option>
            <option value="INACTIVE">{t('units.status.inactive')}</option>
          </select>
        </div>
        <div className="py-8 text-center text-gray-400">{t('units.list.noData')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thanh tìm kiếm và lọc */}
      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên..."
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value={UnitStatus.VACANT}>Còn trống</option>
          <option value={UnitStatus.OCCUPIED}>Đã thuê</option>
          <option value={UnitStatus.MAINTENANCE}>Bảo trì</option>
          <option value={UnitStatus.RESERVED}>Đã đặt cọc</option>
          <option value={UnitStatus.INACTIVE}>Không hoạt động</option>
        </select>
      </div>
      
      {/* Bảng danh sách đơn vị */}
      <div 
        ref={tableRef} 
        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-500"
        style={{ 
          minHeight: previousData?.items?.length ? `${Math.min(previousData.items.length, limit) * 60 + 50}px` : '300px',
          opacity: isChangingPage ? 0.7 : 1,
          transition: 'opacity 0.25s ease-in-out'
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 transition-opacity duration-300 ease-in-out">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.name')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.area')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.rooms')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.status')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.price')}</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">{t('units.list.table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading && !previousData ? (
                // Skeleton loading khi đang tải lần đầu
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><Skeleton className="h-8 w-32" /></td>
                  </tr>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((unit: UnitWithProperty) => (
                  <tr key={unit.id} className="transition-colors hover:bg-blue-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.name}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{unit.area} m²</td>
                    <td className="px-4 py-3 text-center text-gray-700">{t('units.list.table.roomsFormat', { bedrooms: unit.bedrooms, bathrooms: unit.bathrooms })}</td>
                    <td className="px-4 py-3 text-center">
                      {renderStatusBadge(unit.status)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">{unit.price.toLocaleString('vi-VN')}₫</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(unit.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        >
                          {t('units.actions.view')}
                        </button>
                        <button
                          onClick={() => handleEdit(unit.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                        >
                          {t('units.actions.edit')}
                        </button>
                        <button
                          onClick={() => handleSendBill(unit.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-100 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        >
                          {t('units.actions.sendBill') || 'Gửi hóa đơn'}
                        </button>
                        <button
                          onClick={() => handleDelete(unit.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          disabled={deleteUnit.isPending}
                        >
                          {t('units.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t('units.list.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Phân trang sử dụng component có sẵn */}
      {displayData && displayData.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={displayData.totalPages}
            pageSize={limit}
            totalItems={displayData.totalItems}
            isLoading={isLoading || isChangingPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
  
  // Hàm hiển thị badge trạng thái
  function renderStatusBadge(status: string) {
    switch (status) {
      case UnitStatus.VACANT:
        return <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">{t('units.status.vacant')}</span>;
      case UnitStatus.OCCUPIED:
        return <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">{t('units.status.occupied')}</span>;
      case UnitStatus.MAINTENANCE:
        return <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">{t('units.status.maintenance')}</span>;
      case UnitStatus.RESERVED:
        return <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">{t('units.status.reserved')}</span>;
      case UnitStatus.INACTIVE:
        return <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{t('units.status.inactive')}</span>;
      default:
        return <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">{status}</span>;
    }
  }
};

export default UnitsList;
