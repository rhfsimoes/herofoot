export interface DivisionEmblemProps {
  size?: 'sm' | 'md' | 'lg' | number
  className?: string
  showLabel?: boolean
  labelClassName?: string
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 72,
}

/**
 * Insígnia da Divisão Nobre da Coroa
 * Motivos: Ouro reluzente, louros da vitória, coroa real com pedras preciosas e pergaminho imperial.
 */
export function NobleDivisionEmblem({
  size = 'md',
  className = '',
  showLabel = false,
  labelClassName = '',
}: DivisionEmblemProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 48

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        className="overflow-visible filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.25)]"
      >
        <defs>
          <linearGradient id="nobleGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#facc15" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <radialGradient id="nobleField" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#431407" />
            <stop offset="50%" stopColor="#2e1065" />
            <stop offset="100%" stopColor="#0f0728" />
          </radialGradient>

          <linearGradient id="laurelLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>

        {/* RAMO DE LOUROS DA VITÓRIA (COROANDO O ESCUDO) */}
        <g id="laurelWreath">
          {/* Ramo Esquerdo */}
          <path
            d="M26 65 C16 45, 20 28, 38 18"
            fill="none"
            stroke="url(#nobleGold)"
            strokeWidth="1.5"
          />
          {/* Folhas Esquerdas */}
          <ellipse cx="20" cy="55" rx="3.5" ry="6" transform="rotate(-30 20 55)" fill="url(#laurelLeaf)" />
          <ellipse cx="17" cy="42" rx="3.5" ry="6" transform="rotate(-15 17 42)" fill="url(#laurelLeaf)" />
          <ellipse cx="21" cy="30" rx="3.5" ry="6" transform="rotate(10 21 30)" fill="url(#laurelLeaf)" />
          <ellipse cx="30" cy="21" rx="3.5" ry="6" transform="rotate(35 30 21)" fill="url(#laurelLeaf)" />

          {/* Ramo Direito */}
          <path
            d="M74 65 C84 45, 80 28, 62 18"
            fill="none"
            stroke="url(#nobleGold)"
            strokeWidth="1.5"
          />
          {/* Folhas Direitas */}
          <ellipse cx="80" cy="55" rx="3.5" ry="6" transform="rotate(30 80 55)" fill="url(#laurelLeaf)" />
          <ellipse cx="83" cy="42" rx="3.5" ry="6" transform="rotate(15 83 42)" fill="url(#laurelLeaf)" />
          <ellipse cx="79" cy="30" rx="3.5" ry="6" transform="rotate(-10 79 30)" fill="url(#laurelLeaf)" />
          <ellipse cx="70" cy="21" rx="3.5" ry="6" transform="rotate(-35 70 21)" fill="url(#laurelLeaf)" />
        </g>

        {/* MEDALHÃO / ESCUDO CIRCULAR NOBRE */}
        <circle cx="50" cy="50" r="32" fill="url(#nobleField)" stroke="url(#nobleGold)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#ca8a04" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* ESTRELA RADIAL DA COROA */}
        <g opacity="0.4">
          <line x1="50" y1="22" x2="50" y2="78" stroke="url(#nobleGold)" strokeWidth="0.8" />
          <line x1="22" y1="50" x2="78" y2="50" stroke="url(#nobleGold)" strokeWidth="0.8" />
          <line x1="30" y1="30" x2="70" y2="70" stroke="url(#nobleGold)" strokeWidth="0.5" />
          <line x1="30" y1="70" x2="70" y2="30" stroke="url(#nobleGold)" strokeWidth="0.5" />
        </g>

        {/* COROA REAL COM GEMAS */}
        <g id="crown" transform="translate(50, 48) scale(0.9)">
          <path
            d="M-16 4 L-18 -8 L-10 -2 L0 -13 L10 -2 L18 -8 L16 4 Z"
            fill="url(#nobleGold)"
            stroke="#78350f"
            strokeWidth="0.8"
          />
          <circle cx="-18" cy="-8" r="1.8" fill="#fef08a" />
          <circle cx="-10" cy="-2" r="1.3" fill="#fef08a" />
          <circle cx="0" cy="-13" r="2.2" fill="#ef4444" stroke="#fef08a" strokeWidth="0.6" />
          <circle cx="10" cy="-2" r="1.3" fill="#fef08a" />
          <circle cx="18" cy="-8" r="1.8" fill="#fef08a" />

          {/* Faixa da base com pedras lapidadas */}
          <rect x="-16" y="4" width="32" height="6" fill="#78350f" rx="1" />
          <rect x="-15" y="5" width="30" height="4" fill="url(#nobleGold)" rx="1" />
          <circle cx="-10" cy="7" r="1.2" fill="#3b82f6" />
          <circle cx="0" cy="7" r="1.5" fill="#ef4444" />
          <circle cx="10" cy="7" r="1.2" fill="#10b981" />
        </g>

        {/* FITA INFERIOR DOURADA */}
        <path
          d="M28 78 L50 82 L72 78 L68 88 L50 85 L32 88 Z"
          fill="url(#nobleGold)"
          stroke="#78350f"
          strokeWidth="0.6"
        />
        <text
          x="50"
          y="84"
          fontSize="4"
          fill="#451a03"
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          NOBILIS
        </text>
      </svg>

      {showLabel && (
        <span className={`text-[11px] font-bold text-amber-300 uppercase tracking-wider mt-1 ${labelClassName}`}>
          Divisão Nobre da Coroa
        </span>
      )}
    </div>
  )
}

/**
 * Insígnia da Divisão de Acesso
 * Motivos: Ferro forjado bruto, cota de malha entrelaçada, bigorna e martelo/rebites da forja.
 */
export function AccessDivisionEmblem({
  size = 'md',
  className = '',
  showLabel = false,
  labelClassName = '',
}: DivisionEmblemProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 48

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        className="overflow-visible filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id="wroughtIron" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="30%" stopColor="#64748b" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="bronzeRivet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <pattern id="chainmailPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="3" fill="none" stroke="#475569" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="3" fill="none" stroke="#334155" strokeWidth="0.8" />
            <circle cx="8" cy="0" r="3" fill="none" stroke="#334155" strokeWidth="0.8" />
            <circle cx="0" cy="8" r="3" fill="none" stroke="#334155" strokeWidth="0.8" />
            <circle cx="8" cy="8" r="3" fill="none" stroke="#334155" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* ENGRENAGEM / ARO DE FERRO FORJADO EXTERNO */}
        <circle cx="50" cy="50" r="38" fill="#0f172a" stroke="url(#wroughtIron)" strokeWidth="3" />

        {/* DENTES OU CRAVOS INDUSTRIAIS MEDIEVAIS */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <g key={i} transform={`rotate(${angle} 50 50)`}>
            <polygon points="50,9 47,12 53,12" fill="url(#wroughtIron)" stroke="#0f172a" strokeWidth="0.5" />
          </g>
        ))}

        {/* CAMADA DE COTA DE MALHA NO FUNDO */}
        <circle cx="50" cy="50" r="34" fill="#1e293b" />
        <circle cx="50" cy="50" r="34" fill="url(#chainmailPattern)" />

        {/* ESCUDO DE FERRO BATIDO */}
        <path
          d="M50 25
             C66 25, 75 32, 75 48
             C75 66, 62 76, 50 82
             C38 76, 25 66, 25 48
             C25 32, 34 25, 50 25 Z"
          fill="url(#wroughtIron)"
          stroke="#0f172a"
          strokeWidth="1.5"
        />

        {/* REBITES DE AÇO NOS CANTOS DO ESCUDO */}
        <circle cx="34" cy="33" r="1.4" fill="url(#bronzeRivet)" stroke="#0f172a" strokeWidth="0.4" />
        <circle cx="66" cy="33" r="1.4" fill="url(#bronzeRivet)" stroke="#0f172a" strokeWidth="0.4" />
        <circle cx="30" cy="52" r="1.4" fill="url(#bronzeRivet)" stroke="#0f172a" strokeWidth="0.4" />
        <circle cx="70" cy="52" r="1.4" fill="url(#bronzeRivet)" stroke="#0f172a" strokeWidth="0.4" />
        <circle cx="50" cy="76" r="1.4" fill="url(#bronzeRivet)" stroke="#0f172a" strokeWidth="0.4" />

        {/* BIGORNA & MARTELOS DE FORJA CRUZADOS NO CENTRO */}
        <g id="blacksmithSymbols" transform="translate(50, 52) scale(0.85)">
          {/* Bigorna corporativa */}
          <path
            d="M-14 3
               L14 3
               L11 8
               L8 8
               L7 12
               L11 15
               L-11 15
               L-7 12
               L-8 8
               L-11 8
               Z"
            fill="#090d16"
            stroke="url(#wroughtIron)"
            strokeWidth="0.8"
          />
          {/* Chifre da Bigorna */}
          <path
            d="M-14 3 C-18 4, -20 6, -18 8 L-11 8 Z"
            fill="#090d16"
            stroke="url(#wroughtIron)"
            strokeWidth="0.6"
          />

          {/* Faísca da Forja */}
          <polygon points="0,-2 2,-6 0,-10 -2,-6" fill="#f59e0b" />
          <polygon points="5,-4 7,-7 5,-9 4,-7" fill="#ef4444" />

          {/* Martelo de Forja Inclinado */}
          <g transform="rotate(-30 0 -4)">
            <rect x="-1" y="-12" width="2" height="18" fill="#78350f" rx="0.5" />
            <rect x="-5" y="-14" width="10" height="5" fill="url(#wroughtIron)" stroke="#0f172a" strokeWidth="0.5" rx="0.5" />
          </g>
        </g>

        {/* FAIXA INFERIOR DE COURO REFORÇADO */}
        <path
          d="M26 78 L50 82 L74 78 L71 87 L50 84 L29 87 Z"
          fill="#334155"
          stroke="#0f172a"
          strokeWidth="0.8"
        />
        <text
          x="50"
          y="83.5"
          fontSize="4"
          fill="#cbd5e1"
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing="0.6"
        >
          ACCESSUS
        </text>
      </svg>

      {showLabel && (
        <span className={`text-[11px] font-bold text-stone-300 uppercase tracking-wider mt-1 ${labelClassName}`}>
          Divisão de Acesso
        </span>
      )}
    </div>
  )
}

/**
 * Componente unificador de insígnias de divisão
 */
export function DivisionBadge({
  divisionId,
  size = 'md',
  showLabel = false,
  className = '',
}: {
  divisionId?: string
  size?: 'sm' | 'md' | 'lg' | number
  showLabel?: boolean
  className?: string
}) {
  const isNoble = divisionId === 'div_nobre' || divisionId?.toLowerCase().includes('nobre')

  if (isNoble) {
    return (
      <NobleDivisionEmblem
        size={size}
        showLabel={showLabel}
        className={className}
      />
    )
  }

  return (
    <AccessDivisionEmblem
      size={size}
      showLabel={showLabel}
      className={className}
    />
  )
}
