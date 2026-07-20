import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import EmpresaConfigPage from './pages/EmpresaConfigPage';
import CorrelativosPage from './pages/CorrelativosPage';
import UsuariosPage from './pages/UsuariosPage';
import DocumentListPage from './pages/documentos/DocumentListPage';
import DocumentFormPage from './pages/documentos/DocumentFormPage';
import DocumentPrintPage from './pages/documentos/DocumentPrintPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/documentos/:tipo/:id/imprimir"
        element={
          <ProtectedRoute>
            <DocumentPrintPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/config/empresa" element={<EmpresaConfigPage />} />
        <Route path="/config/correlativos" element={<CorrelativosPage />} />
        <Route path="/config/usuarios" element={<UsuariosPage />} />
        <Route path="/documentos/:tipo" element={<DocumentListPage />} />
        <Route path="/documentos/:tipo/nuevo" element={<DocumentFormPage />} />
        <Route path="/documentos/:tipo/:id" element={<DocumentFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
