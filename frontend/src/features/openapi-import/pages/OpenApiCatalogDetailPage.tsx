import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { openapiCatalogsApi } from '../api/openapi-catalogs.api';
import { ApplyOptionsPanel } from '../components/ApplyOptionsPanel';
import { ApplyResultSummary } from '../components/ApplyResultSummary';
import { OperationPreviewTable } from '../components/OperationPreviewTable';
import { ReimportDiffBanner } from '../components/ReimportDiffBanner';
import type { ApplyOptions, OpenApiApplyResponse } from '../types/openapi.types';

const defaultApplyOptions: ApplyOptions = {
  updateExisting: true,
  createTemplates: true,
  createServices: true,
};

export function OpenApiCatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const catalogId = Number(id);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [baseUrl, setBaseUrl] = useState('');
  const [reimportSpec, setReimportSpec] = useState<string | null>(null);
  const [applyOptions, setApplyOptions] = useState<ApplyOptions>(defaultApplyOptions);
  const [lastDiff, setLastDiff] = useState({ newCount: 0, modifiedCount: 0, removedCount: 0 });
  const [lastApply, setLastApply] = useState<OpenApiApplyResponse | null>(null);

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['openapi-catalog', catalogId],
    queryFn: () => openapiCatalogsApi.getById(catalogId).then((r) => r.data),
    enabled: Number.isFinite(catalogId),
  });

  useEffect(() => {
    if (catalog) setBaseUrl(catalog.baseUrl);
  }, [catalog?.id, catalog?.baseUrl]);

  const stats = useMemo(() => {
    if (!catalog) return null;
    const ops = catalog.operations.filter((o) => o.changeKind !== 'removed');
    return {
      total: ops.length,
      templates: ops.filter((o) => o.jsonTemplateId).length,
      services: ops.filter((o) => o.requestConfigId).length,
      missingTemplates: ops.filter((o) => o.hasRequestBody && !o.jsonTemplateId).length,
    };
  }, [catalog]);

  const selectedOps = useMemo(
    () => catalog?.operations.filter((o) => selectedKeys.has(o.operationKey)) ?? [],
    [catalog, selectedKeys],
  );
  const withBodyCount = selectedOps.filter((o) => o.hasRequestBody).length;

  const analyzeMutation = useMutation({
    mutationFn: () =>
      openapiCatalogsApi
        .analyze(catalogId, {
          baseUrl: baseUrl.trim() || undefined,
          specJson: reimportSpec ?? undefined,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['openapi-catalog', catalogId], data.catalog);
      setLastDiff({
        newCount: data.newCount,
        modifiedCount: data.modifiedCount,
        removedCount: data.removedCount,
      });
      setReimportSpec(null);
      const modified = data.catalog.operations
        .filter((o) => o.changeKind === 'new' || o.changeKind === 'modified')
        .map((o) => o.operationKey);
      if (modified.length > 0) setSelectedKeys(new Set(modified));
      toast.success('Spec actualizada y re-analizada');
    },
    onError: () => toast.error('Error al re-analizar'),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      openapiCatalogsApi
        .apply(catalogId, {
          operationKeys: [...selectedKeys],
          ...applyOptions,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setLastApply(data);
      queryClient.invalidateQueries({ queryKey: ['openapi-catalog', catalogId] });
      queryClient.invalidateQueries({ queryKey: ['openapi-catalogs'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success(
        `${data.templatesCreated} template(s), ${data.servicesCreated} servicio(s)`,
      );
    },
    onError: () => toast.error('Error al aplicar'),
  });

  const handleReimportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setReimportSpec(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  if (isLoading) return <p className="p-4 text-sm text-muted-foreground">Cargando…</p>;
  if (!catalog) return <p className="p-4 text-sm text-destructive">Catálogo no encontrado.</p>;

  return (
    <div className="space-y-4 p-1 max-w-5xl">
      <PageBreadcrumb
        items={[
          { label: 'Dashboard', href: '/' },
          { label: 'Importaciones', href: '/openapi' },
          { label: catalog.name },
        ]}
      />

      <div className="flex flex-wrap justify-between gap-2 items-start">
        <div>
          <h1 className="text-2xl font-semibold">{catalog.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{catalog.baseUrl}</p>
          <p className="text-xs text-muted-foreground mt-1">
            OpenAPI {catalog.openApiVersion}
            {catalog.infoVersion ? ` · API v${catalog.infoVersion}` : ''}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/openapi/import">Nueva importación</Link>
        </Button>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Operaciones</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Templates</p>
              <p className="text-2xl font-semibold">{stats.templates}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Servicios</p>
              <p className="text-2xl font-semibold">{stats.services}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Sin template (con body)</p>
              <p className="text-2xl font-semibold text-amber-600">{stats.missingTemplates}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actualizar versión OpenAPI</CardTitle>
          <p className="text-sm text-muted-foreground">
            Suba una spec nueva para detectar cambios sin perder vínculos existentes.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
            <div className="space-y-1">
              <Label>Base URL</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nueva spec (JSON/YAML)</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".json,.yaml,.yml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReimportFile(f);
                }}
              />
            </div>
          </div>
          {reimportSpec && (
            <p className="text-xs text-green-600">Archivo cargado. Pulse re-analizar para comparar.</p>
          )}
          <Button
            variant="secondary"
            disabled={analyzeMutation.isPending}
            onClick={() => analyzeMutation.mutate()}
          >
            {analyzeMutation.isPending ? 'Analizando…' : 'Re-analizar spec'}
          </Button>
          <ReimportDiffBanner {...lastDiff} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Operaciones y recursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApplyOptionsPanel
            options={applyOptions}
            onChange={setApplyOptions}
            selectedCount={selectedKeys.size}
            withBodyCount={withBodyCount}
          />
          {stats && stats.missingTemplates > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setApplyOptions({
                  updateExisting: true,
                  createTemplates: true,
                  createServices: false,
                });
                setSelectedKeys(
                  new Set(
                    catalog.operations
                      .filter((o) => o.hasRequestBody && !o.jsonTemplateId)
                      .map((o) => o.operationKey),
                  ),
                );
              }}
            >
              Reparar {stats.missingTemplates} template(s) faltante(s)
            </Button>
          )}
          <OperationPreviewTable
            operations={catalog.operations}
            selectedKeys={selectedKeys}
            onSelectionChange={setSelectedKeys}
          />
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
          {lastApply && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Última aplicación</p>
              <ApplyResultSummary result={lastApply} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
