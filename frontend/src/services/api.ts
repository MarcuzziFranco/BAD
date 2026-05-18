/**
 * Archivo de compatibilidad - Re-exporta desde la nueva arquitectura feature-based.
 * Los componentes deben migrar gradualmente a importar desde @/features/*/api/*.
 */

// Shared
import { api } from '@/shared/api/axios.instance';
export default api;
export type { JsonField, FieldConfig, PaginatedResults, ParsedCurl } from '@/shared/types/api.types';

// Templates
export { templatesApi } from '@/features/templates/api/templates.api';
export { dataPresetsApi } from '@/features/templates/api/data-presets.api';
export type { JsonTemplate } from '@/features/templates/types/templates.types';

// Generator
export { presetsApi, generatorApi } from '@/features/generator/api/generator.api';
export type { Preset, PresetCategory, GenerateRequest, GenerateResponse, OperationInfo, OperationsResponse } from '@/features/generator/types/generator.types';

// Servicios
export { configsApi } from '@/features/servicios/api/servicios.api';
export type { RequestConfig } from '@/features/servicios/types/servicios.types';

// Executions
export { executionsApi } from '@/features/executions/api/executions.api';
export type { TestExecution, TestResult, TestExecutionDetail, ExecutionProgress, CreateExecutionRequest } from '@/features/executions/types/executions.types';

// Backward compatibility type
export type PaginatedResults_Legacy = import('@/shared/types/api.types').PaginatedResults;
