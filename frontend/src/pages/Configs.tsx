import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { configsApi, templatesApi, type RequestConfig } from '@/services/api';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const AUTH_TYPES = ['None', 'Bearer', 'Basic'];

export function Configs() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    headers: '',
    authType: 'None',
    authValue: '',
    jsonTemplateId: null as number | null,
  });

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((res) => res.data),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: configsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      handleCancel();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) =>
      configsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      handleCancel();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: configsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
    },
  });

  const handleEdit = (config: RequestConfig) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      url: config.url,
      method: config.method,
      headers: config.headers || '',
      authType: config.authType,
      authValue: config.authValue || '',
      jsonTemplateId: config.jsonTemplateId,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      headers: '',
      authType: 'None',
      authValue: '',
      jsonTemplateId: null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuraciones</h2>
          <p className="text-muted-foreground">
            Configura tus endpoints para testing
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>Nueva Configuración</Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Configuración' : 'Nueva Configuración'}
            </CardTitle>
            <CardDescription>
              Configura los detalles del endpoint a testear
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Mi API"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Template JSON</label>
                  <Select
                    value={formData.jsonTemplateId?.toString() || ''}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        jsonTemplateId: v ? parseInt(v) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium">Método</label>
                  <Select
                    value={formData.method}
                    onValueChange={(v) => setFormData({ ...formData, method: v })}
                  >
                    <SelectTrigger>
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
                <div className="md:col-span-3">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://api.example.com/endpoint"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Tipo de Autenticación</label>
                  <Select
                    value={formData.authType}
                    onValueChange={(v) =>
                      setFormData({ ...formData, authType: v })
                    }
                  >
                    <SelectTrigger>
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
                    <label className="text-sm font-medium">
                      {formData.authType === 'Bearer' ? 'Token' : 'Credenciales'}
                    </label>
                    <Input
                      value={formData.authValue}
                      onChange={(e) =>
                        setFormData({ ...formData, authValue: e.target.value })
                      }
                      placeholder={
                        formData.authType === 'Bearer'
                          ? 'Bearer token'
                          : 'usuario:password'
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Headers (JSON)</label>
                <Textarea
                  value={formData.headers}
                  onChange={(e) =>
                    setFormData({ ...formData, headers: e.target.value })
                  }
                  placeholder='{"X-Custom-Header": "value"}'
                  rows={3}
                  className="font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Guardar Cambios' : 'Crear Configuración'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuraciones Guardadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : configs && configs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{config.method}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {config.url}
                    </TableCell>
                    <TableCell>{config.authType}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(config.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              No hay configuraciones guardadas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
