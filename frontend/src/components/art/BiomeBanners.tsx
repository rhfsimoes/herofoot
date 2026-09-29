export interface BiomeBannerProps {
  biome?: string
  terrain?: string
  name?: string
  className?: string
  height?: number | string
  compact?: boolean
  showBadge?: boolean
}

/**
 * 1. CAMPO VERDEJANTE (Plains)
 * Colinas ao entardecer místico, ruínas de pedras antigas cobertas de hera e sol dourado.
 */
export function PlainsBanner({ className = '', height = 110 }: { className?: string; height?: number | string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id="plainsSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a29" />
          <stop offset="40%" stopColor="#2d5236" />
          <stop offset="80%" stopColor="#415e34" />
          <stop offset="100%" stopColor="#5d5a2d" />
        </linearGradient>

        <linearGradient id="plainsSun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="plainsHillFar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#142c1b" />
          <stop offset="100%" stopColor="#0b1b11" />
        </linearGradient>

        <linearGradient id="plainsHillMid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#163820" />
          <stop offset="100%" stopColor="#0a170d" />
        </linearGradient>

        <linearGradient id="plainsHillNear" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#194827" />
          <stop offset="100%" stopColor="#061209" />
        </linearGradient>
      </defs>

      {/* Céu */}
      <rect width="600" height="120" fill="url(#plainsSky)" />

      {/* Sol Dourado ao Poente */}
      <circle cx="480" cy="50" r="45" fill="url(#plainsSun)" />
      <circle cx="480" cy="50" r="65" fill="#fef08a" opacity="0.06" />

      {/* Névoa de horizonte */}
      <rect x="0" y="55" width="600" height="30" fill="#fef9c3" opacity="0.12" />

      {/* Colinas Distantes */}
      <path
        d="M0 65 Q 120 40, 260 55 T 480 48 T 600 62 L 600 120 L 0 120 Z"
        fill="url(#plainsHillFar)"
        opacity="0.85"
      />

      {/* Silhueta de Ruínas de Monólito de Pedra */}
      <g opacity="0.5" fill="#0f2918">
        <rect x="360" y="38" width="8" height="24" rx="1" />
        <rect x="374" y="34" width="9" height="28" rx="1" />
        <rect x="356" y="32" width="30" height="6" rx="1" />
        <rect x="410" y="44" width="7" height="16" rx="1" />
      </g>

      {/* Colinas Médias */}
      <path
        d="M0 78 Q 140 60, 310 74 T 520 68 T 600 82 L 600 120 L 0 120 Z"
        fill="url(#plainsHillMid)"
      />

      {/* Carvalho Heroico em Silhueta */}
      <g transform="translate(90, 42) scale(0.9)" opacity="0.85">
        <path
          d="M25 55 Q 26 40, 28 32 Q 22 28, 14 30 Q 18 20, 24 22 Q 26 12, 34 16 Q 42 8, 48 18 Q 58 14, 56 26 Q 64 28, 58 36 Q 52 44, 40 46 L 42 55 Z"
          fill="#06180c"
        />
      </g>

      {/* Colinas Frontais */}
      <path
        d="M0 92 Q 180 82, 340 94 T 600 90 L 600 120 L 0 120 Z"
        fill="url(#plainsHillNear)"
      />

      {/* Detalhes de Grama ao Vento */}
      <path
        d="M40 92 L42 84 M42 92 L46 86 M180 94 L183 87 M184 94 L188 88 M460 90 L463 83 M464 90 L468 85"
        stroke="#4ade80"
        strokeWidth="1.2"
        opacity="0.3"
      />

      {/* Vinheta Escura */}
      <rect width="600" height="120" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
    </svg>
  )
}

/**
 * 2. PÂNTANO PÚTRIDO (Swamp)
 * Névoa ácida bioluminescente, águas estagnadas e árvores decrépitas retorcidas.
 */
export function SwampBanner({ className = '', height = 110 }: { className?: string; height?: number | string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id="swampSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#091811" />
          <stop offset="50%" stopColor="#142c1f" />
          <stop offset="100%" stopColor="#1b3a2a" />
        </linearGradient>

        <linearGradient id="swampWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0e2318" />
          <stop offset="50%" stopColor="#071810" />
          <stop offset="100%" stopColor="#030c07" />
        </linearGradient>

        <radialGradient id="toxicSpores" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86efac" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#14532d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Céu Noturno Pantanoso */}
      <rect width="600" height="120" fill="url(#swampSky)" />

      {/* Névoa Tóxica em Camadas */}
      <ellipse cx="200" cy="65" rx="160" ry="25" fill="#15803d" opacity="0.25" />
      <ellipse cx="450" cy="70" rx="180" ry="20" fill="#16a34a" opacity="0.2" />

      {/* Silhueta de Árvores Mortas Retorcidas ao Fundo */}
      <g fill="#05120a" opacity="0.7">
        <path d="M70 75 Q 73 50, 71 30 Q 64 25, 58 26 Q 70 20, 75 14 Q 77 22, 85 24 Q 93 25, 87 32 Q 81 48, 83 75 Z" />
        <path d="M240 76 Q 242 55, 240 38 Q 235 34, 230 36 Q 239 28, 244 24 Q 248 30, 256 32 Q 248 45, 250 76 Z" />
        <path d="M510 75 Q 513 48, 511 28 Q 502 24, 496 26 Q 508 18, 514 12 Q 518 20, 528 22 Q 520 40, 522 75 Z" />
      </g>

      {/* Esporos e Vaga-lumes Bioluminescentes Tóxicos */}
      <circle cx="120" cy="52" r="3" fill="url(#toxicSpores)" />
      <circle cx="120" cy="52" r="1.2" fill="#dcfce7" />
      <circle cx="180" cy="40" r="4" fill="url(#toxicSpores)" />
      <circle cx="180" cy="40" r="1.5" fill="#dcfce7" />
      <circle cx="320" cy="48" r="3.5" fill="url(#toxicSpores)" />
      <circle cx="320" cy="48" r="1.3" fill="#dcfce7" />
      <circle cx="430" cy="35" r="5" fill="url(#toxicSpores)" />
      <circle cx="430" cy="35" r="1.8" fill="#dcfce7" />
      <circle cx="540" cy="56" r="3" fill="url(#toxicSpores)" />

      {/* Linha d'água Lamosa com Reflexo */}
      <path
        d="M0 74 Q 150 71, 300 75 T 600 73 L 600 120 L 0 120 Z"
        fill="url(#swampWater)"
      />

      {/* Raízes de Mangue Retorcidas no Primeiro Plano */}
      <path
        d="M-10 120 L15 88 Q 28 85, 35 96 L42 120 Z
           M560 120 L575 90 Q 585 86, 595 94 L605 120 Z"
        fill="#040d07"
      />

      {/* Reflexos Verdes na Água */}
      <line x1="160" y1="90" x2="220" y2="90" stroke="#4ade80" strokeWidth="1" opacity="0.3" />
      <line x1="300" y1="100" x2="380" y2="100" stroke="#22c55e" strokeWidth="1" opacity="0.25" />
      <line x1="410" y1="88" x2="470" y2="88" stroke="#4ade80" strokeWidth="1.2" opacity="0.3" />
    </svg>
  )
}

/**
 * 3. CRIPTA GLACIAL (Glacial Crypt / Tundra)
 * Estalactites de gelo translúcidas, tempestade de neve mística e runas congeladas.
 */
export function GlacialBanner({ className = '', height = 110 }: { className?: string; height?: number | string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id="iceSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#081826" />
          <stop offset="50%" stopColor="#0e2942" />
          <stop offset="100%" stopColor="#1a4568" />
        </linearGradient>

        <linearGradient id="iceShardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="40%" stopColor="#7dd3fc" />
          <stop offset="80%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#034b75" />
        </linearGradient>

        <linearGradient id="snowGround" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="30%" stopColor="#0c2338" />
          <stop offset="100%" stopColor="#040e17" />
        </linearGradient>
      </defs>

      {/* Fundo Noturno Ártico */}
      <rect width="600" height="120" fill="url(#iceSky)" />

      {/* Aurora Boreal Glacial Sutil */}
      <path
        d="M0 30 Q 150 10, 300 35 T 600 20 L 600 55 Q 450 40, 300 60 T 0 45 Z"
        fill="#38bdf8"
        opacity="0.12"
      />

      {/* Estalactites Superiores de Gelo (Teto da Caverna Congelada) */}
      <polygon points="40,0 48,28 56,0" fill="url(#iceShardGrad)" opacity="0.8" />
      <polygon points="90,0 95,20 100,0" fill="url(#iceShardGrad)" opacity="0.6" />
      <polygon points="180,0 190,38 200,0" fill="url(#iceShardGrad)" opacity="0.85" />
      <polygon points="270,0 276,24 282,0" fill="url(#iceShardGrad)" opacity="0.65" />
      <polygon points="380,0 392,34 404,0" fill="url(#iceShardGrad)" opacity="0.8" />
      <polygon points="490,0 500,42 510,0" fill="url(#iceShardGrad)" opacity="0.9" />
      <polygon points="560,0 568,22 576,0" fill="url(#iceShardGrad)" opacity="0.7" />

      {/* Montanhas de Gelo Angulares ao Fundo */}
      <polygon points="80,85 170,38 260,85" fill="#0c253b" opacity="0.7" />
      <polygon points="220,85 330,30 440,85" fill="#091e30" opacity="0.85" />
      <polygon points="410,85 490,42 570,85" fill="#071724" opacity="0.7" />

      {/* Cristais de Gelo Pontiagudos no Solo */}
      <polygon points="120,95 128,62 136,95" fill="url(#iceShardGrad)" opacity="0.9" />
      <polygon points="240,98 248,58 256,98" fill="url(#iceShardGrad)" opacity="0.9" />
      <polygon points="450,96 460,54 470,96" fill="url(#iceShardGrad)" opacity="0.9" />

      {/* Solo Congelado */}
      <path
        d="M0 86 Q 160 80, 310 88 T 600 84 L 600 120 L 0 120 Z"
        fill="url(#snowGround)"
      />

      {/* Partículas de Nevasca */}
      {[25, 75, 140, 210, 290, 360, 420, 480, 550].map((x, i) => (
        <circle key={i} cx={x} cy={30 + (i * 9) % 60} r={(i % 3) * 0.7 + 1} fill="#e0f2fe" opacity="0.65" />
      ))}
    </svg>
  )
}

/**
 * 4. MINA PROFUNDA (Deep Mines / Cavern)
 * Vigas arcaicas de sustentação, cristais de ametista/ouro, e lanternas incandescentes.
 */
export function MinesBanner({ className = '', height = 110 }: { className?: string; height?: number | string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id="minesRock" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#17120e" />
          <stop offset="50%" stopColor="#241a14" />
          <stop offset="100%" stopColor="#0c0907" />
        </linearGradient>

        <linearGradient id="mineWoodBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#382110" />
          <stop offset="50%" stopColor="#543319" />
          <stop offset="100%" stopColor="#2b180a" />
        </linearGradient>

        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="80%" stopColor="#b45309" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="goldOreCluster" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>

      {/* Rocha Escavada de Fundo */}
      <rect width="600" height="120" fill="url(#minesRock)" />

      {/* Veios de Ouro e Minério na Parede da Caverna */}
      <path
        d="M80 30 Q 110 38, 140 32 T 180 40
           M340 25 Q 380 35, 420 30 T 470 38"
        stroke="url(#goldOreCluster)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />

      {/* Geodo de Cristais Dourados */}
      <polygon points="120,40 124,30 128,40" fill="#fef08a" />
      <polygon points="127,41 133,32 137,41" fill="#facc15" />
      <polygon points="410,36 415,26 420,36" fill="#fef08a" />

      {/* Vigas Arcaicas de Madeira de Mina (Arcos de Sustentação) */}
      {/* Viga Esquerda */}
      <rect x="50" y="0" width="12" height="120" fill="url(#mineWoodBeam)" stroke="#1a0e06" strokeWidth="1" />
      <rect x="44" y="10" width="24" height="8" fill="url(#mineWoodBeam)" stroke="#1a0e06" strokeWidth="1" />

      {/* Viga Superior Transversal */}
      <rect x="50" y="12" width="500" height="10" fill="url(#mineWoodBeam)" stroke="#1a0e06" strokeWidth="1" />

      {/* Viga Direita */}
      <rect x="538" y="0" width="12" height="120" fill="url(#mineWoodBeam)" stroke="#1a0e06" strokeWidth="1" />
      <rect x="532" y="10" width="24" height="8" fill="url(#mineWoodBeam)" stroke="#1a0e06" strokeWidth="1" />

      {/* Escora Diagonal da Madeira */}
      <polygon points="62,22 86,22 62,46" fill="#2b180a" />
      <polygon points="538,22 514,22 538,46" fill="#2b180a" />

      {/* Lanterna de Mineiro Pendurada */}
      <line x1="290" y1="22" x2="290" y2="44" stroke="#475569" strokeWidth="1.5" />
      {/* Halo de Luz Âmbar da Lanterna */}
      <circle cx="290" cy="55" r="45" fill="url(#lanternGlow)" />
      {/* Corpo da Lanterna */}
      <rect x="284" y="44" width="12" height="18" fill="#1e293b" rx="2" stroke="#475569" strokeWidth="0.8" />
      <rect x="286" y="47" width="8" height="11" fill="#fef08a" rx="1" />

      {/* Trilhos da Mina no Piso de Pedra */}
      <path
        d="M0 108 L600 108 M0 114 L600 114"
        stroke="#475569"
        strokeWidth="2"
      />
      {/* Dormentes de Madeira */}
      {[20, 80, 140, 200, 260, 320, 380, 440, 500, 560].map((x, i) => (
        <rect key={i} x={x} y="105" width="24" height="12" fill="#382110" opacity="0.9" />
      ))}
    </svg>
  )
}

/**
 * 5. CALDEIRA VULCÂNICA (Volcanic Caldera / Inferno)
 * Fissuras de magma incandescente alaranjado, basalto negro e faíscas incandescentes.
 */
export function VolcanicBanner({ className = '', height = 110 }: { className?: string; height?: number | string }) {
  return (
    <svg
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    >
      <defs>
        <linearGradient id="volcanoSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a0505" />
          <stop offset="50%" stopColor="#2e0a0a" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>

        <linearGradient id="magmaRiver" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#f97316" />
          <stop offset="70%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>

        <radialGradient id="calderaGlow" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="#ff4400" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#b91c1c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Céu Fumegante */}
      <rect width="600" height="120" fill="url(#volcanoSky)" />

      {/* Brilho da Caldeira Infernal */}
      <rect width="600" height="120" fill="url(#calderaGlow)" />

      {/* Picos Pontiagudos de Basalto Negro ao Fundo */}
      <polygon points="60,80 140,25 220,80" fill="#140606" />
      <polygon points="180,80 270,18 360,80" fill="#0d0303" />
      <polygon points="320,80 430,28 540,80" fill="#140606" />

      {/* Fumaça Vulcânica Ondulante */}
      <ellipse cx="270" cy="18" rx="35" ry="12" fill="#450a0a" opacity="0.6" />
      <ellipse cx="260" cy="10" rx="45" ry="14" fill="#260606" opacity="0.4" />

      {/* Rio de Magma e Fissuras Incandescentes */}
      <path
        d="M0 88
           Q 130 82, 240 92
           T 420 86
           T 600 95
           L 600 120
           L 0 120 Z"
        fill="url(#magmaRiver)"
      />

      {/* Crosta de Basalto Flutuante na Lava */}
      <polygon points="40,94 95,96 110,108 50,110" fill="#1c0707" />
      <polygon points="180,98 250,96 270,112 200,114" fill="#1c0707" />
      <polygon points="360,95 440,96 460,110 375,112" fill="#1c0707" />
      <polygon points="500,98 560,97 580,110 520,112" fill="#1c0707" />

      {/* Faíscas Incandescentes Subindo */}
      {[50, 110, 190, 260, 330, 400, 480, 540].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={40 + ((i * 13) % 45)}
          r={(i % 2) * 0.8 + 1.2}
          fill="#fef08a"
          className="animate-pulse"
        />
      ))}
    </svg>
  )
}

/**
 * Mapeador e Seletor Inteligente de Biomas
 */
export default function BiomeBanner({
  biome,
  terrain,
  name,
  className = '',
  height = 110,
  compact = false,
  showBadge = true,
}: BiomeBannerProps) {
  const key = (terrain || biome || '').toLowerCase()

  let BannerComponent = PlainsBanner
  let label = 'Campo Verdejante'
  let badgeColor = 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'

  if (key.includes('swamp') || key.includes('pantano') || key.includes('putrido') || key.includes('acido')) {
    BannerComponent = SwampBanner
    label = 'Pântano Pútrido'
    badgeColor = 'bg-lime-950/80 border-lime-700/60 text-lime-300'
  } else if (key.includes('glacial') || key.includes('tundra') || key.includes('gelo') || key.includes('cripta')) {
    BannerComponent = GlacialBanner
    label = 'Cripta Glacial'
    badgeColor = 'bg-sky-950/80 border-sky-700/60 text-sky-300'
  } else if (key.includes('mine') || key.includes('mina') || key.includes('cavern') || key.includes('subterraneo')) {
    BannerComponent = MinesBanner
    label = 'Mina Profunda'
    badgeColor = 'bg-amber-950/80 border-amber-700/60 text-amber-300'
  } else if (key.includes('vulcan') || key.includes('inferno') || key.includes('caldeira') || key.includes('lava') || key.includes('fogo')) {
    BannerComponent = VolcanicBanner
    label = 'Caldeira Vulcânica'
    badgeColor = 'bg-rose-950/80 border-rose-700/60 text-rose-300'
  }

  const effectiveHeight = compact ? 70 : height

  return (
    <div className={`relative rounded-xl overflow-hidden border border-stone-800/80 shadow-lg ${className}`}>
      <BannerComponent height={effectiveHeight} />

      {/* Gradiente de sobreposição para texto e contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40 pointer-events-none" />

      {showBadge && (
        <div className="absolute top-2.5 left-3 flex items-center gap-2">
          <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border shadow-sm ${badgeColor}`}>
            Bioma: {name || label}
          </span>
        </div>
      )}
    </div>
  )
}
