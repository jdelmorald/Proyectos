export default function BrandLogo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const dims = { sm: { icon: 28, text: 'text-sm', gap: 'gap-2' }, md: { icon: 36, text: 'text-lg', gap: 'gap-2.5' }, lg: { icon: 44, text: 'text-xl', gap: 'gap-3' } }[size];

  return (
    <div className={`flex items-center ${dims.gap}`}>
      <svg width={dims.icon} height={dims.icon} viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="barGrad1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="barGrad3" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#b8923e" />
            <stop offset="100%" stopColor="#e8d5a3" />
          </linearGradient>
        </defs>
        <rect x="2" y="20" width="7" height="18" rx="2" fill="url(#barGrad1)" />
        <rect x="13" y="12" width="7" height="26" rx="2" fill="url(#barGrad2)" />
        <rect x="24" y="4" width="7" height="34" rx="2" fill="url(#barGrad3)" />
        <path d="M2 17 L13 9 L24 1" stroke={light ? '#e8d5a3' : '#101a2b'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity={light ? '0.55' : '0.35'} />
      </svg>
      <div className={`font-display font-semibold leading-tight tracking-tight ${light ? 'text-white' : 'text-brand-900'} ${dims.text}`}>
        <div>GRUPO</div>
        <div className="-mt-1">DELDER</div>
      </div>
    </div>
  );
}
