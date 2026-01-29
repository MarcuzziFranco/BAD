import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { templatesApi } from '@/services/api';

export function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const getFieldCount = (content: string): number => {
    try {
      const json = JSON.parse(content);
      return Object.keys(json).length;
    } catch {
      return 0;
    }
  };

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
          Nuevo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando templates...</p>
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="h-[calc(100vh-200px)] overflow-auto pr-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/template-edit/${template.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg truncate pr-2">
                      {template.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getFieldCount(template.content)} campos
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <pre className="bg-secondary p-3 rounded text-xs overflow-hidden max-h-32 text-muted-foreground">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(template.content), null, 2);
                      } catch {
                        return template.content;
                      }
                    })()}
                  </pre>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/template-edit/${template.id}`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(template.id, e)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No hay templates guardados</p>
            <Button onClick={() => navigate('/template-new')}>
              Crear primer template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
