import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';
import { JsonPathPicker } from '@/shared/components/json/JsonPathPicker';
import { executionsApi } from '@/features/executions/api/executions.api';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import { getResolvedBaseJson } from '../hooks/useEnrichedFlowNodes';
import { buildParentBodies } from './FlowBodyPreviewPanel';
import type { FlowInputMapping, FlowStepDef } from '../types/flow.types';
import type { Edge, Node } from '@xyflow/react';
import type { FlowStepNodeData } from './FlowStepNode';

interface FlowMappingsPanelProps {
  nodeId: string;
  step: FlowStepDef;
  edges: Edge[];
  nodes: Node[];
  mappings: FlowInputMapping[];
  onMappingsChange: (m: FlowInputMapping[]) => void;
  lastRunStepExecutions?: Record<string, number>;
}

function parentLabel(nodes: Node[], pid: string) {
  const n = nodes.find((x) => x.id === pid);
  return n ? (n.data as FlowStepNodeData).label : pid.slice(0, 8);
}

export function FlowMappingsPanel({
  nodeId,
  step,
  edges,
  nodes,
  mappings,
  onMappingsChange,
  lastRunStepExecutions = {},
}: FlowMappingsPanelProps) {
  const {
    previewResponses,
    manualParentJson,
    setManualParentJson,
    jsonTemplates,
  } = useFlowEditorContext();

  const parentIds = useMemo(
    () => edges.filter((e) => e.target === nodeId).map((e) => e.source),
    [edges, nodeId],
  );

  const [activeParent, setActiveParent] = useState(parentIds[0] ?? '');
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const parentBodies = useMemo(
    () => buildParentBodies(nodeId, edges, previewResponses, manualParentJson),
    [nodeId, edges, previewResponses, manualParentJson],
  );

  const activeExecId = lastRunStepExecutions[activeParent];
  const { data: runResultJson } = useQuery({
    queryKey: ['flow-parent-result', activeExecId],
    queryFn: async () => {
      if (!activeExecId) return null;
      const res = await executionsApi.getResults(activeExecId, 1, 1);
      const first = res.data.items?.[0];
      return first?.responseBody ?? null;
    },
    enabled: Boolean(activeExecId) && !previewResponses[activeParent]?.body,
  });

  const sourceJson = useMemo(() => {
    if (previewResponses[activeParent]?.body) return previewResponses[activeParent].body;
    if (runResultJson) return runResultJson;
    return manualParentJson[activeParent] ?? '{}';
  }, [activeParent, previewResponses, runResultJson, manualParentJson]);

  const targetJson = useMemo(
    () => getResolvedBaseJson(step, jsonTemplates),
    [step, jsonTemplates],
  );

  if (parentIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Conecte uno o más nodos padre hacia este paso (flecha entrante por la izquierda) para
        mapear campos de sus respuestas al body de este nodo.
      </p>
    );
  }

  const addMappingFromPaths = (sourcePath: string, targetPath: string) => {
    if (!activeParent) return;
    const existing = mappings.findIndex(
      (m) =>
        m.fromNodeId === activeParent &&
        m.sourcePath === sourcePath &&
        m.targetPath === targetPath,
    );
    if (existing >= 0) return;
    onMappingsChange([
      ...mappings,
      { fromNodeId: activeParent, sourcePath, targetPath },
    ]);
    setPendingSource(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        1) Elija un campo en la respuesta del padre. 2) Elija el campo destino en el template.
        Solo padres directos.
      </p>

      {pendingSource !== null && (
        <div className="text-xs bg-primary/10 border border-primary/30 rounded px-2 py-1">
          Origen: <code>{pendingSource || '(raíz)'}</code> — ahora elija destino →
        </div>
      )}

      <Tabs value={activeParent || parentIds[0]} onValueChange={setActiveParent}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {parentIds.map((pid) => (
            <TabsTrigger key={pid} value={pid} className="text-xs">
              {parentLabel(nodes, pid)}
            </TabsTrigger>
          ))}
        </TabsList>
        {parentIds.map((pid) => (
          <TabsContent key={pid} value={pid} className="space-y-2 mt-2">
            <div>
              <Label className="text-xs">JSON respuesta (pegar si no hay probe)</Label>
              <Textarea
                className="mt-1 font-mono text-xs min-h-[60px]"
                value={manualParentJson[pid] ?? ''}
                onChange={(e) => setManualParentJson(pid, e.target.value)}
                placeholder='{"id": 1, ...}'
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label className="text-xs font-medium">Origen (respuesta padre)</Label>
                <JsonPathPicker
                  json={pid === activeParent ? sourceJson : parentBodies[pid] ?? '{}'}
                  selectedPath={pendingSource}
                  onPathSelect={(path) => setPendingSource(path)}
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Destino (template / base)</Label>
                <JsonPathPicker
                  json={targetJson}
                  onPathSelect={(path) => {
                    if (pendingSource !== null) {
                      addMappingFromPaths(pendingSource, path);
                    }
                  }}
                />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="space-y-2">
        <Label className="text-sm">Mapeos activos</Label>
        {mappings.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin mapeos definidos.</p>
        )}
        {mappings.map((m, idx) => (
          <div
            key={`${m.fromNodeId}-${idx}`}
            className="flex items-center gap-1 text-xs border rounded p-2 bg-muted/30"
          >
            <span className="truncate flex-1">
              <span className="text-muted-foreground">{parentLabel(nodes, m.fromNodeId)}</span>
              {' · '}
              <code>{m.sourcePath || '(raíz)'}</code>
              {' → '}
              <code>{m.targetPath || '(raíz)'}</code>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onMappingsChange(mappings.filter((_, i) => i !== idx))}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            onMappingsChange([
              ...mappings,
              {
                fromNodeId: parentIds[0] ?? '',
                sourcePath: '',
                targetPath: '',
              },
            ])
          }
        >
          Añadir mapeo vacío
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => setAdvancedOpen(!advancedOpen)}
      >
        {advancedOpen ? 'Ocultar' : 'Mostrar'} edición avanzada (rutas texto)
      </Button>
      {advancedOpen &&
        mappings.map((m, idx) => (
          <div key={`adv-${idx}`} className="grid gap-1 border rounded p-2 text-xs">
            <Select
              value={m.fromNodeId}
              onValueChange={(v) => {
                const next = [...mappings];
                next[idx] = { ...next[idx], fromNodeId: v };
                onMappingsChange(next);
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parentIds.map((pid) => (
                  <SelectItem key={pid} value={pid}>
                    {parentLabel(nodes, pid)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="sourcePath"
              className="h-8 font-mono"
              value={m.sourcePath}
              onChange={(e) => {
                const next = [...mappings];
                next[idx] = { ...next[idx], sourcePath: e.target.value };
                onMappingsChange(next);
              }}
            />
            <Input
              placeholder="targetPath"
              className="h-8 font-mono"
              value={m.targetPath}
              onChange={(e) => {
                const next = [...mappings];
                next[idx] = { ...next[idx], targetPath: e.target.value };
                onMappingsChange(next);
              }}
            />
          </div>
        ))}
    </div>
  );
}
