export interface GuildCrestProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  guildName?: string
  motto?: string
  variant?: 'full' | 'compact' | 'shield-only'
  className?: string
  interactive?: boolean
}

const SIZE_MAP = {
  xs: 28,
  sm: 38,
  md: 56,
  lg: 84,
  xl: 120,
}

export default function GuildCrest({
  size = 'md',
  guildName,
  motto = 'RATIO & FERRUM',
  variant = 'full',
  className = '',
  interactive = false,
}: GuildCrestProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 56

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${
        interactive ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      title={guildName || 'Brasão Heráldico da Guilda'}
    >
      <svg
        viewBox="0 0 120 130"
        width={pixelSize}
        height={pixelSize}
        className="overflow-visible filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Gradiente Ouro Real da Guilda */}
          <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="85%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Gradiente Aço Temperado para Lâminas */}
          <linearGradient id="steelBlade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Campo Escuro do Escudo (Azul Meia-Noite / Ardósia) */}
          <linearGradient id="shieldDarkField" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Campo Rubro Nobre do Escudo */}
          <linearGradient id="shieldCrimsonField" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="50%" stopColor="#581c87" />
            <stop offset="100%" stopColor="#2e1065" />
          </linearGradient>

          {/* Gradiente de Pergaminho Inferior */}
          <linearGradient id="parchmentBanner" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="35%" stopColor="#fde68a" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Sombra de Relevo */}
          <filter id="crestGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. ARMAS HERÁLDICAS CRUZADAS AO FUNDO (Se variant for 'full') */}
        {variant === 'full' && (
          <g id="crossedWeapons" opacity="0.95">
            {/* Lança / Espada Longa Diagonal Esquerda (\) */}
            <g transform="rotate(-42 60 55)">
              {/* Guarda e Punho */}
              <rect x="58.5" y="-12" width="3" height="135" fill="url(#steelBlade)" rx="1.5" />
              <path d="M50 102 L70 102 L65 106 L55 106 Z" fill="url(#crestGold)" />
              <circle cx="60" cy="118" r="4" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.8" />
              {/* Ponta da Lâmina */}
              <polygon points="60,-18 57,-12 63,-12" fill="url(#steelBlade)" />
            </g>

            {/* Machado de Batalha / Alabarda Diagonal Direita (/) */}
            <g transform="rotate(42 60 55)">
              <rect x="58.5" y="-12" width="3" height="135" fill="#475569" rx="1.5" />
              {/* Cabeça do Machado */}
              <path
                d="M60 -2
                   C68 -10, 78 -12, 85 -5
                   C82 5, 78 12, 60 8
                   Z"
                fill="url(#steelBlade)"
                stroke="#1e293b"
                strokeWidth="0.8"
              />
              <path
                d="M60 0
                   C54 -8, 48 -6, 44 0
                   C48 5, 54 4, 60 3
                   Z"
                fill="url(#crestGold)"
              />
              {/* Pomo */}
              <circle cx="60" cy="118" r="3.5" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.8" />
            </g>
          </g>
        )}

        {/* 2. TIMBRE SUPERIOR (Coroa Mural de Fortificação / Elmo de Cavaleiro) */}
        {variant !== 'shield-only' && (
          <g id="crestTimbre" transform="translate(60, 15) scale(0.85)">
            {/* Mural de Fortaleza Medieval */}
            <path
              d="M-22 5
                 L-22 -4 L-15 -4 L-15 0 L-7 0 L-7 -4 L0 -4 L0 0 L7 0 L7 -4 L15 -4 L15 0 L22 0 L22 5
                 Z"
              fill="url(#crestGold)"
              stroke="#5e3a00"
              strokeWidth="0.8"
            />
            {/* Ameias com fendas de seta */}
            <rect x="-18" y="-1" width="1.5" height="3" fill="#1e293b" />
            <rect x="-3" y="-1" width="1.5" height="3" fill="#1e293b" />
            <rect x="12" y="-1" width="1.5" height="3" fill="#1e293b" />
          </g>
        )}

        {/* 3. CORPO DO ESCUDO HERÁLDICO */}
        <g id="heraldicShield">
          {/* Sombra de projeção do escudo */}
          <path
            d="M60 22
               C82 22, 94 28, 97 44
               C100 66, 88 95, 60 108
               C32 95, 20 66, 23 44
               C26 28, 38 22, 60 22 Z"
            fill="#09090b"
            opacity="0.6"
            transform="translate(0, 3)"
          />

          {/* Moldura de Ouro Externa */}
          <path
            d="M60 20
               C83 20, 95 26, 98 42
               C101 65, 89 95, 60 108
               C31 95, 19 65, 22 42
               C25 26, 37 20, 60 20 Z"
            fill="url(#crestGold)"
            stroke="#451a03"
            strokeWidth="1.2"
          />

          {/* Moldura Interna em Aço Escurecido */}
          <path
            d="M60 24
               C80 24, 91 30, 93 43
               C96 63, 85 91, 60 103
               C35 91, 24 63, 27 43
               C29 30, 40 24, 60 24 Z"
            fill="#0f172a"
            stroke="#1c1917"
            strokeWidth="1"
          />

          {/* DIVISÃO ESQUARTELADA HERÁLDICA DO CAMPO */}
          <g clipPath="url(#shieldClip)">
            {/* Campo 1 (Superior Esquerdo) - Carmesim Nobre */}
            <path d="M25 24 H60 V62 H25 Z" fill="url(#shieldCrimsonField)" />
            {/* Campo 2 (Superior Direito) - Azul Marinho Corporativo */}
            <path d="M60 24 H95 V62 H60 Z" fill="url(#shieldDarkField)" />
            {/* Campo 3 (Inferior Esquerdo) - Azul Marinho Corporativo */}
            <path d="M25 62 H60 V105 H25 Z" fill="url(#shieldDarkField)" />
            {/* Campo 4 (Inferior Direito) - Carmesim Nobre */}
            <path d="M60 62 H95 V105 H60 Z" fill="url(#shieldCrimsonField)" />

            {/* Linhas de Partição Douradas em Cruz */}
            <line x1="60" y1="24" x2="60" y2="105" stroke="url(#crestGold)" strokeWidth="1.2" />
            <line x1="25" y1="62" x2="95" y2="62" stroke="url(#crestGold)" strokeWidth="1.2" />
          </g>

          <clipPath id="shieldClip">
            <path
              d="M60 25
                 C79 25, 89 31, 92 43
                 C94 62, 84 89, 60 101
                 C36 89, 26 62, 28 43
                 C31 31, 41 25, 60 25 Z"
            />
          </clipPath>

          {/* Rebites nos Cantos da Moldura */}
          <circle cx="34" cy="30" r="1.3" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.4" />
          <circle cx="86" cy="30" r="1.3" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.4" />
          <circle cx="28" cy="50" r="1.3" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.4" />
          <circle cx="92" cy="50" r="1.3" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.4" />
          <circle cx="60" cy="98" r="1.3" fill="url(#crestGold)" stroke="#78350f" strokeWidth="0.4" />

          {/* 4. CARGAS HERÁLDICAS CENTRAIS: PENA CONTÁBIL DE OURO & ESPADA CURTA DE EXPEDIÇÃO */}
          <g id="centralCharges">
            {/* ESPADA CURTA EM DIAGONAL (/) */}
            <g transform="rotate(35 60 62)">
              {/* Lâmina */}
              <polygon points="60,34 58,56 60,78 62,56" fill="url(#steelBlade)" stroke="#334155" strokeWidth="0.4" />
              <line x1="60" y1="36" x2="60" y2="76" stroke="#f8fafc" strokeWidth="0.5" />
              {/* Guarda */}
              <rect x="53" y="78" width="14" height="2" fill="url(#crestGold)" rx="0.5" />
              {/* Empunhadura */}
              <rect x="58.5" y="80" width="3" height="9" fill="#78350f" />
              {/* Pomo */}
              <circle cx="60" cy="91" r="2.2" fill="url(#crestGold)" />
            </g>

            {/* PENA CONTÁBIL DE OURO EM DIAGONAL CONTRÁRIA (\) */}
            <g transform="rotate(-35 60 62)">
              {/* Haste Central (Cálamo) */}
              <path
                d="M60 30
                   C58 45, 59 70, 60 88"
                stroke="url(#crestGold)"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
              {/* Barba / Pluma da Pena de Escriba (Ouro e Luz) */}
              <path
                d="M60 30
                   C68 38, 70 52, 63 68
                   C61 72, 60 80, 60 88
                   C60 80, 56 68, 54 58
                   C52 46, 56 36, 60 30 Z"
                fill="url(#crestGold)"
                opacity="0.9"
                stroke="#78350f"
                strokeWidth="0.5"
              />
              {/* Ranhuras sutis da pena de escriba */}
              <path
                d="M59 40 L54 44 M59 48 L53 53 M60 58 L54 63
                   M61 40 L66 44 M61 48 L67 53 M61 58 L66 63"
                stroke="#78350f"
                strokeWidth="0.6"
              />
              {/* Ponta da Pena (Bico de pena em ouro polido) */}
              <polygon points="60,92 58.5,88 61.5,88" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.3" />
            </g>

            {/* Broche Central no Ponto de Cruzamento */}
            <circle cx="60" cy="62" r="4.5" fill="url(#crestGold)" stroke="#451a03" strokeWidth="0.8" />
            <circle cx="60" cy="62" r="2" fill="#ef4444" />
          </g>
        </g>

        {/* 5. FAIXA DE PERGAMINHO INFERIOR (LEMA OU NOME) */}
        {variant === 'full' && (
          <g id="parchmentBannerGroup">
            {/* Dobras Traseiras da Faixa */}
            <polygon points="18,108 26,102 26,114 18,120" fill="#78350f" />
            <polygon points="102,108 94,102 94,114 102,120" fill="#78350f" />

            {/* Corpo Frontal Curvado da Faixa */}
            <path
              d="M22 108
                 C40 102, 80 102, 98 108
                 L96 119
                 C78 113, 42 113, 24 119
                 Z"
              fill="url(#parchmentBanner)"
              stroke="#78350f"
              strokeWidth="0.7"
            />

            {/* Texto do Lema / Guilda na Faixa */}
            <path
              id="mottoArc"
              d="M26 114 C44 109, 76 109, 94 114"
              fill="none"
            />
            <text
              fontSize="4.8"
              fill="#291305"
              fontWeight="900"
              fontFamily="serif"
              letterSpacing="0.8"
              textAnchor="middle"
            >
              <textPath href="#mottoArc" startOffset="50%">
                {guildName ? guildName.slice(0, 14).toUpperCase() : motto}
              </textPath>
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
