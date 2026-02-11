import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, RotateCcw, X } from 'lucide-react';

interface WizardHeaderProps {
  hasUnsavedChanges: boolean;
  onReset: () => void;
}

export const WizardHeader = memo(function WizardHeader({
  hasUnsavedChanges,
  onReset,
}: WizardHeaderProps) {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate('/executions');
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        {hasUnsavedChanges ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tienes cambios sin guardar. Si sales ahora, se perderán.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleExit}>
                  Salir sin guardar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExit}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Volver al historial</TooltipContent>
          </Tooltip>
        )}

        <div>
          <h1 className="text-lg font-semibold">Nueva Ejecución</h1>
          <p className="text-xs text-muted-foreground">
            Configura y ejecuta una prueba de carga
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={onReset}
              disabled={!hasUnsavedChanges}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent>Limpiar todos los campos</TooltipContent>
        </Tooltip>

        {hasUnsavedChanges ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tienes cambios sin guardar. Si sales ahora, se perderán.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleExit}>
                  Salir sin guardar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={handleExit}
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Salir</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
