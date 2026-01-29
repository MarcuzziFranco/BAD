import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { templatesApi, presetsApi, generatorApi } from '@/services/api';
import type { JsonField, FieldConfig } from '@/services/api';
import { 
  Upload, 
  Play, 
  Settings2, 
  Eye, 
  Download, 
  Database, 
  FileJson,
  RefreshCw
} from 'lucide-react';

type OutputFormat = 'Preview' | 'SingleFile' | 'Database';

interface FieldConfigState extends FieldConfig {
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
  
  // Estado de campos y configuraciones
  const [fields, setFields] = useState<JsonField[]>([]);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfigState>>({});
  
  // Estado de generación
  const [generatedJsons, setGeneratedJsons] = useState<string[]>([]);
  const [selectedGeneratedIndex, setSelectedGeneratedIndex] = useState(0);
  
  // Estado de UI
  const [isConfigSheetOpen, setIsConfigSheetOpen] = useState(false);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Queries
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetsApi.getAll().then((res) => res.data),
  });

  const { data: operations } = useQuery({
    queryKey: ['operations'],
    queryFn: () => generatorApi.getOperations().then((res) => res.data),
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

  const openFieldConfig = (fieldKey: string) => {
    setSelectedFieldKey(fieldKey);
    setIsConfigSheetOpen(true);
  };

  const updateFieldConfig = (key: string, updates: Partial<FieldConfigState>) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const getOperationBadge = (operation: string) => {
    const badges: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      Random: { variant: 'secondary', label: 'Aleatorio' },
      Replace: { variant: 'default', label: 'Fijo' },
      ForceNull: { variant: 'destructive', label: 'NULL' },
      NotChange: { variant: 'outline', label: 'Original' },
      RandomRange: { variant: 'default', label: 'Rango' },
      RotateList: { variant: 'default', label: 'Lista' },
    };
    return badges[operation] || { variant: 'secondary', label: operation };
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      String: 'bg-green-500/10 text-green-600',
      Integer: 'bg-blue-500/10 text-blue-600',
      Float: 'bg-blue-500/10 text-blue-600',
      Boolean: 'bg-purple-500/10 text-purple-600',
      Date: 'bg-orange-500/10 text-orange-600',
      Guid: 'bg-cyan-500/10 text-cyan-600',
      Null: 'bg-gray-500/10 text-gray-600',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-600';
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

  const selectedFieldConfig = selectedFieldKey ? fieldConfigs[selectedFieldKey] : null;
  const availableOps = selectedFieldConfig && operations
    ? operations.typeOperations[selectedFieldConfig.originalType] || operations.operations.map((o) => o.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generador JSON</h2>
          <p className="text-muted-foreground">
            Genera múltiples variaciones de JSON para testing
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel izquierdo: JSON Base */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">JSON Base</CardTitle>
                <div className="flex gap-2">
                  <Select
                    value={selectedTemplateId?.toString() || '_none'}
                    onValueChange={(v) => setSelectedTemplateId(v === '_none' ? null : parseInt(v))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Cargar template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin template</SelectItem>
                      {templates?.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 border rounded-md overflow-hidden">
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
            </CardContent>
          </Card>

          {/* Campos del JSON */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Campos Detectados</CardTitle>
                  <CardDescription>
                    {fields.length} campos • {getConfiguredFieldsCount()} configurados
                  </CardDescription>
                </div>
                {getConfiguredFieldsCount() > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
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
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead className="w-20">Tipo</TableHead>
                      <TableHead className="w-24">Mutación</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => {
                      const config = fieldConfigs[field.key];
                      const badge = config ? getOperationBadge(config.operation) : null;
                      return (
                        <TableRow key={field.key} className="cursor-pointer hover:bg-accent/50" onClick={() => openFieldConfig(field.key)}>
                          <TableCell className="font-mono text-xs">
                            {field.key}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeBadge(field.type)}`}>
                              {field.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {badge && (
                              <Badge variant={badge.variant} className="text-[10px]">
                                {badge.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Settings2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {fields.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Ingresa un JSON válido para ver los campos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho: Configuración y Resultados */}
        <div className="space-y-4">
          {/* Configuración de generación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Preset</label>
                  <Select value={selectedPreset || '_none'} onValueChange={(v) => setSelectedPreset(v === '_none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin preset (aleatorio)</SelectItem>
                      {presets?.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Cantidad</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Formato de salida</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={outputFormat === 'Preview' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setOutputFormat('Preview')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant={outputFormat === 'SingleFile' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setOutputFormat('SingleFile')}
                  >
                    <FileJson className="w-4 h-4 mr-2" />
                    Archivo
                  </Button>
                  <Button
                    variant={outputFormat === 'Database' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => setOutputFormat('Database')}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Base datos
                  </Button>
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
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Resultados</CardTitle>
                  <CardDescription>
                    {generatedJsons.length > 0 
                      ? `${generatedJsons.length} JSON${generatedJsons.length > 1 ? 's' : ''} generado${generatedJsons.length > 1 ? 's' : ''}`
                      : 'Sin resultados'}
                  </CardDescription>
                </div>
                {generatedJsons.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadGeneratedJsons}>
                    <Download className="w-4 h-4 mr-1" />
                    Descargar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedJsons.length > 0 ? (
                <Tabs defaultValue="single" className="h-full">
                  <TabsList className="mb-2">
                    <TabsTrigger value="single">Individual</TabsTrigger>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                  </TabsList>
                  <TabsContent value="single" className="h-[280px]">
                    {generatedJsons.length > 1 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">JSON:</span>
                        <Select
                          value={selectedGeneratedIndex.toString()}
                          onValueChange={(v) => setSelectedGeneratedIndex(parseInt(v))}
                        >
                          <SelectTrigger className="w-24 h-8">
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
                    <div className="h-[240px] border rounded-md overflow-hidden">
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
                  </TabsContent>
                  <TabsContent value="all" className="h-[280px]">
                    <div className="h-full border rounded-md overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={JSON.stringify(
                          generatedJsons.map((j) => {
                            try { return JSON.parse(j); } catch { return j; }
                          }),
                          null,
                          2
                        )}
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
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-[280px] flex items-center justify-center border rounded-md bg-secondary/30">
                  <p className="text-sm text-muted-foreground">
                    Los JSONs generados aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sheet de configuración de campo */}
      <Sheet open={isConfigSheetOpen} onOpenChange={setIsConfigSheetOpen}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle className="font-mono text-sm">
              {selectedFieldKey}
            </SheetTitle>
            <SheetDescription>
              Configura cómo mutará este campo
            </SheetDescription>
          </SheetHeader>

          {selectedFieldConfig && (
            <div className="mt-6 space-y-6">
              <div>
                <label className="text-sm font-medium">Tipo original</label>
                <div className="mt-1">
                  <Badge className={getTypeBadge(selectedFieldConfig.originalType)}>
                    {selectedFieldConfig.originalType}
                  </Badge>
                  <span className="ml-2 text-sm text-muted-foreground">
                    = {String(selectedFieldConfig.originalValue)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Operación</label>
                <Select
                  value={selectedFieldConfig.operation}
                  onValueChange={(v) => updateFieldConfig(selectedFieldKey!, { 
                    operation: v as FieldConfig['operation'],
                    value: undefined,
                    minValue: undefined,
                    maxValue: undefined,
                    listValues: undefined,
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operations?.operations
                      .filter((op) => availableOps.includes(op.id))
                      .map((op) => (
                        <SelectItem key={op.id} value={op.id}>
                          <div>
                            <span>{op.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              - {op.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos según operación */}
              {selectedFieldConfig.operation === 'Replace' && (
                <div>
                  <label className="text-sm font-medium">Valor fijo</label>
                  <Input
                    className="mt-1"
                    value={String(selectedFieldConfig.value || '')}
                    onChange={(e) => {
                      let val: unknown = e.target.value;
                      // Convertir según tipo
                      if (selectedFieldConfig.originalType === 'Integer') {
                        val = parseInt(e.target.value) || 0;
                      } else if (selectedFieldConfig.originalType === 'Float') {
                        val = parseFloat(e.target.value) || 0;
                      } else if (selectedFieldConfig.originalType === 'Boolean') {
                        val = e.target.value.toLowerCase() === 'true';
                      }
                      updateFieldConfig(selectedFieldKey!, { value: val });
                    }}
                    placeholder={`Ej: ${selectedFieldConfig.originalValue}`}
                  />
                </div>
              )}

              {selectedFieldConfig.operation === 'RandomRange' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Mínimo</label>
                    <Input
                      className="mt-1"
                      type={selectedFieldConfig.originalType === 'Date' ? 'date' : 'number'}
                      value={String(selectedFieldConfig.minValue || '')}
                      onChange={(e) => updateFieldConfig(selectedFieldKey!, { 
                        minValue: selectedFieldConfig.originalType === 'Date' 
                          ? e.target.value 
                          : parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Máximo</label>
                    <Input
                      className="mt-1"
                      type={selectedFieldConfig.originalType === 'Date' ? 'date' : 'number'}
                      value={String(selectedFieldConfig.maxValue || '')}
                      onChange={(e) => updateFieldConfig(selectedFieldKey!, { 
                        maxValue: selectedFieldConfig.originalType === 'Date' 
                          ? e.target.value 
                          : parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              )}

              {selectedFieldConfig.operation === 'RotateList' && (
                <div>
                  <label className="text-sm font-medium">Valores (separados por coma)</label>
                  <Input
                    className="mt-1"
                    value={(selectedFieldConfig.listValues || []).join(', ')}
                    onChange={(e) => {
                      const values = e.target.value.split(',').map((v) => {
                        const trimmed = v.trim();
                        if (selectedFieldConfig.originalType === 'Integer') return parseInt(trimmed) || 0;
                        if (selectedFieldConfig.originalType === 'Float') return parseFloat(trimmed) || 0;
                        if (selectedFieldConfig.originalType === 'Boolean') return trimmed.toLowerCase() === 'true';
                        return trimmed;
                      });
                      updateFieldConfig(selectedFieldKey!, { listValues: values });
                    }}
                    placeholder="valor1, valor2, valor3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Los valores rotarán en cada JSON generado
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  onClick={() => setIsConfigSheetOpen(false)}
                >
                  Aplicar configuración
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
