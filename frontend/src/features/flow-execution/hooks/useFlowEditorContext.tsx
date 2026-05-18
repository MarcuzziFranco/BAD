import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { RequestConfig } from '@/features/servicios/types/servicios.types';
import type { JsonTemplate } from '@/features/templates/types/templates.types';

export interface PreviewResponse {
  body: string;
  statusCode?: number;
  capturedAt: string;
}

export interface FlowEditorContextValue {
  activeGroup: string;
  setActiveGroup: (g: string) => void;
  previewResponses: Record<string, PreviewResponse>;
  setPreviewResponse: (nodeId: string, data: PreviewResponse) => void;
  manualParentJson: Record<string, string>;
  setManualParentJson: (nodeId: string, json: string) => void;
  inspectorTab: string;
  setInspectorTab: (tab: string) => void;
  requestConfigs: RequestConfig[];
  jsonTemplates: JsonTemplate[];
  serviceGroups: string[];
  templateGroups: string[];
}

const FlowEditorContext = createContext<FlowEditorContextValue | null>(null);

export function FlowEditorProvider({
  children,
  requestConfigs,
  jsonTemplates,
  serviceGroups,
  templateGroups,
}: {
  children: ReactNode;
  requestConfigs: RequestConfig[];
  jsonTemplates: JsonTemplate[];
  serviceGroups: string[];
  templateGroups: string[];
}) {
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [previewResponses, setPreviewResponses] = useState<Record<string, PreviewResponse>>({});
  const [manualParentJson, setManualParentJsonState] = useState<Record<string, string>>({});
  const [inspectorTab, setInspectorTab] = useState('general');

  const setPreviewResponse = useCallback((nodeId: string, data: PreviewResponse) => {
    setPreviewResponses((prev) => ({ ...prev, [nodeId]: data }));
  }, []);

  const setManualParentJson = useCallback((nodeId: string, json: string) => {
    setManualParentJsonState((prev) => ({ ...prev, [nodeId]: json }));
  }, []);

  const value = useMemo(
    () => ({
      activeGroup,
      setActiveGroup,
      previewResponses,
      setPreviewResponse,
      manualParentJson,
      setManualParentJson,
      inspectorTab,
      setInspectorTab,
      requestConfigs,
      jsonTemplates,
      serviceGroups,
      templateGroups,
    }),
    [
      activeGroup,
      previewResponses,
      setPreviewResponse,
      manualParentJson,
      setManualParentJson,
      inspectorTab,
      requestConfigs,
      jsonTemplates,
      serviceGroups,
      templateGroups,
    ],
  );

  return <FlowEditorContext.Provider value={value}>{children}</FlowEditorContext.Provider>;
}

export function useFlowEditorContext() {
  const ctx = useContext(FlowEditorContext);
  if (!ctx) throw new Error('useFlowEditorContext must be used within FlowEditorProvider');
  return ctx;
}
