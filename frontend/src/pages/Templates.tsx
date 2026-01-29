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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { templatesApi, type JsonTemplate } from '@/services/api';

export function Templates() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', content: '' });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreating(false);
      setFormData({ name: '', description: '', content: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) =>
      templatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingId(null);
      setFormData({ name: '', description: '', content: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleEdit = (template: JsonTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
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
    setFormData({ name: '', description: '', content: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates JSON</h2>
          <p className="text-muted-foreground">
            Gestiona tus plantillas JSON para generación
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)}>Nuevo Template</Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Template' : 'Nuevo Template'}
            </CardTitle>
            <CardDescription>
              {editingId
                ? 'Modifica los datos del template'
                : 'Crea un nuevo template JSON'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nombre del template"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción opcional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contenido JSON</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder='{"key": "value"}'
                  rows={10}
                  className="font-mono"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Guardar Cambios' : 'Crear Template'}
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
          <CardTitle>Templates Guardados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando...</p>
          ) : templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.description || '-'}</TableCell>
                    <TableCell>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(template.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No hay templates guardados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
