import { api } from '@/shared/api/axios.instance';
import type {
  TestExecution,
  TestExecutionDetail,
  ExecutionProgress,
  PaginatedTestResults,
  CreateExecutionRequest,
} from '../types/executions.types';

export const executionsApi = {
  getAll: () => api.get<TestExecution[]>('/executions'),
  getById: (id: number) => api.get<TestExecutionDetail>(`/executions/${id}`),
  start: (data: CreateExecutionRequest) => api.post<TestExecution>('/executions/start', data),
  getProgress: (id: number) => api.get<ExecutionProgress>(`/executions/${id}/progress`),
  cancel: (id: number) => api.post(`/executions/${id}/cancel`),
  rerun: (id: number) => api.post<TestExecution>(`/executions/${id}/rerun`),
  getResults: (id: number, page: number = 1, pageSize: number = 20) =>
    api.get<PaginatedTestResults>(`/executions/${id}/results?page=${page}&pageSize=${pageSize}`),
  delete: (id: number) => api.delete(`/executions/${id}`),
  // Legacy
  execute: (data: {
    requestConfigId: number;
    count: number;
    presetName?: string;
    sequential: boolean;
  }) => api.post<TestExecution>('/executions', data),
};
