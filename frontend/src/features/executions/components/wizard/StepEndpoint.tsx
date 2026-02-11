import { useState, useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription as EmptyDesc } from '@/components/ui/empty';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { configsApi } from '@/features/servicios/api/servicios.api';
import type { ExecutionDraft, EndpointOption } from './types';
import {
  Search,
  Globe,
  Lock,
  FileJson,
  ChevronRight,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepEndpointProps {
  draft: ExecutionDraft;
  updateDraft: (updates: Partial<ExecutionDraft>) => void;
  validation: { isValid: boolean; errors: string[] };
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-500/15 text-green-600 border-green-500/30',
  POST: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  PUT: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  PATCH: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  DELETE: 'bg-red-500/15 text-red-600 border-red-500/30',
};

export const StepEndpoint = memo(function StepEndpoint({
  draft,
  updateDraft,
  validation,
}: StepEndpointProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Fetch endpoints
  const { data: endpoints, isLoading } = useQuery({
    queryKey: ['request-configs'],
    queryFn: () => configsApi.getAll().then((res) => res.data),
  });

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    if (!endpoints) return [];
    return endpoints.filter((e) => {
      // Method filter
      if (methodFilter !== 'all' && e.method.toUpperCase() !== methodFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(query) ||
          e.url.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [endpoints, methodFilter, searchQuery]);

  const handleSelect = (endpoint: EndpointOption) => {
    updateDraft({
      endpointId: endpoint.id,
      endpointMethod: endpoint.method,
      endpointUrl: endpoint.url,
      endpointName: endpoint.name,
      endpointHeaders: endpoint.headers,
      endpointAuthType: endpoint.authType,
      endpointAuthValue: endpoint.authValue,
    });
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertDescription>
          Selecciona el endpoint a probar. Busca por nombre o URL. Si no existe, crealo primero en Servicios.
        </AlertDescription>
      </Alert>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="single"
          value={methodFilter}
          onValueChange={(v) => v && setMethodFilter(v)}
          className="bg-muted/50 p-0.5 rounded-md"
        >
          <ToggleGroupItem value="all" size="sm" className="text-xs h-8 px-3">
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem value="GET" size="sm" className="text-xs h-8 px-2.5 data-[state=on]:text-green-600">
            GET
          </ToggleGroupItem>
          <ToggleGroupItem value="POST" size="sm" className="text-xs h-8 px-2.5 data-[state=on]:text-blue-600">
            POST
          </ToggleGroupItem>
          <ToggleGroupItem value="PUT" size="sm" className="text-xs h-8 px-2.5 data-[state=on]:text-yellow-600">
            PUT
          </ToggleGroupItem>
          <ToggleGroupItem value="DELETE" size="sm" className="text-xs h-8 px-2.5 data-[state=on]:text-red-600">
            DELETE
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Selected endpoint (if any) */}
      {draft.endpointId && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('font-mono text-xs', METHOD_COLORS[draft.endpointMethod.toUpperCase()])}>
                      {draft.endpointMethod}
                    </Badge>
                    <span className="font-medium">{draft.endpointName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {draft.endpointUrl}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {draft.endpointHeaders && (
                  <Badge variant="outline" className="text-xs">
                    <FileJson className="w-3 h-3 mr-1" />
                    Headers
                  </Badge>
                )}
                {draft.endpointAuthType && draft.endpointAuthType !== 'None' && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    {draft.endpointAuthType}
                  </Badge>
                )}
                <EndpointDetailsPopover
                  method={draft.endpointMethod}
                  url={draft.endpointUrl}
                  headers={draft.endpointHeaders}
                  authType={draft.endpointAuthType}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation error */}
      {!validation.isValid && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validation.errors[0]}</AlertDescription>
        </Alert>
      )}

      {/* Endpoints list */}
      <Card>
        <ScrollArea className="h-[320px]">
          <div className="p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-5" />
              </div>
            ) : filteredEndpoints.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Search /></EmptyMedia>
                  <EmptyTitle>Sin endpoints</EmptyTitle>
                  <EmptyDesc>
                    {searchQuery ? 'No se encontraron endpoints' : 'No hay servicios configurados'}
                  </EmptyDesc>
                </EmptyHeader>
              </Empty>
            ) : (
              filteredEndpoints.map((endpoint) => (
                <EndpointItem
                  key={endpoint.id}
                  endpoint={endpoint}
                  isSelected={draft.endpointId === endpoint.id}
                  onSelect={() => handleSelect(endpoint)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
});

// Endpoint item component
interface EndpointItemProps {
  endpoint: EndpointOption;
  isSelected: boolean;
  onSelect: () => void;
}

const EndpointItem = memo(function EndpointItem({
  endpoint,
  isSelected,
  onSelect,
}: EndpointItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted/60 border border-transparent'
      )}
    >
      <Badge className={cn('font-mono text-xs shrink-0', METHOD_COLORS[endpoint.method.toUpperCase()])}>
        {endpoint.method}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{endpoint.name}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{endpoint.url}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {endpoint.headers && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Tiene headers configurados</TooltipContent>
          </Tooltip>
        )}
        {endpoint.authType && endpoint.authType !== 'None' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Auth: {endpoint.authType}</TooltipContent>
          </Tooltip>
        )}
        <ChevronRight className={cn(
          'w-4 h-4 transition-colors',
          isSelected ? 'text-primary' : 'text-muted-foreground/40'
        )} />
      </div>
    </div>
  );
});

// Endpoint details popover
interface EndpointDetailsPopoverProps {
  method: string;
  url: string;
  headers: string | null;
  authType: string | null;
}

const EndpointDetailsPopover = memo(function EndpointDetailsPopover({
  method,
  url,
  headers,
  authType,
}: EndpointDetailsPopoverProps) {
  let parsedHeaders: Record<string, string> = {};
  try {
    if (headers) parsedHeaders = JSON.parse(headers);
  } catch {}

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Info className="w-3.5 h-3.5 mr-1" />
          Detalles
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">URL completa</p>
            <code className="text-xs bg-muted p-2 rounded block break-all">
              {method} {url}
            </code>
          </div>
          {Object.keys(parsedHeaders).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Headers</p>
              <div className="bg-muted p-2 rounded space-y-1">
                {Object.entries(parsedHeaders).map(([key, value]) => (
                  <div key={key} className="text-xs font-mono">
                    <span className="text-muted-foreground">{key}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          )}
          {authType && authType !== 'None' && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Autenticación</p>
              <Badge variant="outline">{authType}</Badge>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
