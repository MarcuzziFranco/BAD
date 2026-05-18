import { api } from '@/shared/api/axios.instance';
import type { FieldConfig } from '@/shared/types/api.types';

export interface DataPresetSummary {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataPresetDetail extends DataPresetSummary {
  fieldConfigurations: FieldConfig[];
}

export interface CreateDataPresetPayload {
  name: string;
  description?: string;
  fieldConfigurationsJson: string;
}

export const dataPresetsApi = {
  list: (templateId: number) =>
    api.get<DataPresetSummary[]>(`/json-templates/${templateId}/data-presets`),
  getById: (templateId: number, id: number) =>
    api.get<DataPresetDetail>(`/json-templates/${templateId}/data-presets/${id}`),
  create: (templateId: number, data: CreateDataPresetPayload) =>
    api.post<DataPresetDetail>(`/json-templates/${templateId}/data-presets`, data),
  update: (templateId: number, id: number, data: CreateDataPresetPayload) =>
    api.put(`/json-templates/${templateId}/data-presets/${id}`, data),
  delete: (templateId: number, id: number) =>
    api.delete(`/json-templates/${templateId}/data-presets/${id}`),
};
