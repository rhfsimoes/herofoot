import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  Coins,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Package,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { CorporateEvent, CorporateEventOption } from '../mockData'
import { CrownSeal } from './art'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface CorporateEventModalProps {
  event: CorporateEvent
  onResolve: (eventId: string, optionId: string) => Promise<{
    success: boolean
    consequence?: string
    effects_applied?: Record<string, any>
    message?: string
  }>
  onClose?: () => void
}

const CATEGORY_META: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  fiscal: {
    label: 'Auditoria Fiscal & Fazenda Real',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    icon: <Coins className="w-3.5 h-3.5" />,
  },
  hr: {
    label: 'Recursos Humanos & Medicina Ocupacional',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    icon: <HeartPulse className="w-3.5 h-3.5" />,
  },
  legal: {
    label: 'Contencioso Jurídico & Cartorial',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
    icon: <Scale className="w-3.5 h-3.5" />,
  },
  logistics: {
    label: 'Logística & Suprimentos da Guilda',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
    icon: <Package className="w-3.5 h-3.5" />,
  },
  operations: {
    label: 'Diretoria de Operações & Risco',
    badgeClass: 'bg-stone-800 text-stone-200 border-stone-600',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  public_relations: {
    label: 'Relações Institucionais & Opinião Pública',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  market: {
    label: 'Regulação Comercial & Balcão',
    badgeClass: 'bg-amber-900/80 text-amber-200 border-amber-600/70',
    icon: <Coins className="w-3.5 h-3.5" />,
  },
}

export default function CorporateEventModal({
  event,
  onResolve,
  onClose,
}: CorporateEventModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [resolvedConsequence, setResolvedConsequence] = useState<string | null>(null)
  const [appliedEffects, setAppliedEffects] = useState<Record<string, any> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const catInfo =
    CATEGORY_META[event.category] || {
      label: 'Protocolo Extraordinário da Coroa',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      icon: <FileText className="w-3.5 h-3.5" />,
    }

  async function handleConfirmChoice(optionId: string) {
    if (isSubmitting) return
    setIsSubmitting(true)
    setSelectedOptionId(optionId)
    setErrorMessage(null)

    try {
      const res = await onResolve(event.id, optionId)
      if (res && res.success) {
        setResolvedConsequence(
          res.consequence || 'Deliberação homologada e arquivada nos autos da guilda.'
        )
        setAppliedEffects(res.effects_applied || null)
      } else {
        setErrorMessage(
          res?.message || 'Falha ao protocolar parecer administrativo. Tente novamente.'
        )
        setIsSubmitting(false)
      }
    } catch {
      setErrorMessage('Erro de comunicação ao homologar incidente corporativo.')
      setIsSubmitting(false)
    }
  }

  function handleDismiss() {
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="corporate-event-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-[#1c1917] border-2 border-amber-700/80 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Faixa Superior Notarial */}
        <div className="bg-gradient-to-r from-stone-950 via-[#261f18] to-stone-950 px-6 py-4 border-b border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CrownSeal size={52} withGlow={true} withRibbon={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/90 font-bold">
                  Tribunal de Contas & Regulação Feudal
                </span>
                <span className="text-stone-600">·</span>
                <span className="text-[10px] font-mono text-stone-400 uppercase">
                  Portaria Administrativa
                </span>
              </div>
              <h2
                id="corporate-event-title"
                className={`text-lg sm:text-xl font-black ${GOLD_GRADIENT_TEXT} tracking-wide`}
              >
                {event.title}
              </h2>
            </div>
          </div>

          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${catInfo.badgeClass}`}
          >
            {catInfo.icon}
            <span>{catInfo.label}</span>
          </div>
        </div>

        {/* Categoria visível em telas menores */}
        <div className="sm:hidden px-6 pt-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium border ${catInfo.badgeClass}`}
          >
            {catInfo.icon}
            <span>{catInfo.label}</span>
          </div>
        </div>

        {/* Conteúdo Principal Rolável */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-200">
          {/* Se ainda não foi resolvido, exibe dilema e opções */}
          {!resolvedConsequence ? (
            <>
              {/* Dilema Administrativo (Pergaminho Escuro) */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 shadow-inner relative">
                <div className="absolute top-2 right-2 text-stone-700">
                  <FileText className="w-5 h-5 opacity-40" />
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 font-bold mb-1">
                  Resumo dos Fatos & Notificação Oficial
                </div>
                <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line font-serif">
                  {event.description}
                </p>
              </div>

              {/* Mensagem de Erro, se houver */}
              {errorMessage && (
                <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Deliberações Disponíveis */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-widest text-stone-400 font-bold flex items-center justify-between">
                  <span>Deliberações Administrativas (Escolha 1 Parecer)</span>
                  <span className="text-[10px] text-amber-500/80 font-normal">
                    Assinatura com efeito imediato
                  </span>
                </div>

                <div className="grid gap-3">
                  {event.options.map((opt: CorporateEventOption, idx: number) => {
                    const isSelected = selectedOptionId === opt.id
                    const eff = opt.effects || {}

                    return (
                      <div
                        key={opt.id}
                        className={`rounded-xl border transition-all duration-200 p-4 ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500'
                            : 'bg-stone-950/80 border-stone-800 hover:border-amber-800/60 hover:bg-stone-900'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-amber-500 font-mono text-xs font-bold">
                                [§ {idx + 1}]
                              </span>
                              <h3 className="text-stone-100 font-bold text-sm sm:text-base leading-snug">
                                {opt.label}
                              </h3>
                            </div>
                            <p className="text-stone-400 text-xs leading-relaxed">
                              {opt.description}
                            </p>

                            {/* Pílulas de Impacto Visual */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {eff.gold !== undefined && eff.gold !== 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                                    eff.gold > 0
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                      : 'bg-red-950/80 text-red-300 border-red-800'
                                  }`}
                                >
                                  <Coins className="w-3 h-3" />
                                  {eff.gold > 0 ? `+${eff.gold}` : eff.gold} Ouro
                                </span>
                              )}

                              {eff.fatigue_all !== undefined && eff.fatigue_all !== 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                                    eff.fatigue_all < 0
                                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                      : 'bg-orange-950/80 text-orange-300 border-orange-800'
                                  }`}
                                >
                                  <HeartPulse className="w-3 h-3" />
                                  {eff.fatigue_all > 0
                                    ? `+${eff.fatigue_all} Fadiga (Plantel)`
                                    : `${eff.fatigue_all} Fadiga (Alívio)`}
                                </span>
                              )}

                              {eff.morale !== undefined && eff.morale !== 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
                                    eff.morale > 0
                                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                                  }`}
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  {eff.morale > 0 ? `+${eff.morale}` : eff.morale} Confiança da
                                  Contratante
                                </span>
                              )}

                              {eff.supplies_bonus !== undefined && eff.supplies_bonus !== 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border bg-blue-950/80 text-blue-300 border-blue-800">
                                  <Package className="w-3 h-3" />
                                  +{eff.supplies_bonus} Suprimentos
                                </span>
                              )}

                              {eff.power_pct_modifier !== undefined && eff.power_pct_modifier !== 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border bg-amber-950/80 text-amber-200 border-amber-800">
                                  <Zap className="w-3 h-3" />
                                  {eff.power_pct_modifier > 0
                                    ? `+${Math.round(eff.power_pct_modifier * 100)}%`
                                    : `${Math.round(eff.power_pct_modifier * 100)}%`}{' '}
                                  Poder Efetivo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botão de Assinatura */}
                          <div className="pt-2 sm:pt-0 sm:self-center flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleConfirmChoice(opt.id)}
                              disabled={isSubmitting}
                              className={`w-full sm:w-auto px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow ${
                                isSelected && isSubmitting
                                  ? 'bg-amber-600 text-stone-950 cursor-wait'
                                  : 'bg-amber-700/80 hover:bg-amber-600 text-stone-100 hover:text-stone-950 border border-amber-500/60 active:scale-95'
                              }`}
                            >
                              <span>{isSubmitting && isSelected ? 'Lavrando...' : 'Firmar Parecer'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Laudo Pericial & Consequência Narrativa (Pós-Homologação) */
            <div className="space-y-6 py-4 animate-fadeIn">
              <div className="bg-stone-950 border-2 border-emerald-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  Laudo Pericial Conclusivo
                </span>
                <h3 className="text-xl font-black text-stone-100 mb-3 font-serif">
                  Diretriz Notarial Homologada
                </h3>

                <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-serif italic bg-stone-900/60 p-4 rounded-xl border border-stone-800">
                  &ldquo;{resolvedConsequence}&rdquo;
                </p>

                {appliedEffects && (
                  <div className="mt-4 pt-4 border-t border-stone-800/80 flex flex-wrap justify-center gap-2">
                    {appliedEffects.gold !== undefined && appliedEffects.gold !== 0 && (
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full border ${
                          appliedEffects.gold > 0
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-red-950 text-red-300 border-red-800'
                        }`}
                      >
                        Impacto Orçamentário: {appliedEffects.gold > 0 ? `+${appliedEffects.gold}` : appliedEffects.gold} Ouro
                      </span>
                    )}
                    {appliedEffects.fatigue_all !== undefined && appliedEffects.fatigue_all !== 0 && (
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full border ${
                          appliedEffects.fatigue_all < 0
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-orange-950 text-orange-300 border-orange-800'
                        }`}
                      >
                        Impacto no Plantel: {appliedEffects.fatigue_all > 0 ? `+${appliedEffects.fatigue_all}` : appliedEffects.fatigue_all} Fadiga
                      </span>
                    )}
                    {appliedEffects.morale !== undefined && appliedEffects.morale !== 0 && (
                      <span
                        className={`text-xs font-mono px-3 py-1 rounded-full border ${
                          appliedEffects.morale > 0
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}
                      >
                        Confiança da Contratante: {appliedEffects.morale > 0 ? `+${appliedEffects.morale}` : appliedEffects.morale}
                      </span>
                    )}
                    {appliedEffects.supplies_bonus !== undefined && appliedEffects.supplies_bonus !== 0 && (
                      <span className="text-xs font-mono px-3 py-1 rounded-full border bg-blue-950 text-blue-300 border-blue-800">
                        Suprimentos Adicionados: +{appliedEffects.supplies_bonus}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <span>Arquivar Laudo e Prosseguir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé institucional */}
        <div className="bg-stone-950 px-6 py-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <span>Chancela Régia Nº {event.id}</span>
          <span>HeroFoot Governance System v0.5.0</span>
        </div>
      </div>
    </div>
  )
}
