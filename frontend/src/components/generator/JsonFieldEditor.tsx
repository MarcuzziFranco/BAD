import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Shuffle,
  Lock,
  Ban,
  ArrowLeftRight,
  List,
  Settings2,
  ChevronRight,
  ChevronDown,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Fingerprint,
  CircleSlash,
  Braces,
  Brackets,
} from 'lucide-react';

export type OperationType = 'Random' | 'Replace' | 'ForceNull' | 'NotChange' | 'RandomRange' | 'RotateList';

export interface FieldConfig {
  key: string;
  operation: OperationType;
  value?: unknown;
  minValue?: unknown;
  maxValue?: unknown;
  listValues?: unknown[];
}

interface JsonFieldEditorProps {
  fieldKey: string;
  fieldType: string;
  originalValue: unknown;
  config: FieldConfig;
  level: number;
  onConfigChange: (key: string, config: Partial<FieldConfig>) => void;
}

const TYPE_INFO: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  String: { icon: Type, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  Integer: { icon: Hash, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  Float: { icon: Hash, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  Boolean: { icon: ToggleLeft, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  Date: { icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  Guid: { icon: Fingerprint, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
  Null: { icon: CircleSlash, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  Object: { icon: Braces, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
  Array: { icon: Brackets, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
};

const OPERATION_INFO: Record<OperationType, { icon: React.ElementType; label: string; color: string; description: string }> = {
  Random: { icon: Shuffle, label: 'Aleatorio', color: 'text-gray-500', description: 'Genera valor aleatorio según el tipo' },
  Replace: { icon: Lock, label: 'Fijo', color: 'text-blue-500', description: 'Usa siempre este valor' },
  ForceNull: { icon: Ban, label: 'NULL', color: 'text-red-500', description: 'Siempre será null' },
  NotChange: { icon: Lock, label: 'Original', color: 'text-green-500', description: 'Mantiene el valor original' },
  RandomRange: { icon: ArrowLeftRight, label: 'Rango', color: 'text-orange-500', description: 'Valor aleatorio en rango' },
  RotateList: { icon: List, label: 'Lista', color: 'text-purple-500', description: 'Rota entre valores' },
};

// Operaciones disponibles por tipo
const TYPE_OPERATIONS: Record<string, OperationType[]> = {
  String: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RotateList'],
  Integer: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RandomRange', 'RotateList'],
  Float: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RandomRange', 'RotateList'],
  Boolean: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RotateList'],
  Date: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RandomRange', 'RotateList'],
  Guid: ['Random', 'Replace', 'ForceNull', 'NotChange', 'RotateList'],
  Null: ['ForceNull', 'Replace'],
};

export function JsonFieldEditor({
  fieldKey,
  fieldType,
  originalValue,
  config,
  level,
  onConfigChange,
}: JsonFieldEditorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const typeInfo = TYPE_INFO[fieldType] || TYPE_INFO.String;
  const opInfo = OPERATION_INFO[config.operation];
  const availableOps = TYPE_OPERATIONS[fieldType] || TYPE_OPERATIONS.String;
  const TypeIcon = typeInfo.icon;
  const OpIcon = opInfo.icon;

  const formatValue = (val: unknown): string => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return `"${val.length > 30 ? val.substring(0, 27) + '...' : val}"`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
  };

  const getMutationPreview = (): string => {
    switch (config.operation) {
      case 'Random':
        return `→ aleatorio (${fieldType.toLowerCase()})`;
      case 'Replace':
        return `→ ${formatValue(config.value)}`;
      case 'ForceNull':
        return '→ null';
      case 'NotChange':
        return '→ sin cambios';
      case 'RandomRange':
        return `→ [${config.minValue ?? '?'} - ${config.maxValue ?? '?'}]`;
      case 'RotateList':
        const list = config.listValues || [];
        return `→ [${list.slice(0, 3).join(', ')}${list.length > 3 ? '...' : ''}]`;
      default:
        return '';
    }
  };

  const handleOperationChange = (op: OperationType) => {
    onConfigChange(fieldKey, {
      operation: op,
      value: undefined,
      minValue: undefined,
      maxValue: undefined,
      listValues: undefined,
    });
  };

  const parseValueByType = (val: string): unknown => {
    if (fieldType === 'Integer') return parseInt(val) || 0;
    if (fieldType === 'Float') return parseFloat(val) || 0;
    if (fieldType === 'Boolean') return val.toLowerCase() === 'true';
    return val;
  };

  return (
    <div 
      className="group flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 rounded transition-colors"
      style={{ paddingLeft: `${level * 20 + 8}px` }}
    >
      {/* Tipo de campo */}
      <div className={`flex items-center justify-center w-6 h-6 rounded ${typeInfo.bg}`}>
        <TypeIcon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
      </div>

      {/* Nombre del campo */}
      <span className="font-mono text-sm text-muted-foreground min-w-[120px]">
        {fieldKey.split('.').pop()}
      </span>

      {/* Valor original */}
      <span className={`font-mono text-sm ${typeInfo.color} min-w-[150px] truncate`}>
        {formatValue(originalValue)}
      </span>

      {/* Indicador de mutación */}
      <div className="flex items-center gap-1.5 flex-1">
        <OpIcon className={`w-4 h-4 ${opInfo.color}`} />
        <span className={`text-xs ${opInfo.color} font-medium`}>
          {getMutationPreview()}
        </span>
      </div>

      {/* Botón de configuración */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity ${
              config.operation !== 'Random' ? 'opacity-100 bg-accent' : ''
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 mr-1" />
            <span className="text-xs">{opInfo.label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">{fieldKey}</h4>
              <p className="text-xs text-muted-foreground">
                Tipo: {fieldType} • Valor: {formatValue(originalValue)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Operación</label>
              <div className="grid grid-cols-3 gap-1 mt-1.5">
                {availableOps.map((op) => {
                  const info = OPERATION_INFO[op];
                  const Icon = info.icon;
                  const isSelected = config.operation === op;
                  return (
                    <Button
                      key={op}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs justify-start px-2"
                      onClick={() => handleOperationChange(op)}
                    >
                      <Icon className={`w-3 h-3 mr-1 ${isSelected ? '' : info.color}`} />
                      {info.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Campos según operación */}
            {config.operation === 'Replace' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Valor fijo</label>
                <Input
                  className="mt-1 h-8 text-sm"
                  value={String(config.value ?? '')}
                  onChange={(e) => onConfigChange(fieldKey, { value: parseValueByType(e.target.value) })}
                  placeholder={`Ej: ${originalValue}`}
                />
              </div>
            )}

            {config.operation === 'RandomRange' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mínimo</label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    type={fieldType === 'Date' ? 'date' : 'number'}
                    value={String(config.minValue ?? '')}
                    onChange={(e) => onConfigChange(fieldKey, { 
                      minValue: fieldType === 'Date' ? e.target.value : parseFloat(e.target.value) 
                    })}
                    placeholder={fieldType === 'Date' ? '2020-01-01' : '0'}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Máximo</label>
                  <Input
                    className="mt-1 h-8 text-sm"
                    type={fieldType === 'Date' ? 'date' : 'number'}
                    value={String(config.maxValue ?? '')}
                    onChange={(e) => onConfigChange(fieldKey, { 
                      maxValue: fieldType === 'Date' ? e.target.value : parseFloat(e.target.value) 
                    })}
                    placeholder={fieldType === 'Date' ? '2025-12-31' : '100'}
                  />
                </div>
              </div>
            )}

            {config.operation === 'RotateList' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Valores (separados por coma)
                </label>
                <Input
                  className="mt-1 h-8 text-sm"
                  value={(config.listValues || []).join(', ')}
                  onChange={(e) => {
                    const values = e.target.value
                      .split(',')
                      .map((v) => parseValueByType(v.trim()));
                    onConfigChange(fieldKey, { listValues: values });
                  }}
                  placeholder="valor1, valor2, valor3"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Los valores rotarán secuencialmente
                </p>
              </div>
            )}

            {config.operation !== 'Random' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleOperationChange('Random')}
              >
                Restablecer a aleatorio
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente para nodos anidados (objetos/arrays)
interface JsonNodeProps {
  name: string;
  data: unknown;
  path: string;
  level: number;
  fields: Array<{ key: string; type: string; value: unknown }>;
  configs: Record<string, FieldConfig>;
  onConfigChange: (key: string, config: Partial<FieldConfig>) => void;
}

export function JsonNode({ name, data, path, level, fields, configs, onConfigChange }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 3);

  if (data === null || data === undefined) {
    const field = fields.find((f) => f.key === path);
    if (field) {
      return (
        <JsonFieldEditor
          fieldKey={path}
          fieldType={field.type}
          originalValue={field.value}
          config={configs[path] || { key: path, operation: 'Random' }}
          level={level}
          onConfigChange={onConfigChange}
        />
      );
    }
    return null;
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data as Record<string, unknown>);
    return (
      <div>
        <div
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/30 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div className={`flex items-center justify-center w-6 h-6 rounded ${TYPE_INFO.Object.bg}`}>
            <Braces className={`w-3.5 h-3.5 ${TYPE_INFO.Object.color}`} />
          </div>
          <span className="font-mono text-sm font-medium">{name}</span>
          <Badge variant="outline" className="text-[10px] h-5">
            {entries.length} campos
          </Badge>
        </div>
        {isExpanded && (
          <div className="border-l-2 border-border/50 ml-4">
            {entries.map(([key, value]) => {
              const childPath = path ? `${path}.${key}` : key;
              return (
                <JsonNode
                  key={childPath}
                  name={key}
                  data={value}
                  path={childPath}
                  level={level + 1}
                  fields={fields}
                  configs={configs}
                  onConfigChange={onConfigChange}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div>
        <div
          className="flex items-center gap-2 py-1.5 px-2 hover:bg-accent/30 rounded cursor-pointer"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <div className={`flex items-center justify-center w-6 h-6 rounded ${TYPE_INFO.Array.bg}`}>
            <Brackets className={`w-3.5 h-3.5 ${TYPE_INFO.Array.color}`} />
          </div>
          <span className="font-mono text-sm font-medium">{name}</span>
          <Badge variant="outline" className="text-[10px] h-5">
            {data.length} items
          </Badge>
        </div>
        {isExpanded && (
          <div className="border-l-2 border-border/50 ml-4">
            {data.map((item, index) => (
              <JsonNode
                key={`${path}[${index}]`}
                name={`[${index}]`}
                data={item}
                path={`${path}[${index}]`}
                level={level + 1}
                fields={fields}
                configs={configs}
                onConfigChange={onConfigChange}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Valor primitivo
  const field = fields.find((f) => f.key === path);
  if (field) {
    return (
      <JsonFieldEditor
        fieldKey={path}
        fieldType={field.type}
        originalValue={field.value}
        config={configs[path] || { key: path, operation: 'Random' }}
        level={level}
        onConfigChange={onConfigChange}
      />
    );
  }

  return null;
}

// Componente principal del visualizador
interface JsonVisualizerProps {
  jsonContent: string;
  fields: Array<{ key: string; type: string; value: unknown }>;
  configs: Record<string, FieldConfig>;
  onConfigChange: (key: string, config: Partial<FieldConfig>) => void;
}

export function JsonVisualizer({ jsonContent, fields, configs, onConfigChange }: JsonVisualizerProps) {
  let parsedJson: unknown = null;
  
  try {
    parsedJson = JSON.parse(jsonContent);
  } catch {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        JSON inválido
      </div>
    );
  }

  if (!parsedJson || typeof parsedJson !== 'object') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        El JSON debe ser un objeto
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      {Object.entries(parsedJson as Record<string, unknown>).map(([key, value]) => (
        <JsonNode
          key={key}
          name={key}
          data={value}
          path={key}
          level={0}
          fields={fields}
          configs={configs}
          onConfigChange={onConfigChange}
        />
      ))}
    </div>
  );
}
