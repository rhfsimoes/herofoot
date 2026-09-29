export interface CrownSealProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  withRibbon?: boolean
  withGlow?: boolean
  caption?: string
}

const SIZE_MAP = {
  sm: 40,
  md: 64,
  lg: 96,
  xl: 128,
}

export default function CrownSeal({
  size = 'md',
  className = '',
  withRibbon = true,
  withGlow = false,
  caption,
}: CrownSealProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 64
  const ribbonHeight = withRibbon ? pixelSize * 0.35 : 0
  const totalHeight = pixelSize + ribbonHeight

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ width: pixelSize }}
      title={caption || 'Selo de Cera Imperial da Coroa'}
    >
      <svg
        viewBox="0 0 120 140"
        width={pixelSize}
        height={totalHeight}
        className={`overflow-visible transition-transform duration-300 hover:scale-105 ${
          withGlow ? 'filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]'
        }`}
      >
        <defs>
          {/* Gradiente da Cera Carmesim Profunda */}
          <radialGradient id="waxBaseGrad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="35%" stopColor="#991b1b" />
            <stop offset="70%" stopColor="#7f1d1d" />
            <stop offset="92%" stopColor="#450a0a" />
            <stop offset="100%" stopColor="#280505" />
          </radialGradient>

          {/* Gradiente da Borda Derretida de Cera */}
          <radialGradient id="waxRimGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#991b1b" />
            <stop offset="85%" stopColor="#450a0a" />
            <stop offset="100%" stopColor="#1f0303" />
          </radialGradient>

          {/* Gradiente de Ouro Imperial Relevado */}
          <linearGradient id="imperialGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#facc15" />
            <stop offset="55%" stopColor="#eab308" />
            <stop offset="80%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Gradiente de Ouro Sombra */}
          <linearGradient id="goldShadow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#713f12" />
            <stop offset="70%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>

          {/* Gradiente das Fitas de Cetim Carmesim */}
          <linearGradient id="ribbonLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="40%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          <linearGradient id="ribbonRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Sombra de Relevo */}
          <filter id="sealInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="1" dy="2" />
            <feGaussianBlur stdDeviation="1.5" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.8" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Fitas Imperiais de Cetim Carmesim abaixo do selo */}
        {withRibbon && (
          <g id="ribbons" className="transition-transform duration-200">
            {/* Fita Esquerda */}
            <path
              d="M48 85 L28 132 L44 122 L58 130 L55 86 Z"
              fill="url(#ribbonLeftGrad)"
              stroke="#450a0a"
              strokeWidth="0.8"
            />
            {/* Listra Dourada Fita Esquerda */}
            <path
              d="M42 87 L33 125 L38 123 L47 88 Z"
              fill="url(#imperialGold)"
              opacity="0.85"
            />

            {/* Fita Direita */}
            <path
              d="M65 86 L62 130 L76 122 L92 132 L72 85 Z"
              fill="url(#ribbonRightGrad)"
              stroke="#450a0a"
              strokeWidth="0.8"
            />
            {/* Listra Dourada Fita Direita */}
            <path
              d="M73 88 L82 123 L87 125 L78 87 Z"
              fill="url(#imperialGold)"
              opacity="0.85"
            />
          </g>
        )}

        {/* Cera Derretida Orgânica (Borda externa irregular carimbada a quente) */}
        <path
          d="M60 4
             C72 3, 83 8, 92 14
             C101 21, 108 30, 112 40
             C116 50, 117 62, 113 72
             C110 82, 102 91, 93 98
             C84 105, 73 111, 61 112
             C49 113, 38 109, 28 103
             C19 96, 12 87, 8 76
             C4 65, 5 53, 9 42
             C13 31, 21 21, 30 14
             C39 7, 49 4, 60 4 Z"
          fill="url(#waxRimGrad)"
        />

        {/* Gotas/Lobos de cera espalhada pelo impacto do carimbo */}
        <ellipse cx="60" cy="58" rx="51" ry="51" fill="url(#waxBaseGrad)" />
        <circle cx="22" cy="35" r="4.5" fill="#7f1d1d" opacity="0.9" />
        <circle cx="98" cy="42" r="5" fill="#7f1d1d" opacity="0.9" />
        <circle cx="34" cy="98" r="4" fill="#7f1d1d" opacity="0.8" />
        <circle cx="86" cy="95" r="5.5" fill="#450a0a" opacity="0.9" />

        {/* Brilho de Reflexo Superior de Cera (Luz de Vela) */}
        <path
          d="M32 24 C40 16, 54 13, 68 13 C82 13, 94 18, 99 26 C88 20, 74 18, 60 18 C46 18, 36 21, 32 24 Z"
          fill="#fca5a5"
          opacity="0.25"
        />

        {/* Bordo do Sinete de Pressão (Anel de Cera Prensada) */}
        <circle
          cx="60"
          cy="58"
          r="44"
          fill="none"
          stroke="#450a0a"
          strokeWidth="3"
          opacity="0.9"
        />
        <circle
          cx="60"
          cy="58"
          r="42.5"
          fill="none"
          stroke="url(#imperialGold)"
          strokeWidth="1.4"
          strokeDasharray="2 1.5"
        />
        <circle
          cx="60"
          cy="58"
          r="38"
          fill="#580808"
          stroke="#350404"
          strokeWidth="2"
        />

        {/* Círculo com Pérolas Douradas da Coroa */}
        <circle
          cx="60"
          cy="58"
          r="35"
          fill="none"
          stroke="url(#imperialGold)"
          strokeWidth="0.8"
        />

        {/* PONTOS HERÁLDICOS CARDINAIS EM VOLTA */}
        <circle cx="60" cy="22" r="1.5" fill="url(#imperialGold)" />
        <circle cx="60" cy="94" r="1.5" fill="url(#imperialGold)" />
        <circle cx="24" cy="58" r="1.5" fill="url(#imperialGold)" />
        <circle cx="96" cy="58" r="1.5" fill="url(#imperialGold)" />

        {/* INSCRIÇÃO LATINA ARCAICA: "SIGILLVM REGIVM" */}
        <path
          id="textArcTop"
          d="M29 58 A31 31 0 0 1 91 58"
          fill="none"
        />
        <text
          fontSize="5.2"
          fill="url(#imperialGold)"
          fontWeight="bold"
          letterSpacing="1.8"
          textAnchor="middle"
          opacity="0.95"
        >
          <textPath href="#textArcTop" startOffset="50%">
            CORONA • IMPERII
          </textPath>
        </text>

        <path
          id="textArcBottom"
          d="M91 58 A31 31 0 0 1 29 58"
          fill="none"
        />
        <text
          fontSize="4.8"
          fill="url(#imperialGold)"
          fontWeight="bold"
          letterSpacing="1.6"
          textAnchor="middle"
          opacity="0.95"
        >
          <textPath href="#textArcBottom" startOffset="50%">
            AUDITVS • FISCALIS
          </textPath>
        </text>

        {/* COROA IMPERIAL DETALHADA NO CENTRO */}
        <g id="imperialCrown" transform="translate(60, 48) scale(0.85)">
          {/* Base da Coroa */}
          <path
            d="M-22 5 C-10 7, 10 7, 22 5 L20 10 C10 11.5, -10 11.5, -20 10 Z"
            fill="url(#imperialGold)"
            stroke="#5e3a00"
            strokeWidth="0.6"
          />
          {/* Pedras da Base da Coroa (Rubis e Esmeraldas do Reino) */}
          <circle cx="-14" cy="7.5" r="1.2" fill="#ef4444" />
          <circle cx="-7" cy="8" r="1.2" fill="#10b981" />
          <circle cx="0" cy="8.2" r="1.5" fill="#ef4444" />
          <circle cx="7" cy="8" r="1.2" fill="#10b981" />
          <circle cx="14" cy="7.5" r="1.2" fill="#ef4444" />

          {/* Picos da Coroa (5 Picos Reais) */}
          {/* Fundo escurecido da coroa */}
          <path
            d="M-20 5 L-22 -8 L-13 -2 L0 -14 L13 -2 L22 -8 L20 5 Z"
            fill="url(#goldShadow)"
            opacity="0.75"
          />
          {/* Frente da Coroa esculpida */}
          <path
            d="M-20 5 L-21 -7 L-14 -1 L0 -13 L14 -1 L21 -7 L20 5 Z"
            fill="url(#imperialGold)"
            stroke="#78350f"
            strokeWidth="0.6"
          />

          {/* Pérolas nos Topos dos Picos */}
          <circle cx="-21" cy="-7.5" r="1.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="-13" cy="-1.5" r="1.4" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="0" cy="-13.8" r="2.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="13" cy="-1.5" r="1.4" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="21" cy="-7.5" r="1.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />

          {/* Cruz Imperial no Pico Central */}
          <path
            d="M-0.8 -18 L0.8 -18 L0.8 -14 L-0.8 -14 Z M-2.5 -16.8 L2.5 -16.8 L2.5 -15.4 L-2.5 -15.4 Z"
            fill="url(#imperialGold)"
            stroke="#78350f"
            strokeWidth="0.4"
          />
        </g>

        {/* LEÃO HERÁLDICO IMPERIAL ESTILIZADO ABAIXO DA COROA */}
        <g id="heraldicLionHead" transform="translate(60, 68) scale(0.9)">
          {/* Silhueta da Cabeça e Juba do Leão da Coroa */}
          <path
            d="M0 -8
               C-4 -8, -8 -5, -10 -2
               C-13 1, -14 5, -12 9
               C-10 13, -6 16, 0 17
               C6 16, 10 13, 12 9
               C14 5, 13 1, 10 -2
               C8 -5, 4 -8, 0 -8 Z"
            fill="url(#imperialGold)"
            stroke="#78350f"
            strokeWidth="0.7"
          />

          {/* Juba em Relevo Dourado */}
          <path
            d="M-9 0 C-12 3, -11 7, -8 11
               M9 0 C12 3, 11 7, 8 11
               M-5 -5 C-8 -2, -7 3, -4 6
               M5 -5 C8 -2, 7 3, 4 6"
            stroke="#78350f"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Olhos e Focinho do Leão */}
          <polygon points="-4,2 -2,4 -5,4" fill="#450a0a" />
          <polygon points="4,2 2,4 5,4" fill="#450a0a" />
          <path
            d="M-2.5 8 L2.5 8 L0 10.5 Z"
            fill="#450a0a"
          />
          <path
            d="M-3 12 C-1 13.5, 1 13.5, 3 12"
            stroke="#450a0a"
            strokeWidth="0.9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {caption && (
        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold mt-1 text-center leading-tight">
          {caption}
        </span>
      )}
    </div>
  )
}
