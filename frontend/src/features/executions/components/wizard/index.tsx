import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { executionsApi } from '@/features/executions/api/executions.api';
import { useExecutionDraft } from '../../hooks/useExecutionDraft';
import { WizardHeader } from './WizardHeader';
import { WizardStepper } from './WizardStepper';
import { StepEndpoint } from './StepEndpoint';
import { StepBody } from './StepBody';
import { StepMode } from './StepMode';
import { StepExecute } from './StepExecute';
import { ExecutionConfigSummary } from './ExecutionConfigSummary';
import { WizardStep, WIZARD_STEPS } from './types';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';

export function NewExecutionWizardPage() {
  const [searchParams] = useSearchParams();
  const rerunId = searchParams.get('rerun');

  const {
    draft,
    updateDraft,
    resetDraft,
    loadFromExecution,
    currentStep,
    goToStep,
    goNext,
    goPrev,
    allValidations,
    getStepStatus,
    canGoNext,
    canGoPrev,
    warnings,
    estimatedDuration,
    hasUnsavedChanges,
    isLoaded,
  } = useExecutionDraft();

  // Load rerun data if provided
  const { data: rerunData, isLoading: loadingRerun } = useQuery({
    queryKey: ['execution-rerun', rerunId],
    queryFn: async () => {
      if (!rerunId) return null;
      const exec = await executionsApi.getById(parseInt(rerunId));
      return exec.data;
    },
    enabled: !!rerunId && isLoaded,
  });

  // Apply rerun data when loaded
  useEffect(() => {
    if (rerunData && isLoaded) {
      loadFromExecution({
        endpointId: rerunData.requestConfigId,
        endpointMethod: rerunData.requestConfigMethod || 'POST',
        endpointUrl: rerunData.requestConfigUrl || '',
        endpointName: rerunData.requestConfigName || '',
        bodyMode: (rerunData.bodyMode as 'static' | 'template' | 'template_mutation') || 'template',
        staticJson: rerunData.baseJson || '{}',
        templateId: rerunData.templateId || null,
        templateName: rerunData.templateName || null,
        mutationPresetName: rerunData.presetUsed || null,
        requestCount: rerunData.totalRequests,
        executionMode: (rerunData.executionMode as 'sequential' | 'parallel' | 'burst') || 'sequential',
        intervalMs: rerunData.intervalMs,
        regenerateJsonPerRequest: rerunData.mutatePerIteration,
      });
    }
  }, [rerunData, isLoaded, loadFromExecution]);

  // Show loading while loading rerun data
  if (!isLoaded || (rerunId && loadingRerun)) {
    return (
      <TooltipProvider>
        <div className="h-[calc(100vh-100px)] flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      </TooltipProvider>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.Endpoint:
        return (
          <StepEndpoint
            draft={draft}
            updateDraft={updateDraft}
            validation={allValidations[WizardStep.Endpoint]}
          />
        );
      case WizardStep.Body:
        return (
          <StepBody
            draft={draft}
            updateDraft={updateDraft}
            validation={allValidations[WizardStep.Body]}
          />
        );
      case WizardStep.Mode:
        return (
          <StepMode
            draft={draft}
            updateDraft={updateDraft}
            validation={allValidations[WizardStep.Mode]}
          />
        );
      case WizardStep.Execute:
        return (
          <StepExecute
            draft={draft}
            allValidations={allValidations}
            warnings={warnings}
            estimatedDuration={estimatedDuration}
            onGoToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-100px)] flex flex-col gap-3">
        <PageBreadcrumb items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Ejecuciones', href: '/executions' },
          { label: 'Nueva Ejecucion' },
        ]} />

        {/* Header */}
        <WizardHeader
          hasUnsavedChanges={hasUnsavedChanges}
          onReset={resetDraft}
        />

        {/* Stepper */}
        <WizardStepper
          currentStep={currentStep}
          getStepStatus={getStepStatus}
          onStepClick={goToStep}
        />

        {/* Main content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Step content (3 cols on desktop) */}
          <div className="lg:col-span-3 min-h-0 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div>
                  <h2 className="font-semibold">{WIZARD_STEPS[currentStep].name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {WIZARD_STEPS[currentStep].description}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  Paso {currentStep + 1} de {WIZARD_STEPS.length}
                </span>
              </div>
              <CardContent className="flex-1 overflow-auto p-4">
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-3">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={!canGoPrev}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {/* Mobile: Show summary button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Resumen
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-4 overflow-auto">
                  <ExecutionConfigSummary
                    draft={draft}
                    allValidations={allValidations}
                    warnings={warnings}
                    estimatedDuration={estimatedDuration}
                    onGoToStep={goToStep}
                    className="border-0 shadow-none"
                  />
                </SheetContent>
              </Sheet>

              {currentStep < WizardStep.Execute && (
                <Button
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary sidebar (1 col, hidden on mobile) */}
          <div className="hidden lg:block min-h-0 overflow-auto">
            <ExecutionConfigSummary
              draft={draft}
              allValidations={allValidations}
              warnings={warnings}
              estimatedDuration={estimatedDuration}
              onGoToStep={goToStep}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Re-exports
export { WizardHeader } from './WizardHeader';
export { WizardStepper } from './WizardStepper';
export { StepEndpoint } from './StepEndpoint';
export { StepBody } from './StepBody';
export { StepMode } from './StepMode';
export { StepExecute } from './StepExecute';
export { ExecutionConfigSummary } from './ExecutionConfigSummary';
export { useExecutionDraft } from '../../hooks/useExecutionDraft';
export * from './types';
export * from '../../validators/execution.validators';
