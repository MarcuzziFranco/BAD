import type { Edge, Node } from '@xyflow/react';
import type { FlowDefinitionV1, FlowStepDef } from '../types/flow.types';
import type { FlowStepNodeData } from '../components/FlowStepNode';

export function emptyStep(): FlowStepDef {
  return {
    requestConfigId: 1,
    bodyMode: 'none',
    baseJson: null,
    templateId: null,
    mutations: null,
    presetName: null,
    dataPresetId: null,
    mutatePerIteration: true,
    inputMappings: [],
  };
}

export function definitionToFlowNodes(def: FlowDefinitionV1): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = def.nodes.map((n) => ({
    id: n.id,
    type: 'flowStep',
    position: { x: n.position.x, y: n.position.y },
    data: {
      label: n.label || `Paso ${n.id.slice(0, 6)}`,
      step: { ...emptyStep(), ...n.step, inputMappings: n.step.inputMappings ?? [] },
    } satisfies FlowStepNodeData,
  }));
  const edges: Edge[] = def.edges.map((e, i) => ({
    id: e.id || `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
  }));
  return { nodes, edges };
}

export function flowStateToDefinition(nodes: Node[], edges: Edge[]): FlowDefinitionV1 {
  return {
    version: 1,
    nodes: nodes.map((n) => {
      const d = n.data as FlowStepNodeData;
      return {
        id: n.id,
        position: { x: n.position.x, y: n.position.y },
        label: d.label,
        step: d.step,
      };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
}
