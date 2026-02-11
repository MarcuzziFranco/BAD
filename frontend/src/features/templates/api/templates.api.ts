import { api } from '@/shared/api/axios.instance';
import type { JsonTemplate } from '../types/templates.types';

export const templatesApi = {
  getAll: () => api.get<JsonTemplate[]>('/jsontemplates'),
  getById: (id: number) => api.get<JsonTemplate>(`/jsontemplates/${id}`),
  create: (data: { name: string; description?: string; content: string }) =>
    api.post<JsonTemplate>('/jsontemplates', data),
  update: (id: number, data: { name: string; description?: string; content: string }) =>
    api.put(`/jsontemplates/${id}`, data),
  delete: (id: number) => api.delete(`/jsontemplates/${id}`),
};
