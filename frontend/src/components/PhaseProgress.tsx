import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

const PHASES: { label: string; short: string }[] = [
  { label: 'RH & Medicina', short: 'RH' },
  { label: 'Oficina & Balcão', short: 'Oficina' },
  { label: 'Escalação', short: 'Escal.' },
  { label: 'Expedição', short: 'Exped.' },
  { label: 'Resultados', short: 'Result.' },
]

interface PhaseProgressProps {
  currentPhase: number // 1–5
  week?: number
}

/**
 * Indicador visual de progresso de fase no Header.
 * Exibe "Semana X — Fase Y/5" com as fases completadas, a atual em destaque
 * e as futuras em muted.
 */
export default function PhaseProgress({ currentPhase, week = 1 }: PhaseProgressProps) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-1" aria-label="Progresso das fases da semana">
      {/* Linha de rótulo */}
      <span className="text-[9px] uppercase tracking-widest text-stone-500 font-mono font-bold">
        Semana {week} — Fase {currentPhase}/5
      </span>

      {/* Stepper */}
      <div className="flex items-center gap-0.5">
        {PHASES.map((phase, idx) => {
          const phaseNum = idx + 1
          const isDone = phaseNum < currentPhase
          const isActive = phaseNum === currentPhase

          return (
            <div key={phaseNum} className="flex items-center gap-0.5">
              {/* Divisor */}
              {idx > 0 && (
                <ChevronRight
                  className={`w-2.5 h-2.5 ${isDone ? 'text-emerald-600' : 'text-stone-700'}`}
                />
              )}

              {/* Badge da fase */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                    : isDone
                    ? 'bg-emerald-950/50 border border-emerald-800/40 text-emerald-500'
                    : 'bg-stone-900/60 border border-stone-800/40 text-stone-600'
                }`}
                title={phase.label}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle
                    className={`w-2.5 h-2.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-700'}`}
                  />
                )}
                <span>{phase.short}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
