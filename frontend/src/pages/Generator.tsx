import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { presetsApi, generatorApi, templatesApi } from '@/services/api';

export function Generator() {
  const [jsonInput, setJsonInput] = useState('');
  const [count, setCount] = useState(5);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [generatedJsons, setGeneratedJsons] = useState<string[]>([]);

  const { data: presets } = useQuery({
    queryKey: ['presets-grouped'],
    queryFn: () => presetsApi.getGrouped().then((res) => res.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const generateMutation = useMutation({
    mutationFn: generatorApi.generate,
    onSuccess: (response) => {
      setGeneratedJsons(response.data.generatedJsons);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (content: string) => generatorApi.analyze(content),
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      jsonContent: jsonInput,
      count,
      presetName: selectedPreset || undefined,
    });
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate(jsonInput);
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id.toString() === templateId);
    if (template) {
      setJsonInput(template.content);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {
      // JSON inválido, no hacer nada
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generador</h2>
        <p className="text-muted-foreground">
          Genera variaciones de JSON usando presets de mutación
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>JSON Base</CardTitle>
            <CardDescription>
              Ingresa el JSON que servirá como plantilla
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select onValueChange={handleLoadTemplate}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Cargar template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={formatJson}>
                Formatear
              </Button>
            </div>

            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"name": "John", "age": 30}'
              rows={15}
              className="font-mono text-sm"
            />

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Preset de Mutación</label>
                <Select 
                  value={selectedPreset || "_none"} 
                  onValueChange={(v) => setSelectedPreset(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin preset (aleatorio)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin preset (aleatorio)</SelectItem>
                    {presets?.map((category) => (
                      <div key={category.category}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          {category.category}
                        </div>
                        {category.presets.map((preset) => (
                          <SelectItem key={preset.name} value={preset.name}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <label className="text-sm font-medium">Cantidad</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!jsonInput || generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generando...' : 'Generar JSONs'}
              </Button>
              <Button
                variant="outline"
                onClick={handleAnalyze}
                disabled={!jsonInput || analyzeMutation.isPending}
              >
                Analizar Estructura
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              {generatedJsons.length > 0
                ? `${generatedJsons.length} JSONs generados`
                : 'Los JSONs generados aparecerán aquí'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyzeMutation.data && (
              <div className="mb-4 p-4 bg-secondary rounded-lg">
                <h4 className="font-medium mb-2">Estructura del JSON:</h4>
                <div className="space-y-1">
                  {analyzeMutation.data.data.fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-2 text-sm">
                      <code className="bg-background px-1 rounded">{field.key}</code>
                      <Badge variant="outline">{field.type}</Badge>
                      <span className="text-muted-foreground truncate">
                        {String(field.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedJsons.length > 0 && (
              <Tabs defaultValue="0">
                <TabsList className="flex-wrap">
                  {generatedJsons.map((_, i) => (
                    <TabsTrigger key={i} value={i.toString()}>
                      JSON #{i + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {generatedJsons.map((json, i) => (
                  <TabsContent key={i} value={i.toString()}>
                    <pre className="bg-secondary p-4 rounded-lg overflow-auto max-h-96 text-sm">
                      {JSON.stringify(JSON.parse(json), null, 2)}
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
