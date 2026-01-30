import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { executionsApi } from '@/services/api';
import type { TestResult } from '@/services/api';
import {
  ArrowLeft,
  Globe,
  FileJson,
  Settings2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function ExecutionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const pageSize = 20;

  const { data: execution, isLoading: loadingExecution } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionsApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  const { data: resultsData, isLoading: loadingResults } = useQuery({
    queryKey: ['execution-results', id, currentPage],
    queryFn: () => executionsApi.getResults(Number(id), currentPage, pageSize).then((res) => res.data),
    enabled: !!id,
  });

  if (loadingExecution) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ejecución no encontrada</p>
        <Button variant="link" onClick={() => navigate('/executions')}>
          Volver al historial
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Ejecutando</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'cancelled':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const successRate = execution.totalRequests > 0 
    ? Math.round((execution.successCount / execution.totalRequests) * 100) 
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/executions')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Ejecución #{execution.id}
              {getStatusBadge(execution.status)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(execution.executedAt)}
              {execution.finishedAt && ` - ${formatDate(execution.finishedAt)}`}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Endpoint</span>
            </div>
            <p className="font-medium truncate">{execution.requestConfigName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {execution.requestConfigMethod} {execution.requestConfigUrl}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Settings2 className="w-4 h-4" />
              <span className="text-sm">Configuración</span>
            </div>
            <p className="font-medium">{execution.totalRequests} requests</p>
            <p className="text-xs text-muted-foreground">
              {execution.executionMode} | {execution.intervalMs}ms
            </p>
          </CardContent>
        </Card>

        <Card className={
          successRate >= 90 ? 'border-green-500/30' :
          successRate >= 70 ? 'border-yellow-500/30' : 'border-red-500/30'
        }>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Tasa de Éxito</span>
            </div>
            <p className={`text-2xl font-bold ${
              successRate >= 90 ? 'text-green-600' :
              successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {successRate}%
            </p>
            <p className="text-xs text-muted-foreground">
              {execution.successCount} ok / {execution.failureCount} error
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Tiempos de Respuesta</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(execution.avgResponseTimeMs)}ms</p>
            <p className="text-xs text-muted-foreground">
              min: {Math.round(execution.minResponseTimeMs)}ms | max: {Math.round(execution.maxResponseTimeMs)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Body JSON si existe */}
      {execution.baseJson && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              JSON Base Utilizado
              {execution.templateName && <Badge variant="outline">{execution.templateName}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 border rounded-lg overflow-hidden">
              <Editor
                height="100%"
                language="json"
                theme="vs-dark"
                value={execution.baseJson}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'off',
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Resultados ({resultsData?.totalCount || 0} requests)</span>
            {resultsData && resultsData.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {resultsData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(resultsData.totalPages, p + 1))}
                  disabled={currentPage === resultsData.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-auto">
          {loadingResults ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Tiempo</TableHead>
                  <TableHead>Request (preview)</TableHead>
                  <TableHead>Response (preview)</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultsData?.items.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-mono text-sm">{result.index + 1}</TableCell>
                    <TableCell>
                      <Badge variant={result.isSuccess ? 'default' : 'destructive'}>
                        {result.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Math.round(result.durationMs)}ms
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {result.requestPayload.substring(0, 80)}...
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {(result.responseBody || result.error || '-').substring(0, 80)}
                        {(result.responseBody || result.error || '').length > 80 ? '...' : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedResult(result)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sheet para ver detalle de request/response */}
      <Sheet open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <SheetContent className="w-[600px] sm:w-[800px] sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Request #{selectedResult?.index !== undefined ? selectedResult.index + 1 : ''}
              {selectedResult && (
                <Badge variant={selectedResult.isSuccess ? 'default' : 'destructive'}>
                  {selectedResult.statusCode}
                </Badge>
              )}
              <span className="text-sm font-normal text-muted-foreground">
                {selectedResult && `${Math.round(selectedResult.durationMs)}ms`}
              </span>
            </SheetTitle>
          </SheetHeader>
          
          {selectedResult && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Request Body:</p>
                <div className="h-48 border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language="json"
                    theme="vs-dark"
                    value={selectedResult.requestPayload}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">
                  Response {selectedResult.isSuccess ? 'Body' : 'Error'}:
                </p>
                <div className="h-48 border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    language="json"
                    theme="vs-dark"
                    value={selectedResult.responseBody || selectedResult.error || ''}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                    }}
                  />
                </div>
              </div>

              {selectedResult.executedAt && (
                <p className="text-xs text-muted-foreground">
                  Ejecutado: {formatDate(selectedResult.executedAt)}
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
