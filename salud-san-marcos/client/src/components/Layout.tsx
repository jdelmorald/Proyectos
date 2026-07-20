import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DOCUMENT_TYPES } from '../config/documentTypes';
import logo from '../assets/logo.jpg';

const GRUPOS = ['Comercial', 'Depósito y Logística', 'Administrativo'] as const;

function linkClasses(isActive: boolean) {
  return `block rounded-r-md border-l-4 px-3 py-1.5 text-sm transition ${
    isActive
      ? 'border-accent-500 bg-brand-900 text-white font-medium'
      : 'border-transparent text-slate-600 hover:bg-slate-100'
  }`;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="no-print w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col items-center text-center gap-1">
          <img src={logo} alt="Salud San Marcos" className="h-16 w-auto object-contain" />
          <div className="text-sm font-bold tracking-tight text-brand-900">SALUD SAN MARCOS</div>
          <div className="text-xs text-slate-500">Sistema de Documentos</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <NavLink to="/" end className={({ isActive }) => linkClasses(isActive)}>
            🏠 Panel principal
          </NavLink>

          {GRUPOS.map((grupo) => (
            <div key={grupo}>
              <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{grupo}</div>
              <div className="space-y-0.5">
                {DOCUMENT_TYPES.filter((t) => t.grupoMenu === grupo).map((t) => (
                  <NavLink key={t.key} to={`/documentos/${t.key}`} className={({ isActive }) => linkClasses(isActive)}>
                    {t.labelPlural}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Catálogos</div>
            <div className="space-y-0.5">
              <NavLink to="/clientes" className={({ isActive }) => linkClasses(isActive)}>
                Clientes
              </NavLink>
              <NavLink to="/proveedores" className={({ isActive }) => linkClasses(isActive)}>
                Proveedores
              </NavLink>
              <NavLink to="/productos" className={({ isActive }) => linkClasses(isActive)}>
                Insumos Médicos
              </NavLink>
              <NavLink to="/activos" className={({ isActive }) => linkClasses(isActive)}>
                Control de Activos
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Configuración</div>
            <div className="space-y-0.5">
              <NavLink to="/config/empresa" className={({ isActive }) => linkClasses(isActive)}>
                Datos de la empresa
              </NavLink>
              <NavLink to="/config/correlativos" className={({ isActive }) => linkClasses(isActive)}>
                Correlativos
              </NavLink>
              {user?.rol === 'admin' && (
                <NavLink to="/config/usuarios" className={({ isActive }) => linkClasses(isActive)}>
                  Usuarios
                </NavLink>
              )}
            </div>
          </div>
        </nav>
        <div className="px-4 py-3 border-t border-slate-200 text-sm">
          <div className="font-medium text-slate-700">{user?.nombre}</div>
          <div className="text-slate-400 text-xs mb-2">{user?.email}</div>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-accent-600 hover:underline text-xs">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
