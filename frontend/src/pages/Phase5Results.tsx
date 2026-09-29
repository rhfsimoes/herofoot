import { useState, useEffect } from 'react'
import {
  Coins,
  Package,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Award,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react'
import type { GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'
import { CrownSeal, NobleDivisionEmblem, AccessDivisionEmblem } from '../components/art'

interface Phase5ResultsProps {
  state: GameState
  onAdvance: () => void
}

export default function Phase5Results({ state, onAdvance }: Phase5ResultsProps) {
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    state.current_division?.id || 'div_acesso'
  )
  const [showSeasonModal, setShowSeasonModal] = useState<boolean>(false)

  // Dispara modal de encerramento se houver season_summary nesta rodada
  useEffect(() => {
    if (state.season_summary) {
      setShowSeasonModal(true)
    }
  }, [state.season_summary])

  // Atualiza a aba da divisão quando a divisão ativa mudar
  useEffect(() => {
    if (state.current_division?.id) {
      setSelectedDivisionId(state.current_division.id)
    }
  }, [state.current_division?.id])

  const salaryTotal = state.team.reduce((sum, h) => sum + h.salary, 0)
  const maintenance = 50
  const expeditionRevenue = 250
  const salesRevenue = 120
  const seasonAward = state.season_summary?.award_gold || 0

  const crownAuditThisWeek =
    state.crown_goals?.last_audit_report &&
    state.crown_goals.last_audit_report.audit_week === (state.week ?? state.day)
      ? state.crown_goals.last_audit_report
      : null

  const crownSubsidy = crownAuditThisWeek && crownAuditThisWeek.delta_gold > 0 ? crownAuditThisWeek.delta_gold : 0
  const crownPenalty = crownAuditThisWeek && crownAuditThisWeek.delta_gold < 0 ? Math.abs(crownAuditThisWeek.delta_gold) : 0

  const totalRevenue = expeditionRevenue + salesRevenue + seasonAward + crownSubsidy
  const totalExpenses = salaryTotal + maintenance + crownPenalty
  const netResult = totalRevenue - totalExpenses

  // Divisão selecionada para visualização
  const divisions = state.divisions || []
  const activeDivision = divisions.find(d => d.id === selectedDivisionId)
  const rowsToDisplay = activeDivision ? activeDivision.standings : state.league_table

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase V</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Fechamento do Ciclo</span>
            <span className="text-stone-600">·</span>
            <span className="text-amber-300 font-bold font-mono text-xs bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded">
              Temporada {state.season || 1}
            </span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide flex items-center gap-2">
            <span>Resultados Oficiais, Balanço Financeiro & Classificação</span>
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Consolidação de receitas operacionais, folha de pagamento corporativa e atualização das divisões da liga.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state.season_summary && (
            <button
              onClick={() => setShowSeasonModal(true)}
              className="bg-amber-950/80 border border-amber-500/70 text-amber-300 hover:bg-amber-900/60 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Ver Laudo da Temporada</span>
            </button>
          )}

          <button
            onClick={onAdvance}
            className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-sm py-3 px-6 rounded-xl hover:brightness-110 shadow-lg shadow-amber-900/30 transition flex items-center gap-2 cursor-pointer"
          >
            <span>Arquivar Relatório & Iniciar Próxima Rodada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          LOOT DA EXPEDIÇÃO (GRID DE CARDS COMPACTOS)
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 border-b border-stone-800/80 pb-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
            Espólio Recolhido na Masmorra (Loot da Força-Tarefa)
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center gap-3 shadow">
            <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Recompensa</span>
              <span className={`${GOLD_GRADIENT_TEXT} text-sm font-mono`}>⬡ {expeditionRevenue} Ouro</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center gap-3 shadow">
            <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Minério Raro</span>
              <span className="text-stone-200 text-xs font-bold font-mono">3x Cristais de Mana</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center gap-3 shadow">
            <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Couro Fino</span>
              <span className="text-stone-200 text-xs font-bold font-mono">2x Couro Escamoso</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3.5 flex items-center gap-3 shadow">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">Certificação</span>
              <span className="text-stone-200 text-xs font-bold">Laudo Sem Infrações</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          BALANÇO FINANCEIRO EM 2 COLUNAS (ENTRADAS VS SAÍDAS)
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-stone-800/80 pb-2">
          <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
            Demonstrativo de Resultado do Exercício (Extrato da Semana)
          </h3>
          <span className="text-stone-500 text-xs font-mono">
            Semana {state.week ?? state.day} · Temporada {state.season ?? 1}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna 1: Entradas (Verde) */}
          <div className="space-y-3 bg-stone-900/60 border border-emerald-950/60 rounded-xl p-4">
            <div className="flex items-center gap-2 border-b border-emerald-900/40 pb-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>🟢 Entradas & Receitas Operacionais</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Prêmio de Exploração da Masmorra</span>
                <span className="font-mono text-emerald-400 font-bold">+⬡ {expeditionRevenue}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Receita Comercial de Balcão (Vendas)</span>
                <span className="font-mono text-emerald-400 font-bold">+⬡ {salesRevenue}</span>
              </div>
              {seasonAward > 0 && (
                <div className="flex justify-between text-amber-300 font-bold bg-amber-950/40 p-1.5 rounded border border-amber-800/60">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Bonificação Régia de Fim de Temporada
                  </span>
                  <span className="font-mono text-amber-400">+⬡ {seasonAward}</span>
                </div>
              )}
              {crownSubsidy > 0 && (
                <div className="flex justify-between text-emerald-300 font-bold bg-emerald-950/40 p-1.5 rounded border border-emerald-800/60">
                  <span className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-emerald-400" />
                    Subsídio Imperial da Coroa (Metas Aprovadas)
                  </span>
                  <span className="font-mono text-emerald-400">+⬡ {crownSubsidy}</span>
                </div>
              )}
              <div className="border-t border-stone-800 pt-2 flex justify-between font-bold text-stone-100">
                <span>Total de Receitas</span>
                <span className="font-mono text-emerald-400">+⬡ {totalRevenue} Ouro</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Saídas / Custos (Vermelho) */}
          <div className="space-y-3 bg-stone-900/60 border border-rose-950/60 rounded-xl p-4">
            <div className="flex items-center gap-2 border-b border-rose-900/40 pb-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <TrendingDown className="w-4 h-4" />
              <span>🔴 Saídas, Folha Salarial & Manutenção</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-300">
                <span>Folha de Pagamento dos Aventureiros ({state.team.length} membros)</span>
                <span className="font-mono text-rose-400 font-bold">-⬡ {salaryTotal}</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Custos de Manutenção Predial da Sede</span>
                <span className="font-mono text-rose-400 font-bold">-⬡ {maintenance}</span>
              </div>
              {crownPenalty > 0 && (
                <div className="flex justify-between text-rose-300 font-bold bg-rose-950/60 p-1.5 rounded border border-rose-800/60">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Autuação Fiscal da Coroa (Metas Descumpridas)
                  </span>
                  <span className="font-mono text-rose-400">-⬡ {crownPenalty}</span>
                </div>
              )}
              <div className="border-t border-stone-800 pt-2 flex justify-between font-bold text-stone-100">
                <span>Total de Despesas</span>
                <span className="font-mono text-rose-400">-⬡ {totalExpenses} Ouro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha de Resultado Líquido */}
        <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
          <span className="text-stone-300 font-bold uppercase tracking-wider">
            Superávit / Saldo Líquido da Rodada
          </span>
          <span
            className={`font-mono text-sm font-extrabold ${
              netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netResult >= 0 ? `+⬡ ${netResult}` : `-⬡ ${Math.abs(netResult)}`} Moedas de Ouro
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          METAS DA COROA & AUDITORIA IMPERIAL
         ───────────────────────────────────────────── */}
      {state.crown_goals && (
        <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center border-b border-stone-800/80 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 -my-1">
                <CrownSeal size={50} withRibbon={true} withGlow={state.crown_goals.is_audit_week} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
                    Decretos & Metas da Coroa Imperial
                  </h3>
                  <span className="text-[10px] font-mono bg-amber-950/80 border border-amber-800/70 text-amber-300 px-2 py-0.5 rounded font-bold">
                    Trimestre Fiscal {state.crown_goals.current_cycle}
                  </span>
                </div>
                <p className="text-stone-400 text-xs mt-0.5">
                  Ciclo de Avaliação: Semanas {state.crown_goals.cycle_start_week} a {state.crown_goals.cycle_deadline_week} ·{' '}
                  {state.crown_goals.is_audit_week ? (
                    <span className="text-amber-400 font-bold animate-pulse">
                      Auditoria Pericial em Execução Nesta Semana!
                    </span>
                  ) : (
                    <span className="text-stone-300 font-mono">
                      {state.crown_goals.weeks_remaining} semana(s) até a auditoria pericial
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">
                  Metas Homologadas
                </span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {state.crown_goals.goals_completed_count} de {state.crown_goals.goals.length}
                </span>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${
                  state.crown_goals.goals_completed_count >= state.crown_goals.min_goals_to_pass
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                }`}
              >
                {state.crown_goals.goals_completed_count >= state.crown_goals.min_goals_to_pass
                  ? 'Apto ao Subsídio'
                  : 'Risco de Autuação'}
              </div>
            </div>
          </div>

          {/* Notificação de Laudo de Auditoria se houver */}
          {crownAuditThisWeek && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                crownAuditThisWeek.passed
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              {crownAuditThisWeek.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs uppercase tracking-wide">
                    {crownAuditThisWeek.headline}
                  </span>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-black/40">
                    {crownAuditThisWeek.delta_gold >= 0
                      ? `+⬡ ${crownAuditThisWeek.delta_gold} Ouro`
                      : `-⬡ ${Math.abs(crownAuditThisWeek.delta_gold)} Ouro`}
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-1">
                  {crownAuditThisWeek.passed
                    ? `A Junta Real homologou ${crownAuditThisWeek.goals_completed} de ${crownAuditThisWeek.total_goals} metas com êxito. O Subsídio de Fomento foi creditado na conta corporativa da guilda.`
                    : `Apenas ${crownAuditThisWeek.goals_completed} de ${crownAuditThisWeek.total_goals} metas foram atingidas. A Coroa reteve ${Math.abs(crownAuditThisWeek.delta_gold)} Moedas de Ouro a título de sanção tributária.`}
                </p>
              </div>
            </div>
          )}

          {/* Grid dos 3 KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.crown_goals.goals.map(g => (
              <div
                key={g.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                  g.completed
                    ? 'bg-stone-900/80 border-emerald-900/40 shadow-sm'
                    : 'bg-stone-900/80 border-stone-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-stone-200">{g.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        g.completed
                          ? 'bg-emerald-950 border border-emerald-800/80 text-emerald-300'
                          : 'bg-stone-800 border border-stone-700 text-stone-400'
                      }`}
                    >
                      {g.completed ? 'Atingida' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3">{g.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-stone-400">Progresso:</span>
                    <span className={g.completed ? 'text-emerald-400 font-bold' : 'text-stone-300'}>
                      {g.id === 'financial_solvency' ? `⬡ ${g.current}` : g.current} /{' '}
                      {g.id === 'financial_solvency' ? `⬡ ${g.target}` : g.target} {g.unit}
                    </span>
                  </div>
                  <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        g.completed ? 'bg-emerald-500' : 'bg-amber-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          g.target > 0 ? (g.current / g.target) * 100 : g.current === 0 ? 100 : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé Informativo */}
          <div className="p-3 bg-stone-950/60 rounded-lg border border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Regulamento: Mínimo de {state.crown_goals.min_goals_to_pass} metas aprovadas para subsídio.</span>
            </span>
            <span className="text-stone-300">
              Subsídio: <strong className="text-emerald-400">+⬡ {state.crown_goals.subsidy_reward}</strong> · Multa:{' '}
              <strong className="text-rose-400">-⬡ {state.crown_goals.penalty_tax}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          TABELA ATUALIZADA DA LIGA (COM SELETOR DE DIVISÕES)
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
                Quadro de Classificação das Divisões
              </h3>
            </div>
            <p className="text-stone-400 text-[11px] mt-0.5">
              8 guildas por divisão · 2 vagas de Acesso e 2 vagas de Descenso regulamentadas pela Coroa
            </p>
          </div>

          {/* Abas de Divisão */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDivisionId('div_acesso')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedDivisionId === 'div_acesso'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <AccessDivisionEmblem size={18} />
              <span>Divisão de Acesso Mercante</span>
              {state.current_division?.id === 'div_acesso' && (
                <span className="text-[9px] bg-stone-950 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                  Sua Divisão
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedDivisionId('div_nobre')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                selectedDivisionId === 'div_nobre'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <NobleDivisionEmblem size={18} />
              <span>Divisão Nobre da Coroa</span>
              {state.current_division?.id === 'div_nobre' && (
                <span className="text-[9px] bg-stone-950 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                  Sua Divisão
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Legenda de Acesso e Descenso */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-stone-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" />
            <span className="text-emerald-300">Top 2: Zona de Acesso (Promoção)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/80 inline-block" />
            <span className="text-rose-300">Bottom 2: Zona de Descenso (Rebaixamento)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 uppercase tracking-wider border-b border-stone-800 bg-stone-950/40">
                <th className="py-2.5 px-3 text-left w-8">#</th>
                <th className="py-2.5 px-3 text-left">Guilda</th>
                <th className="py-2.5 px-3 text-center w-28">Status de Tabela</th>
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
              {rowsToDisplay.map(row => {
                const isPlayer = row.is_player || row.guild_name === 'Guilda do Jogador'
                const isPromotion = row.is_promotion_zone || (selectedDivisionId === 'div_acesso' && row.rank <= 2)
                const isRelegation = row.is_relegation_zone || (selectedDivisionId === 'div_nobre' && row.rank >= 7)

                let rowStyle = 'text-stone-300 hover:bg-stone-800/40'
                if (isPlayer) {
                  rowStyle = 'bg-amber-500/20 border-l-4 border-l-amber-400 font-bold text-amber-200'
                } else if (isPromotion) {
                  rowStyle = 'bg-emerald-950/20 border-l-2 border-l-emerald-500/60 text-stone-300'
                } else if (isRelegation) {
                  rowStyle = 'bg-rose-950/20 border-l-2 border-l-rose-500/60 text-stone-400'
                }

                return (
                  <tr key={row.rank} className={`transition-colors ${rowStyle}`}>
                    <td className="py-2.5 px-3 font-mono font-bold">{row.rank}</td>
                    <td className="py-2.5 px-3 flex items-center gap-1.5 font-semibold">
                      {isPlayer && <span className="text-amber-400 text-xs">▶</span>}
                      <span>{row.guild_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isPromotion ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                          <span>Acesso</span>
                        </span>
                      ) : isRelegation ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 inline-flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-rose-400" />
                          <span>Descenso</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-500">Permanência</span>
                      )}
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
        <div className="px-4 py-2.5 border-t border-stone-800/80 bg-stone-950/60 text-[10px] text-stone-500 flex flex-wrap items-center justify-between gap-2">
          <span><strong>Pts:</strong> Pontos da Liga (Vitória: 3, Empate: 1, Derrota: 0) · <strong>J:</strong> Expedições Realizadas · <strong>V/E/D:</strong> Vitórias, Empates e Derrotas</span>
          <span><strong>PE+:</strong> Pontos Conquistados · <strong>PE-:</strong> Pontos Cedidos · <strong>SPE:</strong> Saldo de Pontos de Expedição (PE+ menos PE-)</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MODAL: HOMOLOGAÇÃO DE FIM DE TEMPORADA
         ───────────────────────────────────────────── */}
      {showSeasonModal && state.season_summary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1c1917] border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-[0_0_60px_rgba(245,158,11,0.4)] relative">
            <button
              onClick={() => setShowSeasonModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <span className="text-[10px] bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-black px-4 py-1.5 rounded-full uppercase tracking-widest font-mono inline-block">
                ★ ENCERRAMENTO DE EXERCÍCIO FISCAL · TEMPORADA {state.season_summary.season} ★
              </span>
              <h3 className="text-2xl font-black text-amber-100">
                Laudo dos Oficiais da Liga das Guildas
              </h3>
              <p className="text-xs text-stone-400">
                Tribunal Régio de Arbitragem e Homologação de Divisões
              </p>
            </div>

            {/* Veredito Régio */}
            <div className="p-4 bg-stone-950 rounded-2xl border border-amber-900/70 text-xs text-stone-200 leading-relaxed font-serif italic">
              "{state.season_summary.verdict}"
            </div>

            {/* KPIs do Desfecho */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] uppercase font-mono text-stone-400 block">Colocação Final</span>
                <span className="text-base font-black text-amber-300 font-mono">
                  {state.season_summary.player_rank}º Lugar
                </span>
                <span className="text-[10px] text-stone-500 block">{state.season_summary.player_division_name}</span>
              </div>

              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3">
                <span className="text-[10px] uppercase font-mono text-stone-400 block">Bonificação da Coroa</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  +⬡ {state.season_summary.award_gold} Ouro
                </span>
                <span className="text-[10px] text-stone-500 block">Creditado na Tesouraria</span>
              </div>
            </div>

            {/* Movimentações de Acesso e Descenso */}
            <div className="p-3.5 bg-stone-900/50 rounded-xl border border-stone-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Guildas Promovidas (Acesso à Elite):
                </span>
                <span className="text-stone-300 font-mono">
                  {state.season_summary.promoted_guilds.join(', ') || 'Nenhuma'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Guildas Rebaixadas (Descenso ao Acesso):
                </span>
                <span className="text-stone-300 font-mono">
                  {state.season_summary.relegated_guilds.join(', ') || 'Nenhuma'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSeasonModal(false)
                onAdvance()
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black uppercase tracking-wider text-xs rounded-xl transition cursor-pointer shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Homologar Laudo & Abrir Temporada {state.season_summary.season + 1}</span>
            </button>
          </div>
        </div>
      )}

      {/* Botão de Rodapé */}
      <button
        onClick={onAdvance}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-base py-3 px-8 rounded-xl hover:brightness-110 shadow-lg shadow-amber-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Arquivar Relatório & Iniciar Próxima Rodada</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
