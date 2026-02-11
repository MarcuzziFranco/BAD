import { useState, useEffect, useCallback } from 'react';
import type { ExecutionDraft, WizardStep } from '../components/wizard/types';
import { DEFAULT_DRAFT } from '../components/wizard/types';
import { validateStep, getAllStepsValidation, getWarnings, estimateDuration } from '../validators/execution.validators';

const STORAGE_KEY = 'bad-execution-draft';

export function useExecutionDraft() {
  const [draft, setDraftState] = useState<ExecutionDraft>(DEFAULT_DRAFT);
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraftState({ ...DEFAULT_DRAFT, ...parsed.draft });
        setCurrentStep(parsed.step || 0);
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          draft,
          step: currentStep,
          savedAt: new Date().toISOString(),
        }));
      } catch (e) {
        console.error('Error saving draft:', e);
      }
    }
  }, [draft, currentStep, isLoaded]);

  // Actualizar draft parcialmente
  const updateDraft = useCallback((updates: Partial<ExecutionDraft>) => {
    setDraftState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset completo
  const resetDraft = useCallback(() => {
    setDraftState(DEFAULT_DRAFT);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cargar desde ejecución anterior (rerun)
  const loadFromExecution = useCallback((data: Partial<ExecutionDraft>) => {
    setDraftState({ ...DEFAULT_DRAFT, ...data });
    setCurrentStep(3); // Ir al paso final
  }, []);

  // Navegación
  const goToStep = useCallback((step: WizardStep) => {
    // Solo permitir ir a pasos ya completados o el actual
    const validations = getAllStepsValidation(draft);
    
    // Puede ir hacia atrás siempre
    if (step < currentStep) {
      setCurrentStep(step);
      return true;
    }
    
    // Para ir adelante, validar pasos anteriores
    for (let i = currentStep; i < step; i++) {
      if (!validations[i as WizardStep].isValid) {
        return false;
      }
    }
    
    setCurrentStep(step);
    return true;
  }, [draft, currentStep]);

  const goNext = useCallback(() => {
    const validation = validateStep(draft, currentStep);
    if (validation.isValid && currentStep < 3) {
      setCurrentStep(prev => (prev + 1) as WizardStep);
      return true;
    }
    return false;
  }, [draft, currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => (prev - 1) as WizardStep);
      return true;
    }
    return false;
  }, [currentStep]);

  // Validaciones
  const stepValidation = validateStep(draft, currentStep);
  const allValidations = getAllStepsValidation(draft);
  const warnings = getWarnings(draft);
  const estimatedDuration = estimateDuration(draft);

  // Estado de cada paso
  const getStepStatus = useCallback((step: WizardStep): 'complete' | 'current' | 'pending' | 'error' => {
    if (step === currentStep) return 'current';
    if (step < currentStep) {
      return allValidations[step].isValid ? 'complete' : 'error';
    }
    return 'pending';
  }, [currentStep, allValidations]);

  // Verificar si puede avanzar
  const canGoNext = stepValidation.isValid && currentStep < 3;
  const canGoPrev = currentStep > 0;
  const canExecute = allValidations[3].isValid;

  // Verificar si hay cambios sin guardar
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(DEFAULT_DRAFT);

  return {
    draft,
    updateDraft,
    resetDraft,
    loadFromExecution,
    currentStep,
    goToStep,
    goNext,
    goPrev,
    stepValidation,
    allValidations,
    getStepStatus,
    canGoNext,
    canGoPrev,
    canExecute,
    warnings,
    estimatedDuration,
    hasUnsavedChanges,
    isLoaded,
  };
}
