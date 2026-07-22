/**
 * Fondo animado compartido por Login y Bienvenida: base azul marino profundo,
 * una retícula tipo terminal financiero que deriva lentamente, resplandores
 * dorado/esmeralda (los acentos de marca), y dos referencias venezolanas —
 * cada una siempre reconocible, sin efectos que las vuelvan abstractas:
 *   1. El contorno real del país (geometría exacta, no un dibujo a mano)
 *      como marca de agua grande que se desplaza en un vaivén horizontal
 *      suave — nunca gira, así nunca deja de leerse como un mapa.
 *   2. La silueta de tepuyes (mesas de cima plana, Roraima/Gran Sabana) al
 *      pie de la pantalla, con un tono claramente más claro que el fondo
 *      para que no se pierdan en la oscuridad.
 * Todo en CSS/SVG (sin video ni canvas) para que cargue instantáneo incluso
 * en equipos modestos, y respeta prefers-reduced-motion.
 */

// Contorno real de Venezuela (proyección Mercator, world-atlas 110m),
// no un trazo hecho a mano — para que se reconozca de inmediato.
const VENEZUELA_PATH =
  'M927.983,594.65L937.816,615.597L910.71,643.805L828.328,671.496L775.179,683.02L753.92,700.552L695.19,682.018L640.446,672.498L626.628,679.388L659.846,698.549L656.657,748.116L667.021,794.65L729.471,801.028L733.457,816.533L680.84,837.536L672.336,868.785L641.775,880.908L587.032,898.154L572.681,920.771L515.28,925.519L474.621,886.532L452.033,812.907L432.368,787.021L405.793,770.76L442.998,733.975L440.606,717.328L419.612,695.418L404.73,646.186L410.577,593.145L427.053,568.171L440.34,528.234L414.031,515.415L372.044,523.961L318.894,519.94L289.131,527.857L237.045,463.972L194.26,454.531L99.389,461.706L81.85,435.64L63.513,429.467L60.856,413.966L69.625,386.347L64.045,356.304L47.568,339.88L38.267,305.613L0,300.551L20.462,256.854L29.498,203.3L51.023,175.333L79.458,153.825L98.326,116.231L145.628,103.6L143.503,121.333L100.186,130.13L124.369,164.263L123.572,203.554L90.885,247.218L118.788,306.499L150.678,301.69L167.154,247.599L144.3,221.207L140.579,164.391L232.527,133.698L222.429,98.239L248.206,74.481L274.781,127.453L326.601,128.6L374.435,170.626L377.358,195.422L443.529,196.185L522.455,188.431L564.709,221.969L621.313,231.361L662.503,207.874L663.566,188.94L754.983,184.49L843.476,183.345L780.76,205.587L806.006,241.004L865.001,246.584L920.808,283.461L932.766,343.292L971.034,341.649L1000,359.208L941.536,402.997L935.158,430.097L960.404,457.804L942.067,471.649L896.625,483.602L897.954,517.929L878.023,538.41Z';

// Silueta de tres tepuyes bien diferenciados: paredes verticales que suben
// directo desde la base y cimas totalmente planas — nada de escalones
// pequeños que se vean como ruido abstracto.
const TEPUY_PATH =
  'M0 220 L0 220 L60 220 L60 132 L280 132 L280 220 L540 220 L540 58 L840 58 L840 220 L1100 220 L1100 148 L1320 148 L1320 220 L1440 220 Z';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070c16]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#101a2b_0%,_#070c16_60%)]" />

      <div className="fondo-reticula absolute inset-0 opacity-[0.12]" />

      <div className="fondo-orbe fondo-orbe-oro absolute h-[38rem] w-[38rem] rounded-full blur-[110px]" />
      <div className="fondo-orbe fondo-orbe-esmeralda absolute h-[30rem] w-[30rem] rounded-full blur-[100px]" />

      {/* 1. Contorno de Venezuela: marca de agua grande, vaivén horizontal suave (nunca gira) */}
      <svg
        className="fondo-mapa-ve absolute -right-[12%] -top-[10%] w-[55rem] h-[55rem] opacity-[0.09]"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <path d={VENEZUELA_PATH} fill="#d4af5a" />
      </svg>

      {/* 2. Silueta de tepuyes (Roraima / Gran Sabana): tono claramente más claro que el cielo de fondo */}
      <svg className="absolute bottom-0 left-0 w-full h-40 sm:h-56 opacity-90" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none">
        <path d={TEPUY_PATH} fill="#1b2942" stroke="#d4af5a" strokeOpacity="0.22" strokeWidth="2" />
      </svg>

      <div className="fondo-linea-tendencia absolute inset-0 opacity-[0.18]" />
    </div>
  );
}
