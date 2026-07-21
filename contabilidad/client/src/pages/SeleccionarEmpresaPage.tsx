import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import sumivensaLogo from '../assets/sumivensa-logo.png';
import indeldercaLogo from '../assets/indelderca-logo.png';
import saludsanmarcosLogo from '../assets/saludsanmarcos-logo.jpg';
import uomoLogo from '../assets/uomo-logo.png';

interface EmpresaVisible {
  id: number;
  nombre: string;
  logo_data_url: string | null;
  color: string;
}

// Orden fijo pedido para la pantalla de bienvenida. Cualquier empresa que no
// esté en esta lista (agregada después desde Configuración → Empresas) se
// muestra al final, ordenada alfabéticamente.
const ORDEN_PREFERIDO = ['Sumivensa', 'Salud San Marcos', 'Indelderca', 'Uomo Store'];

interface MarcaConfig {
  match: string;
  logo: string;
  cardClass: string;
  titleClass: string;
  bar: ReactNode;
}

const MARCAS: MarcaConfig[] = [
  {
    match: 'Sumivensa',
    logo: sumivensaLogo,
    cardClass: 'border-sumivensa-brand-500/30 hover:border-sumivensa-accent-500 hover:shadow-sumivensa-brand-900/20',
    titleClass: 'text-sumivensa-brand-900',
    bar: <div className="h-1.5 rounded-full bg-sumivensa-accent-500" />,
  },
  {
    match: 'Salud San Marcos',
    logo: saludsanmarcosLogo,
    cardClass: 'border-saludsanmarcos-brand-500/30 hover:border-saludsanmarcos-accent-500 hover:shadow-saludsanmarcos-brand-900/20',
    titleClass: 'text-saludsanmarcos-brand-900',
    bar: <div className="h-1.5 rounded-full bg-saludsanmarcos-accent-500" />,
  },
  {
    match: 'Indelderca',
    logo: indeldercaLogo,
    cardClass: 'border-indelderca-brand-500/30 hover:border-indelderca-brand-700 hover:shadow-indelderca-brand-900/20',
    titleClass: 'text-indelderca-brand-900',
    bar: (
      <div className="flex h-1.5 rounded-full overflow-hidden border border-slate-300">
        <div className="flex-1 bg-indelderca-italia" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-indelderca-accent-500" />
      </div>
    ),
  },
  {
    match: 'Uomo Store',
    logo: uomoLogo,
    cardClass: 'border-uomo-brand-500/30 hover:border-uomo-accent-500 hover:shadow-uomo-brand-900/20',
    titleClass: 'text-uomo-brand-900',
    bar: <div className="h-1.5 rounded-full bg-uomo-accent-500" />,
  },
];

export default function SeleccionarEmpresaPage() {
  const { user, logout } = useAuth();
  const { empresas, setEmpresaId, loading } = useEmpresa();
  const navigate = useNavigate();
  const [todas, setTodas] = useState<EmpresaVisible[]>([]);
  const [todasLoading, setTodasLoading] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<EmpresaVisible[]>('/empresas/todas-visibles')
      .then(setTodas)
      .catch(() => setTodas([]))
      .finally(() => setTodasLoading(false));
  }, []);

  // Las pestañas se muestran para TODAS las empresas activas del sistema, no
  // solo las que el usuario puede ver: así un analista con acceso solo a
  // Sumivensa igual ve el botón de las demás y, si le da clic por curiosidad,
  // recibe el aviso de abajo en vez de que la empresa simplemente desaparezca.
  const idsConAcceso = new Set(empresas.map((e) => e.id));

  function elegir(empresa: EmpresaVisible) {
    if (!idsConAcceso.has(empresa.id)) {
      setAviso(`No cuentas con permisos para acceder al módulo de ${empresa.nombre}.`);
      return;
    }
    setAviso(null);
    setEmpresaId(empresa.id);
    navigate('/');
  }

  const empresasOrdenadas = [...todas].sort((a, b) => {
    const ia = ORDEN_PREFERIDO.indexOf(a.nombre);
    const ib = ORDEN_PREFERIDO.indexOf(b.nombre);
    const ra = ia === -1 ? ORDEN_PREFERIDO.length : ia;
    const rb = ib === -1 ? ORDEN_PREFERIDO.length : ib;
    return ra !== rb ? ra - rb : a.nombre.localeCompare(b.nombre);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-brand-900 via-gold-500 to-accent-600" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-2">
          <div className="text-sm font-semibold tracking-[0.25em] text-gold-600">SISTEMA CONTABLE · GRUPO DELDER</div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-900 text-center mt-4">
          BIENVENIDO{user?.nombre ? `, ${user.nombre.toUpperCase()}` : ''}
        </h1>
        <p className="text-slate-500 mt-2 mb-10 text-center">¿A qué empresa deseas acceder?</p>

        {loading || todasLoading ? (
          <div className="text-slate-400">Cargando empresas...</div>
        ) : empresasOrdenadas.length === 0 ? (
          <div className="text-center text-slate-400 max-w-sm">
            Todavía no hay empresas registradas en el sistema.
          </div>
        ) : (
          <>
            {aviso && (
              <div className="w-full max-w-6xl mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 text-center">
                ⚠ {aviso}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl">
              {empresasOrdenadas.map((empresa) => {
                const tieneAcceso = idsConAcceso.has(empresa.id);
                const sinAccesoClass = tieneAcceso ? '' : 'opacity-50 grayscale-[0.4]';
                const marca = MARCAS.find((m) => m.match === empresa.nombre);
                if (marca) {
                  return (
                    <button
                      key={empresa.id}
                      onClick={() => elegir(empresa)}
                      title={tieneAcceso ? undefined : 'No cuentas con permisos para acceder a esta empresa'}
                      className={`relative bg-white rounded-2xl border-2 p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 shadow-sm hover:shadow-xl transition-all ${marca.cardClass} ${sinAccesoClass}`}
                    >
                      {!tieneAcceso && (
                        <span className="absolute top-2 right-2 text-xs" aria-hidden="true">🔒</span>
                      )}
                      <img src={marca.logo} alt={empresa.nombre} className="h-14 sm:h-20 w-auto object-contain" />
                      <div className={`text-sm sm:text-lg font-extrabold tracking-tight text-center ${marca.titleClass}`}>
                        {empresa.nombre.toUpperCase()}
                      </div>
                      <div className="w-16">{marca.bar}</div>
                    </button>
                  );
                }
                // Empresa sin marca predefinida (agregada desde Configuración → Empresas):
                // misma tarjeta, pero con su logo y color propios en vez de los 3 de fábrica.
                const color = empresa.color || '#0f766e';
                return (
                  <button
                    key={empresa.id}
                    onClick={() => elegir(empresa)}
                    title={tieneAcceso ? undefined : 'No cuentas con permisos para acceder a esta empresa'}
                    style={{ borderColor: `${color}4d` }}
                    className={`relative bg-white rounded-2xl border-2 p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 shadow-sm hover:shadow-xl transition-all ${sinAccesoClass}`}
                  >
                    {!tieneAcceso && (
                      <span className="absolute top-2 right-2 text-xs" aria-hidden="true">🔒</span>
                    )}
                    {empresa.logo_data_url ? (
                      <img src={empresa.logo_data_url} alt={empresa.nombre} className="h-14 sm:h-20 w-auto object-contain" />
                    ) : (
                      <div
                        className="h-14 w-14 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {empresa.nombre.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-sm sm:text-lg font-extrabold tracking-tight text-center text-brand-900">{empresa.nombre.toUpperCase()}</div>
                    <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button onClick={() => { logout(); navigate('/login'); }} className="mt-12 text-sm text-slate-400 hover:text-slate-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
