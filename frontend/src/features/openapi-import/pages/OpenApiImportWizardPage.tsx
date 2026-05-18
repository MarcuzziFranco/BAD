import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { openapiCatalogsApi } from '../api/openapi-catalogs.api';
import { ApplyOptionsPanel } from '../components/ApplyOptionsPanel';
import { ApplyResultSummary } from '../components/ApplyResultSummary';
import { OperationPreviewTable } from '../components/OperationPreviewTable';
import type { ApplyOptions, OpenApiApplyResponse, OpenApiCatalogDetail } from '../types/openapi.types';

type Step = 'upload' | 'preview' | 'done';

const defaultApplyOptions: ApplyOptions = {
  updateExisting: true,
  createTemplates: true,
  createServices: true,
};

export function OpenApiImportWizardPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [specJson, setSpecJson] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:5001');
  const [name, setName] = useState('');
  const [catalog, setCatalog] = useState<OpenApiCatalogDetail | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [applyOptions, setApplyOptions] = useState<ApplyOptions>(defaultApplyOptions);
  const [applyResult, setApplyResult] = useState<OpenApiApplyResponse | null>(null);

  const selectedOps = useMemo(
    () => catalog?.operations.filter((o) => selectedKeys.has(o.operationKey)) ?? [],
    [catalog, selectedKeys],
  );
  const withBodyCount = selectedOps.filter((o) => o.hasRequestBody).length;

  const analyzeMutation = useMutation({
    mutationFn: () =>
      openapiCatalogsApi
        .create({
          specJson,
          baseUrl: baseUrl.trim(),
          name: name.trim() || undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setCatalog(data);
      const withBody = data.operations
        .filter((o) => o.hasRequestBody && o.changeKind !== 'removed')
        .map((o) => o.operationKey);
      setSelectedKeys(new Set(withBody));
      setStep('preview');
      toast.success(`${data.operations.length} operaciones analizadas`);
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(msg ?? 'Error al analizar OpenAPI');
    },
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      openapiCatalogsApi
        .apply(catalog!.id, {
          operationKeys: [...selectedKeys],
          ...applyOptions,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setCatalog((c) => (c ? { ...c, operations: data.operations } : c));
      setApplyResult(data);
      setStep('done');
      if (data.templatesCreated === 0 && applyOptions.createTemplates && withBodyCount > 0) {
        toast.warning('No se crearon templates. Revise que las operaciones tengan body.');
      } else {
        toast.success('Importación aplicada');
      }
    },
    onError: () => toast.error('Error al aplicar selección'),
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setSpecJson(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 p-1 max-w-5xl">
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Importaciones', href: '/openapi' },
          { label: 'Nueva importación' },
        ]}
      />
      <h1 className="text-2xl font-semibold">Nueva importación OpenAPI 3.x</h1>

      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 1 — Especificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://localhost:5001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre (opcional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Se usa info.title si está vacío"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Archivo JSON o YAML</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spec">O pegar documento</Label>
              <Textarea
                id="spec"
                className="font-mono text-xs min-h-[240px]"
                value={specJson}
                onChange={(e) => setSpecJson(e.target.value)}
                placeholder='{ "openapi": "3.0.1", ... }'
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tras analizar podrá elegir qué operaciones importan templates (body) y servicios.
              La autenticación se configura manualmente en cada servicio.
            </p>
            <Button
              disabled={!specJson.trim() || !baseUrl.trim() || analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
            >
              {analyzeMutation.isPending ? 'Analizando…' : 'Analizar y continuar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && catalog && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 2 — Seleccionar y aplicar</CardTitle>
            <p className="text-sm text-muted-foreground">
              {catalog.name} · {catalog.operations.length} operaciones
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApplyOptionsPanel
              options={applyOptions}
              onChange={setApplyOptions}
              selectedCount={selectedKeys.size}
              withBodyCount={withBodyCount}
            />
            <OperationPreviewTable
              operations={catalog.operations}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Atrás
              </Button>
              <Button
                disabled={
                  selectedKeys.size === 0 ||
                  applyMutation.isPending ||
                  (!applyOptions.createTemplates && !applyOptions.createServices)
                }
                onClick={() => applyMutation.mutate()}
              >
                {applyMutation.isPending ? 'Aplicando…' : 'Aplicar selección'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'done' && catalog && applyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 3 — Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApplyResultSummary result={applyResult} />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate(`/openapi/${catalog.id}`)}>
                Gestionar catálogo
              </Button>
              <Button variant="outline" onClick={() => navigate('/servicios')}>
                Ver servicios
              </Button>
              <Button variant="outline" onClick={() => navigate('/templates')}>
                Ver templates
              </Button>
              {applyResult.templatesCreated === 0 && applyOptions.createTemplates && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setApplyOptions({ ...applyOptions, createTemplates: true, createServices: false });
                    setStep('preview');
                  }}
                >
                  Reintentar solo templates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
