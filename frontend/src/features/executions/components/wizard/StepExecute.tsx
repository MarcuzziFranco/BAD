import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { executionsApi } from '@/features/executions/api/executions.api';
import type { ExecutionDraft, WizardStep, StepValidation } from './types';
import {
  Check,
  AlertCircle,
  AlertTriangle,
  Globe,
  FileJson,
  Settings2,
  Play,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepExecuteProps {
  draft: ExecutionDraft;
  allValidations: Record<WizardStep, StepValidation>;
  warnings: string[];
  estimatedDuration: string;
  onGoToStep: (step: WizardStep) => void;
}

export const StepExecute = memo(function StepExecute({
  draft,
  allValidations,
  warnings,
  estimatedDuration,
  onGoToStep,
}: StepExecuteProps) {
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  const executeMutation = useMutation({
    mutationFn: async () => {
      // Build the request payload
      const payload = {
        requestConfigId: draft.endpointId!,
        bodyMode: draft.bodyMode,
        baseJson: draft.bodyMode === 'static' ? draft.staticJson : undefined,
        templateId: draft.templateId || undefined,
        mutations: draft.bodyMode === 'template_mutation' && draft.mutationMode === 'manual'
          ? JSON.parse(draft.mutationRulesJson)
          : undefined,
        requestCount: draft.requestCount,
        executionMode: draft.executionMode,
        intervalMs: draft.intervalMs,
        mutatePerIteration: draft.regenerateJsonPerRequest,
        presetName: draft.mutationPresetName || undefined,
      };
      
      return executionsApi.start(payload);
    },
    onSuccess: (response) => {
      toast.success('Ejecucion iniciada correctamente');
      navigate(`/executions/${response.data.id}`);
    },
    onError: () => {
      toast.error('Error al iniciar la ejecucion');
      setIsExecuting(false);
    },
  });

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    setProgress(0);
    
    // Simulate progress for UX
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    executeMutation.mutate(undefined, {
      onSettled: () => {
        clearInterval(interval);
        setProgress(100);
      },
    });
  }, [executeMutation]);

  const allValid = allValidations[3].isValid;

  // Get disabled reason
  const getDisabledReason = (): string | null => {
    if (!allValidations[0].isValid) return 'Falta seleccionar endpoint';
    if (!allValidations[1].isValid) return 'Falta configurar el body';
    if (!allValidations[2].isValid) return 'Configuración de modo inválida';
    return null;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="space-y-4">
      {/* Pre-flight checks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            Verificación Pre-ejecución
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckItem
            label="Endpoint seleccionado"
            isValid={allValidations[0].isValid}
            value={`${draft.endpointMethod} ${draft.endpointName}`}
            onEdit={() => onGoToStep(0)}
          />
          <CheckItem
            label="Body configurado"
            isValid={allValidations[1].isValid}
            value={getBodyDescription(draft)}
            onEdit={() => onGoToStep(1)}
          />
          <CheckItem
            label="Modo de ejecución válido"
            isValid={allValidations[2].isValid}
            value={`${draft.requestCount} requests, ${draft.executionMode}, ${draft.intervalMs}ms intervalo`}
            onEdit={() => onGoToStep(2)}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Resumen de Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint */}
          <SummarySection
            icon={<Globe className="w-4 h-4" />}
            title="Endpoint"
            onEdit={() => onGoToStep(0)}
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {draft.endpointMethod}
              </Badge>
              <span className="text-sm">{draft.endpointName}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {draft.endpointUrl}
            </p>
          </SummarySection>

          {/* Body */}
          <SummarySection
            icon={<FileJson className="w-4 h-4" />}
            title="Body"
            onEdit={() => onGoToStep(1)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {draft.bodyMode === 'static' && 'JSON Estático'}
                {draft.bodyMode === 'template' && 'Template'}
                {draft.bodyMode === 'template_mutation' && 'Template + Mutación'}
              </Badge>
              {draft.templateName && (
                <span className="text-sm">{draft.templateName}</span>
              )}
              {draft.mutationPresetName && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {draft.mutationPresetName}
                </Badge>
              )}
            </div>
          </SummarySection>

          {/* Mode */}
          <SummarySection
            icon={<Settings2 className="w-4 h-4" />}
            title="Modo"
            onEdit={() => onGoToStep(2)}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium">{draft.requestCount} requests</span>
              <Badge variant="outline" className="text-xs">
                {draft.executionMode === 'sequential' && 'Secuencial'}
                {draft.executionMode === 'parallel' && `Paralelo (${draft.concurrency})`}
                {draft.executionMode === 'burst' && `Ráfaga (${draft.burstSize})`}
              </Badge>
              {draft.intervalMs > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {draft.intervalMs}ms
                </span>
              )}
              {draft.regenerateJsonPerRequest && (
                <Badge variant="outline" className="text-xs text-primary">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenera JSON
                </Badge>
              )}
            </div>
          </SummarySection>

          {/* Estimated duration */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Duración estimada</span>
            <span className="text-sm font-mono">{estimatedDuration}</span>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Execute button */}
      <Card className={cn(
        'border-2 transition-colors',
        allValid ? 'border-primary/30 bg-primary/5' : 'border-muted'
      )}>
        <CardContent className="p-6">
          {isExecuting ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Spinner className="w-5 h-5 text-primary" />
                <span className="font-medium">Iniciando ejecucion...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                className="w-full max-w-sm h-12 text-base gap-2"
                disabled={!allValid || executeMutation.isPending}
                onClick={handleExecute}
              >
                <Play className="w-5 h-5" />
                Ejecutar Prueba
              </Button>
              
              {disabledReason && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  {disabledReason}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// Helper components
interface CheckItemProps {
  label: string;
  isValid: boolean;
  value: string;
  onEdit: () => void;
}

const CheckItem = memo(function CheckItem({ label, isValid, value, onEdit }: CheckItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        {isValid ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        <div>
          <p className={cn('text-sm', isValid ? 'text-foreground' : 'text-red-500')}>
            {label}
          </p>
          {isValid && value && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">{value}</p>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
        Editar
      </Button>
    </div>
  );
});

interface SummarySectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}

const SummarySection = memo(function SummarySection({
  icon,
  title,
  children,
  onEdit,
}: SummarySectionProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="text-muted-foreground mt-0.5">{icon}</span>
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          {children}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={onEdit}>
        Editar
      </Button>
    </div>
  );
});

function getBodyDescription(draft: ExecutionDraft): string {
  const noBodyMethods = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
  if (noBodyMethods.includes(draft.endpointMethod.toUpperCase())) {
    return 'No requerido';
  }
  
  switch (draft.bodyMode) {
    case 'static':
      return 'JSON estático';
    case 'template':
      return draft.templateName || 'Template seleccionado';
    case 'template_mutation':
      return `${draft.templateName || 'Template'} + ${draft.mutationPresetName || 'mutación manual'}`;
    default:
      return '';
  }
}
