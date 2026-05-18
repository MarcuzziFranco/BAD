import { api } from '@/shared/api/axios.instance';
import type {
  ApplyOpenApiPayload,
  OpenApiAnalyzeResponse,
  OpenApiApplyResponse,
  OpenApiCatalogDetail,
  OpenApiCatalogListItem,
} from '../types/openapi.types';

export const openapiCatalogsApi = {
  list: () => api.get<OpenApiCatalogListItem[]>('/openapi-catalogs'),
  getById: (id: number) => api.get<OpenApiCatalogDetail>(`/openapi-catalogs/${id}`),
  create: (data: { specJson: string; baseUrl: string; name?: string }) =>
    api.post<OpenApiCatalogDetail>('/openapi-catalogs', data),
  update: (id: number, data: { name?: string; baseUrl?: string; specJson?: string }) =>
    api.put<OpenApiAnalyzeResponse>(`/openapi-catalogs/${id}`, data),
  analyze: (id: number, data?: { specJson?: string; baseUrl?: string }) =>
    api.post<OpenApiAnalyzeResponse>(`/openapi-catalogs/${id}/analyze`, data ?? {}),
  apply: (id: number, data: ApplyOpenApiPayload) =>
    api.post<OpenApiApplyResponse>(`/openapi-catalogs/${id}/apply`, data),
  delete: (id: number) => api.delete(`/openapi-catalogs/${id}`),
};
