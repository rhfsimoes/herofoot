import { useNavigate } from 'react-router-dom'
import { Swords, ArrowRight, Trophy } from 'lucide-react'
import type { GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface DashboardProps {
  state: GameState
  onAdvancePhase: () => void
}

const PHASE_DESCRIPTIONS: Record<number, { title: string; desc: string; next: string }> = {
  1: { title: 'Fase I — RH & Cura', desc: 'Gerencie atestados médicos, recuperação de fadiga e promoções internas.', next: 'Concluir RH e ir para a Oficina' },
  2: { title: 'Fase II — Oficina & Balcão', desc: 'Produza itens por ramo da oficina, compre materiais/itens e negocie no balcão.', next: 'Encerrar Operações e ir para Escalação' },
  3: { title: 'Fase III — Escalação', desc: 'Designe os aventureiros titulares e equipe os 5 Slots da Expedição.', next: 'Assinar Memorando e Autorizar Despacho' },
  4: { title: 'Fase IV — Expedição', desc: 'A força-tarefa avança pelas câmaras da masmorra. Confronto do Dia e simulação da rodada da Liga.', next: 'Iniciar Expedição do Dia' },
  5: { title: 'Fase V — Resultados', desc: 'Consolide o balanço financeiro, distribua o espólio e confira a classificação da Liga.', next: 'Arquivar Relatório e Iniciar Próximo Dia' },
}

const PHASE_PATHS: Record<number, string> = {
  1: '/phase1', 2: '/phase2', 3: '/phase3', 4: '/phase4', 5: '/phase5',
}

export default function Dashboard({ state, onAdvancePhase }: DashboardProps) {
  const navigate = useNavigate()
  const phaseInfo = PHASE_DESCRIPTIONS[state.current_phase] ?? PHASE_DESCRIPTIONS[1]

  const aptCount = state.team.filter(h => h.status === 'Apto').length
  const fatiguedCount = state.team.filter(h => h.status === 'Fatigado').length
  const injuredCount = state.team.filter(h => h.status === 'Afastado').length

  const fixture = state.current_fixture

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Fase atual (Painel de Madeira Escura e Latão) */}
      <div className="bg-[#1c1917] border border-amber-950/60 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Diretriz da Guilda</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400 text-xs">Semana {state.day}</span>
            </div>
            <h2 className="text-amber-100 text-2xl font-black mt-1 tracking-wide">{phaseInfo.title}</h2>
            <p className="text-stone-300 text-xs mt-1.5 max-w-xl leading-relaxed">{phaseInfo.desc}</p>
          </div>
          <div className="text-right bg-stone-950/80 border border-stone-800 rounded-xl px-4 py-2 shadow-inner">
            <span className="text-stone-500 text-[10px] uppercase font-mono tracking-widest block">Rodada Atual</span>
            <div className={`${GOLD_GRADIENT_TEXT} text-2xl font-mono`}>R-{state.day}</div>
          </div>
        </div>

        {/* Confronto do dia */}
        {fixture && (
          <div className="mt-4 p-3 bg-stone-950 border border-stone-800/80 rounded-xl flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-500" />
              <span className="text-stone-400 uppercase tracking-wider font-bold">Confronto da Rodada:</span>
            </div>
            <span className="text-amber-300 font-bold font-mono">
              {fixture.home_name} <span className="text-stone-500 font-normal">vs</span> {fixture.away_name}
            </span>
          </div>
        )}

        <div className="mt-5 flex gap-3 flex-wrap">
          <button
            onClick={() => navigate(PHASE_PATHS[state.current_phase] ?? '/')}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center gap-2"
          >
            <span>→ {phaseInfo.next}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onAdvancePhase}
            className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-800 transition"
          >
            Avançar Fase
          </button>
        </div>
      </div>

      {/* Cards de Resumo (Pedra, Madeira e Ouro) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Caixa da Guilda"
          value={`⬡ ${state.gold.toLocaleString('pt-BR')}`}
          sub="Moedas de Ouro Fiduciário"
          accent
        />
        <SummaryCard
          label="Itens no Inventário"
          value={String(state.inventory.length)}
          sub="ativos sob custódia"
        />
        <SummaryCard
          label="Equipe Disponível"
          value={`${aptCount}/${state.team.length}`}
          sub={`${fatiguedCount} fatigados · ${injuredCount} afastados`}
        />
        <SummaryCard
          label="Oficina Principal"
          value={`Nv. ${state.workshop_levels.blacksmithing}`}
          sub="Ferragem"
        />
      </div>

      {/* Tabela de Classificação da Liga das Guildas */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-stone-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
              Tabela de Classificação Geral da Liga das Guildas
            </h3>
          </div>
          <span className="text-stone-500 text-xs font-mono">Semana {state.day}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 uppercase tracking-wider border-b border-stone-800 bg-stone-950/40">
                <th className="py-2.5 px-3 text-left w-8">#</th>
                <th className="py-2.5 px-3 text-left">Guilda</th>
                <th className="py-2.5 px-3 text-right w-12 font-bold text-amber-400">Pts</th>
                <th className="py-2.5 px-3 text-right w-10">J</th>
                <th className="py-2.5 px-3 text-right w-10">V</th>
                <th className="py-2.5 px-3 text-right w-10">E</th>
                <th className="py-2.5 px-3 text-right w-10">D</th>
                <th className="py-2.5 px-3 text-right w-12">PE+</th>
                <th className="py-2.5 px-3 text-right w-12">PE-</th>
                <th className="py-2.5 px-3 text-right w-12" title="Saldo de Pontos de Expedição (PE+ menos PE-)">SPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {state.league_table.map(row => {
                const isPlayer = row.is_player || row.guild_name === 'Guilda do Jogador'
                return (
                  <tr
                    key={row.rank}
                    className={`transition-colors ${
                      isPlayer
                        ? 'bg-amber-500/20 border border-amber-500/50 font-bold text-amber-300'
                        : 'text-stone-300 hover:bg-stone-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-stone-500">{row.rank}</td>
                    <td className="py-2.5 px-3 flex items-center gap-1.5 font-semibold">
                      {isPlayer && <span className="text-amber-400 text-xs">▶</span>}
                      <span>{row.guild_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-400 font-mono">{row.points}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.played}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.wins}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.draws}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.losses}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.pe_for}</td>
                    <td className="py-2.5 px-3 text-right text-stone-400 font-mono">{row.pe_against}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono ${
                        row.pe_diff > 0 ? 'text-emerald-400' : row.pe_diff < 0 ? 'text-rose-400' : 'text-stone-400'
                      }`}
                    >
                      {row.pe_diff > 0 ? `+${row.pe_diff}` : row.pe_diff}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-stone-800/80 bg-stone-950/60 text-[10px] text-stone-500 flex flex-wrap items-center justify-between gap-2">
          <span><strong>Pts:</strong> Pontos (V:3 E:1 D:0) · <strong>J:</strong> Expedições · <strong>V/E/D:</strong> Vitórias/Empates/Derrotas</span>
          <span><strong>PE+:</strong> Pontos Conquistados · <strong>PE-:</strong> Pontos Cedidos · <strong>SPE:</strong> Saldo de Pontos de Expedição</span>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-4 shadow-md">
      <div className="text-stone-400 text-[10px] uppercase font-mono tracking-wider mb-1">{label}</div>
      <div className={accent ? `${GOLD_GRADIENT_TEXT} text-xl font-mono` : 'text-xl font-bold text-amber-100 font-mono'}>
        {value}
      </div>
      <div className="text-stone-500 text-[11px] mt-1">{sub}</div>
    </div>
  )
}
