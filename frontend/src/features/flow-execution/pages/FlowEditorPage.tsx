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
import { templatesApi } from '@/features/templates/api/templates.api';
import { flowRunsApi } from '../api/flow-runs.api';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import { MANUAL_SOURCE_GROUP } from '@/shared/constants/resource-groups';
import { flowsApi } from '../api/flows.api';
import { flowEditorNodeTypes, type FlowStepNodeData } from '../components/FlowStepNode';
import { FlowResourcePalette } from '../components/FlowResourcePalette';
import { FlowNodeInspector } from '../components/FlowNodeInspector';
import { FlowEditorProvider } from '../hooks/useFlowEditorContext';
import { definitionToFlowNodes, emptyStep, flowStateToDefinition } from '../utils/flowDefinitionAdapters';
import { Plus, Save, Play } from 'lucide-react';

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

function sortGroups(groups: Set<string>) {
  return Array.from(groups).sort((a, b) => {
    if (a === MANUAL_SOURCE_GROUP) return 1;
    if (b === MANUAL_SOURCE_GROUP) return -1;
    return a.localeCompare(b);
  });
}

function FlowEditorInner() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const flowId = routeId ? parseInt(routeId, 10) : null;
  const queryClient = useQueryClient();
  const { setInspectorTab } = useFlowEditorContext();

  const [flowName, setFlowName] = useState('Nuevo flujo');
  const [description, setDescription] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(newInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runCount, setRunCount] = useState(1);
  const [nodeGroupFilter, setNodeGroupFilter] = useState<string>('all');

  const { data: flowDetail } = useQuery({
    queryKey: ['flow', flowId],
    queryFn: () => flowsApi.getById(flowId!).then((r) => r.data),
    enabled: Number.isFinite(flowId ?? NaN),
  });

  const { data: lastRun } = useQuery({
    queryKey: ['flow-last-run', flowId],
    queryFn: async () => {
      const runs = await flowRunsApi.listByFlow(flowId!).then((r) => r.data);
      return runs[0] ?? null;
    },
    enabled: Number.isFinite(flowId ?? NaN),
  });

  const { data: lastRunDetail } = useQuery({
    queryKey: ['flow-run', lastRun?.id],
    queryFn: () => flowRunsApi.getById(lastRun!.id).then((r) => r.data),
    enabled: Boolean(lastRun?.id),
  });

  const lastRunStepExecutions = useMemo(() => {
    const map: Record<string, number> = {};
    lastRunDetail?.steps.forEach((s) => {
      if (s.testExecutionId) map[s.clientNodeId] = s.testExecutionId;
    });
    return map;
  }, [lastRunDetail]);

  useEffect(() => {
    if (!flowDetail) return;
    setFlowName(flowDetail.name);
    setDescription(flowDetail.description || '');
    try {
      const { nodes: n, edges: e } = definitionToFlowNodes(
        JSON.parse(flowDetail.definitionJson),
      );
      setNodes(n);
      setEdges(e);
    } catch {
      toast.error('Definición JSON inválida');
    }
  }, [flowDetail, setNodes, setEdges]);

  const selectedNode = useMemo(
    () => (selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null),
    [nodes, selectedId],
  );

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
        return { ...n, data: { ...d, step: { ...d.step, ...patch } } };
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

  const setMappings = (inputMappings: FlowStepNodeData['step']['inputMappings']) => {
    updateSelectedStep({ inputMappings });
  };

  const assignService = (configId: number, templateId: number | null, sourceGroup: string) => {
    if (!selectedId) return;
    setNodeGroupFilter(sourceGroup);
    updateSelectedStep({
      requestConfigId: configId,
      ...(templateId ? { templateId } : {}),
    });
  };

  const assignTemplate = (templateId: number, sourceGroup: string) => {
    if (!selectedId) return;
    setNodeGroupFilter(sourceGroup);
    updateSelectedStep({ templateId });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const def = flowStateToDefinition(nodes, edges);
      const json = JSON.stringify(def);
      if (flowId)
        return flowsApi.update(flowId, {
          name: flowName.trim(),
          description: description.trim() || undefined,
          definitionJson: json,
        });
      return flowsApi.create({
        name: flowName.trim(),
        description: description.trim() || undefined,
        definitionJson: json,
      });
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
      if (!flowId) throw new Error('Guarde el flujo antes de ejecutar');
      return flowRunsApi.start(flowId, {
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

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, n: Node) => {
      setSelectedId(n.id);
      if (edges.some((e) => e.target === n.id)) setInspectorTab('mappings');
    },
    [edges, setInspectorTab],
  );

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-80px)]">
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Flujos', href: '/flows' },
          { label: flowId ? `Editar #${flowId}` : 'Nuevo' },
        ]}
      />

      <ToolbarSection
        flowName={flowName}
        setFlowName={setFlowName}
        description={description}
        setDescription={setDescription}
        onAddNode={addNode}
        onSave={() => saveMutation.mutate()}
        savePending={saveMutation.isPending}
        flowId={flowId}
        onRun={() => setRunOpen(true)}
      />

      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden bg-muted/20">
        <FlowResourcePalette
          selectedId={selectedId}
          onAssignService={assignService}
          onAssignTemplate={assignTemplate}
        />

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
              onNodeDoubleClick={onNodeDoubleClick}
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

        <FlowNodeInspector
          selectedNode={selectedNode}
          nodes={nodes}
          edges={edges}
          onUpdateLabel={updateSelectedLabel}
          onUpdateStep={updateSelectedStep}
          onDelete={deleteSelectedNode}
          onMappingsChange={setMappings}
          nodeGroupFilter={nodeGroupFilter}
          onNodeGroupFilterChange={setNodeGroupFilter}
          lastRunStepExecutions={lastRunStepExecutions}
        />
      </div>

      <Dialog open={runOpen} onOpenChange={setRunOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ejecutar flujo</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Iteraciones</Label>
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

function ToolbarSection({
  flowName,
  setFlowName,
  description,
  setDescription,
  onAddNode,
  onSave,
  savePending,
  flowId,
  onRun,
}: {
  flowName: string;
  setFlowName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onAddNode: () => void;
  onSave: () => void;
  savePending: boolean;
  flowId: number | null;
  onRun: () => void;
}) {
  const { activeGroup, setActiveGroup, serviceGroups } = useFlowEditorContext();

  return (
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
        placeholder="Descripción"
      />
      <Separator orientation="vertical" className="!h-7" />
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">Grupo activo</Label>
        <Select value={activeGroup} onValueChange={setActiveGroup}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {serviceGroups.map((g) => (
              <SelectItem key={g} value={g}>
                {g === MANUAL_SOURCE_GROUP ? 'manual' : g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" size="sm" onClick={onAddNode}>
        <Plus className="w-4 h-4 mr-1" />
        Nodo
      </Button>
      <Button size="sm" onClick={onSave} disabled={savePending}>
        <Save className="w-4 h-4 mr-1" />
        Guardar
      </Button>
      <Button size="sm" variant="secondary" disabled={!flowId} onClick={onRun}>
        <Play className="w-4 h-4 mr-1" />
        Ejecutar
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/flows">Lista</Link>
      </Button>
    </div>
  );
}

export function FlowEditorPage() {
  const { data: requestConfigs } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((r) => r.data),
  });

  const { data: jsonTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((r) => r.data),
  });

  const serviceGroups = useMemo(
    () => sortGroups(new Set((requestConfigs ?? []).map((c) => c.sourceGroup))),
    [requestConfigs],
  );

  const templateGroups = useMemo(
    () => sortGroups(new Set((jsonTemplates ?? []).map((t) => t.sourceGroup))),
    [jsonTemplates],
  );

  if (!requestConfigs || !jsonTemplates) {
    return <p className="p-4 text-sm text-muted-foreground">Cargando recursos…</p>;
  }

  return (
    <FlowEditorProvider
      requestConfigs={requestConfigs}
      jsonTemplates={jsonTemplates}
      serviceGroups={serviceGroups}
      templateGroups={templateGroups}
    >
      <FlowEditorInner />
    </FlowEditorProvider>
  );
}
