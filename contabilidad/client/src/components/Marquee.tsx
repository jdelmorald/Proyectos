import { ReactNode, useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatearMonto } from '../utils/formato';

interface TasaHistorial {
  id: number;
  fecha: string;
  moneda: 'USD' | 'COP' | 'EUR';
  tasa: number;
}

const MONEDAS = ['USD', 'EUR', 'COP'] as const;
const SIMBOLO: Record<(typeof MONEDAS)[number], string> = { USD: 'USD/VES', EUR: 'EUR/VES', COP: 'COP/VES' };

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

function Ticker({ simbolo, valor, delta, decimales = 2 }: { simbolo: string; valor: number; delta: number | null; decimales?: number }) {
  const subio = delta !== null && delta > 0.0001;
  const bajo = delta !== null && delta < -0.0001;
  return (
    <span className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] pl-2 pr-2.5 py-1">
      <span className="font-display text-[11px] font-semibold tracking-wide text-gold-400">{simbolo}</span>
      <span className="tabular-nums text-sm font-medium text-white">{formatearMonto(valor, decimales)}</span>
      {delta !== null && (subio || bajo) && (
        <span className={`flex items-center gap-0.5 tabular-nums text-[11px] font-semibold ${subio ? 'text-accent-400' : 'text-red-400'}`}>
          {subio ? '▲' : '▼'} {formatearMonto(Math.abs(delta), decimales)}
        </span>
      )}
    </span>
  );
}

/**
 * Marquesina estilo Wall Street para la pantalla de bienvenida: fecha, hora
 * en vivo, las tasas BCV más recientes (con variación frente a la tasa
 * anterior) y el cruce peso colombiano/dólar derivado de las mismas tasas.
 * Todavía no consulta bcv.org.ve en vivo — usa la última tasa que el equipo
 * ya registró en Configuración → Tasas de Cambio, para no depender de que la
 * PC tenga internet en cada carga.
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
    <span key="fecha" className="capitalize text-white/60 text-xs">{fecha}</span>,
    <span key="hora" className="font-display font-semibold tabular-nums text-white text-sm">{hora}</span>,
  ];

  MONEDAS.forEach((moneda) => {
    const hist = tasas[moneda];
    if (!hist || hist.length === 0) return;
    const actual = hist[0].tasa;
    const anterior = hist[1]?.tasa;
    const delta = anterior !== undefined ? actual - anterior : null;
    items.push(<Ticker key={moneda} simbolo={SIMBOLO[moneda]} valor={actual} delta={delta} />);
  });

  // Cruce peso colombiano / dólar, derivado de las dos tasas frente al bolívar
  // que ya tenemos (BsPorUSD ÷ BsPorCOP = COP por cada USD) — sin necesitar
  // ninguna fuente de datos nueva.
  const histUsd = tasas.USD;
  const histCop = tasas.COP;
  if (histUsd?.[0] && histCop?.[0]) {
    const cruceActual = histUsd[0].tasa / histCop[0].tasa;
    const cruceAnterior = histUsd[1] && histCop[1] ? histUsd[1].tasa / histCop[1].tasa : null;
    const deltaCruce = cruceAnterior !== null ? cruceActual - cruceAnterior : null;
    items.push(<Ticker key="cop-usd" simbolo="USD/COP" valor={cruceActual} delta={deltaCruce} decimales={0} />);
  }

  if (items.length <= 2) return null;

  const pista = (
    <div className="flex items-center gap-4 pr-4 shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-4 whitespace-nowrap">
          {it}
          <span className="text-gold-500/25 text-xs">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquesina-pausada relative overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur-md py-2 shadow-lg shadow-black/20">
      <div className="marquesina-pista flex w-max">
        {pista}
        {pista}
      </div>
    </div>
  );
}
