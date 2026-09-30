import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Briefcase,
  Shield,
  Award,
  FileSignature,
  Package,
} from 'lucide-react'
import type { GameState, Hero, InventoryItem, DungeonInfo } from '../mockData'
import { RARITY_CARD_STYLES, RARITY_BADGE_STYLES, GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'
import { BiomeBanner } from '../components/art'
import OnboardingBanner from '../components/OnboardingBanner'
import EmptyState from '../components/EmptyState'
import Tooltip from '../components/Tooltip'

interface Phase3TacticsProps {
  state: GameState
  onAdvance: () => void
  onSaveTactics?: (starters: string[], loadout: Record<string, string | null>, reserves?: string[]) => Promise<any>
}

const SLOTS = ['Arsenal Ofensivo','Blindagem Operacional','Ativo de Performance','Alvará de Risco','Provisão Logística'] as const
type Slot = typeof SLOTS[number]

const SLOT_ICONS: Record<Slot, typeof Briefcase> = {
  'Arsenal Ofensivo': Briefcase,
  'Blindagem Operacional': Shield,
  'Ativo de Performance': Award,
  'Alvará de Risco': FileSignature,
  'Provisão Logística': Package,
}

export default function Phase3Tactics({ state, onAdvance, onSaveTactics }: Phase3TacticsProps) {
  // Inicialização segura de Titulares (até 6)
  const initialStarters = state.tactics?.starters?.length
    ? state.team.filter(h => state.tactics!.starters.includes(h.id))
    : state.team.filter(h => h.status === 'Apto' && !h.injured).slice(0, 6)

  // Inicialização segura de Reservas (até 3)
  const starterIds = new Set(initialStarters.map(h => h.id))
  const initialReserves = state.tactics?.reserves?.length
    ? state.team.filter(h => state.tactics!.reserves!.includes(h.id) && !starterIds.has(h.id))
    : state.team.filter(h => h.status === 'Apto' && !h.injured && !starterIds.has(h.id)).slice(0, 3)

  const [starters, setStarters] = useState<Hero[]>(initialStarters)
  const [reserves, setReserves] = useState<Hero[]>(initialReserves)

  // Resolução do loadout garantindo mapeamento de objetos para itens do inventário
  const initialLoadout: Partial<Record<Slot, InventoryItem>> = {}
  if (state.tactics?.loadout) {
    SLOTS.forEach(slot => {
      const val = state.tactics!.loadout[slot]
      if (val) {
        if (typeof val === 'object' && 'item_instance_id' in val) {
          initialLoadout[slot] = val as InventoryItem
        } else if (typeof val === 'string') {
          const found = state.inventory.find(i => i.item_instance_id === val)
          if (found) initialLoadout[slot] = found
        }
      }
    })
  }

  const [loadout, setLoadout] = useState<Partial<Record<Slot, InventoryItem>>>(initialLoadout)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const dungeon: DungeonInfo = state.current_dungeon || {
    id: 'dungeon_01',
    name: 'Vale dos Ecos Verdejantes',
    terrain: 'neutral',
    terrain_label: 'Campo Aberto Verdejante',
    description: 'Terreno padrão da Liga, sem penalidades ambientais. Trilha seca em campo aberto verdejante.',
    power_penalty_pct: 0,
    power_penalty: 0,
    energy_cost_extra: 0,
    mitigation_required: null,
    mitigation_label: 'Nenhuma mitigação necessária',
    recommended_power: 55,
  }

  const starterSet = new Set(starters.map(s => s.id))
  const reserveSet = new Set(reserves.map(r => r.id))
  const availableHeroes = state.team.filter(h => !starterSet.has(h.id) && !reserveSet.has(h.id))

  function addStarter(hero: Hero) {
    if (hero.injured || hero.status === 'Afastado') return
    if (starters.length >= 6) return
    setReserves(prev => prev.filter(r => r.id !== hero.id))
    setStarters(prev => [...prev, hero])
    setServerError(null)
  }

  function removeStarter(hero: Hero) {
    setStarters(prev => prev.filter(s => s.id !== hero.id))
    setServerError(null)
  }

  function addReserve(hero: Hero) {
    if (hero.injured || hero.status === 'Afastado') return
    if (reserves.length >= 3) return
    setStarters(prev => prev.filter(s => s.id !== hero.id))
    setReserves(prev => [...prev, hero])
    setServerError(null)
  }

  function removeReserve(hero: Hero) {
    setReserves(prev => prev.filter(r => r.id !== hero.id))
    setServerError(null)
  }

  function equipItem(item: InventoryItem) {
    if (!selectedSlot) return
    setLoadout(prev => ({ ...prev, [selectedSlot]: item }))
    setSelectedSlot(null)
    setServerError(null)
  }

  function unequipItem(slot: Slot) {
    setLoadout(prev => ({ ...prev, [slot]: undefined }))
    setServerError(null)
  }

  // Verifica mitigação do terreno
  const requiredMitigation = dungeon.mitigation_required
  const hasMitigation = requiredMitigation
    ? Object.values(loadout).some(item => item?.terrain_mitigation === requiredMitigation)
    : true

  // Verificação de Sinergia Total (Overgeared Loadout)
  const allFiveFilled = SLOTS.every(s => loadout[s] !== undefined && loadout[s] !== null)
  const isOvergearedElite =
    allFiveFilled &&
    SLOTS.every(s => {
      const item = loadout[s]
      return item?.quality === 'Ótimo' || item?.quality === 'Lendário'
    })

  // Cálculos de poder
  const teamBasePower = starters.reduce((sum, h) => sum + (h.current_power ?? h.power ?? 50), 0)
  const loadoutBonus = Object.values(loadout).reduce((sum, item) => sum + (item?.power_bonus ?? 0), 0)
  const activeTerrainPenalty = requiredMitigation && !hasMitigation ? (dungeon.power_penalty ?? 0) : 0
  const effectivePower = Math.max(10, teamBasePower + loadoutBonus - activeTerrainPenalty)

  // Salvar tática
  async function handleConfirm() {
    setIsSaving(true)
    setServerError(null)

    // Enviar apenas os IDs dos itens nos slots
    const payloadLoadout: Record<string, string | null> = {}
    for (const slot of SLOTS) {
      payloadLoadout[slot] = loadout[slot]?.item_instance_id ?? null
    }

    if (onSaveTactics) {
      try {
        const res = await onSaveTactics(
          starters.map(h => h.id),
          payloadLoadout,
          reserves.map(h => h.id)
        )
        if (res && res.result && res.result.success === false) {
          setServerError(res.result.message || 'Escalação rejeitada pela autoridade tática da Liga.')
          setIsSaving(false)
          return
        }
      } catch (err) {
        console.warn('Erro ao salvar tática:', err)
        setServerError('Falha de comunicação com o servidor da guilda ao homologar tática.')
        setIsSaving(false)
        return
      }
    }
    setIsSaving(false)
    onAdvance()
  }


  return (
    <div className="max-w-6xl mx-auto">
      {/* Banner de Onboarding — aparece apenas na primeira visita à Fase 3 */}
      <OnboardingBanner phase={3} />
      <div className="p-6 space-y-6">
      {/* Topo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase III</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Preparação Tática</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Escalação de Titulares & Os 5 Slots de Equipamento
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Defina o esquadrão operacional e equipe os EPIs obrigatórios para o terreno da rodada.
          </p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isSaving || starters.length === 0}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center gap-2 disabled:opacity-40"
        >
          <span>{isSaving ? 'Protocolando...' : 'Autorizar Despacho da Expedição'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          BANNER DE SINERGIA TOTAL (OVERGEARED LOADOUT)
         ───────────────────────────────────────────── */}
      {isOvergearedElite && (
        <div className="bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 border border-amber-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-amber-950/40 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⚡</span>
            <div>
              <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                Sinergia de Elite Ativa
              </h4>
              <p className="text-xs text-stone-300">
                Todos os 5 Slots preenchidos com equipamentos de alta qualidade. (+15% de Eficiência em <Tooltip term="Suprimentos">Suprimentos</Tooltip> na Dungeon)
              </p>
            </div>
          </div>
          <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md shadow-amber-500/30">
            OVERGEARED
          </span>
        </div>
      )}

      {/* Card: Condição do Campo / Masmorra da Rodada com Banner Ilustrado */}
      <div className="bg-[#1c1917] border border-amber-950/50 rounded-xl overflow-hidden shadow-lg">
        <BiomeBanner
          terrain={dungeon.terrain}
          name={dungeon.name}
          compact={true}
          height={65}
          showBadge={false}
        />
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">Condições Ambientais / Terreno</span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-300 font-bold text-xs">{dungeon.name}</span>
            </div>
            <p className="text-stone-300 text-xs mt-0.5">{dungeon.terrain_label} — {dungeon.description}</p>
          </div>

        <div>
          {requiredMitigation ? (
            hasMitigation ? (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 shadow">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Mitigação Ativa: Penalidade Anulada</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-700/60 text-xs font-bold flex items-center gap-1.5 shadow animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Penalidade Ativa: -{dungeon.power_penalty} Poder / +{dungeon.energy_cost_extra} Dreno</span>
              </span>
            )
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-300 border border-stone-700 text-xs font-medium">
              Condições Ideais (Sem Penalidades)
            </span>
          )}
        </div>
      </div>
    </div>

      {/* ─────────────────────────────────────────────
          OS 5 SLOTS DO GROUP LOADOUT (CAIXAS MEDIEVAIS)
         ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Os 5 Slots da Expedição (Loadout do Grupo)</span>
          </h3>
          <span className="text-stone-400 text-xs">
            Bônus Total:{' '}
            <strong className="text-emerald-400 font-mono">+{loadoutBonus} Poder</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SLOTS.map(slot => {
            const equipped = loadout[slot]
            const isSelecting = selectedSlot === slot
            const isConsumable = slot === 'Provisão Logística'
            const SlotIcon = SLOT_ICONS[slot]

            if (!equipped) {
              return (
                <div
                  key={slot}
                  onClick={() => setSelectedSlot(isSelecting ? null : slot)}
                  className={`bg-stone-950/60 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[140px] ${
                    isSelecting
                      ? 'border-amber-400 text-amber-300 bg-stone-900/60 ring-1 ring-amber-400/40'
                      : 'border-stone-800 text-stone-600 hover:border-stone-700 hover:text-stone-400'
                  }`}
                >
                  <SlotIcon className="w-5 h-5 mb-1.5 opacity-60" />
                  <span className="text-[11px] uppercase font-mono font-bold tracking-wider mb-1">
                    {slot}
                  </span>
                  <span className="text-[10px] text-stone-500">+ Homologar Ativo</span>
                </div>
              )
            }

            return (
              <div
                key={slot}
                onClick={() => setSelectedSlot(isSelecting ? null : slot)}
                className={`rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition shadow-lg relative min-h-[140px] ${
                  RARITY_CARD_STYLES[equipped.quality]
                } ${isSelecting ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold flex items-center gap-1.5">
                      <SlotIcon className="w-3.5 h-3.5 text-amber-400/80" />
                      {slot}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        unequipItem(slot)
                      }}
                      className="text-stone-500 hover:text-rose-400 text-xs px-1"
                      title="Desequipar"
                    >
                      ✕
                    </button>
                  </div>
                  <h4 className="font-bold text-xs text-stone-100 line-clamp-2 leading-tight">
                    {equipped.name}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px]">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${RARITY_BADGE_STYLES[equipped.quality]}`}>
                    {equipped.quality}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    +{equipped.power_bonus}
                  </span>
                </div>

                {isConsumable && (
                  <div className="text-[10px] text-cyan-300 font-mono mt-1">
                    [{equipped.charges ?? 3}/3 Cargas]
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Modal / Gaveta de Seleção de Item com STAT DIFF */}
        {selectedSlot && (
          <div className="bg-[#1c1917] border border-amber-600/60 rounded-xl p-4 space-y-3 shadow-2xl animate-in fade-in duration-150">
            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Selecione um Ativo para o Slot: <strong className="text-amber-100">{selectedSlot}</strong>
              </span>
              <button
                onClick={() => {
                  setSelectedSlot(null)
                }}
                className="text-stone-500 hover:text-stone-300 text-xs font-mono"
              >
                ✕ Fechar
              </button>
            </div>

            {state.inventory.filter(i => i.slot_type === selectedSlot).length === 0 ? (
              <p className="text-stone-500 text-xs italic py-3 text-center">
                Almoxarifado não possui itens do tipo "{selectedSlot}". Forje na oficina ou adquira no mercado.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {state.inventory
                  .filter(i => i.slot_type === selectedSlot)
                  .map(item => {
                    const currentEquipped = loadout[selectedSlot]
                    const currentPower = currentEquipped?.power_bonus ?? 0
                    const powerDiff = item.power_bonus - currentPower

                    return (
                      <div
                        key={item.item_instance_id}
                        onClick={() => equipItem(item)}
                        className={`rounded-xl p-3 border cursor-pointer transition shadow-md flex flex-col justify-between ${
                          RARITY_CARD_STYLES[item.quality]
                        } hover:scale-[1.02]`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${RARITY_BADGE_STYLES[item.quality]}`}>
                              {item.quality}
                            </span>

                            {/* BADGE DE STAT DIFF OVERGEARED */}
                            {powerDiff > 0 ? (
                              <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                <span>+{powerDiff} Poder</span>
                              </span>
                            ) : powerDiff < 0 ? (
                              <span className="bg-rose-950/90 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                                <TrendingDown className="w-3 h-3" />
                                <span>{powerDiff} Poder</span>
                              </span>
                            ) : (
                              <span className="text-stone-500 text-[10px] font-mono">= 0</span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-stone-100">{item.name}</h4>
                        </div>

                        <div className="mt-3 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-400">
                          <span>Poder Bruto: +{item.power_bonus}</span>
                          {item.terrain_mitigation && (
                            <span className="text-cyan-400 font-semibold">🛡 Mitiga</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alerta de Erro Corporativo do Servidor */}
      {serverError && (
        <div className="bg-rose-950/90 border border-rose-600/80 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-200 shadow-xl animate-in fade-in duration-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold text-sm text-rose-100 uppercase tracking-wide">
              Parecer Negativo do Departamento de Auditoria Tática
            </strong>
            <p className="text-rose-200 font-mono">{serverError}</p>
          </div>
        </div>
      )}

      {/* Grid com 3 Colunas: Titulares (Party 6), Reservas (3) e Quadro de Pessoal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUNA 1: Titulares (Party 6) */}
        <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
                  Party Operacional ({starters.length}/6)
                </h3>
              </div>
              <span className="text-stone-400 text-xs font-mono">
                Poder: <strong className="text-amber-300">{teamBasePower}</strong>
              </span>
            </div>

            <div className="space-y-2">
              {starters.length === 0 ? (
                <EmptyState variant="no-heroes-assigned" className="my-2" />
              ) : (
                starters.map(hero => (
                  <div
                    key={hero.id}
                    className="bg-stone-900 border border-amber-950/60 hover:border-amber-700/60 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-sm transition"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-700/50 font-black flex items-center justify-center text-xs shrink-0">
                        {hero.name[0]}
                      </div>
                      <div className="truncate">
                        <span className="text-stone-100 text-xs font-bold block truncate">{hero.name}</span>
                        <span className="text-stone-400 text-[10px] block truncate">
                          {hero.specialization_name ?? hero.class_name ?? hero.class ?? 'Combatente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-amber-400 font-mono text-xs font-bold">
                        P.{hero.current_power ?? hero.power ?? 50}
                      </span>
                      <button
                        onClick={() => removeStarter(hero)}
                        className="text-stone-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                        title="Remover da Party"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/60 text-[10px] text-stone-500 flex justify-between">
            <span>Capacidade máxima regulamentar</span>
            <span className="font-mono font-bold text-amber-400">{starters.length} de 6 vagas</span>
          </div>
        </div>

        {/* COLUNA 2: Reserva Estratégica (3) */}
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <h3 className="text-stone-300 text-xs font-black uppercase tracking-wider">
                  Reserva de Apoio ({reserves.length}/3)
                </h3>
              </div>
              <span className="text-stone-500 text-xs font-mono">
                {reserves.length}/3 alocados
              </span>
            </div>

            <div className="space-y-2">
              {reserves.length === 0 ? (
                <p className="text-stone-500 text-xs italic py-6 text-center">
                  Nenhum combatente em reserva de contingência.
                </p>
              ) : (
                reserves.map(hero => (
                  <div
                    key={hero.id}
                    className="bg-stone-900 border border-stone-800 hover:border-cyan-800/60 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-sm transition"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-lg bg-stone-800 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {hero.name[0]}
                      </div>
                      <div className="truncate">
                        <span className="text-stone-200 text-xs font-semibold block truncate">{hero.name}</span>
                        <span className="text-stone-500 text-[10px] block truncate">
                          {hero.specialization_name ?? hero.class_name ?? hero.class ?? 'Combatente'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-cyan-400 font-mono text-xs font-bold">
                        P.{hero.current_power ?? hero.power ?? 50}
                      </span>
                      {starters.length < 6 && (
                        <button
                          onClick={() => addStarter(hero)}
                          className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold hover:bg-amber-900 transition"
                          title="Promover a Titular"
                        >
                          Party
                        </button>
                      )}
                      <button
                        onClick={() => removeReserve(hero)}
                        className="text-stone-500 hover:text-rose-400 text-xs px-1.5 py-0.5 rounded hover:bg-stone-800 transition"
                        title="Liberar para o Alojamento"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/60 text-[10px] text-stone-500 flex justify-between">
            <span>Regulamento da Liga</span>
            <span className="font-mono font-bold text-cyan-400">{reserves.length} de 3 reservas</span>
          </div>
        </div>

        {/* COLUNA 3: Quadro de Pessoal do Alojamento / Bloqueio de Feridos */}
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-3">
              <h3 className="text-stone-400 text-xs font-black uppercase tracking-wider">
                Quartel & Alojamento
              </h3>
              <span className="text-stone-500 text-xs">
                {availableHeroes.length} no alojamento
              </span>
            </div>

            <div className="space-y-2">
              {availableHeroes.length === 0 ? (
                <p className="text-stone-500 text-xs italic py-6 text-center">
                  Todos os colaboradores da guilda foram designados.
                </p>
              ) : (
                availableHeroes.map(hero => {
                  const isInjured = Boolean(hero.injured || hero.status === 'Afastado')

                  if (isInjured) {
                    return (
                      <div
                        key={hero.id}
                        className="bg-stone-950/80 border border-rose-900/50 rounded-lg p-2.5 flex items-center justify-between gap-3 opacity-60 cursor-not-allowed"
                        title={`Colaborador em licença médica compulsória: ${hero.injury_weeks_left ?? 1} semana(s) restante(s).`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-7 h-7 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/50 font-bold flex items-center justify-center text-xs shrink-0">
                            ✕
                          </div>
                          <div className="truncate">
                            <span className="text-stone-300 text-xs font-medium block truncate line-through">
                              {hero.name}
                            </span>
                            <span className="text-rose-400 text-[10px] font-bold block truncate">
                              Afastado por Lesão ({hero.injury_weeks_left ?? 1} sem.)
                            </span>
                          </div>
                        </div>

                        <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          Bloqueado
                        </span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={hero.id}
                      className="bg-stone-900/80 border border-stone-800 hover:border-stone-700 rounded-lg p-2.5 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {hero.name[0]}
                        </div>
                        <div className="truncate">
                          <span className="text-stone-200 text-xs font-medium block truncate">{hero.name}</span>
                          <span className="text-stone-500 text-[10px] block truncate">
                            {hero.specialization_name ?? hero.class_name ?? hero.class ?? 'Combatente'} · P.{hero.current_power ?? hero.power ?? 50}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {starters.length < 6 && (
                          <button
                            onClick={() => addStarter(hero)}
                            className="text-[10px] bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-2 py-1 rounded transition"
                            title="Escalar na Party Titular"
                          >
                            + Party
                          </button>
                        )}
                        {reserves.length < 3 && (
                          <button
                            onClick={() => addReserve(hero)}
                            className="text-[10px] bg-stone-800 hover:bg-cyan-950 text-stone-300 hover:text-cyan-300 border border-stone-700 hover:border-cyan-800 px-2 py-1 rounded font-bold transition"
                            title="Alocar na Reserva de Apoio"
                          >
                            + Reserva
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/60 text-[10px] text-stone-500 flex justify-between">
            <span>Total da guilda: {state.team.length}</span>
            <span>Afastados são impedidos por portaria médica</span>
          </div>
        </div>
      </div>

      {/* Resumo Consolidado de Poder Efetivo & Botão de Confirmação */}
      <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-xs text-stone-300">
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <span>Titulares ({starters.length}/6): <strong className="text-amber-100">{teamBasePower}</strong></span>
            <span className="text-stone-600">+</span>
            <span>Bônus Loadout: <strong className="text-emerald-400">+{loadoutBonus}</strong></span>
            <span className="text-stone-600">-</span>
            <span>
              Penalidade Terreno:{' '}
              <strong className={activeTerrainPenalty > 0 ? 'text-rose-400' : 'text-stone-400'}>
                -{activeTerrainPenalty}
              </strong>
            </span>
            <span className="text-stone-600">=</span>
            <span className={`${GOLD_GRADIENT_TEXT} text-base`}>
              Poder Efetivo: {effectivePower}
            </span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isSaving || starters.length === 0}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition disabled:opacity-40 shrink-0"
        >
          {isSaving ? 'Protocolando...' : 'Assinar Memorando & Despachar Expedição →'}
        </button>
      </div>
      </div>
    </div>
  )
}

