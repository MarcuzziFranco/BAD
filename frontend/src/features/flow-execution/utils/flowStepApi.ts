import type { FlowStepDef } from '../types/flow.types';

export interface FlowStepPreviewPayload {
  requestConfigId: number;
  bodyMode: string;
  baseJson?: string | null;
  templateId?: number | null;
  mutations?: FlowStepDef['mutations'];
  presetName?: string | null;
  dataPresetId?: number | null;
  mutatePerIteration: boolean;
  inputMappings: { fromNodeId: string; sourcePath: string; targetPath: string }[];
}

export function flowStepToPreviewPayload(step: FlowStepDef): FlowStepPreviewPayload {
  return {
    requestConfigId: step.requestConfigId,
    bodyMode: step.bodyMode,
    baseJson: step.baseJson ?? null,
    templateId: step.templateId ?? null,
    mutations: step.mutations ?? null,
    presetName: step.presetName ?? null,
    dataPresetId: step.dataPresetId ?? null,
    mutatePerIteration: step.mutatePerIteration,
    inputMappings: (step.inputMappings ?? []).map((m) => ({
      fromNodeId: m.fromNodeId,
      sourcePath: m.sourcePath,
      targetPath: m.targetPath,
    })),
  };
}
