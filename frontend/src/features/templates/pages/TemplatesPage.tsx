import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PageBreadcrumb } from '@/shared/components/common/PageBreadcrumb';
import { templatesApi } from '../api/templates.api';
import type { JsonTemplate } from '../types/templates.types';
import { Link } from 'react-router-dom';
import { Pencil, Eye, Trash2, Search, Plus, FileJson } from 'lucide-react';
import { MANUAL_SOURCE_GROUP } from '@/shared/constants/resource-groups';

export function TemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<JsonTemplate | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template eliminado correctamente');
    },
    onError: () => {
      toast.error('Error al eliminar el template');
    },
  });

  const handleView = (template: JsonTemplate) => {
    setSelectedTemplate(template);
    setIsSheetOpen(true);
  };

  const formatId = (id: number): string => `#${id.toString().padStart(3, '0')}`;

  const formatJsonContent = (content: string): string => {
    try { return JSON.stringify(JSON.parse(content), null, 2); }
    catch { return content; }
  };

  const groups = useMemo(() => {
    const set = new Set((templates ?? []).map((t) => t.sourceGroup));
    return Array.from(set).sort((a, b) => {
      if (a === MANUAL_SOURCE_GROUP) return 1;
      if (b === MANUAL_SOURCE_GROUP) return -1;
      return a.localeCompare(b);
    });
  }, [templates]);

  const filteredTemplates = templates?.filter((template) => {
    if (groupFilter !== 'all' && template.sourceGroup !== groupFilter) return false;
    const q = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(q) ||
      template.sourceGroup.toLowerCase().includes(q) ||
      (template.openApiOperationKey?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Templates' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates JSON</h2>
          <p className="text-muted-foreground">Gestiona tus plantillas JSON para generacion</p>
        </div>
        <Button onClick={() => navigate('/template-new')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Template
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>Limpiar</Button>
        )}
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="all">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g === MANUAL_SOURCE_GROUP ? 'manual' : g}
            </option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="hidden lg:table-cell">Servicio(s)</TableHead>
              <TableHead className="hidden md:table-cell">Descripcion</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Spinner className="mx-auto size-5" />
                </TableCell>
              </TableRow>
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{formatId(template.id)}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2 flex-wrap">
                      {template.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {template.sourceGroup === MANUAL_SOURCE_GROUP ? 'manual' : template.sourceGroup}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {template.linkedServices && template.linkedServices.length > 0 ? (
                      template.linkedServices.map((s) => (
                        <Link
                          key={s.id}
                          to={`/servicios-edit/${s.id}`}
                          className="text-primary hover:underline block"
                        >
                          #{s.id} {s.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{template.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleView(template)} title="Ver JSON">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/template-edit/${template.id}`)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Eliminar" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Estas seguro de eliminar "{template.name}"? Esta accion no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(template.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><FileJson /></EmptyMedia>
                      <EmptyTitle>{searchTerm ? 'Sin resultados' : 'Sin templates'}</EmptyTitle>
                      <EmptyDescription>
                        {searchTerm ? 'No se encontraron templates con ese nombre' : 'No hay templates guardados todavia'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{selectedTemplate?.name}</SheetTitle>
            <SheetDescription>{selectedTemplate?.description || 'Vista previa del template JSON'}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 h-[calc(100vh-180px)]">
            {selectedTemplate && (
              <Editor
                height="100%"
                defaultLanguage="json"
                value={formatJsonContent(selectedTemplate.content)}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on' }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
