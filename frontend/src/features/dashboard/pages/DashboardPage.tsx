import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { templatesApi } from '@/features/templates/api/templates.api';
import { executionsApi } from '@/features/executions/api/executions.api';
import { Rocket } from 'lucide-react';

export function DashboardPage() {
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const { data: executions, isLoading: loadingExecutions } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionsApi.getAll().then((res) => res.data),
  });

  const isLoading = loadingTemplates || loadingExecutions;
  const totalTests = executions?.reduce((acc, e) => acc + e.totalRequests, 0) || 0;
  const successRate =
    executions && executions.length > 0
      ? (
          (executions.reduce((acc, e) => acc + e.successCount, 0) / totalTests) *
          100
        ).toFixed(1)
      : '0';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: 'Dashboard' }]} />

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Vista general de BAD - Brutality API Destroyed
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Plantillas guardadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejecuciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Tests ejecutados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Exito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">De {totalTests} requests totales</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Ultimas Ejecuciones</CardTitle>
          <CardDescription>Historial reciente de tests ejecutados</CardDescription>
        </CardHeader>
        <CardContent>
          {executions && executions.length > 0 ? (
            <div className="space-y-4">
              {executions.slice(0, 5).map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {execution.presetUsed || 'Sin preset'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(execution.executedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {execution.successCount}/{execution.totalRequests}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {execution.avgResponseTimeMs.toFixed(0)}ms avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Rocket />
                </EmptyMedia>
                <EmptyTitle>Sin ejecuciones</EmptyTitle>
                <EmptyDescription>No hay ejecuciones registradas todavia</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
