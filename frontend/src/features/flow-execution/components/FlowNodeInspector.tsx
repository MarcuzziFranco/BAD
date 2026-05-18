import { Link } from 'react-router-dom';
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
import { Trash2, ExternalLink } from 'lucide-react';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import { useEnrichedStepMeta } from '../hooks/useEnrichedFlowNodes';
import { getResolvedBaseJson } from '../hooks/useEnrichedFlowNodes';
import { JsonTreeView } from '@/shared/components/json/JsonPathPicker';
import { FlowMappingsPanel } from './FlowMappingsPanel';
import { FlowBodyPreviewPanel } from './FlowBodyPreviewPanel';
import { MANUAL_SOURCE_GROUP } from '@/shared/constants/resource-groups';
import type { FlowStepNodeData } from './FlowStepNode';
import type { FlowInputMapping } from '../types/flow.types';
import type { Edge, Node } from '@xyflow/react';

function groupLabel(g: string) {
  return g === MANUAL_SOURCE_GROUP ? 'manual' : g;
}

interface FlowNodeInspectorProps {
  selectedNode: Node | null;
  nodes: Node[];
  edges: Edge[];
  onUpdateLabel: (label: string) => void;
  onUpdateStep: (patch: Partial<FlowStepNodeData['step']>) => void;
  onDelete: () => void;
  onMappingsChange: (m: FlowInputMapping[]) => void;
  nodeGroupFilter: string;
  onNodeGroupFilterChange: (g: string) => void;
  lastRunStepExecutions?: Record<string, number>;
}

export function FlowNodeInspector({
  selectedNode,
  nodes,
  edges,
  onUpdateLabel,
  onUpdateStep,
  onDelete,
  onMappingsChange,
  nodeGroupFilter,
  onNodeGroupFilterChange,
  lastRunStepExecutions,
}: FlowNodeInspectorProps) {
  const {
    inspectorTab,
    setInspectorTab,
    requestConfigs,
    jsonTemplates,
    serviceGroups,
    templateGroups,
  } = useFlowEditorContext();

  if (!selectedNode) {
    return (
      <aside className="w-[440px] border-l bg-card p-4 shrink-0">
        <p className="text-sm text-muted-foreground">
          Seleccione un nodo en el canvas para configurar request, template y mapeos.
        </p>
      </aside>
    );
  }

  const data = selectedNode.data as FlowStepNodeData;
  const step = data.step;
  const meta = useEnrichedStepMeta(step, requestConfigs, jsonTemplates);

  const filteredServices =
    nodeGroupFilter === 'all'
      ? requestConfigs
      : requestConfigs.filter((c) => c.sourceGroup === nodeGroupFilter);

  const filteredTemplates =
    nodeGroupFilter === 'all'
      ? jsonTemplates
      : jsonTemplates.filter((t) => t.sourceGroup === nodeGroupFilter);

  const baseJsonForTree = getResolvedBaseJson(step, jsonTemplates);

  return (
    <aside className="w-[440px] border-l bg-card flex flex-col shrink-0 min-h-0">
      <div className="flex justify-between items-center p-3 border-b shrink-0">
        <span className="text-sm font-semibold">Inspector</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Tabs
        value={inspectorTab}
        onValueChange={setInspectorTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="mx-3 mt-2 grid grid-cols-5 h-8">
          <TabsTrigger value="general" className="text-[10px] px-1">
            General
          </TabsTrigger>
          <TabsTrigger value="request" className="text-[10px] px-1">
            Request
          </TabsTrigger>
          <TabsTrigger value="body" className="text-[10px] px-1">
            Body
          </TabsTrigger>
          <TabsTrigger value="mappings" className="text-[10px] px-1">
            Mapeos
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-[10px] px-1">
            Preview
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          <TabsContent value="general" className="mt-0 space-y-3">
            <div>
              <Label>Etiqueta</Label>
              <Input className="mt-1" value={data.label} onChange={(e) => onUpdateLabel(e.target.value)} />
            </div>
            {meta.groupMismatch && (
              <p className="text-xs text-amber-600">
                El servicio y el template pertenecen a grupos distintos. Considere alinearlos.
              </p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Servicio: {meta.serviceName ?? '—'} ({meta.serviceMethod})
              </p>
              <p>Template: {meta.templateName ?? '—'}</p>
              <p>Mapeos: {step.inputMappings?.length ?? 0}</p>
            </div>
          </TabsContent>

          <TabsContent value="request" className="mt-0 space-y-3">
            <div>
              <Label>Grupo (filtro)</Label>
              <Select value={nodeGroupFilter} onValueChange={onNodeGroupFilterChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {serviceGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Servicio (request)</Label>
              <Select
                value={String(step.requestConfigId)}
                onValueChange={(v) => {
                  const id = parseInt(v, 10);
                  const svc = requestConfigs.find((c) => c.id === id);
                  const patch: Partial<typeof step> = { requestConfigId: id };
                  if (svc?.jsonTemplateId) {
                    patch.templateId = svc.jsonTemplateId;
                    onNodeGroupFilterChange(svc.sourceGroup);
                  }
                  onUpdateStep(patch);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredServices.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      [{groupLabel(c.sourceGroup)}] #{c.id} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                <Link to={`/servicio-edit/${step.requestConfigId}`}>
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir servicio
                </Link>
              </Button>
            </div>
            <div>
              <Label>Body mode</Label>
              <Select value={step.bodyMode} onValueChange={(v) => onUpdateStep({ bodyMode: v })}>
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
              {(step.inputMappings?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Con mapeos activos use <strong>static</strong> o <strong>template</strong>.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="body" className="mt-0 space-y-3">
            <div>
              <Label>Grupo templates</Label>
              <Select value={nodeGroupFilter} onValueChange={onNodeGroupFilterChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {templateGroups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {groupLabel(g)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template</Label>
              <Select
                value={step.templateId != null ? String(step.templateId) : '__none__'}
                onValueChange={(v) =>
                  onUpdateStep({ templateId: v === '__none__' ? null : parseInt(v, 10) })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sin template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin template</SelectItem>
                  {filteredTemplates.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      [{groupLabel(t.sourceGroup)}] #{t.id} {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {step.templateId && (
                <Button variant="link" size="sm" className="h-auto p-0 mt-1" asChild>
                  <Link to={`/template-edit/${step.templateId}`}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Abrir template
                  </Link>
                </Button>
              )}
            </div>
            <div>
              <Label>Estructura base</Label>
              <div className="mt-1 border rounded-md p-2 max-h-40 overflow-auto">
                <JsonTreeView json={baseJsonForTree} />
              </div>
            </div>
            <details>
              <summary className="text-xs cursor-pointer text-muted-foreground">Base JSON (avanzado)</summary>
              <Textarea
                className="mt-2 font-mono text-xs min-h-[80px]"
                value={step.baseJson ?? ''}
                onChange={(e) => onUpdateStep({ baseJson: e.target.value || null })}
              />
            </details>
            <div>
              <Label>Preset nombre</Label>
              <Input
                className="mt-1"
                value={step.presetName ?? ''}
                onChange={(e) => onUpdateStep({ presetName: e.target.value || null })}
              />
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-0">
            <FlowMappingsPanel
              nodeId={selectedNode.id}
              step={step}
              edges={edges}
              nodes={nodes}
              mappings={step.inputMappings ?? []}
              onMappingsChange={onMappingsChange}
              lastRunStepExecutions={lastRunStepExecutions}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <FlowBodyPreviewPanel nodeId={selectedNode.id} step={step} edges={edges} />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
