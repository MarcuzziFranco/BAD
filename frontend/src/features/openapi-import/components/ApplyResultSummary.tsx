import { Alert, AlertDescription } from '@/components/ui/alert';
import type { OpenApiApplyResponse } from '../types/openapi.types';

interface ApplyResultSummaryProps {
  result: OpenApiApplyResponse;
}

export function ApplyResultSummary({ result }: ApplyResultSummaryProps) {
  return (
    <div className="space-y-2 text-sm">
      <ul className="grid gap-1 sm:grid-cols-2">
        <li>
          <span className="text-muted-foreground">Operaciones procesadas:</span>{' '}
          <strong>{result.linked}</strong>
        </li>
        <li>
          <span className="text-muted-foreground">Templates:</span>{' '}
          <strong>{result.templatesCreated}</strong>
        </li>
        <li>
          <span className="text-muted-foreground">Servicios:</span>{' '}
          <strong>{result.servicesCreated}</strong>
        </li>
        {result.templatesSkippedNoBody > 0 && (
          <li>
            <span className="text-muted-foreground">Sin body (sin template):</span>{' '}
            {result.templatesSkippedNoBody}
          </li>
        )}
      </ul>
      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {result.errors.length} error(es):{' '}
            {result.errors.map((e) => e.operationKey).join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
