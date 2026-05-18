import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { flowsApi } from '../api/flows.api';
import { Plus } from 'lucide-react';

export function FlowsListPage() {
  const { data: flows, isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: () => flowsApi.list().then((r) => r.data),
  });

  return (
    <div className="space-y-4 p-1">
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Flujos de ejecución' }]}
      />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Flujos (DAG)</h1>
        <Button asChild>
          <Link to="/flows/new">
            <Plus className="w-4 h-4 mr-1" />
            Nuevo flujo
          </Link>
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground text-sm">Cargando…</p>}
      <ul className="divide-y rounded-lg border bg-card">
        {(flows ?? []).map((f) => (
          <li key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40">
            <div>
              <Link className="font-medium hover:underline" to={`/flows/edit/${f.id}`}>
                {f.name}
              </Link>
              {f.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
              )}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/flows/edit/${f.id}`}>Editar</Link>
            </Button>
          </li>
        ))}
        {!isLoading && (flows?.length ?? 0) === 0 && (
          <li className="px-4 py-8 text-center text-muted-foreground text-sm">
            No hay flujos. Cree uno para encadenar requests.
          </li>
        )}
      </ul>
    </div>
  );
}
