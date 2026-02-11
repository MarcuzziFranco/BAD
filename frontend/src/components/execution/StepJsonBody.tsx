import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CustomCombobox as Combobox } from '@/shared/components/common/CustomCombobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templatesApi, presetsApi, generatorApi } from '@/services/api';
import type { FieldConfig, JsonField } from '@/services/api';
import { JsonVisualizer } from '@/components/generator/JsonFieldEditor';
import type { FieldConfig as LocalFieldConfig } from '@/components/generator/JsonFieldEditor';
import { FileJson, Code, Settings2, Loader2 } from 'lucide-react';

export type BodyMode = 'none' | 'static' | 'template' | 'template_mutated';
export type ConfigMode = 'preset' | 'manual';

interface StepJsonBodyProps {
  bodyMode: BodyMode;
  onBodyModeChange: (mode: BodyMode) => void;
  baseJson: string;
  onBaseJsonChange: (json: string) => void;
  templateId: number | null;
  onTemplateIdChange: (id: number | null) => void;
  configMode: ConfigMode;
  onConfigModeChange: (mode: ConfigMode) => void;
  presetName: string | null;
  onPresetNameChange: (name: string | null) => void;
  mutations: FieldConfig[];
  onMutationsChange: (mutations: FieldConfig[]) => void;
  httpMethod: string;
}

export function StepJsonBody({
  bodyMode,
  onBodyModeChange,
  baseJson,
  onBaseJsonChange,
  templateId,
  onTemplateIdChange,
  configMode,
  onConfigModeChange,
  presetName,
  onPresetNameChange,
  mutations,
  onMutationsChange,
  httpMethod,
}: StepJsonBodyProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [fields, setFields] = useState<JsonField[]>([]);
  const [configs, setConfigs] = useState<Record<string, LocalFieldConfig>>({});

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  // Analizar JSON cuando cambia
  useEffect(() => {
    if (baseJson && bodyMode === 'template_mutated') {
      generatorApi.analyze(baseJson).then((res) => {
        setFields(res.data.fields);
        // Inicializar configs con las mutaciones existentes
        const initialConfigs: Record<string, LocalFieldConfig> = {};
        mutations.forEach((m) => {
          initialConfigs[m.key] = {
            key: m.key,
            operation: m.operation,
            value: m.value,
            minValue: m.minValue,
            maxValue: m.maxValue,
            listValues: m.listValues,
          };
        });
        setConfigs(initialConfigs);
      }).catch(console.error);
    }
  }, [baseJson, bodyMode]);

  // Sincronizar configs locales con mutations prop
  const handleConfigChange = (key: string, config: Partial<LocalFieldConfig>) => {
    setConfigs((prev) => {
      const existing = prev[key] || { key, operation: 'Random' as const };
      const updated = {
        ...prev,
        [key]: {
          ...existing,
          ...config,
          key, // Asegurar que key siempre esté presente
        },
      };
      
      // Convertir a FieldConfig[] para el padre
      const newMutations: FieldConfig[] = Object.values(updated).filter(
        (c) => c.operation !== 'Random' || c.value !== undefined || c.minValue !== undefined || c.listValues !== undefined
      );
      onMutationsChange(newMutations);
      
      return updated;
    });
  };

  const { data: presetCategories } = useQuery({
    queryKey: ['presets-grouped'],
    queryFn: () => presetsApi.getGrouped().then((res) => res.data),
  });

  // Cargar contenido del template cuando se selecciona
  useEffect(() => {
    if (templateId && templates) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        onBaseJsonChange(template.content);
      }
    }
  }, [templateId, templates]);

  const templateOptions = templates?.map((t) => ({
    value: t.id.toString(),
    label: t.name,
  })) || [];

  const presetOptions = presetCategories?.flatMap((cat) =>
    cat.presets.map((p) => ({
      value: p.name,
      label: `${p.name} (${cat.category})`,
    }))
  ) || [];

  // Para métodos sin body
  const noBodyMethods = ['GET', 'DELETE'];
  const needsBody = !noBodyMethods.includes(httpMethod.toUpperCase());

  if (!needsBody) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileJson className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            El método {httpMethod} no requiere body
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Continúa al siguiente paso
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de modo de body */}
      <div>
        <Label className="text-base font-medium">Modo del Body</Label>
        <RadioGroup
          value={bodyMode}
          onValueChange={(v) => onBodyModeChange(v as BodyMode)}
          className="grid grid-cols-3 gap-2 mt-2"
        >
          <Label
            htmlFor="mode-static"
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              bodyMode === 'static' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="static" id="mode-static" />
            <div>
              <p className="font-medium text-sm">JSON Estático</p>
              <p className="text-xs text-muted-foreground">Pegar JSON</p>
            </div>
          </Label>
          <Label
            htmlFor="mode-template"
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              bodyMode === 'template' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="template" id="mode-template" />
            <div>
              <p className="font-medium text-sm">Template</p>
              <p className="text-xs text-muted-foreground">Usar existente</p>
            </div>
          </Label>
          <Label
            htmlFor="mode-mutated"
            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
              bodyMode === 'template_mutated' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="template_mutated" id="mode-mutated" />
            <div>
              <p className="font-medium text-sm">Template + Mutación</p>
              <p className="text-xs text-muted-foreground">Configurar campos</p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Contenido según modo */}
      {bodyMode === 'static' && (
        <div>
          <Label>JSON Body</Label>
          <div className="mt-2 border rounded-lg overflow-hidden h-64">
            <Editor
              height="100%"
              language="json"
              theme="vs-dark"
              value={baseJson}
              onChange={(v) => onBaseJsonChange(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      )}

      {(bodyMode === 'template' || bodyMode === 'template_mutated') && (
        <div className="space-y-4">
          {/* Selector de template */}
          <div>
            <Label>Template</Label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : (
              <Combobox
                options={templateOptions}
                value={templateId?.toString() || ''}
                onValueChange={(v) => onTemplateIdChange(v ? parseInt(v) : null)}
                placeholder="Seleccionar template..."
                emptyText="No hay templates"
                className="mt-2"
              />
            )}
          </div>

          {/* Configuración de mutación */}
          {bodyMode === 'template_mutated' && templateId && baseJson && (
            <div className="space-y-4">
              {/* Modo de configuración */}
              <div>
                <Label>Configuración de Campos</Label>
                <RadioGroup
                  value={configMode}
                  onValueChange={(v) => onConfigModeChange(v as ConfigMode)}
                  className="flex gap-4 mt-2"
                >
                  <Label
                    htmlFor="config-preset"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                      configMode === 'preset' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="preset" id="config-preset" />
                    <span className="text-sm">Preset</span>
                  </Label>
                  <Label
                    htmlFor="config-manual"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                      configMode === 'manual' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <RadioGroupItem value="manual" id="config-manual" />
                    <span className="text-sm">Manual</span>
                  </Label>
                </RadioGroup>
              </div>

              {configMode === 'preset' ? (
                <div>
                  <Label>Preset</Label>
                  <Combobox
                    options={presetOptions}
                    value={presetName || ''}
                    onValueChange={(v) => onPresetNameChange(v || null)}
                    placeholder="Seleccionar preset..."
                    emptyText="No hay presets"
                    className="mt-2"
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                      Configuración de Campos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'code')}>
                      <TabsList className="mb-2">
                        <TabsTrigger value="visual" className="gap-1">
                          <Settings2 className="w-3 h-3" /> Visual
                        </TabsTrigger>
                        <TabsTrigger value="code" className="gap-1">
                          <Code className="w-3 h-3" /> Código
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="visual" className="max-h-80 overflow-auto">
                        <JsonVisualizer
                          jsonContent={baseJson}
                          fields={fields}
                          configs={configs}
                          onConfigChange={handleConfigChange}
                        />
                      </TabsContent>
                      <TabsContent value="code">
                        <div className="h-64 border rounded-lg overflow-hidden">
                          <Editor
                            height="100%"
                            language="json"
                            theme="vs-dark"
                            value={baseJson}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Preview del JSON */}
          {bodyMode === 'template' && baseJson && (
            <div>
              <Label>Vista Previa</Label>
              <div className="mt-2 border rounded-lg overflow-hidden h-48">
                <Editor
                  height="100%"
                  language="json"
                  theme="vs-dark"
                  value={baseJson}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
