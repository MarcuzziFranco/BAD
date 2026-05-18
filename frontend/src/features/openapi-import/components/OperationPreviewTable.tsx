import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OpenApiOperationPreview } from '../types/openapi.types';
import { SampleJsonPreview } from './SampleJsonPreview';

interface OperationPreviewTableProps {
  operations: OpenApiOperationPreview[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
}

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/10 text-green-600',
  POST: 'bg-blue-500/10 text-blue-600',
  PUT: 'bg-yellow-500/10 text-yellow-600',
  PATCH: 'bg-orange-500/10 text-orange-600',
  DELETE: 'bg-red-500/10 text-red-600',
};

export function OperationPreviewTable({
  operations,
  selectedKeys,
  onSelectionChange,
}: OperationPreviewTableProps) {
  const [tagFilter, setTagFilter] = useState('');
  const [search, setSearch] = useState('');

  const tags = useMemo(
    () => [...new Set(operations.map((o) => o.tag ?? 'Default'))].sort(),
    [operations],
  );

  const filtered = useMemo(() => {
    return operations.filter((op) => {
      if (tagFilter && (op.tag ?? 'Default') !== tagFilter) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        op.operationKey.toLowerCase().includes(q) ||
        (op.summary?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [operations, tagFilter, search]);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(filtered.map((o) => o.operationKey)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const toggleOne = (key: string, checked: boolean) => {
    const next = new Set(selectedKeys);
    if (checked) next.add(key);
    else next.delete(key);
    onSelectionChange(next);
  };

  const selectWithBody = () => {
    onSelectionChange(
      new Set(operations.filter((o) => o.hasRequestBody).map((o) => o.operationKey)),
    );
  };

  const selectMissingTemplates = () => {
    onSelectionChange(
      new Set(
        operations
          .filter((o) => o.hasRequestBody && !o.jsonTemplateId && o.changeKind !== 'removed')
          .map((o) => o.operationKey),
      ),
    );
  };

  const allSelected =
    filtered.length > 0 && filtered.every((o) => selectedKeys.has(o.operationKey));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar operación…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <option value="">Todos los tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" size="sm" onClick={() => toggleAll(true)}>
          Seleccionar visibles
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => toggleAll(false)}>
          Limpiar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectWithBody}>
          Con body
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={selectMissingTemplates}>
          Sin template
        </Button>
      </div>

      <div className="rounded-lg border overflow-auto max-h-[min(60vh,520px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(v === true)}
                />
              </TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Ejemplo</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((op) => (
              <TableRow
                key={op.operationKey}
                className={op.changeKind === 'removed' ? 'opacity-60 bg-muted/20' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedKeys.has(op.operationKey)}
                    onCheckedChange={(v) => toggleOne(op.operationKey, v === true)}
                  />
                </TableCell>
                <TableCell className="text-xs">{op.tag}</TableCell>
                <TableCell>
                  <Badge className={methodColors[op.method] ?? ''} variant="secondary">
                    {op.method}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[200px] truncate" title={op.path}>
                  {op.path}
                </TableCell>
                <TableCell className="text-xs">
                  {op.hasRequestBody ? (
                    op.sampleJson ? (
                      'Sí'
                    ) : (
                      <span className="text-amber-600" title="Se usará {} al aplicar">
                        Sí*
                      </span>
                    )
                  ) : (
                    'No'
                  )}
                </TableCell>
                <TableCell>
                  <SampleJsonPreview json={op.sampleJson} />
                </TableCell>
                <TableCell className="text-xs">
                  {op.jsonTemplateId ? (
                    <Link
                      to={`/template-edit/${op.jsonTemplateId}`}
                      className="text-primary hover:underline"
                    >
                      #{op.jsonTemplateId}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {op.requestConfigId ? (
                    <Link
                      to={`/servicios-edit/${op.requestConfigId}`}
                      className="text-primary hover:underline"
                    >
                      #{op.requestConfigId}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                  {op.changeKind && op.changeKind !== 'unchanged' && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {op.changeKind}
                    </Badge>
                  )}
                  {op.importStatus === 'linked' || op.requestConfigId ? (
                    <Badge variant="default">Vinculado</Badge>
                  ) : op.importStatus === 'error' ? (
                    <Badge variant="destructive" title={op.error ?? undefined}>
                      Error
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedKeys.size} seleccionada(s) · {filtered.length} visible(s) de {operations.length}
      </p>
    </div>
  );
}

