import { FinancialApiService } from './financial-api-service';
import { DashboardApiService } from './dashboard-api-service';
import { TransactionsApiService } from './transactions-api-service';

export * from './types';

// Export singleton instances for API services
export const financialApi = new FinancialApiService();
export const dashboardApi = new DashboardApiService();
export const transactionsApi = new TransactionsApiService(); 