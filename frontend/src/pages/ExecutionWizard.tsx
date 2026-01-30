import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { StepEndpoint } from '@/components/execution/StepEndpoint';
import { StepJsonBody } from '@/components/execution/StepJsonBody';
import type { BodyMode, ConfigMode } from '@/components/execution/StepJsonBody';
import { StepExecutionMode } from '@/components/execution/StepExecutionMode';
import type { ExecutionMode } from '@/components/execution/StepExecutionMode';
import { StepSummaryRun } from '@/components/execution/StepSummaryRun';
import { templatesApi, executionsApi, configsApi } from '@/services/api';
import type { RequestConfig, FieldConfig } from '@/services/api';
import { ArrowLeft, ArrowRight, Globe, FileJson, Settings2, Play, Loader2 } from 'lucide-react';

const STEPS = [
  { title: 'Endpoint', description: 'Seleccionar servicio', icon: Globe },
  { title: 'Body', description: 'Configurar JSON', icon: FileJson },
  { title: 'Modo', description: 'Configurar ejecución', icon: Settings2 },
  { title: 'Ejecutar', description: 'Resumen y ejecución', icon: Play },
];

export function ExecutionWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rerunId = searchParams.get('rerun');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoadingRerun, setIsLoadingRerun] = useState(!!rerunId);

  // Estado del wizard
  const [selectedConfig, setSelectedConfig] = useState<RequestConfig | null>(null);
  const [bodyMode, setBodyMode] = useState<BodyMode>('template');
  const [baseJson, setBaseJson] = useState('');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [configMode, setConfigMode] = useState<ConfigMode>('preset');
  const [presetName, setPresetName] = useState<string | null>(null);
  const [mutations, setMutations] = useState<FieldConfig[]>([]);
  const [requestCount, setRequestCount] = useState(10);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('sequential');
  const [intervalMs, setIntervalMs] = useState(0);
  const [mutatePerIteration, setMutatePerIteration] = useState(true);

  // Obtener nombre del template
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const templateName = templates?.find((t) => t.id === templateId)?.name || null;

  // Cargar datos de re-ejecución si hay rerunId
  useEffect(() => {
    if (!rerunId) return;

    const loadRerunData = async () => {
      try {
        // Obtener datos de la ejecución anterior
        const execResponse = await executionsApi.getById(parseInt(rerunId));
        const execData = execResponse.data;

        // Obtener el RequestConfig completo
        const configResponse = await configsApi.getById(execData.requestConfigId);
        const configData = configResponse.data;

        // Cargar el RequestConfig
        setSelectedConfig(configData);

        // Cargar body mode y datos relacionados
        setBodyMode(execData.bodyMode as BodyMode);
        setBaseJson(execData.baseJson || '');
        setTemplateId(execData.templateId);

        // Cargar mutaciones si existen
        if (execData.mutationsConfig) {
          try {
            const parsedMutations = JSON.parse(execData.mutationsConfig);
            setMutations(parsedMutations);
            setConfigMode('manual');
          } catch {
            setMutations([]);
          }
        }

        // Cargar preset si existe
        if (execData.presetUsed) {
          setPresetName(execData.presetUsed);
          setConfigMode('preset');
        }

        // Cargar configuración de ejecución
        setRequestCount(execData.totalRequests);
        setExecutionMode(execData.executionMode as ExecutionMode);
        setIntervalMs(execData.intervalMs);
        setMutatePerIteration(execData.mutatePerIteration);

        // Ir directamente al paso 4 (resumen/ejecutar)
        setCurrentStep(3);
      } catch (error) {
        console.error('Error cargando datos de re-ejecución:', error);
        // Si falla, quedarse en el paso 0
      } finally {
        setIsLoadingRerun(false);
      }
    };

    loadRerunData();
  }, [rerunId]);

  // Navegación
  const canGoNext = () => {
    switch (currentStep) {
      case 0: return selectedConfig !== null;
      case 1: {
        const noBodyMethods = ['GET', 'DELETE'];
        if (noBodyMethods.includes(selectedConfig?.method.toUpperCase() || '')) return true;
        if (bodyMode === 'static') return baseJson.trim().length > 0;
        if (bodyMode === 'template') return templateId !== null;
        if (bodyMode === 'template_mutated') return templateId !== null;
        return false;
      }
      case 2: return requestCount > 0;
      default: return true;
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExecutionComplete = (executionId: number) => {
    // Navegar al detalle después de completar
    setTimeout(() => {
      navigate(`/executions/${executionId}`);
    }, 1500);
  };

  // Cuando se selecciona un config, si tiene template asociado, pre-cargarlo
  const handleConfigSelect = (config: RequestConfig | null) => {
    setSelectedConfig(config);
    if (config?.jsonTemplateId) {
      setTemplateId(config.jsonTemplateId);
      setBodyMode('template_mutated');
    }
  };

  // Mostrar loading mientras carga datos de re-ejecución
  if (isLoadingRerun) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando configuración anterior...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/executions')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {rerunId ? 'Re-ejecutar' : 'Nueva Ejecución'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {rerunId 
                ? 'Configuración cargada de ejecución anterior - revisa y ejecuta'
                : 'Configura y ejecuta una prueba de carga'}
            </p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        steps={STEPS.map((s) => s.title)}
        currentStep={currentStep}
        onStepClick={(step) => {
          // Solo permitir ir a pasos anteriores o al actual
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }}
      />

      {/* Contenido del paso */}
      <Card className="flex-1 overflow-auto">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            {(() => {
              const StepIcon = STEPS[currentStep].icon;
              return <StepIcon className="w-5 h-5" />;
            })()}
            {STEPS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {currentStep === 0 && (
            <StepEndpoint
              selectedConfigId={selectedConfig?.id || null}
              onSelect={handleConfigSelect}
            />
          )}

          {currentStep === 1 && selectedConfig && (
            <StepJsonBody
              bodyMode={bodyMode}
              onBodyModeChange={setBodyMode}
              baseJson={baseJson}
              onBaseJsonChange={setBaseJson}
              templateId={templateId}
              onTemplateIdChange={setTemplateId}
              configMode={configMode}
              onConfigModeChange={setConfigMode}
              presetName={presetName}
              onPresetNameChange={setPresetName}
              mutations={mutations}
              onMutationsChange={setMutations}
              httpMethod={selectedConfig.method}
            />
          )}

          {currentStep === 2 && (
            <StepExecutionMode
              requestCount={requestCount}
              onRequestCountChange={setRequestCount}
              executionMode={executionMode}
              onExecutionModeChange={setExecutionMode}
              intervalMs={intervalMs}
              onIntervalMsChange={setIntervalMs}
              mutatePerIteration={mutatePerIteration}
              onMutatePerIterationChange={setMutatePerIteration}
            />
          )}

          {currentStep === 3 && (
            <StepSummaryRun
              config={selectedConfig}
              bodyMode={bodyMode}
              baseJson={baseJson}
              templateId={templateId}
              templateName={templateName}
              configMode={configMode}
              presetName={presetName}
              mutations={mutations}
              requestCount={requestCount}
              executionMode={executionMode}
              intervalMs={intervalMs}
              mutatePerIteration={mutatePerIteration}
              onExecutionComplete={handleExecutionComplete}
            />
          )}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        {currentStep < STEPS.length - 1 && (
          <Button onClick={goNext} disabled={!canGoNext()}>
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
