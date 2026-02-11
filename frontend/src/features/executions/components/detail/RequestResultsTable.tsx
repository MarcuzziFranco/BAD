import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Copy,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { ExecutionRequestResult, StatusFilter, FilterState } from './types';
import { cn } from '@/lib/utils';

interface RequestResultsTableProps {
  results: ExecutionRequestResult[];
  selectedId: number | null;
  maxDurationMs: number;
  avgDurationMs: number;
  onSelect: (result: ExecutionRequestResult) => void;
  onCopyCurl?: (result: ExecutionRequestResult) => void;
  onRerunSingle?: (result: ExecutionRequestResult) => void;
}

export const RequestResultsTable = memo(function RequestResultsTable({
  results,
  selectedId,
  maxDurationMs,
  avgDurationMs,
  onSelect,
  onCopyCurl,
  onRerunSingle,
}: RequestResultsTableProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    statusFilter: 'all',
    onlyOutliers: false,
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      const currentIndex = filteredResults.findIndex(r => r.id === selectedId);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, filteredResults.length - 1);
        if (filteredResults[nextIndex]) {
          onSelect(filteredResults[nextIndex]);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (filteredResults[prevIndex]) {
          onSelect(filteredResults[prevIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onSelect]);

  // Mark outliers (duration > avg * 3)
  const resultsWithOutliers = useMemo(() => {
    const outlierThreshold = avgDurationMs * 3;
    return results.map(r => ({
      ...r,
      isOutlier: r.durationMs > outlierThreshold,
    }));
  }, [results, avgDurationMs]);

  // Filter results
  const filteredResults = useMemo(() => {
    return resultsWithOutliers.filter(r => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const inRequest = r.requestBody?.toLowerCase().includes(searchLower);
        const inResponse = r.responseBody?.toLowerCase().includes(searchLower);
        const inError = r.errorMessage?.toLowerCase().includes(searchLower);
        const inOutcome = r.outcomeLabel?.toLowerCase().includes(searchLower);
        if (!inRequest && !inResponse && !inError && !inOutcome) return false;
      }

      // Status filter
      if (filters.statusFilter !== 'all') {
        const statusClass = Math.floor(r.statusCode / 100);
        if (filters.statusFilter === '2xx' && statusClass !== 2) return false;
        if (filters.statusFilter === '4xx' && statusClass !== 4) return false;
        if (filters.statusFilter === '5xx' && statusClass !== 5) return false;
      }

      // Outliers filter
      if (filters.onlyOutliers && !r.isOutlier) return false;

      return true;
    });
  }, [resultsWithOutliers, filters]);

  const outliersCount = useMemo(
    () => resultsWithOutliers.filter(r => r.isOutlier).length,
    [resultsWithOutliers]
  );

  const getStatusBadge = useCallback((statusCode: number, isSuccess: boolean) => {
    if (isSuccess) {
      return (
        <Badge className="bg-green-500/15 text-green-600 border-green-500/30 font-mono text-xs px-1.5">
          {statusCode}
        </Badge>
      );
    }
    if (statusCode >= 500) {
      return (
        <Badge className="bg-red-500/15 text-red-600 border-red-500/30 font-mono text-xs px-1.5">
          {statusCode}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 font-mono text-xs px-1.5">
        {statusCode}
      </Badge>
    );
  }, []);

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Filter Controls */}
      <div className="flex items-center gap-3 p-3 border-b bg-muted/30">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar en request/response..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* Status filter */}
        <ToggleGroup
          type="single"
          value={filters.statusFilter}
          onValueChange={(value) => {
            if (value) setFilters(f => ({ ...f, statusFilter: value as StatusFilter }));
          }}
          className="bg-muted/50 rounded-md p-0.5"
        >
          <ToggleGroupItem value="all" size="sm" className="text-xs h-7 px-2.5">
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem value="2xx" size="sm" className="text-xs h-7 px-2.5 data-[state=on]:text-green-600">
            2xx
          </ToggleGroupItem>
          <ToggleGroupItem value="4xx" size="sm" className="text-xs h-7 px-2.5 data-[state=on]:text-yellow-600">
            4xx
          </ToggleGroupItem>
          <ToggleGroupItem value="5xx" size="sm" className="text-xs h-7 px-2.5 data-[state=on]:text-red-600">
            5xx
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Outliers switch */}
        <div className="flex items-center gap-2">
          <Switch
            id="outliers"
            checked={filters.onlyOutliers}
            onCheckedChange={(checked) => setFilters(f => ({ ...f, onlyOutliers: checked }))}
            className="scale-90"
          />
          <Label htmlFor="outliers" className="text-xs text-muted-foreground cursor-pointer">
            Solo outliers
            {outliersCount > 0 && (
              <Badge variant="outline" className="ml-1.5 text-amber-600 text-[10px] px-1 py-0">
                {outliersCount}
              </Badge>
            )}
          </Label>
        </div>

        {/* Results count */}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredResults.length} de {results.length}
        </span>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-xs">#</TableHead>
              <TableHead className="w-16 text-xs">Status</TableHead>
              <TableHead className="w-28 text-xs">Duración</TableHead>
              <TableHead className="text-xs">Operación</TableHead>
              <TableHead className="text-xs">Resultado</TableHead>
              <TableHead className="w-24 text-xs text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow
                key={result.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedId === result.id && 'bg-accent',
                  result.isOutlier && 'border-l-2 border-l-amber-500'
                )}
                onClick={() => onSelect(result)}
              >
                <TableCell className="font-mono text-xs py-2">
                  <div className="flex items-center gap-1">
                    {result.index + 1}
                    {result.isOutlier && (
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>Outlier: tiempo anormalmente alto</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {getStatusBadge(result.statusCode, result.isSuccess)}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-12">
                      {Math.round(result.durationMs)}ms
                    </span>
                    {/* Duration bar */}
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-16">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          result.isSuccess ? 'bg-blue-500' : 'bg-red-500',
                          result.isOutlier && 'bg-amber-500'
                        )}
                        style={{
                          width: `${Math.min((result.durationMs / maxDurationMs) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span className="text-xs text-muted-foreground truncate block max-w-32">
                    {result.operationLabel}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <span className={cn(
                    'text-xs truncate block max-w-40',
                    result.isSuccess ? 'text-muted-foreground' : 'text-red-500'
                  )}>
                    {result.outcomeLabel}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {onCopyCurl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onCopyCurl(result)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar como cURL</TooltipContent>
                      </Tooltip>
                    )}
                    {onRerunSingle && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onRerunSingle(result)}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Re-ejecutar</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onSelect(result)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
});
