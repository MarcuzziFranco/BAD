import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowStepDef } from '../types/flow.types';

export type FlowStepNodeData = {
  label: string;
  step: FlowStepDef;
};

export const FlowStepNode = memo(function FlowStepNode({ data, selected }: NodeProps) {
  const d = data as FlowStepNodeData;
  return (
    <div
      className={`rounded-lg border bg-card px-3 py-2 shadow-sm min-w-[140px] max-w-[220px] ${selected ? 'ring-2 ring-primary' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !bg-primary" />
      <div className="text-sm font-medium truncate">{d.label}</div>
      <div className="text-xs text-muted-foreground">Request #{d.step.requestConfigId}</div>
      <div className="text-[10px] text-muted-foreground truncate">{d.step.bodyMode}</div>
      <Handle type="source" position={Position.Right} className="!size-3 !bg-primary" />
    </div>
  );
});

export const flowEditorNodeTypes = { flowStep: FlowStepNode };
