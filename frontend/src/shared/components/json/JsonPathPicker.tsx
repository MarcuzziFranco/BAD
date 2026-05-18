import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { buildJsonPath, parseJsonSafe } from './jsonPathUtils';

interface JsonTreeNodeProps {
  data: unknown;
  name?: string;
  path: string;
  level?: number;
  selectedPath?: string | null;
  onPathSelect?: (path: string) => void;
  selectable?: boolean;
}

function JsonTreeNode({
  data,
  name,
  path,
  level = 0,
  selectedPath,
  onPathSelect,
  selectable,
}: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const getTypeColor = (value: unknown): string => {
    if (value === null) return 'text-gray-500';
    if (typeof value === 'string') return 'text-green-600 dark:text-green-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    return 'text-foreground';
  };

  const getTypeBadge = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const isSelected = selectable && selectedPath === path;
  const paddingLeft = level * 16;

  const handleSelect = (e: React.MouseEvent) => {
    if (!selectable || !onPathSelect) return;
    e.stopPropagation();
    onPathSelect(path);
  };

  const isExpandable = typeof data === 'object' && data !== null;

  if (!isExpandable) {
    return (
      <div
        className={`flex items-center gap-2 py-0.5 rounded ${selectable ? 'cursor-pointer hover:bg-accent' : ''} ${isSelected ? 'bg-primary/15 ring-1 ring-primary/40' : ''}`}
        style={{ paddingLeft }}
        onClick={handleSelect}
        title={selectable ? path || '(raíz)' : undefined}
      >
        {name !== undefined && <span className="text-muted-foreground">{name}:</span>}
        <span className={getTypeColor(data)}>
          {data === null ? 'null' : typeof data === 'string' ? `"${String(data).slice(0, 40)}${String(data).length > 40 ? '…' : ''}"` : String(data)}
        </span>
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {getTypeBadge(data)}
        </Badge>
      </div>
    );
  }

  const entries = Array.isArray(data)
    ? data.map((item, index) => [index, item] as [number, unknown])
    : Object.entries(data as Record<string, unknown>);

  return (
    <div style={{ paddingLeft: level > 0 ? paddingLeft : 0 }}>
      <div
        className={`flex items-center gap-2 py-0.5 rounded ${selectable ? 'cursor-pointer hover:bg-accent' : 'cursor-pointer hover:bg-accent/50'} ${isSelected ? 'bg-primary/15 ring-1 ring-primary/40' : ''}`}
        onClick={(e) => {
          if (selectable && onPathSelect) handleSelect(e);
          else setIsExpanded(!isExpanded);
        }}
        onDoubleClick={() => setIsExpanded(!isExpanded)}
        title={selectable ? path || '(raíz)' : undefined}
      >
        <span
          className="text-xs w-4 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? '\u25BC' : '\u25B6'}
        </span>
        {name !== undefined && <span className="text-muted-foreground">{name}:</span>}
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {getTypeBadge(data)}
        </Badge>
        {!isExpanded && (
          <span className="text-xs text-muted-foreground">
            {Array.isArray(data) ? `[${data.length}]` : `{${Object.keys(data as object).length}}`}
          </span>
        )}
      </div>
      {isExpanded && (
        <div className="border-l border-border ml-2">
          {entries.map(([key, value]) => (
            <JsonTreeNode
              key={String(key)}
              data={value}
              name={String(key)}
              path={buildJsonPath(path, key)}
              level={level + 1}
              selectedPath={selectedPath}
              onPathSelect={onPathSelect}
              selectable={selectable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface JsonPathPickerProps {
  json: string;
  selectedPath?: string | null;
  onPathSelect?: (path: string) => void;
  className?: string;
  emptyMessage?: string;
}

/** Árbol JSON con selección de ruta por click (compatible con FlowResponseMapper). */
export function JsonPathPicker({
  json,
  selectedPath,
  onPathSelect,
  className,
  emptyMessage = 'JSON inválido o vacío',
}: JsonPathPickerProps) {
  const parsed = parseJsonSafe(json);
  if (parsed === null) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className={`font-mono text-sm overflow-auto max-h-64 ${className ?? ''}`}>
      <JsonTreeNode
        data={parsed}
        path=""
        selectedPath={selectedPath}
        onPathSelect={onPathSelect}
        selectable={Boolean(onPathSelect)}
      />
    </div>
  );
}

/** Vista de árbol JSON solo lectura (sin selección). */
export function JsonTreeView({ json, className }: { json: string; className?: string }) {
  return <JsonPathPicker json={json} className={className} />;
}
