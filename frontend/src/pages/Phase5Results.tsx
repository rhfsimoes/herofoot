import { Coins, Package, ArrowRight, TrendingUp, TrendingDown, Award } from 'lucide-react'
import type { GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface Phase5ResultsProps {
  state: GameState
  onAdvance: () => void
}

export default function Phase5Results({ state, onAdvance }: Phase5ResultsProps) {
  const salaryTotal = state.team.reduce((sum, h) => sum + h.salary, 0)
  const maintenance = 50
  const expeditionRevenue = 250
  const salesRevenue = 120
  const totalRevenue = expeditionRevenue + salesRevenue
  const netResult = totalRevenue - salaryTotal - maintenance

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase V</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Fechamento do Ciclo</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Resultados Oficiais, Balanço Financeiro & Classificação
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Consolidação de receitas de expedição, liquidação de despesas com folha de pagamento e atualização da tabela da liga.
          </p>
        </div>

        <button
          onClick={onAdvance}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-base py-3 px-8 rounded-xl hover:brightness-110 shadow-lg shadow-amber-900/30 transition flex items-center gap-2"
        >
          <span>Arquivar Relatório & Iniciar Próxima Rodada</span>
          <ArrowRight className="w-5 h-5" />
        </button>
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
          <span className="text-stone-500 text-xs font-mono">Semana {state.day}</span>
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
              <div className="border-t border-stone-800 pt-2 flex justify-between font-bold text-stone-100">
                <span>Total de Despesas</span>
                <span className="font-mono text-rose-400">-⬡ {salaryTotal + maintenance} Ouro</span>
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
          TABELA ATUALIZADA DA LIGA (COM LINHA DA LOJA DESTACADA)
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
            Classificação Geral da Liga das Guildas
          </h3>
          <span className="text-stone-500 text-xs font-mono">Semana {state.day} Encerrada</span>
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
                <th className="py-2.5 px-3 text-right w-12">SG</th>
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
                    <td className="py-2.5 px-3 font-mono">{row.rank}</td>
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
      </div>

      {/* Botão de Rodapé */}
      <button
        onClick={onAdvance}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-base py-3 px-8 rounded-xl hover:brightness-110 shadow-lg shadow-amber-900/30 transition flex items-center justify-center gap-2"
      >
        <span>Arquivar Relatório & Iniciar Próxima Rodada</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}
