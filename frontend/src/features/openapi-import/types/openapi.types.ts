export interface OpenApiOperationPreview {
  operationKey: string;
  path: string;
  method: string;
  tag?: string | null;
  summary?: string | null;
  hasRequestBody: boolean;
  requestSchemaRef?: string | null;
  sampleJson?: string | null;
  suggestedTemplateName: string;
  suggestedServiceName: string;
  jsonTemplateId?: number | null;
  requestConfigId?: number | null;
  importStatus: string;
  error?: string | null;
  changeKind?: string | null;
}

export interface OpenApiCatalogListItem {
  id: number;
  name: string;
  baseUrl: string;
  infoTitle?: string | null;
  infoVersion?: string | null;
  operationCount: number;
  linkedCount: number;
  templateCount: number;
  serviceCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OpenApiCatalogDetail {
  id: number;
  name: string;
  baseUrl: string;
  openApiVersion: string;
  infoTitle?: string | null;
  infoVersion?: string | null;
  operations: OpenApiOperationPreview[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplyOpenApiPayload {
  operationKeys: string[];
  updateExisting?: boolean;
  createTemplates?: boolean;
  createServices?: boolean;
}

export interface OpenApiApplyResponse {
  linked: number;
  templatesCreated: number;
  servicesCreated: number;
  templatesSkippedNoBody: number;
  skipped: number;
  errors: { operationKey: string; message: string }[];
  operations: OpenApiOperationPreview[];
}

export interface OpenApiAnalyzeResponse {
  catalog: OpenApiCatalogDetail;
  newCount: number;
  modifiedCount: number;
  removedCount: number;
}

export interface ApplyOptions {
  updateExisting: boolean;
  createTemplates: boolean;
  createServices: boolean;
}
