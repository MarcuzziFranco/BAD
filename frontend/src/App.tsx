import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Templates } from '@/pages/Templates';
import { TemplateEditor } from '@/pages/TemplateEditor';
import { Generator } from '@/pages/Generator';
import { Configs } from '@/pages/Configs';
import { Executions } from '@/pages/Executions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="templates" element={<Templates />} />
            <Route path="template-new" element={<TemplateEditor />} />
            <Route path="template-edit/:id" element={<TemplateEditor />} />
            <Route path="generator" element={<Generator />} />
            <Route path="configs" element={<Configs />} />
            <Route path="executions" element={<Executions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
