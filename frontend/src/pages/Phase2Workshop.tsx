import { useState, useEffect } from 'react'
import {
  Hammer,
  FlaskConical,
  Gem,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Layers,
  Coins,
  Newspaper,
  ArrowUpCircle,
  Lock,
  X,
} from 'lucide-react'
import {
  MOCK_RECIPES,
  MATERIAL_LABELS,
  type GameState,
  type InventoryItem,
  type ItemQuality,
  type WorkshopBranch,
  type Recipe,
  type MarketMaterial,
  type MarketReadyItem,
} from '../mockData'
import { RARITY_CARD_STYLES, RARITY_BADGE_STYLES } from '../utils/rarityStyles'

interface Phase2WorkshopProps {
  state: GameState
  onAdvance: () => void
  onCraft?: (recipeId: string) => Promise<any>
  onUpgradeWorkshop?: (branch: string) => Promise<any>
  onBuyMaterial?: (matId: string, qty: number) => Promise<any>
  onBuyItem?: (marketItemId: string) => Promise<any>
  onSellItem?: (instanceId: string, margin: string) => Promise<any>
  onResolveOffer?: (offerId: string, accept: boolean) => Promise<any>
}

type MainTab = 'oficina' | 'balcao'
type MarketSubTab = 'vender' | 'comprar_prontos' | 'comprar_insumos'

const BRANCHES: { name: WorkshopBranch; icon: any; key: string }[] = [
  { name: 'Ferragem', icon: Hammer, key: 'Ferragem' },
  { name: 'Alquimia', icon: FlaskConical, key: 'Alquimia' },
  { name: 'Joalheria', icon: Gem, key: 'Joalheria' },
  { name: 'Culinária', icon: UtensilsCrossed, key: 'Culinária' },
]

const TERRAIN_NAMES: Record<string, string> = {
  neutral: 'Campo Aberto Verdejante',
  toxic_swamp: 'Pântano Tóxico',
  glacier_frost: 'Geleira Eterna',
  unstable_mine: 'Mina Instável',
}

const UPGRADE_COSTS: Record<number, number> = {
  1: 500,
  2: 900,
  3: 1600,
  4: 2800,
  5: 5000,
}

function rollQuality(workshopLevel: number): ItemQuality {
  const roll = Math.random() * 100
  const tables: Record<number, number[]> = {
    1: [50, 90, 100, 100],
    2: [30, 80, 100, 100],
    3: [0, 50, 95, 100],
    4: [0, 30, 80, 100],
    5: [0, 10, 70, 100],
    6: [0, 0, 40, 100],
  }
  const t = tables[workshopLevel] ?? tables[1]
  if (roll < t[0]) return 'Fraco'
  if (roll < t[1]) return 'Normal'
  if (roll < t[2]) return 'Ótimo'
  return 'Lendário'
}

export default function Phase2Workshop({
  state,
  onAdvance,
  onCraft,
  onUpgradeWorkshop,
  onBuyMaterial,
  onBuyItem,
  onSellItem,
  onResolveOffer,
}: Phase2WorkshopProps) {
  const [mainTab, setMainTab] = useState<MainTab>('oficina')
  const [selectedBranch, setSelectedBranch] = useState<WorkshopBranch>('Ferragem')
  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>('vender')

  // Estados locais sincronizados
  const [inventory, setInventory] = useState<InventoryItem[]>(state.inventory)
  const [materials, setMaterials] = useState<Record<string, number>>(state.materials)
  const [gold, setGold] = useState<number>(state.gold)
  const [lastCraft, setLastCraft] = useState<InventoryItem | null>(null)

  // POP-UP DE REVELAÇÃO LENDÁRIA
  const [legendaryItem, setLegendaryItem] = useState<{
    name: string
    prefix: string
    baseName: string
    suffix: string
    specialEffectDescription: string
  } | null>(null)

  // Modal de contraproposta comercial
  const [counterModal, setCounterModal] = useState<{
    item: InventoryItem
    offer: number
    offerId?: string
    referencePrice?: number
    askedPrice?: number
    demandMultiplier?: number
  } | null>(null)

  // Boletim de Mercado Pop-up Semanal
  const [bulletinModalOpen, setBulletinModalOpen] = useState<boolean>(false)
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false)
  const [transactionLog, setTransactionLog] = useState<string[]>([])

  const [marketMaterials, setMarketMaterials] = useState<MarketMaterial[]>(
    state.market?.materials_for_sale ?? []
  )
  const [marketReadyItems, setMarketReadyItems] = useState<MarketReadyItem[]>(
    state.market?.ready_items_for_sale ?? []
  )

  const bulletin = state.market?.bulletin

  useEffect(() => {
    if (bulletin && bulletin.headline) {
      const weekKey = `bulletin_dismissed_w${state.week || state.day}`
      if (!sessionStorage.getItem(weekKey)) {
        setBulletinModalOpen(true)
      }
    }
  }, [state.week, state.day, bulletin])

  function dismissBulletin() {
    const weekKey = `bulletin_dismissed_w${state.week || state.day}`
    sessionStorage.setItem(weekKey, 'true')
    setBulletinModalOpen(false)
  }

  function isItemEquipped(itemInstanceId: string): boolean {
    if (!state.tactics?.loadout) return false
    return Object.values(state.tactics.loadout).some(val => {
      if (!val) return false
      if (typeof val === 'string') return val === itemInstanceId
      return (val as any).item_instance_id === itemInstanceId
    })
  }

  const recipesList: Recipe[] = state.recipes ? Object.values(state.recipes) : MOCK_RECIPES
  const branchRecipes = recipesList.filter(r => r.branch === selectedBranch)
  const activeBranchInfo = BRANCHES.find(b => b.name === selectedBranch)!
  const currentBranchLevel = state.workshop_levels[activeBranchInfo.key] ?? 1


  // ─────────────────────────────────────────────
  // AÇÕES DE CRAFTING
  // ─────────────────────────────────────────────
  async function handleCraft(recipe: Recipe) {
    const recipeId = recipe.recipe_id || recipe.id || ''

    if (onCraft) {
      try {
        const res = await onCraft(recipeId)
        if (res && res.result && res.result.success) {
          const item: InventoryItem = res.result.item
          setLastCraft(item)
          if (res.state) {
            setInventory(res.state.inventory)
            setMaterials(res.state.materials)
            setGold(res.state.gold)
          }

          if (item.quality === 'Lendário') {
            setLegendaryItem({
              name: item.name,
              prefix: recipe.prefix_component || recipe.prefix || 'Divina',
              baseName: recipe.base_item,
              suffix: recipe.suffix_component || recipe.suffix || 'da Perfeição Absoluta',
              specialEffectDescription: 'Multiplicador de 180% de poder + ativação integral de cláusula mística especial.',
            })
          }
          setTransactionLog(l => [`[Oficina] Produção de '${item.name}' autorizada pelo controle de qualidade.`, ...l])
          return
        }
      } catch (err) {
        console.warn('Fallback para craft local:', err)
      }
    }

    // Fallback local
    const quality = rollQuality(currentBranchLevel)
    const multiplier = { Fraco: 0.7, Normal: 1.0, Ótimo: 1.35, Lendário: 1.8 }[quality]
    const pfx = recipe.prefix_component || recipe.prefix || 'Reforçada'
    const sfx = recipe.suffix_component || recipe.suffix || 'do Ofício'

    const newItem: InventoryItem = {
      item_instance_id: `item_${Date.now()}`,
      name: `${pfx} ${recipe.base_item} ${sfx}`,
      quality,
      slot_type: (recipe.slot as InventoryItem['slot_type']) || 'Arma',
      power_bonus: Math.round((recipe.base_power ?? 20) * multiplier),
      market_value_base: Math.round((recipe.market_value_base ?? 200) * multiplier),
      charges: recipe.slot === 'Consumível' ? (recipe.charges ?? 3) : undefined,
      max_charges: recipe.slot === 'Consumível' ? 3 : undefined,
      terrain_mitigation: recipe.terrain_mitigation,
    }

    setInventory(prev => [...prev, newItem])
    setLastCraft(newItem)

    // Se for lendário, dispara o Pop-up Overgeared!
    if (quality === 'Lendário') {
      setLegendaryItem({
        name: newItem.name,
        prefix: pfx,
        baseName: recipe.base_item,
        suffix: sfx,
        specialEffectDescription: 'Multiplicador de 180% de poder + ativação integral de cláusula mística especial.',
      })
    }

    setTransactionLog(l => [`[Oficina] '${newItem.name}' forjado com sucesso — Padrão: ${quality}`, ...l])

    // Consome insumos localmente
    setMaterials(prev => {
      const updated = { ...prev }
      recipe.ingredients.forEach(ing => {
        const key = ing.item_id || Object.entries(MATERIAL_LABELS).find(([, v]) => v === ing.label)?.[0]
        if (key) updated[key] = Math.max(0, (updated[key] ?? 0) - ing.quantity)
      })
      return updated
    })
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE COMPRA NO MERCADO
  // ─────────────────────────────────────────────
  async function handleBuyMaterial(mat: MarketMaterial, qty: number = 1) {
    const totalCost = mat.unit_price * qty
    if (gold < totalCost) {
      alert('Saldo em Moedas de Ouro insuficiente.')
      return
    }

    if (onBuyMaterial) {
      const res = await onBuyMaterial(mat.material_id, qty)
      if (res && res.result && res.result.success) {
        setGold(res.state.gold)
        setMaterials(res.state.materials)
        setMarketMaterials(res.state.market.materials_for_sale)
        setTransactionLog(l => [`[Mercado] ${res.result.message}`, ...l])
        return
      }
    }

    setGold(g => g - totalCost)
    setMaterials(m => ({ ...m, [mat.material_id]: (m[mat.material_id] ?? 0) + qty }))
    setMarketMaterials(prev =>
      prev.map(m => m.material_id === mat.material_id ? { ...m, available_quantity: m.available_quantity - qty } : m)
    )
    setTransactionLog(l => [`[Mercado] Fornecedor entregou ${qty}x ${mat.name} por ⬡ ${totalCost} Ouro.`, ...l])
  }

  async function handleBuyItem(readyItem: MarketReadyItem) {
    if (gold < readyItem.price) {
      alert('Saldo em Moedas de Ouro insuficiente.')
      return
    }

    if (onBuyItem) {
      const res = await onBuyItem(readyItem.market_item_id)
      if (res && res.result && res.result.success) {
        setGold(res.state.gold)
        setInventory(res.state.inventory)
        setMarketReadyItems(res.state.market.ready_items_for_sale)
        setTransactionLog(l => [`[Mercado] ${res.result.message}`, ...l])
        return
      }
    }

    setGold(g => g - readyItem.price)
    const newItem: InventoryItem = {
      item_instance_id: `bought_${Date.now()}`,
      name: readyItem.name,
      slot_type: readyItem.slot_type,
      quality: readyItem.quality,
      power_bonus: readyItem.power_bonus,
      energy_bonus: readyItem.energy_bonus,
      terrain_mitigation: readyItem.terrain_mitigation,
      charges: readyItem.slot_type === 'Consumível' ? 3 : undefined,
      max_charges: readyItem.slot_type === 'Consumível' ? 3 : undefined,
      market_value_base: Math.round(readyItem.price * 0.8),
    }
    setInventory(prev => [...prev, newItem])
    setMarketReadyItems(prev => prev.filter(i => i.market_item_id !== readyItem.market_item_id))
    setTransactionLog(l => [`[Mercado] Ativo '${readyItem.name}' registrado sob custódia da guilda.`, ...l])
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE UPGRADE DE OFICINA
  // ─────────────────────────────────────────────
  async function handleUpgradeWorkshop(branch: WorkshopBranch) {
    const curLevel = state.workshop_levels[branch] ?? 1
    if (curLevel >= 6) {
      alert(`A filial de ${branch} já atingiu o nível máximo (Nível 6).`)
      return
    }

    const nextLevel = curLevel + 1
    const cost = UPGRADE_COSTS[curLevel] ?? 1000

    if (gold < cost) {
      alert(
        `Recursos financeiros insuficientes em tesouraria.\nCusto orçado: ${cost} Ouro. Saldo disponível: ${gold} Ouro.`
      )
      return
    }

    const confirmed = window.confirm(
      `Ordem de Serviço de Expansão:\nHomologar ampliação da filial de ${branch} para o Nível ${nextLevel} pelo valor de ⬡ ${cost} Ouro?`
    )
    if (!confirmed) return

    setIsUpgrading(true)
    if (onUpgradeWorkshop) {
      try {
        const res = await onUpgradeWorkshop(branch)
        setIsUpgrading(false)
        if (res && res.result && res.result.success) {
          if (res.state) {
            setGold(res.state.gold)
          }
          setTransactionLog(l => [`[Oficina] ${res.result.message}`, ...l])
          return
        } else {
          alert(res?.result?.message || 'Falha ao processar homologação de expansão da oficina.')
          return
        }
      } catch (err) {
        setIsUpgrading(false)
        console.warn('Erro ao atualizar oficina:', err)
      }
    }

    // Fallback local
    setGold(g => g - cost)
    state.workshop_levels[branch] = nextLevel
    setIsUpgrading(false)
    setTransactionLog(l => [
      `[Oficina] Filial de ${branch} promovida para o Nível ${nextLevel} (-⬡ ${cost} Ouro).`,
      ...l,
    ])
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE VENDA NO BALCÃO
  // ─────────────────────────────────────────────
  async function handleSell(item: InventoryItem, marginType: 'Promoção' | 'Preço Justo' | 'Preço Abusivo') {
    if (isItemEquipped(item.item_instance_id)) {
      alert('Ativo atualmente alocado no loadout de expedição não pode ser alienado.')
      return
    }

    if (onSellItem) {
      const res = await onSellItem(item.item_instance_id, marginType)
      if (res && res.result) {
        const {
          status,
          offer_id,
          counter_offer,
          message,
          reference_price,
          asked_price,
          demand_multiplier,
        } = res.result

        if (status === 'vendido') {
          if (res.state) {
            setInventory(res.state.inventory)
            setGold(res.state.gold)
          }
          setTransactionLog(l => [
            `[Balcão] ${message} (Ref: ⬡ ${reference_price}, Pedido: ⬡ ${asked_price}, Demanda: x${demand_multiplier})`,
            ...l,
          ])
        } else if (status === 'contraproposta') {
          if (res.state) {
            setInventory(res.state.inventory)
          }
          setCounterModal({
            item,
            offer: counter_offer,
            offerId: offer_id,
            referencePrice: reference_price,
            askedPrice: asked_price,
            demandMultiplier: demand_multiplier,
          })
          setTransactionLog(l => [
            `[Balcão] Contraproposta recebida para "${item.name}": ⬡ ${counter_offer} Ouro (Pedido: ⬡ ${asked_price}).`,
            ...l,
          ])
        } else {
          setTransactionLog(l => [
            `[Balcão] ${message} (Pedido: ⬡ ${asked_price} G, Ref: ⬡ ${reference_price} G).`,
            ...l,
          ])
        }
        return
      }
    }

    // Fallback local
    const mult = marginType === 'Promoção' ? 0.8 : marginType === 'Preço Justo' ? 1.0 : 1.35
    const asked = Math.round(item.market_value_base * mult)
    if (marginType === 'Preço Abusivo') {
      const offer = Math.round(asked * 0.85)
      setCounterModal({
        item,
        offer,
        referencePrice: item.market_value_base,
        askedPrice: asked,
        demandMultiplier: 1.0,
      })
    } else {
      setInventory(prev => prev.filter(i => i.item_instance_id !== item.item_instance_id))
      setGold(g => g + asked)
      setTransactionLog(l => [
        `[Balcão] Ativo "${item.name}" liquidado ao preço de ⬡ ${asked} Ouro (${marginType}).`,
        ...l,
      ])
    }
  }

  async function handleResolveOffer(accept: boolean) {
    if (!counterModal) return

    if (onResolveOffer && counterModal.offerId) {
      const res = await onResolveOffer(counterModal.offerId, accept)
      if (res && res.result) {
        if (res.state) {
          setGold(res.state.gold)
          setInventory(res.state.inventory)
        }
        setTransactionLog(l => [`[Balcão] ${res.result.message}`, ...l])
        setCounterModal(null)
        return
      }
    }

    if (accept) {
      setGold(g => g + counterModal.offer)
      setInventory(prev => prev.filter(i => i.item_instance_id !== counterModal.item.item_instance_id))
      setTransactionLog(l => [
        `[Balcão] Contrato firmado: "${counterModal.item.name}" vendido por ⬡ ${counterModal.offer} Ouro.`,
        ...l,
      ])
    } else {
      setInventory(prev => [...prev, counterModal.item])
      setTransactionLog(l => [
        `[Balcão] Contraproposta rejeitada para "${counterModal.item.name}". Ativo retido no almoxarifado.`,
        ...l,
      ])
    }
    setCounterModal(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Topo do Módulo */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase II</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Artesanato & Comércio</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Oficina de Forja, Alquimia & Balcão de Negociações
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Produza equipamentos com garantia de qualidade, adquira matérias-primas e negocie com as guildas mercantis.
          </p>
        </div>

        <button
          onClick={onAdvance}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center gap-2"
        >
          <span>Concluir Operações & Ir para Tática</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Principais (Design Pedra e Madeira) */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 p-1 rounded-xl max-w-md gap-1">
        <button
          onClick={() => setMainTab('oficina')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mainTab === 'oficina'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Hammer className="w-4 h-4 text-amber-500" />
          <span>Oficinas de Produção</span>
        </button>
        <button
          onClick={() => setMainTab('balcao')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mainTab === 'balcao'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Balcão & Mercado</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          CONTEÚDO: 4 BANCADAS DE OFICINA
         ───────────────────────────────────────────── */}
      {mainTab === 'oficina' && (
        <div className="space-y-6">
          {/* Grid de 4 Bancadas (Ferragem, Alquimia, Joalheria, Culinária) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BRANCHES.map(branch => {
              const Icon = branch.icon
              const lvl = state.workshop_levels[branch.key] ?? 1
              const isSelected = selectedBranch === branch.name
              const progressPct = Math.round((lvl / 6) * 100)

              return (
                <div
                  key={branch.name}
                  onClick={() => setSelectedBranch(branch.name)}
                  className={`bg-[#1c1917] border rounded-xl p-4 shadow-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 ring-1 ring-amber-400/40 bg-gradient-to-b from-[#292524] to-[#1c1917]'
                      : 'border-amber-950/50 hover:border-stone-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-amber-400">
                      Nv. {lvl}/6
                    </span>
                  </div>

                  <h3 className="text-amber-100 font-bold text-sm tracking-wide">{branch.name}</h3>

                  {/* Barra de Progresso do Nível da Oficina */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                      <span>Especialização</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden border border-stone-800">
                      <div
                        className="bg-gradient-to-r from-amber-700 to-amber-400 h-1.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Insumos no Almoxarifado */}
          <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Estoque de Matérias-Primas da Guilda</span>
              </span>
              <span className="text-stone-500 text-xs">Reservados para forja</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(materials).map(([key, qty]) => (
                <span
                  key={key}
                  className="bg-stone-900 border border-stone-700 text-stone-300 text-xs px-3 py-1 rounded-lg flex items-center gap-1.5"
                >
                  <span>{MATERIAL_LABELS[key] ?? key}:</span>
                  <strong className="text-amber-300 font-mono">{qty}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Card de Gestão e Modernização da Bancada Ativa */}
          <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-amber-200 text-xs font-black uppercase tracking-wider">
                  Bancada de {selectedBranch} (Escalão Nível {currentBranchLevel}/6)
                </h4>
                {currentBranchLevel >= 6 && (
                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-mono font-bold">
                    HOMOLOGAÇÃO MÁXIMA
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-xs mt-1">
                {currentBranchLevel < 6
                  ? `Nível ${currentBranchLevel + 1} desbloqueia novas receitas e eleva probabilidade de qualidades Ótimo e Lendário.`
                  : 'Esta filial atingiu a graduação máxima homologada pela Câmara de Ofícios.'}
              </p>
            </div>

            {currentBranchLevel < 6 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Custo de Ampliação</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    ⬡ {(UPGRADE_COSTS[currentBranchLevel] ?? 1000).toLocaleString('pt-BR')} Ouro
                  </span>
                </div>
                <button
                  onClick={() => handleUpgradeWorkshop(selectedBranch)}
                  disabled={isUpgrading || gold < (UPGRADE_COSTS[currentBranchLevel] ?? 1000)}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-stone-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUpCircle className="w-4 h-4 text-stone-950" />
                  <span>{isUpgrading ? 'Ampliando...' : 'Modernizar Bancada'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Receitas da Bancada Ativa */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-amber-200 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ordens de Serviço — Filial de {selectedBranch}</span>
              </h3>
              <span className="text-stone-500 text-xs">Probabilidade de Qualidade baseada no Nível {currentBranchLevel}</span>
            </div>

            {branchRecipes.map(recipe => {
              const canCraft = recipe.ingredients.every(ing => {
                const key = ing.item_id || Object.entries(MATERIAL_LABELS).find(([, v]) => v === ing.label)?.[0]
                return (materials[key ?? ''] ?? 0) >= ing.quantity
              })

              return (
                <div
                  key={recipe.recipe_id || recipe.id}
                  className="bg-[#1c1917] border border-stone-800 hover:border-amber-950/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-100 font-bold text-sm">{recipe.name || recipe.base_item}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700 uppercase font-mono">
                        Slot: {recipe.slot}
                      </span>
                      {recipe.terrain_mitigation && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                          🛡 Mitiga Terreno
                        </span>
                      )}
                    </div>
                    <div className="text-stone-400 text-xs mt-1">
                      Composição:{' '}
                      <span className="text-stone-300 font-mono">[{recipe.prefix_component || recipe.prefix}]</span> +{' '}
                      <span className="text-stone-300 font-mono">[{recipe.base_item}]</span> +{' '}
                      <span className="text-stone-300 font-mono">[{recipe.suffix_component || recipe.suffix}]</span>
                    </div>
                    <div className="text-stone-500 text-xs mt-1">
                      Insumos:{' '}
                      {recipe.ingredients.map(i => {
                        const label = i.label || MATERIAL_LABELS[i.item_id ?? ''] || i.item_id
                        return `${i.quantity}x ${label}`
                      }).join(' · ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCraft(recipe)}
                    disabled={!canCraft}
                    className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 ${
                      canCraft
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:brightness-110'
                        : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                    }`}
                  >
                    {canCraft ? 'Forjar Peça' : 'Faltam Insumos'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Card do Último Craft com Tratamento Overgeared */}
          {lastCraft && (
            <div className={`rounded-xl p-5 shadow-xl transition-all ${RARITY_CARD_STYLES[lastCraft.quality]}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-bold">Laudo de Inspeção do Artesão</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${RARITY_BADGE_STYLES[lastCraft.quality]}`}>
                  {lastCraft.quality}
                </span>
              </div>
              <p className="font-extrabold text-base text-stone-100">{lastCraft.name}</p>
              <div className="flex gap-4 text-xs mt-2 text-stone-300 font-mono">
                <span>Slot: {lastCraft.slot_type}</span>
                <span>Poder: +{lastCraft.power_bonus}</span>
                <span>Valor Contábil: ⬡ {lastCraft.market_value_base} Ouro</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          CONTEÚDO: BALCÃO DE NEGOCIAÇÕES & MERCADO
         ───────────────────────────────────────────── */}
      {mainTab === 'balcao' && (
        <div className="space-y-6">
          {/* Banner do Boletim de Mercado Semanal */}
          {bulletin && bulletin.headline && (
            <div className="bg-amber-950/40 border border-amber-600/70 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-600/50 flex items-center justify-center shrink-0">
                  <Newspaper className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block -mb-0.5">
                    Boletim de Mercado Oficial da Liga
                  </span>
                  <p className="text-xs text-stone-200 font-semibold">{bulletin.headline}</p>
                </div>
              </div>
              <div className="shrink-0 bg-amber-500 text-stone-950 px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono shadow self-start sm:self-center">
                {bulletin.target}: Demanda x{bulletin.multiplier}
              </div>
            </div>
          )}

          <div className="flex gap-2 border-b border-stone-800 pb-2">
            <button
              onClick={() => setMarketSubTab('vender')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                marketSubTab === 'vender'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              1. Liquidar Ativos ({inventory.length})
            </button>
            <button
              onClick={() => setMarketSubTab('comprar_prontos')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                marketSubTab === 'comprar_prontos'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              2. Comprar Itens Prontos ({marketReadyItems.length})
            </button>
            <button
              onClick={() => setMarketSubTab('comprar_insumos')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                marketSubTab === 'comprar_insumos'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              3. Comprar Insumos ({marketMaterials.length})
            </button>
          </div>

          {/* Venda de Ativos */}
          {marketSubTab === 'vender' && (
            <div className="space-y-3">
              {inventory.length === 0 ? (
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-8 text-center text-stone-500 text-xs">
                  Almoxarifado sem ativos sobressalentes.
                </div>
              ) : (
                inventory.map(item => {
                  const equipped = isItemEquipped(item.item_instance_id)
                  const isBulletinTarget = bulletin && bulletin.target === item.slot_type
                  const demandMult = isBulletinTarget ? bulletin.multiplier : 1.0

                  const promoPrice = Math.round(item.market_value_base * 0.8 * demandMult)
                  const fairPrice = Math.round(item.market_value_base * 1.0 * demandMult)
                  const abusivePrice = Math.round(item.market_value_base * 1.35 * demandMult)

                  return (
                    <div
                      key={item.item_instance_id}
                      className={`rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md ${
                        RARITY_CARD_STYLES[item.quality]
                      } ${equipped ? 'opacity-75 ring-1 ring-amber-600/40' : ''}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-stone-100">{item.name}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${RARITY_BADGE_STYLES[item.quality]}`}>
                            {item.quality}
                          </span>
                          {equipped && (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" />
                              Equipado no Loadout
                            </span>
                          )}
                          {isBulletinTarget && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              📈 Alta Demanda x{bulletin.multiplier}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 mt-1 flex gap-3 font-mono flex-wrap">
                          <span>Slot: {item.slot_type}</span>
                          <span>Poder: +{item.power_bonus}</span>
                          <span>Valor Contábil: ⬡ {item.market_value_base}</span>
                        </div>
                      </div>

                      {equipped ? (
                        <div className="text-right">
                          <span className="text-[11px] text-amber-400/90 font-mono italic block">
                            Ativo alocado na expedição — Venda bloqueada
                          </span>
                        </div>
                      ) : (
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => handleSell(item, 'Promoção')}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg border border-stone-700 transition"
                            title="Margem Promoção (Taxa 0.8x)"
                          >
                            Promoção (⬡ {promoPrice})
                          </button>
                          <button
                            onClick={() => handleSell(item, 'Preço Justo')}
                            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs rounded-lg border border-emerald-800 transition font-bold"
                            title="Margem Preço Justo (Taxa 1.0x)"
                          >
                            Preço Justo (⬡ {fairPrice})
                          </button>
                          <button
                            onClick={() => handleSell(item, 'Preço Abusivo')}
                            className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs rounded-lg border border-amber-800 transition font-bold"
                            title="Margem Preço Abusivo (Taxa 1.35x)"
                          >
                            Preço Abusivo (⬡ {abusivePrice})
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Compra de Itens Prontos com Estilo de Raridade */}
          {marketSubTab === 'comprar_prontos' && (
            <div className="space-y-3">
              {marketReadyItems.map(item => (
                <div
                  key={item.market_item_id}
                  className={`rounded-xl p-4 flex items-center justify-between gap-4 shadow-md ${RARITY_CARD_STYLES[item.quality]}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-100">{item.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${RARITY_BADGE_STYLES[item.quality]}`}>
                        {item.quality}
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1 flex gap-3 font-mono">
                      <span>Slot: {item.slot_type}</span>
                      <span className="text-emerald-400 font-bold">+{item.power_bonus} Poder</span>
                      {item.terrain_mitigation && (
                        <span className="text-cyan-400">
                          🛡 Mitiga: {TERRAIN_NAMES[item.terrain_mitigation] || item.terrain_mitigation}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-amber-400 font-bold font-mono text-sm">⬡ {item.price} G</span>
                    <button
                      onClick={() => handleBuyItem(item)}
                      disabled={gold < item.price}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow hover:brightness-110 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compra de Insumos */}
          {marketSubTab === 'comprar_insumos' && (
            <div className="space-y-3">
              {marketMaterials.map(mat => (
                <div
                  key={mat.material_id}
                  className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 flex items-center justify-between gap-4 shadow-md"
                >
                  <div>
                    <span className="font-bold text-sm text-stone-200">{mat.name}</span>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Preço: <strong className="text-amber-400 font-mono">⬡ {mat.unit_price} Ouro</strong> · Disponível:{' '}
                      <span className="text-stone-300 font-mono">{mat.available_quantity} unidades</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleBuyMaterial(mat, 1)}
                      disabled={mat.available_quantity < 1 || gold < mat.unit_price}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-700 transition"
                    >
                      +1x (⬡ {mat.unit_price})
                    </button>
                    {mat.available_quantity >= 3 && (
                      <button
                        onClick={() => handleBuyMaterial(mat, 3)}
                        disabled={gold < mat.unit_price * 3}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-lg transition"
                      >
                        +3x (⬡ {mat.unit_price * 3})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Log de Negociações */}
          {transactionLog.length > 0 && (
            <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-1">
              <span className="text-stone-400 text-xs uppercase tracking-wider font-bold block mb-1">
                Boletim de Operações Comerciais
              </span>
              {transactionLog.slice(0, 4).map((log, i) => (
                <p key={i} className="text-stone-300 text-xs font-mono">
                  · {log}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          POP-UP DO BOLETIM DE MERCADO SEMANAL
         ───────────────────────────────────────────── */}
      {bulletinModalOpen && bulletin && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border-2 border-amber-600 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-amber-100 font-black text-sm uppercase tracking-wide">
                    Gazeta Comercial da Liga
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">
                    Edição Extraordinária — Semana R-{state.week || state.day}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissBulletin}
                className="text-stone-400 hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-950 border border-amber-900/40 rounded-xl p-4 space-y-3">
              <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold block">
                Manchete do Mercado
              </span>
              <p className="text-sm font-semibold text-stone-100 leading-relaxed">
                "{bulletin.headline}"
              </p>
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Alvo da Portaria: <strong className="text-stone-200">{bulletin.target}</strong></span>
                <span className="text-amber-400 font-bold">Multiplicador de Demanda: x{bulletin.multiplier}</span>
              </div>
            </div>

            <button
              onClick={dismissBulletin}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg hover:brightness-110 transition"
            >
              Ciente das Diretrizes de Mercado
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          THE SMITHING REVEAL MODAL (CRAFT LENDÁRIO)
         ───────────────────────────────────────────── */}
      {legendaryItem && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-stone-900 border-2 border-amber-500 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50 animate-in zoom-in-95">
            <span className="text-4xl animate-bounce inline-block mb-2">⚒️✨</span>
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold">Obra-Prima Forjada!</h2>
            <h3 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 my-2">
              {legendaryItem.name}
            </h3>
            <div className="my-4 p-4 bg-stone-950 rounded-xl border border-amber-500/30 text-stone-300 text-sm">
              <p className="font-semibold text-amber-300">
                {legendaryItem.prefix} {legendaryItem.baseName} {legendaryItem.suffix}
              </p>
              <p className="text-xs text-stone-400 mt-1">Efeito Especial: {legendaryItem.specialEffectDescription}</p>
            </div>
            <button
              onClick={() => setLegendaryItem(null)}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition uppercase tracking-wider text-xs"
            >
              RECLAMAR CRIAÇÃO
            </button>
          </div>
        </div>
      )}

      {/* Modal de Contraproposta Comercial com estatísticas completas */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border-2 border-amber-600 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-amber-400 font-black text-base mb-1">Contraproposta de Balcão</h3>
              <p className="text-stone-300 text-xs">
                A comissão de compras da guilda cliente solicitou ajuste no preço cobrado para fechar o contrato.
              </p>
            </div>

            <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2 text-xs">
              <p className="text-stone-400">Ativo: <strong className="text-stone-200">{counterModal.item.name}</strong></p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-stone-800/80 pt-2 text-stone-400">
                <span>Referência: ⬡ {counterModal.referencePrice ?? counterModal.item.market_value_base}</span>
                <span>Preço Pedido: ⬡ {counterModal.askedPrice ?? '—'}</span>
                <span>Demanda: x{counterModal.demandMultiplier ?? 1.0}</span>
                <span className="text-amber-300 font-bold">Oferta: ⬡ {counterModal.offer}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResolveOffer(true)}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow hover:brightness-110 transition"
              >
                Aceitar Oferta (⬡ {counterModal.offer})
              </button>
              <button
                onClick={() => handleResolveOffer(false)}
                className="flex-1 py-2.5 bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-700 hover:bg-stone-700 transition"
              >
                Recusar Proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

