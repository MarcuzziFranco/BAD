import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Copy,
  Check,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  Timer,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { JsonViewer } from './JsonViewer';
import type { ExecutionRequestResult, ExecutionSummary } from './types';
import { cn } from '@/lib/utils';

interface RequestDetailPanelProps {
  result: ExecutionRequestResult | null;
  execution: ExecutionSummary;
  onCopyRequest?: () => void;
  onCopyResponse?: () => void;
  onCopyCurl?: () => void;
}

export const RequestDetailPanel = memo(function RequestDetailPanel({
  result,
  execution,
  onCopyRequest,
  onCopyResponse,
  onCopyCurl,
}: RequestDetailPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const extractKeyFields = (json: string | null): Record<string, unknown> | null => {
    if (!json) return null;
    try {
      const parsed = JSON.parse(json);
      const keys = ['success', 'orderId', 'id', 'errorCode', 'error', 'message', 'status'];
      const extracted: Record<string, unknown> = {};
      for (const key of keys) {
        if (key in parsed) {
          extracted[key] = parsed[key];
        }
      }
      return Object.keys(extracted).length > 0 ? extracted : null;
    } catch {
      return null;
    }
  };

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 border rounded-lg bg-muted/20">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">Selecciona una request</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Haz clic en una fila de la tabla o usa las flechas ↑↓ para navegar
        </p>
      </div>
    );
  }

  const keyFields = extractKeyFields(result.responseBody);

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <span className="font-mono font-semibold">#{result.index + 1}</span>
          {result.isSuccess ? (
            <Badge className="bg-green-500/15 text-green-600 border-green-500/30 font-mono">
              {result.statusCode}
            </Badge>
          ) : result.statusCode >= 500 ? (
            <Badge className="bg-red-500/15 text-red-600 border-red-500/30 font-mono">
              {result.statusCode}
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 font-mono">
              {result.statusCode}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground font-mono">
            {Math.round(result.durationMs)}ms
          </span>
          {result.isOutlier && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Outlier
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Tiempo mayor a 3x el promedio</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-1">
          <CopyButton
            label="Request"
            copied={copiedField === 'request'}
            onClick={() => {
              copyToClipboard(result.requestBody, 'request');
              onCopyRequest?.();
            }}
          />
          <CopyButton
            label="Response"
            copied={copiedField === 'response'}
            onClick={() => {
              copyToClipboard(result.responseBody || '', 'response');
              onCopyResponse?.();
            }}
          />
          <CopyButton
            label="cURL"
            copied={copiedField === 'curl'}
            onClick={() => {
              const curl = `curl -X ${execution.method} '${execution.endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${result.requestBody}'`;
              copyToClipboard(curl, 'curl');
              onCopyCurl?.();
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-3 h-10">
          <TabsTrigger value="summary" className="text-xs gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="request" className="text-xs gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Request
          </TabsTrigger>
          <TabsTrigger value="response" className="text-xs gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Response
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Headers
          </TabsTrigger>
          <TabsTrigger value="timing" className="text-xs gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="preset" className="text-xs gap-1.5">
            <FileJson className="w-3.5 h-3.5" />
            Preset
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Summary Tab */}
          <TabsContent value="summary" className="m-0 p-4 space-y-4">
            {/* Outcome */}
            <div className={cn(
              'p-3 rounded-lg border',
              result.isSuccess
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-red-500/5 border-red-500/20'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {result.isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={cn(
                  'font-medium text-sm',
                  result.isSuccess ? 'text-green-700' : 'text-red-700'
                )}>
                  {result.outcomeLabel}
                </span>
              </div>
              {result.errorMessage && (
                <p className="text-xs text-red-600 font-mono pl-6">
                  {result.errorMessage}
                </p>
              )}
            </div>

            {/* Key Fields */}
            {keyFields && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Campos clave
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(keyFields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/40">
                      <span className="text-xs text-muted-foreground">{key}</span>
                      <span className="text-xs font-mono font-medium truncate max-w-24">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Detalles
              </h4>
              <div className="space-y-1.5">
                <MetadataRow icon={<Clock className="w-3.5 h-3.5" />} label="Ejecutado" value={formatDate(result.executedAt)} />
                <MetadataRow icon={<Timer className="w-3.5 h-3.5" />} label="Duración" value={`${Math.round(result.durationMs)}ms`} />
                <MetadataRow icon={<ArrowUpRight className="w-3.5 h-3.5" />} label="Request size" value={formatSize(result.bytesOut)} />
                <MetadataRow icon={<ArrowDownLeft className="w-3.5 h-3.5" />} label="Response size" value={formatSize(result.bytesIn)} />
              </div>
            </div>
          </TabsContent>

          {/* Request Tab */}
          <TabsContent value="request" className="m-0 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  application/json · {formatSize(result.bytesOut)}
                </span>
              </div>
              <JsonViewer
                data={result.requestBody}
                maxHeight="calc(100vh - 400px)"
                title="Request Body"
              />
            </div>
          </TabsContent>

          {/* Response Tab */}
          <TabsContent value="response" className="m-0 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  application/json · {formatSize(result.bytesIn)}
                </span>
              </div>
              {result.responseBody ? (
                <JsonViewer
                  data={result.responseBody}
                  maxHeight="calc(100vh - 400px)"
                  title="Response Body"
                />
              ) : result.errorMessage ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600 font-mono">{result.errorMessage}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin contenido en la respuesta
                </p>
              )}
            </div>
          </TabsContent>

          {/* Headers Tab */}
          <TabsContent value="headers" className="m-0 p-4 space-y-4">
            {result.requestHeaders && (
              <Accordion type="single" collapsible defaultValue="req-headers">
                <AccordionItem value="req-headers" className="border rounded-lg">
                  <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                    Request Headers
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <HeadersTable headers={result.requestHeaders} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            {result.responseHeaders && (
              <Accordion type="single" collapsible defaultValue="res-headers">
                <AccordionItem value="res-headers" className="border rounded-lg">
                  <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                    Response Headers
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    <HeadersTable headers={result.responseHeaders} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            {!result.requestHeaders && !result.responseHeaders && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay headers disponibles
              </p>
            )}
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="m-0 p-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Tiempo total</span>
                  <span className="font-mono font-semibold">{Math.round(result.durationMs)}ms</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Desglose detallado no disponible para esta request
              </p>
            </div>
          </TabsContent>

          {/* Preset/Base JSON Tab */}
          <TabsContent value="preset" className="m-0 p-4">
            {execution.baseJson ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {execution.templateName && (
                    <Badge variant="secondary" className="text-xs">
                      {execution.templateName}
                    </Badge>
                  )}
                  {execution.presetUsed && (
                    <Badge variant="outline" className="text-xs">
                      Preset: {execution.presetUsed}
                    </Badge>
                  )}
                </div>
                <JsonViewer
                  data={execution.baseJson}
                  maxHeight="calc(100vh - 400px)"
                  title="JSON Base / Preset"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay preset/JSON base para esta ejecución
              </p>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
});

// Helper components
const CopyButton = memo(function CopyButton({
  label,
  copied,
  onClick,
}: {
  label: string;
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onClick}>
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
      {label}
    </Button>
  );
});

const MetadataRow = memo(function MetadataRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
});

const HeadersTable = memo(function HeadersTable({ headers }: { headers: string }) {
  let parsed: Record<string, string> = {};
  try {
    parsed = JSON.parse(headers);
  } catch {
    return <p className="text-xs text-muted-foreground">No se pudo parsear los headers</p>;
  }

  return (
    <div className="space-y-1">
      {Object.entries(parsed).map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 text-xs py-1 border-b border-muted last:border-0">
          <span className="font-medium text-muted-foreground w-32 shrink-0 truncate">{key}</span>
          <span className="font-mono break-all">{value}</span>
        </div>
      ))}
    </div>
  );
});
