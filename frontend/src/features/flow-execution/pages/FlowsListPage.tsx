import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { flowsApi } from '../api/flows.api';
import { flowRunsApi } from '../api/flow-runs.api';
import { countNodes } from '../components/FlowResourcePalette';
import { Plus } from 'lucide-react';
import type { ExecutionFlowListItem } from '../types/flow.types';

function FlowRowActions({ flow }: { flow: ExecutionFlowListItem }) {
  const { data: runs } = useQuery({
    queryKey: ['flow-runs-list', flow.id],
    queryFn: () => flowRunsApi.listByFlow(flow.id, 1).then((r) => r.data),
  });
  const lastRun = runs?.[0];

  return (
  <>
    <TableCell className="text-muted-foreground text-sm">
      {new Date(flow.updatedAt).toLocaleString()}
    </TableCell>
    <TableCell>
      {lastRun ? (
        <Badge variant={lastRun.status === 'completed' ? 'default' : 'secondary'}>
          {lastRun.status}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </TableCell>
    <TableCell className="text-right space-x-2">
      <Button variant="outline" size="sm" asChild>
        <Link to={`/flows/edit/${flow.id}`}>Editar</Link>
      </Button>
      {lastRun && (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/flow-runs/${lastRun.id}`}>Última corrida</Link>
        </Button>
      )}
    </TableCell>
  </>
  );
}

export function FlowsListPage() {
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: () => flowsApi.list().then((r) => r.data),
  });

  const { data: flowDetails } = useQuery({
    queryKey: ['flows-node-counts'],
    queryFn: async () => {
      const list = flows ?? [];
      const counts: Record<number, number> = {};
      await Promise.all(
        list.map(async (f) => {
          try {
            const detail = await flowsApi.getById(f.id).then((r) => r.data);
            counts[f.id] = countNodes(detail.definitionJson);
          } catch {
            counts[f.id] = 0;
          }
        }),
      );
      return counts;
    },
    enabled: Boolean(flows?.length),
  });

  return (
    <div className="space-y-4 p-1">
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Flujos de ejecución' }]}
      />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Flujos (DAG)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Encadene servicios y mapee respuestas entre pasos.
          </p>
        </div>
        <Button asChild>
          <Link to="/flows/new">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo flujo
          </Link>
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {!isLoading && (flows?.length ?? 0) > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Nodos</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead>Última corrida</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(flows ?? []).map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" to={`/flows/edit/${f.id}`}>
                      {f.name}
                    </Link>
                    {f.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {flowDetails?.[f.id] ?? '…'}
                  </TableCell>
                  <FlowRowActions flow={f} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && (flows?.length ?? 0) === 0 && (
        <div className="rounded-lg border bg-card px-4 py-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            No hay flujos. Cree uno o importe operaciones desde OpenAPI.
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link to="/flows/new">
                <Plus className="w-4 h-4 mr-1" />
                Nuevo flujo
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/openapi">Importaciones API</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
