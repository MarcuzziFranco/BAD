import { useMemo } from 'react';
import type { RequestConfig } from '@/features/servicios/types/servicios.types';
import type { JsonTemplate } from '@/features/templates/types/templates.types';
import type { FlowStepDef } from '../types/flow.types';

export interface EnrichedStepMeta {
  serviceName?: string;
  serviceMethod?: string;
  serviceGroup?: string;
  templateName?: string;
  templateGroup?: string;
  groupMismatch: boolean;
}

export function useEnrichedStepMeta(
  step: FlowStepDef,
  requestConfigs: RequestConfig[],
  jsonTemplates: JsonTemplate[],
): EnrichedStepMeta {
  return useMemo(() => {
    const svc = requestConfigs.find((c) => c.id === step.requestConfigId);
    const tpl = step.templateId
      ? jsonTemplates.find((t) => t.id === step.templateId)
      : svc?.jsonTemplateId
        ? jsonTemplates.find((t) => t.id === svc.jsonTemplateId)
        : undefined;

    const serviceGroup = svc?.sourceGroup;
    const templateGroup = tpl?.sourceGroup;
    const groupMismatch = Boolean(
      serviceGroup && templateGroup && serviceGroup !== templateGroup,
    );

    return {
      serviceName: svc?.name,
      serviceMethod: svc?.method,
      serviceGroup,
      templateName: tpl?.name,
      templateGroup,
      groupMismatch,
    };
  }, [step, requestConfigs, jsonTemplates]);
}

export function getResolvedBaseJson(
  step: FlowStepDef,
  jsonTemplates: JsonTemplate[],
): string {
  if (step.baseJson?.trim()) return step.baseJson;
  if (step.templateId) {
    const t = jsonTemplates.find((x) => x.id === step.templateId);
    if (t?.content) return t.content;
  }
  return '{}';
}
