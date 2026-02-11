// Tipos para la página de detalle de ejecución

export interface ExecutionSummary {
  id: number;
  endpoint: string;
  method: string;
  env: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'completed' | 'running' | 'failed' | 'cancelled' | 'pending';
  totalCount: number;
  okCount: number;
  errorCount: number;
  avgMs: number;
  maxMs: number;
  minMs: number;
  totalDurationMs: number;
  p95Ms?: number;
  p99Ms?: number;
  baseJson?: string;
  templateName?: string;
  presetUsed?: string;
}

export interface ExecutionRequestResult {
  id: number;
  index: number;
  requestId: string;
  statusCode: number;
  durationMs: number;
  operationLabel: string;
  requestBody: string;
  responseBody: string | null;
  requestHeaders: string | null;
  responseHeaders: string | null;
  outcomeLabel: string;
  errorMessage?: string;
  bytesIn?: number;
  bytesOut?: number;
  executedAt: string;
  isSuccess: boolean;
  isOutlier?: boolean;
}

export type StatusFilter = 'all' | '2xx' | '4xx' | '5xx';

export interface FilterState {
  search: string;
  statusFilter: StatusFilter;
  onlyOutliers: boolean;
}
