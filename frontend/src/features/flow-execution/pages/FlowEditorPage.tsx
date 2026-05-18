import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { configsApi } from '@/features/servicios/api/servicios.api';
import { flowsApi } from '../api/flows.api';
import { flowRunsApi } from '../api/flow-runs.api';
import type { FlowDefinitionV1, FlowInputMapping } from '../types/flow.types';
import { flowEditorNodeTypes, type FlowStepNodeData } from '../components/FlowStepNode';
import { definitionToFlowNodes, emptyStep, flowStateToDefinition } from '../utils/flowDefinitionAdapters';
import { Plus, Save, Play, Trash2 } from 'lucide-react';

function newInitialNodes(): Node[] {
  return [
    {
      id: crypto.randomUUID(),
      type: 'flowStep',
      position: { x: 80, y: 100 },
      data: { label: 'Paso 1', step: emptyStep() } satisfies FlowStepNodeData,
    },
  ];
}

export function FlowEditorPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const flowId = routeId ? parseInt(routeId, 10) : null;
  const queryClient = useQueryClient();

  const [flowName, setFlowName] = useState('Nuevo flujo');
  const [description, setDescription] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(newInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runCount, setRunCount] = useState(1);

  const { data: flowDetail } = useQuery({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.getById(flowId!).then((r) => r.data),
    enabled: Number.isFinite(flowId ?? NaN),
  });

  const { data: requestConfigs } = useQuery({
    queryKey: ['requestconfigs'],
    queryFn: () => configsApi.getAll().then((r) => r.data),
  });

  useEffect(() => {
    if (!flowDetail) return;
    setFlowName(flowDetail.name);
    setDescription(flowDetail.description || '');
    try {
      const def = JSON.parse(flowDetail.definitionJson) as FlowDefinitionV1;
      const { nodes: n, edges: e } = definitionToFlowNodes(def);
      setNodes(n);
      setEdges(e);
    } catch {
      toast.error('Definición JSON inválida');
    }
  }, [flowDetail, setNodes, setEdges]);

  const selectedNode = useMemo(
    () => (selectedId ? nodes.find((n) => n.id === selectedId) : null),
    [nodes, selectedId],
  );

  const parentIds = useMemo(() => {
    if (!selectedId) return [] as string[];
    return edges.filter((e) => e.target === selectedId).map((e) => e.source);
  }, [edges, selectedId]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)),
    [setEdges],
  );

  const addNode = () => {
    const id = crypto.randomUUID();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'flowStep',
        position: { x: 120 + nds.length * 40, y: 80 + nds.length * 60 },
        data: { label: `Paso ${nds.length + 1}`, step: emptyStep() } satisfies FlowStepNodeData,
      },
    ]);
    setSelectedId(id);
  };

  const updateSelectedStep = (patch: Partial<FlowStepNodeData['step']>) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedId) return n;
        const d = n.data as FlowStepNodeData;
        return {
          ...n,
          data: { ...d, step: { ...d.step, ...patch } },
        };
      }),
    );
  };

  const updateSelectedLabel = (label: string) => {
    if (!selectedId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== selectedId) return n;
        const d = n.data as FlowStepNodeData;
        return { ...n, data: { ...d, label } };
      }),
    );
  };

  const setMappings = (inputMappings: FlowInputMapping[]) => {
    updateSelectedStep({ inputMappings });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const def = flowStateToDefinition(nodes, edges);
      const json = JSON.stringify(def);
      if (flowId)
        return flowsApi.update(flowId, { name: flowName.trim(), description: description.trim() || undefined, definitionJson: json });
      return flowsApi.create({ name: flowName.trim(), description: description.trim() || undefined, definitionJson: json });
    },
    onSuccess: (res) => {
      toast.success('Flujo guardado');
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      const newId = flowId ?? res.data.id;
      if (!flowId && newId) navigate(`/flows/edit/${newId}`, { replace: true });
    },
    onError: () => toast.error('No se pudo guardar el flujo'),
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const id = flowId;
      if (!id) throw new Error('Guarde el flujo antes de ejecutar');
      return flowRunsApi.start(id, {
        requestCount: runCount,
        executionMode: 'sequential',
        intervalMs: 0,
        mutatePerIteration: true,
      });
    },
    onSuccess: (res) => {
      toast.success('Corrida iniciada');
      setRunOpen(false);
      navigate(`/flow-runs/${res.data.id}`);
    },
    onError: () => toast.error('No se pudo iniciar la corrida'),
  });

  const deleteSelectedNode = () => {
    if (!selectedId) return;
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setSelectedId(null);
  };

  const currentMappings =
    selectedNode ? (selectedNode.data as FlowStepNodeData).step.inputMappings ?? [] : [];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-80px)]">
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Flujos', href: '/flows' },
          { label: flowId ? `Editar #${flowId}` : 'Nuevo' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs h-9"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          placeholder="Nombre del flujo"
        />
        <Input
          className="max-w-sm h-9"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
        />
        <Separator orientation="vertical" className="!h-7" />
        <Button variant="outline" size="sm" onClick={addNode}>
          <Plus className="w-4 h-4 mr-1" />
          Nodo
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" />
          Guardar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!flowId}
          onClick={() => setRunOpen(true)}
        >
          <Play className="w-4 h-4 mr-1" />
          Ejecutar
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/flows">Lista</Link>
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden bg-muted/20">
        <div className="flex-1 min-h-[400px]">
          <ReactFlowProvider>
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={flowEditorNodeTypes}
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            className="bg-background"
          >
            <MiniMap />
            <Controls />
            <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside className="w-80 border-l bg-card p-3 overflow-y-auto shrink-0 space-y-3">
          {!selectedNode && <p className="text-sm text-muted-foreground">Seleccione un nodo en el canvas.</p>}
          {selectedNode && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Inspector</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deleteSelectedNode}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label>Etiqueta</Label>
                <Input
                  className="mt-1"
                  value={(selectedNode.data as FlowStepNodeData).label}
                  onChange={(e) => updateSelectedLabel(e.target.value)}
                />
              </div>
              <div>
                <Label>Request (servicio)</Label>
                <Select
                  value={String((selectedNode.data as FlowStepNodeData).step.requestConfigId)}
                  onValueChange={(v) => updateSelectedStep({ requestConfigId: parseInt(v, 10) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(requestConfigs ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        #{c.id} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body mode</Label>
                <Select
                  value={(selectedNode.data as FlowStepNodeData).step.bodyMode}
                  onValueChange={(v) => updateSelectedStep({ bodyMode: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="static">static</SelectItem>
                    <SelectItem value="template">template</SelectItem>
                    <SelectItem value="template_mutated">template_mutated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template id (opcional)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={(selectedNode.data as FlowStepNodeData).step.templateId ?? ''}
                  onChange={(e) =>
                    updateSelectedStep({
                      templateId: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label>Base JSON (opcional)</Label>
                <Textarea
                  className="mt-1 font-mono text-xs min-h-[80px]"
                  value={(selectedNode.data as FlowStepNodeData).step.baseJson ?? ''}
                  onChange={(e) => updateSelectedStep({ baseJson: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Preset nombre (opcional)</Label>
                <Input
                  className="mt-1"
                  value={(selectedNode.data as FlowStepNodeData).step.presetName ?? ''}
                  onChange={(e) => updateSelectedStep({ presetName: e.target.value || null })}
                />
              </div>
              <div>
                <Label>Mapeos desde padres ({parentIds.length})</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Conecte nodos hacia la izquierda. Solo se permiten padres directos.
                </p>
                <div className="space-y-2 mt-2">
                  {currentMappings.map((m, idx) => (
                    <div key={idx} className="grid gap-1 border rounded p-2 text-xs">
                      <Select
                        value={m.fromNodeId}
                        onValueChange={(v) => {
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], fromNodeId: v };
                          setMappings(next);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Padre" />
                        </SelectTrigger>
                        <SelectContent>
                          {parentIds.map((pid) => (
                            <SelectItem key={pid} value={pid}>
                              {((nodes.find((x) => x.id === pid)?.data as FlowStepNodeData)?.label) ?? pid}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="sourcePath (ej. data.id)"
                        className="h-8"
                        value={m.sourcePath}
                        onChange={(e) => {
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], sourcePath: e.target.value };
                          setMappings(next);
                        }}
                      />
                      <Input
                        placeholder="targetPath (ej. idRef)"
                        className="h-8"
                        value={m.targetPath}
                        onChange={(e) => {
                          const next = [...currentMappings];
                          next[idx] = { ...next[idx], targetPath: e.target.value };
                          setMappings(next);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={parentIds.length === 0}
                    onClick={() =>
                      setMappings([
                        ...currentMappings,
                        { fromNodeId: parentIds[0] ?? '', sourcePath: '', targetPath: '' },
                      ])
                    }
                  >
                    Añadir mapeo
                  </Button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ejecutar flujo</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Request count</Label>
            <Input
              type="number"
              min={1}
              className="mt-1"
              value={runCount}
              onChange={(e) => setRunCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunOpen(false)}>
              Cerrar
            </Button>
            <Button disabled={runMutation.isPending} onClick={() => runMutation.mutate()}>
              Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
