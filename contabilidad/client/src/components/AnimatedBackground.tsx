import { useEffect, useRef } from 'react';

interface Props {
  /**
   * 'derecha': zona nítida amplia desplazada a la derecha (Login, junto al
   *   panel de vidrio a la izquierda).
   * 'parejo': desenfoque uniforme en toda la pantalla, sin punto de foco —
   *   para que ninguna zona compita visualmente con el contenido encima
   *   (Bienvenida, donde hay texto y tarjetas centradas).
   */
  foco?: 'derecha' | 'parejo';
}

const COLUMNAS = 11;
const FILAS_POR_COLUMNA = 22;

function filaAleatoria() {
  const subida = Math.random() > 0.32;
  const valor = Math.floor(100 + Math.random() * 9899);
  const pct = (Math.random() * 19 + 0.3).toFixed(2);
  return { valor, pct, subida };
}

function filaHTML() {
  const { valor, pct, subida } = filaAleatoria();
  return `<div class="muro-fila"><span class="muro-num">${valor}</span><span class="muro-pct ${subida ? 'muro-up' : 'muro-down'}"><span class="muro-flecha">${subida ? '▲' : '▼'}</span> ${pct}%</span></div>`;
}

/**
 * Fondo animado compartido por Login y Bienvenida: un "muro" denso de cifras
 * bursátiles generadas en vivo (no un video en loop) — así el efecto es
 * literalmente infinito, sin ningún punto de costura que disimular. Los
 * valores se generan y refrescan con JavaScript; el desplazamiento vertical
 * y el desenfoque de profundidad son CSS puro.
 */
export default function AnimatedBackground({ foco = 'derecha' }: Props) {
  const muroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = muroRef.current;
    if (!contenedor) return;

    for (let c = 0; c < COLUMNAS; c++) {
      const columna = document.createElement('div');
      columna.className = 'muro-columna';
      const pista = document.createElement('div');
      pista.className = 'muro-pista';
      const duracion = 16 + Math.random() * 12;
      pista.style.animationDuration = `${duracion.toFixed(1)}s`;
      pista.style.animationDirection = c % 2 === 0 ? 'normal' : 'reverse';

      let html = '';
      for (let f = 0; f < FILAS_POR_COLUMNA; f++) html += filaHTML();
      // Duplicado para que el loop vertical (translateY 0 → -50%) no salte.
      pista.innerHTML = html + html;

      columna.appendChild(pista);
      contenedor.appendChild(columna);
    }

    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereMenosMovimiento) return;

    const intervalo = window.setInterval(() => {
      const filas = contenedor.querySelectorAll<HTMLElement>('.muro-fila');
      if (!filas.length) return;
      const cuantas = 8 + Math.floor(Math.random() * 12);
      for (let i = 0; i < cuantas; i++) {
        const fila = filas[Math.floor(Math.random() * filas.length)];
        const num = fila.querySelector('.muro-num');
        const pctSpan = fila.querySelector<HTMLElement>('.muro-pct');
        if (!num || !pctSpan) continue;
        const { valor, pct, subida } = filaAleatoria();
        num.textContent = String(valor);
        pctSpan.className = `muro-pct ${subida ? 'muro-up' : 'muro-down'}`;
        pctSpan.innerHTML = `<span class="muro-flecha">${subida ? '▲' : '▼'}</span> ${pct}%`;
      }
    }, 700);

    return () => {
      window.clearInterval(intervalo);
      contenedor.innerHTML = '';
    };
  }, []);

  const parejo = foco === 'parejo';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070c16]">
      <div
        className="absolute inset-0"
        style={{
          background: parejo
            ? 'radial-gradient(ellipse 70% 75% at 50% 40%, #131f34 0%, #070c16 62%)'
            : 'radial-gradient(ellipse 70% 75% at 30% 40%, #131f34 0%, #070c16 62%)',
        }}
      />

      {!parejo && (
        <div
          className="absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full blur-[20px]"
          style={{ background: 'radial-gradient(circle, rgba(212,175,90,0.2) 0%, rgba(212,175,90,0) 70%)' }}
        />
      )}

      <div ref={muroRef} className="muro-datos absolute -inset-x-[4%] -inset-y-[8%] flex gap-[0.3vw]" />

      {parejo ? (
        <>
          <div className="muro-velo-parejo absolute inset-0" />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,175,90,0.08) 0%, rgba(212,175,90,0) 60%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(7,12,22,0) 55%, rgba(7,12,22,0.55) 100%)' }}
          />
        </>
      ) : (
        <>
          <div className="muro-velo-enfoque absolute inset-0" />
          <div className="muro-velo-enfoque muro-velo-fuerte absolute inset-0" />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 42% 45% at 84% 26%, rgba(212,175,90,0.09) 0%, rgba(212,175,90,0) 60%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 105% 100% at 60% 50%, rgba(7,12,22,0) 60%, rgba(7,12,22,0.55) 100%)' }}
          />
        </>
      )}
    </div>
  );
}
