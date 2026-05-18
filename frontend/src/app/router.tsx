import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/shared/components/layout/Layout';
import { DashboardPage } from '@/features/dashboard';
import { TemplatesPage, TemplateEditorPage } from '@/features/templates';
import { GeneratorPage } from '@/features/generator';
import { ServiciosPage, ServicioEditorPage } from '@/features/servicios';
import { ExecutionsPage, ExecutionWizardPage, ExecutionDetailPage } from '@/features/executions';
import { FlowsListPage, FlowEditorPage, FlowRunDetailPage } from '@/features/flow-execution';
import {
  OpenApiCatalogsListPage,
  OpenApiImportWizardPage,
  OpenApiCatalogDetailPage,
} from '@/features/openapi-import';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="template-new" element={<TemplateEditorPage />} />
        <Route path="template-edit/:id" element={<TemplateEditorPage />} />
        <Route path="generator" element={<GeneratorPage />} />
        <Route path="servicios" element={<ServiciosPage />} />
        <Route path="servicios-new" element={<ServicioEditorPage />} />
        <Route path="servicios-edit/:id" element={<ServicioEditorPage />} />
        <Route path="executions" element={<ExecutionsPage />} />
        <Route path="executions/new" element={<ExecutionWizardPage />} />
        <Route path="executions/:id" element={<ExecutionDetailPage />} />
        <Route path="flows" element={<FlowsListPage />} />
        <Route path="flows/new" element={<FlowEditorPage />} />
        <Route path="flows/edit/:id" element={<FlowEditorPage />} />
        <Route path="flow-runs/:id" element={<FlowRunDetailPage />} />
        <Route path="openapi" element={<OpenApiCatalogsListPage />} />
        <Route path="openapi/import" element={<OpenApiImportWizardPage />} />
        <Route path="openapi/:id" element={<OpenApiCatalogDetailPage />} />
      </Route>
    </Routes>
  );
}
