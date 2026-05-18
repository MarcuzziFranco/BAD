import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { templatesApi } from '../api/templates.api';
import { configsApi } from '@/features/servicios/api/servicios.api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plug } from 'lucide-react';
import { JsonTreeView } from '@/shared/components/json/JsonPathPicker';

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
  const [linkRequestConfigId, setLinkRequestConfigId] = useState<number | null>(null);

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getById(Number(id)).then((res) => res.data),
    enabled: isEditing,
  });

  const { data: services } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((r) => r.data),
  });

  const serviceOptions = useMemo(() => {
    const list = services ?? [];
    if (!template?.sourceGroup) return list;
    const sameGroup = list.filter((s) => s.sourceGroup === template.sourceGroup);
    return sameGroup.length > 0 ? sameGroup : list;
  }, [services, template?.sourceGroup]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setLinkRequestConfigId(template.linkedServices?.[0]?.id ?? null);
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
      linkRequestConfigId: linkRequestConfigId ?? undefined,
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="w-4 h-4" />
            Vinculo con servicio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            El body del servicio usa este template. En importaciones OpenAPI el vinculo se crea al aplicar.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 max-w-xl">
          <div>
            <label className="text-sm font-medium">Servicio asociado (opcional)</label>
            <Select
              value={linkRequestConfigId != null ? String(linkRequestConfigId) : '_none'}
              onValueChange={(v) =>
                setLinkRequestConfigId(v === '_none' ? null : parseInt(v, 10))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sin servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin servicio</SelectItem>
                {serviceOptions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    [{s.sourceGroup}] {s.method} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {template?.linkedServices && template.linkedServices.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-1">
              <span className="font-medium text-foreground">Servicios vinculados:</span>
              <ul className="list-disc pl-4">
                {template.linkedServices.map((s) => (
                  <li key={s.id}>
                    <Link to={`/servicios-edit/${s.id}`} className="text-primary hover:underline">
                      #{s.id} {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <JsonTreeView json={jsonContent} />
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
