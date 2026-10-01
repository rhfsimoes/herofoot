import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swords, ArrowRight, Trophy, Compass, Award, Skull } from 'lucide-react'
import { getDungeonForDay, getClimateForDay, type GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'
import { CrownSeal } from '../components/art'
import MemorialHallOfFame from '../components/MemorialHallOfFame'

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
  const [showMemorial, setShowMemorial] = useState(false)
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

        {/* Boletim de Reconhecimento Prévio (Terreno & Clima da Rodada) */}
        {(() => {
          const dungeon = state.current_dungeon || getDungeonForDay(state.day)
          const climate = dungeon?.climate || getClimateForDay(state.day)
          return (
            <div className="mt-4 p-4 bg-stone-950/80 border border-stone-800 rounded-xl space-y-2.5 shadow-md">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  <span>Boletim de Reconhecimento Operacional — Semana #{state.day}</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">Dados da Incursão</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono uppercase font-bold">Bioma Base:</span>
                    <span className="text-[10px] font-mono text-amber-300 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">{dungeon.terrain_label || dungeon.name}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-200 mt-1">{dungeon.name}</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">{dungeon.description}</p>
                  <div className="text-[10px] font-mono text-rose-300 mt-1.5 pt-1 border-t border-stone-800/60">
                    Penalidade se desprotegido: -{Math.round((dungeon.power_penalty_pct ?? 0.12) * 100)}% Poder
                  </div>
                </div>
                <div className="bg-stone-900/70 p-2.5 rounded-lg border border-stone-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 font-mono uppercase font-bold">Clima Previsto:</span>
                    <span className="text-[10px] font-mono text-sky-300 font-bold px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/60">{climate.name}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-200 mt-1">{climate.name}</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">{climate.description}</p>
                  <div className="text-[10px] font-mono text-amber-300 mt-1.5 pt-1 border-t border-stone-800/60">
                    Sobrecarga climática: +{climate.energy_cost_extra} Dreno de Suprimentos
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Notificação de Incidente Corporativo Ativo */}
        {state.active_event && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-950/80 via-stone-900 to-amber-950/80 border border-amber-600/70 rounded-xl flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <CrownSeal size={36} withRibbon={false} withGlow={true} />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
                  Incidente Corporativo Pendente de Homologação
                </span>
                <span className="text-amber-200 font-bold text-sm">
                  {state.active_event.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/phase1')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-lg transition font-mono flex items-center gap-1.5 shadow"
            >
              <span>Abrir Autos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mt-5 flex gap-3 flex-wrap items-center">
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
          <button
            onClick={() => setShowMemorial(prev => !prev)}
            className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 ${
              showMemorial
                ? 'bg-amber-950 border-amber-600 text-amber-300 shadow-lg'
                : 'bg-stone-950/90 border-stone-800 text-stone-400 hover:text-amber-200 hover:border-amber-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{showMemorial ? 'Fechar Memorial' : 'Quadro de Honra & Baixas'}</span>
          </button>
        </div>
      </div>

      {/* Seção Condicional do Mural da Glória & Memorial de Baixas */}
      {showMemorial && (
        <MemorialHallOfFame
          onClose={() => setShowMemorial(false)}
          currentWeek={state.day}
        />
      )}

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

      {/* Card Oficial das Metas da Coroa Imperial com Selo de Cera */}
      {state.crown_goals && (
        <div className="bg-[#1c1917] border border-amber-900/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800/80">
            <div className="flex items-center gap-4">
              <CrownSeal size={58} withRibbon={true} withGlow={state.crown_goals.is_audit_week} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-amber-200 text-sm font-black uppercase tracking-wider">
                    Decretos Fiscais & Metas da Coroa
                  </h3>
                  <span className="text-[10px] font-mono bg-amber-950/80 border border-amber-800/70 text-amber-300 px-2 py-0.5 rounded font-bold">
                    Trimestre {state.crown_goals.current_cycle}
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-1">
                  Avaliação da Junta Real: Semanas {state.crown_goals.cycle_start_week} a {state.crown_goals.cycle_deadline_week} ·{' '}
                  <span className="text-amber-300 font-mono font-semibold">
                    {state.crown_goals.weeks_remaining} semana(s) restante(s)
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-lg text-right font-mono">
                <span className="text-[10px] uppercase text-stone-500 block">Homologação</span>
                <span className="text-sm font-bold text-amber-400">
                  {state.crown_goals.goals_completed_count} de {state.crown_goals.goals.length} Metas
                </span>
              </div>
              <div
                className={`px-3 py-2 rounded-lg border text-xs font-bold font-mono ${
                  state.crown_goals.goals_completed_count >= state.crown_goals.min_goals_to_pass
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                }`}
              >
                {state.crown_goals.goals_completed_count >= state.crown_goals.min_goals_to_pass
                  ? '✓ Apto ao Subsídio'
                  : '⚠ Alerta Fiscal'}
              </div>
            </div>
          </div>

          {/* Mini-grid de metas no Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {state.crown_goals.goals.map(g => (
              <div
                key={g.id}
                className="bg-stone-950/60 border border-stone-800/80 p-3 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-stone-200">{g.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      g.completed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {g.completed ? 'Cumprida' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-snug">{g.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-stone-500">Progresso</span>
                  <span className="text-amber-300 font-bold">
                    {g.current} / {g.target} {g.unit || ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
