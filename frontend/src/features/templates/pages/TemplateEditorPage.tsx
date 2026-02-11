import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { templatesApi } from '../api/templates.api';
import { AlertCircle } from 'lucide-react';

interface JsonTreeNodeProps {
  data: unknown;
  name?: string;
  level?: number;
}

function JsonTreeNode({ data, name, level = 0 }: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  
  const getTypeColor = (value: unknown): string => {
    if (value === null) return 'text-gray-500';
    if (typeof value === 'string') return 'text-green-600 dark:text-green-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    return 'text-foreground';
  };

  const getTypeBadge = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const isExpandable = typeof data === 'object' && data !== null;
  const paddingLeft = level * 16;

  if (!isExpandable) {
    return (
      <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft }}>
        {name && <span className="text-muted-foreground">{name}:</span>}
        <span className={getTypeColor(data)}>
          {data === null ? 'null' : typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {getTypeBadge(data)}
        </Badge>
      </div>
    );
  }

  const entries = Array.isArray(data) 
    ? data.map((item, index) => [index, item] as [number, unknown])
    : Object.entries(data);

  return (
    <div style={{ paddingLeft: level > 0 ? paddingLeft : 0 }}>
      <div 
        className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-accent rounded"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-xs w-4">{isExpanded ? '\u25BC' : '\u25B6'}</span>
        {name && <span className="text-muted-foreground">{name}:</span>}
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {getTypeBadge(data)}
        </Badge>
        {!isExpanded && (
          <span className="text-xs text-muted-foreground">
            {Array.isArray(data) ? `[${data.length} items]` : `{${Object.keys(data).length} keys}`}
          </span>
        )}
      </div>
      {isExpanded && (
        <div className="border-l border-border ml-2">
          {entries.map(([key, value]) => (
            <JsonTreeNode 
              key={String(key)} 
              data={value} 
              name={String(key)} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = Boolean(id);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jsonContent, setJsonContent] = useState('{\n  \n}');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedJson, setParsedJson] = useState<unknown>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getById(Number(id)).then((res) => res.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      try {
        const formatted = JSON.stringify(JSON.parse(template.content), null, 2);
        setJsonContent(formatted);
      } catch {
        setJsonContent(template.content);
      }
    }
  }, [template]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonContent);
      setParsedJson(parsed);
      setParseError(null);
    } catch (e) {
      setParsedJson(null);
      setParseError(e instanceof Error ? e.message : 'JSON invalido');
    }
  }, [jsonContent]);

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template creado correctamente');
      navigate('/templates');
    },
    onError: () => toast.error('Error al crear el template'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string; content: string } }) =>
      templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template actualizado correctamente');
      navigate('/templates');
    },
    onError: () => toast.error('Error al actualizar el template'),
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (parseError) {
      toast.error('El JSON no es valido');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      content: jsonContent,
    };

    if (isEditing && id) {
      updateMutation.mutate({ id: Number(id), data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        setJsonContent(JSON.stringify(parsed, null, 2));
        if (!name) setName(file.name.replace(/\.json$/i, ''));
      } catch {
        setJsonContent(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed, null, 2));
    } catch { /* JSON invalido */ }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsed));
    } catch { /* JSON invalido */ }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Templates', href: '/templates' },
        { label: isEditing ? 'Editar' : 'Nuevo' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Template' : 'Nuevo Template'}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica el template JSON' : 'Crea un nuevo template JSON'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/templates')}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || !!parseError}
          >
            {createMutation.isPending || updateMutation.isPending 
              ? 'Guardando...' 
              : isEditing ? 'Guardar Cambios' : 'Crear Template'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del template" />
        </div>
        <div>
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion opcional" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-[calc(100vh-320px)]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Editor JSON</CardTitle>
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Cargar archivo</Button>
                <Button variant="outline" size="sm" onClick={formatJson}>Formatear</Button>
                <Button variant="outline" size="sm" onClick={minifyJson}>Minificar</Button>
              </div>
            </div>
            {parseError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="h-[calc(100%-80px)]">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonContent}
              onChange={(value) => setJsonContent(value || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, formatOnPaste: true, tabSize: 2, wordWrap: 'on' }}
            />
          </CardContent>
        </Card>

        <Card className="h-[calc(100vh-320px)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vista de Arbol</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-60px)] overflow-auto">
            <Tabs defaultValue="tree" className="h-full">
              <TabsList>
                <TabsTrigger value="tree">Arbol</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="tree" className="h-[calc(100%-40px)] overflow-auto mt-2">
                {parsedJson ? (
                  <div className="font-mono text-sm"><JsonTreeNode data={parsedJson} /></div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {parseError ? 'JSON invalido' : 'Escribe JSON valido para ver el arbol'}
                  </p>
                )}
              </TabsContent>
              <TabsContent value="preview" className="h-[calc(100%-40px)] overflow-auto mt-2">
                {parsedJson ? (
                  <pre className="bg-secondary p-4 rounded text-sm overflow-auto h-full">
                    {JSON.stringify(parsedJson, null, 2)}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-sm">JSON invalido</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
