/** Builds a JSON path segment compatible with FlowResponseMapper (Newtonsoft SelectToken). */
export function buildJsonPath(parentPath: string, segment: string | number): string {
  if (typeof segment === 'number') {
    if (!parentPath) return `[${segment}]`;
    return `${parentPath}[${segment}]`;
  }
  if (!parentPath) return segment;
  return `${parentPath}.${segment}`;
}

export function parseJsonSafe(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
