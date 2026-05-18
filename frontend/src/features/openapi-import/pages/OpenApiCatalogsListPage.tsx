import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { openapiCatalogsApi } from '../api/openapi-catalogs.api';
import { FileCode2, Plus, RefreshCw } from 'lucide-react';

export function OpenApiCatalogsListPage() {
  const { data: catalogs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['openapi-catalogs'],
    queryFn: () => openapiCatalogsApi.list().then((r) => r.data),
  });

  return (
    <div className="space-y-4 p-1">
      <PageBreadcrumb
        items={[{ label: 'Dashboard', href: '/' }, { label: 'Importaciones OpenAPI' }]}
      />
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Importaciones OpenAPI</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Catálogos importados para validar operaciones, actualizar templates y servicios, o
            cargar una nueva versión de la spec.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button asChild>
            <Link to="/openapi/import">
              <Plus className="w-4 h-4 mr-1" />
              Nueva importación
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Cargando…</p>}

      {!isLoading && (catalogs?.length ?? 0) === 0 && (
        <div className="rounded-lg border bg-card px-4 py-12 text-center text-muted-foreground text-sm">
          <FileCode2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No hay importaciones.{' '}
          <Link to="/openapi/import" className="text-primary underline">
            Importe su primera API
          </Link>
        </div>
      )}

      {(catalogs?.length ?? 0) > 0 && (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Operaciones</TableHead>
                <TableHead>Templates</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Pendientes</TableHead>
                <TableHead>Actualizado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogs!.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      to={`/openapi/${c.id}`}
                      className="font-medium hover:underline flex items-center gap-2"
                    >
                      <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>
                        {c.name}
                        {c.infoVersion && (
                          <span className="text-xs text-muted-foreground ml-1">v{c.infoVersion}</span>
                        )}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[180px] truncate" title={c.baseUrl}>
                    {c.baseUrl}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.linkedCount}/{c.operationCount}
                  </TableCell>
                  <TableCell className="text-sm">{c.templateCount}</TableCell>
                  <TableCell className="text-sm">{c.serviceCount}</TableCell>
                  <TableCell>
                    {c.pendingCount > 0 ? (
                      <Badge variant="secondary">{c.pendingCount}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true, locale: es })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/openapi/${c.id}`}>Gestionar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
