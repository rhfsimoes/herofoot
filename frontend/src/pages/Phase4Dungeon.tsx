import { useState, useEffect, useMemo } from 'react'
import {
  Swords,
  ArrowRight,
  Newspaper,
  Compass,
  Mountain,
  CloudRain,
  CloudLightning,
  Sun,
  Wind,
  CloudFog,
  Flame,
  Droplets,
  Layers,
  Skull,
  ShieldCheck,
  ShieldAlert,
  Scroll,
} from 'lucide-react'
import {
  getDungeonForDay,
  getClimateForDay,
  type MatchResult,
  type DungeonRoomEvent,
  type GameState,
  type DungeonInfo,
  type DungeonClimateInfo,
  type InventoryItem,
} from '../mockData'
import { BiomeBanner } from '../components/art'

interface Phase4DungeonProps {
  onAdvance: () => void
  onExecuteExpedition?: () => Promise<any>
  day?: number
  rivalGuildName?: string
  lastRoundResults?: MatchResult[]
  state?: GameState
  dungeon?: DungeonInfo
  currentDungeon?: DungeonInfo
  climate?: DungeonClimateInfo
}

function getBiomeVisual(terrain: string) {
  switch (terrain) {
    case 'toxic_swamp':
      return {
        icon: Skull,
        badgeBg: 'bg-lime-950/70 border-lime-700/60 text-lime-300',
        cardBg: 'bg-gradient-to-br from-lime-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-lime-800/50',
        textAccent: 'text-lime-400',
        iconBg: 'bg-lime-950/80 border-lime-600/50 text-lime-400',
      }
    case 'glacier_frost':
      return {
        icon: Mountain,
        badgeBg: 'bg-sky-950/70 border-sky-700/60 text-sky-300',
        cardBg: 'bg-gradient-to-br from-sky-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-sky-800/50',
        textAccent: 'text-sky-400',
        iconBg: 'bg-sky-950/80 border-sky-600/50 text-sky-400',
      }
    case 'unstable_mine':
      return {
        icon: Layers,
        badgeBg: 'bg-amber-950/70 border-amber-700/60 text-amber-300',
        cardBg: 'bg-gradient-to-br from-amber-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-amber-800/50',
        textAccent: 'text-amber-400',
        iconBg: 'bg-amber-950/80 border-amber-600/50 text-amber-400',
      }
    case 'volcanic_heat':
      return {
        icon: Flame,
        badgeBg: 'bg-rose-950/70 border-rose-700/60 text-rose-300',
        cardBg: 'bg-gradient-to-br from-rose-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-rose-800/50',
        textAccent: 'text-rose-400',
        iconBg: 'bg-rose-950/80 border-rose-600/50 text-rose-400',
      }
    case 'submerged_ruins':
      return {
        icon: Droplets,
        badgeBg: 'bg-cyan-950/70 border-cyan-700/60 text-cyan-300',
        cardBg: 'bg-gradient-to-br from-cyan-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-cyan-800/50',
        textAccent: 'text-cyan-400',
        iconBg: 'bg-cyan-950/80 border-cyan-600/50 text-cyan-400',
      }
    case 'arcane_fog':
      return {
        icon: CloudFog,
        badgeBg: 'bg-purple-950/70 border-purple-700/60 text-purple-300',
        cardBg: 'bg-gradient-to-br from-purple-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-purple-800/50',
        textAccent: 'text-purple-400',
        iconBg: 'bg-purple-950/80 border-purple-600/50 text-purple-400',
      }
    case 'lightning_peaks':
      return {
        icon: CloudLightning,
        badgeBg: 'bg-yellow-950/70 border-yellow-700/60 text-yellow-300',
        cardBg: 'bg-gradient-to-br from-yellow-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-yellow-800/50',
        textAccent: 'text-yellow-400',
        iconBg: 'bg-yellow-950/80 border-yellow-600/50 text-yellow-400',
      }
    default:
      return {
        icon: Compass,
        badgeBg: 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300',
        cardBg: 'bg-gradient-to-br from-emerald-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-emerald-800/50',
        textAccent: 'text-emerald-400',
        iconBg: 'bg-emerald-950/80 border-emerald-600/50 text-emerald-400',
      }
  }
}

function getClimateVisual(climate: string) {
  switch (climate) {
    case 'lightning_storm':
      return {
        icon: CloudLightning,
        badgeBg: 'bg-yellow-950/70 border-yellow-600/60 text-yellow-300',
        cardBg: 'bg-gradient-to-br from-yellow-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-yellow-800/50',
        textAccent: 'text-yellow-400',
        iconBg: 'bg-yellow-950/80 border-yellow-600/50 text-yellow-400',
      }
    case 'thick_fog':
      return {
        icon: CloudFog,
        badgeBg: 'bg-slate-900 border-slate-600/60 text-slate-300',
        cardBg: 'bg-gradient-to-br from-slate-900/40 via-stone-900 to-[#1c1917]',
        border: 'border-slate-700/50',
        textAccent: 'text-slate-300',
        iconBg: 'bg-slate-900 border-slate-600/50 text-slate-300',
      }
    case 'acid_rain':
      return {
        icon: CloudRain,
        badgeBg: 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300',
        cardBg: 'bg-gradient-to-br from-emerald-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-emerald-800/50',
        textAccent: 'text-emerald-400',
        iconBg: 'bg-emerald-950/80 border-emerald-600/50 text-emerald-400',
      }
    case 'scorching_heat':
      return {
        icon: Flame,
        badgeBg: 'bg-orange-950/70 border-orange-600/60 text-orange-300',
        cardBg: 'bg-gradient-to-br from-orange-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-orange-800/50',
        textAccent: 'text-orange-400',
        iconBg: 'bg-orange-950/80 border-orange-600/50 text-orange-400',
      }
    case 'polar_wind':
      return {
        icon: Wind,
        badgeBg: 'bg-cyan-950/70 border-cyan-600/60 text-cyan-300',
        cardBg: 'bg-gradient-to-br from-cyan-950/25 via-stone-900 to-[#1c1917]',
        border: 'border-cyan-800/50',
        textAccent: 'text-cyan-400',
        iconBg: 'bg-cyan-950/80 border-cyan-600/50 text-cyan-400',
      }
    default:
      return {
        icon: Sun,
        badgeBg: 'bg-amber-950/70 border-amber-600/60 text-amber-300',
        cardBg: 'bg-gradient-to-br from-amber-950/20 via-stone-900 to-[#1c1917]',
        border: 'border-amber-800/50',
        textAccent: 'text-amber-300',
        iconBg: 'bg-amber-950/80 border-amber-600/50 text-amber-300',
      }
  }
}

const BIOME_BY_DAY: Record<number, { terrain: string; name: string }> = {
  1: { terrain: 'campo_verdejante', name: 'Planície dos Ecos — Campo Verdejante' },
  2: { terrain: 'pantano_putrido', name: 'Pântano dos Murmúrios — Limo & Névoa Ácida' },
  3: { terrain: 'cripta_glacial', name: 'Cripta dos Reis Esquecidos — Gelo Eterno' },
  4: { terrain: 'mina_profunda', name: 'Mina do Abismo de Ferro — Caverna Profunda' },
  0: { terrain: 'caldeira_vulcanica', name: 'Caldeira de Enxofre — Magma & Basalto' },
}

export default function Phase4Dungeon({
  onAdvance,
  onExecuteExpedition,
  day = 1,
  rivalGuildName = 'Ordem do Grifo Dourado',
  lastRoundResults,
  state,
  dungeon,
  currentDungeon,
  climate,
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

  // Determinação determinística de Bioma Base e Clima da Semana
  const fallbackDungeon = useMemo(() => getDungeonForDay(day), [day])
  const fallbackClimate = useMemo(() => getClimateForDay(day), [day])

  const [activeDungeon, setActiveDungeon] = useState<DungeonInfo>(
    dungeon || state?.current_dungeon || fallbackDungeon
  )
  const [activeClimate, setActiveClimate] = useState<DungeonClimateInfo>(
    climate || state?.current_dungeon?.climate || fallbackClimate
  )

  // Sincroniza ambiente se estado ou dia mudarem
  const [prevEnvKey, setPrevEnvKey] = useState<string>(`${state?.current_dungeon?.id ?? ''}_${day}`)
  const currentEnvKey = `${state?.current_dungeon?.id ?? ''}_${day}`
  if (currentEnvKey !== prevEnvKey) {
    setPrevEnvKey(currentEnvKey)
    if (dungeon) setActiveDungeon(dungeon)
    else if (state?.current_dungeon) setActiveDungeon(state.current_dungeon)
    else setActiveDungeon(getDungeonForDay(day))

    if (climate) setActiveClimate(climate)
    else if (state?.current_dungeon?.climate) setActiveClimate(state.current_dungeon.climate)
    else setActiveClimate(getClimateForDay(day))
  }

  // Itens equipados na tática da guilda
  const loadoutItems: InventoryItem[] = useMemo(() => {
    if (!state?.tactics?.loadout) return []
    const inv = state.inventory || []
    return Object.values(state.tactics.loadout)
      .map(val => {
        if (!val) return null
        if (typeof val === 'string') return inv.find(i => i.item_instance_id === val) || null
        return val as InventoryItem
      })
      .filter((i): i is InventoryItem => Boolean(i))
  }, [state?.tactics?.loadout, state?.inventory])

  // Checagem de Mitigação de Terreno (Bioma)
  const isTerrainMitigated = useMemo(() => {
    if (!activeDungeon.mitigation_required) return true
    return loadoutItems.some(i => i.terrain_mitigation === activeDungeon.mitigation_required)
  }, [activeDungeon.mitigation_required, loadoutItems])

  // Checagem de Mitigação de Clima Semanal
  const isClimateMitigated = useMemo(() => {
    if (!activeClimate.mitigation_required) return true
    return loadoutItems.some(i => i.terrain_mitigation === activeClimate.mitigation_required)
  }, [activeClimate.mitigation_required, loadoutItems])

  // Cálculo consolidado de penalidades
  const terrainPenaltyPct = isTerrainMitigated ? 0 : (activeDungeon.power_penalty_pct ?? 0.12)
  const climatePenaltyPct = isClimateMitigated ? 0 : activeClimate.power_penalty_pct
  const totalPowerPenaltyPct = Math.round((terrainPenaltyPct + climatePenaltyPct) * 100)

  const terrainExtraEnergy = isTerrainMitigated ? 0 : activeDungeon.energy_cost_extra
  const climateExtraEnergy = isClimateMitigated ? 0 : activeClimate.energy_cost_extra
  const totalExtraEnergyCost = terrainExtraEnergy + climateExtraEnergy

  // Animação sala a sala através dos room_events
  useEffect(() => {
    if (!running || roomEvents.length === 0) return

    const timer = setTimeout(() => {
      if (currentRoomIndex >= roomEvents.length - 1) {
        setDone(true)
        setRunning(false)
        return
      }

      const nextIndex = currentRoomIndex + 1
      const evt = roomEvents[nextIndex]
      setCurrentRoomIndex(nextIndex)

      // Atualiza barras de suprimentos
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
      } else if (evtText.includes('sem ocorrências') || evtText.includes('sem confronto')) {
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
          if (matchData.climate) {
            setActiveClimate(matchData.climate)
          }
          if (res.result.dungeon) {
            setActiveDungeon(res.result.dungeon)
          }

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

    // Fallback local: simula masmorra com impacto das sobretaxas ambientais
    const totalRooms = 6 + Math.floor(Math.random() * 4) // 6 a 9 salas
    const localEvents: DungeonRoomEvent[] = []
    let pE = 100
    let rE = 100

    for (let r = 1; r <= totalRooms; r++) {
      const isBoss = r === totalRooms
      const playerDrain = 10 + Math.floor(Math.random() * 8) + totalExtraEnergyCost
      const rivalDrain = 12 + Math.floor(Math.random() * 8)

      pE = Math.max(0, pE - playerDrain)
      rE = Math.max(0, rE - rivalDrain)

      let eventMsg = 'Câmara com trânsito estável e sem ocorrências hostis.'
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
  const biomeVisual = getBiomeVisual(activeDungeon.terrain)
  const climateVisual = getClimateVisual(activeClimate.climate)
  const BiomeIcon = biomeVisual.icon
  const ClimateIcon = climateVisual.icon

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase IV</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Simulação da Expedição Oficial</span>
            <span className="text-stone-600">·</span>
            <span className="text-amber-300 font-mono text-xs bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded font-bold">
              Semana #{day}
            </span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Incursão em Masmorra Modular
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Progressão expedicionária sob matriz desacoplada de Bioma Base e Condição Climática Semanal.
          </p>
        </div>

        <div className="text-right">
          <span className="text-stone-400 text-xs">Adversário da Rodada: </span>
          <strong className="text-amber-300 text-xs font-mono font-bold">vs {rivalGuildName}</strong>
        </div>
      </div>

      {/* Banner Ilustrado do Bioma da Masmorra */}
      <BiomeBanner
        terrain={currentDungeon?.terrain || BIOME_BY_DAY[day % 5]?.terrain}
        name={currentDungeon?.name || BIOME_BY_DAY[day % 5]?.name}
        height={95}
      />

      {/* ─────────────────────────────────────────────
          QUADRO DE AMBIENTAÇÃO MODULAR (BIOMA × CLIMA)
         ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Bioma Base da Masmorra */}
        <div className={`p-4 rounded-xl border ${biomeVisual.border} ${biomeVisual.cardBg} space-y-3 shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${biomeVisual.iconBg}`}>
                <BiomeIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold block">
                  Bioma Base Homologado
                </span>
                <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
                  <span>{activeDungeon.name}</span>
                </h3>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${biomeVisual.badgeBg}`}>
              {activeDungeon.terrain_label}
            </span>
          </div>

          <p className="text-stone-300 text-xs leading-relaxed">
            {activeDungeon.description}
          </p>

          {/* Status de Mitigação de Terreno */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-mono text-[11px]">Mitigação da Guilda:</span>
              {isTerrainMitigated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protegido</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/70 border border-rose-700/60 px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Penalidade Ativa</span>
                </span>
              )}
            </div>

            <div className="text-[11px] font-mono">
              {!isTerrainMitigated ? (
                <span className="text-rose-300 font-bold">
                  -{Math.round((activeDungeon.power_penalty_pct ?? 0.12) * 100)}% Poder · +{activeDungeon.energy_cost_extra} Dreno
                </span>
              ) : (
                <span className="text-stone-400">
                  {activeDungeon.mitigation_required ? 'Proteção Homologada' : 'Terreno Neutro'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Condição Climática Semanal */}
        <div className={`p-4 rounded-xl border ${climateVisual.border} ${climateVisual.cardBg} space-y-3 shadow-lg relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${climateVisual.iconBg}`}>
                <ClimateIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                  Condição Climática da Rodada
                </span>
                <h3 className="text-sm font-black text-stone-100 flex items-center gap-2">
                  <span>{activeClimate.name}</span>
                </h3>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${climateVisual.badgeBg}`}>
              Semana #{day}
            </span>
          </div>

          <p className="text-stone-300 text-xs leading-relaxed">
            {activeClimate.description}
          </p>

          {/* Status de Mitigação Climática */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-mono text-[11px]">Mitigação da Guilda:</span>
              {isClimateMitigated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{activeClimate.climate === 'clear_sky' ? 'Atmosfera Estável' : 'Protegido'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sobrecarga Climática</span>
                </span>
              )}
            </div>

            <div className="text-[11px] font-mono">
              {!isClimateMitigated ? (
                <span className="text-amber-300 font-bold">
                  -{Math.round(activeClimate.power_penalty_pct * 100)}% Poder · +{activeClimate.energy_cost_extra} Dreno
                </span>
              ) : (
                <span className="text-stone-400">
                  {activeClimate.mitigation_required ? 'Proteção Ativa' : 'Sem Penalidade'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Integrado de Impacto Operacional */}
      {totalPowerPenaltyPct > 0 || totalExtraEnergyCost > 0 ? (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 flex items-center justify-between text-xs flex-wrap gap-2 text-rose-200 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Penalidades Ambientais Acumuladas:</strong> A equipe opera com déficit estrutural de{' '}
              <strong className="text-rose-300">-{totalPowerPenaltyPct}% Poder Efetivo</strong> e sobretaxa de{' '}
              <strong className="text-rose-300">+{totalExtraEnergyCost} Suprimentos/câmara</strong> devido a intempéries não mitigadas.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 flex items-center justify-between text-xs flex-wrap gap-2 text-emerald-200 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Conformidade Ambiental Plena:</strong> A equipe está 100% protegida contra o terreno e o clima desta rodada. Nenhuma penalidade aplicada.
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MOLDURA DE PLACAR ESTILO MADEIRA E LATÃO
         ───────────────────────────────────────────── */}
      <div className="bg-[#1c1917] border-2 border-amber-900/50 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Barras Horizontais Animadas de Energia/Suprimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-stone-800/80 pb-5">
          {/* Barra do Jogador */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-200">Guilda do Jogador</span>
                {totalExtraEnergyCost > 0 && (
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/70 border border-rose-800/60 px-1.5 py-0.2 rounded">
                    +{totalExtraEnergyCost} dreno
                  </span>
                )}
              </div>
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
                    : currentEvent.event.includes('sem ocorrências') || currentEvent.event.includes('sem confronto')
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
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 font-mono text-xs text-stone-300 h-72 overflow-y-auto space-y-2 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-stone-500 border-b border-stone-800/80 pb-2 mb-2 font-mono flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-stone-400 font-bold">
            <Scroll className="w-3.5 h-3.5 text-amber-500" />
            <span>// TRANSMISSÃO TELEMÉTRICA DA MASMORRA</span>
          </span>
          <span className="text-[10px] text-stone-400">
            {activeDungeon.name} · {activeClimate.name} · SEMANA #{day}
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="text-stone-600 italic py-12 text-center">
            Aguardando ordem de avanço operacional para recepção dos sinais de campanha...
          </p>
        ) : (
          logs.map((logItem, idx) => {
            if (logItem.type === 'boss') {
              const isJoint = logItem.text.includes('Abate Conjunto')
              const isPlayer = logItem.text.includes('Guilda do Jogador')
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-stone-900/60 p-3 rounded-xl border-l-4 border-amber-400 shadow-md ring-1 ring-amber-500/20 space-y-1"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-amber-400" />
                      <span>[CÂMARA {logItem.room} — CLÍMAX: BOSS FINAL]</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-900/70 border border-amber-500/70 text-amber-200">
                      {isJoint ? '+1 PE CONJUNTO' : isPlayer ? '+2 PE JOGADOR' : '+2 PE RIVAL'}
                    </span>
                  </div>
                  <p className="text-amber-100 text-xs font-semibold leading-relaxed">
                    {logItem.text}
                  </p>
                </div>
              )
            }
            if (logItem.type === 'miniboss') {
              const isPlayer = logItem.text.includes('Guilda do Jogador')
              const hasClassSkill = logItem.text.includes('Parede de Escudos') || logItem.text.includes('Execução Fria')
              return (
                <div
                  key={idx}
                  className="bg-stone-900/80 p-2.5 rounded-xl border-l-4 border-cyan-500 shadow-sm space-y-1"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡ [CÂMARA {logItem.room} — MINI-BOSS / EMBOSCADA]</span>
                      {hasClassSkill && (
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                          HABILIDADE DE CLASSE
                        </span>
                      )}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                      isPlayer ? 'bg-cyan-950 text-cyan-300 border-cyan-700/60' : 'bg-stone-800 text-stone-300 border-stone-700'
                    }`}>
                      +1 PE
                    </span>
                  </div>
                  <p className="text-stone-200 text-xs leading-relaxed">
                    {logItem.text}
                  </p>
                </div>
              )
            }
            if (logItem.type === 'empty') {
              return (
                <div
                  key={idx}
                  className="text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-lg border-l-2 border-stone-700/60 flex items-center justify-between text-[11px]"
                >
                  <span>
                    <strong className="text-stone-500 font-mono">[Câmara {logItem.room}]</strong> {logItem.text}
                  </span>
                  <span className="text-[10px] text-stone-600 font-mono uppercase">Trânsito Livre</span>
                </div>
              )
            }
            return (
              <div key={idx} className="text-stone-400 bg-stone-950/40 px-3 py-1 rounded-lg border-l-2 border-stone-800 text-[11px]">
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
              <span>Boletim de Resultados da Rodada — Semana #{day}</span>
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
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Swords className="w-4 h-4" />
          <span>Iniciar Expedição & Simulação da Rodada</span>
        </button>
      )}

      {running && (
        <div className="w-full py-3.5 bg-stone-900 border border-stone-800 text-amber-400 font-mono text-xs rounded-xl text-center animate-pulse">
          // Expedição e confrontos da liga em andamento pelas câmaras da masmorra...
        </div>
      )}

      {done && (
        <button
          onClick={onAdvance}
          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Consolidar Resultados & Ir para Balanço Financeiro</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
