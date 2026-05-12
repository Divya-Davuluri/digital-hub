import apiCall from '@/lib/api';

export interface BudgetPool {
  id: string;
  name: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  currency: string;
  status: 'active' | 'exhausted' | 'paused';
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  targetType: 'campaign' | 'ad_group' | 'pool';
  targetId: string;
  triggerMetric: 'spend' | 'cpa' | 'roas' | 'clicks' | 'impressions';
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  action: 'pause' | 'scale_up' | 'scale_down' | 'notify';
  actionValue?: number;
  isActive: number;
  lastRunAt?: string;
}

export interface ForecastPoint {
  date: string;
  predictedSpend: number;
  confidence: number;
}

export const getBudgetPools = async (): Promise<BudgetPool[]> => {
  return apiCall('/automation/pools');
};

export const createBudgetPool = async (data: Partial<BudgetPool>) => {
  return apiCall('/automation/pools', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getAutomationRules = async (): Promise<AutomationRule[]> => {
  return apiCall('/automation/rules');
};

export const createAutomationRule = async (data: Partial<AutomationRule>) => {
  return apiCall('/automation/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const toggleRule = async (id: string, isActive: boolean) => {
  return apiCall(`/automation/rules/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
};

export const getForecast = async (targetId: string): Promise<ForecastPoint[]> => {
  return apiCall(`/automation/forecast/${targetId}`);
};

export const runAutomationChecks = async () => {
  return apiCall('/automation/run-checks', { method: 'POST' });
};
