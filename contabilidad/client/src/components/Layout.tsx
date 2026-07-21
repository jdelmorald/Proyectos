import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  NotebookPen,
  ListTree,
  BookMarked,
  Scale,
  FileBarChart,
  TrendingUp,
  Waves,
  ShoppingCart,
  Receipt,
  CalendarClock,
  Building2,
  Users,
  LogOut,
  Layers,
  Contact,
  Coins,
  HandCoins,
  Landmark as LandmarkIcon,
  Home,
  ChevronDown,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import BrandLogo from './BrandLogo';

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="no-print h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <button
        onClick={() => navigate('/seleccionar-empresa')}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-900 hover:bg-slate-50 rounded-md px-2.5 py-1.5 -ml-2.5"
        title="Volver a la selección de empresa"
      >
        <Home size={18} strokeWidth={2} /> Inicio
      </button>

      <div className="relative">
        <button onClick={() => setMenuAbierto((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
          {user?.fotoDataUrl ? (
            <img src={user.fotoDataUrl} alt={user.nombre} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
              {(user?.nombre || '?').slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user?.nombre}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {menuAbierto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg border border-slate-200 shadow-lg z-20 py-1.5">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-700 truncate">{user?.nombre}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
              <Link
                to="/perfil"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <UserCircle size={16} /> Mi Perfil
              </Link>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function linkClasses(isActive: boolean) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? 'bg-accent-50 text-accent-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
  }`;
}

export default function Layout() {
  const { user } = useAuth();
  const { empresa } = useEmpresa();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="no-print w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <BrandLogo size="sm" />
        </div>

        <div className="mx-4 mt-4 mb-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Empresa</div>
            <div className="text-sm font-bold text-brand-900">{empresa?.nombre}</div>
          </div>
          <Link to="/seleccionar-empresa" className="text-xs text-accent-700 hover:underline whitespace-nowrap">
            Cambiar
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <NavLink to="/" end className={({ isActive }) => linkClasses(isActive)}>
            <LayoutDashboard size={17} strokeWidth={2} /> Dashboard
          </NavLink>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Contabilidad</div>
            <div className="space-y-0.5">
              <NavLink to="/asientos" className={({ isActive }) => linkClasses(isActive)}>
                <NotebookPen size={17} strokeWidth={2} /> Libro Diario
              </NavLink>
              <NavLink to="/plan-cuentas" className={({ isActive }) => linkClasses(isActive)}>
                <ListTree size={17} strokeWidth={2} /> Plan de Cuentas
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reportes</div>
            <div className="space-y-0.5">
              <NavLink to="/reportes/libro-mayor" className={({ isActive }) => linkClasses(isActive)}>
                <BookMarked size={17} strokeWidth={2} /> Libro Mayor
              </NavLink>
              <NavLink to="/reportes/balance-comprobacion" className={({ isActive }) => linkClasses(isActive)}>
                <Scale size={17} strokeWidth={2} /> Balance de Comprobación
              </NavLink>
              <NavLink to="/reportes/balance-general" className={({ isActive }) => linkClasses(isActive)}>
                <FileBarChart size={17} strokeWidth={2} /> Balance General
              </NavLink>
              <NavLink to="/reportes/estado-resultados" className={({ isActive }) => linkClasses(isActive)}>
                <TrendingUp size={17} strokeWidth={2} /> Estado de Resultados
              </NavLink>
              <NavLink to="/reportes/flujo-efectivo" className={({ isActive }) => linkClasses(isActive)}>
                <Waves size={17} strokeWidth={2} /> Flujo de Efectivo
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Libros Fiscales</div>
            <div className="space-y-0.5">
              <NavLink to="/libro-compras" className={({ isActive }) => linkClasses(isActive)}>
                <ShoppingCart size={17} strokeWidth={2} /> Libro de Compras
              </NavLink>
              <NavLink to="/libro-ventas" className={({ isActive }) => linkClasses(isActive)}>
                <Receipt size={17} strokeWidth={2} /> Libro de Ventas
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Cartera</div>
            <div className="space-y-0.5">
              <NavLink to="/cuentas-pendientes" className={({ isActive }) => linkClasses(isActive)}>
                <HandCoins size={17} strokeWidth={2} /> CxC / CxP
              </NavLink>
              <NavLink to="/terceros" className={({ isActive }) => linkClasses(isActive)}>
                <Contact size={17} strokeWidth={2} /> Clientes y Proveedores
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fiscal</div>
            <div className="space-y-0.5">
              <NavLink to="/fiscal" className={({ isActive }) => linkClasses(isActive)}>
                <LandmarkIcon size={17} strokeWidth={2} /> Módulo Fiscal
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Planificación</div>
            <div className="space-y-0.5">
              <NavLink to="/flujo-proyectado" className={({ isActive }) => linkClasses(isActive)}>
                <CalendarClock size={17} strokeWidth={2} /> Flujo de Caja Proyectado
              </NavLink>
            </div>
          </div>

          <div>
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Configuración</div>
            <div className="space-y-0.5">
              <NavLink to="/centros-costo" className={({ isActive }) => linkClasses(isActive)}>
                <Layers size={17} strokeWidth={2} /> Centros de Costo
              </NavLink>
              <NavLink to="/tasas-cambio" className={({ isActive }) => linkClasses(isActive)}>
                <Coins size={17} strokeWidth={2} /> Tasas de Cambio
              </NavLink>
              <NavLink to="/config/empresas" className={({ isActive }) => linkClasses(isActive)}>
                <Building2 size={17} strokeWidth={2} /> Empresas
              </NavLink>
              {user?.rol === 'admin' && (
                <NavLink to="/config/usuarios" className={({ isActive }) => linkClasses(isActive)}>
                  <Users size={17} strokeWidth={2} /> Usuarios
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
