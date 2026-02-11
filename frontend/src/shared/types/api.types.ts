// Tipos compartidos entre features

export interface JsonField {
  key: string;
  type: string;
  value: unknown;
}

export interface FieldConfig {
  key: string;
  operation: 'Random' | 'Replace' | 'ForceNull' | 'NotChange' | 'RandomRange' | 'RotateList';
  value?: unknown;
  minValue?: unknown;
  maxValue?: unknown;
  listValues?: unknown[];
}

export interface PaginatedResults<T = unknown> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ParsedCurl {
  url: string;
  method: string;
  headers: string | null;
  body: string | null;
  authType: string | null;
  authValue: string | null;
  warnings: string[];
}
