import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { templatesApi, executionsApi, presetsApi } from '@/services/api';

export function Dashboard() {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const { data: executions } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionsApi.getAll().then((res) => res.data),
  });

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetsApi.getAll().then((res) => res.data),
  });

  const totalTests = executions?.reduce((acc, e) => acc + e.totalRequests, 0) || 0;
  const successRate =
    executions && executions.length > 0
      ? (
          (executions.reduce((acc, e) => acc + e.successCount, 0) / totalTests) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Vista general de BAD - Brutality API Destroyed
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates JSON</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Plantillas guardadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presets</CardTitle>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Presets de mutación disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejecuciones</CardTitle>
            <span className="text-2xl">🚀</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tests ejecutados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              De {totalTests} requests totales
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Ejecuciones</CardTitle>
            <CardDescription>
              Historial reciente de tests ejecutados
            </CardDescription>
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
              <p className="text-sm text-muted-foreground">
                No hay ejecuciones registradas
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presets Disponibles</CardTitle>
            <CardDescription>
              Mutaciones predefinidas para testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {presets && presets.length > 0 ? (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.name}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      {preset.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cargando presets...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
