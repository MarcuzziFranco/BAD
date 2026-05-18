import { Checkbox } from '@/components/ui/checkbox';
import type { ApplyOptions } from '../types/openapi.types';

interface ApplyOptionsPanelProps {
  options: ApplyOptions;
  onChange: (options: ApplyOptions) => void;
  selectedCount: number;
  withBodyCount: number;
}

export function ApplyOptionsPanel({
  options,
  onChange,
  selectedCount,
  withBodyCount,
}: ApplyOptionsPanelProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">Opciones de aplicación</p>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={options.createTemplates}
            onCheckedChange={(v) => onChange({ ...options, createTemplates: v === true })}
          />
          Crear templates JSON (body)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={options.createServices}
            onCheckedChange={(v) => onChange({ ...options, createServices: v === true })}
          />
          Crear servicios
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={options.updateExisting}
            onCheckedChange={(v) => onChange({ ...options, updateExisting: v === true })}
          />
          Actualizar existentes
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedCount} operación(es) seleccionada(s) · {withBodyCount} con body (pueden generar
        template). Si solo creó servicios antes, active templates y vuelva a aplicar.
      </p>
    </div>
  );
}
