import { MouseEvent, ReactNode, useRef, useState } from 'react';

interface Props {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  borderClass?: string;
  borderColorInline?: string;
  glowColor: string;
  logo: ReactNode;
  nombre: string;
  nombreClass?: string;
  bar: ReactNode;
}

/**
 * Tarjeta de empresa con inclinación 3D que sigue el mouse, un resplandor en
 * el color propio de cada marca y un barrido de brillo al pasar el cursor —
 * el logo vive en su propia placa blanca (no en el fondo de vidrio general)
 * para que nunca se note el recuadro del PNG/JPG original contra el blur.
 */
export default function EmpresaCard({
  onClick, title, disabled, borderClass, borderColorInline, glowColor, logo, nombre, nombreClass, bar,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  function onMouseMove(e: MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 10 });
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
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hover ? 1.035 : 1})`,
        transition: hover ? 'transform 80ms ease-out' : 'transform 350ms ease',
        boxShadow: hover ? `0 0 0 1px ${glowColor}55, 0 20px 45px -12px ${glowColor}66, 0 0 40px -8px ${glowColor}55` : undefined,
        borderColor: borderColorInline,
      }}
      className={`group relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl border-2 p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 shadow-xl shadow-black/25 ${borderClass || ''} ${disabled ? 'opacity-50 grayscale-[0.5]' : ''}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-[130%] group-hover:translate-x-[130%] transition-transform duration-700 ease-out"
        style={{ background: 'linear-gradient(75deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)' }}
      />
      {disabled && <span className="absolute top-2 right-2 text-xs z-10" aria-hidden="true">🔒</span>}

      <div className="relative z-10 bg-white rounded-xl p-3 shadow-sm ring-1 ring-black/5">{logo}</div>
      <div className={`relative z-10 text-sm sm:text-lg font-extrabold tracking-tight text-center ${nombreClass || 'text-brand-900'}`}>
        {nombre}
      </div>
      <div className="relative z-10 w-16">{bar}</div>
    </button>
  );
}
