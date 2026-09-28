import { Shield, Coins, Trophy, Star } from 'lucide-react'
import type { GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface HeaderProps {
  state: GameState
  isBackendOnline?: boolean
}

export default function Header({ state, isBackendOnline }: HeaderProps) {
  // Posição do jogador na liga
  const playerRank = state.league_table.find(
    r => r.is_player || r.guild_name === 'Guilda do Jogador'
  )?.rank ?? 4

  // Confiança da população / reputação (default 85%)
  const reputation = 85

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur border-b border-stone-800 px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* Nome da Loja / Guilda */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-950/50">
            <Shield className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-amber-100 font-black text-sm tracking-wider uppercase">
                Guilda do Jogador
              </h1>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isBackendOnline
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
                title={isBackendOnline ? 'Conexão ativa com o backend' : 'Modo autônomo offline'}
              >
                {isBackendOnline ? '● ONLINE' : '○ LOCAL'}
              </span>
            </div>
            <p className="text-stone-400 text-[11px] flex items-center gap-1">
              <span>Alvará Real de Expedições</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400">Nível Operacional II</span>
            </p>
          </div>
        </div>

        {/* KPIs em Cards de Madeira & Ouro */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          {/* Saldo em Ouro */}
          <div className="bg-[#1c1917] border border-amber-950/50 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block -mb-0.5">Caixa</span>
              <span className={`${GOLD_GRADIENT_TEXT} text-base`}>
                {state.gold.toLocaleString('pt-BR')} <span className="text-xs text-amber-300 font-bold">G</span>
              </span>
            </div>
          </div>

          {/* Posição na Liga */}
          <div className="bg-[#1c1917] border border-stone-800 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block -mb-0.5">Liga</span>
              <span className="bg-stone-900 border border-amber-900/50 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold inline-block">
                {playerRank}º Lugar
              </span>
            </div>
          </div>

          {/* Confiança da População */}
          <div className="hidden md:flex bg-[#1c1917] border border-stone-800 rounded-xl px-3.5 py-1.5 items-center gap-2.5 shadow-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            <div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-stone-400 gap-2 -mb-0.5">
                <span>Confiança</span>
                <span className="text-stone-300 font-bold">{reputation}%</span>
              </div>
              <div className="w-16 bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden border border-stone-700/50">
                <div
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-1.5 rounded-full"
                  style={{ width: `${reputation}%` }}
                />
              </div>
            </div>
          </div>

          {/* Semana / Rodada Atual (R-X) */}
          <div className="bg-stone-900 border-2 border-amber-500/80 rounded-xl px-3.5 py-1.5 flex flex-col items-center justify-center shadow-lg shadow-amber-950/40">
            <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold">Semana</span>
            <span className="text-sm font-black text-amber-100 font-mono">
              R-{state.week ?? state.day}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
