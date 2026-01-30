import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ExecutionDraft, ExecutionMode } from './types';
import {
  ArrowRight,
  Layers,
  Zap,
  Check,
  AlertCircle,
  Clock,
  RefreshCw,
  Settings2,
  StopCircle,
  Save,
  Timer,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepModeProps {
  draft: ExecutionDraft;
  updateDraft: (updates: Partial<ExecutionDraft>) => void;
  validation: { isValid: boolean; errors: string[] };
}

const REQUEST_PRESETS = [10, 50, 100, 500, 1000];
const INTERVAL_PRESETS = [0, 100, 500, 1000, 2000];

const EXECUTION_MODES: {
  value: ExecutionMode;
  title: string;
  description: string;
  ideal: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'sequential',
    title: 'Secuencial',
    description: 'Una request tras otra',
    ideal: 'Pruebas ordenadas y predecibles',
    icon: ArrowRight,
  },
  {
    value: 'parallel',
    title: 'Paralelo',
    description: 'Múltiples requests simultáneas',
    ideal: 'Simular carga concurrente',
    icon: Layers,
  },
  {
    value: 'burst',
    title: 'Ráfaga',
    description: 'Lotes de requests en bloque',
    ideal: 'Pruebas de stress intensivo',
    icon: Zap,
  },
];

export const StepMode = memo(function StepMode({
  draft,
  updateDraft,
  validation,
}: StepModeProps) {
  return (
    <div className="space-y-4">
      {/* Request count */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Cantidad de Requests</Label>
              <span className="text-xs text-muted-foreground">
                Total de requests a enviar
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={10000}
                value={draft.requestCount}
                onChange={(e) => updateDraft({ requestCount: parseInt(e.target.value) || 1 })}
                className="w-32 font-mono"
              />
              <div className="flex items-center gap-1">
                {REQUEST_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={draft.requestCount === preset ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => updateDraft({ requestCount: preset })}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution mode */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Modo de Ejecución</Label>
        <RadioGroup
          value={draft.executionMode}
          onValueChange={(value) => updateDraft({ executionMode: value as ExecutionMode })}
          className="grid grid-cols-3 gap-3"
        >
          {EXECUTION_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all',
                draft.executionMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value={mode.value} className="sr-only" />
              <div className="flex items-center gap-2 mb-2">
                <mode.icon className={cn(
                  'w-5 h-5',
                  draft.executionMode === mode.value ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className="font-medium text-sm">{mode.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{mode.description}</p>
              <p className="text-xs text-muted-foreground/70 italic">Ideal: {mode.ideal}</p>
              {draft.executionMode === mode.value && (
                <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
              )}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Interval */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Intervalo entre Requests</Label>
              </div>
              <span className="text-xs text-muted-foreground">
                0 = sin espera
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={60000}
                value={draft.intervalMs}
                onChange={(e) => updateDraft({ intervalMs: parseInt(e.target.value) || 0 })}
                className="w-32 font-mono"
              />
              <span className="text-sm text-muted-foreground">ms</span>
              <div className="flex items-center gap-1">
                {INTERVAL_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={draft.intervalMs === preset ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => updateDraft({ intervalMs: preset })}
                  >
                    {preset === 0 ? '0' : `${preset}ms`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate JSON */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className={cn(
                'w-5 h-5',
                draft.regenerateJsonPerRequest ? 'text-primary' : 'text-muted-foreground'
              )} />
              <div>
                <Label className="text-sm font-medium">Regenerar JSON en cada request</Label>
                <p className="text-xs text-muted-foreground">
                  Genera un nuevo JSON con mutaciones para cada request
                </p>
              </div>
            </div>
            <Switch
              checked={draft.regenerateJsonPerRequest}
              onCheckedChange={(checked) => updateDraft({ regenerateJsonPerRequest: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation errors */}
      {!validation.isValid && validation.errors.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Advanced options */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Opciones Avanzadas</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            {/* Concurrency (for parallel) */}
            {draft.executionMode === 'parallel' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm">Concurrencia</Label>
                    <p className="text-xs text-muted-foreground">Requests simultáneas máximas</p>
                  </div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={draft.concurrency}
                  onChange={(e) => updateDraft({ concurrency: parseInt(e.target.value) || 1 })}
                  className="w-24 font-mono"
                />
              </div>
            )}

            {/* Burst size (for burst) */}
            {draft.executionMode === 'burst' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm">Tamaño de Ráfaga</Label>
                    <p className="text-xs text-muted-foreground">Requests por lote</p>
                  </div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={draft.burstSize}
                  onChange={(e) => updateDraft({ burstSize: parseInt(e.target.value) || 1 })}
                  className="w-24 font-mono"
                />
              </div>
            )}

            {/* Timeout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Timeout por request</Label>
                  <p className="text-xs text-muted-foreground">Tiempo máximo de espera (ms)</p>
                </div>
              </div>
              <Input
                type="number"
                min={1000}
                max={300000}
                value={draft.timeoutMs}
                onChange={(e) => updateDraft({ timeoutMs: parseInt(e.target.value) || 30000 })}
                className="w-24 font-mono"
              />
            </div>

            {/* Retries */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Reintentos</Label>
                  <p className="text-xs text-muted-foreground">Reintentos en caso de error</p>
                </div>
              </div>
              <Input
                type="number"
                min={0}
                max={5}
                value={draft.retryCount}
                onChange={(e) => updateDraft({ retryCount: parseInt(e.target.value) || 0 })}
                className="w-24 font-mono"
              />
            </div>

            {/* Stop on first error */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StopCircle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Parar en primer error</Label>
                  <p className="text-xs text-muted-foreground">Detiene la ejecución si hay error</p>
                </div>
              </div>
              <Switch
                checked={draft.stopOnFirstError}
                onCheckedChange={(checked) => updateDraft({ stopOnFirstError: checked })}
              />
            </div>

            {/* Save full requests */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm">Guardar requests completas</Label>
                  <p className="text-xs text-muted-foreground">Almacena body de request/response</p>
                </div>
              </div>
              <Switch
                checked={draft.saveFullRequests}
                onCheckedChange={(checked) => updateDraft({ saveFullRequests: checked })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
