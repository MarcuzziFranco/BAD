// Tipos para el Wizard de Nueva Ejecución

export type BodyMode = 'static' | 'template' | 'template_mutation';
export type ExecutionMode = 'sequential' | 'parallel' | 'burst';
export type MutationMode = 'preset' | 'manual' | 'saved_data';

export interface ExecutionDraft {
  // Paso 1: Endpoint
  endpointId: number | null;
  endpointMethod: string;
  endpointUrl: string;
  endpointName: string;
  endpointHeaders: string | null;
  endpointAuthType: string | null;
  endpointAuthValue: string | null;

  // Paso 2: Body
  bodyMode: BodyMode;
  staticJson: string;
  templateId: number | null;
  templateName: string | null;
  mutationMode: MutationMode;
  mutationPresetName: string | null;
  dataPresetId: number | null;
  dataPresetName: string | null;
  mutationRulesJson: string;

  // Paso 3: Modo
  requestCount: number;
  executionMode: ExecutionMode;
  intervalMs: number;
  regenerateJsonPerRequest: boolean;
  
  // Avanzado
  concurrency: number;
  burstSize: number;
  timeoutMs: number;
  retryCount: number;
  stopOnFirstError: boolean;
  saveFullRequests: boolean;
}

export const DEFAULT_DRAFT: ExecutionDraft = {
  endpointId: null,
  endpointMethod: '',
  endpointUrl: '',
  endpointName: '',
  endpointHeaders: null,
  endpointAuthType: null,
  endpointAuthValue: null,

  bodyMode: 'template',
  staticJson: '{\n  \n}',
  templateId: null,
  templateName: null,
  mutationMode: 'preset',
  mutationPresetName: null,
  dataPresetId: null,
  dataPresetName: null,
  mutationRulesJson: '[]',

  requestCount: 10,
  executionMode: 'sequential',
  intervalMs: 0,
  regenerateJsonPerRequest: true,

  concurrency: 5,
  burstSize: 10,
  timeoutMs: 30000,
  retryCount: 0,
  stopOnFirstError: false,
  saveFullRequests: true,
};

export enum WizardStep {
  Endpoint = 0,
  Body = 1,
  Mode = 2,
  Execute = 3,
}

export const WIZARD_STEPS = [
  { id: WizardStep.Endpoint, name: 'Endpoint', description: 'Seleccionar servicio' },
  { id: WizardStep.Body, name: 'Body', description: 'Configurar payload' },
  { id: WizardStep.Mode, name: 'Modo', description: 'Opciones de ejecución' },
  { id: WizardStep.Execute, name: 'Ejecutar', description: 'Revisar y lanzar' },
];

export interface StepValidation {
  isValid: boolean;
  errors: string[];
}

export interface EndpointOption {
  id: number;
  name: string;
  method: string;
  url: string;
  headers: string | null;
  authType: string;
  authValue: string | null;
  tags?: string[];
}

export interface TemplateOption {
  id: number;
  name: string;
  description: string | null;
  content: string;
  fields?: string[];
}

export interface MutationPreset {
  name: string;
  description: string;
  category: string;
}

export interface FieldMutation {
  key: string;
  operation: 'Random' | 'Replace' | 'ForceNull' | 'NotChange' | 'RandomRange' | 'RotateList';
  value?: unknown;
  minValue?: unknown;
  maxValue?: unknown;
  listValues?: unknown[];
}
