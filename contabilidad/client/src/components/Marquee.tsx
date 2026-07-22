import { ReactNode, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatearMonto } from '../utils/formato';

interface TasaHistorial {
  id: number;
  fecha: string;
  moneda: 'USD' | 'COP' | 'EUR';
  tasa: number;
}

const NOMBRE_MONEDA: Record<string, string> = { USD: 'Dólar BCV', EUR: 'Euro BCV', COP: 'Peso COP' };
const MONEDAS = ['USD', 'EUR', 'COP'] as const;

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

/**
 * Marquesina estilo Wall Street para la pantalla de bienvenida: fecha, hora
 * en vivo y las tasas de cambio más recientes (con la variación frente a la
 * tasa anterior), tomadas de Configuración → Tasas de Cambio. Todavía no
 * consulta bcv.org.ve en vivo — usa la última tasa que el equipo ya registró
 * en el sistema, para no depender de que la PC tenga internet en cada carga.
 */
export default function Marquee() {
  const ahora = useReloj();
  const [tasas, setTasas] = useState<Partial<Record<string, TasaHistorial[]>>>({});

  useEffect(() => {
    MONEDAS.forEach((moneda) => {
      api
        .get<TasaHistorial[]>(`/tasas-cambio?moneda=${moneda}`)
        .then((lista) => setTasas((prev) => ({ ...prev, [moneda]: lista.slice(0, 2) })))
        .catch(() => {});
    });
  }, []);

  const fecha = ahora.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = ahora.toLocaleTimeString('es-VE');

  const items: ReactNode[] = [
    <span key="fecha" className="capitalize text-white/70">{fecha}</span>,
    <span key="hora" className="font-semibold tabular-nums text-white">{hora}</span>,
  ];

  MONEDAS.forEach((moneda) => {
    const hist = tasas[moneda];
    if (!hist || hist.length === 0) return;
    const actual = hist[0].tasa;
    const anterior = hist[1]?.tasa;
    const delta = anterior !== undefined ? actual - anterior : null;
    items.push(
      <span key={moneda} className="flex items-center gap-1.5">
        <span className="text-gold-400 font-semibold">{NOMBRE_MONEDA[moneda]}</span>
        <span className="tabular-nums text-white">{formatearMonto(actual)}</span>
        {delta !== null && Math.abs(delta) > 0.0001 && (
          <span className={`tabular-nums text-[11px] ${delta > 0 ? 'text-accent-400' : 'text-red-400'}`}>
            {delta > 0 ? '▲' : '▼'} {formatearMonto(Math.abs(delta))}
          </span>
        )}
      </span>
    );
  });

  if (items.length <= 2) return null;

  const pista = (
    <div className="flex items-center gap-8 pr-8 shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap text-xs">
          {it}
          <span className="text-gold-500/30">•</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquesina-pausada relative overflow-hidden border-y border-white/10 bg-black/30 backdrop-blur-sm py-2">
      <div className="marquesina-pista flex w-max">
        {pista}
        {pista}
      </div>
    </div>
  );
}
