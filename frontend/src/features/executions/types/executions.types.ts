import type { FieldConfig } from '@/shared/types/api.types';

export interface TestExecution {
  id: number;
  requestConfigId: number;
  requestConfigName: string | null;
  presetUsed: string | null;
  status: string;
  executionMode: string;
  bodyMode: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  executedAt: string;
  finishedAt: string | null;
}

export interface TestResult {
  id: number;
  index: number;
  requestPayload: string;
  requestHeaders: string | null;
  responseBody: string | null;
  responseHeaders: string | null;
  statusCode: number;
  durationMs: number;
  error: string | null;
  isSuccess: boolean;
  executedAt: string;
}

export interface TestExecutionDetail {
  id: number;
  requestConfigId: number;
  requestConfigName: string | null;
  requestConfigUrl: string | null;
  requestConfigMethod: string | null;
  presetUsed: string | null;
  status: string;
  executionMode: string;
  bodyMode: string;
  templateId: number | null;
  templateName: string | null;
  baseJson: string | null;
  mutationsConfig: string | null;
  intervalMs: number;
  mutatePerIteration: boolean;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  executedAt: string;
  finishedAt: string | null;
}

export interface ExecutionProgress {
  executionId: number;
  status: string;
  completed: number;
  total: number;
  successful: number;
  failed: number;
  avgResponseTimeMs: number;
  lastResult: TestResult | null;
}

export interface PaginatedTestResults {
  items: TestResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateExecutionRequest {
  requestConfigId: number;
  bodyMode: string;
  baseJson?: string;
  templateId?: number;
  mutations?: FieldConfig[];
  requestCount: number;
  executionMode: string;
  intervalMs: number;
  mutatePerIteration: boolean;
  presetName?: string;
  dataPresetId?: number;
}
