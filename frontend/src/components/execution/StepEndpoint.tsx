import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { configsApi } from '@/services/api';
import type { RequestConfig } from '@/services/api';
import { Globe, Key, FileJson, Loader2 } from 'lucide-react';

interface StepEndpointProps {
  selectedConfigId: number | null;
  onSelect: (config: RequestConfig | null) => void;
}

export function StepEndpoint({ selectedConfigId, onSelect }: StepEndpointProps) {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['configs'],
    queryFn: () => configsApi.getAll().then((res) => res.data),
  });

  const selectedConfig = configs?.find((c) => c.id === selectedConfigId);

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500/10 text-green-600',
      POST: 'bg-blue-500/10 text-blue-600',
      PUT: 'bg-yellow-500/10 text-yellow-600',
      PATCH: 'bg-orange-500/10 text-orange-600',
      DELETE: 'bg-red-500/10 text-red-600',
    };
    return colors[method] || 'bg-gray-500/10 text-gray-600';
  };

  const options = configs?.map((c) => ({
    value: c.id.toString(),
    label: `${c.method} - ${c.name}`,
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Seleccionar Servicio de Test</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Elige el endpoint que deseas probar
        </p>
        <Combobox
          options={options}
          value={selectedConfigId?.toString() || ''}
          onValueChange={(value) => {
            const config = configs?.find((c) => c.id.toString() === value);
            onSelect(config || null);
          }}
          placeholder="Buscar servicio..."
          emptyText="No se encontraron servicios"
        />
      </div>

      {selectedConfig && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Endpoint Seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded ${getMethodBadge(selectedConfig.method)}`}>
                {selectedConfig.method}
              </span>
              <span className="font-mono text-sm truncate">{selectedConfig.url}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedConfig.authType && selectedConfig.authType !== 'None' && (
                <Badge variant="outline" className="text-xs">
                  <Key className="w-3 h-3 mr-1" />
                  {selectedConfig.authType}
                </Badge>
              )}
              {selectedConfig.headers && (
                <Badge variant="outline" className="text-xs">
                  Headers configurados
                </Badge>
              )}
              {selectedConfig.jsonTemplateId && (
                <Badge variant="secondary" className="text-xs">
                  <FileJson className="w-3 h-3 mr-1" />
                  Template #{selectedConfig.jsonTemplateId}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedConfig && configs && configs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-2">No hay servicios configurados</p>
            <p className="text-sm text-muted-foreground">
              Ve a "Servicios de Test" para crear uno
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
