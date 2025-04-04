import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api/financial';
import type { TransactionListDto, TransactionDto, TransactionFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys, toQueryKey } from './financial-keys';
import { optimisticPaginatedUpdate } from './optimistic-update';
import { isApiSuccess } from '@/lib/api/helpers';

// Export các kiểu dữ liệu cần thiết
export type { TransactionFilterDto };

// Định nghĩa kiểu dữ liệu tương thích cho frontend
interface CompatibleTransactionListDto extends TransactionListDto {
  total?: number;
}

// Type định nghĩa cho context trong optimistic update
interface TransactionMutationContext {
  previousTransaction?: unknown;
}

/**
 * Hook để lấy danh sách giao dịch có phân trang
 * @param filters - Bộ lọc giao dịch (page, limit, type, status, etc.)
 * @returns Danh sách giao dịch và các trạng thái liên quan
 */
export function useTransactions(filters: TransactionFilterDto = {}) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: financialKeys.transactions.lists(filters),
    queryFn: async () => {
      // Nếu người dùng đang đăng xuất, không thực hiện request API
      if (isLoggingOut) {
        return null;
      }
      
      const response = await transactionsApi.getTransactions(filters);
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useTransactions] API response:', response);
      }
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Lỗi khi tải danh sách giao dịch');
      }
      
      // Đảm bảo trường total được chuyển đúng từ totalItems
      const data = response.data as CompatibleTransactionListDto;
      
      // Xử lý tương thích ngược cho cả 'total' và 'totalItems'
      if (data.totalItems !== undefined && data.total === undefined) {
        data.total = data.totalItems;
      }
      
      return data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
    // Không thực hiện query nếu đang đăng xuất
    enabled: !isLoggingOut
  });
}

/**
 * Hook để lấy chi tiết giao dịch theo ID
 * @param id - ID của giao dịch
 * @returns Chi tiết giao dịch và các trạng thái liên quan
 */
export function useTransactionDetails(id: string | null) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: id ? financialKeys.transactions.detail(id) : [],
    queryFn: async () => {
      // Nếu không có ID hoặc đang đăng xuất, không thực hiện request API
      if (!id || isLoggingOut) {
        return null;
      }
      
      const response = await transactionsApi.getTransactionById(id);
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useTransactionDetails] API response for ID ${id}:`, response);
      }
      
      if (!response.success) {
        throw new Error(response.error?.message || `Lỗi khi tải chi tiết giao dịch #${id}`);
      }
      
      return response.data as TransactionDto;
    },
    enabled: !!id && !isLoggingOut,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook để tạo giao dịch mới
 * @returns Mutation function và các trạng thái liên quan
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation({
    mutationFn: (data: Partial<TransactionDto>) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (isLoggingOut) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useCreateTransaction] Dữ liệu gửi đi:', data);
      }
      
      return transactionsApi.createTransaction(data);
    },
    onSuccess: (response) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useCreateTransaction] onSuccess:', response);
      }
      
      // Invalidate và làm mới danh sách giao dịch
      if (response.success) {
        // Invalidate tất cả query liên quan đến giao dịch
        queryClient.invalidateQueries({ 
          queryKey: toQueryKey(financialKeys.transactions.all())
        });
        
        // Cập nhật cả dữ liệu dashboard do việc tạo giao dịch ảnh hưởng đến tổng quát
        queryClient.invalidateQueries({
          queryKey: toQueryKey(financialKeys.dashboard.all())
        });
      }
    },
    onError: (error) => {
      console.error('[useCreateTransaction] onError:', error);
    }
  });
}

/**
 * Hook để cập nhật giao dịch
 * @returns Mutation function và các trạng thái liên quan
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionDto> }) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (isLoggingOut) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useUpdateTransaction] Dữ liệu cập nhật cho ID ${id}:`, data);
      }
      
      return transactionsApi.updateTransaction(id, data);
    },
    onMutate: async ({ id, data }): Promise<TransactionMutationContext> => {
      // Hủy các queries đang thực hiện để tránh overwrite optimistic update
      await queryClient.cancelQueries({ 
        queryKey: toQueryKey(financialKeys.transactions.detail(id))
      });
      
      // Lưu trạng thái trước khi update
      const previousTransaction = queryClient.getQueryData(
        toQueryKey(financialKeys.transactions.detail(id))
      );
      
      // Optimistic update cho chi tiết giao dịch
      if (previousTransaction) {
        queryClient.setQueryData(
          toQueryKey(financialKeys.transactions.detail(id)), 
          { ...(previousTransaction as any), ...data }
        );
      }
      
      // Thực hiện optimistic update cho danh sách giao dịch
      // Lấy tất cả query keys trong cache liên quan đến danh sách giao dịch
      const queryKeys = queryClient.getQueryCache()
        .findAll({ 
          queryKey: toQueryKey(financialKeys.transactions.all())
        })
        .filter(query => query.queryKey.length > 2) // Chỉ lấy các query có filters
        .map(query => [...query.queryKey] as unknown[]); // Chuyển đổi để đảm bảo không còn readonly
      
      // Nếu có danh sách, thực hiện optimistic update
      queryKeys.forEach(queryKey => {
        // Lấy dữ liệu hiện tại
        const currentData = queryClient.getQueryData<CompatibleTransactionListDto>(queryKey);
        if (currentData?.items) {
          // Tìm item trong danh sách và cập nhật
          const updatedTransaction = { 
            ...(currentData.items.find(item => item.id === id) || {}), 
            ...data 
          };
          optimisticPaginatedUpdate(queryClient, queryKey, updatedTransaction as any);
        }
      });
      
      return { previousTransaction };
    },
    onError: (error, { id }, context: TransactionMutationContext) => {
      console.error(`[useUpdateTransaction] Lỗi khi cập nhật ID ${id}:`, error);
      
      // Nếu có lỗi, rollback lại trạng thái trước đó
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          toQueryKey(financialKeys.transactions.detail(id)),
          context.previousTransaction
        );
      }
    },
    onSettled: (data, error, { id }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useUpdateTransaction] onSettled cho ID ${id}:`, { data, error });
      }
      
      // Bất kể thành công hay thất bại, invalidate queries để đồng bộ với server
      queryClient.invalidateQueries({ 
        queryKey: toQueryKey(financialKeys.transactions.detail(id))
      });
      queryClient.invalidateQueries({ 
        queryKey: toQueryKey(financialKeys.transactions.lists())
      });
      
      // Cập nhật cả dữ liệu dashboard do việc cập nhật giao dịch ảnh hưởng đến tổng quát
      queryClient.invalidateQueries({ 
        queryKey: toQueryKey(financialKeys.dashboard.all())
      });
    }
  });
}

/**
 * Hook để xóa giao dịch
 * @returns Mutation function và các trạng thái liên quan
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { isLoggingOut } = useAuthStatus();
  
  return useMutation({
    mutationFn: (id: string) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (isLoggingOut) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useDeleteTransaction] Đang xóa giao dịch có ID ${id}`);
      }
      
      return transactionsApi.deleteTransaction(id);
    },
    onSuccess: (response, deletedId) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[useDeleteTransaction] onSuccess cho ID ${deletedId}:`, response);
      }
      
      // Invalidate và làm mới danh sách giao dịch
      queryClient.invalidateQueries({ 
        queryKey: toQueryKey(financialKeys.transactions.all())
      });
      
      // Xóa cache chi tiết giao dịch đã xóa
      queryClient.removeQueries({
        queryKey: toQueryKey(financialKeys.transactions.detail(deletedId))
      });
      
      // Cập nhật cả dữ liệu dashboard do việc xóa giao dịch ảnh hưởng đến tổng quát
      queryClient.invalidateQueries({
        queryKey: toQueryKey(financialKeys.dashboard.all())
      });
    },
    onError: (error, id) => {
      console.error(`[useDeleteTransaction] Lỗi khi xóa giao dịch có ID ${id}:`, error);
    }
  });
}