import { MouseEvent, ReactNode, useRef, useState } from 'react';

interface Props {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  glowColor: string;
  logo: ReactNode;
  nombre: string;
  bar: ReactNode;
}

/**
 * Tarjeta de empresa: vidrio esmerilado oscuro (igual lenguaje que el panel
 * de Login), con inclinación 3D que sigue el mouse y un halo permanente en el
 * color propio de cada marca — se intensifica al pasar el cursor, pero nunca
 * queda invisible contra el fondo oscuro. El logo vive en su propia placa
 * blanca (no en el fondo de vidrio) para que nunca se note el recuadro del
 * PNG/JPG original contra el blur.
 */
export default function EmpresaCard({
  onClick, title, disabled, glowColor, logo, nombre, bar,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  function onMouseMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -16, y: px * 16 });
  }
  function onLeave() {
    setTilt({ x: 0, y: 0 });
    setHover(false);
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      title={title}
      style={{
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hover ? 1.05 : 1})`,
        transition: hover ? 'transform 80ms ease-out' : 'transform 350ms ease',
        borderColor: `${glowColor}${hover ? 'aa' : '80'}`,
        boxShadow: hover
          ? `0 0 0 1px ${glowColor}aa, 0 25px 50px -12px ${glowColor}88, 0 0 55px 4px ${glowColor}77`
          : `0 0 0 1px ${glowColor}40, 0 12px 30px -10px ${glowColor}55, 0 0 30px 0px ${glowColor}40`,
      }}
      className={`group relative overflow-hidden bg-white/[0.07] backdrop-blur-xl rounded-2xl border p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 ${disabled ? 'opacity-50 grayscale-[0.5]' : ''}`}
    >
      {/* Resplandor de marca de fondo: siempre presente, crece con el hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-2xl transition-opacity duration-300"
        style={{ background: glowColor, opacity: hover ? 0.32 : 0.16 }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-[130%] group-hover:translate-x-[130%] transition-transform duration-700 ease-out"
        style={{ background: 'linear-gradient(75deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)' }}
      />
      {disabled && <span className="absolute top-2 right-2 text-xs z-10" aria-hidden="true">🔒</span>}

      <div className="relative z-10 bg-white rounded-xl p-3 shadow-sm ring-1 ring-black/5">{logo}</div>
      <div className="relative z-10 text-sm sm:text-lg font-display font-semibold tracking-tight text-center text-white">
        {nombre}
      </div>
      <div className="relative z-10 w-16">{bar}</div>
    </button>
  );
}
