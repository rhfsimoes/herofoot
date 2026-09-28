import { useState, useEffect } from 'react'
import { Swords, ArrowRight, Newspaper, Compass } from 'lucide-react'
import type { MatchResult, DungeonRoomEvent } from '../mockData'

interface Phase4DungeonProps {
  onAdvance: () => void
  onExecuteExpedition?: () => Promise<any>
  day?: number
  rivalGuildName?: string
  lastRoundResults?: MatchResult[]
}

export default function Phase4Dungeon({
  onAdvance,
  onExecuteExpedition,
  day = 1,
  rivalGuildName = 'Ordem do Grifo Dourado',
  lastRoundResults,
}: Phase4DungeonProps) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [currentRoomIndex, setCurrentRoomIndex] = useState(-1)
  const [roomEvents, setRoomEvents] = useState<DungeonRoomEvent[]>([])

  // Suprimentos e Placar
  const [playerEnergy, setPlayerEnergy] = useState(100)
  const [rivalEnergy, setRivalEnergy] = useState(100)
  const [playerScore, setPlayerScore] = useState(0)
  const [rivalScore, setRivalScore] = useState(0)

  // Resumo final de salas e encerramento
  const [summary, setSummary] = useState<{
    roomsPlayer: number
    roomsRival: number
    exitPlayer: string
    exitRival: string
  } | null>(null)

  const [logs, setLogs] = useState<{
    room: number
    type: 'room' | 'miniboss' | 'boss' | 'empty'
    scorer?: 'player' | 'rival' | 'joint' | null
    text: string
  }[]>([])

  const [simulatedMatches, setSimulatedMatches] = useState<MatchResult[]>([])

  // Animação sala a sala através dos room_events
  useEffect(() => {
    if (!running || roomEvents.length === 0) return

    if (currentRoomIndex >= roomEvents.length - 1) {
      setDone(true)
      setRunning(false)
      return
    }

    const timer = setTimeout(() => {
      const nextIndex = currentRoomIndex + 1
      const evt = roomEvents[nextIndex]
      setCurrentRoomIndex(nextIndex)

      // Atualiza barras de energia
      setPlayerEnergy(Math.round(evt.energy_t1))
      setRivalEnergy(Math.round(evt.energy_t2))

      // Classifica tipo de sala e pontuação
      let roomType: 'room' | 'miniboss' | 'boss' | 'empty' = 'room'
      let scorer: 'player' | 'rival' | 'joint' | null = null

      const evtText = evt.event || ''
      if (evt.is_final_boss) {
        roomType = 'boss'
        if (evtText.includes('Abate Conjunto')) {
          scorer = 'joint'
          setPlayerScore(s => s + 1)
          setRivalScore(s => s + 1)
        } else if (evtText.includes('Guilda do Jogador')) {
          scorer = 'player'
          setPlayerScore(s => s + 2)
        } else if (evtText.includes(rivalGuildName)) {
          scorer = 'rival'
          setRivalScore(s => s + 2)
        }
      } else if (evtText.includes('sem ocorrências')) {
        roomType = 'empty'
      } else {
        roomType = 'miniboss'
        if (evtText.includes('Guilda do Jogador')) {
          scorer = 'player'
          setPlayerScore(s => s + 1)
        } else if (evtText.includes(rivalGuildName)) {
          scorer = 'rival'
          setRivalScore(s => s + 1)
        }
      }

      setLogs(prev => [
        {
          room: evt.room,
          type: roomType,
          scorer,
          text: `Câmara ${evt.room}: ${evt.event}`,
        },
        ...prev,
      ])
    }, 1200)

    return () => clearTimeout(timer)
  }, [running, currentRoomIndex, roomEvents, rivalGuildName])

  // Iniciar expedição
  async function handleStart() {
    setRunning(true)
    setDone(false)
    setCurrentRoomIndex(-1)
    setLogs([])
    setPlayerScore(0)
    setRivalScore(0)
    setPlayerEnergy(100)
    setRivalEnergy(100)
    setSummary(null)

    if (onExecuteExpedition) {
      try {
        const res = await onExecuteExpedition()
        if (res && res.result && res.result.player_match) {
          const matchData = res.result.player_match
          const events: DungeonRoomEvent[] = matchData.room_events || []
          setRoomEvents(events)

          setSummary({
            roomsPlayer: matchData.rooms_explored_player ?? events.length,
            roomsRival: matchData.rooms_explored_rival ?? events.length,
            exitPlayer: matchData.exit_reason_player || 'Boss resolvido',
            exitRival: matchData.exit_reason_rival || 'Boss resolvido',
          })

          if (res.result.league_matches && res.result.league_matches.length > 0) {
            setSimulatedMatches(res.result.league_matches)
          } else if (lastRoundResults && lastRoundResults.length > 0) {
            setSimulatedMatches(lastRoundResults)
          }
          return
        }
      } catch (err) {
        console.warn('Fallback para simulação de masmorra local:', err)
      }
    }

    // Fallback local: simula masmorra de duração variável (entre 6 e 9 salas)
    const totalRooms = 6 + Math.floor(Math.random() * 4) // 6 a 9 salas
    const localEvents: DungeonRoomEvent[] = []
    let pE = 100
    let rE = 100

    for (let r = 1; r <= totalRooms; r++) {
      const isBoss = r === totalRooms
      pE = Math.max(0, pE - (10 + Math.floor(Math.random() * 8)))
      rE = Math.max(0, rE - (12 + Math.floor(Math.random() * 8)))

      let eventMsg = 'Sala sem ocorrências operacionais.'
      if (isBoss) {
        if (Math.random() > 0.4) {
          eventMsg = `Guilda do Jogador superou a margem de 15% e abateu o Boss Final (+2 PE)!`
        } else {
          eventMsg = `Abate Conjunto! Margem de equilíbrio no Boss Final (+1 PE para ambas as guildas).`
        }
      } else {
        const hasEncounter = Math.random() < 0.65
        if (hasEncounter) {
          if (Math.random() > 0.4) {
            eventMsg = `Guilda do Jogador neutralizou a ameaça na Câmara ${r} (+1 PE).`
          } else {
            eventMsg = `${rivalGuildName} neutralizou a ameaça na Câmara ${r} (+1 PE).`
          }
        }
      }

      localEvents.push({
        room: r,
        is_final_boss: isBoss,
        energy_t1: pE,
        energy_t2: rE,
        t1_present: pE > 0,
        t2_present: rE > 0,
        event: eventMsg,
      })
    }

    setRoomEvents(localEvents)
    setSummary({
      roomsPlayer: totalRooms,
      roomsRival: totalRooms,
      exitPlayer: 'Boss resolvido',
      exitRival: 'Boss resolvido',
    })

    setSimulatedMatches([
      { home_name: 'Guilda do Jogador', home_score: 3, away_name: rivalGuildName, away_score: 2, is_player_match: true },
      { home_name: 'Irmandade do Aço Negro', home_score: 2, away_name: 'Lança da Alvorada', away_score: 1 },
      { home_name: 'Corvo e Osso', home_score: 1, away_name: 'Sentinelas da Prata', away_score: 1 },
      { home_name: 'Vigia de Pedra', home_score: 0, away_name: 'Legião do Crepúsculo', away_score: 2 },
    ])
  }

  const currentEvent = currentRoomIndex >= 0 ? roomEvents[currentRoomIndex] : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase IV</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Simulação da Expedição Oficial</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Incursão em Masmorra — Duração Variável
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            A expedição avança pelas câmaras até o esgotamento dos Suprimentos ou a resolução do Boss Final.
          </p>
        </div>

        <div className="text-right">
          <span className="text-stone-400 text-xs">Adversário da Rodada: </span>
          <strong className="text-amber-300 text-xs font-mono font-bold">vs {rivalGuildName}</strong>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MOLDURA DE PLACAR ESTILO MADEIRA E LATÃO
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border-2 border-amber-900/50 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Barras Horizontais Animadas de Energia/Suprimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-stone-800/80 pb-5">
          {/* Barra do Jogador */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-200">Guilda do Jogador</span>
              <span className="font-mono font-bold text-stone-300">{playerEnergy} Suprimentos</span>
            </div>
            <div className="w-full bg-stone-950 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  playerEnergy > 25
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, playerEnergy))}%` }}
              />
            </div>
          </div>

          {/* Barra do Rival */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-stone-300">{rivalGuildName}</span>
              <span className="font-mono font-bold text-stone-300">{rivalEnergy} Suprimentos</span>
            </div>
            <div className="w-full bg-stone-950 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  rivalEnergy > 25
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400 animate-pulse'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rivalEnergy))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Placar Central com Indicador da Câmara Atual */}
        <div className="flex items-center justify-around text-center py-2 flex-wrap gap-4">
          <div className="flex-1 min-w-[120px]">
            <div className="text-xs uppercase tracking-widest text-amber-300 font-bold mb-1">
              Guilda do Jogador
            </div>
            <div className="text-5xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
              {playerScore}
            </div>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono">PE Confirmados</span>
          </div>

          {/* Indicador Central da Sala */}
          <div className="px-4 flex flex-col items-center">
            {currentEvent ? (
              <div className="bg-stone-900 border border-amber-600/50 px-4 py-2 rounded-xl text-center shadow-inner">
                <span className="text-[9px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                  Câmara Atual
                </span>
                <span className="text-lg font-black text-stone-100 font-mono">
                  #{currentEvent.room}
                </span>
                <span className="text-[10px] block mt-0.5 font-bold text-stone-400">
                  {currentEvent.is_final_boss
                    ? '⚔️ BOSS FINAL'
                    : currentEvent.event.includes('sem ocorrências')
                    ? '○ Vazia'
                    : '⚡ Mini-Boss'}
                </span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-600 font-black text-base shadow-inner">
                VS
              </div>
            )}
          </div>

          <div className="flex-1 min-w-[120px]">
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
          TERMINAL DE TRANSMISSÃO DA EXPEDIÇÃO (LOGS)
         ───────────────────────────────────────────── */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 h-64 overflow-y-auto space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-stone-500 border-b border-stone-800/80 pb-1.5 mb-2 font-mono">
          <span>// TRANSMISSÃO TELEMÉTRICA DA MASMORRA</span>
          <span>SEMANA #{day}</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-stone-600 italic py-8 text-center">
            Aguardando início da incursão para recepção dos sinais de campanha.
          </p>
        ) : (
          logs.map((logItem, idx) => {
            if (logItem.type === 'boss') {
              return (
                <div
                  key={idx}
                  className="text-amber-300 font-bold bg-amber-950/40 p-2 rounded-lg border-l-4 border-amber-500 shadow-sm"
                >
                  <span className="text-[10px] text-amber-500 uppercase block font-black mb-0.5">
                    [CÂMARA {logItem.room} — BOSS FINAL]
                  </span>
                  <span>{logItem.text}</span>
                </div>
              )
            }
            if (logItem.type === 'miniboss') {
              return (
                <div
                  key={idx}
                  className="text-stone-200 bg-stone-900/60 p-2 rounded-lg border-l-2 border-cyan-500"
                >
                  <span className="text-[10px] text-cyan-400 uppercase block font-bold mb-0.5">
                    [CÂMARA {logItem.room} — MINI-BOSS]
                  </span>
                  <span>{logItem.text}</span>
                </div>
              )
            }
            if (logItem.type === 'empty') {
              return (
                <div key={idx} className="text-stone-500 italic px-2 py-1">
                  [Câmara {logItem.room}] {logItem.text}
                </div>
              )
            }
            return (
              <div key={idx} className="text-stone-400 px-2 py-1">
                {logItem.text}
              </div>
            )
          })
        )}
      </div>

      {/* ─────────────────────────────────────────────
          LAUDO FINAL DA EXPEDIÇÃO (SALAS PERCORRIDAS & MOTIVO)
         ───────────────────────────────────────────── */}
      {done && summary && (
        <div className="bg-[#1c1917] border-2 border-amber-600/70 rounded-xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="text-amber-200 text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Laudo Técnico de Encerramento de Incursão</span>
            </h3>
            <span className="text-[10px] bg-stone-900 border border-stone-700 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
              EXPEDIÇÃO CONCLUÍDA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guilda do Jogador */}
            <div className="bg-stone-950/70 border border-amber-950/60 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-300">Guilda do Jogador</span>
                <span className="font-mono font-bold text-stone-200">
                  {summary.roomsPlayer} Câmaras Percorridas
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400">Motivo do Encerramento:</span>
                <strong
                  className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                    summary.exitPlayer === 'Boss resolvido'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {summary.exitPlayer}
                </strong>
              </div>
            </div>

            {/* Guilda Rival */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-300">{rivalGuildName}</span>
                <span className="font-mono font-bold text-stone-200">
                  {summary.roomsRival} Câmaras Percorridas
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400">Motivo do Encerramento:</span>
                <strong
                  className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                    summary.exitRival === 'Boss resolvido'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {summary.exitRival}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          BOLETIM OFICIAL DA LIGA (RODADA COMPLETA)
         ───────────────────────────────────────────── */}
      {done && simulatedMatches.length > 0 && (
        <div className="bg-[#1c1917] border border-amber-800/60 rounded-xl p-5 space-y-3 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="text-amber-300 text-xs uppercase tracking-widest font-black flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-amber-500" />
              <span>Boletim de Resultados da Rodada — Semana {day}</span>
            </h3>
            <span className="text-stone-500 text-[10px] font-mono">Resultados Homologados pela Liga</span>
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
          <span>Iniciar Expedição & Simulação da Rodada</span>
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
