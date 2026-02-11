import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { executionsApi } from '../api/executions.api';
import {
  Plus, Eye, Trash2, Search, CheckCircle2, XCircle, Clock, PlayCircle,
  Ban, Rocket, RefreshCw,
} from 'lucide-react';

export function ExecutionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionsApi.getAll().then((res) => res.data),
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: executionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      toast.success('Ejecucion eliminada correctamente');
    },
    onError: () => toast.error('Error al eliminar la ejecucion'),
  });

  const handleRerun = (id: number) => {
    navigate(`/executions/new?rerun=${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-600"><PlayCircle className="w-3 h-3 mr-1 animate-pulse" />Ejecutando</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'cancelled':
        return <Badge className="bg-yellow-500/10 text-yellow-600"><Ban className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500/10 text-gray-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSuccessRate = (success: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((success / total) * 100);
  };

  const filteredExecutions = executions?.filter((e) => {
    const matchesSearch =
      e.requestConfigName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.presetUsed?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <PageBreadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Ejecuciones' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ejecuciones</h2>
          <p className="text-sm text-muted-foreground">Historial de pruebas ejecutadas</p>
        </div>
        <Button onClick={() => navigate('/executions/new')}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Ejecucion
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o preset..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="running">En ejecucion</SelectItem>
                <SelectItem value="failed">Con errores</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead className="w-24 text-right">Requests</TableHead>
                <TableHead className="w-24 text-right">Exito</TableHead>
                <TableHead className="w-24 text-right">Avg</TableHead>
                <TableHead className="w-40">Fecha</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : filteredExecutions && filteredExecutions.length > 0 ? (
                filteredExecutions.map((exec) => {
                  const successRate = getSuccessRate(exec.successCount, exec.totalRequests);
                  return (
                    <TableRow key={exec.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/executions/${exec.id}`)}>
                      <TableCell className="font-mono text-sm">#{exec.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exec.requestConfigName || 'Sin nombre'}</p>
                          {exec.presetUsed && <p className="text-xs text-muted-foreground">Preset: {exec.presetUsed}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(exec.status)}</TableCell>
                      <TableCell className="text-right"><span className="font-mono">{exec.totalRequests}</span></TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono ${successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{successRate}%</span>
                        <span className="text-xs text-muted-foreground ml-1">({exec.successCount}/{exec.totalRequests})</span>
                      </TableCell>
                      <TableCell className="text-right"><span className="font-mono text-sm">{Math.round(exec.avgResponseTimeMs)}ms</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(exec.executedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Re-ejecutar" disabled={exec.status === 'running'} onClick={() => handleRerun(exec.id)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalle" onClick={() => navigate(`/executions/${exec.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Eliminar" disabled={exec.status === 'running'}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar ejecucion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Estas seguro de eliminar la ejecucion #{exec.id} y todos sus resultados? Esta accion no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(exec.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Rocket /></EmptyMedia>
                        <EmptyTitle>
                          {searchTerm || statusFilter !== 'all' ? 'Sin resultados' : 'Sin ejecuciones'}
                        </EmptyTitle>
                        <EmptyDescription>
                          {searchTerm || statusFilter !== 'all'
                            ? 'No se encontraron ejecuciones con esos filtros'
                            : 'No hay ejecuciones registradas'}
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
