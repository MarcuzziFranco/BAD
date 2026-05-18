import { api } from '@/shared/api/axios.instance';
import type { ExecutionFlowDetail, ExecutionFlowListItem } from '../types/flow.types';

export interface CreateFlowPayload {
  name: string;
  description?: string;
  definitionJson: string;
}

export const flowsApi = {
  list: () => api.get<ExecutionFlowListItem[]>('/flows'),
  getById: (id: number) => api.get<ExecutionFlowDetail>(`/flows/${id}`),
  create: (data: CreateFlowPayload) => api.post<ExecutionFlowListItem>('/flows', data),
  update: (id: number, data: CreateFlowPayload) =>
    api.put<ExecutionFlowListItem>(`/flows/${id}`, data),
  delete: (id: number) => api.delete(`/flows/${id}`),
};
