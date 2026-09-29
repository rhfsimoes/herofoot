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
  BookOpen,
  Info,
  Check,
  AlertTriangle,
  Compass,
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
  type CraftOptions,
  type CraftPreview,
  type MaterialSheet,
  type AffixManual,
} from '../mockData'
import { RARITY_CARD_STYLES, RARITY_BADGE_STYLES } from '../utils/rarityStyles'
import {
  fetchCraftOptionsBackend,
  fetchCraftPreviewBackend,
  fetchMaterialSheetBackend,
} from '../api'

interface Phase2WorkshopProps {
  state: GameState
  onAdvance: () => void
  onCraft?: (payload: any) => Promise<any>
  onUpgradeWorkshop?: (branch: string) => Promise<any>
  onBuyMaterial?: (matId: string, qty: number) => Promise<any>
  onBuyItem?: (marketItemId: string) => Promise<any>
  onSellItem?: (instanceId: string, margin: string) => Promise<any>
  onResolveOffer?: (offerId: string, accept: boolean) => Promise<any>
  onLearnAffix?: (affixId: string) => Promise<any>
}

type MainTab = 'oficina' | 'balcao'
type MarketSubTab = 'vender' | 'comprar_prontos' | 'comprar_insumos' | 'manuais'

const BRANCHES: { name: WorkshopBranch; icon: any; key: string }[] = [
  { name: 'Ferragem', icon: Hammer, key: 'Ferragem' },
  { name: 'Alquimia', icon: FlaskConical, key: 'Alquimia' },
  { name: 'Joalheria', icon: Gem, key: 'Joalheria' },
  { name: 'Culinária', icon: UtensilsCrossed, key: 'Culinária' },
]

const TERRAIN_NAMES: Record<string, string> = {
  neutral: 'Campo Aberto',
  toxic_swamp: 'Pântano Tóxico',
  glacier_frost: 'Frio Glacial',
  unstable_mine: 'Mina Instável',
}

const UPGRADE_COSTS: Record<number, number> = {
  1: 500,
  2: 900,
  3: 1600,
  4: 2800,
  5: 5000,
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
  onLearnAffix,
}: Phase2WorkshopProps) {
  const [mainTab, setMainTab] = useState<MainTab>('oficina')
  const [selectedBranch, setSelectedBranch] = useState<WorkshopBranch>('Ferragem')
  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>('vender')

  // Estados locais sincronizados
  const [inventory, setInventory] = useState<InventoryItem[]>(state.inventory)
  const [materials, setMaterials] = useState<Record<string, number>>(state.materials)
  const [gold, setGold] = useState<number>(state.gold)
  const [lastCraft, setLastCraft] = useState<InventoryItem | null>(null)

  // Crafting v2 Seleções
  const recipesList: Recipe[] = state.recipes ? Object.values(state.recipes) : MOCK_RECIPES
  const branchRecipes = recipesList.filter(r => r.branch === selectedBranch)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    branchRecipes[0]?.recipe_id || branchRecipes[0]?.id || 'rec_01'
  )
  const [selectedPrefixId, setSelectedPrefixId] = useState<string | null>(null)
  const [selectedSuffixId, setSelectedSuffixId] = useState<string | null>(null)

  const [craftOptions, setCraftOptions] = useState<CraftOptions | null>(null)
  const [craftPreview, setCraftPreview] = useState<CraftPreview | null>(null)
  const [isLoadingCraft, setIsLoadingCraft] = useState<boolean>(false)

  // Ficha do Material (Modal)
  const [materialSheetModal, setMaterialSheetModal] = useState<MaterialSheet | null>(null)
  const [, setIsLoadingSheet] = useState<boolean>(false)

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
  const [isBuyingManual, setIsBuyingManual] = useState<string | null>(null)
  const [transactionLog, setTransactionLog] = useState<string[]>([])

  const [marketMaterials, setMarketMaterials] = useState<MarketMaterial[]>(
    state.market?.materials_for_sale ?? []
  )
  const [marketReadyItems, setMarketReadyItems] = useState<MarketReadyItem[]>(
    state.market?.ready_items_for_sale ?? []
  )
  const [affixManuals, setAffixManuals] = useState<AffixManual[]>(
    state.market?.affix_manuals ?? []
  )

  const bulletin = state.market?.bulletin
  const activeBranchInfo = BRANCHES.find(b => b.name === selectedBranch)!
  const currentBranchLevel = state.workshop_levels[activeBranchInfo.key] ?? 1

  // Sincroniza estado de bases quando troca a bancada
  useEffect(() => {
    const firstInBranch = branchRecipes[0]
    if (firstInBranch) {
      const rid = firstInBranch.recipe_id || firstInBranch.id || ''
      setSelectedRecipeId(rid)
      setSelectedPrefixId(null)
      setSelectedSuffixId(null)
    }
  }, [selectedBranch])

  // Carrega opções e prévia ao vivo de Crafting v2
  useEffect(() => {
    if (!selectedRecipeId) return
    let active = true

    async function loadData() {
      const options = await fetchCraftOptionsBackend(selectedRecipeId)
      if (active && options) {
        setCraftOptions(options)
      }

      const preview = await fetchCraftPreviewBackend({
        recipe_id: selectedRecipeId,
        prefix_id: selectedPrefixId,
        suffix_id: selectedSuffixId,
      })
      if (active && preview) {
        setCraftPreview(preview)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [selectedRecipeId, selectedPrefixId, selectedSuffixId, materials, currentBranchLevel])

  useEffect(() => {
    setInventory(state.inventory)
    setMaterials(state.materials)
    setGold(state.gold)
    if (state.market?.materials_for_sale) setMarketMaterials(state.market.materials_for_sale)
    if (state.market?.ready_items_for_sale) setMarketReadyItems(state.market.ready_items_for_sale)
    if (state.market?.affix_manuals) setAffixManuals(state.market.affix_manuals)
  }, [state])

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

  // ─────────────────────────────────────────────
  // CONSULTA DE FICHA DO MATERIAL
  // ─────────────────────────────────────────────
  async function handleOpenMaterialSheet(materialId: string) {
    setIsLoadingSheet(true)
    try {
      const sheet = await fetchMaterialSheetBackend(materialId)
      if (sheet && sheet.success) {
        setMaterialSheetModal(sheet)
      } else {
        // Fallback básico
        setMaterialSheetModal({
          success: true,
          material: {
            id: materialId,
            name: MATERIAL_LABELS[materialId] || materialId,
            category: 'Insumo Básico',
            unit_price: 30,
          },
          used_in_recipes: [],
          enables_affixes: [],
          sources: [],
        })
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSheet(false)
    }
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE CRAFTING v2
  // ─────────────────────────────────────────────
  async function handleExecuteCraft() {
    if (!selectedRecipeId || isLoadingCraft) return

    setIsLoadingCraft(true)
    const payload = {
      recipe_id: selectedRecipeId,
      branch: selectedBranch,
      prefix_id: selectedPrefixId,
      suffix_id: selectedSuffixId,
    }

    if (onCraft) {
      try {
        const res = await onCraft(payload)
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
              prefix: selectedPrefixId || 'Obra-Prima',
              baseName: craftPreview?.final_name || item.name,
              suffix: selectedSuffixId || 'do Apogeu',
              specialEffectDescription: 'Multiplicador de 180% de poder + ativação integral de cláusula mística especial.',
            })
          }
          setTransactionLog(l => [`[Oficina] Produção de '${item.name}' autorizada pelo controle de qualidade.`, ...l])
        } else if (res && res.result && !res.result.success) {
          alert(res.result.message || 'Falha na homologação do processo de forja.')
        }
      } catch (err) {
        console.warn('Erro ao forjar ativo:', err)
      } finally {
        setIsLoadingCraft(false)
      }
      return
    }

    setIsLoadingCraft(false)
  }

  // ─────────────────────────────────────────────
  // AÇÕES DE MERCADO E COMPRA DE MANUAIS
  // ─────────────────────────────────────────────
  async function handleBuyManual(affixId: string, cost: number) {
    if (gold < cost) {
      alert(`Recursos em tesouraria insuficientes. Custo: ${cost} Ouro. Saldo: ${gold} Ouro.`)
      return
    }

    setIsBuyingManual(affixId)
    if (onLearnAffix) {
      try {
        const res = await onLearnAffix(affixId)
        if (res && res.result && res.result.success) {
          setAffixManuals(prev => prev.filter(m => m.affix_id !== affixId))
          if (res.state) {
            setGold(res.state.gold)
          }
          setTransactionLog(l => [`[Mercado] Manual corporativo '${affixId}' adquirido e arquivado no compêndio.`, ...l])
          // Recarrega opções de craft da receita ativa
          if (selectedRecipeId) {
            const updatedOpts = await fetchCraftOptionsBackend(selectedRecipeId)
            if (updatedOpts) setCraftOptions(updatedOpts)
          }
        } else if (res && res.result && !res.result.success) {
          alert(res.result.message || 'Falha na aquisição do manual.')
        }
      } catch (err) {
        console.error('Erro ao comprar manual:', err)
      } finally {
        setIsBuyingManual(null)
      }
      return
    }
    setIsBuyingManual(null)
  }

  async function handleBuyMaterial(mat: MarketMaterial, qty: number = 1) {
    const totalCost = mat.unit_price * qty
    if (gold < totalCost) {
      alert(`Recursos financeiros insuficientes em tesouraria. Custo total: ${totalCost} Ouro. Saldo: ${gold} Ouro.`)
      return
    }

    if (onBuyMaterial) {
      try {
        const res = await onBuyMaterial(mat.material_id, qty)
        if (res && res.state) {
          setGold(res.state.gold)
          setMaterials(res.state.materials)
          if (res.state.market?.materials_for_sale) {
            setMarketMaterials(res.state.market.materials_for_sale)
          }
        }
        setTransactionLog(l => [`[Mercado] ${qty}x ${mat.name} faturados por ⬡ ${totalCost} Ouro.`, ...l])
        return
      } catch (err) {
        console.warn('Fallback para compra local de insumos:', err)
      }
    }

    setGold(g => g - totalCost)
    setMaterials(prev => ({
      ...prev,
      [mat.material_id]: (prev[mat.material_id] ?? 0) + qty,
    }))
  }

  async function handleBuyItem(readyItem: MarketReadyItem) {
    if (gold < readyItem.price) {
      alert(`Recursos financeiros insuficientes em tesouraria. Valor da peça: ${readyItem.price} Ouro. Saldo: ${gold} Ouro.`)
      return
    }

    if (onBuyItem) {
      try {
        const res = await onBuyItem(readyItem.market_item_id)
        if (res && res.state) {
          setGold(res.state.gold)
          setInventory(res.state.inventory)
          if (res.state.market?.ready_items_for_sale) {
            setMarketReadyItems(res.state.market.ready_items_for_sale)
          }
        }
        setTransactionLog(l => [`[Mercado] Item homologado '${readyItem.name}' incorporado ao patrimônio.`, ...l])
        return
      } catch (err) {
        console.warn('Fallback para compra local de item pronto:', err)
      }
    }

    setGold(g => g - readyItem.price)
    setInventory(prev => [
      ...prev,
      {
        item_instance_id: `market_${Date.now()}`,
        name: readyItem.name,
        quality: readyItem.quality,
        slot_type: readyItem.slot_type,
        power_bonus: readyItem.power_bonus,
        market_value_base: readyItem.price,
        charges: readyItem.charges,
        max_charges: readyItem.max_charges,
        terrain_mitigation: readyItem.terrain_mitigation,
      },
    ])
    setMarketReadyItems(prev => prev.filter(i => i.market_item_id !== readyItem.market_item_id))
  }

  async function handleUpgradeWorkshop() {
    const cost = UPGRADE_COSTS[currentBranchLevel]
    if (!cost) {
      alert(`A filial de ${selectedBranch} já opera na capacidade máxima regulamentada (Nível 6).`)
      return
    }
    if (gold < cost) {
      alert(
        `Recursos financeiros insuficientes em tesouraria.\nCusto orçado: ${cost} Ouro. Saldo disponível: ${gold} Ouro.`
      )
      return
    }

    setIsUpgrading(true)
    if (onUpgradeWorkshop) {
      try {
        const res = await onUpgradeWorkshop(activeBranchInfo.key)
        if (res && res.result && res.result.success) {
          if (res.state) {
            setGold(res.state.gold)
          }
          setTransactionLog(l => [
            `[Oficina] Filial de ${selectedBranch} modernizada para o Nível ${res.result.level}.`,
            ...l,
          ])
        } else if (res && res.result && !res.result.success) {
          alert(res.result.message)
        }
      } catch (err) {
        console.error('Erro ao expandir oficina:', err)
      } finally {
        setIsUpgrading(false)
      }
      return
    }

    setGold(g => g - cost)
    setIsUpgrading(false)
  }

  async function handleSell(item: InventoryItem, marginType: string) {
    if (onSellItem) {
      try {
        const res = await onSellItem(item.item_instance_id, marginType)
        if (res && res.result) {
          if (res.result.action === 'sold') {
            setInventory(prev => prev.filter(i => i.item_instance_id !== item.item_instance_id))
            setTransactionLog(l => [
              `[Balcão] ${item.name} faturado por ⬡ ${res.result.final_price} Ouro (${marginType}).`,
              ...l,
            ])
            if (res.state) {
              setGold(res.state.gold)
              setInventory(res.state.inventory)
            }
          } else if (res.result.action === 'counter_offer') {
            setInventory(prev => prev.filter(i => i.item_instance_id !== item.item_instance_id))
            setCounterModal({
              item,
              offer: res.result.counter_offer,
              offerId: res.result.offer_id,
              referencePrice: res.result.reference_price,
              askedPrice: res.result.asked_price,
              demandMultiplier: res.result.demand_multiplier,
            })
          } else {
            setTransactionLog(l => [
              `[Balcão] Oferta de ${item.name} recusada pelo conselho comercial (${marginType}).`,
              ...l,
            ])
          }
          return
        }
      } catch (err) {
        console.warn('Erro ao processar venda no backend:', err)
      }
    }
  }

  async function handleCounterAccept() {
    if (!counterModal) return
    const offerId = counterModal.offerId

    if (onResolveOffer && offerId) {
      try {
        const res = await onResolveOffer(offerId, true)
        if (res && res.state) {
          setGold(res.state.gold)
          setInventory(res.state.inventory)
        }
      } catch (err) {
        console.warn('Erro ao aceitar contraproposta:', err)
      }
    }

    setTransactionLog(l => [
      `[Balcão] Contraproposta de ${counterModal.item.name} homologada por ⬡ ${counterModal.offer} Ouro.`,
      ...l,
    ])
    setCounterModal(null)
  }

  async function handleCounterReject() {
    if (!counterModal) return
    const offerId = counterModal.offerId

    if (onResolveOffer && offerId) {
      try {
        const res = await onResolveOffer(offerId, false)
        if (res && res.state) {
          setInventory(res.state.inventory)
        }
      } catch (err) {
        console.warn('Erro ao rejeitar contraproposta:', err)
      }
    } else {
      setInventory(prev => [...prev, counterModal.item])
    }

    setTransactionLog(l => [
      `[Balcão] Contraproposta de ${counterModal.item.name} rejeitada. Ativo restituído ao almoxarifado.`,
      ...l,
    ])
    setCounterModal(null)
  }

  const selectedRecipe = branchRecipes.find(
    r => (r.recipe_id || r.id) === selectedRecipeId
  ) || branchRecipes[0]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho da Fase */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Fase 2 de 5
            </span>
            <span className="text-xs text-stone-400 font-mono">Planejamento Industrial & Comercial</span>
          </div>
          <h2 className="text-2xl font-black text-amber-100 tracking-wide mt-1">
            Oficina de Manufatura & Balcão de Negócios
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Forja modular com afixos, requisições de matéria-prima e negociação de ativos no mercado.
          </p>
        </div>

        <button
          onClick={onAdvance}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition cursor-pointer self-start md:self-center"
        >
          <span>Concluir Produção & Ir para Tática</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Principais */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 p-1 rounded-xl max-w-md gap-1">
        <button
          onClick={() => setMainTab('oficina')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'oficina'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Hammer className="w-4 h-4 text-amber-500" />
          <span>Oficina de Produção</span>
        </button>
        <button
          onClick={() => setMainTab('balcao')}
          className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
          CONTEÚDO: 4 BANCADAS DE OFICINA (CRAFTING v2)
         ───────────────────────────────────────────── */}
      {mainTab === 'oficina' && (
        <div className="space-y-6">
          {/* Seletor das 4 Bancadas */}
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

          {/* Insumos no Almoxarifado com Ficha Técnica Clicável */}
          <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-stone-400 text-xs uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Estoque de Matérias-Primas da Guilda</span>
              </span>
              <span className="text-[11px] text-stone-500 italic">
                Clique em qualquer insumo para consultar sua Ficha Técnica
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(materials).map(([key, qty]) => (
                <button
                  key={key}
                  onClick={() => handleOpenMaterialSheet(key)}
                  className="bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer group shadow"
                  title="Abrir Ficha Técnica do Insumo"
                >
                  <Info className="w-3 h-3 text-stone-500 group-hover:text-amber-400 transition" />
                  <span>{MATERIAL_LABELS[key] ?? key}:</span>
                  <strong className="text-amber-300 font-mono">{qty}</strong>
                </button>
              ))}
            </div>
          </div>

          {/* Painel Central de Produção Modular (Crafting v2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna 1: Lista de Receitas Base da Bancada */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Ordens de Serviço ({branchRecipes.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {branchRecipes.map(r => {
                  const rid = r.recipe_id || r.id || ''
                  const isSelected = rid === selectedRecipeId
                  return (
                    <div
                      key={rid}
                      onClick={() => setSelectedRecipeId(rid)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-[#1c1917] border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-200">{r.name || r.base_item}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-700 font-mono">
                          {r.slot}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-400 mt-2 font-mono">
                        {r.base_power ? <span>Poder Base: +{r.base_power}</span> : null}
                        {r.energy_restore ? <span>Suprimentos: +{r.energy_restore}</span> : null}
                        {r.market_value_base ? <span>Valor: ⬡ {r.market_value_base}</span> : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Card de Modernização de Bancada */}
              <div className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-200 uppercase">Modernizar Filial</span>
                  </div>
                  <span className="text-xs text-stone-400 font-mono">Nível {currentBranchLevel}/6</span>
                </div>
                {currentBranchLevel < 6 ? (
                  <>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Eleva a probabilidade estatística de obtenção de itens de padrão Ótimo e Lendário.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs font-mono text-stone-300">
                        Custo: <strong className="text-amber-400 font-bold">{UPGRADE_COSTS[currentBranchLevel]} Ouro</strong>
                      </div>
                      <button
                        onClick={handleUpgradeWorkshop}
                        disabled={isUpgrading || gold < (UPGRADE_COSTS[currentBranchLevel] ?? 1000)}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow"
                      >
                        {isUpgrading ? 'Expandindo...' : 'Modernizar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-emerald-400 italic">Filial operando em capacidade máxima regulamentada.</p>
                )}
              </div>
            </div>

            {/* Coluna 2: Configuração de Afixos & Prévia de Forja */}
            <div className="lg:col-span-8 space-y-5">
              {selectedRecipe && (
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-5 shadow-xl space-y-6">
                  {/* Cabeçalho da Base Selecionada */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 font-mono uppercase">
                          Slot: {selectedRecipe.slot}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 font-mono">
                          Nível Mínimo: {selectedRecipe.min_workshop_level ?? 1}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-amber-100 mt-1">
                        {selectedRecipe.name || selectedRecipe.base_item}
                      </h3>
                    </div>

                    {craftOptions && craftOptions.undiscovered_count > 0 && (
                      <span className="text-xs font-mono bg-stone-900 text-stone-400 border border-stone-800 px-3 py-1 rounded-lg self-start sm:self-auto">
                        ⚑ {craftOptions.undiscovered_count} afixos por descobrir
                      </span>
                    )}
                  </div>

                  {/* Seletor de Prefixo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                      <span>Prefixo da Manufatura</span>
                      <span className="text-[11px] text-stone-500 font-normal">Ajusta atributos primários</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => setSelectedPrefixId(null)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between ${
                          selectedPrefixId === null
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Sem Prefixo</span>
                          {selectedPrefixId === null && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1">Sem consumo de matéria-prima adicional</span>
                      </div>

                      {craftOptions?.prefixes.map(pfx => {
                        const isSelected = selectedPrefixId === pfx.affix_id
                        return (
                          <div
                            key={pfx.affix_id}
                            onClick={() => {
                              if (pfx.available) setSelectedPrefixId(pfx.affix_id)
                            }}
                            className={`p-3 rounded-lg border text-xs transition flex flex-col justify-between ${
                              !pfx.available
                                ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-950/40 border-amber-500 text-amber-200 cursor-pointer shadow-md'
                                : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center justify-between">
                                <span>{pfx.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                              </div>
                              <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                                {pfx.effects_description.join(' · ')}
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-stone-800/60 flex items-center justify-between text-[10px]">
                              {pfx.available ? (
                                <span className="text-emerald-400 font-mono">
                                  {pfx.materials.map(m => `${m.quantity}× ${m.name}`).join(', ')}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-mono font-bold">
                                  {pfx.missing_reasons[0] || 'Insumos insuficientes'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Seletor de Sufixo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                      <span>Sufixo Corporativo</span>
                      <span className="text-[11px] text-stone-500 font-normal">Habilita cláusulas e bônus de qualidade</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => setSelectedSuffixId(null)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition flex flex-col justify-between ${
                          selectedSuffixId === null
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>Sem Sufixo</span>
                          {selectedSuffixId === null && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <span className="text-[10px] text-stone-500 mt-1">Sem consumo de matéria-prima adicional</span>
                      </div>

                      {craftOptions?.suffixes.map(sfx => {
                        const isSelected = selectedSuffixId === sfx.affix_id
                        return (
                          <div
                            key={sfx.affix_id}
                            onClick={() => {
                              if (sfx.available) setSelectedSuffixId(sfx.affix_id)
                            }}
                            className={`p-3 rounded-lg border text-xs transition flex flex-col justify-between ${
                              !sfx.available
                                ? 'bg-stone-950/50 border-stone-900 opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-950/40 border-amber-500 text-amber-200 cursor-pointer shadow-md'
                                : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="font-bold flex items-center justify-between">
                                <span>{sfx.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                              </div>
                              <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                                {sfx.effects_description.join(' · ')}
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-stone-800/60 flex items-center justify-between text-[10px]">
                              {sfx.available ? (
                                <span className="text-emerald-400 font-mono">
                                  {sfx.materials.map(m => `${m.quantity}× ${m.name}`).join(', ')}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-mono font-bold">
                                  {sfx.missing_reasons[0] || 'Insumos insuficientes'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Prévia ao Vivo da Ordem de Forja */}
                  {craftPreview && (
                    <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800 gap-2">
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono font-bold">
                            Denominação Contratual Projetada
                          </span>
                          <h4 className="text-base font-black text-amber-300">
                            {craftPreview.final_name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">Total de Insumos:</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {craftPreview.materials_summary.map(m => (
                              <button
                                key={m.material_id}
                                onClick={() => handleOpenMaterialSheet(m.material_id)}
                                className={`text-[11px] px-2 py-0.5 rounded font-mono border transition cursor-pointer ${
                                  m.has_enough
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                    : 'bg-rose-950/60 text-rose-300 border-rose-800'
                                }`}
                                title="Ver Ficha Técnica deste Insumo"
                              >
                                {m.needed}× {m.name} ({m.current})
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tabela de Projeção por Qualidade */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] text-stone-400 uppercase font-bold tracking-wider">
                            Projeção Numérica por Padrão de Qualidade
                          </span>
                          <span className="text-[10px] text-stone-500 font-mono">
                            Chances da Filial (Nível {craftPreview.workshop_level}):{' '}
                            {Object.entries(craftPreview.workshop_chances)
                              .map(([q, pct]) => `${q}: ${pct}%`)
                              .join(' | ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                          {(['Fraco', 'Normal', 'Ótimo', 'Lendário'] as ItemQuality[]).map(q => {
                            const itemStats = craftPreview.qualities[q]
                            const prob = craftPreview.workshop_chances[q] ?? 0
                            return (
                              <div
                                key={q}
                                className={`p-3 rounded-lg border text-xs ${RARITY_CARD_STYLES[q]}`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-[10px] px-2 py-0.2 rounded font-bold ${RARITY_BADGE_STYLES[q]}`}>
                                    {q}
                                  </span>
                                  <span className="font-mono text-[10px] opacity-80">{prob}%</span>
                                </div>
                                <div className="space-y-0.5 mt-2 font-mono text-[11px]">
                                  {itemStats?.power_bonus ? (
                                    <div>Poder: <strong className="text-amber-300">+{itemStats.power_bonus}</strong></div>
                                  ) : null}
                                  {itemStats?.energy_bonus ? (
                                    <div>Suprimentos: <strong className="text-sky-300">+{itemStats.energy_bonus}</strong></div>
                                  ) : null}
                                  {itemStats?.charges ? (
                                    <div>Cargas: <strong className="text-amber-200">{itemStats.charges}</strong></div>
                                  ) : null}
                                  {itemStats?.terrain_mitigation ? (
                                    <div className="text-emerald-300 font-sans text-[10px] font-bold">
                                      🛡 Protege: {TERRAIN_NAMES[itemStats.terrain_mitigation] || itemStats.terrain_mitigation}
                                    </div>
                                  ) : null}
                                  <div className="text-stone-300">Valor: ⬡ {itemStats?.market_value_base} Ouro</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Motivos de Bloqueio se não puder craftar */}
                      {!craftPreview.can_craft && (
                        <div className="bg-rose-950/40 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Ordem de Forja Impedida pelo Controle Interno:</span>
                            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
                              {craftPreview.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Botão de Forjar Ativo */}
                      <button
                        onClick={handleExecuteCraft}
                        disabled={!craftPreview.can_craft || isLoadingCraft}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                          craftPreview.can_craft && !isLoadingCraft
                            ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 hover:brightness-110 shadow-amber-950/50'
                            : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isLoadingCraft ? 'Homologando Forja...' : 'Forjar Ativo Corporativo'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                  <div className="flex gap-4 text-xs mt-2 text-stone-300 font-mono flex-wrap">
                    <span>Slot: {lastCraft.slot_type}</span>
                    {lastCraft.power_bonus ? <span>Poder: +{lastCraft.power_bonus}</span> : null}
                    {lastCraft.energy_bonus ? <span>Suprimentos: +{lastCraft.energy_bonus}</span> : null}
                    {lastCraft.charges ? <span>Cargas: {lastCraft.charges}</span> : null}
                    {lastCraft.terrain_mitigation ? (
                      <span className="text-emerald-300">
                        Mitiga: {TERRAIN_NAMES[lastCraft.terrain_mitigation] || lastCraft.terrain_mitigation}
                      </span>
                    ) : null}
                    <span>Valor Contábil: ⬡ {lastCraft.market_value_base} Ouro</span>
                  </div>
                </div>
              )}
            </div>
          </div>
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

          <div className="flex gap-2 border-b border-stone-800 pb-2 flex-wrap">
            <button
              onClick={() => setMarketSubTab('vender')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                marketSubTab === 'vender'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              Liquidação de Ativos (Balcão)
            </button>
            <button
              onClick={() => setMarketSubTab('comprar_prontos')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                marketSubTab === 'comprar_prontos'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              Itens Prontos ({marketReadyItems.length})
            </button>
            <button
              onClick={() => setMarketSubTab('comprar_insumos')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                marketSubTab === 'comprar_insumos'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              Matérias-Primas ({marketMaterials.length})
            </button>
            <button
              onClick={() => setMarketSubTab('manuais')}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                marketSubTab === 'manuais'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              Manuais de Ofício ({affixManuals.length})
            </button>
          </div>

          {/* Sub-aba 1: Vender Itens no Balcão */}
          {marketSubTab === 'vender' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Inventário Disponível para Alienação Comercial ({inventory.length})
                </h3>
                <span className="text-xs text-stone-500">
                  Preço final depende da margem e da tolerância confidencial do comprador
                </span>
              </div>

              {inventory.length === 0 ? (
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-8 text-center text-stone-500 italic text-xs">
                  Nenhum ativo localizado no almoxarifado corporativo para liquidação mercantil.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map(item => {
                    const isEquipped = isItemEquipped(item.item_instance_id)
                    const isTargetOfBulletin = bulletin?.target === item.slot_type
                    const baseRef = item.market_value_base

                    return (
                      <div
                        key={item.item_instance_id}
                        className={`bg-[#1c1917] border rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md transition-all ${
                          isEquipped
                            ? 'border-stone-800/80 opacity-75'
                            : isTargetOfBulletin
                            ? 'border-amber-500/80 shadow-amber-950/30'
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-amber-100 font-bold text-sm leading-snug">{item.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${RARITY_BADGE_STYLES[item.quality]}`}>
                              {item.quality}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs font-mono text-stone-400">
                            <span>Slot: {item.slot_type}</span>
                            {item.power_bonus ? <span>Poder: +{item.power_bonus}</span> : null}
                            {item.energy_bonus ? <span>Suprimentos: +{item.energy_bonus}</span> : null}
                            {item.charges ? <span>Cargas: {item.charges}</span> : null}
                          </div>

                          <div className="mt-3 pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs font-mono">
                            <span className="text-stone-400">Referência Contábil:</span>
                            <span className="text-amber-300 font-bold">⬡ {baseRef} Ouro</span>
                          </div>

                          {isEquipped && (
                            <div className="mt-2 bg-stone-900 border border-stone-800 text-stone-400 text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5 font-bold">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span>Alocado em Operação (Equipado)</span>
                            </div>
                          )}
                        </div>

                        {/* Botões de Venda por Margem */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-800/50">
                          <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono font-bold block">
                            Orçar Liquidação
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => handleSell(item, 'Promoção')}
                              disabled={isEquipped}
                              className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 py-1.5 px-1 rounded text-[11px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-center"
                              title="0.8x valor base - Liquidação prioritária"
                            >
                              Promoção (0.8x)
                            </button>
                            <button
                              onClick={() => handleSell(item, 'Preço Justo')}
                              disabled={isEquipped}
                              className="bg-sky-950/70 hover:bg-sky-900 border border-sky-800 text-sky-300 py-1.5 px-1 rounded text-[11px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-center"
                              title="1.0x valor base - Margem padrão"
                            >
                              Justo (1.0x)
                            </button>
                            <button
                              onClick={() => handleSell(item, 'Preço Abusivo')}
                              disabled={isEquipped}
                              className="bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 py-1.5 px-1 rounded text-[11px] font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-center"
                              title="1.35x valor base - Margem máxima sujeita a contraproposta"
                            >
                              Abusivo (1.35x)
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-aba 2: Comprar Itens Prontos */}
          {marketSubTab === 'comprar_prontos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Equipamentos Homologados de Fornecedores Externos
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketReadyItems.map(item => (
                  <div
                    key={item.market_item_id}
                    className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-stone-100 font-bold text-sm">{item.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${RARITY_BADGE_STYLES[item.quality]}`}>
                          {item.quality}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-stone-400 mt-2 font-mono">
                        <span>Slot: {item.slot_type}</span>
                        {item.power_bonus ? <span>Poder: +{item.power_bonus}</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                      <span className="text-amber-400 font-mono font-bold text-sm">⬡ {item.price} Ouro</span>
                      <button
                        onClick={() => handleBuyItem(item)}
                        disabled={gold < item.price}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow"
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-aba 3: Comprar Insumos */}
          {marketSubTab === 'comprar_insumos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Mercado Atacadista de Matérias-Primas
                </h3>
                <span className="text-[11px] text-stone-500 italic">
                  Clique no nome do insumo para abrir a Ficha Técnica
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketMaterials.map(mat => (
                  <div
                    key={mat.material_id}
                    className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <button
                          onClick={() => handleOpenMaterialSheet(mat.material_id)}
                          className="text-stone-100 font-bold text-sm hover:text-amber-400 flex items-center gap-1.5 transition text-left cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-stone-500" />
                          <span>{mat.name}</span>
                        </button>
                        <span className="text-xs text-stone-400 font-mono">{mat.available_quantity} disp.</span>
                      </div>
                      <div className="text-xs text-stone-400 font-mono mt-2">
                        Preço Unitário: <strong className="text-amber-300">⬡ {mat.unit_price} Ouro</strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                      <button
                        onClick={() => handleBuyMaterial(mat, 1)}
                        disabled={mat.available_quantity < 1 || gold < mat.unit_price}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleBuyMaterial(mat, 3)}
                        disabled={gold < mat.unit_price * 3}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow"
                      >
                        +3 Lote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-aba 4: Manuais de Ofício (Crafting v2) */}
          {marketSubTab === 'manuais' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Manuais de Ofício Mercantis ({affixManuals.length})</span>
                </h3>
                <span className="text-xs text-stone-500">
                  Adquira manuais corporativos para habilitar novos afixos em suas oficinas
                </span>
              </div>

              {affixManuals.length === 0 ? (
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-8 text-center text-stone-500 italic text-xs">
                  Nenhum manual de ofício disponível no mercado nesta rodada.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {affixManuals.map(manual => (
                    <div
                      key={manual.affix_id}
                      className="bg-[#1c1917] border border-amber-950/60 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-stone-100 font-bold text-sm leading-snug">{manual.name}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                            {manual.kind === 'prefix' ? 'Prefixo' : 'Sufixo'}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-2">
                          Compatível com:{' '}
                          <span className="text-stone-300 font-mono">
                            {manual.slots?.join(', ') || 'Diversos'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                        <span className="text-amber-400 font-mono font-bold text-sm">
                          ⬡ {manual.cost} Ouro
                        </span>
                        <button
                          onClick={() => handleBuyManual(manual.affix_id, manual.cost)}
                          disabled={gold < manual.cost || isBuyingManual === manual.affix_id}
                          className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-4 py-1.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow"
                        >
                          {isBuyingManual === manual.affix_id ? 'Adquirindo...' : 'Adquirir Manual'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Diário de Transações Comerciais */}
          {transactionLog.length > 0 && (
            <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-2">
              <span className="text-stone-400 text-xs uppercase tracking-wider font-bold block">
                Atas de Transações Comerciais
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-xs text-stone-400">
                {transactionLog.map((log, i) => (
                  <p key={i} className="text-amber-300/80">· {log}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: FICHA TÉCNICA DO MATERIAL
         ───────────────────────────────────────────── */}
      {materialSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1917] border border-amber-600/60 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              onClick={() => setMaterialSheetModal(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Insumo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-600/50 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold block">
                  Ficha Técnica de Matéria-Prima
                </span>
                <h3 className="text-lg font-black text-stone-100">
                  {materialSheetModal.material.name}
                </h3>
              </div>
            </div>

            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-stone-950 p-3 rounded-xl border border-stone-800">
              <div>
                <span className="text-stone-500 block">Categoria Fiscal:</span>
                <span className="text-stone-200 font-bold uppercase">{materialSheetModal.material.category}</span>
              </div>
              <div>
                <span className="text-stone-500 block">Preço de Referência:</span>
                <span className="text-amber-400 font-bold">⬡ {materialSheetModal.material.unit_price} Ouro</span>
              </div>
            </div>

            {/* Receitas que usam */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Utilizado nas Ordens de Produção:
              </span>
              {materialSheetModal.used_in_recipes.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Não utilizado em receitas base homologadas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {materialSheetModal.used_in_recipes.map(r => (
                    <span
                      key={r.recipe_id}
                      className="text-xs bg-stone-900 border border-stone-800 text-stone-300 px-2.5 py-1 rounded font-mono"
                    >
                      {r.name} ({r.slot})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Afixos que habilita */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Habilita os Seguintes Afixos:
              </span>
              {materialSheetModal.enables_affixes.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Sem afixos adicionais associados.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {materialSheetModal.enables_affixes.map(a => (
                    <span
                      key={a.affix_id}
                      className="text-xs bg-stone-900 border border-stone-800 text-stone-300 px-2.5 py-1 rounded font-mono"
                    >
                      {a.name} ({a.kind === 'prefix' ? 'Prefixo' : 'Sufixo'})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Fontes de Espólio */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Fontes de Espólio em Masmorras
                </span>
                <span className="text-[10px] text-stone-500 italic">Incursões profundas aumentam a taxa</span>
              </div>
              {materialSheetModal.sources.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Insumo não extraível em masmorras catalogadas.</p>
              ) : (
                <div className="space-y-1.5">
                  {materialSheetModal.sources.map((s, idx) => {
                    const isWeeklyTerrain = state.current_dungeon?.terrain === s.terrain
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          isWeeklyTerrain
                            ? 'bg-amber-950/40 border-amber-600/70 text-amber-200'
                            : 'bg-stone-950 border-stone-800/80 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-bold">{TERRAIN_NAMES[s.terrain] || s.terrain}</span>
                          {isWeeklyTerrain && (
                            <span className="text-[9px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                              Clima Desta Semana
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-right">
                          <span>Sala mín. {s.min_room}</span> ·{' '}
                          <span className="text-amber-300">{Math.round(s.chance * 100)}% de chance</span>
                          {s.boss_only && <span className="text-rose-400 block text-[10px]">Apenas no Boss</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => setMaterialSheetModal(null)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: CONTRAPROPOSTA DO BALCÃO
         ───────────────────────────────────────────── */}
      {counterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1917] border border-amber-600/60 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-amber-200">Contraproposta da Câmara Mercantil</h3>
            <p className="text-xs text-stone-300">
              O comprador analisou sua margem para o ativo <strong className="text-amber-100">{counterModal.item.name}</strong> e formulou uma contraoferta oficial:
            </p>
            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-stone-400">
                <span>Valor de Referência:</span>
                <span>⬡ {counterModal.referencePrice ?? counterModal.item.market_value_base} Ouro</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Preço Orçado:</span>
                <span>⬡ {counterModal.askedPrice ?? '-'} Ouro</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold text-sm pt-2 border-t border-stone-800">
                <span>Oferta em Moeda Corrente:</span>
                <span className="text-base text-amber-300">⬡ {counterModal.offer} Ouro</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCounterReject}
                className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Rejeitar & Manter Ativo
              </button>
              <button
                onClick={handleCounterAccept}
                className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs rounded-xl transition cursor-pointer shadow"
              >
                Aceitar Transação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: POP-UP DE REVELAÇÃO LENDÁRIA
         ───────────────────────────────────────────── */}
      {legendaryItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1c1917] border-2 border-amber-400 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-[0_0_60px_rgba(245,158,11,0.5)]">
            <span className="text-xs bg-amber-400 text-stone-950 font-black px-4 py-1.5 rounded-full uppercase tracking-widest font-mono">
              ★ FORJA LENDÁRIA CONCLUÍDA ★
            </span>
            <div>
              <h3 className="text-2xl font-black text-amber-100">{legendaryItem.name}</h3>
              <p className="text-xs text-amber-300 font-mono mt-1">Multiplicador de 180% Aplicado</p>
            </div>
            <div className="p-4 bg-stone-950 rounded-2xl border border-amber-900/60 text-xs text-stone-300 leading-relaxed font-mono">
              {legendaryItem.specialEffectDescription}
            </div>
            <button
              onClick={() => setLegendaryItem(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg"
            >
              Incorporar ao Patrimônio
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL: BOLETIM DE MERCADO SEMANAL
         ───────────────────────────────────────────── */}
      {bulletinModalOpen && bulletin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1c1917] border-2 border-amber-600/80 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={dismissBulletin}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-600/50 flex items-center justify-center shrink-0">
                <Newspaper className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-mono font-bold block">
                  Gazeta dos Mercadores da Capital
                </span>
                <h3 className="text-sm font-black text-amber-100">
                  Boletim Semanal de Comércio
                </h3>
              </div>
            </div>
            <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <p className="text-xs text-stone-200 leading-relaxed font-serif italic">
                "{bulletin.headline}"
              </p>
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Demanda em Alta:</span>
                <span className="text-amber-300 font-bold">{bulletin.target} (x{bulletin.multiplier})</span>
              </div>
            </div>
            <button
              onClick={dismissBulletin}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
            >
              Ciente das Diretrizes de Mercado
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
