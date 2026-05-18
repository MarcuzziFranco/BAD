export interface LinkedServiceSummary {
  id: number;
  name: string;
  method: string;
  url: string;
}

export interface JsonTemplate {
  id: number;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  sourceGroup: string;
  apiCatalogId?: number | null;
  openApiOperationKey?: string | null;
  linkedServices?: LinkedServiceSummary[];
}
