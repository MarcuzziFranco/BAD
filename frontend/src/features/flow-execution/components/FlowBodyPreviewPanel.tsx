import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { flowsApi } from '../api/flows.api';
import { flowStepToPreviewPayload } from '../utils/flowStepApi';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import type { FlowStepDef } from '../types/flow.types';
import type { Edge } from '@xyflow/react';
import { Zap } from 'lucide-react';

interface FlowBodyPreviewPanelProps {
  nodeId: string;
  step: FlowStepDef;
  edges: Edge[];
}

export function buildParentBodies(
  nodeId: string,
  edges: Edge[],
  previewResponses: Record<string, { body: string }>,
  manualParentJson: Record<string, string>,
): Record<string, string> {
  const parentIds = edges.filter((e) => e.target === nodeId).map((e) => e.source);
  const bodies: Record<string, string> = {};
  for (const pid of parentIds) {
    if (previewResponses[pid]?.body) bodies[pid] = previewResponses[pid].body;
    else if (manualParentJson[pid]?.trim()) bodies[pid] = manualParentJson[pid];
  }
  return bodies;
}

export function FlowBodyPreviewPanel({ nodeId, step, edges }: FlowBodyPreviewPanelProps) {
  const { previewResponses, setPreviewResponse, manualParentJson } = useFlowEditorContext();
  const [mergedJson, setMergedJson] = useState<string | null>(null);

  const parentBodies = useMemo(
    () => buildParentBodies(nodeId, edges, previewResponses, manualParentJson),
    [nodeId, edges, previewResponses, manualParentJson],
  );

  const previewMut = useMutation({
    mutationFn: () =>
      flowsApi
        .previewMerge(flowStepToPreviewPayload(step), parentBodies)
        .then((r) => r.data.mergedJson),
    onSuccess: (json) => setMergedJson(json),
    onError: () => toast.error('No se pudo calcular el preview'),
  });

  const probeMut = useMutation({
    mutationFn: () =>
      flowsApi.probeStep(flowStepToPreviewPayload(step), parentBodies).then((r) => r.data),
    onSuccess: (data) => {
      setPreviewResponse(nodeId, {
        body: data.responseBody,
        statusCode: data.statusCode,
        capturedAt: new Date().toISOString(),
      });
      setMergedJson(data.mergedJson);
      if (data.isSuccess) toast.success(`Probe OK (${data.statusCode})`);
      else toast.warning(`Probe falló: ${data.error ?? data.statusCode}`);
    },
    onError: () => toast.error('Probe falló'),
  });

  useEffect(() => {
    previewMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, step, parentBodies]);

  return (
    <div className="space-y-3">
      <Alert>
        <AlertDescription className="text-xs">
          &quot;Probar paso&quot; ejecuta una petición HTTP real al servicio configurado. La respuesta
          quedará disponible para mapeos en nodos hijos.
        </AlertDescription>
      </Alert>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          disabled={previewMut.isPending}
          onClick={() => previewMut.mutate()}
        >
          Actualizar preview
        </Button>
        <Button
          size="sm"
          disabled={probeMut.isPending}
          onClick={() => probeMut.mutate()}
        >
          {probeMut.isPending ? (
            <Spinner className="w-4 h-4 mr-1" />
          ) : (
            <Zap className="w-4 h-4 mr-1" />
          )}
          Probar paso
        </Button>
      </div>
      {previewMut.isPending && !mergedJson && (
        <p className="text-xs text-muted-foreground">Calculando body efectivo…</p>
      )}
      {mergedJson && (
        <pre className="text-xs font-mono bg-muted rounded-md p-3 overflow-auto max-h-80 whitespace-pre-wrap">
          {mergedJson}
        </pre>
      )}
      {previewResponses[nodeId] && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          Última respuesta capturada: HTTP {previewResponses[nodeId].statusCode ?? '?'}
        </div>
      )}
    </div>
  );
}
