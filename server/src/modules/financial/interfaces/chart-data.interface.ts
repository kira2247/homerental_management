/**
 * Common chart data structure
 */
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

/**
 * Time period for financial data
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'; 