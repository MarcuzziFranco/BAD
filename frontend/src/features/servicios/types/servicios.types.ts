export interface RequestConfig {
  id: number;
  name: string;
  url: string;
  method: string;
  headers: string | null;
  authType: string;
  authValue: string | null;
  jsonTemplateId: number | null;
  createdAt: string;
  sourceGroup: string;
  apiCatalogId?: number | null;
  openApiOperationKey?: string | null;
}
