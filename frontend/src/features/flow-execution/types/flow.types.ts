import type { FieldConfig } from '@/shared/types/api.types';

export interface FlowDefinitionV1 {
  version: number;
  nodes: FlowCanvasNodeDef[];
  edges: FlowCanvasEdgeDef[];
}

export interface FlowCanvasEdgeDef {
  id?: string;
  source: string;
  target: string;
}

export interface FlowCanvasNodeDef {
  id: string;
  position: { x: number; y: number };
  label?: string;
  step: FlowStepDef;
}

export interface FlowInputMapping {
  fromNodeId: string;
  sourcePath: string;
  targetPath: string;
}

export interface FlowStepDef {
  requestConfigId: number;
  bodyMode: string;
  baseJson?: string | null;
  templateId?: number | null;
  mutations?: FieldConfig[] | null;
  presetName?: string | null;
  dataPresetId?: number | null;
  mutatePerIteration: boolean;
  inputMappings: FlowInputMapping[];
}

export interface ExecutionFlowListItem {
  id: number;
  name: string;
  description: string | null;
  definitionVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionFlowDetail extends ExecutionFlowListItem {
  definitionJson: string;
}

export interface FlowRunListItem {
  id: number;
  executionFlowId: number;
  status: string;
  requestCount: number;
  executionMode: string;
  intervalMs: number;
  mutatePerIteration: boolean;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface FlowRunStepRow {
  id: number;
  clientNodeId: string;
  status: string;
  testExecutionId: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface FlowRunDetail extends FlowRunListItem {
  flowName: string;
  definitionJson: string;
  steps: FlowRunStepRow[];
}
