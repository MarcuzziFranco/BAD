import { useState, useEffect, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { generatorApi } from '@/services/api';
import type { JsonField } from '@/services/api';
import {
  JsonVisualizer,
  type FieldConfig,
} from '@/components/generator/JsonFieldEditor';
import {
  Settings2,
  Loader2,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface MutationEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jsonContent: string;
  templateName?: string | null;
  initialMutations: FieldConfig[];
  onSave: (mutations: FieldConfig[]) => void;
}

export const MutationEditorModal = memo(function MutationEditorModal({
  open,
  onOpenChange,
  jsonContent,
  templateName,
  initialMutations,
  onSave,
}: MutationEditorModalProps) {
  const [fields, setFields] = useState<JsonField[]>([]);
  const [configs, setConfigs] = useState<Record<string, FieldConfig>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Analizar JSON cuando se abre el modal
  const { isLoading, refetch } = useQuery({
    queryKey: ['analyze-json', jsonContent],
    queryFn: () => generatorApi.analyze(jsonContent).then((res) => res.data),
    enabled: false,
  });

  // Cargar y analizar JSON cuando se abre
  useEffect(() => {
    if (open && jsonContent) {
      refetch().then((result) => {
        if (result.data) {
          setFields(result.data.fields);
          
          // Inicializar configs con las mutaciones existentes
          const initialConfigs: Record<string, FieldConfig> = {};
          
          // Primero, crear configs por defecto para todos los campos
          result.data.fields.forEach((field: JsonField) => {
            initialConfigs[field.key] = {
              key: field.key,
              operation: 'Random',
            };
          });
          
          // Luego, aplicar las mutaciones iniciales
          initialMutations.forEach((m) => {
            initialConfigs[m.key] = {
              key: m.key,
              operation: m.operation,
              value: m.value,
              minValue: m.minValue,
              maxValue: m.maxValue,
              listValues: m.listValues,
            };
          });
          
          setConfigs(initialConfigs);
          setHasChanges(false);
        }
      });
    }
  }, [open, jsonContent, refetch, initialMutations]);

  const handleConfigChange = useCallback((key: string, config: Partial<FieldConfig>) => {
    setConfigs((prev) => {
      const existing = prev[key] || { key, operation: 'Random' as const };
      return {
        ...prev,
        [key]: {
          ...existing,
          ...config,
          key,
        },
      };
    });
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    // Filtrar solo las configuraciones que no son "Random" por defecto
    const mutations: FieldConfig[] = Object.values(configs).filter(
      (c) => c.operation !== 'Random' || c.value !== undefined || c.minValue !== undefined || c.listValues !== undefined
    );
    onSave(mutations);
    onOpenChange(false);
  }, [configs, onSave, onOpenChange]);

  const handleReset = useCallback(() => {
    // Resetear todas las configs a Random
    const resetConfigs: Record<string, FieldConfig> = {};
    fields.forEach((field) => {
      resetConfigs[field.key] = {
        key: field.key,
        operation: 'Random',
      };
    });
    setConfigs(resetConfigs);
    setHasChanges(true);
  }, [fields]);

  // Contar configuraciones personalizadas
  const customConfigCount = Object.values(configs).filter(
    (c) => c.operation !== 'Random'
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[90vw] h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Configurar Mutaciones de Campos
            {templateName && (
              <Badge variant="secondary" className="ml-2">
                {templateName}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-3">
          {/* Info bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {fields.length} campos detectados
              </span>
              {customConfigCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  {customConfigCount} personalizados
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Resetear todos
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Analizando JSON...</span>
              </div>
            ) : fields.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No se detectaron campos en el JSON
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-2">
                  <JsonVisualizer
                    jsonContent={jsonContent}
                    fields={fields}
                    configs={configs}
                    onConfigChange={handleConfigChange}
                  />
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-2">
            <span className="font-medium">Operaciones:</span>
            <span>🎲 Aleatorio</span>
            <span>🔒 Fijo</span>
            <span>❌ NULL</span>
            <span>↔️ Rango</span>
            <span>📋 Lista</span>
            <span>✓ Original</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges && initialMutations.length === 0}>
            <Check className="w-4 h-4 mr-2" />
            Guardar Configuración
            {customConfigCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {customConfigCount}
              </Badge>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
