import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { flowRunsApi } from '../api/flow-runs.api';
import type { FlowRunDetail } from '../types/flow.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function FlowRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const runId = id ? parseInt(id, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: run, isLoading } = useQuery({
    queryKey: ['flow-run', runId],
    queryFn: () => flowRunsApi.getById(runId).then((r) => r.data),
    enabled: Number.isFinite(runId),
    refetchInterval: (q) => {
      const d = q.state.data as FlowRunDetail | undefined;
      return d?.status === 'running' || d?.status === 'pending' ? 2000 : false;
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => flowRunsApi.cancel(runId),
    onSuccess: () => {
      toast.success('Cancelado');
      queryClient.invalidateQueries({ queryKey: ['flow-run', runId] });
    },
  });

  if (!Number.isFinite(runId))
    return <p className="p-4 text-destructive">ID inválido</p>;

  return (
    <div className="space-y-4 p-1">
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Flujos', href: '/flows' },
          { label: run ? `Corrida #${run.id}` : 'Corrida' },
        ]}
      />
      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {run && (
        <>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{run.flowName}</h1>
              <p className="text-sm text-muted-foreground">
                Flujo #{run.executionFlowId} · {run.requestCount} iteraciones · {run.executionMode}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>{run.status}</Badge>
              {(run.status === 'running' || run.status === 'pending') && (
                <Button size="sm" variant="outline" onClick={() => cancelMut.mutate()}>
                  Cancelar
                </Button>
              )}
              <Button size="sm" variant="ghost" asChild>
                <Link to="/flows">Flujos</Link>
              </Button>
            </div>
          </div>
          {run.error && (
            <p className="text-sm text-destructive border border-destructive/30 rounded-md p-2">{run.error}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ejecución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.steps.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.clientNodeId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {s.testExecutionId ? (
                      <Link className="text-primary hover:underline" to={`/executions/${s.testExecutionId}`}>
                        Ver #{s.testExecutionId}
                      </Link>
                    ) : (
                      '—'
                    )}
                    {s.error && (
                      <div className="text-xs text-destructive mt-1">{s.error}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
