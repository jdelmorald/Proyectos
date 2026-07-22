import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmpresa } from '../context/EmpresaContext';
import sumivensaLogo from '../assets/sumivensa-logo.png';
import indeldercaLogo from '../assets/indelderca-logo.png';
import saludsanmarcosLogo from '../assets/saludsanmarcos-logo.jpg';
import uomoLogo from '../assets/uomo-logo.png';
import AnimatedBackground from '../components/AnimatedBackground';
import Marquee from '../components/Marquee';
import EmpresaCard from '../components/EmpresaCard';

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
  glow: string;
  bar: ReactNode;
}

const MARCAS: MarcaConfig[] = [
  {
    match: 'Sumivensa',
    logo: sumivensaLogo,
    cardClass: 'border-sumivensa-brand-500/30',
    titleClass: 'text-sumivensa-brand-900',
    glow: '#d6293a',
    bar: <div className="h-1.5 rounded-full bg-sumivensa-accent-500" />,
  },
  {
    match: 'Salud San Marcos',
    logo: saludsanmarcosLogo,
    cardClass: 'border-saludsanmarcos-brand-500/30',
    titleClass: 'text-saludsanmarcos-brand-900',
    glow: '#1fb3b3',
    bar: <div className="h-1.5 rounded-full bg-saludsanmarcos-accent-500" />,
  },
  {
    match: 'Indelderca',
    logo: indeldercaLogo,
    cardClass: 'border-indelderca-brand-500/30',
    titleClass: 'text-indelderca-brand-900',
    glow: '#1a4a8c',
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
    cardClass: 'border-uomo-brand-500/30',
    titleClass: 'text-uomo-brand-900',
    glow: '#e2833c',
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
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Marquee />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-2">
          <div className="text-sm font-semibold tracking-[0.25em] text-gold-400">SISTEMA CONTABLE · GRUPO DELDER</div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white text-center mt-4">
          BIENVENIDO{user?.nombre ? `, ${user.nombre.toUpperCase()}` : ''}
        </h1>
        <p className="text-white/50 mt-2 mb-10 text-center">¿A qué empresa deseas acceder?</p>

        {loading || todasLoading ? (
          <div className="text-white/40">Cargando empresas...</div>
        ) : empresasOrdenadas.length === 0 ? (
          <div className="text-center text-white/40 max-w-sm">
            Todavía no hay empresas registradas en el sistema.
          </div>
        ) : (
          <>
            {aviso && (
              <div className="w-full max-w-6xl mb-5 rounded-lg border border-red-400/40 bg-red-500/10 backdrop-blur-sm px-4 py-3 text-sm font-semibold text-red-300 text-center">
                ⚠ {aviso}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-6xl">
              {empresasOrdenadas.map((empresa) => {
                const tieneAcceso = idsConAcceso.has(empresa.id);
                const marca = MARCAS.find((m) => m.match === empresa.nombre);
                if (marca) {
                  return (
                    <EmpresaCard
                      key={empresa.id}
                      onClick={() => elegir(empresa)}
                      title={tieneAcceso ? undefined : 'No cuentas con permisos para acceder a esta empresa'}
                      disabled={!tieneAcceso}
                      borderClass={marca.cardClass}
                      glowColor={marca.glow}
                      logo={<img src={marca.logo} alt={empresa.nombre} className="h-14 sm:h-20 w-auto object-contain" />}
                      nombre={empresa.nombre.toUpperCase()}
                      nombreClass={marca.titleClass}
                      bar={marca.bar}
                    />
                  );
                }
                // Empresa sin marca predefinida (agregada desde Configuración → Empresas):
                // misma tarjeta, pero con su logo y color propios en vez de los 3 de fábrica.
                const color = empresa.color || '#0f766e';
                return (
                  <EmpresaCard
                    key={empresa.id}
                    onClick={() => elegir(empresa)}
                    title={tieneAcceso ? undefined : 'No cuentas con permisos para acceder a esta empresa'}
                    disabled={!tieneAcceso}
                    borderColorInline={`${color}4d`}
                    glowColor={color}
                    logo={
                      empresa.logo_data_url ? (
                        <img src={empresa.logo_data_url} alt={empresa.nombre} className="h-14 sm:h-20 w-auto object-contain" />
                      ) : (
                        <div
                          className="h-14 w-14 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {empresa.nombre.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    }
                    nombre={empresa.nombre.toUpperCase()}
                    bar={<div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
                  />
                );
              })}
            </div>
          </>
        )}

        <button onClick={() => { logout(); navigate('/login'); }} className="mt-12 text-sm text-white/40 hover:text-white/70 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
