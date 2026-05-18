import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ExecutionDraft, WizardStep, StepValidation } from './types';
import {
  Globe,
  FileJson,
  Settings2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionConfigSummaryProps {
  draft: ExecutionDraft;
  allValidations: Record<WizardStep, StepValidation>;
  warnings: string[];
  estimatedDuration: string;
  onGoToStep: (step: WizardStep) => void;
  className?: string;
}

export const ExecutionConfigSummary = memo(function ExecutionConfigSummary({
  draft,
  allValidations,
  warnings,
  estimatedDuration,
  onGoToStep,
  className,
}: ExecutionConfigSummaryProps) {
  // Get missing items
  const missingItems: string[] = [];
  if (!allValidations[0].isValid) missingItems.push('Endpoint');
  if (!allValidations[1].isValid) missingItems.push('Body');
  if (!allValidations[2].isValid) missingItems.push('Modo');

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Resumen de Configuración</span>
          {missingItems.length > 0 && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30">
              {missingItems.length} pendiente{missingItems.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Missing items */}
        {missingItems.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-3 border-b">
            {missingItems.map((item) => (
              <Badge key={item} variant="destructive" className="text-xs gap-1">
                <AlertCircle className="w-3 h-3" />
                Falta {item}
              </Badge>
            ))}
          </div>
        )}

        {/* Accordion sections */}
        <Accordion type="multiple" defaultValue={['endpoint', 'body', 'mode']} className="space-y-2">
          {/* Endpoint section */}
          <AccordionItem value="endpoint" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Globe className={cn(
                  'w-4 h-4',
                  allValidations[0].isValid ? 'text-green-500' : 'text-muted-foreground'
                )} />
                <span className="text-sm font-medium">Endpoint</span>
                {!allValidations[0].isValid && (
                  <Badge variant="outline" className="text-xs text-amber-600">Pendiente</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {draft.endpointId ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {draft.endpointMethod}
                    </Badge>
                    <span className="text-sm font-medium truncate">{draft.endpointName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {draft.endpointUrl}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs w-full mt-1"
                    onClick={() => onGoToStep(0)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground mb-2">Sin endpoint seleccionado</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onGoToStep(0)}
                  >
                    Seleccionar
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Body section */}
          <AccordionItem value="body" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <FileJson className={cn(
                  'w-4 h-4',
                  allValidations[1].isValid ? 'text-green-500' : 'text-muted-foreground'
                )} />
                <span className="text-sm font-medium">Body</span>
                {!allValidations[1].isValid && (
                  <Badge variant="outline" className="text-xs text-amber-600">Pendiente</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs">
                  {draft.bodyMode === 'static' && 'JSON Estático'}
                  {draft.bodyMode === 'template' && 'Template'}
                  {draft.bodyMode === 'template_mutation' && 'Template + Mutación'}
                </Badge>
                
                {draft.templateName && (
                  <p className="text-sm truncate">{draft.templateName}</p>
                )}
                
                {draft.bodyMode === 'template_mutation' && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {draft.mutationMode === 'preset'
                        ? draft.mutationPresetName || 'Sin preset'
                        : draft.mutationMode === 'saved_data'
                          ? `Guardado: ${draft.dataPresetName || '—'}`
                          : 'Manual'}
                    </span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs w-full mt-1"
                  onClick={() => onGoToStep(1)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Mode section */}
          <AccordionItem value="mode" className="border rounded-lg px-3">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings2 className={cn(
                  'w-4 h-4',
                  allValidations[2].isValid ? 'text-green-500' : 'text-muted-foreground'
                )} />
                <span className="text-sm font-medium">Modo</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Requests</span>
                  <span className="text-sm font-mono font-medium">{draft.requestCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Modo</span>
                  <Badge variant="outline" className="text-xs">
                    {draft.executionMode === 'sequential' && 'Secuencial'}
                    {draft.executionMode === 'parallel' && 'Paralelo'}
                    {draft.executionMode === 'burst' && 'Ráfaga'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Intervalo</span>
                  <span className="text-sm font-mono">{draft.intervalMs}ms</span>
                </div>
                {draft.regenerateJsonPerRequest && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <RefreshCw className="w-3 h-3" />
                    <span className="text-xs">Regenera JSON</span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs w-full mt-1"
                  onClick={() => onGoToStep(2)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        {/* Estimation */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Duración estimada</span>
          </div>
          <span className="text-sm font-mono font-medium">{estimatedDuration}</span>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
