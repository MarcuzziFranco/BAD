import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { configsApi, templatesApi } from '@/services/api';
import type { ParsedCurl } from '@/services/api';
import {
  ArrowLeft,
  Save,
  Terminal,
  Settings2,
  Globe,
  Key,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type InputMode = 'manual' | 'curl';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const AUTH_TYPES = ['None', 'Bearer', 'Basic', 'ApiKey'];

export function ServicioTEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Estado de UI
  const [inputMode, setInputMode] = useState<InputMode>('manual');

  // Estado del formulario manual
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: '',
    authType: 'None',
    authValue: '',
    jsonTemplateId: null as number | null,
  });

  // Estado del cURL
  const [curlCommand, setCurlCommand] = useState('');
  const [parsedCurl, setParsedCurl] = useState<ParsedCurl | null>(null);
  const [curlError, setCurlError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Cargar config existente si es edición
  const { data: existingConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['config', id],
    queryFn: () => configsApi.getById(Number(id)).then((res) => res.data),
    enabled: isEditMode,
  });

  // Cargar templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  // Llenar formulario cuando se carga config existente
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: configsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      navigate('/servicios');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      configsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      navigate('/servicios');
    },
  });

  const createFromCurlMutation = useMutation({
    mutationFn: configsApi.createFromCurl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      navigate('/servicios');
    },
  });

  const handleParseCurl = async () => {
    if (!curlCommand.trim()) return;

    setIsParsing(true);
    setCurlError(null);
    setParsedCurl(null);

    try {
      const response = await configsApi.parseCurl(curlCommand);
      setParsedCurl(response.data);

      // Auto-llenar el nombre si está vacío
      if (!formData.name) {
        try {
          const url = new URL(response.data.url);
          setFormData((prev) => ({
            ...prev,
            name: `${response.data.method} ${url.pathname}`,
          }));
        } catch {
          setFormData((prev) => ({ ...prev, name: 'Config desde cURL' }));
        }
      }
    } catch (error: any) {
      setCurlError(
        error.response?.data?.error || 'Error al parsear el comando cURL'
      );
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

  const isFormValid =
    inputMode === 'curl' ? parsedCurl !== null : formData.name && formData.url;

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    createFromCurlMutation.isPending;

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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
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
              {isEditMode
                ? 'Modifica la configuración del endpoint'
                : 'Configura un nuevo endpoint para testing'}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}
            </>
          )}
        </Button>
      </div>

      {/* Contenido principal */}
      <Card className="flex-1 overflow-auto">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Configuración del Endpoint</CardTitle>
            {/* Selector de modo (solo para nuevo) */}
            {!isEditMode && (
              <div className="flex items-center gap-2 p-1 bg-background rounded-lg border">
                <Button
                  variant={inputMode === 'manual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('manual')}
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  variant={inputMode === 'curl' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('curl')}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Desde cURL
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {inputMode === 'curl' && !isEditMode ? (
            /* Modo cURL */
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label className="text-base font-medium">Comando cURL</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Pega un comando cURL y se extraerán automáticamente los datos
                </p>
                <Textarea
                  value={curlCommand}
                  onChange={(e) => {
                    setCurlCommand(e.target.value);
                    setParsedCurl(null);
                    setCurlError(null);
                  }}
                  placeholder={`curl -X POST 'https://api.example.com/endpoint' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token123' \\
  -d '{"key": "value"}'`}
                  className="font-mono text-sm h-40"
                />
              </div>

              <Button
                onClick={handleParseCurl}
                disabled={!curlCommand.trim() || isParsing}
                className="w-full"
                size="lg"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4 mr-2" /> Analizar cURL
                  </>
                )}
              </Button>

              {curlError && (
                <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Error al analizar</p>
                    <p className="text-sm">{curlError}</p>
                  </div>
                </div>
              )}

              {parsedCurl && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">cURL analizado correctamente</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${getMethodBadge(
                          parsedCurl.method
                        )}`}
                      >
                        {parsedCurl.method}
                      </span>
                      <span className="font-mono text-sm truncate flex-1">
                        {parsedCurl.url}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {parsedCurl.authType && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Key className="w-4 h-4" />
                          <span>Auth: {parsedCurl.authType}</span>
                        </div>
                      )}

                      {parsedCurl.headers && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span>Headers detectados</span>
                        </div>
                      )}

                      {parsedCurl.body && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileJson className="w-4 h-4" />
                          <span>Body detectado</span>
                        </div>
                      )}
                    </div>

                    {parsedCurl.warnings.length > 0 && (
                      <div className="p-3 rounded bg-yellow-500/10 text-yellow-700 text-sm">
                        {parsedCurl.warnings.map((w, i) => (
                          <p key={i}>⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campos adicionales para cURL */}
              {parsedCurl && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label>Nombre del servicio (opcional)</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Se generará automáticamente si no se especifica"
                    />
                  </div>

                  <div>
                    <Label>Template JSON asociado (opcional)</Label>
                    <Select
                      value={formData.jsonTemplateId?.toString() || '_none'}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          jsonTemplateId: v === '_none' ? null : parseInt(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin template" />
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
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Modo manual */
            <div className="space-y-6 max-w-2xl">
              <div>
                <Label className="text-base">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre descriptivo del servicio"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4">
                <div>
                  <Label className="text-base">Método</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(v) => setFormData({ ...formData, method: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base">URL *</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://api.example.com/endpoint"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base">Headers (JSON)</Label>
                <Textarea
                  value={formData.headers}
                  onChange={(e) =>
                    setFormData({ ...formData, headers: e.target.value })
                  }
                  placeholder='{"Content-Type": "application/json", "X-Custom-Header": "value"}'
                  className="font-mono text-sm h-24 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Autenticación</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, authType: v })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.authType !== 'None' && (
                  <div>
                    <Label className="text-base">Valor de autenticación</Label>
                    <Input
                      value={formData.authValue}
                      onChange={(e) =>
                        setFormData({ ...formData, authValue: e.target.value })
                      }
                      placeholder={
                        formData.authType === 'Basic' ? 'user:password' : 'token'
                      }
                      type={formData.authType === 'Bearer' ? 'password' : 'text'}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base">Template JSON asociado</Label>
                <Select
                  value={formData.jsonTemplateId?.toString() || '_none'}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      jsonTemplateId: v === '_none' ? null : parseInt(v),
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sin template" />
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
                <p className="text-xs text-muted-foreground mt-1">
                  Asocia un template para usar como body en las peticiones
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
