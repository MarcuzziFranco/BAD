import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Response Error] ${error.config?.url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types
export interface JsonTemplate {
  id: number;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Preset {
  name: string;
  description: string;
  category: string;
}

export interface PresetCategory {
  category: string;
  presets: Preset[];
}

export interface JsonField {
  key: string;
  type: string;
  value: unknown;
}

export interface FieldConfig {
  key: string;
  operation: 'Random' | 'Replace' | 'ForceNull' | 'NotChange' | 'RandomRange' | 'RotateList';
  value?: unknown;
  minValue?: unknown;
  maxValue?: unknown;
  listValues?: unknown[];
}

export interface GenerateRequest {
  jsonContent: string;
  count: number;
  presetName?: string;
  fieldConfigs?: FieldConfig[];
  outputFormat?: 'Preview' | 'SingleFile' | 'Database';
}

export interface GenerateResponse {
  generatedJsons: string[];
  presetApplied: string | null;
  savedTemplateId: number | null;
}

export interface OperationInfo {
  id: string;
  name: string;
  description: string;
}

export interface OperationsResponse {
  operations: OperationInfo[];
  typeOperations: Record<string, string[]>;
}

export interface RequestConfig {
  id: number;
  name: string;
  url: string;
  method: string;
  headers: string | null;
  authType: string;
  authValue: string | null;
  jsonTemplateId: number | null;
  createdAt: string;
}

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

export interface PaginatedResults {
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
}

// API calls
export const templatesApi = {
  getAll: () => api.get<JsonTemplate[]>('/jsontemplates'),
  getById: (id: number) => api.get<JsonTemplate>(`/jsontemplates/${id}`),
  create: (data: { name: string; description?: string; content: string }) =>
    api.post<JsonTemplate>('/jsontemplates', data),
  update: (id: number, data: { name: string; description?: string; content: string }) =>
    api.put(`/jsontemplates/${id}`, data),
  delete: (id: number) => api.delete(`/jsontemplates/${id}`),
};

export const presetsApi = {
  getAll: () => api.get<Preset[]>('/presets'),
  getGrouped: () => api.get<PresetCategory[]>('/presets/grouped'),
};

export const generatorApi = {
  generate: (data: GenerateRequest) => api.post<GenerateResponse>('/generator/generate', data),
  analyze: (jsonContent: string) =>
    api.post<{ fields: JsonField[] }>('/generator/analyze', { jsonContent }),
  getOperations: () => api.get<OperationsResponse>('/generator/operations'),
};

export interface ParsedCurl {
  url: string;
  method: string;
  headers: string | null;
  body: string | null;
  authType: string | null;
  authValue: string | null;
  warnings: string[];
}

export const configsApi = {
  getAll: () => api.get<RequestConfig[]>('/requestconfigs'),
  getById: (id: number) => api.get<RequestConfig>(`/requestconfigs/${id}`),
  create: (data: Omit<RequestConfig, 'id' | 'createdAt'>) =>
    api.post<RequestConfig>('/requestconfigs', data),
  update: (id: number, data: Omit<RequestConfig, 'id' | 'createdAt'>) =>
    api.put(`/requestconfigs/${id}`, data),
  delete: (id: number) => api.delete(`/requestconfigs/${id}`),
  parseCurl: (curlCommand: string) =>
    api.post<ParsedCurl>('/requestconfigs/parse-curl', { curlCommand }),
  createFromCurl: (data: { curlCommand: string; name?: string; jsonTemplateId?: number }) =>
    api.post<RequestConfig>('/requestconfigs/from-curl', data),
};

export const executionsApi = {
  getAll: () => api.get<TestExecution[]>('/executions'),
  getById: (id: number) => api.get<TestExecutionDetail>(`/executions/${id}`),
  start: (data: CreateExecutionRequest) => api.post<TestExecution>('/executions/start', data),
  getProgress: (id: number) => api.get<ExecutionProgress>(`/executions/${id}/progress`),
  cancel: (id: number) => api.post(`/executions/${id}/cancel`),
  rerun: (id: number) => api.post<TestExecution>(`/executions/${id}/rerun`),
  getResults: (id: number, page: number = 1, pageSize: number = 20) =>
    api.get<PaginatedResults>(`/executions/${id}/results?page=${page}&pageSize=${pageSize}`),
  delete: (id: number) => api.delete(`/executions/${id}`),
  // Legacy
  execute: (data: {
    requestConfigId: number;
    count: number;
    presetName?: string;
    sequential: boolean;
  }) => api.post<TestExecution>('/executions', data),
};

export default api;
