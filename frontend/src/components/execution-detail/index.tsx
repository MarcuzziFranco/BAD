import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { executionsApi } from '@/services/api';
import { ExecutionHeader } from './ExecutionHeader';
import { ExecutionSummaryBar } from './ExecutionSummaryBar';
import { RequestResultsTable } from './RequestResultsTable';
import { RequestDetailPanel } from './RequestDetailPanel';
import type { ExecutionSummary, ExecutionRequestResult } from './types';

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState<ExecutionRequestResult | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [currentPage] = useState(1);
  const pageSize = 50;

  // Fetch execution data
  const { data: executionData, isLoading: loadingExecution } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionsApi.getById(Number(id)).then((res) => res.data),
    enabled: !!id,
  });

  // Fetch results
  const { data: resultsData } = useQuery({
    queryKey: ['execution-results', id, currentPage],
    queryFn: () => executionsApi.getResults(Number(id), currentPage, pageSize).then((res) => res.data),
    enabled: !!id,
  });

  // Transform API data to our types
  const execution: ExecutionSummary | null = useMemo(() => {
    if (!executionData) return null;
    
    const startTime = new Date(executionData.executedAt).getTime();
    const endTime = executionData.finishedAt ? new Date(executionData.finishedAt).getTime() : Date.now();
    
    return {
      id: executionData.id,
      endpoint: executionData.requestConfigUrl || '/api/unknown',
      method: executionData.requestConfigMethod || 'GET',
      env: executionData.requestConfigName || 'Original',
      startedAt: executionData.executedAt,
      finishedAt: executionData.finishedAt,
      status: executionData.status as ExecutionSummary['status'],
      totalCount: executionData.totalRequests,
      okCount: executionData.successCount,
      errorCount: executionData.failureCount,
      avgMs: executionData.avgResponseTimeMs,
      maxMs: executionData.maxResponseTimeMs,
      minMs: executionData.minResponseTimeMs,
      totalDurationMs: endTime - startTime,
      baseJson: executionData.baseJson || undefined,
      templateName: executionData.templateName || undefined,
      presetUsed: executionData.presetUsed || undefined,
    };
  }, [executionData]);

  // Transform results
  const results: ExecutionRequestResult[] = useMemo(() => {
    if (!resultsData?.items) return [];
    return resultsData.items.map((r) => {
      // Parse outcome from response/error
      let outcomeLabel = 'OK';
      if (!r.isSuccess) {
        if (r.statusCode >= 500) outcomeLabel = 'Server Error';
        else if (r.statusCode === 404) outcomeLabel = 'Not Found';
        else if (r.statusCode === 401) outcomeLabel = 'Unauthorized';
        else if (r.statusCode === 400) outcomeLabel = 'Validation Failed';
        else outcomeLabel = `Error ${r.statusCode}`;
      }

      return {
        id: r.id,
        index: r.index,
        requestId: `req-${r.id}`,
        statusCode: r.statusCode,
        durationMs: r.durationMs,
        operationLabel: execution?.method + ' ' + execution?.endpoint,
        requestBody: r.requestPayload || '{}',
        responseBody: r.responseBody,
        requestHeaders: r.requestHeaders,
        responseHeaders: r.responseHeaders,
        outcomeLabel,
        errorMessage: r.error || undefined,
        executedAt: r.executedAt,
        isSuccess: r.isSuccess,
        bytesOut: r.requestPayload ? new Blob([r.requestPayload]).size : undefined,
        bytesIn: r.responseBody ? new Blob([r.responseBody]).size : undefined,
      };
    });
  }, [resultsData, execution]);

  // Auto-select first result
  useEffect(() => {
    if (results.length > 0 && !selectedResult) {
      setSelectedResult(results[0]);
    }
  }, [results, selectedResult]);

  // Calculate outliers count
  const outliersCount = useMemo(() => {
    if (!execution) return 0;
    const threshold = execution.avgMs * 3;
    return results.filter(r => r.durationMs > threshold).length;
  }, [results, execution]);

  // Handlers
  const handleRerun = useCallback((mode: 'all' | 'failed' | 'selected') => {
    if (mode === 'all') {
      navigate(`/executions/new?rerun=${id}`);
    } else if (mode === 'failed') {
      // Could implement specific failed-only rerun
      navigate(`/executions/new?rerun=${id}`);
    } else if (mode === 'selected' && selectedResult) {
      // Could implement single request rerun
      navigate(`/executions/new?rerun=${id}`);
    }
  }, [navigate, id, selectedResult]);

  const handleExport = useCallback((format: 'json' | 'csv' | 'markdown') => {
    if (!execution || !results.length) return;

    let content = '';
    let filename = `execution-${execution.id}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify({
        execution: {
          id: execution.id,
          endpoint: `${execution.method} ${execution.endpoint}`,
          status: execution.status,
          totalRequests: execution.totalCount,
          successCount: execution.okCount,
          errorCount: execution.errorCount,
          avgMs: execution.avgMs,
          maxMs: execution.maxMs,
          startedAt: execution.startedAt,
          finishedAt: execution.finishedAt,
        },
        results: results.map(r => ({
          index: r.index + 1,
          statusCode: r.statusCode,
          durationMs: r.durationMs,
          isSuccess: r.isSuccess,
          request: r.requestBody,
          response: r.responseBody,
          error: r.errorMessage,
        })),
      }, null, 2);
      filename += '.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const headers = ['#', 'Status', 'Duration (ms)', 'Success', 'Outcome'];
      const rows = results.map(r => [
        r.index + 1,
        r.statusCode,
        Math.round(r.durationMs),
        r.isSuccess ? 'Yes' : 'No',
        r.outcomeLabel,
      ]);
      content = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename += '.csv';
      mimeType = 'text/csv';
    } else if (format === 'markdown') {
      content = `# Execution Report #${execution.id}\n\n`;
      content += `## Summary\n\n`;
      content += `- **Endpoint:** ${execution.method} ${execution.endpoint}\n`;
      content += `- **Status:** ${execution.status}\n`;
      content += `- **Total:** ${execution.totalCount} requests\n`;
      content += `- **Success:** ${execution.okCount} (${Math.round((execution.okCount / execution.totalCount) * 100)}%)\n`;
      content += `- **Errors:** ${execution.errorCount}\n`;
      content += `- **Avg Response:** ${Math.round(execution.avgMs)}ms\n`;
      content += `- **Max Response:** ${Math.round(execution.maxMs)}ms\n\n`;
      content += `## Results\n\n`;
      content += `| # | Status | Duration | Outcome |\n`;
      content += `|---|--------|----------|----------|\n`;
      results.forEach(r => {
        content += `| ${r.index + 1} | ${r.statusCode} | ${Math.round(r.durationMs)}ms | ${r.outcomeLabel} |\n`;
      });
      filename += '.md';
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [execution, results]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  const handleSelectResult = useCallback((result: ExecutionRequestResult) => {
    setSelectedResult(result);
    // On mobile, open the sheet
    if (window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  }, []);

  const handleCopyCurl = useCallback((result: ExecutionRequestResult) => {
    if (!execution) return;
    const curl = `curl -X ${execution.method} '${execution.endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${result.requestBody}'`;
    navigator.clipboard.writeText(curl);
  }, [execution]);

  // Loading state
  if (loadingExecution) {
    return (
      <TooltipProvider>
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Skeleton className="lg:col-span-3 h-full" />
            <Skeleton className="lg:col-span-2 h-full hidden lg:block" />
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Not found
  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground mb-4">Ejecución no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/executions')}>
          Volver al historial
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-100px)] flex flex-col gap-3">
        {/* Header */}
        <ExecutionHeader
          execution={execution}
          onRerun={handleRerun}
          onExport={handleExport}
          onShare={handleShare}
        />

        {/* Summary Bar */}
        <ExecutionSummaryBar execution={execution} outliersCount={outliersCount} />

        {/* Main Content - Master/Detail */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
          {/* Left: Results Table (takes 3/5 on desktop) */}
          <div className="lg:col-span-3 min-h-0">
            <RequestResultsTable
              results={results}
              selectedId={selectedResult?.id ?? null}
              maxDurationMs={execution.maxMs}
              avgDurationMs={execution.avgMs}
              onSelect={handleSelectResult}
              onCopyCurl={handleCopyCurl}
            />
          </div>

          {/* Right: Detail Panel (takes 2/5 on desktop, hidden on mobile) */}
          <div className="lg:col-span-2 hidden lg:block min-h-0">
            <RequestDetailPanel
              result={selectedResult}
              execution={execution}
            />
          </div>
        </div>

        {/* Mobile: Sheet for detail */}
        <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
          <SheetContent side="right" className="w-full sm:w-[500px] p-0">
            <div className="h-full">
              <RequestDetailPanel
                result={selectedResult}
                execution={execution}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

// Re-export components
export { ExecutionHeader } from './ExecutionHeader';
export { ExecutionSummaryBar } from './ExecutionSummaryBar';
export { RequestResultsTable } from './RequestResultsTable';
export { RequestDetailPanel } from './RequestDetailPanel';
export { JsonViewer } from './JsonViewer';
export type { ExecutionSummary, ExecutionRequestResult, FilterState, StatusFilter } from './types';
