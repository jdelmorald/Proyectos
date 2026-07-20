export default function FinancialIllustration() {
  return (
    <svg viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3d98b" />
          <stop offset="100%" stopColor="#d4af5a" />
        </linearGradient>
        <linearGradient id="coinTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf0c9" />
          <stop offset="100%" stopColor="#e8d5a3" />
        </linearGradient>
        <linearGradient id="barOrange" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="barTeal" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="barPurple" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="barGold" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#b8923e" />
          <stop offset="100%" stopColor="#f3d98b" />
        </linearGradient>
        <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#101a2b" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Base platform ellipse */}
      <ellipse cx="210" cy="345" rx="170" ry="18" fill="#101a2b" opacity="0.06" />

      {/* Bar chart */}
      <g filter="url(#softShadow)">
        <rect x="60" y="230" width="34" height="100" rx="6" fill="url(#barOrange)" />
        <rect x="106" y="180" width="34" height="150" rx="6" fill="url(#barTeal)" />
        <rect x="152" y="205" width="34" height="125" rx="6" fill="url(#barPurple)" />
        <rect x="198" y="140" width="34" height="190" rx="6" fill="url(#barGold)" />
      </g>

      {/* Ascending trend line */}
      <g filter="url(#softShadow)">
        <polyline
          points="70,300 130,255 190,270 250,190 300,150 360,95"
          fill="none"
          stroke="#6d28d9"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[
          [70, 300],
          [130, 255],
          [190, 270],
          [250, 190],
          [300, 150],
          [360, 95],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill="#ffffff" stroke="#6d28d9" strokeWidth="4" />
        ))}
        {/* arrow head */}
        <path d="M348 78 L372 90 L352 108" fill="none" stroke="#6d28d9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Stacked coins */}
      <g filter="url(#softShadow)">
        <ellipse cx="330" cy="300" rx="38" ry="12" fill="url(#coinGrad)" />
        <ellipse cx="330" cy="288" rx="38" ry="12" fill="url(#coinGrad)" />
        <ellipse cx="330" cy="276" rx="38" ry="12" fill="url(#coinTop)" />
        <text x="330" y="282" textAnchor="middle" fontSize="20" fontWeight="700" fill="#8a6a1f">$</text>
      </g>
      <g filter="url(#softShadow)" opacity="0.92">
        <ellipse cx="270" cy="325" rx="28" ry="9" fill="url(#coinGrad)" />
        <ellipse cx="270" cy="316" rx="28" ry="9" fill="url(#coinTop)" />
        <text x="270" y="321" textAnchor="middle" fontSize="15" fontWeight="700" fill="#8a6a1f">$</text>
      </g>
    </svg>
  );
}
