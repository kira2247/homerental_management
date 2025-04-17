'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale } from '@/lib/i18n/client';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

export interface DeleteDialogProps {
  /**
   * Trạng thái mở của dialog
   */
  isOpen: boolean;
  
  /**
   * Trạng thái đang xóa
   */
  isDeleting: boolean;
  
  /**
   * Tiêu đề của dialog
   */
  title?: string;
  
  /**
   * Tên của item đang xóa
   */
  itemName: string;
  
  /**
   * Mô tả về hành động xóa
   */
  description?: string;
  
  /**
   * Cảnh báo về hậu quả của việc xóa
   */
  warning?: string;
  
  /**
   * Loại item đang xóa (property, tenant, unit, ...)
   * Dùng để lấy các key dịch phù hợp
   */
  itemType: 'property' | 'tenant' | 'unit' | 'document' | 'generic';
  
  /**
   * Dữ liệu liên quan đến item đang xóa
   * Nếu có dữ liệu liên quan, sẽ hiển thị thông tin và nút force delete
   */
  relatedData?: {
    units?: number;
    maintenanceRequests?: number;
    documents?: number;
    bills?: number;
    total?: number;
  };
  
  /**
   * Callback khi đóng dialog
   */
  onClose: () => void;
  
  /**
   * Callback khi xác nhận xóa
   */
  onConfirm: () => void;
  
  /**
   * Callback khi xác nhận force delete
   * Nếu không cung cấp, nút force delete sẽ không hiển thị
   */
  onForceDelete?: () => void;
}

export function DeleteDialog({
  isOpen,
  isDeleting,
  title,
  itemName,
  description,
  warning,
  itemType = 'generic',
  relatedData,
  onClose,
  onConfirm,
  onForceDelete,
}: DeleteDialogProps) {
  const { t } = useLocale();
  const confirmActionRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasConfirmedRef = useRef<boolean>(false);
  const [mounted, setMounted] = useState(false);
  
  // Reset hasConfirmed khi dialog mở lại
  useEffect(() => {
    if (isOpen) {
      hasConfirmedRef.current = false;
    }
  }, [isOpen]);
  
  // Đảm bảo hydration hoàn tất (cần thiết cho portal)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Xử lý sự kiện xác nhận xóa
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ngăn chặn hành vi mặc định và sự kiện nổi bọt
    e.preventDefault();
    e.stopPropagation();
    
    // Tránh gọi onConfirm nhiều lần
    if (!isDeleting && !hasConfirmedRef.current) {
      hasConfirmedRef.current = true;
      onConfirm();
    }
  };
  
  // Xử lý sự kiện force delete
  const handleForceDelete = () => {
    // Kiểm tra điều kiện trước khi gọi
    if (isDeleting) {
      return;
    }
    
    if (!onForceDelete) {
      return;
    }
    
    // Đánh dấu đã xử lý để tránh gọi nhiều lần
    hasConfirmedRef.current = true;
    
    // Gọi trực tiếp callback
    try {
      onForceDelete();
    } catch (error) {
      // Xử lý lỗi nếu có
    }
  };

  // Xử lý sự kiện hủy
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ngăn chặn hành vi mặc định
    e.preventDefault();
    e.stopPropagation();
    
    // Chỉ cho phép đóng dialog khi không đang xóa
    if (!isDeleting) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Chỉ đóng khi click vào backdrop, không đóng khi click vào dialog content
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  // Lấy các key dịch dựa trên loại item
  const getTranslationKey = (key: string): string => {
    const typeMap: Record<string, string> = {
      'property': 'properties.deleteDialog',
      'tenant': 'tenants.deleteDialog',
      'unit': 'units.deleteDialog',
      'document': 'documents.deleteDialog',
      'generic': 'common.deleteDialog'
    };
    
    const baseKey = typeMap[itemType] || 'common.deleteDialog';
    return `${baseKey}.${key}`;
  };

  // Lấy tiêu đề mặc định dựa trên loại item
  const getDefaultTitle = (): string => {
    return t(getTranslationKey('title')) || 'Xóa';
  };

  // Lấy mô tả mặc định dựa trên loại item
  const getDefaultDescription = (): string => {
    return t(getTranslationKey('description'), { name: itemName }) || 
      `Bạn có chắc chắn muốn xóa "${itemName}" không? Hành động này không thể hoàn tác.`;
  };

  // Lấy cảnh báo mặc định dựa trên loại item
  const getDefaultWarning = (): string => {
    return t(getTranslationKey('warning')) || 
      t('common.deleteDialog.warning') || 
      'Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.';
  };

  // Quản lý focus trap khi dialog mở
  useEffect(() => {
    if (!isOpen || !mounted) return;
    
    // Lưu element đang focus trước khi dialog mở
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Thiết lập focus khi dialog mở
    setTimeout(() => {
      confirmActionRef.current?.focus();
    }, 50);
    
    // Tạo focus trap trong dialog
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC để đóng dialog
      if (e.key === 'Escape' && !isDeleting) {
        e.preventDefault();
        onClose();
        return;
      }
      
      // Tab trap 
      if (e.key === 'Tab' && dialogRef.current) {
        // Lấy tất cả các phần tử có thể focus trong dialog
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        // Xử lý Tab và Shift+Tab để giữ focus trong dialog
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Thêm event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Trả lại focus cho phần tử trước đó khi dialog đóng
      if (!isOpen && previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        // Thêm timeout để đảm bảo focus được trả lại sau khi DOM đã cập nhật
        setTimeout(() => {
          previouslyFocusedElement.focus();
        }, 0);
      }
    };
  }, [isOpen, isDeleting, onClose, mounted]);

  // Chỉ render dialog khi isOpen và đã hydrate xong
  if (!isOpen || !mounted) return null;
  
  // Sử dụng createPortal để đưa dialog ra ngoài DOM chính
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      onClick={handleBackdropClick}
    >
      {/* Dialog container */}
      <div 
        ref={dialogRef}
        className="max-w-md w-full bg-background rounded-lg shadow-lg overflow-hidden focus:outline-none"
        tabIndex={-1} // Cho phép element nhận focus nhưng không nằm trong tab order
      >
        {/* VisuallyHidden component để thêm accessibility */}
        <VisuallyHidden>
          <h2 id="delete-dialog-title">{title || getDefaultTitle()}</h2>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-destructive flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" aria-hidden="true" />
              {title || getDefaultTitle()}
            </h2>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isDeleting}
              aria-label={t('common.closeMenu')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Description */}
          <div id="delete-dialog-description" className="text-muted-foreground mb-4">
            {description || getDefaultDescription()}
          </div>
          
          {/* Warning */}
          <div className="mt-4 p-4 rounded-md bg-muted flex items-start space-x-2" role="alert">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              {warning || getDefaultWarning()}
            </div>
          </div>
          
          {/* Related Data Info (if exists) */}
          {relatedData && (
            <div className="mt-4 p-4 rounded-md bg-amber-50 border border-amber-200">
              <h3 className="text-sm font-medium text-amber-800 mb-2">
                {t(getTranslationKey('relatedDataTitle')) || 'Dữ liệu liên quan:'}
              </h3>
              <ul className="text-sm text-amber-700 space-y-1">
                {relatedData.units ? (
                  <li className="flex justify-between">
                    <span>{t(getTranslationKey('units')) || 'Đơn vị/Phòng:'}</span>
                    <span className="font-medium">{relatedData.units}</span>
                  </li>
                ) : null}
                {relatedData.maintenanceRequests ? (
                  <li className="flex justify-between">
                    <span>{t(getTranslationKey('maintenanceRequests')) || 'Yêu cầu bảo trì:'}</span>
                    <span className="font-medium">{relatedData.maintenanceRequests}</span>
                  </li>
                ) : null}
                {relatedData.documents ? (
                  <li className="flex justify-between">
                    <span>{t(getTranslationKey('documents')) || 'Tài liệu:'}</span>
                    <span className="font-medium">{relatedData.documents}</span>
                  </li>
                ) : null}
                {relatedData.bills ? (
                  <li className="flex justify-between">
                    <span>{t(getTranslationKey('bills')) || 'Hóa đơn:'}</span>
                    <span className="font-medium">{relatedData.bills}</span>
                  </li>
                ) : null}
                {relatedData.total ? (
                  <li className="flex justify-between font-medium border-t border-amber-200 mt-2 pt-2">
                    <span>{t(getTranslationKey('total')) || 'Tổng cộng:'}</span>
                    <span>{relatedData.total}</span>
                  </li>
                ) : null}
              </ul>
              <p className="mt-3 text-sm text-amber-800">
                {t(getTranslationKey('relatedDataWarning')) || 'Không thể xóa vì còn dữ liệu liên quan. Bạn có thể xóa tất cả dữ liệu liên quan hoặc hủy thao tác.'}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {t(getTranslationKey('cancelDelete')) || t('common.cancel') || 'Hủy'}
          </Button>
          
          {/* Nếu có dữ liệu liên quan và có callback onForceDelete, hiển thị nút Force Delete */}
          {relatedData && onForceDelete && (
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleForceDelete();
              }}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-red-700 hover:bg-red-800"
              data-testid="force-delete-button"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t(getTranslationKey('processing')) || t('common.processing') || 'Đang xử lý...'}
                </>
              ) : (
                t(getTranslationKey('forceDelete')) || 'Xóa tất cả'
              )}
            </Button>
          )}
          
          {/* Nút xóa thông thường (ẩn nếu có dữ liệu liên quan) */}
          {!relatedData && (
            <Button
              ref={confirmActionRef}
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t(getTranslationKey('processing')) || t('common.processing') || 'Đang xử lý...'}
                </>
              ) : (
                t(getTranslationKey('confirmDelete')) || t('common.delete') || 'Xóa'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
