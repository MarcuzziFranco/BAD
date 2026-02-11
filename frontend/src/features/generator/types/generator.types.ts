import type { FieldConfig } from '@/shared/types/api.types';

export interface Preset {
  name: string;
  description: string;
  category: string;
}

export interface PresetCategory {
  category: string;
  presets: Preset[];
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
