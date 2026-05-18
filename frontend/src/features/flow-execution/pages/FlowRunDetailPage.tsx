import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { flowRunsApi } from '../api/flow-runs.api';
import { executionsApi } from '@/features/executions/api/executions.api';
import type { FlowDefinitionV1, FlowRunDetail } from '../types/flow.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';

function StepExpandRow({
  clientNodeId,
  label,
  mappingCount,
  testExecutionId,
  error,
  inputMappings,
}: {
  clientNodeId: string;
  label: string;
  mappingCount: number;
  testExecutionId: number | null;
  error: string | null;
  inputMappings: { sourcePath: string; targetPath: string; fromNodeId: string }[];
}) {
  const [open, setOpen] = useState(false);

  const { data: results } = useQuery({
    queryKey: ['execution-results', testExecutionId],
    queryFn: () =>
      executionsApi.getResults(testExecutionId!, 1, 1).then((r) => r.data),
    enabled: open && Boolean(testExecutionId),
  });

  const first = results?.items?.[0];

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1"
            onClick={() => setOpen(!open)}
            disabled={!testExecutionId}
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm">{label}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{clientNodeId}</div>
        </TableCell>
        <TableCell>
          {mappingCount > 0 ? (
            <span className="text-xs">{mappingCount} mapeo(s)</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          {testExecutionId ? (
            <Link className="text-primary hover:underline text-sm" to={`/executions/${testExecutionId}`}>
              #{testExecutionId}
            </Link>
          ) : (
            '—'
          )}
          {error && <div className="text-xs text-destructive mt-1">{error}</div>}
        </TableCell>
      </TableRow>
      {open && first && (
        <TableRow>
          <TableCell colSpan={4} className="bg-muted/30">
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-medium mb-1">Request</p>
                <pre className="font-mono bg-background rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                  {first.requestPayload ?? '—'}
                </pre>
              </div>
              <div>
                <p className="font-medium mb-1">Response</p>
                <pre className="font-mono bg-background rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap">
                  {first.responseBody ?? '—'}
                </pre>
              </div>
            </div>
            {inputMappings.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-xs mb-1">Mapeos aplicados</p>
                <ul className="text-xs space-y-0.5">
                  {inputMappings.map((m, i) => (
                    <li key={i} className="font-mono">
                      {m.fromNodeId.slice(0, 8)} · <code>{m.sourcePath || '(raíz)'}</code> →{' '}
                      <code>{m.targetPath || '(raíz)'}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

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

  const defMeta = useMemo(() => {
    if (!run?.definitionJson) return { labels: {} as Record<string, string>, mappings: {} as Record<string, { sourcePath: string; targetPath: string; fromNodeId: string }[]> };
    try {
      const def = JSON.parse(run.definitionJson) as FlowDefinitionV1;
      const labels: Record<string, string> = {};
      const mappings: Record<string, { sourcePath: string; targetPath: string; fromNodeId: string }[]> = {};
      for (const n of def.nodes ?? []) {
        labels[n.id] = n.label ?? n.id.slice(0, 8);
        mappings[n.id] = n.step?.inputMappings ?? [];
      }
      return { labels, mappings };
    } catch {
      return { labels: {}, mappings: {} };
    }
  }, [run?.definitionJson]);

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
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant={run.status === 'completed' ? 'default' : 'secondary'}>{run.status}</Badge>
              {(run.status === 'running' || run.status === 'pending') && (
                <Button size="sm" variant="outline" onClick={() => cancelMut.mutate()}>
                  Cancelar
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link to={`/flows/edit/${run.executionFlowId}`}>Abrir en editor</Link>
              </Button>
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
                <TableHead className="w-10" />
                <TableHead>Paso</TableHead>
                <TableHead>Mapeos</TableHead>
                <TableHead>Ejecución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.steps.map((s) => (
                <StepExpandRow
                  key={s.id}
                  clientNodeId={s.clientNodeId}
                  label={defMeta.labels[s.clientNodeId] ?? s.clientNodeId}
                  mappingCount={defMeta.mappings[s.clientNodeId]?.length ?? 0}
                  testExecutionId={s.testExecutionId}
                  error={s.error}
                  inputMappings={defMeta.mappings[s.clientNodeId] ?? []}
                />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
