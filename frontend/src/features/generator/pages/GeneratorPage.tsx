import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CustomCombobox as Combobox } from '@/shared/components/common/CustomCombobox';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { templatesApi } from '@/features/templates/api/templates.api';
import { presetsApi, generatorApi } from '../api/generator.api';
import type { JsonField } from '@/shared/types/api.types';
import { 
  Upload, Play, Eye, Download, Database, FileJson, RefreshCw, Code, TreeDeciduous,
  Sparkles, Shuffle, ArrowRight, ArrowLeft, CheckCircle2, Wand2, Hand,
} from 'lucide-react';
import { JsonVisualizer } from '../components/JsonFieldEditor';
import type { FieldConfig as LocalFieldConfig } from '../components/JsonFieldEditor';

type OutputFormat = 'Preview' | 'SingleFile' | 'Database';
type ConfigMode = 'preset' | 'manual';

interface FieldConfigState extends LocalFieldConfig {
  originalType: string;
  originalValue: unknown;
}

export function GeneratorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [jsonContent, setJsonContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [configMode, setConfigMode] = useState<ConfigMode>('manual');
  const [count, setCount] = useState(5);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('Preview');
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  
  const [fields, setFields] = useState<JsonField[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfigState>>({});
  
  const [generatedJsons, setGeneratedJsons] = useState<string[]>([]);
  const [selectedGeneratedIndex, setSelectedGeneratedIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetsApi.getAll().then((res) => res.data),
  });

  const analyzeMutation = useMutation({
    mutationFn: (json: string) => generatorApi.analyze(json),
    onSuccess: (response) => {
      setFields(response.data.fields);
      const configs: Record<string, FieldConfigState> = {};
      response.data.fields.forEach((field) => {
        configs[field.key] = {
          key: field.key,
          operation: 'Random',
          originalType: field.type,
          originalValue: field.value,
        };
      });
      setFieldConfigs(configs);
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!jsonContent) return Promise.reject(new Error('No JSON content'));

      const activeConfigs = configMode === 'manual'
        ? Object.values(fieldConfigs)
            .filter((c) => c.operation !== 'Random')
            .map(({ originalType, originalValue, ...config }) => config)
        : [];

      const requestData = {
        jsonContent,
        count,
        presetName: configMode === 'preset' ? (selectedPreset || undefined) : undefined,
        fieldConfigs: activeConfigs.length > 0 ? activeConfigs : undefined,
        outputFormat,
      };

      return generatorApi.generate(requestData);
    },
    onSuccess: (response) => {
      setGeneratedJsons(response.data.generatedJsons);
      setSelectedGeneratedIndex(0);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const templateOptions = useMemo(() => {
    return (templates || []).map((t) => ({
      value: t.id.toString(),
      label: t.name,
      description: t.description || undefined,
    }));
  }, [templates]);

  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t) => t.id.toString() === selectedTemplateId);
      if (template) {
        try {
          const formatted = JSON.stringify(JSON.parse(template.content), null, 2);
          setJsonContent(formatted);
        } catch {
          setJsonContent(template.content);
        }
      }
    }
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (jsonContent) {
      try {
        JSON.parse(jsonContent);
        analyzeMutation.mutate(jsonContent);
      } catch {
        setFields([]);
        setFieldConfigs({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonContent]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        setJsonContent(JSON.stringify(parsed, null, 2));
        setSelectedTemplateId('');
      } catch {
        setJsonContent(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfigChange = (key: string, updates: Partial<FieldConfigState>) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const downloadGeneratedJsons = () => {
    const content = generatedJsons.length === 1
      ? generatedJsons[0]
      : JSON.stringify(generatedJsons.map((j) => JSON.parse(j)), null, 2);
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfiguredFieldsCount = () => {
    return Object.values(fieldConfigs).filter((c) => c.operation !== 'Random').length;
  };

  const resetAllConfigs = () => {
    const reset: Record<string, FieldConfigState> = {};
    fields.forEach((f) => {
      reset[f.key] = {
        ...fieldConfigs[f.key],
        operation: 'Random',
        value: undefined,
        minValue: undefined,
        maxValue: undefined,
        listValues: undefined,
      };
    });
    setFieldConfigs(reset);
  };

  const canProceedToStep2 = jsonContent && fields.length > 0;

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <PageBreadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Generador' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Generador JSON</h2>
          <Separator orientation="vertical" className="!h-6" />
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={currentStep === 1 ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3"
              onClick={() => setCurrentStep(1)}
            >
              1. Configurar
            </Button>
            <Button
              variant={currentStep === 2 ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3"
              onClick={() => canProceedToStep2 && setCurrentStep(2)}
              disabled={!canProceedToStep2}
            >
              2. Generar
            </Button>
          </div>
        </div>
        {currentStep === 1 && (
          <Button onClick={() => setCurrentStep(2)} disabled={!canProceedToStep2}>
            Siguiente <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Contenido */}
      {currentStep === 1 ? (
        <Card className="flex-1 flex flex-col min-h-0">
          {/* Barra de controles */}
          <div className="border-b px-4 py-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Template:</span>
              <Combobox
                options={templateOptions}
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                placeholder="Seleccionar..."
                searchPlaceholder="Buscar..."
                emptyText="Sin templates"
                className="w-48"
              />
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="!h-6" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Modo:</span>
              <div className="flex items-center bg-muted rounded-md p-0.5">
                <Button
                  variant={configMode === 'preset' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 gap-1"
                  onClick={() => setConfigMode('preset')}
                >
                  <Wand2 className="w-3.5 h-3.5" /> Preset
                </Button>
                <Button
                  variant={configMode === 'manual' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 gap-1"
                  onClick={() => setConfigMode('manual')}
                >
                  <Hand className="w-3.5 h-3.5" /> Manual
                </Button>
              </div>
            </div>

            {configMode === 'preset' && (
              <>
                <Separator orientation="vertical" className="!h-6" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Preset:</span>
                  <Select value={selectedPreset || '_none'} onValueChange={(v) => setSelectedPreset(v === '_none' ? '' : v)}>
                    <SelectTrigger className="w-44 h-8">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">
                        <span className="flex items-center gap-2">
                          <Shuffle className="w-3.5 h-3.5" /> Todo aleatorio
                        </span>
                      </SelectItem>
                      {presets?.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" /> {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {configMode === 'manual' && jsonContent && (
              <>
                <Separator orientation="vertical" className="!h-6" />
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{fields.length} campos</Badge>
                  {getConfiguredFieldsCount() > 0 && (
                    <>
                      <Badge variant="secondary">{getConfiguredFieldsCount()} configurados</Badge>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={resetAllConfigs}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="flex-1" />

            {configMode === 'manual' && jsonContent && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'code')}>
                <TabsList className="h-8">
                  <TabsTrigger value="visual" className="text-xs px-3 h-7">
                    <TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Visual
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-xs px-3 h-7">
                    <Code className="w-3.5 h-3.5 mr-1" /> Codigo
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <CardContent className="flex-1 min-h-0 p-4">
            {!jsonContent ? (
              <Empty className="h-full border rounded-lg">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileJson /></EmptyMedia>
                  <EmptyTitle>Selecciona un template o carga un archivo JSON</EmptyTitle>
                  <EmptyDescription>Los campos detectados apareceran aqui para configurar</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : configMode === 'preset' ? (
              <div className="h-full border rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={jsonContent}
                  theme="vs-dark"
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
                />
              </div>
            ) : activeTab === 'visual' ? (
              <div className="h-full overflow-auto border rounded-lg">
                <JsonVisualizer
                  jsonContent={jsonContent}
                  fields={fields}
                  configs={fieldConfigs}
                  onConfigChange={handleConfigChange}
                />
              </div>
            ) : (
              <div className="h-full border rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={jsonContent}
                  onChange={(v) => { setJsonContent(v || ''); setSelectedTemplateId(''); }}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2 }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          <Card className="flex flex-col">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold">Opciones de generacion</h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver
              </Button>
            </div>
            <CardContent className="flex-1 p-4 space-y-6 overflow-auto">
              <div>
                <Label className="text-sm font-medium">Cantidad de JSONs</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number" min={1} max={1000} value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {[1, 5, 10, 25, 50, 100].map((n) => (
                      <Button key={n} variant={count === n ? 'default' : 'outline'} size="sm" onClick={() => setCount(n)}>{n}</Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Destino</Label>
                <RadioGroup value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)} className="mt-2 space-y-2">
                  <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="Preview" />
                    <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Preview</span>
                      <p className="text-xs text-muted-foreground">Ver resultados sin guardar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="SingleFile" />
                    <FileJson className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Descargar archivo</span>
                      <p className="text-xs text-muted-foreground">Guardar como archivo .json</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem value="Database" />
                    <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Guardar en BD</span>
                      <p className="text-xs text-muted-foreground">Almacenar como template</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <h4 className="font-medium">Resumen</h4>
                <div className="text-muted-foreground space-y-1">
                  <p>Template: {selectedTemplateId ? templates?.find(t => t.id.toString() === selectedTemplateId)?.name : 'JSON personalizado'}</p>
                  <p>Modo: {configMode === 'preset' ? `Preset (${selectedPreset || 'aleatorio'})` : `Manual (${getConfiguredFieldsCount()} configurados)`}</p>
                  <p>Cantidad: {count} JSON{count > 1 ? 's' : ''}</p>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <><Spinner className="w-4 h-4 mr-2" /> Generando...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Generar {count} JSON{count > 1 ? 's' : ''}</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Resultados</h3>
                {generatedJsons.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> {generatedJsons.length} generados
                  </Badge>
                )}
              </div>
              {generatedJsons.length > 0 && (
                <div className="flex items-center gap-2">
                  {generatedJsons.length > 1 && (
                    <Select value={selectedGeneratedIndex.toString()} onValueChange={(v) => setSelectedGeneratedIndex(parseInt(v))}>
                      <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {generatedJsons.map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>#{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="sm" onClick={downloadGeneratedJsons}>
                    <Download className="w-4 h-4 mr-1" /> Descargar
                  </Button>
                </div>
              )}
            </div>
            <CardContent className="flex-1 min-h-0 p-4">
              {generatedJsons.length > 0 ? (
                <div className="h-full border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={(() => {
                      try { return JSON.stringify(JSON.parse(generatedJsons[selectedGeneratedIndex]), null, 2); }
                      catch { return generatedJsons[selectedGeneratedIndex]; }
                    })()}
                    theme="vs-dark"
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true }}
                  />
                </div>
              ) : (
                <Empty className="h-full border rounded-lg">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><FileJson /></EmptyMedia>
                    <EmptyTitle>Sin resultados</EmptyTitle>
                    <EmptyDescription>Haz clic en "Generar" para ver resultados</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
