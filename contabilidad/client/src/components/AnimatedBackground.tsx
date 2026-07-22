/**
 * Fondo animado compartido por Login y Bienvenida: base azul marino profundo,
 * una retícula tipo terminal financiero que deriva lentamente, un par de
 * resplandores dorado/esmeralda (los dos acentos de marca) y la silueta del
 * Ávila al fondo — la referencia venezolana, discreta, nunca literal.
 * Todo en CSS/SVG (sin video ni canvas) para que cargue instantáneo incluso
 * en equipos modestos, y respeta prefers-reduced-motion.
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070c16]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#101a2b_0%,_#070c16_60%)]" />

      <div className="fondo-reticula absolute inset-0 opacity-[0.12]" />

      <div className="fondo-orbe fondo-orbe-oro absolute h-[38rem] w-[38rem] rounded-full blur-[110px]" />
      <div className="fondo-orbe fondo-orbe-esmeralda absolute h-[30rem] w-[30rem] rounded-full blur-[100px]" />

      <svg className="absolute bottom-0 left-0 w-full h-40 sm:h-56 opacity-40" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none">
        <path
          d="M0 220 L0 150 L120 110 L220 150 L320 70 L420 130 L520 55 L640 120 L760 40 L880 100 L980 60 L1100 115 L1220 75 L1320 130 L1440 95 L1440 220 Z"
          fill="url(#avilaGrad)"
        />
        <defs>
          <linearGradient id="avilaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101a2b" />
            <stop offset="100%" stopColor="#070c16" />
          </linearGradient>
        </defs>
      </svg>

      <div className="fondo-linea-tendencia absolute inset-0 opacity-[0.18]" />
    </div>
  );
}
