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
}
