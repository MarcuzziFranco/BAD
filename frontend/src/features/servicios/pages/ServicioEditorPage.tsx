import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { configsApi } from '../api/servicios.api';
import { templatesApi } from '@/features/templates/api/templates.api';
import type { ParsedCurl } from '@/shared/types/api.types';
import {
  ArrowLeft, Save, Terminal, Settings2, Globe, Key, FileJson,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
type InputMode = 'manual' | 'curl';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES = ['None', 'Bearer', 'Basic', 'ApiKey'];

export function ServicioEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [inputMode, setInputMode] = useState<InputMode>('manual');

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: '',
    authType: 'None',
    authValue: '',
    jsonTemplateId: null as number | null,
  });

  const [curlCommand, setCurlCommand] = useState('');
  const [parsedCurl, setParsedCurl] = useState<ParsedCurl | null>(null);
  const [curlError, setCurlError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['config', id],
    queryFn: () => configsApi.getById(Number(id)).then((res) => res.data),
    enabled: isEditMode,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const templateOptions = useMemo(() => {
    const list = templates ?? [];
    const group = existingConfig?.sourceGroup;
    if (!group) return list;
    const same = list.filter((t) => t.sourceGroup === group);
    return same.length > 0 ? same : list;
  }, [templates, existingConfig?.sourceGroup]);

  useEffect(() => {
    if (existingConfig) {
      setFormData({
        name: existingConfig.name,
        url: existingConfig.url,
        method: existingConfig.method,
        headers: existingConfig.headers || '',
        authType: existingConfig.authType || 'None',
        authValue: existingConfig.authValue || '',
        jsonTemplateId: existingConfig.jsonTemplateId,
      });
    }
  }, [existingConfig]);

  const createMutation = useMutation({
    mutationFn: configsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Servicio creado correctamente');
      navigate('/servicios');
    },
    onError: () => toast.error('Error al crear el servicio'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      configsApi.update(id, data as Parameters<typeof configsApi.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Servicio actualizado correctamente');
      navigate('/servicios');
    },
    onError: () => toast.error('Error al actualizar el servicio'),
  });

  const createFromCurlMutation = useMutation({
    mutationFn: configsApi.createFromCurl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Servicio creado desde cURL correctamente');
      navigate('/servicios');
    },
    onError: () => toast.error('Error al crear servicio desde cURL'),
  });

  const handleParseCurl = async () => {
    if (!curlCommand.trim()) return;

    setIsParsing(true);
    setCurlError(null);
    setParsedCurl(null);

    try {
      const response = await configsApi.parseCurl(curlCommand);
      setParsedCurl(response.data);

      if (!formData.name) {
        try {
          const url = new URL(response.data.url);
          setFormData((prev) => ({ ...prev, name: `${response.data.method} ${url.pathname}` }));
        } catch {
          setFormData((prev) => ({ ...prev, name: 'Config desde cURL' }));
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setCurlError(err.response?.data?.error || 'Error al parsear el comando cURL');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = () => {
    if (inputMode === 'curl' && parsedCurl && !isEditMode) {
      createFromCurlMutation.mutate({
        curlCommand,
        name: formData.name || undefined,
        jsonTemplateId: formData.jsonTemplateId || undefined,
      });
    } else {
      const data = {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        headers: formData.headers || null,
        authType: formData.authType,
        authValue: formData.authValue || null,
        jsonTemplateId: formData.jsonTemplateId,
      };

      if (isEditMode) {
        updateMutation.mutate({ id: Number(id), data });
      } else {
        createMutation.mutate(data);
      }
    }
  };

  const isFormValid = inputMode === 'curl' ? parsedCurl !== null : formData.name && formData.url;
  const isSaving = createMutation.isPending || updateMutation.isPending || createFromCurlMutation.isPending;

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500/10 text-green-600',
      POST: 'bg-blue-500/10 text-blue-600',
      PUT: 'bg-yellow-500/10 text-yellow-600',
      PATCH: 'bg-orange-500/10 text-orange-600',
      DELETE: 'bg-red-500/10 text-red-600',
    };
    return colors[method] || 'bg-gray-500/10 text-gray-600';
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <PageBreadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Servicios', href: '/servicios' },
        { label: isEditMode ? 'Editar' : 'Nuevo' },
      ]} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/servicios')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Modifica la configuracion del endpoint' : 'Configura un nuevo endpoint para testing'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
          {isSaving ? (
            <><Spinner className="w-4 h-4 mr-2" /> Guardando...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> {isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}</>
          )}
        </Button>
      </div>

      <Card className="flex-1 overflow-auto">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Configuracion del Endpoint</CardTitle>
            {!isEditMode && (
              <div className="flex items-center gap-2 p-1 bg-background rounded-lg border">
                <Button variant={inputMode === 'manual' ? 'default' : 'ghost'} size="sm" onClick={() => setInputMode('manual')}>
                  <Settings2 className="w-4 h-4 mr-2" /> Manual
                </Button>
                <Button variant={inputMode === 'curl' ? 'default' : 'ghost'} size="sm" onClick={() => setInputMode('curl')}>
                  <Terminal className="w-4 h-4 mr-2" /> Desde cURL
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {inputMode === 'curl' && !isEditMode ? (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label className="text-base font-medium">Comando cURL</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Pega un comando cURL y se extraeran automaticamente los datos
                </p>
                <Textarea
                  value={curlCommand}
                  onChange={(e) => { setCurlCommand(e.target.value); setParsedCurl(null); setCurlError(null); }}
                  placeholder={`curl -X POST 'https://api.example.com/endpoint' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"key": "value"}'`}
                  className="font-mono text-sm h-40"
                />
              </div>

              <Button onClick={handleParseCurl} disabled={!curlCommand.trim() || isParsing} className="w-full" size="lg">
                {isParsing ? (
                  <><Spinner className="w-4 h-4 mr-2" /> Analizando...</>
                ) : (
                  <><Terminal className="w-4 h-4 mr-2" /> Analizar cURL</>
                )}
              </Button>

              {curlError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error al analizar</AlertTitle>
                  <AlertDescription>{curlError}</AlertDescription>
                </Alert>
              )}

              {parsedCurl && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>cURL analizado correctamente</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getMethodBadge(parsedCurl.method)}`}>
                          {parsedCurl.method}
                        </span>
                        <span className="font-mono text-sm truncate flex-1">{parsedCurl.url}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {parsedCurl.authType && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Key className="w-4 h-4" /> Auth: {parsedCurl.authType}
                          </div>
                        )}
                        {parsedCurl.headers && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="w-4 h-4" /> Headers detectados
                          </div>
                        )}
                        {parsedCurl.body && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileJson className="w-4 h-4" /> Body detectado
                          </div>
                        )}
                      </div>
                      {parsedCurl.warnings.length > 0 && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {parsedCurl.warnings.map((w, i) => <p key={i}>{w}</p>)}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {parsedCurl && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label>Nombre del servicio (opcional)</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Se generara automaticamente si no se especifica" />
                  </div>
                  <div>
                    <Label>Template JSON asociado (opcional)</Label>
                    <Select value={formData.jsonTemplateId?.toString() || '_none'} onValueChange={(v) => setFormData({ ...formData, jsonTemplateId: v === '_none' ? null : parseInt(v) })}>
                      <SelectTrigger><SelectValue placeholder="Sin template" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Sin template</SelectItem>
                        {templateOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            [{t.sourceGroup}] {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label className="text-base">Nombre *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre descriptivo del servicio" className="mt-1" />
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4">
                <div>
                  <Label className="text-base">Metodo</Label>
                  <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base">URL *</Label>
                  <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://api.example.com/endpoint" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-base">Headers (JSON)</Label>
                <Textarea value={formData.headers} onChange={(e) => setFormData({ ...formData, headers: e.target.value })} placeholder='{"Content-Type": "application/json"}' className="font-mono text-sm h-24 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Autenticacion</Label>
                  <Select value={formData.authType} onValueChange={(v) => setFormData({ ...formData, authType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {formData.authType !== 'None' && (
                  <div>
                    <Label className="text-base">Valor de autenticacion</Label>
                    <Input value={formData.authValue} onChange={(e) => setFormData({ ...formData, authValue: e.target.value })} placeholder={formData.authType === 'Basic' ? 'user:password' : 'token'} type={formData.authType === 'Bearer' ? 'password' : 'text'} className="mt-1" />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base">Template JSON asociado</Label>
                <Select value={formData.jsonTemplateId?.toString() || '_none'} onValueChange={(v) => setFormData({ ...formData, jsonTemplateId: v === '_none' ? null : parseInt(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sin template" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin template</SelectItem>
                    {templates?.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Asocia un template para el body.{' '}
                  {formData.jsonTemplateId != null && (
                    <Link
                      to={`/template-edit/${formData.jsonTemplateId}`}
                      className="text-primary hover:underline"
                    >
                      Ver template #{formData.jsonTemplateId}
                    </Link>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
