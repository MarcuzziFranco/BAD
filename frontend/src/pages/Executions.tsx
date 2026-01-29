import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  executionsApi,
  configsApi,
  presetsApi,
  type TestExecutionDetail,
} from '@/services/api';

export function Executions() {
  const queryClient = useQueryClient();
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [count, setCount] = useState(5);
  const [sequential, setSequential] = useState(true);
  const [selectedExecution, setSelectedExecution] =
    useState<TestExecutionDetail | null>(null);

  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: () => executionsApi.getAll().then((res) => res.data),
  });

  const { data: configs } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((res) => res.data),
  });

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: () => presetsApi.getAll().then((res) => res.data),
  });

  const executeMutation = useMutation({
    mutationFn: executionsApi.execute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: executionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      setSelectedExecution(null);
    },
  });

  const handleExecute = () => {
    executeMutation.mutate({
      requestConfigId: parseInt(selectedConfigId),
      count,
      presetName: selectedPreset || undefined,
      sequential,
    });
  };

  const handleViewDetail = async (id: number) => {
    const response = await executionsApi.getById(id);
    setSelectedExecution(response.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ejecuciones</h2>
        <p className="text-muted-foreground">
          Ejecuta tests y revisa el historial de ejecuciones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva Ejecución</CardTitle>
          <CardDescription>
            Configura y ejecuta un nuevo batch de tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Configuración</label>
              <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {configs?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Preset</label>
              <Select 
                value={selectedPreset || "_none"} 
                onValueChange={(v) => setSelectedPreset(v === "_none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin preset</SelectItem>
                  {presets?.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Cantidad</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Modo</label>
              <Select
                value={sequential ? 'sequential' : 'parallel'}
                onValueChange={(v) => setSequential(v === 'sequential')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Secuencial</SelectItem>
                  <SelectItem value="parallel">Paralelo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleExecute}
                disabled={!selectedConfigId || executeMutation.isPending}
                className="w-full"
              >
                {executeMutation.isPending ? 'Ejecutando...' : 'Ejecutar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Cargando...</p>
            ) : executions && executions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Preset</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow
                      key={execution.id}
                      className={
                        selectedExecution?.id === execution.id
                          ? 'bg-accent'
                          : ''
                      }
                    >
                      <TableCell>
                        {new Date(execution.executedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{execution.presetUsed || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            execution.failureCount === 0
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {execution.successCount}/{execution.totalRequests}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {execution.avgResponseTimeMs.toFixed(0)}ms
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(execution.id)}
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No hay ejecuciones</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Detalle
              {selectedExecution && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-4"
                  onClick={() => deleteMutation.mutate(selectedExecution.id)}
                >
                  Eliminar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedExecution ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    {selectedExecution.totalRequests}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Éxitos:</span>{' '}
                    {selectedExecution.successCount}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fallos:</span>{' '}
                    {selectedExecution.failureCount}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg:</span>{' '}
                    {selectedExecution.avgResponseTimeMs.toFixed(0)}ms
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min:</span>{' '}
                    {selectedExecution.minResponseTimeMs.toFixed(0)}ms
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>{' '}
                    {selectedExecution.maxResponseTimeMs.toFixed(0)}ms
                  </div>
                </div>

                <Tabs defaultValue="0">
                  <TabsList className="flex-wrap h-auto">
                    {selectedExecution.results.slice(0, 10).map((r) => (
                      <TabsTrigger key={r.index} value={r.index.toString()}>
                        <Badge
                          variant={r.isSuccess ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          #{r.index + 1}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedExecution.results.slice(0, 10).map((result) => (
                    <TabsContent key={result.index} value={result.index.toString()}>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Status: {result.statusCode}</span>
                          <span>{result.durationMs.toFixed(0)}ms</span>
                        </div>
                        {result.error && (
                          <div className="text-destructive">{result.error}</div>
                        )}
                        <div>
                          <h4 className="font-medium">Request:</h4>
                          <pre className="bg-secondary p-2 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(JSON.parse(result.requestPayload), null, 2)}
                          </pre>
                        </div>
                        {result.responseBody && (
                          <div>
                            <h4 className="font-medium">Response:</h4>
                            <pre className="bg-secondary p-2 rounded text-xs overflow-auto max-h-32">
                              {result.responseBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Selecciona una ejecución para ver el detalle
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
