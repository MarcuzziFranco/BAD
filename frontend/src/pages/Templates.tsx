import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { templatesApi } from '@/services/api';
import type { JsonTemplate } from '@/services/api';
import { Pencil, Eye, Trash2, Search, Plus } from 'lucide-react';

export function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
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
    },
  });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este template?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (template: JsonTemplate) => {
    setSelectedTemplate(template);
    setIsSheetOpen(true);
  };

  const formatId = (id: number): string => {
    return `#${id.toString().padStart(3, '0')}`;
  };

  const formatJsonContent = (content: string): string => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  };

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Templates JSON</h2>
          <p className="text-muted-foreground">
            Gestiona tus plantillas JSON para generación
          </p>
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
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
            Limpiar
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead className="w-32 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <span className="text-muted-foreground">Cargando templates...</span>
                </TableCell>
              </TableRow>
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {formatId(template.id)}
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {template.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(template)}
                        title="Ver JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/template-edit/${template.id}`)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(template.id, e)}
                        disabled={deleteMutation.isPending}
                        title="Eliminar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <span className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron templates' : 'No hay templates guardados'}
                  </span>
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
            <SheetDescription>
              {selectedTemplate?.description || 'Vista previa del template JSON'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 h-[calc(100vh-180px)]">
            {selectedTemplate && (
              <Editor
                height="100%"
                defaultLanguage="json"
                value={formatJsonContent(selectedTemplate.content)}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
