import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { configsApi } from '../api/servicios.api';
import {
  Plus, Pencil, Trash2, Key, FileJson, Settings2, Search,
} from 'lucide-react';

export function ServiciosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: configsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Servicio eliminado correctamente');
    },
    onError: () => toast.error('Error al eliminar el servicio'),
  });

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

  const filteredConfigs = configs?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <PageBreadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Servicios' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Servicios de Test</h2>
          <p className="text-sm text-muted-foreground">Configura endpoints para ejecutar tests</p>
        </div>
        <Button onClick={() => navigate('/servicios-new')}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Servicio
        </Button>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <CardContent className="flex-1 p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Metodo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="w-24">Auth</TableHead>
                <TableHead className="w-24">Template</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : filteredConfigs && filteredConfigs.length > 0 ? (
                filteredConfigs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getMethodBadge(config.method)}`}>
                        {config.method}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[300px] truncate">
                      {config.url}
                    </TableCell>
                    <TableCell>
                      {config.authType && config.authType !== 'None' ? (
                        <Badge variant="outline" className="text-xs">
                          <Key className="w-3 h-3 mr-1" /> {config.authType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {config.jsonTemplateId ? (
                        <Badge variant="secondary" className="text-xs">
                          <FileJson className="w-3 h-3 mr-1" /> #{config.jsonTemplateId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/servicios-edit/${config.id}`)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar servicio</AlertDialogTitle>
                              <AlertDialogDescription>
                                Estas seguro de eliminar "{config.name}"? Esta accion no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(config.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Settings2 /></EmptyMedia>
                        <EmptyTitle>{searchTerm ? 'Sin resultados' : 'Sin servicios'}</EmptyTitle>
                        <EmptyDescription>
                          {searchTerm ? 'No se encontraron resultados' : 'No hay servicios configurados'}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
