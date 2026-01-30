import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Layers, Zap } from 'lucide-react';

export type ExecutionMode = 'sequential' | 'parallel' | 'burst';

interface StepExecutionModeProps {
  requestCount: number;
  onRequestCountChange: (count: number) => void;
  executionMode: ExecutionMode;
  onExecutionModeChange: (mode: ExecutionMode) => void;
  intervalMs: number;
  onIntervalMsChange: (ms: number) => void;
  mutatePerIteration: boolean;
  onMutatePerIterationChange: (value: boolean) => void;
}

const QUICK_COUNTS = [10, 50, 100, 500, 1000];

export function StepExecutionMode({
  requestCount,
  onRequestCountChange,
  executionMode,
  onExecutionModeChange,
  intervalMs,
  onIntervalMsChange,
  mutatePerIteration,
  onMutatePerIterationChange,
}: StepExecutionModeProps) {
  return (
    <div className="space-y-6">
      {/* Cantidad de requests */}
      <div>
        <Label className="text-base font-medium">Cantidad de Requests</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Número total de requests a ejecutar
        </p>
        <div className="flex items-center gap-4">
          <Input
            type="number"
            min={1}
            max={10000}
            value={requestCount}
            onChange={(e) => onRequestCountChange(parseInt(e.target.value) || 1)}
            className="w-32"
          />
          <div className="flex gap-1">
            {QUICK_COUNTS.map((count) => (
              <Button
                key={count}
                variant={requestCount === count ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRequestCountChange(count)}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Modo de ejecución */}
      <div>
        <Label className="text-base font-medium">Modo de Ejecución</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Cómo se enviarán las requests
        </p>
        <RadioGroup
          value={executionMode}
          onValueChange={(v) => onExecutionModeChange(v as ExecutionMode)}
          className="grid grid-cols-3 gap-3"
        >
          <Label
            htmlFor="exec-sequential"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
              executionMode === 'sequential' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="sequential" id="exec-sequential" className="sr-only" />
            <ArrowRight className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium text-sm">Secuencial</p>
              <p className="text-xs text-muted-foreground">Una tras otra</p>
            </div>
          </Label>
          <Label
            htmlFor="exec-parallel"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
              executionMode === 'parallel' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="parallel" id="exec-parallel" className="sr-only" />
            <Layers className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium text-sm">Paralelo</p>
              <p className="text-xs text-muted-foreground">Simultáneas</p>
            </div>
          </Label>
          <Label
            htmlFor="exec-burst"
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
              executionMode === 'burst' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            }`}
          >
            <RadioGroupItem value="burst" id="exec-burst" className="sr-only" />
            <Zap className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium text-sm">Ráfaga</p>
              <p className="text-xs text-muted-foreground">Lotes de 10</p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Intervalo */}
      {(executionMode === 'sequential' || executionMode === 'burst') && (
        <div>
          <Label className="text-base font-medium">
            Intervalo {executionMode === 'burst' ? 'entre Ráfagas' : 'entre Requests'}
          </Label>
          <p className="text-sm text-muted-foreground mb-3">
            Tiempo de espera en milisegundos (0 = sin espera)
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={0}
              max={60000}
              step={100}
              value={intervalMs}
              onChange={(e) => onIntervalMsChange(parseInt(e.target.value) || 0)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">ms</span>
            <div className="flex gap-1">
              {[0, 100, 500, 1000, 2000].map((ms) => (
                <Button
                  key={ms}
                  variant={intervalMs === ms ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onIntervalMsChange(ms)}
                >
                  {ms === 0 ? '0' : `${ms}ms`}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mutar por iteración */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Regenerar JSON en cada request</p>
            <p className="text-sm text-muted-foreground">
              Si está activo, se generará un JSON diferente (con nuevos valores aleatorios) para cada request
            </p>
          </div>
          <Switch
            checked={mutatePerIteration}
            onCheckedChange={onMutatePerIterationChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
