import { useState, useMemo, memo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templatesApi, presetsApi } from '@/services/api';
import type { ExecutionDraft, BodyMode, MutationMode } from './types';
import { isValidJson } from './validators';
import {
  FileJson,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Copy,
  Wand2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepBodyProps {
  draft: ExecutionDraft;
  updateDraft: (updates: Partial<ExecutionDraft>) => void;
  validation: { isValid: boolean; errors: string[] };
}

const BODY_MODES: { value: BodyMode; title: string; description: string; ideal: string; icon: React.ElementType }[] = [
  {
    value: 'static',
    title: 'JSON Estático',
    description: 'Pegar o escribir un JSON fijo',
    ideal: 'Pruebas simples con payload fijo',
    icon: FileText,
  },
  {
    value: 'template',
    title: 'Desde Template',
    description: 'Usar un template guardado',
    ideal: 'Reutilizar estructuras existentes',
    icon: FileJson,
  },
  {
    value: 'template_mutation',
    title: 'Template + Mutación',
    description: 'Template con campos que cambian',
    ideal: 'Pruebas de carga con datos variados',
    icon: Sparkles,
  },
];

export const StepBody = memo(function StepBody({
  draft,
  updateDraft,
  validation,
}: StepBodyProps) {
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Check if body is needed
  const noBodyMethods = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
  const needsBody = !noBodyMethods.includes(draft.endpointMethod.toUpperCase());

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
    enabled: needsBody,
  });

  // Fetch presets
  const { data: presetCategories } = useQuery({
    queryKey: ['presets-grouped'],
    queryFn: () => presetsApi.getGrouped().then((res) => res.data),
    enabled: needsBody && draft.bodyMode === 'template_mutation',
  });

  // Get selected template content
  const selectedTemplate = useMemo(() => {
    if (!draft.templateId || !templates) return null;
    return templates.find((t) => t.id === draft.templateId) || null;
  }, [draft.templateId, templates]);

  // Get preview JSON
  const previewJson = useMemo(() => {
    if (draft.bodyMode === 'static') {
      return draft.staticJson;
    }
    if (selectedTemplate) {
      return selectedTemplate.content;
    }
    return '{}';
  }, [draft.bodyMode, draft.staticJson, selectedTemplate]);

  const previewSize = useMemo(() => {
    const bytes = new Blob([previewJson]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }, [previewJson]);

  const handleCopyPreview = useCallback(async () => {
    await navigator.clipboard.writeText(previewJson);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  }, [previewJson]);

  const handleFormatJson = useCallback(() => {
    try {
      const formatted = JSON.stringify(JSON.parse(draft.staticJson), null, 2);
      updateDraft({ staticJson: formatted });
    } catch {}
  }, [draft.staticJson, updateDraft]);

  // If no body needed
  if (!needsBody) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="font-medium mb-1">Body no requerido</h3>
          <p className="text-sm text-muted-foreground">
            Las requests {draft.endpointMethod} no llevan body. Puedes continuar al siguiente paso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Body mode selector */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Modo de Body</Label>
        <RadioGroup
          value={draft.bodyMode}
          onValueChange={(value) => updateDraft({ bodyMode: value as BodyMode })}
          className="grid grid-cols-3 gap-3"
        >
          {BODY_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all',
                draft.bodyMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value={mode.value} className="sr-only" />
              <div className="flex items-center gap-2 mb-2">
                <mode.icon className={cn(
                  'w-5 h-5',
                  draft.bodyMode === mode.value ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className="font-medium text-sm">{mode.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{mode.description}</p>
              <p className="text-xs text-muted-foreground/70 italic">Ideal: {mode.ideal}</p>
              {draft.bodyMode === mode.value && (
                <Check className="absolute top-3 right-3 w-4 h-4 text-primary" />
              )}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Mode-specific config */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Static JSON */}
          {draft.bodyMode === 'static' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">JSON Body</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleFormatJson}
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1" />
                    Formatear
                  </Button>
                  <Badge
                    variant={isValidJson(draft.staticJson) ? 'outline' : 'destructive'}
                    className="text-xs"
                  >
                    {isValidJson(draft.staticJson) ? 'JSON válido' : 'JSON inválido'}
                  </Badge>
                </div>
              </div>
              <Textarea
                value={draft.staticJson}
                onChange={(e) => updateDraft({ staticJson: e.target.value })}
                placeholder='{\n  "field": "value"\n}'
                className="font-mono text-sm h-48 resize-none"
              />
            </div>
          )}

          {/* Template selection */}
          {(draft.bodyMode === 'template' || draft.bodyMode === 'template_mutation') && (
            <div className="space-y-3">
              <Label className="text-sm">Template</Label>
              <Select
                value={draft.templateId?.toString() || ''}
                onValueChange={(value) => {
                  const template = templates?.find((t) => t.id === parseInt(value));
                  updateDraft({
                    templateId: parseInt(value),
                    templateName: template?.name || null,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-muted-foreground" />
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground">
                            — {template.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mutation config */}
          {draft.bodyMode === 'template_mutation' && draft.templateId && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label className="text-sm">Configuración de Mutación</Label>
              </div>

              <Tabs
                value={draft.mutationMode}
                onValueChange={(v) => updateDraft({ mutationMode: v as MutationMode })}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="preset" className="flex-1">
                    Usar Preset
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex-1">
                    Manual
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preset" className="mt-3">
                  <Select
                    value={draft.mutationPresetName || ''}
                    onValueChange={(value) => updateDraft({ mutationPresetName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presetCategories?.map((category) => (
                        <div key={category.category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {category.category}
                          </div>
                          {category.presets.map((preset) => (
                            <SelectItem key={preset.name} value={preset.name}>
                              <div>
                                <span>{preset.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {preset.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Los presets aplican mutaciones predefinidas a cada campo según su tipo
                  </p>
                </TabsContent>

                <TabsContent value="manual" className="mt-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Reglas de mutación (JSON)
                    </Label>
                    <Textarea
                      value={draft.mutationRulesJson}
                      onChange={(e) => updateDraft({ mutationRulesJson: e.target.value })}
                      placeholder='[{"key": "field", "operation": "Random"}]'
                      className="font-mono text-xs h-32 resize-none"
                    />
                    <Badge
                      variant={isValidJson(draft.mutationRulesJson) ? 'outline' : 'destructive'}
                      className="text-xs"
                    >
                      {isValidJson(draft.mutationRulesJson) ? 'JSON válido' : 'JSON inválido'}
                    </Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
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

      {/* Preview (collapsible) */}
      <Accordion type="single" collapsible>
        <AccordionItem value="preview" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3">
              <FileJson className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview del JSON</span>
              <Badge variant="secondary" className="text-xs">{previewSize}</Badge>
              {draft.bodyMode === 'template_mutation' && (
                <Badge variant="outline" className="text-xs text-primary">
                  Se regenerará en cada request
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="relative">
              <ScrollArea className="h-48 rounded-lg bg-zinc-950 p-3">
                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(previewJson), null, 2);
                    } catch {
                      return previewJson;
                    }
                  })()}
                </pre>
              </ScrollArea>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs"
                onClick={handleCopyPreview}
              >
                {copiedPreview ? (
                  <><Check className="w-3 h-3 mr-1" />Copiado</>
                ) : (
                  <><Copy className="w-3 h-3 mr-1" />Copiar</>
                )}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
});
