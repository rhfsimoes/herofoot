import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react'
import type { GameState, Hero, InventoryItem, DungeonInfo } from '../mockData'
import { RARITY_CARD_STYLES, RARITY_BADGE_STYLES, GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface Phase3TacticsProps {
  state: GameState
  onAdvance: () => void
  onSaveTactics?: (starters: string[], loadout: Record<string, any>) => Promise<any>
}

const SLOTS = ['Arma', 'Armadura', 'Joia', 'Inscrição', 'Consumível'] as const
type Slot = typeof SLOTS[number]

export default function Phase3Tactics({ state, onAdvance, onSaveTactics }: Phase3TacticsProps) {
  const initialStarters = state.tactics?.starters?.length
    ? state.team.filter(h => state.tactics!.starters.includes(h.id))
    : state.team.filter(h => h.status === 'Apto').slice(0, 5)

  const [starters, setStarters] = useState<Hero[]>(initialStarters)
  const [loadout, setLoadout] = useState<Partial<Record<Slot, InventoryItem>>>(
    (state.tactics?.loadout as Partial<Record<Slot, InventoryItem>>) || {}
  )
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const availableHeroes = state.team.filter(h => !starters.find(s => s.id === h.id))

  function toggleStarter(hero: Hero) {
    if (starters.find(s => s.id === hero.id)) {
      setStarters(prev => prev.filter(s => s.id !== hero.id))
    } else if (starters.length < 6) {
      setStarters(prev => [...prev, hero])
    }
  }

  function equipItem(item: InventoryItem) {
    if (!selectedSlot) return
    setLoadout(prev => ({ ...prev, [selectedSlot]: item }))
    setSelectedSlot(null)
  }

  function unequipItem(slot: Slot) {
    setLoadout(prev => ({ ...prev, [slot]: undefined }))
  }

  // Verifica mitigação do terreno
  const requiredMitigation = dungeon.mitigation_required
  const hasMitigation = requiredMitigation
    ? Object.values(loadout).some(item => item?.terrain_mitigation === requiredMitigation)
    : true

  // Verificação de Sinergia Total (Overgeared Loadout): Todos os 5 slots com Ótimo ou Lendário!
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
    if (onSaveTactics) {
      try {
        await onSaveTactics(
          starters.map(h => h.id),
          loadout
        )
      } catch (err) {
        console.warn('Erro ao salvar tática:', err)
      }
    }
    setIsSaving(false)
    onAdvance()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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
                Todos os 5 Slots preenchidos com equipamentos de alta qualidade. (+15% de Eficiência em Suprimentos na Dungeon)
              </p>
            </div>
          </div>
          <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md shadow-amber-500/30">
            OVERGEARED
          </span>
        </div>
      )}

      {/* Card: Condição do Campo / Masmorra da Rodada */}
      <div className="bg-[#1c1917] border border-amber-950/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
            <span className="text-xl">🏟</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400">Condições Ambientais / Terreno</span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-300 font-bold text-xs">{dungeon.name}</span>
            </div>
            <p className="text-stone-300 text-xs mt-0.5">{dungeon.terrain_label} — {dungeon.description}</p>
          </div>
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
            const isConsumable = slot === 'Consumível'

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
                  <span className="text-xs uppercase font-mono font-bold tracking-wider mb-1">
                    Slot {slot}
                  </span>
                  <span className="text-[11px] text-stone-500">+ Equipar Ativo</span>
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
                    <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold">
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

      {/* Titulares e Reservas */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Titulares Escalados */}
        <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-stone-800 pb-2">
            <h3 className="text-amber-200 text-xs font-bold uppercase tracking-wider">
              Party (6) ({starters.length}/6)
            </h3>
            <span className="text-stone-400 text-xs">
              Poder dos Membros: <strong className="text-amber-300 font-mono">{teamBasePower}</strong>
            </span>
          </div>

          <div className="space-y-2">
            {starters.map(hero => (
              <div
                key={hero.id}
                className="bg-stone-900 border border-amber-950/50 rounded-lg p-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-stone-800 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {hero.name[0]}
                  </div>
                  <div>
                    <span className="text-stone-200 text-xs font-semibold block">{hero.name}</span>
                    <span className="text-stone-500 text-[10px]">{hero.class_name ?? hero.class ?? 'Combatente'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-mono text-xs font-bold">
                    Poder {hero.current_power ?? hero.power ?? 50}
                  </span>
                  <button
                    onClick={() => toggleStarter(hero)}
                    className="text-stone-500 hover:text-rose-400 text-xs font-bold px-2 py-0.5"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservas Disponíveis */}
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-stone-800 pb-2">
            <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider">
              Reserva (3)
            </h3>
            <span className="text-stone-500 text-xs">{availableHeroes.length} aguardando convocação</span>
          </div>

          <div className="space-y-2">
            {availableHeroes.length === 0 ? (
              <p className="text-stone-500 text-xs italic py-4 text-center">Nenhum reserva no alojamento.</p>
            ) : (
              availableHeroes.map(hero => {
                const isInjured = hero.status === 'Afastado'
                return (
                  <div
                    key={hero.id}
                    onClick={() => !isInjured && toggleStarter(hero)}
                    className={`bg-stone-900/60 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between gap-3 transition ${
                      isInjured ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-stone-800 text-stone-400 font-bold flex items-center justify-center text-xs">
                        {hero.name[0]}
                      </div>
                      <div>
                        <span className="text-stone-300 text-xs font-medium block">{hero.name}</span>
                        <span className="text-stone-500 text-[10px]">
                          {hero.class_name ?? hero.class ?? 'Combatente'} · {hero.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-mono text-xs">
                        Poder {hero.current_power ?? hero.power ?? 50}
                      </span>
                      {starters.length < 6 && !isInjured && (
                        <span className="text-amber-500 text-xs font-bold">+ Escalar</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Resumo Consolidado de Poder Efetivo */}
      <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-xs text-stone-300">
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <span>Titulares: <strong className="text-amber-100">{teamBasePower}</strong></span>
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
          {isSaving ? 'Protocolando...' : 'Assinar Memorando & Iniciar Expedição →'}
        </button>
      </div>
    </div>
  )
}
