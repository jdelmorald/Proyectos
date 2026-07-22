/**
 * Fondo animado compartido por Login y Bienvenida: base azul marino profundo,
 * una retícula tipo terminal financiero que deriva lentamente, resplandores
 * dorado/esmeralda (los acentos de marca), y tres referencias venezolanas —
 * ninguna literal ni turística — todas animadas:
 *   1. El contorno real del país (geometría exacta, no un dibujo a mano)
 *      como marca de agua enorme que gira muy lento.
 *   2. La silueta de un tepuy (mesa de cima plana, Roraima/Gran Sabana) en
 *      vez de un perfil de montaña genérico.
 *   3. Un destello del relámpago del Catatumbo, el fenómeno eléctrico más
 *      denso del planeta — como parpadeo ocasional en el cielo.
 * Todo en CSS/SVG (sin video ni canvas) para que cargue instantáneo incluso
 * en equipos modestos, y respeta prefers-reduced-motion.
 */

// Contorno real de Venezuela (proyección Mercator, world-atlas 110m),
// no un trazo hecho a mano — para que se reconozca de inmediato.
const VENEZUELA_PATH =
  'M927.983,594.65L937.816,615.597L910.71,643.805L828.328,671.496L775.179,683.02L753.92,700.552L695.19,682.018L640.446,672.498L626.628,679.388L659.846,698.549L656.657,748.116L667.021,794.65L729.471,801.028L733.457,816.533L680.84,837.536L672.336,868.785L641.775,880.908L587.032,898.154L572.681,920.771L515.28,925.519L474.621,886.532L452.033,812.907L432.368,787.021L405.793,770.76L442.998,733.975L440.606,717.328L419.612,695.418L404.73,646.186L410.577,593.145L427.053,568.171L440.34,528.234L414.031,515.415L372.044,523.961L318.894,519.94L289.131,527.857L237.045,463.972L194.26,454.531L99.389,461.706L81.85,435.64L63.513,429.467L60.856,413.966L69.625,386.347L64.045,356.304L47.568,339.88L38.267,305.613L0,300.551L20.462,256.854L29.498,203.3L51.023,175.333L79.458,153.825L98.326,116.231L145.628,103.6L143.503,121.333L100.186,130.13L124.369,164.263L123.572,203.554L90.885,247.218L118.788,306.499L150.678,301.69L167.154,247.599L144.3,221.207L140.579,164.391L232.527,133.698L222.429,98.239L248.206,74.481L274.781,127.453L326.601,128.6L374.435,170.626L377.358,195.422L443.529,196.185L522.455,188.431L564.709,221.969L621.313,231.361L662.503,207.874L663.566,188.94L754.983,184.49L843.476,183.345L780.76,205.587L806.006,241.004L865.001,246.584L920.808,283.461L932.766,343.292L971.034,341.649L1000,359.208L941.536,402.997L935.158,430.097L960.404,457.804L942.067,471.649L896.625,483.602L897.954,517.929L878.023,538.41Z';

// Silueta de tepuy (meseta de cima plana, tipo Roraima) — paredes verticales
// y cima recta, para no confundirse con un perfil de montaña cualquiera.
const TEPUY_PATH =
  'M0 220 L0 150 L60 150 L60 90 L190 90 L190 150 L270 150 L270 55 L430 55 L430 150 L530 150 L530 35 L700 35 L700 150 L790 150 L790 95 L960 95 L960 150 L1440 150 L1440 220 Z';

// Relámpago del Catatumbo, estilizado.
const RAYO_PATH = 'M120 0 L96 62 L118 62 L84 140 L132 68 L108 68 Z';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070c16]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#101a2b_0%,_#070c16_60%)]" />

      <div className="fondo-reticula absolute inset-0 opacity-[0.12]" />

      <div className="fondo-orbe fondo-orbe-oro absolute h-[38rem] w-[38rem] rounded-full blur-[110px]" />
      <div className="fondo-orbe fondo-orbe-esmeralda absolute h-[30rem] w-[30rem] rounded-full blur-[100px]" />

      {/* 1. Contorno de Venezuela: marca de agua grande, muy sutil, gira despacio */}
      <svg
        className="fondo-mapa-ve absolute -right-[18%] -top-[12%] w-[60rem] h-[60rem] opacity-[0.05]"
        viewBox="0 0 1000 1000"
        fill="none"
      >
        <path d={VENEZUELA_PATH} fill="#d4af5a" />
      </svg>

      {/* 3. Relámpago del Catatumbo: destello ocasional en el cielo */}
      <svg className="fondo-rayo absolute right-[12%] top-[8%] w-16 sm:w-24 h-auto" viewBox="0 0 220 140" fill="none">
        <path d={RAYO_PATH} fill="#f3d98b" />
      </svg>
      <div className="fondo-flash-rayo absolute inset-0" />

      {/* 2. Silueta de tepuy (Roraima / Gran Sabana) */}
      <svg className="absolute bottom-0 left-0 w-full h-40 sm:h-56 opacity-40" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none">
        <path d={TEPUY_PATH} fill="url(#tepuyGrad)" />
        <defs>
          <linearGradient id="tepuyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#101a2b" />
            <stop offset="100%" stopColor="#070c16" />
          </linearGradient>
        </defs>
      </svg>

      <div className="fondo-linea-tendencia absolute inset-0 opacity-[0.18]" />
    </div>
  );
}
