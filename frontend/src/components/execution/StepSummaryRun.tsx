import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { executionsApi } from '@/services/api';
import type { RequestConfig, FieldConfig, ExecutionProgress } from '@/services/api';
import {
  Play,
  Square,
  Globe,
  FileJson,
  Settings2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type { ExecutionMode } from './StepExecutionMode';
import type { BodyMode, ConfigMode } from './StepJsonBody';

interface StepSummaryRunProps {
  config: RequestConfig | null;
  bodyMode: BodyMode;
  baseJson: string;
  templateId: number | null;
  templateName: string | null;
  configMode: ConfigMode;
  presetName: string | null;
  mutations: FieldConfig[];
  requestCount: number;
  executionMode: ExecutionMode;
  intervalMs: number;
  mutatePerIteration: boolean;
  onExecutionComplete: (executionId: number) => void;
}

export function StepSummaryRun({
  config,
  bodyMode,
  baseJson,
  templateId,
  templateName,
  configMode,
  presetName,
  mutations,
  requestCount,
  executionMode,
  intervalMs,
  mutatePerIteration,
  onExecutionComplete,
}: StepSummaryRunProps) {
  const [executionId, setExecutionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Mutation para iniciar ejecución
  const startMutation = useMutation({
    mutationFn: executionsApi.start,
    onSuccess: (response) => {
      setExecutionId(response.data.id);
      setIsPolling(true);
    },
  });

  // Mutation para cancelar
  const cancelMutation = useMutation({
    mutationFn: executionsApi.cancel,
    onSuccess: () => {
      setIsPolling(false);
      if (progress) {
        setProgress({ ...progress, status: 'cancelled' });
      }
    },
  });

  // Polling para obtener progreso
  useEffect(() => {
    if (!isPolling || !executionId) return;

    const pollProgress = async () => {
      try {
        const response = await executionsApi.getProgress(executionId);
        setProgress(response.data);

        if (response.data.status === 'completed' || response.data.status === 'failed' || response.data.status === 'cancelled') {
          setIsPolling(false);
          if (response.data.status === 'completed') {
            onExecutionComplete(executionId);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    const interval = setInterval(pollProgress, 500);
    pollProgress(); // Inmediatamente

    return () => clearInterval(interval);
  }, [isPolling, executionId]);

  const handleStart = () => {
    if (!config) return;

    startMutation.mutate({
      requestConfigId: config.id,
      bodyMode,
      baseJson: bodyMode !== 'none' ? baseJson : undefined,
      templateId: templateId || undefined,
      mutations: bodyMode === 'template_mutated' && configMode === 'manual' ? mutations : undefined,
      requestCount,
      executionMode,
      intervalMs,
      mutatePerIteration,
      presetName: bodyMode === 'template_mutated' && configMode === 'preset' ? presetName || undefined : undefined,
    });
  };

  const handleCancel = () => {
    if (executionId) {
      cancelMutation.mutate(executionId);
    }
  };

  const isRunning = progress?.status === 'running';
  const isCompleted = progress?.status === 'completed';
  const isFailed = progress?.status === 'failed';
  const isCancelled = progress?.status === 'cancelled';

  const getBodyModeLabel = () => {
    switch (bodyMode) {
      case 'none': return 'Sin body';
      case 'static': return 'JSON estático';
      case 'template': return templateName ? `Template: ${templateName}` : 'Template';
      case 'template_mutated': return templateName 
        ? `${templateName} + ${configMode === 'preset' ? presetName : `${mutations.length} mutaciones`}`
        : 'Template + Mutación';
      default: return bodyMode;
    }
  };

  const getExecutionModeLabel = () => {
    switch (executionMode) {
      case 'sequential': return 'Secuencial';
      case 'parallel': return 'Paralelo';
      case 'burst': return 'Ráfaga';
      default: return executionMode;
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Resumen de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Endpoint */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline">{config?.method}</Badge>
            <span className="font-mono text-sm truncate">{config?.url}</span>
          </div>

          {/* Body */}
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{getBodyModeLabel()}</span>
          </div>

          {/* Ejecución */}
          <div className="flex items-center gap-2 flex-wrap">
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary">{requestCount} requests</Badge>
            <Badge variant="outline">{getExecutionModeLabel()}</Badge>
            {intervalMs > 0 && <Badge variant="outline">{intervalMs}ms intervalo</Badge>}
            {mutatePerIteration && <Badge>Mutar cada request</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Botón de ejecución */}
      {!executionId && (
        <Button
          size="lg"
          className="w-full"
          onClick={handleStart}
          disabled={!config || startMutation.isPending}
        >
          {startMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Iniciando...</>
          ) : (
            <><Play className="w-4 h-4 mr-2" /> Ejecutar Prueba</>
          )}
        </Button>
      )}

      {/* Progreso */}
      {progress && (
        <Card className={
          isCompleted ? 'border-green-500/50 bg-green-500/5' :
          isFailed ? 'border-red-500/50 bg-red-500/5' :
          isCancelled ? 'border-yellow-500/50 bg-yellow-500/5' :
          'border-blue-500/50 bg-blue-500/5'
        }>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {isFailed && <XCircle className="w-4 h-4 text-red-500" />}
                {isCancelled && <Square className="w-4 h-4 text-yellow-500" />}
                <span>
                  {isRunning && 'Ejecutando...'}
                  {isCompleted && 'Completado'}
                  {isFailed && 'Error'}
                  {isCancelled && 'Cancelado'}
                </span>
              </div>
              {isRunning && (
                <Button variant="destructive" size="sm" onClick={handleCancel}>
                  <Square className="w-3 h-3 mr-1" /> Cancelar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Barra de progreso */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{progress.completed} / {progress.total}</span>
                <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
              </div>
              <Progress value={(progress.completed / progress.total) * 100} />
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
                <p className="text-xs text-muted-foreground">Exitosas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                <p className="text-xs text-muted-foreground">Fallidas</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg font-bold">{Math.round(progress.avgResponseTimeMs)}ms</p>
                </div>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
            </div>

            {/* Última request */}
            {progress.lastResult && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Última request (#{progress.lastResult.index + 1}):</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs font-medium mb-1">Request:</p>
                    <div className="h-24 border rounded overflow-hidden">
                      <Editor
                        height="100%"
                        language="json"
                        theme="vs-dark"
                        value={progress.lastResult.requestPayload}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 10, lineNumbers: 'off' }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1 flex items-center gap-2">
                      Response:
                      <Badge variant={progress.lastResult.isSuccess ? 'default' : 'destructive'} className="text-xs">
                        {progress.lastResult.statusCode}
                      </Badge>
                      <span className="text-muted-foreground">{Math.round(progress.lastResult.durationMs)}ms</span>
                    </p>
                    <div className="h-24 border rounded overflow-hidden">
                      <Editor
                        height="100%"
                        language="json"
                        theme="vs-dark"
                        value={progress.lastResult.responseBody || progress.lastResult.error || ''}
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 10, lineNumbers: 'off' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
