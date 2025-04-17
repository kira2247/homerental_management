import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api/financial';
import { 
  Transaction, 
  TransactionDto, 
  TransactionList, 
  TransactionListDto, 
  TransactionFilter, 
  TransactionFilterDto,
  TransactionFormData,
  TransactionSummary,
  TransactionMutationContext
} from '@/lib/types/transaction-types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';
import { optimisticPaginatedUpdate } from '@/lib/utils/optimistic/optimistic-update';
import { isApiSuccess } from '@/lib/types/api-helpers';
import { ApiResponse } from '@/lib/types/api-types'; 
import { financialLogger } from '@/lib/utils/logging';

// Export các kiểu dữ liệu cần thiết
export type { TransactionFilterDto };

/**
 * Hook để lấy danh sách giao dịch có phân trang
 * @param filters - Bộ lọc giao dịch (page, limit, type, status, etc.)
 * @returns Danh sách giao dịch và các trạng thái liên quan
 */
export function useTransactions(filters: TransactionFilter = {}) {
  const { user } = useAuthStatus();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;
  
  // Convert filters to ensure compatibility
  const safeFilters: TransactionFilterDto = {
    ...filters,
    // Đảm bảo type compatibility
    sortBy: filters.sortBy as 'date' | 'amount',
    // Chuyển đổi các giá trị enum nếu cần
    status: filters.status as any,
    type: filters.type as any
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: financialKeys.transactions.list(safeFilters),
    queryFn: async () => {
      try {
        const response = await transactionsApi.getTransactions(safeFilters);
        if (!isApiSuccess(response)) {
          financialLogger.error('Failed to fetch transactions', response.error);
          throw new Error(response.error?.message || 'Failed to fetch transactions');
        }
        return response.data;
      } catch (err) {
        financialLogger.error('Error in useTransactions', err);
        throw err;
      }
    },
    enabled: isAuthenticated,
    // Thay keepPreviousData bằng placeholderData (cách mới trong React Query v4+)
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Correctly map the API response to our frontend model
  const transactionList: TransactionListDto = {
    items: data?.items || [],
    totalItems: data?.totalItems || 0,
    page: filters.page || 1,
    limit: filters.limit || 10,
    totalPages: Math.ceil((data?.totalItems || 0) / (filters.limit || 10))
  };

  return {
    transactions: transactionList.items,
    total: transactionList.totalItems || 0, // Giữ lại để tương thích ngược với code hiện tại
    totalItems: transactionList.totalItems || 0,
    page: transactionList.page,
    limit: transactionList.limit,
    totalPages: transactionList.totalPages,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook để lấy chi tiết giao dịch theo ID
 * @param id - ID của giao dịch
 * @returns Chi tiết giao dịch và các trạng thái liên quan
 */
export function useTransactionDetails(id: string | null) {
  const { user } = useAuthStatus();
  const isAuthenticated = !!user;
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: financialKeys.transactions.detail(id || ''),
    queryFn: async () => {
      try {
        const response = await transactionsApi.getTransactionById(id || '');
        if (!isApiSuccess(response)) {
          financialLogger.error('Failed to fetch transaction details', response.error);
          throw new Error(response.error?.message || 'Failed to fetch transaction details');
        }
        
        // Convert API response to our frontend model
        const transactionData = response.data as unknown as TransactionDto;
        const transaction: Transaction = {
          ...transactionData as unknown as Transaction,
          createdAt: new Date(transactionData.createdAt),
          updatedAt: new Date(transactionData.updatedAt),
          dueDate: transactionData.dueDate ? new Date(transactionData.dueDate as string) : undefined,
          completedDate: transactionData.completedDate ? new Date(transactionData.completedDate as string) : undefined
        };
        
        return transaction;
      } catch (err) {
        financialLogger.error('Error in useTransactionDetails', err);
        throw err;
      }
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  return {
    transaction: data,
    isLoading,
    error,
    refetch
  };
}

/**
 * Hook để tạo giao dịch mới
 * @returns Mutation function và các trạng thái liên quan
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuthStatus();
  const isAuthenticated = !!user;
  
  return useMutation({
    mutationFn: (data: Partial<TransactionFormData>) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (!isAuthenticated) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      return transactionsApi.createTransaction(data);
    },
    
    onMutate: async (newData) => {
      // Tạo một đối tượng context để lưu trữ các dữ liệu cũ
      const context: TransactionMutationContext = {};
      
      // Đầu tiên cancel các queries có thể bị ảnh hưởng
      await queryClient.cancelQueries({ queryKey: financialKeys.transactions.list() });
      
      // Nếu newData có propertyId, chúng ta cập nhật query có filter propertyId
      if (newData.propertyId) {
        const filterKey = financialKeys.transactions.list({ propertyId: newData.propertyId });
        
        // Tạo một transaction mới với ID tạm thời
        const newTransaction: Transaction = {
          id: `temp-${Date.now()}`,
          propertyId: newData.propertyId,
          unitId: newData.unitId,
          tenantId: newData.tenantId,
          type: newData.type!,
          amount: newData.amount!,
          currency: newData.currency!,
          status: newData.status!,
          description: newData.description,
          category: newData.category,
          paymentMethod: newData.paymentMethod,
          reference: newData.reference,
          attachments: newData.attachments,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: newData.metadata
        };
        
        // Optimistically update the UI
        const prevData = queryClient.getQueryData(filterKey);
        if (prevData) {
          context.previousTransaction = prevData;
          
          // Thêm transaction mới vào danh sách
          queryClient.setQueryData(filterKey, (old: any) => {
            return {
              ...old,
              items: [newTransaction, ...(old?.items || [])]
            };
          });
        }
      }
      
      return context;
    },
    
    onError: (error, variables, context) => {
      // Nếu có context và dữ liệu cũ, khôi phục lại dữ liệu
      if (context?.previousTransaction && variables.propertyId) {
        queryClient.setQueryData(
          financialKeys.transactions.list({ propertyId: variables.propertyId }),
          context.previousTransaction
        );
      }
      
      financialLogger.error('Failed to create transaction', error);
    },
    
    onSuccess: (response, variables) => {
      if (isApiSuccess(response)) {
        // Cập nhật danh sách giao dịch nếu có propertyId
        if (variables.propertyId) {
          queryClient.invalidateQueries({
            queryKey: financialKeys.transactions.list({ propertyId: variables.propertyId })
          });
        }
        
        // Invalidate tất cả các queries liên quan đến giao dịch
        queryClient.invalidateQueries({ queryKey: financialKeys.transactions.list() });
      } else {
        financialLogger.error('API error while creating transaction', response.error);
      }
    }
  });
}

/**
 * Hook để cập nhật giao dịch
 * @returns Mutation function và các trạng thái liên quan
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuthStatus();
  const isAuthenticated = !!user;
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransactionFormData> }) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (!isAuthenticated) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      return transactionsApi.updateTransaction(id, data);
    },
    
    onMutate: async ({ id, data }) => {
      // Tạo một đối tượng context để lưu trữ dữ liệu cũ
      const context: TransactionMutationContext = {};
      
      // Đầu tiên cancel các queries có thể bị ảnh hưởng
      await queryClient.cancelQueries({ queryKey: financialKeys.transactions.detail(id) });
      await queryClient.cancelQueries({ queryKey: financialKeys.transactions.list() });
      
      // Lưu trữ dữ liệu cũ
      const prevTransaction = queryClient.getQueryData(financialKeys.transactions.detail(id));
      if (prevTransaction) {
        context.previousTransaction = prevTransaction;
      }
      
      // Optimistically update chi tiết giao dịch
      if (prevTransaction) {
        queryClient.setQueryData(financialKeys.transactions.detail(id), (old: any) => {
          return {
            ...old,
            ...data,
            updatedAt: new Date()
          };
        });
      }
      
      // Nếu có propertyId, cập nhật danh sách giao dịch
      if (data.propertyId) {
        // Update list queries
        const filterKey = financialKeys.transactions.list({ propertyId: data.propertyId });
        await queryClient.cancelQueries({ queryKey: filterKey });
        
        const prevList = queryClient.getQueryData(filterKey);
        if (prevList) {
          queryClient.setQueryData(filterKey, (old: any) => {
            if (!old || !old.items) return old;
            
            return {
              ...old,
              items: old.items.map((item: any) => {
                if (item.id === id) {
                  return {
                    ...item,
                    ...data,
                    updatedAt: new Date()
                  };
                }
                return item;
              })
            };
          });
        }
      }
      
      return context;
    },
    
    onError: (error, variables, context) => {
      // Khôi phục dữ liệu cũ nếu có
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          financialKeys.transactions.detail(variables.id),
          context.previousTransaction
        );
      }
      
      // Invalidate để tải lại dữ liệu từ server
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions.list() });
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions.detail(variables.id) });
      
      financialLogger.error('Failed to update transaction', error);
    },
    
    onSuccess: (response, variables) => {
      if (isApiSuccess(response)) {
        // Invalidate tất cả các queries liên quan
        queryClient.invalidateQueries({ queryKey: financialKeys.transactions.list() });
        queryClient.invalidateQueries({ queryKey: financialKeys.transactions.detail(variables.id) });
      } else {
        financialLogger.error('API error while updating transaction', response.error);
      }
    }
  });
}

/**
 * Hook để xóa giao dịch
 * @returns Mutation function và các trạng thái liên quan
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuthStatus();
  const isAuthenticated = !!user;
  
  return useMutation({
    mutationFn: ({ id, propertyId }: { id: string; propertyId?: string }) => {
      // Nếu đang đăng xuất, không thực hiện mutation
      if (!isAuthenticated) {
        return Promise.reject(new Error('Không thể thực hiện thao tác khi đang đăng xuất'));
      }
      
      return transactionsApi.deleteTransaction(id);
    },
    
    onMutate: async ({ id, propertyId }) => {
      // Tạo một đối tượng context để lưu trữ dữ liệu cũ
      const context: TransactionMutationContext = {};
      
      // Đầu tiên cancel các queries có thể bị ảnh hưởng
      await queryClient.cancelQueries({ queryKey: financialKeys.transactions.detail(id) });
      await queryClient.cancelQueries({ queryKey: financialKeys.transactions.list() });
      
      // Lưu trữ dữ liệu cũ
      const prevTransaction = queryClient.getQueryData(financialKeys.transactions.detail(id));
      if (prevTransaction) {
        context.previousTransaction = prevTransaction;
        queryClient.removeQueries({ queryKey: financialKeys.transactions.detail(id) });
      }
      
      // Nếu có propertyId, cập nhật danh sách giao dịch
      if (propertyId) {
        const filterKey = financialKeys.transactions.list({ propertyId });
        await queryClient.cancelQueries({ queryKey: filterKey });
        
        const prevList = queryClient.getQueryData(filterKey);
        if (prevList) {
          // Optimistic update: remove transaction from list
          queryClient.setQueryData(filterKey, (old: any) => {
            if (!old || !old.items) return old;
            
            return {
              ...old,
              items: old.items.filter((item: any) => item.id !== id)
            };
          });
        }
      } else {
        // Nếu không có propertyId cụ thể, cập nhật tất cả các danh sách
        const allListQueries = queryClient.getQueriesData({
          queryKey: financialKeys.transactions.list()
        });
        
        allListQueries.forEach(([queryKey, queryData]) => {
          if (queryData && (queryData as any).items) {
            queryClient.setQueryData(queryKey, (old: any) => ({
              ...old,
              items: old.items.filter((item: any) => item.id !== id)
            }));
          }
        });
      }
      
      return context;
    },
    
    onError: (error, variables, context) => {
      // Khôi phục dữ liệu cũ
      if (context?.previousTransaction) {
        queryClient.setQueryData(
          financialKeys.transactions.detail(variables.id),
          context.previousTransaction
        );
      }
      
      // Invalidate để tải lại dữ liệu từ server
      queryClient.invalidateQueries({ queryKey: financialKeys.transactions.list() });
      
      financialLogger.error('Failed to delete transaction', error);
    },
    
    onSuccess: (response, variables) => {
      if (isApiSuccess(response)) {
        // Đảm bảo danh sách được cập nhật
        queryClient.invalidateQueries({ queryKey: financialKeys.transactions.list() });
        // Xóa chi tiết giao dịch khỏi cache
        queryClient.removeQueries({ queryKey: financialKeys.transactions.detail(variables.id) });
      } else {
        financialLogger.error('API error while deleting transaction', response.error);
      }
    }
  });
}