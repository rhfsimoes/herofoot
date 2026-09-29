import { useState } from 'react'
import { X, Info } from 'lucide-react'

// ─── Textos por fase ────────────────────────────────────────────────────────
const PHASE_MESSAGES: Record<number, { label: string; text: string }> = {
  1: {
    label: 'Aviso Corporativo',
    text: 'Revise o estado físico de seu elenco antes de qualquer ordem de serviço. Colaboradores com Fadiga acima de 70% são automaticamente considerados inaptos para expedição.',
  },
  2: {
    label: 'Memorando Interno',
    text: 'Cada bancada tem um ramo distinto de produção. Forjar um item gera experiência nesse ramo e pode desbloquear receitas avançadas na próxima temporada.',
  },
  3: {
    label: 'Diretriz Operacional',
    text: 'Apenas colaboradores com status Apto podem ser escalados para expedições. Heróis Afastados por licença médica estão impedidos de participar.',
  },
  4: {
    label: 'Alerta de Campo',
    text: 'Os Suprimentos determinam o alcance da incursão. Monitore o consumo por sala e leve itens de mitigação para terrenos hostis.',
  },
  5: {
    label: 'Laudo Administrativo',
    text: 'Auditorias aprovadas pela Coroa Contratante incrementam a Confiança da Contratante e liberam subsídios para a guilda.',
  },
}

const STORAGE_KEY_PREFIX = 'herofoot_onboarding_dismissed_phase_'

interface OnboardingBannerProps {
  phase: number
}

/**
 * Banner de onboarding contextual — aparece apenas na primeira visita a cada fase.
 * Usa localStorage para persistir o dismiss por fase.
 */
export default function OnboardingBanner({ phase }: OnboardingBannerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${phase}`

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  const msg = PHASE_MESSAGES[phase]
  if (!msg) return null

  function handleDismiss() {
    try {
      localStorage.setItem(storageKey, 'true')
    } catch {
      // localStorage indisponível — apenas fecha visualmente
    }
    setDismissed(true)
  }

  return (
    <div
      className="w-full bg-amber-900/20 border-b border-amber-700/30 px-6 py-3 flex items-start gap-3 animate-in slide-in-from-top duration-300"
      role="status"
      aria-live="polite"
    >
      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-amber-400 font-black text-[11px] uppercase tracking-wider font-mono">
          {msg.label}:{' '}
        </span>
        <span className="text-stone-300 text-xs leading-relaxed">{msg.text}</span>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 flex items-center gap-1 text-stone-400 hover:text-amber-200 text-[11px] font-semibold border border-stone-700 hover:border-amber-700/50 rounded-lg px-2.5 py-1 transition"
        aria-label="Dispensar aviso de onboarding"
      >
        <X className="w-3 h-3" />
        <span>Dispensar Aviso</span>
      </button>
    </div>
  )
}
