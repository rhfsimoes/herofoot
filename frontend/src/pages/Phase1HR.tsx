import { useState } from 'react'
import { Zap, Swords, HeartPulse, Bed, UserX, AlertTriangle, ArrowRight } from 'lucide-react'
import type { Hero } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface Phase1HRProps {
  team: Hero[]
  onAdvance: () => void
}

export default function Phase1HR({ team: initialTeam, onAdvance }: Phase1HRProps) {
  const [team, setTeam] = useState<Hero[]>(initialTeam)
  const [actionLog, setActionLog] = useState<string[]>([])

  // Função rápida: Descanso (-30% fadiga por 10 ouro)
  function handleRest(heroId: string) {
    setTeam(prev =>
      prev.map(h => {
        if (h.id === heroId) {
          const newFatigue = Math.max(0, h.fatigue - 30)
          const newStatus = newFatigue <= 50 && !h.injured ? 'Apto' : h.status
          setActionLog(l => [`[RH] ${h.name} realizou procedimento de descanso monitorado (-30% fadiga).`, ...l])
          return { ...h, fatigue: newFatigue, status: newStatus as Hero['status'] }
        }
        return h
      })
    )
  }

  // Função rápida: Tratamento intensivo de lesão
  function handleTreat(heroId: string) {
    setTeam(prev =>
      prev.map(h => {
        if (h.id === heroId) {
          setActionLog(l => [`[Ambulatório] Cuidados intensivos aplicados em ${h.name}. Tempo de afastamento reduzido.`, ...l])
          const remaining = Math.max(0, (h.injury_weeks_left ?? 1) - 1)
          return {
            ...h,
            injury_weeks_left: remaining,
            injured: remaining > 0,
            status: remaining === 0 ? 'Apto' : 'Afastado'
          }
        }
        return h
      })
    )
  }

  // Função rápida: Dispensar herói do elenco
  function handleDismiss(heroId: string) {
    const hero = team.find(h => h.id === heroId)
    if (!hero) return
    if (confirm(`Confirmar rescisão contratual de ${hero.name}?`)) {
      setTeam(prev => prev.filter(h => h.id !== heroId))
      setActionLog(l => [`[Departamento Pessoal] Contrato de ${hero.name} rescindido conforme normas da guilda.`, ...l])
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho da Fase */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase I</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Gestão do Efetivo</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Cuidado da Equipe, Ambulatório & Academia
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Auditoria médica de fadiga, concessão de atestados e liberação física dos colaboradores para a temporada.
          </p>
        </div>

        <button
          onClick={onAdvance}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center gap-2"
        >
          <span>Homologar Elenco & Ir para Oficina</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabela de Elenco (Estilo Brasfoot Rústico) */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-stone-950/80 border-b border-stone-800 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-500" />
            <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
              Quadro de Colaboradores Registrados ({team.length})
            </h3>
          </div>
          <span className="text-stone-500 text-xs">
            Folha de Pagamento Total:{' '}
            <strong className="text-amber-400 font-mono">
              ⬡ {team.reduce((s, h) => s + h.salary, 0)} Ouro/dia
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 text-[11px] uppercase tracking-wider bg-stone-950/40 border-b border-stone-800">
                <th className="py-3 px-4 text-left font-semibold">Aventureiro</th>
                <th className="py-3 px-3 text-left font-semibold">Classe Operacional</th>
                <th className="py-3 px-3 text-center font-semibold">Poder Bruto</th>
                <th className="py-3 px-3 text-center font-semibold">Condição Física (Fadiga)</th>
                <th className="py-3 px-3 text-center font-semibold">Status Funcional</th>
                <th className="py-3 px-3 text-right font-semibold">Salário/Dia</th>
                <th className="py-3 px-4 text-right font-semibold">Intervenção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {team.map((hero, index) => {
                const isInjured = hero.status === 'Afastado' || hero.injured
                const isEven = index % 2 === 0
                const power = hero.current_power ?? hero.power ?? 50

                // Badges de Fadiga/Status conforme a especificação Overgeared
                let fatigueBadgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                let fatigueLabel = 'Pronto'
                if (hero.fatigue > 50 || isInjured) {
                  fatigueBadgeClass = 'bg-rose-950/80 text-rose-400 border border-rose-800/50 animate-pulse'
                  fatigueLabel = isInjured ? 'Lesionado' : 'Exausto'
                } else if (hero.fatigue > 20) {
                  fatigueBadgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                  fatigueLabel = 'Cansado'
                }

                return (
                  <tr
                    key={hero.id}
                    className={`transition-colors hover:bg-stone-800/60 ${
                      isEven ? 'bg-stone-900/80' : 'bg-stone-900/30'
                    }`}
                  >
                    {/* Aventureiro */}
                    <td className="py-3 px-4 font-medium text-stone-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                          {hero.name[0]}
                        </div>
                        <span className="truncate max-w-[180px] font-semibold">{hero.name}</span>
                      </div>
                    </td>

                    {/* Classe */}
                    <td className="py-3 px-3 text-stone-400">
                      {hero.class_name ?? hero.class ?? 'Combatente'}
                    </td>

                    {/* Coluna de Poder com Zap e Gradiente Dourado */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        <span className={`${GOLD_GRADIENT_TEXT} text-sm font-mono`}>
                          {power}
                        </span>
                      </div>
                    </td>

                    {/* Barra de Fadiga */}
                    <td className="py-3 px-3">
                      <div className="max-w-[130px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                          <span>{hero.fatigue}%</span>
                          <span className={hero.fatigue > 50 ? 'text-rose-400 font-bold' : ''}>
                            {hero.fatigue > 50 ? 'Alto Risco' : 'Estável'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden border border-stone-800">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              hero.fatigue > 50 ? 'bg-rose-500' : hero.fatigue > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${hero.fatigue}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Badge de Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide inline-block ${fatigueBadgeClass}`}>
                        {fatigueLabel}
                      </span>
                    </td>

                    {/* Salário */}
                    <td className="py-3 px-3 text-right font-mono text-stone-300">
                      ⬡ {hero.salary}
                    </td>

                    {/* Ações Rápidas por Linha */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isInjured ? (
                          <button
                            onClick={() => handleTreat(hero.id)}
                            className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[10px] flex items-center gap-1 transition"
                            title="Aplicar atadura e acelerar recuperação"
                          >
                            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                            <span>Tratar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRest(hero.id)}
                            disabled={hero.fatigue === 0}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950/60 border border-stone-700 hover:border-amber-700/60 text-stone-300 hover:text-amber-200 text-[10px] flex items-center gap-1 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Conceder descanso (-30% fadiga)"
                          >
                            <Bed className="w-3.5 h-3.5 text-amber-400" />
                            <span>Descansar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDismiss(hero.id)}
                          className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/80 border border-stone-800 hover:border-rose-900 text-stone-500 hover:text-rose-400 transition"
                          title="Rescindir contrato"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Ações */}
      {actionLog.length > 0 && (
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-1 shadow-md">
          <p className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-2">
            Diário Médico & Despachos Administrativos
          </p>
          {actionLog.slice(0, 4).map((log, i) => (
            <p key={i} className="text-stone-300 text-xs font-mono">
              · {log}
            </p>
          ))}
        </div>
      )}

      {/* Alerta de Diretrizes Corporativas */}
      <div className="bg-stone-900/60 border border-amber-950/40 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-400">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-stone-200 font-bold">Norma Regulamentadora de Expedição (Cláusula 12):</p>
          <p>
            Colaboradores escalados com índice de fadiga superior a 50% sofrem perda de 20% de precisão e possuem probabilidade quadruplicada de sofrerem acidentes de trabalho com lesões perfurocortantes.
          </p>
        </div>
      </div>
    </div>
  )
}
