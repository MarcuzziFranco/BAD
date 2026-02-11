import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import type { ExecutionSummary } from './types';
import { cn } from '@/lib/utils';

interface ExecutionSummaryBarProps {
  execution: ExecutionSummary;
  outliersCount?: number;
}

export const ExecutionSummaryBar = memo(function ExecutionSummaryBar({
  execution,
  outliersCount = 0,
}: ExecutionSummaryBarProps) {
  const successRate = execution.totalCount > 0
    ? Math.round((execution.okCount / execution.totalCount) * 100)
    : 0;

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-muted/40 rounded-lg border">
      {/* Total */}
      <MetricChip
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        label="Total"
        value={execution.totalCount.toString()}
        tooltip="Total de requests ejecutadas"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* OK */}
      <MetricChip
        icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
        label="OK"
        value={execution.okCount.toString()}
        valueClass="text-green-600"
        tooltip="Requests exitosas (2xx)"
      />

      {/* Errors */}
      <MetricChip
        icon={<XCircle className="w-3.5 h-3.5 text-red-500" />}
        label="Errores"
        value={execution.errorCount.toString()}
        valueClass={execution.errorCount > 0 ? 'text-red-600' : ''}
        tooltip="Requests con error (4xx/5xx)"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Success Rate */}
      <MetricChip
        label="Éxito"
        value={`${successRate}%`}
        valueClass={cn(
          successRate >= 95 ? 'text-green-600' :
          successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
        )}
        tooltip="Tasa de éxito"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Avg */}
      <MetricChip
        icon={<Clock className="w-3.5 h-3.5 text-blue-500" />}
        label="Avg"
        value={formatDuration(execution.avgMs)}
        tooltip="Tiempo promedio de respuesta"
      />

      {/* Max */}
      <MetricChip
        icon={<Zap className="w-3.5 h-3.5 text-orange-500" />}
        label="Max"
        value={formatDuration(execution.maxMs)}
        tooltip="Tiempo máximo de respuesta"
      />

      {/* P95 / P99 if available */}
      {execution.p95Ms !== undefined && (
        <MetricChip
          label="P95"
          value={formatDuration(execution.p95Ms)}
          tooltip="Percentil 95 de tiempo de respuesta"
        />
      )}

      {execution.p99Ms !== undefined && (
        <MetricChip
          label="P99"
          value={formatDuration(execution.p99Ms)}
          tooltip="Percentil 99 de tiempo de respuesta"
        />
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Duration */}
      <MetricChip
        label="Duración"
        value={formatDuration(execution.totalDurationMs)}
        tooltip="Duración total del test"
      />

      {/* Outliers */}
      {outliersCount > 0 && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="w-3 h-3" />
                {outliersCount} outliers
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Requests con tiempo mayor a 3x el promedio
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
});

// Mini metric chip component
interface MetricChipProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  tooltip?: string;
}

const MetricChip = memo(function MetricChip({
  icon,
  label,
  value,
  valueClass,
  tooltip,
}: MetricChipProps) {
  const content = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/60 transition-colors">
      {icon}
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={cn('text-sm font-semibold tabular-nums', valueClass)}>
        {value}
      </span>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
});
