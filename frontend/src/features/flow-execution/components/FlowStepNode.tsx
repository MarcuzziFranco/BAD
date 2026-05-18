import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import { useEnrichedStepMeta } from '../hooks/useEnrichedFlowNodes';
import type { FlowStepDef } from '../types/flow.types';
import { MANUAL_SOURCE_GROUP } from '@/shared/constants/resource-groups';

export type FlowStepNodeData = {
  label: string;
  step: FlowStepDef;
};

function groupLabel(g?: string) {
  if (!g) return '?';
  return g === MANUAL_SOURCE_GROUP ? 'manual' : g;
}

export const FlowStepNode = memo(function FlowStepNode({ data, selected }: NodeProps) {
  const d = data as FlowStepNodeData;
  const { requestConfigs, jsonTemplates } = useFlowEditorContext();
  const meta = useEnrichedStepMeta(d.step, requestConfigs, jsonTemplates);
  const mappingCount = d.step.inputMappings?.length ?? 0;

  return (
    <div
      className={`rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[180px] max-w-[260px] ${
        selected ? 'ring-2 ring-primary' : ''
      } ${meta.groupMismatch ? 'border-amber-500/60' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !bg-primary" />
      <div className="flex items-start justify-between gap-1">
        <div className="text-sm font-medium truncate flex-1">{d.label}</div>
        {meta.groupMismatch && (
          <span title="Grupo servicio ≠ template">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </span>
        )}
      </div>
      {meta.serviceGroup && (
        <Badge variant="secondary" className="text-[10px] mt-1 px-1 py-0">
          {groupLabel(meta.serviceGroup)}
        </Badge>
      )}
      <div className="text-xs text-muted-foreground mt-1 truncate">
        {meta.serviceMethod && <span className="font-mono mr-1">{meta.serviceMethod}</span>}
        {meta.serviceName ?? `Request #${d.step.requestConfigId}`}
      </div>
      <div className="text-[10px] text-muted-foreground truncate mt-0.5">
        {meta.templateName ? `Template: ${meta.templateName}` : 'Sin template'}
      </div>
      <div className="flex flex-wrap gap-1 mt-1.5">
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {d.step.bodyMode}
        </Badge>
        {mappingCount > 0 && (
          <Badge variant="default" className="text-[10px] px-1 py-0">
            {mappingCount} mapeo{mappingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!size-3 !bg-primary" />
    </div>
  );
});

export const flowEditorNodeTypes = { flowStep: FlowStepNode };
