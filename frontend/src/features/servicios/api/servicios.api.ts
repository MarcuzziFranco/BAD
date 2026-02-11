import { api } from '@/shared/api/axios.instance';
import type { ParsedCurl } from '@/shared/types/api.types';
import type { RequestConfig } from '../types/servicios.types';

export const configsApi = {
  getAll: () => api.get<RequestConfig[]>('/requestconfigs'),
  getById: (id: number) => api.get<RequestConfig>(`/requestconfigs/${id}`),
  create: (data: Omit<RequestConfig, 'id' | 'createdAt'>) =>
    api.post<RequestConfig>('/requestconfigs', data),
  update: (id: number, data: Omit<RequestConfig, 'id' | 'createdAt'>) =>
    api.put(`/requestconfigs/${id}`, data),
  delete: (id: number) => api.delete(`/requestconfigs/${id}`),
  parseCurl: (curlCommand: string) =>
    api.post<ParsedCurl>('/requestconfigs/parse-curl', { curlCommand }),
  createFromCurl: (data: { curlCommand: string; name?: string; jsonTemplateId?: number }) =>
    api.post<RequestConfig>('/requestconfigs/from-curl', data),
};
