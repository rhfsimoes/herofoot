import { useNavigate, useLocation } from 'react-router-dom'

const PHASES = [
  { phase: 1, label: 'I. RH & Cura', path: '/phase1' },
  { phase: 2, label: 'II. Oficina', path: '/phase2' },
  { phase: 3, label: 'III. Escalação', path: '/phase3' },
  { phase: 4, label: 'IV. Expedição', path: '/phase4' },
  { phase: 5, label: 'V. Resultados', path: '/phase5' },
]

interface PhaseNavigatorProps {
  currentPhase: number
}

export default function PhaseNavigator({ currentPhase }: PhaseNavigatorProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bg-stone-900 border-b border-stone-700 px-6 py-0 flex items-stretch gap-0 overflow-x-auto">
      <button
        onClick={() => navigate('/')}
        className={`px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap
          ${location.pathname === '/'
            ? 'border-amber-500 text-amber-400'
            : 'border-transparent text-stone-400 hover:text-stone-200'}`}
      >
        Dashboard
      </button>

      {PHASES.map(({ phase, label, path }) => {
        const isActive = location.pathname === path
        const isCurrent = phase === currentPhase
        const isPast = phase < currentPhase

        return (
          <button
            key={phase}
            onClick={() => navigate(path)}
            className={`px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap flex items-center gap-2
              ${isActive
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'}`}
          >
            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            {isPast && <span className="text-stone-500">✓</span>}
            {label}
          </button>
        )
      })}
    </nav>
  )
}
