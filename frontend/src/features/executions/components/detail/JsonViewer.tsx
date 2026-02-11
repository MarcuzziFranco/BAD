import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const JsonViewer = memo(function JsonViewer({
  data,
  maxHeight = '300px',
  showLineNumbers = true,
  className,
  title,
  collapsible = false,
  defaultCollapsed = false,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const formatJson = useCallback((str: string): string => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatJson(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  }, [data, formatJson]);

  const formattedData = formatJson(data);
  const lines = formattedData.split('\n');
  const size = new Blob([data]).size;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('rounded-lg border bg-zinc-950 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-zinc-400 hover:text-zinc-200"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {title && (
            <span className="text-xs font-medium text-zinc-400">{title}</span>
          )}
          <span className="text-xs text-zinc-500">
            {lines.length} líneas · {formatSize(size)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
          onClick={copyToClipboard}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copiar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      {!collapsed && (
        <ScrollArea style={{ maxHeight }} className="w-full">
          <div className="p-3 font-mono text-xs">
            <table className="w-full">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="leading-5">
                    {showLineNumbers && (
                      <td className="pr-4 text-right text-zinc-600 select-none w-8">
                        {i + 1}
                      </td>
                    )}
                    <td className="text-zinc-300 whitespace-pre">
                      <SyntaxHighlight line={line} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}
    </div>
  );
});

// Syntax highlighting simple para JSON
const SyntaxHighlight = memo(function SyntaxHighlight({ line }: { line: string }) {
  // Colorear keys, strings, numbers, booleans, null
  const parts: React.ReactNode[] = [];
  let remaining = line;
  let keyIndex = 0;

  // Match key: value patterns
  const keyMatch = remaining.match(/^(\s*)("[\w-]+")(:)/);
  if (keyMatch) {
    parts.push(
      <span key={`ws-${keyIndex}`}>{keyMatch[1]}</span>,
      <span key={`key-${keyIndex}`} className="text-purple-400">{keyMatch[2]}</span>,
      <span key={`colon-${keyIndex}`} className="text-zinc-500">{keyMatch[3]}</span>
    );
    remaining = remaining.slice(keyMatch[0].length);
    keyIndex++;
  }

  // Match values
  const valuePatterns = [
    { regex: /^(\s*)(null)(,?)/, color: 'text-orange-400' },
    { regex: /^(\s*)(true|false)(,?)/, color: 'text-yellow-400' },
    { regex: /^(\s*)(-?\d+\.?\d*)(,?)/, color: 'text-cyan-400' },
    { regex: /^(\s*)("(?:[^"\\]|\\.)*")(,?)/, color: 'text-green-400' },
  ];

  for (const { regex, color } of valuePatterns) {
    const match = remaining.match(regex);
    if (match) {
      parts.push(
        <span key={`vws-${keyIndex}`}>{match[1]}</span>,
        <span key={`val-${keyIndex}`} className={color}>{match[2]}</span>,
        <span key={`comma-${keyIndex}`} className="text-zinc-500">{match[3]}</span>
      );
      remaining = remaining.slice(match[0].length);
      keyIndex++;
      break;
    }
  }

  // Remaining (brackets, etc)
  if (remaining) {
    parts.push(
      <span key={`rest-${keyIndex}`} className="text-zinc-400">{remaining}</span>
    );
  }

  return <>{parts.length > 0 ? parts : line}</>;
});
