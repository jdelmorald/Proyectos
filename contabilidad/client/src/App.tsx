import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useEmpresa } from './context/EmpresaContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SeleccionarEmpresaPage from './pages/SeleccionarEmpresaPage';
import DashboardPage from './pages/DashboardPage';
import PlanCuentasPage from './pages/PlanCuentasPage';
import AsientosListPage from './pages/AsientosListPage';
import AsientoFormPage from './pages/AsientoFormPage';
import LibroMayorPage from './pages/LibroMayorPage';
import BalanceComprobacionPage from './pages/BalanceComprobacionPage';
import BalanceGeneralPage from './pages/BalanceGeneralPage';
import EstadoResultadosPage from './pages/EstadoResultadosPage';
import FlujoEfectivoPage from './pages/FlujoEfectivoPage';
import LibroComprasPage from './pages/LibroComprasPage';
import LibroVentasPage from './pages/LibroVentasPage';
import FlujoProyectadoPage from './pages/FlujoProyectadoPage';
import EmpresasConfigPage from './pages/EmpresasConfigPage';
import UsuariosPage from './pages/UsuariosPage';
import CentrosCostoPage from './pages/CentrosCostoPage';
import TercerosPage from './pages/TercerosPage';
import TasasCambioPage from './pages/TasasCambioPage';
import CuentasPendientesPage from './pages/CuentasPendientesPage';
import FiscalPage from './pages/FiscalPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireEmpresa({ children }: { children: JSX.Element }) {
  const { empresaId, empresa, loading } = useEmpresa();
  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;
  // Si empresaId quedó guardado de una sesión anterior pero ya no está en la
  // lista de empresas del usuario (p.ej. le revocaron el acceso), `empresa`
  // no aparece aunque empresaId siga siendo un número: hay que mandarlo a
  // elegir empresa de nuevo, no dejarlo en un panel roto.
  if (!empresaId || !empresa) return <Navigate to="/seleccionar-empresa" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/seleccionar-empresa"
        element={
          <ProtectedRoute>
            <SeleccionarEmpresaPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <RequireEmpresa>
              <Layout />
            </RequireEmpresa>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/plan-cuentas" element={<PlanCuentasPage />} />
        <Route path="/asientos" element={<AsientosListPage />} />
        <Route path="/asientos/nuevo" element={<AsientoFormPage />} />
        <Route path="/asientos/:id" element={<AsientoFormPage />} />
        <Route path="/reportes/libro-mayor" element={<LibroMayorPage />} />
        <Route path="/reportes/balance-comprobacion" element={<BalanceComprobacionPage />} />
        <Route path="/reportes/balance-general" element={<BalanceGeneralPage />} />
        <Route path="/reportes/estado-resultados" element={<EstadoResultadosPage />} />
        <Route path="/reportes/flujo-efectivo" element={<FlujoEfectivoPage />} />
        <Route path="/libro-compras" element={<LibroComprasPage />} />
        <Route path="/libro-ventas" element={<LibroVentasPage />} />
        <Route path="/flujo-proyectado" element={<FlujoProyectadoPage />} />
        <Route path="/centros-costo" element={<CentrosCostoPage />} />
        <Route path="/terceros" element={<TercerosPage />} />
        <Route path="/tasas-cambio" element={<TasasCambioPage />} />
        <Route path="/cuentas-pendientes" element={<CuentasPendientesPage />} />
        <Route path="/fiscal" element={<FiscalPage />} />
        <Route path="/config/empresas" element={<EmpresasConfigPage />} />
        <Route path="/config/usuarios" element={<UsuariosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
