import { api } from '@/shared/api/axios.instance';
import type { JsonField, FieldConfig } from '@/shared/types/api.types';
import type {
  Preset,
  PresetCategory,
  GenerateRequest,
  GenerateResponse,
  OperationsResponse,
} from '../types/generator.types';

export const presetsApi = {
  getAll: () => api.get<Preset[]>('/presets'),
  getGrouped: () => api.get<PresetCategory[]>('/presets/grouped'),
};

export const generatorApi = {
  generate: (data: GenerateRequest) => api.post<GenerateResponse>('/generator/generate', data),
  analyze: (jsonContent: string) =>
    api.post<{ fields: JsonField[] }>('/generator/analyze', { jsonContent }),
  getOperations: () => api.get<OperationsResponse>('/generator/operations'),
  expandPreset: (jsonContent: string, presetName: string) =>
    api.post<FieldConfig[]>('/generator/expand-preset', { jsonContent, presetName }),
};
