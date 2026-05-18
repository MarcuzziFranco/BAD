import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFlowEditorContext } from '../hooks/useFlowEditorContext';
import { MANUAL_SOURCE_GROUP } from '@/shared/constants/resource-groups';
function groupLabel(g: string) {
  return g === MANUAL_SOURCE_GROUP ? 'manual' : g;
}

interface FlowResourcePaletteProps {
  selectedId: string | null;
  onAssignService: (configId: number, templateId: number | null, sourceGroup: string) => void;
  onAssignTemplate: (templateId: number, sourceGroup: string) => void;
}

export function FlowResourcePalette({
  selectedId,
  onAssignService,
  onAssignTemplate,
}: FlowResourcePaletteProps) {
  const { activeGroup, requestConfigs, jsonTemplates } = useFlowEditorContext();
  const [search, setSearch] = useState('');

  const filteredServices = useMemo(() => {
    let list = requestConfigs;
    if (activeGroup !== 'all') list = list.filter((c) => c.sourceGroup === activeGroup);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.method.toLowerCase().includes(q) ||
          String(c.id).includes(q),
      );
    }
    return list;
  }, [requestConfigs, activeGroup, search]);

  const filteredTemplates = useMemo(() => {
    let list = jsonTemplates;
    if (activeGroup !== 'all') list = list.filter((t) => t.sourceGroup === activeGroup);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) || String(t.id).includes(q),
      );
    }
    return list;
  }, [jsonTemplates, activeGroup, search]);

  return (
    <aside className="w-[280px] border-r bg-card flex flex-col shrink-0">
      <div className="p-3 border-b space-y-2">
        <h2 className="text-sm font-semibold">Recursos</h2>
        <Input
          placeholder="Buscar…"
          className="h-8 text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!selectedId && (
          <p className="text-xs text-muted-foreground">Seleccione un nodo para asignar recursos.</p>
        )}
      </div>
      <Tabs defaultValue="services" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-2 mt-2 grid grid-cols-2">
          <TabsTrigger value="services" className="text-xs">
            Servicios
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            Templates
          </TabsTrigger>
        </TabsList>
        <TabsContent value="services" className="flex-1 min-h-0 mt-0 px-2 pb-2">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <ul className="space-y-1">
              {filteredServices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={!selectedId}
                    className="w-full text-left rounded-md px-2 py-2 text-xs hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      onAssignService(c.id, c.jsonTemplateId, c.sourceGroup)
                    }
                  >
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {groupLabel(c.sourceGroup)}
                      </Badge>
                      <span className="font-mono text-muted-foreground">{c.method}</span>
                    </div>
                    <div className="font-medium truncate mt-0.5">
                      #{c.id} {c.name}
                    </div>
                    {c.jsonTemplateId && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Template #{c.jsonTemplateId}
                      </div>
                    )}
                  </button>
                </li>
              ))}
              {filteredServices.length === 0 && (
                <li className="text-xs text-muted-foreground py-4 text-center">
                  Sin servicios{activeGroup !== 'all' ? ' en este grupo' : ''}.
                </li>
              )}
            </ul>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="templates" className="flex-1 min-h-0 mt-0 px-2 pb-2">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <ul className="space-y-1">
              {filteredTemplates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={!selectedId}
                    className="w-full text-left rounded-md px-2 py-2 text-xs hover:bg-muted disabled:opacity-50"
                    onClick={() => onAssignTemplate(t.id, t.sourceGroup)}
                  >
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {groupLabel(t.sourceGroup)}
                    </Badge>
                    <div className="font-medium truncate mt-0.5">
                      #{t.id} {t.name}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

export function countNodes(definitionJson: string): number {
  try {
    const def = JSON.parse(definitionJson) as { nodes?: unknown[] };
    return def.nodes?.length ?? 0;
  } catch {
    return 0;
  }
}
