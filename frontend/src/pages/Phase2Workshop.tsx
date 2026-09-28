import { useState } from 'react'
import {
  Hammer,
  FlaskConical,
  Gem,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Layers,
  Coins,
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
import { RARITY_CARD_STYLES, RARITY_BADGE_STYLES, GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

interface Phase2WorkshopProps {
  state: GameState
  onAdvance: () => void
  onCraft?: (recipeId: string) => Promise<any>
  onBuyMaterial?: (matId: string, qty: number) => Promise<any>
  onBuyItem?: (marketItemId: string) => Promise<any>
  onSellItem?: (instanceId: string, basePrice: number, margin: string) => Promise<any>
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
  const [counterModal, setCounterModal] = useState<{ item: InventoryItem; offer: number; offerId?: string } | null>(null)
  const [transactionLog, setTransactionLog] = useState<string[]>([])

  const [marketMaterials, setMarketMaterials] = useState<MarketMaterial[]>(
    state.market?.materials_for_sale ?? []
  )
  const [marketReadyItems, setMarketReadyItems] = useState<MarketReadyItem[]>(
    state.market?.ready_items_for_sale ?? []
  )

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
  // AÇÕES DE VENDA NO BALCÃO
  // ─────────────────────────────────────────────
  async function handleSell(item: InventoryItem, marginType: string) {
    const mult = marginType === 'Promoção' ? 0.8 : marginType === 'Preço Justo' ? 1.0 : 1.35
    const finalPrice = Math.round(item.market_value_base * mult)

    if (onSellItem) {
      const res = await onSellItem(item.item_instance_id, item.market_value_base, marginType)
      if (res && res.result) {
        const { status, offer_id, counter_offer, message } = res.result
        if (status === 'vendido') {
          setInventory(res.state.inventory)
          setGold(res.state.gold)
          setTransactionLog(l => [`[Balcão] ${message}`, ...l])
        } else if (status === 'contraproposta') {
          setInventory(res.state.inventory)
          setCounterModal({ item, offer: counter_offer, offerId: offer_id })
        } else {
          setTransactionLog(l => [`[Balcão] ${message}`, ...l])
        }
        return
      }
    }

    const ratio = finalPrice / item.market_value_base
    if (ratio >= 1.5) {
      setTransactionLog(l => [`[Balcão] Sem compradores para "${item.name}" ao preço solicitado.`, ...l])
    } else if (ratio <= 1.0) {
      setInventory(prev => prev.filter(i => i.item_instance_id !== item.item_instance_id))
      setGold(g => g + finalPrice)
      setTransactionLog(l => [`[Balcão] Ativo "${item.name}" liquidado a preço de tabela (+⬡ ${finalPrice} Ouro).`, ...l])
    } else {
      const offer = Math.round(finalPrice * 0.9)
      setCounterModal({ item, offer })
    }
  }

  async function handleResolveOffer(accept: boolean) {
    if (!counterModal) return

    if (onResolveOffer && counterModal.offerId) {
      const res = await onResolveOffer(counterModal.offerId, accept)
      if (res && res.result) {
        setGold(res.state.gold)
        setInventory(res.state.inventory)
        setTransactionLog(l => [`[Balcão] ${res.result.message}`, ...l])
        setCounterModal(null)
        return
      }
    }

    if (accept) {
      setGold(g => g + counterModal.offer)
      setInventory(prev => prev.filter(i => i.item_instance_id !== counterModal.item.item_instance_id))
      setTransactionLog(l => [`[Balcão] Contrato firmado: "${counterModal.item.name}" vendido por ⬡ ${counterModal.offer} Ouro.`, ...l])
    } else {
      setTransactionLog(l => [`[Balcão] Contraproposta rejeitada para "${counterModal.item.name}". Ativo retido.`, ...l])
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
          <div className="flex gap-2 border-b border-stone-800 pb-2">
            <button
              onClick={() => setMarketSubTab('vender')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                marketSubTab === 'vender'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              1. Liquidar Ativos
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
                inventory.map(item => (
                  <div
                    key={item.item_instance_id}
                    className={`rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md ${RARITY_CARD_STYLES[item.quality]}`}
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
                        <span>Poder: +{item.power_bonus}</span>
                        <span>Referência: ⬡ {item.market_value_base}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleSell(item, 'Promoção')}
                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg border border-stone-700 transition"
                      >
                        Promoção (⬡ {Math.round(item.market_value_base * 0.8)})
                      </button>
                      <button
                        onClick={() => handleSell(item, 'Preço Justo')}
                        className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs rounded-lg border border-emerald-800 transition font-bold"
                      >
                        Preço Justo (⬡ {item.market_value_base})
                      </button>
                      <button
                        onClick={() => handleSell(item, 'Abusivo')}
                        className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs rounded-lg border border-amber-800 transition font-bold"
                      >
                        Acima do Mercado (⬡ {Math.round(item.market_value_base * 1.35)})
                      </button>
                    </div>
                  </div>
                ))
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
                        <span className="text-cyan-400">🛡 Proteção: {item.terrain_mitigation}</span>
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

      {/* Modal de Contraproposta Comercial */}
      {counterModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-stone-900 border-2 border-amber-600 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-amber-400 font-black text-base mb-1">Contraproposta de Balcão</h3>
            <p className="text-stone-300 text-xs">
              A comissão de compras da guilda cliente solicitou ajuste no preço cobrado para fechar o contrato.
            </p>
            <div className="my-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
              <p className="text-stone-400 text-xs">Ativo: <strong className="text-stone-200">{counterModal.item.name}</strong></p>
              <p className="text-xs text-stone-400 mt-1">
                Oferta Final:{' '}
                <strong className={`${GOLD_GRADIENT_TEXT} text-sm font-mono`}>
                  ⬡ {counterModal.offer} Moedas de Ouro
                </strong>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveOffer(true)}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow hover:brightness-110 transition"
              >
                Aceitar Oferta
              </button>
              <button
                onClick={() => handleResolveOffer(false)}
                className="flex-1 py-2.5 bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-stone-700 hover:bg-stone-700 transition"
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
