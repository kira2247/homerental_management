'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/lib/currency/currency-context';
import type {
  DashboardSummaryFilterDto,
  PropertyDistributionFilterDto,
  TransactionFilterDto,
  FinancialOverviewFilterDto
} from '@/lib/api/financial/types';

// Đặt mặc định cho các bộ lọc
const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

const getOneMonthAgoDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
};

export interface FinancialContextType {
  dashboardFilters: DashboardSummaryFilterDto;
  setDashboardFilters: (filters: DashboardSummaryFilterDto) => void;
  
  propertyDistributionFilters: PropertyDistributionFilterDto;
  setPropertyDistributionFilters: (filters: PropertyDistributionFilterDto) => void;
  
  transactionFilters: TransactionFilterDto;
  setTransactionFilters: (filters: TransactionFilterDto) => void;
  
  financialOverviewFilters: FinancialOverviewFilterDto;
  setFinancialOverviewFilters: (filters: FinancialOverviewFilterDto) => void;
  
  refreshFinancialData: () => void;
  lastRefresh: Date;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { currency } = useCurrency();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Khởi tạo bộ lọc mặc định với timeRange một tháng gần nhất
  const [dashboardFilters, setDashboardFilters] = useState<DashboardSummaryFilterDto>({
    startDate: getOneMonthAgoDate(),
    endDate: getCurrentDate(),
    timeRange: 'month'
  });
  
  const [propertyDistributionFilters, setPropertyDistributionFilters] = useState<PropertyDistributionFilterDto>({
    startDate: getOneMonthAgoDate(),
    endDate: getCurrentDate()
  });
  
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilterDto>({
    page: 1,
    limit: 10,
    startDate: getOneMonthAgoDate(),
    endDate: getCurrentDate(),
    sortBy: 'date',
    sortOrder: 'desc',
    convertToPreferred: true
  });
  
  const [financialOverviewFilters, setFinancialOverviewFilters] = useState<FinancialOverviewFilterDto>({
    startDate: getOneMonthAgoDate(),
    endDate: getCurrentDate(),
    period: 'month',
    compareWithPrevious: true,
    convertToPreferred: true
  });
  
  // Cập nhật bộ lọc khi currency thay đổi
  useEffect(() => {
    if (currency) {
      setTransactionFilters(prev => ({
        ...prev,
        currency: currency
      }));
      
      setFinancialOverviewFilters(prev => ({
        ...prev,
        currency: currency
      }));
    }
  }, [currency]);
  
  // Function để làm mới dữ liệu tài chính
  const refreshFinancialData = useCallback(() => {
    setLastRefresh(new Date());
  }, []);
  
  const value = {
    dashboardFilters,
    setDashboardFilters,
    propertyDistributionFilters,
    setPropertyDistributionFilters,
    transactionFilters,
    setTransactionFilters,
    financialOverviewFilters,
    setFinancialOverviewFilters,
    refreshFinancialData,
    lastRefresh
  };
  
  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  
  return context;
} 