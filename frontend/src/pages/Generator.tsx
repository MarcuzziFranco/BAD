import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { templatesApi, presetsApi, generatorApi } from '@/services/api';
import type { JsonField } from '@/services/api';
import { 
  Upload, 
  Play, 
  Eye, 
  Download, 
  Database, 
  FileJson,
  RefreshCw,
  Code,
  TreeDeciduous,
  Sparkles,
  Settings,
  Shuffle,
} from 'lucide-react';
import { JsonVisualizer } from '@/components/generator/JsonFieldEditor';
import type { FieldConfig as LocalFieldConfig } from '@/components/generator/JsonFieldEditor';

type OutputFormat = 'Preview' | 'SingleFile' | 'Database';

interface FieldConfigState extends LocalFieldConfig {
  originalType: string;
  originalValue: unknown;
}

export function Generator() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado principal
  const [jsonContent, setJsonContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [count, setCount] = useState(5);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('Preview');
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  
  // Estado de campos y configuraciones
  const [fields, setFields] = useState<JsonField[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfigState>>({});
  
  // Estado de generación
  const [generatedJsons, setGeneratedJsons] = useState<string[]>([]);
  const [selectedGeneratedIndex, setSelectedGeneratedIndex] = useState(0);

  // Queries
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
      // Inicializar configuraciones de campos
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
    mutationFn: () => {
      const activeConfigs = Object.values(fieldConfigs)
        .filter((c) => c.operation !== 'Random')
        .map(({ originalType, originalValue, ...config }) => config);

      return generatorApi.generate({
        jsonContent,
        count,
        presetName: selectedPreset || undefined,
        fieldConfigs: activeConfigs.length > 0 ? activeConfigs : undefined,
        outputFormat,
      });
    },
    onSuccess: (response) => {
      setGeneratedJsons(response.data.generatedJsons);
      setSelectedGeneratedIndex(0);
    },
  });

  // Cargar template seleccionado
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t) => t.id === selectedTemplateId);
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

  // Analizar JSON cuando cambia
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
        setSelectedTemplateId(null);
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

  const applyPresetToConfigs = (presetName: string) => {
    setSelectedPreset(presetName);
    // El preset se aplica en el backend, aquí solo lo marcamos
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generador JSON</h2>
          <p className="text-muted-foreground">
            Configura cómo mutará cada campo de tu JSON
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {fields.length} campos
          </Badge>
          {getConfiguredFieldsCount() > 0 && (
            <Badge variant="secondary" className="text-sm">
              {getConfiguredFieldsCount()} configurados
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid gap-4 lg:grid-cols-3 min-h-0">
        {/* Panel izquierdo: Configuración JSON (2 columnas) */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          {/* Controles de carga */}
          <Card className="shrink-0">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Select
                  value={selectedTemplateId?.toString() || '_none'}
                  onValueChange={(v) => setSelectedTemplateId(v === '_none' ? null : parseInt(v))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Cargar desde template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Seleccionar template</SelectItem>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground">o</span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Cargar archivo
                </Button>

                <div className="flex-1" />

                {getConfiguredFieldsCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetAllConfigs}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reset todo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visualizador JSON */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración de Campos
                </CardTitle>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'visual' | 'code')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="visual" className="text-xs px-3">
                      <TreeDeciduous className="w-3.5 h-3.5 mr-1" />
                      Visual
                    </TabsTrigger>
                    <TabsTrigger value="code" className="text-xs px-3">
                      <Code className="w-3.5 h-3.5 mr-1" />
                      Código
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>
                Haz clic en cualquier campo para configurar su mutación
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'visual' ? (
                <div className="h-full overflow-auto border rounded-lg bg-card p-2">
                  {jsonContent ? (
                    <JsonVisualizer
                      jsonContent={jsonContent}
                      fields={fields}
                      configs={fieldConfigs}
                      onConfigChange={handleConfigChange}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileJson className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Carga un JSON para comenzar</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={jsonContent}
                    onChange={(v) => {
                      setJsonContent(v || '');
                      setSelectedTemplateId(null);
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Opciones y Resultados */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Opciones de generación */}
          <Card className="shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Preset de mutación</label>
                <Select 
                  value={selectedPreset || '_none'} 
                  onValueChange={(v) => applyPresetToConfigs(v === '_none' ? '' : v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sin preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">
                      <span className="flex items-center">
                        <Shuffle className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                        Todo aleatorio
                      </span>
                    </SelectItem>
                    {presets?.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        <span className="flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPreset && (
                  <p className="text-xs text-muted-foreground mt-1">
                    El preset se combina con tus configuraciones personalizadas
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cantidad</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Salida</label>
                  <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preview">
                        <span className="flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          Preview
                        </span>
                      </SelectItem>
                      <SelectItem value="SingleFile">
                        <span className="flex items-center">
                          <FileJson className="w-3.5 h-3.5 mr-2" />
                          Archivo
                        </span>
                      </SelectItem>
                      <SelectItem value="Database">
                        <span className="flex items-center">
                          <Database className="w-3.5 h-3.5 mr-2" />
                          Base datos
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => generateMutation.mutate()}
                disabled={!jsonContent || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generar {count} JSON{count > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Resultados</CardTitle>
                {generatedJsons.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadGeneratedJsons}>
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                )}
              </div>
              {generatedJsons.length > 0 && (
                <CardDescription>
                  {generatedJsons.length} JSON{generatedJsons.length > 1 ? 's' : ''} generado{generatedJsons.length > 1 ? 's' : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              {generatedJsons.length > 0 ? (
                <div className="h-full flex flex-col">
                  {generatedJsons.length > 1 && (
                    <div className="flex items-center gap-2 mb-2 shrink-0">
                      <span className="text-sm text-muted-foreground">Ver:</span>
                      <Select
                        value={selectedGeneratedIndex.toString()}
                        onValueChange={(v) => setSelectedGeneratedIndex(parseInt(v))}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generatedJsons.map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              #{i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex-1 border rounded-md overflow-hidden">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={(() => {
                        try {
                          return JSON.stringify(JSON.parse(generatedJsons[selectedGeneratedIndex]), null, 2);
                        } catch {
                          return generatedJsons[selectedGeneratedIndex];
                        }
                      })()}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 11,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-md bg-secondary/30">
                  <p className="text-sm text-muted-foreground">
                    Los JSONs generados aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
