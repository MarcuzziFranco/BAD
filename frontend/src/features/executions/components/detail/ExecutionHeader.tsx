import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Share2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import type { ExecutionSummary } from './types';

interface ExecutionHeaderProps {
  execution: ExecutionSummary;
  onRerun: (mode: 'all' | 'failed' | 'selected') => void;
  onExport: (format: 'json' | 'csv' | 'markdown') => void;
  onShare?: () => void;
}

export const ExecutionHeader = memo(function ExecutionHeader({
  execution,
  onRerun,
  onExport,
  onShare,
}: ExecutionHeaderProps) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const hasErrors = execution.errorCount > 0;
    
    switch (execution.status) {
      case 'completed':
        return hasErrors ? (
          <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            CON ERRORES
          </Badge>
        ) : (
          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETADO
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            EJECUTANDO
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/15 text-red-600 border-red-500/30 gap-1.5">
            <XCircle className="w-3 h-3" />
            FALLIDO
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-zinc-500/15 text-zinc-500 border-zinc-500/30 gap-1.5">
            <XCircle className="w-3 h-3" />
            CANCELADO
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/15 text-zinc-500 border-zinc-500/30 gap-1.5">
            <Clock className="w-3 h-3" />
            PENDIENTE
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex items-center justify-between py-2">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/executions')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Volver al historial</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">
            Ejecución #{execution.id}
          </h1>
          <span className="text-muted-foreground">—</span>
          <span className="font-mono text-sm text-muted-foreground">
            {execution.method} {execution.endpoint}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Center: Metadata */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="text-foreground/70">Env:</span> {execution.env}
        </span>
        <span className="text-zinc-600">·</span>
        <span className="font-mono text-xs">
          {formatDate(execution.startedAt)}
          {execution.finishedAt && (
            <> → {formatDate(execution.finishedAt)}</>
          )}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Re-ejecutar
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRerun('all')}>
              Todas las requests
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onRerun('failed')}
              disabled={execution.errorCount === 0}
            >
              Solo fallidas ({execution.errorCount})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRerun('selected')}>
              Request seleccionada
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Exportar
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('json')}>
              JSON completo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv')}>
              CSV (tabla)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExport('markdown')}>
              Reporte Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar enlace</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
