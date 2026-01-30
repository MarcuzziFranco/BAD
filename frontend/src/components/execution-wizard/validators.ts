import type { ExecutionDraft, StepValidation, WizardStep } from './types';

// Validar JSON
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Validar paso 1: Endpoint
export function validateEndpointStep(draft: ExecutionDraft): StepValidation {
  const errors: string[] = [];

  if (!draft.endpointId) {
    errors.push('Selecciona un endpoint');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validar paso 2: Body
export function validateBodyStep(draft: ExecutionDraft): StepValidation {
  const errors: string[] = [];

  // Para métodos que no usan body
  const noBodyMethods = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
  if (noBodyMethods.includes(draft.endpointMethod.toUpperCase())) {
    return { isValid: true, errors: [] };
  }

  switch (draft.bodyMode) {
    case 'static':
      if (!draft.staticJson.trim()) {
        errors.push('Ingresa un JSON');
      } else if (!isValidJson(draft.staticJson)) {
        errors.push('El JSON no es válido');
      }
      break;

    case 'template':
      if (!draft.templateId) {
        errors.push('Selecciona un template');
      }
      break;

    case 'template_mutation':
      if (!draft.templateId) {
        errors.push('Selecciona un template');
      }
      if (draft.mutationMode === 'preset' && !draft.mutationPresetName) {
        errors.push('Selecciona un preset de mutación');
      }
      if (draft.mutationMode === 'manual') {
        if (!isValidJson(draft.mutationRulesJson)) {
          errors.push('Las reglas de mutación no son JSON válido');
        }
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validar paso 3: Modo
export function validateModeStep(draft: ExecutionDraft): StepValidation {
  const errors: string[] = [];

  if (draft.requestCount < 1) {
    errors.push('La cantidad debe ser al menos 1');
  }

  if (draft.requestCount > 10000) {
    errors.push('La cantidad máxima es 10,000');
  }

  if (draft.intervalMs < 0) {
    errors.push('El intervalo no puede ser negativo');
  }

  if (draft.executionMode === 'parallel' && draft.concurrency < 1) {
    errors.push('La concurrencia debe ser al menos 1');
  }

  if (draft.executionMode === 'burst' && draft.burstSize < 1) {
    errors.push('El tamaño de ráfaga debe ser al menos 1');
  }

  if (draft.timeoutMs < 1000) {
    errors.push('El timeout mínimo es 1000ms');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Validar paso específico
export function validateStep(draft: ExecutionDraft, step: WizardStep): StepValidation {
  switch (step) {
    case 0: // Endpoint
      return validateEndpointStep(draft);
    case 1: // Body
      return validateBodyStep(draft);
    case 2: // Mode
      return validateModeStep(draft);
    case 3: // Execute
      // Execute es válido si todos los anteriores lo son
      const endpoint = validateEndpointStep(draft);
      const body = validateBodyStep(draft);
      const mode = validateModeStep(draft);
      return {
        isValid: endpoint.isValid && body.isValid && mode.isValid,
        errors: [...endpoint.errors, ...body.errors, ...mode.errors],
      };
    default:
      return { isValid: true, errors: [] };
  }
}

// Obtener estado de todos los pasos
export function getAllStepsValidation(draft: ExecutionDraft): Record<WizardStep, StepValidation> {
  return {
    [0]: validateEndpointStep(draft),
    [1]: validateBodyStep(draft),
    [2]: validateModeStep(draft),
    [3]: validateStep(draft, 3),
  };
}

// Estimar duración
export function estimateDuration(draft: ExecutionDraft): string {
  const { requestCount, executionMode, intervalMs, concurrency, burstSize } = draft;
  const avgResponseMs = 100; // Estimación promedio
  let totalMs = 0;

  switch (executionMode) {
    case 'sequential':
      totalMs = requestCount * (avgResponseMs + intervalMs);
      break;
    case 'parallel':
      totalMs = Math.ceil(requestCount / concurrency) * (avgResponseMs + intervalMs);
      break;
    case 'burst':
      const bursts = Math.ceil(requestCount / burstSize);
      totalMs = bursts * (avgResponseMs + intervalMs);
      break;
  }

  if (totalMs < 1000) return `~${totalMs}ms`;
  if (totalMs < 60000) return `~${(totalMs / 1000).toFixed(1)}s`;
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.round((totalMs % 60000) / 1000);
  return `~${mins}m ${secs}s`;
}

// Obtener warnings
export function getWarnings(draft: ExecutionDraft): string[] {
  const warnings: string[] = [];

  if (draft.requestCount > 500 && draft.executionMode === 'burst') {
    warnings.push('Ráfaga con muchas requests puede saturar el servidor');
  }

  if (draft.executionMode === 'parallel' && draft.concurrency > 20) {
    warnings.push('Alta concurrencia puede causar problemas de conexión');
  }

  if (draft.intervalMs === 0 && draft.requestCount > 100) {
    warnings.push('Sin intervalo con muchas requests puede saturar el servidor');
  }

  if (!draft.stopOnFirstError && draft.requestCount > 100) {
    warnings.push('Considera activar "Parar en primer error" para pruebas largas');
  }

  return warnings;
}
