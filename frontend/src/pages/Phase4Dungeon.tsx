import { useState, useEffect } from 'react'
import { Swords, ArrowRight, Newspaper } from 'lucide-react'
import type { MatchResult } from '../mockData'

interface Phase4DungeonProps {
  onAdvance: () => void
  day?: number
  rivalGuildName?: string
  lastRoundResults?: MatchResult[]
}

const ROOMS = [
  'Corredor de Entrada (Setor Externo)',
  'Câmara de Guarda Infestada',
  'Depósito de Provisões Perdido',
  'Santuário Profanado de Risco Alto',
  'Câmara do Boss Final (Setor Profundo)',
]

export default function Phase4Dungeon({
  onAdvance,
  day = 1,
  rivalGuildName = 'Ordem do Grifo Dourado',
  lastRoundResults,
}: Phase4DungeonProps) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(-1)
  const [playerEnergy, setPlayerEnergy] = useState(100)
  const [rivalEnergy, setRivalEnergy] = useState(100)
  const [playerScore, setPlayerScore] = useState(0)
  const [rivalScore, setRivalScore] = useState(0)
  const [logs, setLogs] = useState<{ text: string; type: 'room' | 'combat' | 'buff' | 'boss' | 'exhaust' }[]>([])
  const [simulatedMatches, setSimulatedMatches] = useState<MatchResult[]>([])

  useEffect(() => {
    if (!running) return
    if (currentRoom >= ROOMS.length - 1) {
      setDone(true)
      setRunning(false)

      if (lastRoundResults && lastRoundResults.length > 0) {
        setSimulatedMatches(lastRoundResults)
      } else {
        setSimulatedMatches([
          { home_name: 'Guilda do Jogador', home_score: playerScore, away_name: rivalGuildName, away_score: rivalScore, is_player_match: true },
          { home_name: 'Irmandade do Aço Negro', home_score: 3, away_name: 'Lança da Alvorada', away_score: 1 },
          { home_name: 'Corvo e Osso', home_score: 1, away_name: 'Sentinelas da Prata', away_score: 1 },
          { home_name: 'Vigia de Pedra', home_score: 0, away_name: 'Legião do Crepúsculo', away_score: 2 },
        ])
      }
      return
    }

    const timer = setTimeout(() => {
      const nextRoom = currentRoom + 1
      setCurrentRoom(nextRoom)

      // Dreno de suprimentos
      const pCost = 18 + Math.floor(Math.random() * 6)
      const rCost = 20 + Math.floor(Math.random() * 8)
      setPlayerEnergy(prev => Math.max(0, prev - pCost))
      setRivalEnergy(prev => Math.max(0, prev - rCost))

      // Log de avanço de sala
      setLogs(prev => [
        { text: `[Exploração] Força-tarefa avançou para: ${ROOMS[nextRoom]}`, type: 'room' },
        ...prev,
      ])

      const isBoss = nextRoom === ROOMS.length - 1
      if (isBoss) {
        setLogs(prev => [
          { text: `[Boss Final] Entidade guardiã emergiu! Disputa acirrada pelo abate prioritário!`, type: 'combat' },
          ...prev,
        ])

        const roll = Math.random()
        if (roll > 0.35) {
          setPlayerScore(s => s + 2)
          setLogs(prev => [
            { text: `Guilda do Jogador superou o rival em mais de 15% de poder e abateu o Boss Final (+2 PE)!`, type: 'boss' },
            ...prev,
          ])
        } else {
          setPlayerScore(s => s + 1)
          setRivalScore(s => s + 1)
          setLogs(prev => [
            { text: `Abate Conjunto! Margem tática equilibrada no Boss Final (+1 PE para ambas as guildas).`, type: 'boss' },
            ...prev,
          ])
        }
      } else {
        // Sala normal / Mini-boss
        if (Math.random() > 0.3) {
          setPlayerScore(s => s + 1)
          setLogs(prev => [
            { text: `Mini-Boss neutralizado pela Guilda do Jogador na ${ROOMS[nextRoom]} (+1 PE).`, type: 'boss' },
            ...prev,
          ])
        }
        if (Math.random() > 0.45) {
          setRivalScore(s => s + 1)
          setLogs(prev => [
            { text: `${rivalGuildName} abateu oponente em rota paralela (+1 PE).`, type: 'combat' },
            ...prev,
          ])
        }
        if (Math.random() > 0.6) {
          setLogs(prev => [
            { text: `Consumível de campanha ativado: Ração de suplementação nutriu a tropa.`, type: 'buff' },
            ...prev,
          ])
        }
      }
    }, 1400)

    return () => clearTimeout(timer)
  }, [running, currentRoom, lastRoundResults, playerScore, rivalGuildName, rivalScore])

  function handleStart() {
    setRunning(true)
    setCurrentRoom(-1)
    setLogs([])
    setPlayerScore(0)
    setRivalScore(0)
    setPlayerEnergy(100)
    setRivalEnergy(100)
    setDone(false)
    setSimulatedMatches([])
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase IV</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Simulação da Dungeon</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Arena de Masmorras & Rodada Oficial da Liga
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Acompanhe o consumo de suprimentos, abates de mini-bosses e a resolução do Boss Final em tempo real.
          </p>
        </div>

        <div className="text-right">
          <span className="text-stone-400 text-xs">Confronto da Rodada: </span>
          <strong className="text-amber-300 text-xs font-mono font-bold">vs {rivalGuildName}</strong>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MOLDURA DE PLACAR ESTILO MADEIRA E LATÃO
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border-2 border-amber-900/40 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Barras Horizontais Animadas de Energia/Suprimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-stone-800/80 pb-5">
          {/* Barra do Jogador */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-200">Guilda do Jogador</span>
              <span className="font-mono font-bold text-stone-300">{playerEnergy}%</span>
            </div>
            <div className="w-full bg-stone-950 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  playerEnergy > 25
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
                }`}
                style={{ width: `${playerEnergy}%` }}
              />
            </div>
          </div>

          {/* Barra do Rival */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-stone-300">{rivalGuildName}</span>
              <span className="font-mono font-bold text-stone-300">{rivalEnergy}%</span>
            </div>
            <div className="w-full bg-stone-950 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  rivalEnergy > 25
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${rivalEnergy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Placar Central com Fonte Destacada */}
        <div className="flex items-center justify-around text-center py-2">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-1">
              Guilda do Jogador
            </div>
            <div className="text-5xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
              {playerScore}
            </div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">PE Confirmados</span>
          </div>

          <div className="px-6">
            <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 font-black text-base shadow-inner">
              VS
            </div>
          </div>

          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-1">
              {rivalGuildName}
            </div>
            <div className="text-5xl font-black text-stone-200 font-mono tracking-tight drop-shadow-md">
              {rivalScore}
            </div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">PE Confirmados</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          CAIXA DO TERMINAL DE LOGS COM CORES SEMÂNTICAS
         ───────────────────────────────────────────── */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 h-64 overflow-y-auto space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-stone-500 border-b border-stone-800/80 pb-1.5 mb-2 font-mono">
          <span>// RELATÓRIO OFICIAL DE EXPEDIÇÃO EM TEMPO REAL</span>
          <span>SESSÃO #{day}</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-stone-600 italic py-8 text-center">
            Aguardando ordem de despacho da força-tarefa para iniciar a transmissão.
          </p>
        ) : (
          logs.map((logItem, idx) => {
            if (logItem.type === 'room') {
              return <div key={idx} className="text-stone-400">{logItem.text}</div>
            }
            if (logItem.type === 'combat') {
              return <div key={idx} className="text-stone-200 font-semibold">{logItem.text}</div>
            }
            if (logItem.type === 'buff') {
              return <div key={idx} className="text-blue-400">{logItem.text}</div>
            }
            if (logItem.type === 'boss') {
              return (
                <div key={idx} className="text-amber-400 font-bold bg-amber-950/30 p-1.5 rounded-md border-l-2 border-amber-500 shadow-sm">
                  {logItem.text}
                </div>
              )
            }
            return <div key={idx} className="text-rose-400 italic">{logItem.text}</div>
          })
        )}
      </div>

      {/* ─────────────────────────────────────────────
          BOLETIM OFICIAL DA RODADA (ESTILO BRASFOOT)
         ───────────────────────────────────────────── */}
      {done && simulatedMatches.length > 0 && (
        <div className="bg-[#1c1917] border border-amber-800/60 rounded-xl p-5 space-y-3 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="text-amber-300 text-xs uppercase tracking-widest font-black flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-500" />
              <span>Boletim de Resultados da Rodada — Semana {day}</span>
            </h3>
            <span className="text-stone-500 text-[10px] font-mono">Resultados Oficiais da Federação</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {simulatedMatches.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  m.is_player_match
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 font-bold shadow'
                    : 'bg-stone-900 border-stone-800 text-stone-300'
                }`}
              >
                <span className="truncate max-w-[130px] font-medium">{m.home_name}</span>
                <span className="font-mono font-black text-sm px-2 text-amber-400">
                  {m.home_score} x {m.away_score}
                </span>
                <span className="truncate max-w-[130px] text-right font-medium">{m.away_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles da Arena */}
      {!running && !done && (
        <button
          onClick={handleStart}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center justify-center gap-2"
        >
          <Swords className="w-4 h-4" />
          <span>Iniciar Expedição & Jogos da Rodada</span>
        </button>
      )}

      {running && (
        <div className="w-full py-3.5 bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs rounded-xl text-center animate-pulse">
          // Expedição e confrontos da liga em andamento pelas câmaras...
        </div>
      )}

      {done && (
        <button
          onClick={onAdvance}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center justify-center gap-2"
        >
          <span>Consolidar Resultados & Ir para Balanço Financeiro</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
