import { api } from '@/shared/api/axios.instance';
import type { FlowRunDetail, FlowRunListItem } from '../types/flow.types';

export interface StartFlowRunPayload {
  requestCount: number;
  executionMode?: string;
  intervalMs?: number;
  mutatePerIteration?: boolean;
}

export const flowRunsApi = {
  start: (flowId: number, data: StartFlowRunPayload) =>
    api.post<FlowRunListItem>(`/flows/${flowId}/runs`, data),
  getById: (id: number) => api.get<FlowRunDetail>(`/flow-runs/${id}`),
  cancel: (id: number) => api.post(`/flow-runs/${id}/cancel`),
};
