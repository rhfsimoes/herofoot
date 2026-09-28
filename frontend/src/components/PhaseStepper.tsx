import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Compass } from 'lucide-react'

const PHASES = [
  { phase: 1, label: '1. Elenco', path: '/phase1' },
  { phase: 2, label: '2. Craft & Loja', path: '/phase2' },
  { phase: 3, label: '3. Tática', path: '/phase3' },
  { phase: 4, label: '4. Dungeon', path: '/phase4' },
  { phase: 5, label: '5. Resultados', path: '/phase5' },
]

interface PhaseStepperProps {
  currentPhase: number
}

export default function PhaseStepper({ currentPhase }: PhaseStepperProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bg-stone-950 border-b border-stone-800/80 px-4 py-2.5 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Botão de Retorno ao Dashboard */}
        <button
          onClick={() => navigate('/')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            location.pathname === '/'
              ? 'bg-amber-950/60 border border-amber-600/50 text-amber-300 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {/* 5 Fases do Loop */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {PHASES.map(({ phase, label, path }) => {
            const isCurrent = phase === currentPhase
            const isCompleted = phase < currentPhase
            const isFuture = phase > currentPhase

            if (isCurrent) {
              return (
                <button
                  key={phase}
                  onClick={() => navigate(path)}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold shadow-md shadow-amber-900/20 scale-105 border border-amber-300 px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                  <span>{label}</span>
                </button>
              )
            }

            if (isCompleted) {
              return (
                <button
                  key={phase}
                  onClick={() => navigate(path)}
                  className="bg-stone-900 text-emerald-400 border border-emerald-800/50 hover:border-emerald-600 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0 font-medium"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{label}</span>
                </button>
              )
            }

            return (
              <button
                key={phase}
                disabled={isFuture}
                className="bg-stone-900/40 text-stone-500 border border-stone-800 cursor-not-allowed px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shrink-0 opacity-60"
              >
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
