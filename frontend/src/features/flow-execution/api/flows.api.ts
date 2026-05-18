import { api } from '@/shared/api/axios.instance';
import type { ExecutionFlowDetail, ExecutionFlowListItem } from '../types/flow.types';
import type { FlowStepPreviewPayload } from '../utils/flowStepApi';

export interface CreateFlowPayload {
  name: string;
  description?: string;
  definitionJson: string;
}

export interface FlowPreviewMergeResponse {
  mergedJson: string;
}

export interface FlowProbeStepResponse {
  requestPayload: string;
  responseBody: string;
  statusCode: number;
  isSuccess: boolean;
  error: string | null;
  mergedJson: string;
}

export const flowsApi = {
  list: () => api.get<ExecutionFlowListItem[]>('/flows'),
  getById: (id: number) => api.get<ExecutionFlowDetail>(`/flows/${id}`),
  create: (data: CreateFlowPayload) => api.post<ExecutionFlowListItem>('/flows', data),
  update: (id: number, data: CreateFlowPayload) =>
    api.put<ExecutionFlowListItem>(`/flows/${id}`, data),
  delete: (id: number) => api.delete(`/flows/${id}`),
  previewMerge: (step: FlowStepPreviewPayload, parentBodies?: Record<string, string>) =>
    api.post<FlowPreviewMergeResponse>('/flows/preview-merge', { step, parentBodies }),
  probeStep: (step: FlowStepPreviewPayload, parentBodies?: Record<string, string>) =>
    api.post<FlowProbeStepResponse>('/flows/probe-step', { step, parentBodies }),
};
