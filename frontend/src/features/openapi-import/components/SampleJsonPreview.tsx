import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SampleJsonPreviewProps {
  json?: string | null;
  maxHeight?: string;
}

export function SampleJsonPreview({ json, maxHeight = '8rem' }: SampleJsonPreviewProps) {
  const [open, setOpen] = useState(false);
  if (!json) return <span className="text-xs text-muted-foreground">—</span>;

  let formatted = json;
  try {
    formatted = JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    /* keep raw */
  }

  return (
    <div className="text-xs">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-1"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        JSON
      </Button>
      {open && (
        <pre
          className="mt-1 overflow-auto rounded border bg-muted/40 p-2 text-[10px] leading-snug"
          style={{ maxHeight }}
        >
          {formatted}
        </pre>
      )}
    </div>
  );
}
