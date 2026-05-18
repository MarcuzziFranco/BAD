import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReimportDiffBannerProps {
  newCount: number;
  modifiedCount: number;
  removedCount: number;
}

export function ReimportDiffBanner({ newCount, modifiedCount, removedCount }: ReimportDiffBannerProps) {
  if (newCount === 0 && modifiedCount === 0 && removedCount === 0) return null;

  return (
    <Alert>
      <AlertTitle>Cambios detectados en la spec</AlertTitle>
      <AlertDescription>
        {newCount > 0 && <span className="mr-3">{newCount} nueva(s)</span>}
        {modifiedCount > 0 && <span className="mr-3">{modifiedCount} modificada(s)</span>}
        {removedCount > 0 && <span>{removedCount} eliminada(s) del documento</span>}
        . Revise la tabla y aplique de nuevo para actualizar templates y servicios vinculados.
      </AlertDescription>
    </Alert>
  );
}
