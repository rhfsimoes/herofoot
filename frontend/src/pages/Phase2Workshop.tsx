import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Users,
  Search,
  Star,
  Zap,
  Flame,
  Building2,
  Factory,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Trash2,
  Plus,
  CheckCircle2,
  Package,
  Filter,
  Shield,
} from 'lucide-react'
import {
  MOCK_RECIPES,
  MATERIAL_LABELS,
  WORKSHOP_XP_TABLE,
  WORKSHOP_LEVEL_BENEFITS,
  MOCK_CORPORATIONS,
  MOCK_B2B_CONTRACTS,
  MOCK_ASSEMBLY_WORKERS,
  MOCK_MODULAR_PARTS,
  CORPORATIONS_MAP,
  getDungeonForDay,
  getClimateForDay,
  type GameState,
  type InventoryItem,
  type ItemQuality,
  type WorkshopBranch,
  type Recipe,
  type MarketReadyItem,
  type CraftOptions,
  type CraftPreview,
  type MaterialSheet,
  type VipOrder,
  type ModularPart,
  type B2BContract,
  type AssemblyWorkerInstance,
  type Corporation,
} from '../mockData'
import { useSound } from '../hooks/useSound'
import {
  RARITY_CARD_STYLES,
  RARITY_BADGE_STYLES,
  MATERIAL_RARITY_STYLES,
  getMaterialRarity,
} from '../utils/rarityStyles'
import {
  fetchCraftOptionsBackend,
  fetchCraftPreviewBackend,
  fetchMaterialSheetBackend,
  scoutMarketHeroBackend,
  hireMarketHeroBackend,
  fulfillVipOrderBackend,
  signB2BContractBackend,
  cancelB2BContractBackend,
  hireAssemblyWorkerBackend,
  setWorkerOrderBackend,
  dismissAssemblyWorkerBackend,
  assembleModularItemBackend,
  buyModularPartBackend,
} from '../api'
import OnboardingBanner from '../components/OnboardingBanner'
import EmptyState from '../components/EmptyState'
import Tooltip from '../components/Tooltip'

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
  onStateUpdate?: (newState: Partial<GameState>) => void
  onSignB2BContract?: (contractId: string) => Promise<any>
  onCancelB2BContract?: (contractId: string) => Promise<any>
  onHireAssemblyWorker?: (workerId: string, assignedBranch: string) => Promise<any>
  onSetWorkerOrder?: (workerInstanceId: string, targetRecipe: string) => Promise<any>
  onDismissAssemblyWorker?: (workerInstanceId: string) => Promise<any>
  onAssembleModularItem?: (partIds: string[], baseName: string, isTinkering: boolean) => Promise<any>
  onBuyModularPart?: (partId: string, quantity: number) => Promise<any>
}

type MainTab = 'oficina' | 'complexo_b2b' | 'balcao' | 'transferencias'
type B2BSubTab = 'fornecedores' | 'operarios' | 'montagem' | 'spot'
type MarketSubTab = 'vender' | 'comprar_prontos'

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


export default function Phase2Workshop({
  state,
  onAdvance,
  onCraft,
  onUpgradeWorkshop,
  onBuyMaterial: _onBuyMaterial,
  onBuyItem,
  onSellItem,
  onResolveOffer,
  onLearnAffix: _onLearnAffix,
  onStateUpdate,
  onSignB2BContract,
  onCancelB2BContract,
  onHireAssemblyWorker,
  onSetWorkerOrder,
  onDismissAssemblyWorker,
  onAssembleModularItem,
  onBuyModularPart,
}: Phase2WorkshopProps) {
  const [mainTab, setMainTab] = useState<MainTab>('complexo_b2b')
  const [selectedBranch, setSelectedBranch] = useState<WorkshopBranch>('Ferragem')
  const [marketSubTab, setMarketSubTab] = useState<MarketSubTab>('vender')
  const [b2bSubTab, setB2bSubTab] = useState<B2BSubTab>('montagem')

  // Estados B2B e Linha de Montagem
  const [warehouseParts, setWarehouseParts] = useState<Record<string, number>>(state.warehouse_parts ?? {})
  const [activeB2bContracts, setActiveB2bContracts] = useState<B2BContract[]>(state.active_b2b_contracts ?? [])
  const [assemblyLineWorkers, setAssemblyLineWorkers] = useState<AssemblyWorkerInstance[]>(state.assembly_line_workers ?? [])
  const [corporateExclusivityTags, setCorporateExclusivityTags] = useState<string[]>(state.corporate_exclusivity_tags ?? [])

  // Bancada de Montagem Modular (3 Slots Funcionais: Prefixo, Base, Sufixo)
  const [slottedPrefix, setSlottedPrefix] = useState<string | null>(null)
  const [slottedBase, setSlottedBase] = useState<string | null>(null)
  const [slottedSuffix, setSlottedSuffix] = useState<string | null>(null)

  const selectedModularParts = useMemo(() => {
    return [slottedPrefix, slottedBase, slottedSuffix].filter(Boolean) as string[]
  }, [slottedPrefix, slottedBase, slottedSuffix])

  const [modularBaseName, setModularBaseName] = useState<string>('')
  const [isAssembling, setIsAssembling] = useState<boolean>(false)
  const [lastModularResult, setLastModularResult] = useState<{
    item: InventoryItem
    isTinkering: boolean
    tinkeringSuccess: boolean
    overclock: boolean
    message: string
  } | null>(null)

  // Estados de Ação B2B
  const [isSigningB2B, setIsSigningB2B] = useState<boolean>(false)
  const [isHiringWorker, setIsHiringWorker] = useState<boolean>(false)
  const [selectedHireBranch, setSelectedHireBranch] = useState<string>('Ferragem')
  const [spotSearchQuery, setSpotSearchQuery] = useState<string>('')
  const [spotCorpFilter, setSpotCorpFilter] = useState<string>('todos')
  const [spotQuantities, setSpotQuantities] = useState<Record<string, number>>({})
  const [isBuyingSpot, setIsBuyingSpot] = useState<boolean>(false)
  const [b2bCorpFilter, setB2bCorpFilter] = useState<string>('todos')
  const [modularCorpFilter, setModularCorpFilter] = useState<string>('todos')
  const [modularSlotFilter, setModularSlotFilter] = useState<string>('todos')
  const [modularSearchQuery, setModularSearchQuery] = useState<string>('')

  // Mercado de Transferências (Onda 4)
  const marketListings = state.transfer_market?.listings ?? []
  const scoutFee = state.transfer_market?.scout_fee ?? 150
  const currentTeamSize = state.transfer_market?.team_size ?? (state.team?.length ?? 0)
  const maxTeamSize = state.transfer_market?.max_team_size ?? 12
  const [isScoutingOrHiring, setIsScoutingOrHiring] = useState<boolean>(false)

  async function handleScout(heroId: string) {
    setIsScoutingOrHiring(true)
    try {
      const res = await scoutMarketHeroBackend(heroId)
      if (res && res.success) {
        if (res.state) {
          onStateUpdate?.(res.state)
        }
      } else {
        alert(res?.message || 'Falha na auditoria de olheiro.')
      }
    } catch {
      alert('Erro de conexão com o corpo de olheiros.')
    } finally {
      setIsScoutingOrHiring(false)
    }
  }

  async function handleHire(heroId: string) {
    setIsScoutingOrHiring(true)
    try {
      const res = await hireMarketHeroBackend(heroId)
      if (res && res.success) {
        if (res.state) {
          onStateUpdate?.(res.state)
        }
      } else {
        alert(res?.message || 'Falha ao efetivar contratação.')
      }
    } catch {
      alert('Erro de conexão ao homologar contratação.')
    } finally {
      setIsScoutingOrHiring(false)
    }
  }

  const { play: playSfx } = useSound()
  const [inventory, setInventory] = useState<InventoryItem[]>(state.inventory)
  const [materials, setMaterials] = useState<Record<string, number>>(state.materials)
  const [gold, setGold] = useState<number>(state.gold)
  const [lastCraft, setLastCraft] = useState<InventoryItem | null>(null)
  interface CraftResultInfo {
    item: InventoryItem
    xpGained: number
    isTinkering: boolean
    tinkeringSuccess: boolean
    branch: WorkshopBranch
  }
  const [lastCraftResult, setLastCraftResult] = useState<CraftResultInfo | null>(null)

  // ─────────────────────────────────────────────
  // AÇÕES DO COMPLEXO B2B & LINHA DE MONTAGEM
  // ─────────────────────────────────────────────
  async function handleSignContract(contractId: string) {
    setIsSigningB2B(true)
    try {
      if (onSignB2BContract) {
        const res = await onSignB2BContract(contractId)
        if (res && res.success) {
          playSfx('craft_success')
          if (res.active_b2b_contracts) setActiveB2bContracts(res.active_b2b_contracts)
          if (res.corporate_exclusivity_tags) setCorporateExclusivityTags(res.corporate_exclusivity_tags)
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao assinar convênio B2B.')
        }
      } else {
        const res = await signB2BContractBackend(contractId)
        if (res && res.success) {
          playSfx('craft_success')
          if (res.active_b2b_contracts) setActiveB2bContracts(res.active_b2b_contracts)
          if (res.corporate_exclusivity_tags) setCorporateExclusivityTags(res.corporate_exclusivity_tags)
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao assinar convênio B2B.')
        }
      }
    } catch {
      alert('Erro de comunicação com o registro notarial corporativo.')
    } finally {
      setIsSigningB2B(false)
    }
  }

  async function handleCancelContract(contractId: string) {
    if (!confirm('Deseja realmente rescindir esta cota corporativa? A remessa semanal será interrompida.')) return
    setIsSigningB2B(true)
    try {
      if (onCancelB2BContract) {
        const res = await onCancelB2BContract(contractId)
        if (res && res.success) {
          if (res.active_b2b_contracts) setActiveB2bContracts(res.active_b2b_contracts)
          if (res.corporate_exclusivity_tags) setCorporateExclusivityTags(res.corporate_exclusivity_tags)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao rescindir contrato.')
        }
      } else {
        const res = await cancelB2BContractBackend(contractId)
        if (res && res.success) {
          if (res.active_b2b_contracts) setActiveB2bContracts(res.active_b2b_contracts)
          if (res.corporate_exclusivity_tags) setCorporateExclusivityTags(res.corporate_exclusivity_tags)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao rescindir contrato.')
        }
      }
    } catch {
      alert('Erro ao processar rescisão notarial.')
    } finally {
      setIsSigningB2B(false)
    }
  }

  async function handleHireWorker(workerId: string, branch: string) {
    setIsHiringWorker(true)
    try {
      if (onHireAssemblyWorker) {
        const res = await onHireAssemblyWorker(workerId, branch)
        if (res && res.success) {
          playSfx('hire')
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao admitir operário.')
        }
      } else {
        const res = await hireAssemblyWorkerBackend(workerId, branch)
        if (res && res.success) {
          playSfx('hire')
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao admitir operário.')
        }
      }
    } catch {
      alert('Erro ao registrar admissão no conselho de artífices.')
    } finally {
      setIsHiringWorker(false)
    }
  }

  async function handleSetWorkerOrder(workerInstanceId: string, targetRecipe: string) {
    try {
      if (onSetWorkerOrder) {
        const res = await onSetWorkerOrder(workerInstanceId, targetRecipe)
        if (res && res.success) {
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao atualizar diretriz de produção.')
        }
      } else {
        const res = await setWorkerOrderBackend(workerInstanceId, targetRecipe)
        if (res && res.success) {
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao atualizar diretriz de produção.')
        }
      }
    } catch {
      alert('Erro de comunicação ao gravar ordem fabril.')
    }
  }

  async function handleDismissWorker(workerInstanceId: string) {
    if (!confirm('Deseja homologar a demissão deste operário fabril?')) return
    try {
      if (onDismissAssemblyWorker) {
        const res = await onDismissAssemblyWorker(workerInstanceId)
        if (res && res.success) {
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao dispensar operário.')
        }
      } else {
        const res = await dismissAssemblyWorkerBackend(workerInstanceId)
        if (res && res.success) {
          if (res.assembly_line_workers) setAssemblyLineWorkers(res.assembly_line_workers)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao dispensar operário.')
        }
      }
    } catch {
      alert('Erro ao processar rescisão de mão de obra.')
    }
  }

  function handleAttachPart(part: ModularPart) {
    const pId = part.part_id || part.id
    const role =
      part.slot_role ||
      (part.part_type === 'hilt' || part.part_type === 'guard' || pId.includes('prefix')
        ? 'prefix'
        : part.part_type === 'blade' || part.part_type === 'plating' || part.part_type === 'license' || part.part_type === 'ration' || pId.includes('base')
        ? 'base'
        : 'suffix')
    if (role === 'prefix') {
      setSlottedPrefix(prev => (prev === pId ? null : pId))
    } else if (role === 'base') {
      setSlottedBase(prev => (prev === pId ? null : pId))
    } else {
      setSlottedSuffix(prev => (prev === pId ? null : pId))
    }
  }

  function handleEjectSlot(role: 'prefix' | 'base' | 'suffix') {
    if (role === 'prefix') setSlottedPrefix(null)
    if (role === 'base') setSlottedBase(null)
    if (role === 'suffix') setSlottedSuffix(null)
  }

  function handleClearBench() {
    setSlottedPrefix(null)
    setSlottedBase(null)
    setSlottedSuffix(null)
  }

  async function handleAssembleModular(isTinkering: boolean) {
    if (!slottedPrefix || !slottedBase || !slottedSuffix) {
      alert('A bancada modular requer o preenchimento dos 3 slots funcionais: [Prefixo], [Base / Chassi] e [Sufixo].')
      return
    }
    const partsToAssemble = [slottedPrefix, slottedBase, slottedSuffix]
    setIsAssembling(true)
    try {
      if (onAssembleModularItem) {
        const res = await onAssembleModularItem(partsToAssemble, modularBaseName, isTinkering)
        if (res && res.success) {
          if (res.overclock) playSfx('legendary')
          else playSfx('craft_success')
          if (res.item) {
            setLastModularResult({
              item: res.item,
              isTinkering,
              tinkeringSuccess: res.tinkering_success ?? !res.item.name.includes('Gororoba'),
              overclock: !!res.overclock,
              message: res.message || 'Montagem modular concluída com sucesso.',
            })
          }
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
          handleClearBench()
        } else {
          alert(res?.message || 'Falha ao processar montagem modular.')
        }
      } else {
        const res = await assembleModularItemBackend(partsToAssemble, modularBaseName, isTinkering)
        if (res && res.success) {
          if (res.overclock) playSfx('legendary')
          else playSfx('craft_success')
          if (res.item) {
            setLastModularResult({
              item: res.item,
              isTinkering,
              tinkeringSuccess: res.tinkering_success ?? !res.item.name.includes('Gororoba'),
              overclock: !!res.overclock,
              message: res.message || 'Montagem modular concluída com sucesso.',
            })
          }
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
          handleClearBench()
        } else {
          alert(res?.message || 'Falha ao processar montagem modular.')
        }
      }
    } catch {
      alert('Erro mecânico durante o processo de montagem.')
    } finally {
      setIsAssembling(false)
    }
  }

  async function handleBuySpot(partId: string) {
    const qty = spotQuantities[partId] ?? 1
    if (qty <= 0) return
    setIsBuyingSpot(true)
    try {
      if (onBuyModularPart) {
        const res = await onBuyModularPart(partId, qty)
        if (res && res.success) {
          playSfx('coin')
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao adquirir peças no mercado spot.')
        }
      } else {
        const res = await buyModularPartBackend(partId, qty)
        if (res && res.success) {
          playSfx('coin')
          if (res.warehouse_parts) setWarehouseParts(res.warehouse_parts)
          if (res.state) onStateUpdate?.(res.state)
        } else {
          alert(res?.message || 'Falha ao adquirir peças no mercado spot.')
        }
      }
    } catch {
      alert('Erro de transação no balcão de peças spot.')
    } finally {
      setIsBuyingSpot(false)
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS & DADOS DERIVADOS B2B
  // ─────────────────────────────────────────────
  const selectedModularPartObjects = useMemo(() => {
    return selectedModularParts
      .map(id => MOCK_MODULAR_PARTS.find(p => p.part_id === id || p.id === id))
      .filter(Boolean) as ModularPart[]
  }, [selectedModularParts])

  const modularBrandCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of selectedModularPartObjects) {
      const b = p.corp_id || p.brand_id || 'corp_generic'
      map[b] = (map[b] || 0) + 1
    }
    return map
  }, [selectedModularPartObjects])

  const distinctBrands = Object.keys(modularBrandCounts)
  const isInterBrandAssembly = distinctBrands.length > 1
  const baseModularPower = useMemo(() => {
    return selectedModularPartObjects.reduce((acc, p) => acc + (p.power_bonus || 0), 0)
  }, [selectedModularPartObjects])

  const estimatedModularPower = isInterBrandAssembly
    ? Math.round(baseModularPower * 1.15)
    : Math.round(baseModularPower * 1.05)

  const allB2BCorporations = useMemo(() => {
    if (state?.b2b_catalog?.corporations && Array.isArray(state.b2b_catalog.corporations) && state.b2b_catalog.corporations.length > 0) {
      return state.b2b_catalog.corporations as Corporation[]
    }
    return MOCK_CORPORATIONS
  }, [state?.b2b_catalog?.corporations])

  const allB2BContracts = useMemo(() => {
    if (state?.b2b_catalog?.contracts && typeof state.b2b_catalog.contracts === 'object' && Object.keys(state.b2b_catalog.contracts).length > 0) {
      return Object.values(state.b2b_catalog.contracts) as B2BContract[]
    }
    return MOCK_B2B_CONTRACTS
  }, [state?.b2b_catalog?.contracts])

  const filteredB2BCorporations = useMemo(() => {
    if (b2bCorpFilter === 'todos') return allB2BCorporations
    return allB2BCorporations.filter(c => c.id === b2bCorpFilter || c.branch === b2bCorpFilter || c.slot_focus === b2bCorpFilter)
  }, [b2bCorpFilter, allB2BCorporations])

  const filteredSpotParts = useMemo(() => {
    return MOCK_MODULAR_PARTS.filter(p => {
      const matchSearch =
        !spotSearchQuery ||
        p.name.toLowerCase().includes(spotSearchQuery.toLowerCase()) ||
        Boolean(p.catalog_description && p.catalog_description.toLowerCase().includes(spotSearchQuery.toLowerCase()))
      const matchCorp = spotCorpFilter === 'todos' || p.corp_id === spotCorpFilter || p.brand_id === spotCorpFilter
      return matchSearch && matchCorp
    })
  }, [spotSearchQuery, spotCorpFilter])

  const warehousePartsList = useMemo(() => {
    return Object.entries(warehouseParts)
      .filter(([, qty]) => qty > 0)
      .map(([partId, qty]) => {
        const part = MOCK_MODULAR_PARTS.find(p => p.part_id === partId || p.id === partId)
        const inferredSlotRole: 'prefix' | 'base' | 'suffix' =
          part?.slot_role ||
          (partId.includes('prefix') || partId.includes('hilt') || partId.includes('guard') || partId.includes('pin') || partId.includes('nozzle') || partId.includes('extract')
            ? 'prefix'
            : partId.includes('core') || partId.includes('suffix') || partId.includes('gem') || partId.includes('stamp') || partId.includes('canteen') || partId.includes('filter')
            ? 'suffix'
            : 'base')

        const inferredSlot =
          part?.compatible_slots?.[0] ||
          (partId.includes('mercurius')
            ? 'Alvará de Risco'
            : partId.includes('crown_rations')
            ? 'Provisão Logística'
            : 'Arsenal Ofensivo')

        const inferredCorp =
          part?.corp_id ||
          (partId.includes('mercurius')
            ? 'corp_mercurius'
            : partId.includes('crown_rations')
            ? 'corp_crown_rations'
            : 'corp_generic')

        const pObj: ModularPart = part || {
          id: partId,
          part_id: partId,
          corp_id: inferredCorp,
          name: partId,
          branch: 'Ferragem' as WorkshopBranch,
          part_type: 'modular_part',
          compatible_slots: [inferredSlot],
          tier: 1,
          base_cost: 50,
          market_price_base: 50,
          power_bonus: 10,
          catalog_description: 'Peça técnica modular registrada no almoxarifado.',
          slot_role: inferredSlotRole,
        }
        const role: 'prefix' | 'base' | 'suffix' =
          pObj.slot_role || inferredSlotRole
        return {
          partId,
          qty,
          role,
          part: pObj,
        }
      })
      .filter(item => {
        if (modularCorpFilter !== 'todos' && item.part.corp_id !== modularCorpFilter) {
          return false
        }
        if (modularSlotFilter !== 'todos' && !item.part.compatible_slots?.includes(modularSlotFilter)) {
          return false
        }
        if (modularSearchQuery.trim()) {
          const q = modularSearchQuery.toLowerCase()
          const matchName = item.part.name.toLowerCase().includes(q)
          const matchDesc = Boolean(item.part.catalog_description?.toLowerCase().includes(q))
          const matchMod = Boolean(item.part.name_modifier?.toLowerCase().includes(q))
          if (!matchName && !matchDesc && !matchMod) return false
        }
        return true
      })
  }, [warehouseParts, modularCorpFilter, modularSlotFilter, modularSearchQuery])

  const prefixWarehouseParts = useMemo(
    () => warehousePartsList.filter(item => item.role === 'prefix'),
    [warehousePartsList]
  )
  const baseWarehouseParts = useMemo(
    () => warehousePartsList.filter(item => item.role === 'base'),
    [warehousePartsList]
  )
  const suffixWarehouseParts = useMemo(
    () => warehousePartsList.filter(item => item.role === 'suffix'),
    [warehousePartsList]
  )

  // Crafting v2 Seleções
  const recipesList: Recipe[] = useMemo(
    () => (state.recipes ? Object.values(state.recipes) : MOCK_RECIPES),
    [state.recipes]
  )
  const branchRecipes = useMemo(
    () => recipesList.filter(r => r.branch === selectedBranch),
    [recipesList, selectedBranch]
  )
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
  const bulletin = state.market?.bulletin
  const bulletinWeekKey = `bulletin_dismissed_w${state.week || state.day}`
  const [bulletinModalOpen, setBulletinModalOpen] = useState<boolean>(() => {
    if (!bulletin?.headline) return false
    return !sessionStorage.getItem(bulletinWeekKey)
  })
  const [prevBulletinWeekKey, setPrevBulletinWeekKey] = useState<string>(bulletinWeekKey)
  if (bulletinWeekKey !== prevBulletinWeekKey) {
    setPrevBulletinWeekKey(bulletinWeekKey)
    if (bulletin?.headline && !sessionStorage.getItem(bulletinWeekKey)) {
      setBulletinModalOpen(true)
    }
  }

  const [isUpgrading, setIsUpgrading] = useState<boolean>(false)
  const [transactionLog, setTransactionLog] = useState<string[]>([])

  const [marketReadyItems, setMarketReadyItems] = useState<MarketReadyItem[]>(
    state.market?.ready_items_for_sale ?? []
  )

  // Encomenda VIP da Nobreza
  const vipOrder: VipOrder | null = (state.market?.active_vip_order as VipOrder) ?? null
  const [vipSelectedItemId, setVipSelectedItemId] = useState<string>('')
  const [isFulfillingVip, setIsFulfillingVip] = useState<boolean>(false)
  const [vipFeedback, setVipFeedback] = useState<string | null>(null)

  const QUALITY_RANK: Record<string, number> = { Fraco: 0, Normal: 1, Ótimo: 2, Lendário: 3 }

  const vipEligibleItems = vipOrder
    ? (state.inventory ?? []).filter(
        (it) =>
          it.slot_type?.toLowerCase() === vipOrder.item_type?.toLowerCase() &&
          QUALITY_RANK[it.quality] >= QUALITY_RANK[vipOrder.min_quality]
      )
    : []

  async function handleFulfillVip() {
    if (!vipSelectedItemId || !vipOrder) return
    setIsFulfillingVip(true)
    setVipFeedback(null)
    try {
      const res = await fulfillVipOrderBackend(vipSelectedItemId)
      if (res?.success) {
        setVipFeedback(`✅ Encomenda entregue. +${vipOrder.reward_gold} ⬡ e +${vipOrder.reward_confidence}% Confiança.`)
        if (res.state) onStateUpdate?.(res.state)
        setVipSelectedItemId('')
      } else {
        setVipFeedback(`❌ ${res?.message || 'Entrega recusada pela Câmara.'}`)
      }
    } catch {
      setVipFeedback('❌ Falha de comunicação com o Cartório da Câmara.')
    } finally {
      setIsFulfillingVip(false)
    }
  }


  const activeBranchInfo = BRANCHES.find(b => b.name === selectedBranch)!
  const currentBranchLevel = state.workshop_levels[activeBranchInfo.key] ?? 1
  const currentBranchXp = state.workshop_xp?.[selectedBranch] ?? 0
  const xpConfig = WORKSHOP_XP_TABLE[currentBranchLevel] ?? { xp_to_next: null, upgrade_cost: 0 }
  const xpReq = xpConfig.xp_to_next
  const upgradeCost = xpConfig.upgrade_cost
  const hasEnoughXp = xpReq === null ? false : currentBranchXp >= xpReq
  const hasEnoughGold = gold >= upgradeCost
  const xpPercent = xpReq ? Math.min(100, Math.round((currentBranchXp / xpReq) * 100)) : 100

  function handleSelectBranch(branchName: WorkshopBranch) {
    setSelectedBranch(branchName)
    const newBranchRecipes = recipesList.filter(r => r.branch === branchName)
    const firstInBranch = newBranchRecipes[0]
    if (firstInBranch) {
      const rid = firstInBranch.recipe_id || firstInBranch.id || ''
      setSelectedRecipeId(rid)
      setSelectedPrefixId(null)
      setSelectedSuffixId(null)
    }
  }

  const computeLocalPreview = useCallback(
    (
      recipeId: string,
    prefixId: string | null,
    suffixId: string | null,
    currentMaterials: Record<string, number>,
    branchLevel: number
  ): CraftPreview => {
    const recipe = recipesList.find(r => (r.recipe_id || r.id) === recipeId) || recipesList[0]
    const baseName = recipe?.base_item || recipe?.name || 'Item de Campanha'
    const reasons: string[] = []

    const minLevel = recipe?.min_workshop_level ?? 1
    if (branchLevel < minLevel) {
      reasons.push(
        `Nível de bancada insuficiente (${branchLevel}/${minLevel} na filial de ${recipe?.branch ?? 'Ferragem'}). Requer Forja Experimental (Tinkering).`
      )
    }

    const materialsSummary: { material_id: string; name: string; needed: number; current: number; has_enough: boolean }[] = []
    const ings = recipe?.ingredients || []
    ings.forEach((ing: any) => {
      const mid = ing.material_id || ing.item_id || 'mat_iron_ore'
      const name = ing.label || ing.name || MATERIAL_LABELS[mid] || mid
      const needed = ing.quantity || 1
      const current = currentMaterials[mid] ?? 0
      const hasEnough = current >= needed
      if (!hasEnough) {
        reasons.push(`Falta ${needed - current}× ${name}`)
      }
      materialsSummary.push({
        material_id: mid,
        name,
        needed,
        current,
        has_enough: hasEnough,
      })
    })

    if (prefixId) {
      const pfxMatId = 'mat_granite_dust'
      const pfxMatName = MATERIAL_LABELS[pfxMatId] || 'Pó de Granito'
      const pfxQty = 1
      const pfxCurr = currentMaterials[pfxMatId] ?? 0
      const hasEnough = pfxCurr >= pfxQty
      if (!hasEnough) {
        reasons.push(`Falta ${pfxQty - pfxCurr}× ${pfxMatName} para o prefixo`)
      }
      materialsSummary.push({
        material_id: pfxMatId,
        name: pfxMatName,
        needed: pfxQty,
        current: pfxCurr,
        has_enough: hasEnough,
      })
    }

    if (suffixId) {
      const sfxMatId = 'mat_ember_coal'
      const sfxMatName = MATERIAL_LABELS[sfxMatId] || 'Brasa de Carvão'
      const sfxQty = 1
      const sfxCurr = currentMaterials[sfxMatId] ?? 0
      const hasEnough = sfxCurr >= sfxQty
      if (!hasEnough) {
        reasons.push(`Falta ${sfxQty - sfxCurr}× ${sfxMatName} para o sufixo`)
      }
      materialsSummary.push({
        material_id: sfxMatId,
        name: sfxMatName,
        needed: sfxQty,
        current: sfxCurr,
        has_enough: hasEnough,
      })
    }

    const pfxPart = prefixId ? `${prefixId} ` : ''
    const sfxPart = suffixId ? ` ${suffixId}` : ''
    const finalName = `${pfxPart}${baseName}${sfxPart}`.trim()

    const basePower = recipe?.base_power ?? 20
    const baseValue = recipe?.market_value_base ?? 150
    const qualities: Record<ItemQuality, any> = {
      Fraco: { power_bonus: Math.round(basePower * 0.7), market_value_base: Math.round(baseValue * 0.6) },
      Normal: { power_bonus: basePower, market_value_base: baseValue },
      Ótimo: { power_bonus: Math.round(basePower * 1.3), market_value_base: Math.round(baseValue * 1.4) },
      Lendário: { power_bonus: Math.round(basePower * 1.8), market_value_base: Math.round(baseValue * 2.5) },
    }

    const chancesMap: Record<number, Record<ItemQuality, number>> = {
      1: { Fraco: 50, Normal: 40, Ótimo: 10, Lendário: 0 },
      2: { Fraco: 35, Normal: 45, Ótimo: 18, Lendário: 2 },
      3: { Fraco: 20, Normal: 50, Ótimo: 25, Lendário: 5 },
      4: { Fraco: 10, Normal: 50, Ótimo: 30, Lendário: 10 },
      5: { Fraco: 5, Normal: 45, Ótimo: 35, Lendário: 15 },
      6: { Fraco: 0, Normal: 40, Ótimo: 40, Lendário: 20 },
    }

    return {
      success: true,
      can_craft: reasons.length === 0,
      reasons,
      final_name: finalName,
      materials_summary: materialsSummary,
      qualities,
      workshop_chances: chancesMap[branchLevel] || chancesMap[1],
      workshop_level: branchLevel,
      branch: recipe?.branch ?? 'Ferragem',
    }
  }, [recipesList])

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
      if (active) {
        if (preview) {
          setCraftPreview(preview)
        } else {
          setCraftPreview(
            computeLocalPreview(
              selectedRecipeId,
              selectedPrefixId,
              selectedSuffixId,
              materials,
              currentBranchLevel
            )
          )
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [selectedRecipeId, selectedPrefixId, selectedSuffixId, materials, currentBranchLevel, computeLocalPreview])

  const [prevPropState, setPrevPropState] = useState(state)
  if (state !== prevPropState) {
    setPrevPropState(state)
    setInventory(state.inventory)
    setMaterials(state.materials)
    setGold(state.gold)
    if (state.market?.ready_items_for_sale) setMarketReadyItems(state.market.ready_items_for_sale)
    if (state.warehouse_parts) setWarehouseParts(state.warehouse_parts)
    if (state.active_b2b_contracts) setActiveB2bContracts(state.active_b2b_contracts)
    if (state.assembly_line_workers) setAssemblyLineWorkers(state.assembly_line_workers)
    if (state.corporate_exclusivity_tags) setCorporateExclusivityTags(state.corporate_exclusivity_tags)
  }

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
  async function handleExecuteCraft(isTinkering: boolean = false) {
    if (!selectedRecipeId || isLoadingCraft) return
    const rec = recipesList.find(r => (r.recipe_id || r.id) === selectedRecipeId)
    const minLevel = rec?.min_workshop_level ?? 1
    const actualTinkering = isTinkering || minLevel > currentBranchLevel

    if (!actualTinkering && !craftPreview?.can_craft) {
      if (craftPreview?.reasons) {
        alert(`Não é possível forjar este ativo corporativo:\n- ${craftPreview.reasons.join('\n- ')}`)
      }
      return
    }

    if (actualTinkering && craftPreview?.materials_summary?.some(m => !m.has_enough)) {
      alert('Almoxarifado sem insumos suficientes para realizar o procedimento experimental de forja.')
      return
    }

    setIsLoadingCraft(true)
    const payload = {
      recipe_id: selectedRecipeId,
      branch: selectedBranch,
      prefix_id: selectedPrefixId,
      suffix_id: selectedSuffixId,
      is_tinkering: actualTinkering,
    }

    if (actualTinkering) {
      playSfx('sfx_craft_tinkering')
    }

    if (onCraft) {
      try {
        const res = await onCraft(payload)
        const isSuccess = (res?.result?.success ?? res?.success) ?? false
        if (res && isSuccess) {
          const item: InventoryItem = res.result?.item || (res as any).item
          const xpGained: number = res.result?.xp_gained ?? (actualTinkering ? (res.result?.tinkering_success ? (minLevel >= 3 ? 90 : 38) : 5) : (minLevel >= 3 ? 60 : (minLevel === 2 ? 25 : 10)))
          const tinkeringSuccess: boolean = res.result?.tinkering_success ?? (!item?.name?.toLowerCase().includes('gororoba') && item?.quality !== 'Fraco')

          if (item) {
            setLastCraft(item)
            setLastCraftResult({
              item,
              xpGained,
              isTinkering: actualTinkering,
              tinkeringSuccess,
              branch: selectedBranch,
            })
          }
          if (res.state) {
            setInventory(res.state.inventory)
            setMaterials(res.state.materials)
            setGold(res.state.gold)
            onStateUpdate?.(res.state)
          }

          if (actualTinkering) {
            if (tinkeringSuccess) {
              playSfx('sfx_forge_success')
              setTransactionLog(l => [
                `[Forja Experimental] Inovação técnica validada! '${item?.name}' forjado com +50% XP (+${xpGained} XP).`,
                ...l,
              ])
            } else {
              playSfx('sfx_forge_fail')
              setTransactionLog(l => [
                `[Forja Experimental] Falha técnica operacional: Gororoba produzida (+${xpGained} XP). Fórmula arquivada nos registros.`,
                ...l,
              ])
            }
          } else {
            playSfx('sfx_forge_success')
            setTransactionLog(l => [
              `[Oficina] Produção de '${item?.name || 'Ativo'}' autorizada pelo controle de qualidade (+${xpGained} XP).`,
              ...l,
            ])
          }

          if (item?.quality === 'Lendário') {
            setLegendaryItem({
              name: item.name,
              prefix: selectedPrefixId || 'Obra-Prima',
              baseName: craftPreview?.final_name || item.name,
              suffix: selectedSuffixId || 'do Apogeu',
              specialEffectDescription: 'Multiplicador de 180% de poder + ativação integral de cláusula mística especial.',
            })
          }
        } else if (res && !isSuccess) {
          alert(res.result?.message || res.message || 'Falha na homologação do processo de forja.')
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
    const xpConfig = WORKSHOP_XP_TABLE[currentBranchLevel]
    const cost = xpConfig?.upgrade_cost ?? 500
    const xpReq = xpConfig?.xp_to_next
    if (currentBranchLevel >= 6 || xpReq === null) {
      alert(`A filial de ${selectedBranch} já opera na capacidade máxima regulamentada (Nível 6 — Ateliê Imperial de Referência).`)
      return
    }
    if (currentBranchXp < xpReq) {
      alert(
        `XP da Bancada insuficiente para homologação de expansão.\nRequerido: ${xpReq} XP acumulados na filial de ${selectedBranch}.\nXP Atual: ${currentBranchXp} XP.`
      )
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
        const isSuccess = (res?.result?.success ?? res?.success) ?? false
        if (res && isSuccess) {
          if (res.state) {
            setGold(res.state.gold)
            onStateUpdate?.(res.state)
          }
          playSfx('sfx_league_promoted')
          setTransactionLog(l => [
            `[Oficina] Filial de ${selectedBranch} modernizada para o Nível ${res.result?.level || res.level || currentBranchLevel + 1} pela Câmara de Mercadores.`,
            ...l,
          ])
        } else if (res && !isSuccess) {
          alert(res.result?.message || res.message || 'Falha ao modernizar oficina.')
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
          const isSold = res.result.action === 'sold' || res.result.status === 'vendido'
          const isCounter = res.result.action === 'counter_offer' || res.result.status === 'contraproposta'

          if (isSold) {
            setInventory(prev => prev.filter(i => i.item_instance_id !== item.item_instance_id))
            setTransactionLog(l => [
              `[Balcão] ${item.name} faturado por ⬡ ${res.result.final_price || res.result.gold_received} Ouro (${marginType}).`,
              ...l,
            ])
            if (res.state) {
              setGold(res.state.gold)
              setInventory(res.state.inventory)
            }
          } else if (isCounter) {
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
            if (res.state) {
              setInventory(res.state.inventory)
              setGold(res.state.gold)
            }
            setTransactionLog(l => [
              `[Balcão] ${res.result.message || `Oferta de ${item.name} recusada pelo conselho comercial (${marginType}). Ativo retido sob custódia da guilda.`}`,
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

  const isTinkeringRequired = Boolean(selectedRecipe && (selectedRecipe.min_workshop_level ?? 1) > currentBranchLevel)
  const tinkeringDiff = isTinkeringRequired && selectedRecipe ? Math.max(1, (selectedRecipe.min_workshop_level ?? 1) - currentBranchLevel) : 0
  const tinkeringSuccessChance = isTinkeringRequired ? Math.max(0.05, 1 - tinkeringDiff * 0.35) : 1
  const tinkeringSuccessPct = Math.round(tinkeringSuccessChance * 100)
  const hasMissingMaterials = craftPreview?.materials_summary
    ? craftPreview.materials_summary.some(m => !m.has_enough)
    : false

  return (
    <div className="max-w-7xl mx-auto">
      {/* Banner de Onboarding — aparece apenas na primeira visita à Fase 2 */}
      <OnboardingBanner phase={2} />
      <div className="p-6 space-y-6">
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

      {/* Briefing Pré-Operacional da Próxima Incursão */}
      {(() => {
        const dungeon = state.current_dungeon || getDungeonForDay(state.day)
        const climate = dungeon?.climate || getClimateForDay(state.day)
        return (
          <div className="bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-stone-950/80 border border-amber-800/50 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-600/60 flex items-center justify-center shrink-0 text-amber-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Reconhecimento da Semana #{state.day}
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-stone-200 font-bold">{dungeon.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                    {dungeon.terrain_label || dungeon.terrain}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Clima Previsto: <strong className="text-sky-300">{climate.name}</strong> · Penalidade se desprotegido: <span className="text-rose-300 font-semibold">-{Math.round((dungeon.power_penalty_pct ?? 0.12) * 100)}% Poder</span> / <span className="text-amber-300 font-semibold">+{climate.energy_cost_extra} Dreno</span>.
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-amber-300/90 bg-stone-950/90 border border-amber-900/60 px-3 py-1.5 rounded-lg shrink-0">
              💡 Requisito Tático: Forje um <strong>Alvará de Risco</strong> com mitigação para {dungeon.terrain_label || 'o bioma'}.
            </div>
          </div>
        )
      })()}

      {/* Tabs Principais da Fase 2 */}
      <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 rounded-xl max-w-4xl gap-1.5 flex-wrap">
        <button
          onClick={() => {
            setMainTab('complexo_b2b')
            setB2bSubTab('montagem')
          }}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'complexo_b2b' && b2bSubTab === 'montagem'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-500" />
          <span>Montagem Modular</span>
        </button>
        <button
          onClick={() => {
            setMainTab('complexo_b2b')
            setB2bSubTab('fornecedores')
          }}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'complexo_b2b' && b2bSubTab === 'fornecedores'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-500" />
          <span>Patrocínios B2B ({activeB2bContracts.length}/3)</span>
        </button>
        <button
          onClick={() => {
            setMainTab('complexo_b2b')
            setB2bSubTab('operarios')
          }}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'complexo_b2b' && b2bSubTab === 'operarios'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Factory className="w-4 h-4 text-amber-500" />
          <span>Linha de Montagem ({assemblyLineWorkers.length}/4)</span>
        </button>
        <button
          onClick={() => {
            setMainTab('complexo_b2b')
            setB2bSubTab('spot')
          }}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'complexo_b2b' && b2bSubTab === 'spot'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Package className="w-4 h-4 text-amber-500" />
          <span>Mercado Spot de Peças</span>
        </button>
        <button
          onClick={() => setMainTab('balcao')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'balcao'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Balcão & Loja</span>
        </button>
        <button
          onClick={() => setMainTab('transferencias')}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mainTab === 'transferencias'
              ? 'bg-[#1c1917] border border-amber-600/50 text-amber-300 shadow-md'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>Bolsa de Heróis ({marketListings.length})</span>
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
              const bXp = state.workshop_xp?.[branch.key] ?? 0
              const bReq = WORKSHOP_XP_TABLE[lvl]?.xp_to_next
              const isSelected = selectedBranch === branch.name
              const progressPct = bReq ? Math.min(100, Math.round((bXp / bReq) * 100)) : 100

              return (
                <div
                  key={branch.name}
                  onClick={() => handleSelectBranch(branch.name)}
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
                      <span>XP {lvl < 6 ? `(Nv ${lvl}→${lvl + 1})` : '(Mestre)'}</span>
                      <span>{bReq ? `${bXp}/${bReq}` : '100%'}</span>
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

          {/* Painel de Experiência & Progressão Técnica da Bancada Selecionada */}
          <div className="bg-gradient-to-r from-[#1c1917] via-[#26201a] to-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-700/60 flex items-center justify-center shadow-inner shrink-0">
                  <activeBranchInfo.icon className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-amber-100 uppercase tracking-wide">
                      Filial de {selectedBranch}
                    </h2>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/70 text-amber-300 shadow">
                      {currentBranchLevel < 6 ? `Nível ${currentBranchLevel} de 6` : 'Nível 6 — Ateliê Imperial'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel]?.title}: {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel]?.summary}
                  </p>
                </div>
              </div>

              {/* Resumo de XP & Status */}
              <div className="text-left md:text-right">
                <span className="text-xs text-stone-300 font-mono block">
                  {currentBranchLevel < 6 && xpReq !== null ? (
                    <>
                      XP da Bancada: <strong className="text-amber-300 font-bold text-sm">{currentBranchXp}</strong> / {xpReq} XP{' '}
                      <span className="text-stone-400 text-[11px] font-semibold">(Nível {currentBranchLevel} → {currentBranchLevel + 1})</span>
                    </>
                  ) : (
                    <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      Capacidade Máxima Homologada (Ateliê Mestre)
                    </span>
                  )}
                </span>
                {currentBranchLevel < 6 && (
                  <span className="text-[10px] text-stone-500 font-mono">
                    {hasEnoughXp ? (
                      <span className="text-emerald-400 font-bold">✓ Cota de XP atingida para modernização</span>
                    ) : (
                      <span>Faltam {xpReq! - currentBranchXp} XP para autorização de expansão</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Barra de Progresso Animada em Gradiente Âmbar/Ouro */}
            <div className="space-y-1.5">
              <div className="w-full bg-stone-950/90 rounded-full h-3 overflow-hidden border border-stone-800 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-amber-700 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
                  style={{ width: `${currentBranchLevel >= 6 ? 100 : xpPercent}%` }}
                />
              </div>
            </div>

            {/* Destaque dos Benefícios do Próximo Nível (Roadmap & Lore Corporativo) */}
            {currentBranchLevel < 6 && (
              <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-200">
                    Benefícios da Próxima Homologação (Nível {currentBranchLevel + 1} — {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel + 1]?.title}):
                  </span>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel + 1]?.summary}
                    {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel + 1]?.branchBonus?.[selectedBranch] && (
                      <span className="block text-amber-300/90 font-medium mt-0.5">
                        ★ Bônus Exclusivo de {selectedBranch}: {WORKSHOP_LEVEL_BENEFITS[currentBranchLevel + 1]?.branchBonus?.[selectedBranch]}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
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
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(materials).map(([key, qty]) => {
                const rarity = getMaterialRarity(key)
                const rStyle = MATERIAL_RARITY_STYLES[rarity]
                return (
                  <button
                    key={key}
                    onClick={() => handleOpenMaterialSheet(key)}
                    className={`${rStyle.bg} hover:brightness-125 border ${rStyle.border} ${rStyle.glow} text-stone-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 transition cursor-pointer group shadow`}
                    title={`Abrir Ficha Técnica: ${MATERIAL_LABELS[key] ?? key} (${rarity})`}
                  >
                    <span className={`w-2 h-2 rounded-full ${rStyle.dot} shrink-0`} />
                    <span className="font-medium text-stone-200">{MATERIAL_LABELS[key] ?? key}:</span>
                    <strong className="text-amber-300 font-mono">{qty}</strong>
                    <span className={rStyle.badge}>{rarity}</span>
                    <Info className="w-3 h-3 text-stone-500 group-hover:text-amber-400 transition ml-0.5" />
                  </button>
                )
              })}
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
                        <div className="flex items-center gap-1.5">
                          {((r.min_workshop_level ?? 1) > currentBranchLevel) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-950/80 border border-orange-600/70 text-orange-300 font-mono font-bold">
                              Tinkering (Nv {r.min_workshop_level})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-700 font-mono">
                            {r.slot}
                          </span>
                        </div>
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
                {currentBranchLevel < 6 && xpReq !== null ? (
                  <>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Homologação de expansão na Câmara dos Mercadores para liberar processos avançados de forja.
                    </p>
                    <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Custo em Tesouraria:</span>
                        <span className={hasEnoughGold ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                          ⬡ {upgradeCost} Ouro
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">XP da Bancada Requerida:</span>
                        <span className={hasEnoughXp ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {currentBranchXp} / {xpReq} XP {hasEnoughXp ? '✓ Aprovado' : `(Falta ${xpReq - currentBranchXp})`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleUpgradeWorkshop}
                      disabled={isUpgrading || !hasEnoughGold || !hasEnoughXp}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-black py-2.5 rounded-lg text-xs transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      {isUpgrading
                        ? 'Homologando Expansão...'
                        : !hasEnoughXp
                        ? `XP Insuficiente (${currentBranchXp}/${xpReq})`
                        : !hasEnoughGold
                        ? `Ouro Insuficiente (${gold}/${upgradeCost})`
                        : `Modernizar para Nível ${currentBranchLevel + 1}`}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-emerald-400 italic">Filial operando em capacidade máxima regulamentada (Nível 6 — Ateliê Imperial).</p>
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
                      {/* Insumos Base Homologados com Tag de Raridade */}
                      {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap text-xs pt-1.5 mt-1 border-t border-stone-800/60">
                          <span className="text-stone-400 font-mono text-[11px]">Insumos Base:</span>
                          {selectedRecipe.ingredients.map((ing, idx) => {
                            const mid = ing.item_id || 'mat_iron_ore'
                            const name = ing.label || MATERIAL_LABELS[mid] || mid
                            const rarity = getMaterialRarity(mid, name)
                            const rStyle = MATERIAL_RARITY_STYLES[rarity]
                            const userHas = materials[mid] ?? 0
                            const hasEnough = userHas >= ing.quantity
                            return (
                              <button
                                key={idx}
                                onClick={() => handleOpenMaterialSheet(mid)}
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono border flex items-center gap-1.5 transition cursor-pointer ${
                                  hasEnough
                                    ? 'bg-stone-900 border-stone-700 text-stone-200 hover:border-amber-500'
                                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                                }`}
                                title={`Abrir Ficha Técnica: ${name} (${rarity})`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${rStyle.dot} shrink-0`} />
                                <span>{ing.quantity}× {name}</span>
                                <span className={rStyle.badge}>{rarity}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
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
                        const hasMats = pfx.materials.every(m => (materials[m.material_id] ?? 0) >= m.quantity)
                        const isAvailable = pfx.available || hasMats
                        return (
                          <div
                            key={pfx.affix_id}
                            onClick={() => {
                              setSelectedPrefixId(isSelected ? null : pfx.affix_id)
                            }}
                            className={`p-3 rounded-lg border text-xs transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                                : isAvailable
                                ? 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                                : 'bg-stone-950/50 border-stone-900 opacity-60 text-stone-400'
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
                              {isAvailable ? (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {pfx.materials.map(m => {
                                    const r = getMaterialRarity(m.material_id, m.name)
                                    const rStyle = MATERIAL_RARITY_STYLES[r]
                                    return (
                                      <span key={m.material_id} className="text-emerald-400 font-mono flex items-center gap-1">
                                        <span>{m.quantity}× {m.name}</span>
                                        <span className={rStyle.badge}>{r}</span>
                                      </span>
                                    )
                                  })}
                                </div>
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
                        const hasMats = sfx.materials.every(m => (materials[m.material_id] ?? 0) >= m.quantity)
                        const isAvailable = sfx.available || hasMats
                        return (
                          <div
                            key={sfx.affix_id}
                            onClick={() => {
                              setSelectedSuffixId(isSelected ? null : sfx.affix_id)
                            }}
                            className={`p-3 rounded-lg border text-xs transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                                : isAvailable
                                ? 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                                : 'bg-stone-950/50 border-stone-900 opacity-60 text-stone-400'
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
                              {isAvailable ? (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {sfx.materials.map(m => {
                                    const r = getMaterialRarity(m.material_id, m.name)
                                    const rStyle = MATERIAL_RARITY_STYLES[r]
                                    return (
                                      <span key={m.material_id} className="text-emerald-400 font-mono flex items-center gap-1">
                                        <span>{m.quantity}× {m.name}</span>
                                        <span className={rStyle.badge}>{r}</span>
                                      </span>
                                    )
                                  })}
                                </div>
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
                            {craftPreview.materials_summary.map(m => {
                              const r = getMaterialRarity(m.material_id, m.name)
                              const rStyle = MATERIAL_RARITY_STYLES[r]
                              return (
                                <button
                                  key={m.material_id}
                                  onClick={() => handleOpenMaterialSheet(m.material_id)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg font-mono border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                    m.has_enough
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                                      : 'bg-rose-950/40 text-rose-300 border-rose-800'
                                  }`}
                                  title={`Ver Ficha Técnica: ${m.name} (${r})`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${rStyle.dot} shrink-0`} />
                                  <span>{m.needed}× {m.name} ({m.current})</span>
                                  <span className={rStyle.badge}>{r}</span>
                                </button>
                              )
                            })}
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

                      {/* Bloco de Ação: Forja Padrão vs Forja Experimental (Tinkering) */}
                      {isTinkeringRequired ? (
                        <div className="bg-gradient-to-b from-[#2a170d] via-[#1e130b] to-[#17100a] border-2 border-amber-600/80 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
                          {/* Cabeçalho do Card de Tinkering */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-800/40">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-500/70 flex items-center justify-center shrink-0 shadow">
                                <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
                              </div>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                                  Protocolo de Risco Técnico
                                </span>
                                <h4 className="text-sm sm:text-base font-black text-amber-100">
                                  Ordem de Manufatura de Alto Risco — Forja Experimental (Tinkering)
                                </h4>
                              </div>
                            </div>

                            {/* Badge Dinâmica com Chance de Sucesso */}
                            <div
                              className={`px-3 py-1.5 rounded-lg border font-mono font-black text-xs flex items-center gap-1.5 self-start sm:self-center shadow ${
                                tinkeringSuccessPct >= 60
                                  ? 'bg-amber-950/90 border-amber-500/80 text-amber-300'
                                  : tinkeringSuccessPct >= 30
                                  ? 'bg-orange-950/90 border-orange-500/80 text-orange-300'
                                  : 'bg-rose-950/90 border-rose-600/80 text-rose-300'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>
                                Chance de Sucesso: {tinkeringSuccessPct}% (
                                {tinkeringSuccessPct >= 60
                                  ? 'Risco Moderado'
                                  : tinkeringSuccessPct >= 30
                                  ? 'Alto Risco'
                                  : 'Risco Crítico'}
                                )
                              </span>
                            </div>
                          </div>

                          {/* Alerta do Laudo Pericial */}
                          <div className="bg-stone-950/90 border border-amber-900/50 rounded-lg p-3 text-xs space-y-1.5 text-stone-300">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300">
                              <Info className="w-3.5 h-3.5 text-amber-400" />
                              <span>Laudo Técnico & Homologação Permanente:</span>
                            </div>
                            <p className="italic text-stone-300 text-[11px] leading-relaxed">
                              &ldquo;Em caso de falha mecânica, o lote resultará em Gororoba Comercializável, mas a fórmula técnica será homologada definitivamente nos arquivos da guilda.&rdquo;
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] text-stone-400 font-mono border-t border-stone-800/80">
                              <span>• Sucesso: Item Completo + <strong className="text-amber-300">+50% XP Bônus</strong></span>
                              <span>• Falha: Refugo (20 Ouro) + <strong className="text-amber-300">+5 XP</strong> + Receita Homologada</span>
                            </div>
                          </div>

                          {/* Bloqueio por falta de insumos se houver */}
                          {hasMissingMaterials && (
                            <div className="bg-rose-950/50 border border-rose-800 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                              <span>Almoxarifado sem insumos suficientes para realizar o procedimento experimental de bancada.</span>
                            </div>
                          )}

                          {/* Botão de Forjar Experimentalmente */}
                          <button
                            onClick={() => handleExecuteCraft(true)}
                            disabled={hasMissingMaterials || isLoadingCraft}
                            className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition cursor-pointer border ${
                              !hasMissingMaterials && !isLoadingCraft
                                ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 text-stone-950 hover:brightness-110 shadow-amber-950/70 border-amber-400'
                                : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Flame className="w-4 h-4 text-stone-950" />
                            <span>{isLoadingCraft ? 'Iniciando Forja de Alto Risco...' : 'Assumir Risco e Forjar Experimentalmente'}</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Motivos de Bloqueio se não puder craftar */}
                          {!craftPreview.can_craft && (
                            <div className="bg-rose-950/40 border border-rose-800 rounded-lg p-3 text-xs text-rose-300 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Ordem de Forja Impedida pelo Almoxarifado:</span>
                                <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
                                  {craftPreview.reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Botão de Forjar Ativo Padrão */}
                          <button
                            onClick={() => handleExecuteCraft(false)}
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Card do Último Craft com Tratamento Overgeared & Badges de Tinkering / XP */}
              {(lastCraftResult || lastCraft) && (
                <div
                  className={`rounded-xl p-5 shadow-2xl transition-all border ${
                    lastCraftResult?.isTinkering
                      ? lastCraftResult.tinkeringSuccess
                        ? 'bg-[#241a0e] border-amber-500/80 shadow-amber-950/40'
                        : 'bg-[#1e1514] border-amber-700/60 shadow-red-950/30'
                      : RARITY_CARD_STYLES[((lastCraftResult?.item || lastCraft!).quality as ItemQuality) || 'Normal']
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-800/80 gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-black text-amber-200">
                        Laudo de Inspeção do Artesão
                      </span>
                      {lastCraftResult && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-400 font-mono">
                          Filial de {lastCraftResult.branch}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {lastCraftResult?.isTinkering && (
                        lastCraftResult.tinkeringSuccess ? (
                          <span className="text-[11px] px-3 py-1 rounded-full font-black bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 text-stone-950 border border-yellow-200 shadow flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Inovação Técnica Homologada! (+50% XP)
                          </span>
                        ) : (
                          <span className="text-[11px] px-3 py-1 rounded-full font-black bg-amber-950 border border-amber-600 text-amber-300 shadow flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Falha Operacional: Gororoba Produzida (Fórmula Homologada nos Arquivos)
                          </span>
                        )
                      )}

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          RARITY_BADGE_STYLES[((lastCraftResult?.item || lastCraft!).quality as ItemQuality) || 'Normal']
                        }`}
                      >
                        {(lastCraftResult?.item || lastCraft!).quality}
                      </span>

                      {/* Badge de XP obtido */}
                      {lastCraftResult && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-amber-950/90 border border-amber-600/70 text-amber-300 shadow">
                          +{lastCraftResult.xpGained} XP
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-extrabold text-base text-stone-100">
                    {(lastCraftResult?.item || lastCraft!).name}
                  </p>
                  {lastCraftResult?.isTinkering && !lastCraftResult.tinkeringSuccess && (
                    <p className="text-xs text-amber-400/80 mt-1 italic">
                      Refugo de forja disponível para liquidação rápida no Balcão por irrisórios 20 Ouro. O projeto técnico foi homologado definitivamente no catálogo da guilda.
                    </p>
                  )}

                  <div className="flex gap-4 text-xs mt-3 text-stone-300 font-mono flex-wrap pt-2 border-t border-stone-800/60">
                    <span>Slot: {(lastCraftResult?.item || lastCraft!).slot_type}</span>
                    {(lastCraftResult?.item || lastCraft!).power_bonus ? (
                      <span>Poder: +{(lastCraftResult?.item || lastCraft!).power_bonus}</span>
                    ) : null}
                    {(lastCraftResult?.item || lastCraft!).energy_bonus ? (
                      <span>Suprimentos: +{(lastCraftResult?.item || lastCraft!).energy_bonus}</span>
                    ) : null}
                    {(lastCraftResult?.item || lastCraft!).charges ? (
                      <span>Cargas: {(lastCraftResult?.item || lastCraft!).charges}</span>
                    ) : null}
                    {(lastCraftResult?.item || lastCraft!).terrain_mitigation ? (
                      <span className="text-emerald-300">
                        Mitiga: {TERRAIN_NAMES[(lastCraftResult?.item || lastCraft!).terrain_mitigation!] || (lastCraftResult?.item || lastCraft!).terrain_mitigation}
                      </span>
                    ) : null}
                    <span>Valor Contábil: ⬡ {(lastCraftResult?.item || lastCraft!).market_value_base} Ouro</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          CONTEÚDO: COMPLEXO B2B & LINHA DE MONTAGEM
         ───────────────────────────────────────────── */}
      {mainTab === 'complexo_b2b' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-tabs do Complexo B2B */}
          <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
            <button
              onClick={() => setB2bSubTab('fornecedores')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                b2bSubTab === 'fornecedores'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-950/40'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Convênios B2B ({activeB2bContracts.length} Ativos)</span>
            </button>
            <button
              onClick={() => setB2bSubTab('operarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                b2bSubTab === 'operarios'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-950/40'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>Linha de Montagem ({assemblyLineWorkers.length}/4)</span>
            </button>
            <button
              onClick={() => setB2bSubTab('montagem')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                b2bSubTab === 'montagem'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-950/40'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Bancada Modular (Tinkering)</span>
            </button>
            <button
              onClick={() => setB2bSubTab('spot')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                b2bSubTab === 'spot'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-950/40'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Mercado Spot de Peças</span>
            </button>
          </div>

          {/* ════════════════════════════════════════════
              SUB-TAB 1: FORNECEDORES & CONVÊNIOS B2B
             ════════════════════════════════════════════ */}
          {b2bSubTab === 'fornecedores' && (
            <div className="space-y-6">
              {/* Banner Corporativo Notarial */}
              <div className="bg-gradient-to-r from-[#1c1917] via-[#26201a] to-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-700/60 flex items-center justify-center shadow-inner shrink-0">
                      <Building2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-amber-100 uppercase tracking-wide">
                        Portal Notarial de Convênios B2B
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Homologação de cotas semanais de suprimentos de conglomerados e indústrias artesanais da Liga.
                      </p>
                    </div>
                  </div>

                  {/* Resumo de Custos e Cláusulas */}
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-stone-950/80 border border-stone-800 rounded-lg px-3 py-2 text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Royalties Semanais</span>
                      <span className="text-sm font-mono font-bold text-rose-400">
                        -⬡ {activeB2bContracts.reduce((sum, c) => sum + (c.weekly_royalty ?? 0), 0)} /sem
                      </span>
                    </div>
                    <div className="bg-stone-950/80 border border-stone-800 rounded-lg px-3 py-2 text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Convênios Vigentes</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {activeB2bContracts.length} / 3 Homologados
                      </span>
                    </div>
                    {(state.b2b_slots_locked ?? 0) > 0 && (
                      <div className="bg-stone-950/80 border border-amber-800/80 rounded-lg px-3 py-2 text-right">
                        <span className="text-[10px] text-amber-400 uppercase font-bold block">Quarentena Rescisória</span>
                        <span className="text-sm font-mono font-bold text-amber-300">
                          {state.b2b_slots_locked} Vaga(s) Travada(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags de Exclusividade Ativas */}
                {corporateExclusivityTags.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Cláusulas de Exclusividade Registradas:
                    </span>
                    {corporateExclusivityTags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtro de Corporações */}
              <div className="flex items-center gap-3 bg-stone-950/40 p-2 rounded-lg border border-stone-800/60">
                <span className="text-xs text-stone-400 font-bold">Filtrar Conglomerado:</span>
                <select
                  value={b2bCorpFilter}
                  onChange={e => setB2bCorpFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                >
                  <option value="todos">Todos os Conglomerados Industriais</option>
                  {allB2BCorporations.map(corp => (
                    <option key={corp.id} value={corp.id}>
                      {corp.name} ({corp.slot_focus || corp.branch})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid de Corporações e Contratos */}
              <div className="space-y-6">
                {filteredB2BCorporations.map(corp => {
                  const corpContracts = allB2BContracts.filter(c => c.corp_id === corp.id)
                  const rivalCorp = allB2BCorporations.find(c => c.id === corp.rival_corp_id)
                  const hasRivalExclusive = Boolean(
                    corp.rival_corp_id &&
                    activeB2bContracts.some(c => c.corp_id === corp.rival_corp_id && c.is_exclusive)
                  )

                  const corpXp = state.brand_xp?.[corp.id] ?? 0
                  const corpLevel = Math.min(10, Math.max(1, 1 + Math.floor(corpXp / 50)))
                  const xpInCurrentLevel = corpXp % 50
                  const nextLevelXp = corpLevel >= 10 ? null : corpLevel * 50
                  const progressPct = corpLevel >= 10 ? 100 : Math.min(100, Math.max(5, (xpInCurrentLevel / 50) * 100))

                  return (
                    <div
                      key={corp.id}
                      className="bg-[#1c1917] border border-stone-800 rounded-xl p-5 shadow-lg space-y-4"
                    >
                      {/* Cabeçalho da Corporação */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-amber-200">{corp.name}</h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300">
                              Compartimento: {corp.slot_focus || corp.branch}
                            </span>
                            {corp.rival_corp_id && rivalCorp && (
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Rivalidade Direta: {rivalCorp.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400 mt-1">{corp.description}</p>
                          <p className="text-[11px] text-amber-400/80 mt-0.5 italic">
                            Especialidade: {corp.specialty}
                          </p>
                        </div>

                        {hasRivalExclusive && (
                          <div className="bg-rose-950/80 border border-rose-700 rounded-lg p-2 text-rose-200 text-xs flex items-center gap-2 max-w-sm">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>
                              Embargo Corporativo: Cláusula de exclusividade ativa com {rivalCorp?.name}.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Barra de Relacionamento Comercial (Brand XP) */}
                      <div className="bg-stone-950/70 border border-amber-900/40 rounded-lg p-3 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-amber-200 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-400" />
                              Relacionamento Comercial: <span className="font-mono text-white">Nível {corpLevel}</span>
                            </span>
                            {corpLevel >= 7 ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono">
                                PARCEIRO OURO
                              </span>
                            ) : corpLevel >= 3 ? (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-400/50 font-mono">
                                PARCEIRO PRATA
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-700 font-mono">
                                PARCEIRO BRONZE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-stone-400">
                            {corpLevel >= 10
                              ? 'Nível Máximo Homologado'
                              : `${corpXp} / ${nextLevelXp} XP (${50 - xpInCurrentLevel} XP p/ Nv. ${corpLevel + 1})`}
                          </span>
                        </div>
                        <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-800">
                          <div
                            className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-stone-500">
                          <span>Nv. 1: Bronze (0 XP)</span>
                          <span className={corpLevel >= 3 ? 'text-amber-400 font-bold' : ''}>
                            Nv. 3: Prata (100 XP) {corpLevel >= 3 ? '✓' : ''}
                          </span>
                          <span className={corpLevel >= 7 ? 'text-amber-400 font-bold' : ''}>
                            Nv. 7: Ouro (300 XP) {corpLevel >= 7 ? '✓' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Contratos da Corporação */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {corpContracts.map(contract => {
                          const isActive = activeB2bContracts.some(c => c.contract_id === contract.contract_id)
                          const isBlocked = !isActive && hasRivalExclusive

                          const req = contract.requirements
                          const minConfidence = req?.min_confidence ?? 0
                          const requiresPrevTier = req?.requires_previous_tier

                          const currentConfidence = state.contractor_confidence ?? 50
                          const isConfidenceMet = currentConfidence >= minConfidence

                          const requiredBrandLevel = contract.tier === 'Ouro' ? 7 : contract.tier === 'Prata' ? 3 : 1
                          const isBrandLevelMet = corpLevel >= requiredBrandLevel

                          const sameCorpActive = activeB2bContracts.filter(c => c.corp_id === contract.corp_id)
                          const tierOrder: Record<string, number> = { Bronze: 1, Prata: 2, Ouro: 3 }
                          const isPrevTierMet = !requiresPrevTier || sameCorpActive.some(c => (tierOrder[c.tier] ?? 1) >= (tierOrder[requiresPrevTier] ?? 1))

                          const allReqsMet = isConfidenceMet && isPrevTierMet && isBrandLevelMet
                          const isUpgrade = sameCorpActive.length > 0 && !isActive

                          const slotsLocked = state.b2b_slots_locked ?? 0
                          const totalOccupiedSlots = activeB2bContracts.length + slotsLocked
                          const isSlotsFull = totalOccupiedSlots >= 3
                          const canAffordRoyalty = (state.gold ?? 0) >= contract.weekly_royalty

                          return (
                            <div
                              key={contract.contract_id}
                              className={`rounded-xl p-4 border flex flex-col justify-between transition ${
                                isActive
                                  ? 'bg-emerald-950/30 border-emerald-600/70 shadow-emerald-950/30'
                                  : isBlocked
                                  ? 'bg-stone-900/40 border-stone-800 opacity-60'
                                  : 'bg-stone-900/80 border-stone-800 hover:border-amber-700/60 shadow'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                                      contract.tier === 'Ouro'
                                        ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                                        : contract.tier === 'Prata'
                                        ? 'bg-slate-900 border-slate-400 text-slate-200'
                                        : 'bg-stone-900 border-amber-800 text-amber-600'
                                    }`}
                                  >
                                    Cota {contract.tier}
                                  </span>

                                  {isActive && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-500 text-emerald-200 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Convênio Ativo
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-xs font-bold text-stone-100">{contract.title}</h4>
                                <p className="text-[11px] text-stone-400 leading-relaxed">
                                  {contract.description}
                                </p>

                                {/* Requisitos de Homologação */}
                                <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-[11px]">
                                  <div className="flex items-center justify-between pb-1 border-b border-stone-800/60">
                                    <span className="text-stone-400 font-bold uppercase text-[9px] tracking-wider">
                                      Requisitos de Homologação:
                                    </span>
                                    {allReqsMet ? (
                                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Atendidos
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Pendentes
                                      </span>
                                    )}
                                  </div>

                                  {minConfidence > 0 && (
                                    <div className="flex items-center justify-between font-mono text-[10px]">
                                      <span className="text-stone-400">Confiança Contratante:</span>
                                      <span className={isConfidenceMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        {currentConfidence} / {minConfidence} {isConfidenceMet ? '✓' : '✗'}
                                      </span>
                                    </div>
                                  )}

                                  {requiredBrandLevel > 1 && (
                                    <div className="flex items-center justify-between font-mono text-[10px]">
                                      <span className="text-stone-400">Relacionamento Corporativo:</span>
                                      <span className={isBrandLevelMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        Nv. {corpLevel} / Nv. {requiredBrandLevel} ({corpXp} XP) {isBrandLevelMet ? '✓' : '✗'}
                                      </span>
                                    </div>
                                  )}

                                  {requiresPrevTier && (
                                    <div className="flex items-center justify-between font-mono text-[10px]">
                                      <span className="text-stone-400">Parceria Prévia:</span>
                                      <span className={isPrevTierMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        Cota {requiresPrevTier} Ativa {isPrevTierMet ? '✓' : '✗'}
                                      </span>
                                    </div>
                                  )}

                                  {minConfidence === 0 && !requiresPrevTier && requiredBrandLevel === 1 && (
                                    <div className="text-[10px] text-stone-500 italic">
                                      Homologação livre com alvará da Coroa.
                                    </div>
                                  )}
                                </div>

                                {/* Métricas da Cota */}
                                <div className="space-y-1 pt-2 border-t border-stone-800/80 text-xs font-mono">
                                  <div className="flex justify-between text-stone-300">
                                    <span>Royalty Semanal:</span>
                                    <span className="text-rose-400 font-bold">⬡ {contract.weekly_royalty} /sem</span>
                                  </div>
                                  <div className="flex justify-between text-stone-300">
                                    <span>Desconto Spot:</span>
                                    <span className="text-emerald-400 font-bold">
                                      -{Math.round(contract.discount_pct * 100)}%
                                    </span>
                                  </div>
                                </div>

                                {/* Remessa Semanal de Peças */}
                                {contract.weekly_shipment && contract.weekly_shipment.length > 0 && (
                                  <div className="pt-2 border-t border-stone-800/60">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                                      Remessa Semanal (Almoxarifado):
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {contract.weekly_shipment.map((s, idx) => {
                                        const pObj = MOCK_MODULAR_PARTS.find(
                                          p => p.part_id === s.part_id || p.id === s.part_id
                                        )
                                        return (
                                          <span
                                            key={idx}
                                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300"
                                          >
                                            +{s.quantity}x {pObj?.name ?? s.part_id}
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {contract.is_exclusive && (
                                  <div className="pt-1">
                                    <span className="text-[10px] font-semibold text-amber-400/90 flex items-center gap-1">
                                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                                      Cláusula de Exclusividade Imperial
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Ação de Contrato */}
                              <div className="mt-4 pt-3 border-t border-stone-800">
                                {isActive ? (
                                  <button
                                    onClick={() => handleCancelContract(contract.contract_id)}
                                    disabled={isSigningB2B}
                                    className="w-full py-2 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800 hover:bg-rose-900/60 transition cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Rescindir Convênio</span>
                                  </button>
                                ) : isBlocked ? (
                                  <button
                                    disabled
                                    className="w-full py-2 rounded-lg text-xs font-bold text-stone-600 bg-stone-950 border border-stone-800 cursor-not-allowed flex items-center justify-center gap-1.5"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Embargado por Rival</span>
                                  </button>
                                ) : !allReqsMet ? (
                                  <button
                                    disabled
                                    className="w-full py-2 rounded-lg text-xs font-bold text-stone-500 bg-stone-950 border border-rose-900/40 cursor-not-allowed flex items-center justify-center gap-1.5"
                                    title="Sua guilda não atende a todos os requisitos de confiança, modernização de filial, nível de relacionamento ou escalão prévio desta corporação."
                                  >
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Requisitos Pendentes</span>
                                  </button>
                                ) : isSlotsFull && !isUpgrade ? (
                                  <button
                                    disabled
                                    className="w-full py-2 rounded-lg text-xs font-bold text-stone-500 bg-stone-950 border border-stone-800 cursor-not-allowed flex items-center justify-center gap-1.5"
                                    title={slotsLocked > 0 ? `${slotsLocked} vaga(s) em quarentena regulatória após rescisão contratual até a próxima expedição.` : 'Limite regulatório máximo de 3 convênios de patrocínio atingido.'}
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                                    <span>
                                      {slotsLocked > 0 ? `Vagas Bloqueadas (${slotsLocked} em Quarentena)` : 'Limite de Convênios (3/3)'}
                                    </span>
                                  </button>
                                ) : !canAffordRoyalty && !isUpgrade ? (
                                  <button
                                    disabled
                                    className="w-full py-2 rounded-lg text-xs font-bold text-rose-400/80 bg-stone-950 border border-rose-900/40 cursor-not-allowed flex items-center justify-center gap-1.5"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Ouro Insuficiente (⬡ {contract.weekly_royalty})</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSignContract(contract.contract_id)}
                                    disabled={isSigningB2B}
                                    className="w-full py-2 rounded-lg text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>
                                      {isUpgrade
                                        ? `Promover para Cota ${contract.tier}`
                                        : `Homologar Convênio (${activeB2bContracts.length}/3)`}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SUB-TAB 2: OPERÁRIOS & LINHA DE MONTAGEM
             ════════════════════════════════════════════ */}
          {b2bSubTab === 'operarios' && (
            <div className="space-y-6">
              {/* Painel Informativo da Linha Fabril */}
              <div className="bg-gradient-to-r from-[#1c1917] via-[#26201a] to-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-700/60 flex items-center justify-center shadow-inner shrink-0">
                      <Factory className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-amber-100 uppercase tracking-wide">
                        Linha de Montagem Contínua & Operários Fabris
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Mão de obra contratada para manufatura autônoma seriada com escoamento automático na DRE ao preço regulatório white-label.
                      </p>
                    </div>
                  </div>

                  {/* Resumo de Capacidade */}
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-stone-950/80 border border-stone-800 rounded-lg px-3 py-2 text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Ocupação Fabril</span>
                      <span className="text-sm font-mono font-bold text-amber-400">
                        {assemblyLineWorkers.length} / 4 Operários
                      </span>
                    </div>
                    <div className="bg-stone-950/80 border border-stone-800 rounded-lg px-3 py-2 text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">Folha Salarial</span>
                      <span className="text-sm font-mono font-bold text-rose-400">
                        -⬡ {assemblyLineWorkers.reduce((acc, w) => acc + (w.weekly_salary ?? 0), 0)} /sem
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/80 text-xs text-stone-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    A produção autônoma semanal é liquidada diretamente no balcão a 50% do valor base de mercado, creditando receita white-label diretamente na apuração semanal (DRE).
                  </span>
                </div>
              </div>

              {/* Seção 1: Operários Ativos em Linha */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    Operários em Atividade na Fábrica ({assemblyLineWorkers.length}/4)
                  </h3>
                </div>

                {assemblyLineWorkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center rounded-xl border border-stone-800/60 bg-stone-900/30">
                    <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-500">
                      <Factory className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-200">Nenhum Operário Contratado na Fábrica</h4>
                    <p className="text-[11px] text-stone-400 max-w-sm">
                      Sua linha de montagem contínua está inoperante. Contrate artífices fabris abaixo para automatizar sua esteira de produção e gerar vendas de prateleira semanais.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assemblyLineWorkers.map(worker => {
                      const candidateDef = MOCK_ASSEMBLY_WORKERS.find(c => c.worker_id === worker.worker_id)
                      const branchRecipesForWorker = recipesList.filter(
                        r => !worker.assigned_branch || r.branch === worker.assigned_branch
                      )

                      return (
                        <div
                          key={worker.worker_instance_id}
                          className="bg-[#1c1917] border border-amber-900/40 rounded-xl p-4 shadow-lg space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                            <div>
                              <h4 className="text-sm font-bold text-stone-100">{worker.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-400">
                                  Nível {worker.tier}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                                  Filial: {worker.assigned_branch || 'Geral'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDismissWorker(worker.worker_instance_id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-900 transition cursor-pointer"
                              title="Desligar Operário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="bg-stone-950/70 p-2 rounded border border-stone-800">
                              <span className="text-[10px] text-stone-400 block">Salário Semanal</span>
                              <span className="text-rose-400 font-bold">⬡ {worker.weekly_salary} Ouro</span>
                            </div>
                            <div className="bg-stone-950/70 p-2 rounded border border-stone-800">
                              <span className="text-[10px] text-stone-400 block">Capacidade</span>
                              <span className="text-emerald-400 font-bold">
                                {worker.production_capacity} un. / semana
                              </span>
                            </div>
                          </div>

                          {/* Seletor de Diretriz de Produção */}
                          <div className="pt-2 border-t border-stone-800 space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Diretriz de Produção Seriada (Corporação / Convênio):
                            </label>
                            <select
                              value={worker.target_corp_id || worker.target_recipe || ''}
                              onChange={e => handleSetWorkerOrder(worker.worker_instance_id, e.target.value)}
                              className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                            >
                              <option value="">Selecione a corporação conveniada</option>
                              {activeB2bContracts.length > 0 && (
                                <optgroup label="Convênios B2B Ativos (Gera Brand XP)">
                                  {activeB2bContracts.map(c => {
                                    const corp = allB2BCorporations.find(cp => cp.id === c.corp_id)
                                    return (
                                      <option key={c.contract_id} value={c.corp_id}>
                                        {corp?.name || c.corp_id} (Convênio {c.tier} — Lote Padronizado)
                                      </option>
                                    )
                                  })}
                                </optgroup>
                              )}
                              {branchRecipesForWorker.length > 0 && (
                                <optgroup label="Receitas Tradicionais da Filial (Legado)">
                                  {branchRecipesForWorker.map(rec => (
                                    <option key={rec.recipe_id || rec.id} value={rec.recipe_id || rec.id}>
                                      {rec.name} ({rec.branch} - Nv. {rec.min_workshop_level ?? 1})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            <p className="text-[10px] text-stone-400 italic">
                              {candidateDef?.description || 'Operários alocados a uma fornecedora geram lotes de atacado e Brand XP semanalmente (com dreno na rival).'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Seção 2: Contratação de Novos Operários */}
              <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      Alvarás de Admissão — Candidatos Disponíveis
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Admitir artífices subordinados requer taxa de alvará inicial e compromisso de salário semanal na DRE.
                    </p>
                  </div>

                  {/* Seletor de Filial para Contratação */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400 font-bold">Alocar na Filial:</span>
                    <select
                      value={selectedHireBranch}
                      onChange={e => setSelectedHireBranch(e.target.value)}
                      className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Ferragem">Ferragem</option>
                      <option value="Alquimia">Alquimia</option>
                      <option value="Joalheria">Joalheria</option>
                      <option value="Culinária">Culinária</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MOCK_ASSEMBLY_WORKERS.map(cand => {
                    const isMaxCapacity = assemblyLineWorkers.length >= 4
                    const canAfford = gold >= cand.hiring_cost
                    const isSupportedBranch = cand.supported_branches.includes(selectedHireBranch as any)

                    return (
                      <div
                        key={cand.worker_id}
                        className="bg-stone-900/60 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-stone-100">{cand.name}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 border border-stone-700 text-amber-400 font-bold">
                              Nível {cand.tier}
                            </span>
                          </div>

                          <p className="text-xs text-stone-400 leading-relaxed">{cand.description}</p>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                              <span className="text-[10px] text-stone-400 block">Custo de Admissão</span>
                              <span className="text-amber-400 font-bold">⬡ {cand.hiring_cost} Ouro</span>
                            </div>
                            <div className="bg-stone-950 p-1.5 rounded border border-stone-800">
                              <span className="text-[10px] text-stone-400 block">Salário Semanal</span>
                              <span className="text-rose-400 font-bold">⬡ {cand.weekly_salary} /sem</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-stone-400 flex items-center justify-between font-mono">
                            <span>Capacidade Operacional:</span>
                            <strong className="text-emerald-400 font-bold">
                              {cand.production_capacity} item/semana
                            </strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handleHireWorker(cand.worker_id, selectedHireBranch)}
                          disabled={isMaxCapacity || !canAfford || !isSupportedBranch || isHiringWorker}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            !isMaxCapacity && canAfford && isSupportedBranch && !isHiringWorker
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:brightness-110 shadow-md'
                              : 'bg-stone-950 border border-stone-800 text-stone-600 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {isMaxCapacity
                              ? 'Capacidade Máxima Atingida (4/4)'
                              : !canAfford
                              ? 'Ouro Insuficiente'
                              : !isSupportedBranch
                              ? `Não atua em ${selectedHireBranch}`
                              : `Admitir para ${selectedHireBranch} (⬡ ${cand.hiring_cost})`}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SUB-TAB 3: BANCADA DE MONTAGEM MODULAR
             ════════════════════════════════════════════ */}
          {b2bSubTab === 'montagem' && (
            <div className="space-y-6">
              {/* Banner da Bancada Modular */}
              <div className="bg-gradient-to-r from-[#1c1917] via-[#26201a] to-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-700/60 flex items-center justify-center shadow-inner shrink-0">
                      <Wrench className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-amber-100 uppercase tracking-wide">
                        Bancada de Alta Precisão — Montagem Modular
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Acople peças sobressalentes do almoxarifado corporativo. Peças monomarca garantem +5% de sintonia; misturas inter-marcas geram instabilidade mecânica e risco de Tinkering.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bancada Ativa Superior: 3 Slots Principais + Diagnóstico & Montagem */}
              <div className="bg-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      Bancada de Montagem Modular ({selectedModularParts.length}/3 Slots Acoplados)
                    </h3>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Acople 1 Prefixo (Afixo A), 1 Chassi (Base de Lote) e 1 Sufixo (Núcleo B) selecionando das caixas do almoxarifado abaixo.
                    </p>
                  </div>
                  {selectedModularParts.length > 0 && (
                    <button
                      onClick={handleClearBench}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-mono underline cursor-pointer"
                    >
                      Limpar Bancada
                    </button>
                  )}
                </div>

                {/* Os 3 Slots Superiores Funcionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Slot 1: Prefixo */}
                  {(() => {
                    const partObj = slottedPrefix
                      ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedPrefix || p.id === slottedPrefix)
                      : null
                    return (
                      <div
                        className={`rounded-xl p-3 border min-h-[110px] flex flex-col justify-between transition ${
                          partObj
                            ? 'bg-stone-900 border-amber-600/70 shadow-md'
                            : 'bg-stone-950/60 border-dashed border-stone-800 flex items-center justify-center text-center'
                        }`}
                      >
                        {partObj ? (
                          <>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono uppercase text-amber-400 font-bold">
                                  1. Prefixo (Afixo A)
                                </span>
                                <button
                                  onClick={() => handleEjectSlot('prefix')}
                                  className="text-stone-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Ejetar peça"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="text-xs font-bold text-stone-100 line-clamp-1">
                                {partObj.name}
                              </h4>
                              <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                                +{partObj.power_bonus} PE
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-stone-400 truncate">
                              {CORPORATIONS_MAP[partObj.corp_id]?.name || partObj.corp_id || 'Coroa'}
                            </span>
                          </>
                        ) : (
                          <div className="space-y-1 py-2">
                            <span className="text-[10px] font-bold text-amber-500 uppercase block">1. Prefixo</span>
                            <span className="text-[11px] text-stone-400 block">Vazio (Selecione na Caixa 1 abaixo)</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Slot 2: Chassi Base */}
                  {(() => {
                    const partObj = slottedBase
                      ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedBase || p.id === slottedBase)
                      : null
                    return (
                      <div
                        className={`rounded-xl p-3 border min-h-[110px] flex flex-col justify-between transition ${
                          partObj
                            ? 'bg-stone-900 border-amber-600/70 shadow-md'
                            : 'bg-stone-950/60 border-dashed border-stone-800 flex items-center justify-center text-center'
                        }`}
                      >
                        {partObj ? (
                          <>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono uppercase text-amber-400 font-bold">
                                  2. Chassi Base (Item)
                                </span>
                                <button
                                  onClick={() => handleEjectSlot('base')}
                                  className="text-stone-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Ejetar peça"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="text-xs font-bold text-stone-100 line-clamp-1">
                                {partObj.name}
                              </h4>
                              <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                                +{partObj.power_bonus} PE
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-stone-400 truncate">
                              {CORPORATIONS_MAP[partObj.corp_id]?.name || partObj.corp_id || 'Coroa'}
                            </span>
                          </>
                        ) : (
                          <div className="space-y-1 py-2">
                            <span className="text-[10px] font-bold text-amber-500 uppercase block">2. Chassi Base</span>
                            <span className="text-[11px] text-stone-400 block">Vazio (Selecione na Caixa 2 abaixo)</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* Slot 3: Sufixo */}
                  {(() => {
                    const partObj = slottedSuffix
                      ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedSuffix || p.id === slottedSuffix)
                      : null
                    return (
                      <div
                        className={`rounded-xl p-3 border min-h-[110px] flex flex-col justify-between transition ${
                          partObj
                            ? 'bg-stone-900 border-amber-600/70 shadow-md'
                            : 'bg-stone-950/60 border-dashed border-stone-800 flex items-center justify-center text-center'
                        }`}
                      >
                        {partObj ? (
                          <>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono uppercase text-amber-400 font-bold">
                                  3. Sufixo (Núcleo B)
                                </span>
                                <button
                                  onClick={() => handleEjectSlot('suffix')}
                                  className="text-stone-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                  title="Ejetar peça"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <h4 className="text-xs font-bold text-stone-100 line-clamp-1">
                                {partObj.name}
                              </h4>
                              <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                                +{partObj.power_bonus} PE
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-stone-400 truncate">
                              {CORPORATIONS_MAP[partObj.corp_id]?.name || partObj.corp_id || 'Coroa'}
                            </span>
                          </>
                        ) : (
                          <div className="space-y-1 py-2">
                            <span className="text-[10px] font-bold text-amber-500 uppercase block">3. Sufixo</span>
                            <span className="text-[11px] text-stone-400 block">Vazio (Selecione na Caixa 3 abaixo)</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Nome do Artefato Customizado ou Nomenclatura Procedural */}
                {(() => {
                  const prefixPartObj = slottedPrefix ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedPrefix || p.id === slottedPrefix) : null
                  const basePartObj = slottedBase ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedBase || p.id === slottedBase) : null
                  const suffixPartObj = slottedSuffix ? MOCK_MODULAR_PARTS.find(p => p.part_id === slottedSuffix || p.id === slottedSuffix) : null

                  const generatedName = [prefixPartObj?.name_modifier, basePartObj?.name, suffixPartObj?.name_modifier].filter(Boolean).join(' ') || 'Lote de Ativos Modulares'

                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-300 block">
                          Denominação Notarial do Artefato:
                        </label>
                        <span className="text-[10px] font-mono text-amber-400 italic">
                          Sugestão Procedural: {generatedName}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={modularBaseName}
                        onChange={e => setModularBaseName(e.target.value)}
                        placeholder={generatedName}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none font-sans"
                      />
                    </div>
                  )
                })()}

                {/* Diagnóstico Pericial de Compatibilidade */}
                {selectedModularParts.length >= 2 ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-300">Tolerância Estrutural:</span>
                      <span
                        className={`font-bold ${
                          isInterBrandAssembly ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {isInterBrandAssembly
                          ? '60% Tolerância Crítica (Instabilidade Inter-Marcas)'
                          : '100% Homogeneidade Monomarca (+5% Sintonia)'}
                      </span>
                    </div>

                    {/* Barra de Compatibilidade */}
                    <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isInterBrandAssembly
                            ? 'w-[60%] bg-gradient-to-r from-amber-600 to-orange-500'
                            : 'w-full bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                      />
                    </div>

                    {/* Card de Alerta se for Inter-Marcas (Tinkering) */}
                    {isInterBrandAssembly ? (
                      <div className="bg-amber-950/40 border border-amber-600/70 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span>Protocolo de Risco Técnico: Forja Experimental (Tinkering)</span>
                        </div>
                        <p className="text-[11px] text-stone-300 leading-relaxed">
                          A integração de peças de fabricantes rivais provoca sobrecarga nos conectores mecânicos.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                            60% Sucesso: Overclock Não-Autorizado (+15% Poder)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300">
                            40% Falha: Lote Retido na Malha Fina (20 ⬡)
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 italic">
                          Poder Estimado com Overclock: ~{estimatedModularPower} PE.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/30 border border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          Peças de engenharia unificada. Tolerância dimensional perfeita garante montagem segura com +5% de sintonia mecânica (~{estimatedModularPower} PE).
                        </span>
                      </div>
                    )}

                    {/* Botão de Montagem */}
                    <button
                      onClick={() => handleAssembleModular(isInterBrandAssembly)}
                      disabled={isAssembling}
                      className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer border ${
                        isInterBrandAssembly
                          ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 text-stone-950 border-amber-400 hover:brightness-110 shadow-amber-950/60'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-stone-950 border-emerald-400 hover:brightness-110 shadow-emerald-950/60'
                      }`}
                    >
                      {isInterBrandAssembly ? (
                        <>
                          <Flame className="w-4 h-4 text-stone-950" />
                          <span>
                            {isAssembling
                              ? 'Executando Montagem de Alto Risco...'
                              : 'Assumir Risco e Montar Experimentalmente (Tinkering)'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-stone-950" />
                          <span>
                            {isAssembling
                              ? 'Homologando Montagem...'
                              : 'Montar Artefato Padronizado'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-3 text-xs text-stone-400 text-center">
                    Acople ao menos 2 peças modulares para que o auditor mecânico valide as tolerâncias de fábrica.
                  </div>
                )}

                {/* Card de Resultado da Última Montagem */}
                {lastModularResult && (
                  <div
                    className={`rounded-xl p-4 border space-y-2 animate-in fade-in duration-300 ${
                      lastModularResult.overclock
                        ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-950/50'
                        : lastModularResult.tinkeringSuccess
                        ? 'bg-emerald-950/40 border-emerald-500/80'
                        : 'bg-rose-950/40 border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-stone-400">
                        Laudo Notarial de Manufatura
                      </span>
                      {lastModularResult.overclock && (
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500 text-stone-950 flex items-center gap-1 shadow">
                          <Zap className="w-3 h-3" /> Overclock (+15% Poder)
                        </span>
                      )}
                      {!lastModularResult.tinkeringSuccess && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-900 text-rose-200">
                          Refugo de Bancada
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-stone-100">
                      {lastModularResult.item.name}
                    </h4>
                    <p className="text-xs text-stone-300 italic">{lastModularResult.message}</p>

                    <div className="flex gap-4 text-xs font-mono text-stone-300 pt-2 border-t border-stone-800/80">
                      <span>Poder: +{lastModularResult.item.power_bonus} PE</span>
                      <span>Slot: {lastModularResult.item.slot_type}</span>
                      <span>Valor Contábil: ⬡ {lastModularResult.item.market_value_base} Ouro</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Filtros Globais do Almoxarifado */}
              <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      Filtros do Almoxarifado de Peças
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-stone-400">
                      {warehousePartsList.reduce((acc, x) => acc + x.qty, 0)} em estoque filtrado
                    </span>
                    {(modularCorpFilter !== 'todos' || modularSlotFilter !== 'todos' || modularSearchQuery) && (
                      <button
                        onClick={() => {
                          setModularCorpFilter('todos')
                          setModularSlotFilter('todos')
                          setModularSearchQuery('')
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Filtro por Empresa */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                      Fabricante / Fornecedora:
                    </label>
                    <select
                      value={modularCorpFilter}
                      onChange={e => setModularCorpFilter(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="todos">Todas as Fabricantes</option>
                      {allB2BCorporations.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.slot_focus || c.branch})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Slot */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                      Slot do Ativo:
                    </label>
                    <select
                      value={modularSlotFilter}
                      onChange={e => setModularSlotFilter(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="todos">Todos os Slots</option>
                      <option value="Arsenal Ofensivo">Arsenal Ofensivo</option>
                      <option value="Blindagem Operacional">Blindagem Operacional</option>
                      <option value="Ativo de Performance">Ativo de Performance</option>
                      <option value="Alvará de Risco">Alvará de Risco</option>
                      <option value="Provisão Logística">Provisão Logística</option>
                    </select>
                  </div>

                  {/* Busca por Efeito / Nome */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">
                      Buscar Peça ou Efeito:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={modularSearchQuery}
                        onChange={e => setModularSearchQuery(e.target.value)}
                        placeholder="Ex: canhão, fardamento, térmico..."
                        className="w-full bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg pl-2.5 pr-8 py-1.5 focus:border-amber-500 focus:outline-none"
                      />
                      {modularSearchQuery && (
                        <button
                          onClick={() => setModularSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* As 3 Caixas de Seleção Inferiores (Prefixos, Bases, Sufixos) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* CAIXA 1: PREFIXOS */}
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 shadow-lg flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      1. Modificadores Prefixos
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700">
                      {prefixWarehouseParts.length} disponíveis
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    Empunhaduras, Mancais, Válvulas e Pré-laudos técnicos para acoplar no Slot 1.
                  </p>

                  {prefixWarehouseParts.length === 0 ? (
                    <div className="py-8 text-center text-stone-500 text-xs italic bg-stone-900/30 rounded-lg border border-stone-800/40">
                      Nenhum prefixo correspondente no estoque.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {prefixWarehouseParts.map(item => {
                        const isSlotted = slottedPrefix === item.partId
                        const remaining = item.qty - (isSlotted ? 1 : 0)
                        const corpName = CORPORATIONS_MAP[item.part.corp_id]?.name || item.part.corp_id || 'Coroa Imperial'
                        const slotName = item.part.compatible_slots?.[0] || 'Geral'

                        return (
                          <div
                            key={item.partId}
                            className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 transition ${
                              isSlotted
                                ? 'bg-amber-950/40 border-amber-600/70 shadow-inner'
                                : remaining > 0
                                ? 'bg-stone-900/80 border-stone-800 hover:border-amber-700/60'
                                : 'bg-stone-950/40 border-stone-900 opacity-50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <h5 className="text-xs font-bold text-stone-100 truncate">
                                  {item.part.name}
                                </h5>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800 text-emerald-400 font-bold shrink-0">
                                  +{item.part.power_bonus} PE
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300 font-semibold truncate max-w-[140px]">
                                  {corpName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-stone-950/80 border border-stone-800 text-stone-300">
                                  {slotName}
                                </span>
                                <span className="text-stone-400 ml-auto">
                                  {remaining} un.
                                </span>
                              </div>
                              {item.part.catalog_description && (
                                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">
                                  {item.part.catalog_description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleAttachPart(item.part)}
                              disabled={remaining <= 0 && !isSlotted}
                              className={`w-full py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isSlotted
                                  ? 'bg-amber-600 text-stone-950 font-black hover:bg-amber-500'
                                  : remaining > 0
                                  ? 'bg-stone-800 hover:bg-amber-900/60 border border-stone-700 hover:border-amber-700 text-stone-200'
                                  : 'bg-stone-950 border border-stone-800 text-stone-600 cursor-not-allowed'
                              }`}
                            >
                              {isSlotted ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Acoplado no Slot 1 (Remover)</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-amber-400" />
                                  <span>Acoplar no Prefixo</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* CAIXA 2: CHASSIS BASE */}
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 shadow-lg flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      2. Chassis Base
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700">
                      {baseWarehouseParts.length} disponíveis
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    Lotes de Armamento, Kits de Blindagem, Fardamentos, Alvarás e Provisões para o Slot 2.
                  </p>

                  {baseWarehouseParts.length === 0 ? (
                    <div className="py-8 text-center text-stone-500 text-xs italic bg-stone-900/30 rounded-lg border border-stone-800/40">
                      Nenhum chassi base correspondente no estoque.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {baseWarehouseParts.map(item => {
                        const isSlotted = slottedBase === item.partId
                        const remaining = item.qty - (isSlotted ? 1 : 0)
                        const corpName = CORPORATIONS_MAP[item.part.corp_id]?.name || item.part.corp_id || 'Coroa Imperial'
                        const slotName = item.part.compatible_slots?.[0] || 'Geral'

                        return (
                          <div
                            key={item.partId}
                            className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 transition ${
                              isSlotted
                                ? 'bg-amber-950/40 border-amber-600/70 shadow-inner'
                                : remaining > 0
                                ? 'bg-stone-900/80 border-stone-800 hover:border-amber-700/60'
                                : 'bg-stone-950/40 border-stone-900 opacity-50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <h5 className="text-xs font-bold text-stone-100 truncate">
                                  {item.part.name}
                                </h5>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800 text-emerald-400 font-bold shrink-0">
                                  +{item.part.power_bonus} PE
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300 font-semibold truncate max-w-[140px]">
                                  {corpName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-stone-950/80 border border-stone-800 text-stone-300">
                                  {slotName}
                                </span>
                                <span className="text-stone-400 ml-auto">
                                  {remaining} un.
                                </span>
                              </div>
                              {item.part.catalog_description && (
                                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">
                                  {item.part.catalog_description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleAttachPart(item.part)}
                              disabled={remaining <= 0 && !isSlotted}
                              className={`w-full py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isSlotted
                                  ? 'bg-amber-600 text-stone-950 font-black hover:bg-amber-500'
                                  : remaining > 0
                                  ? 'bg-stone-800 hover:bg-amber-900/60 border border-stone-700 hover:border-amber-700 text-stone-200'
                                  : 'bg-stone-950 border border-stone-800 text-stone-600 cursor-not-allowed'
                              }`}
                            >
                              {isSlotted ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Acoplado no Slot 2 (Remover)</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-amber-400" />
                                  <span>Acoplar no Chassi Base</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* CAIXA 3: NÚCLEOS & SUFIXOS */}
                <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 shadow-lg flex flex-col space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      3. Núcleos & Sufixos
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700">
                      {suffixWarehouseParts.length} disponíveis
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    Núcleos Arcanos, Catalisadores, Matrizes Rúnicas e Certidões Técnicas para o Slot 3.
                  </p>

                  {suffixWarehouseParts.length === 0 ? (
                    <div className="py-8 text-center text-stone-500 text-xs italic bg-stone-900/30 rounded-lg border border-stone-800/40">
                      Nenhum sufixo correspondente no estoque.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                      {suffixWarehouseParts.map(item => {
                        const isSlotted = slottedSuffix === item.partId
                        const remaining = item.qty - (isSlotted ? 1 : 0)
                        const corpName = CORPORATIONS_MAP[item.part.corp_id]?.name || item.part.corp_id || 'Coroa Imperial'
                        const slotName = item.part.compatible_slots?.[0] || 'Geral'

                        return (
                          <div
                            key={item.partId}
                            className={`p-2.5 rounded-lg border flex flex-col justify-between gap-2 transition ${
                              isSlotted
                                ? 'bg-amber-950/40 border-amber-600/70 shadow-inner'
                                : remaining > 0
                                ? 'bg-stone-900/80 border-stone-800 hover:border-amber-700/60'
                                : 'bg-stone-950/40 border-stone-900 opacity-50'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <h5 className="text-xs font-bold text-stone-100 truncate">
                                  {item.part.name}
                                </h5>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-950 border border-stone-800 text-emerald-400 font-bold shrink-0">
                                  +{item.part.power_bonus} PE
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300 font-semibold truncate max-w-[140px]">
                                  {corpName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-stone-950/80 border border-stone-800 text-stone-300">
                                  {slotName}
                                </span>
                                <span className="text-stone-400 ml-auto">
                                  {remaining} un.
                                </span>
                              </div>
                              {item.part.catalog_description && (
                                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">
                                  {item.part.catalog_description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleAttachPart(item.part)}
                              disabled={remaining <= 0 && !isSlotted}
                              className={`w-full py-1.5 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                isSlotted
                                  ? 'bg-amber-600 text-stone-950 font-black hover:bg-amber-500'
                                  : remaining > 0
                                  ? 'bg-stone-800 hover:bg-amber-900/60 border border-stone-700 hover:border-amber-700 text-stone-200'
                                  : 'bg-stone-950 border border-stone-800 text-stone-600 cursor-not-allowed'
                              }`}
                            >
                              {isSlotted ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Acoplado no Slot 3 (Remover)</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 text-amber-400" />
                                  <span>Acoplar no Sufixo</span>
                                </>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SUB-TAB 4: MERCADO SPOT DE PEÇAS
             ════════════════════════════════════════════ */}
          {b2bSubTab === 'spot' && (
            <div className="space-y-6">
              {/* Banner do Mercado Spot */}
              <div className="bg-gradient-to-r from-[#1c1917] via-[#26201a] to-[#1c1917] border border-amber-900/60 rounded-xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-amber-700/60 flex items-center justify-center shadow-inner shrink-0">
                      <Package className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-amber-100 uppercase tracking-wide">
                        Mercado Spot Corporativo de Peças Avulsas
                      </h2>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Aquisição imediata de componentes modulares avulsos. Compras sem convênio B2B ativo sofrem a sobretaxa alfandegária regulatória de +50% de ágio.
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-950/80 border border-stone-800 rounded-lg px-3 py-2 text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Tesouraria Disponível</span>
                    <span className="text-sm font-mono font-bold text-amber-400">⬡ {gold} Ouro</span>
                  </div>
                </div>
              </div>

              {/* Filtros e Busca Spot */}
              <div className="flex flex-col sm:flex-row gap-3 bg-stone-950/50 p-3 rounded-xl border border-stone-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={spotSearchQuery}
                    onChange={e => setSpotSearchQuery(e.target.value)}
                    placeholder="Buscar peça por denominação técnica ou descrição..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 font-bold shrink-0">Fabricante:</span>
                  <select
                    value={spotCorpFilter}
                    onChange={e => setSpotCorpFilter(e.target.value)}
                    className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-2 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="todos">Todos os Fabricantes</option>
                    {allB2BCorporations.map(corp => (
                      <option key={corp.id} value={corp.id}>
                        {corp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Catálogo de Peças Modulares Spot */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSpotParts.map(part => {
                  const pId = part.part_id || part.id
                  const activeContract = activeB2bContracts.find(c => c.corp_id === part.corp_id)
                  const hasDiscount = Boolean(activeContract)
                  const discountPct = activeContract?.discount_pct ?? 0
                  const baseCost = part.base_cost ?? part.market_price_base ?? 50
                  const contractTierOrder: Record<string, number> = { 'Bronze': 1, 'Prata': 2, 'Ouro': 3, 'bronze': 1, 'prata': 2, 'ouro': 3 }
                  const maxUnlockedTier = activeContract ? (contractTierOrder[activeContract.tier] || 1) : 1
                  const isCrown = part.corp_id === 'corp_crown_notarial'
                  const requiredTier = part.tier || 1
                  const isLockedBySponsorship = !isCrown && requiredTier > maxUnlockedTier
                  const requiredTierName = requiredTier === 2 ? 'Prata' : 'Ouro'
                  const unitPrice = hasDiscount
                    ? Math.round(baseCost * (1 - discountPct))
                    : Math.round(baseCost * 1.50)

                  const spotPurchasesThisWeek = (state as any).spot_purchases_this_week ?? {}
                  const alreadyBought = spotPurchasesThisWeek[pId] ?? 0
                  const maxWeeklyQuota = 5
                  const remainingQuota = Math.max(0, maxWeeklyQuota - alreadyBought)
                  const isQuotaExhausted = remainingQuota <= 0

                  const qty = Math.min(Math.max(1, spotQuantities[pId] ?? 1), Math.max(1, remainingQuota))
                  const totalCost = unitPrice * qty
                  const canAfford = gold >= totalCost && !isLockedBySponsorship && !isQuotaExhausted && remainingQuota >= qty
                  const inWarehouse = warehouseParts[pId] ?? 0

                  return (
                    <div
                      key={pId}
                      className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 shadow-lg flex flex-col justify-between space-y-3 hover:border-amber-800/60 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 font-semibold truncate max-w-[150px]">
                            {CORPORATIONS_MAP[part.corp_id]?.name || part.corp_id || 'Coroa Imperial'}
                          </span>
                          <div className="flex items-center gap-1">
                            {part.slot_role && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-300 font-bold">
                                {part.slot_role === 'prefix' ? 'Prefixo' : part.slot_role === 'suffix' ? 'Sufixo' : 'Chassi Base'}
                              </span>
                            )}
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300 font-bold">
                              Nível {part.tier}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-stone-100">{part.name}</h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          {part.catalog_description}
                        </p>

                        <div className="flex items-center justify-between text-xs font-mono pt-1 text-stone-300">
                          <span>Bônus de Poder:</span>
                          <span className="text-emerald-400 font-bold">+{part.power_bonus} PE</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-stone-300">
                          <span>No Almoxarifado:</span>
                          <span className="text-amber-400 font-bold">{inWarehouse} un.</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-stone-300">
                          <span>Cota Semanal:</span>
                          <span className={`font-bold ${isQuotaExhausted ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {remainingQuota} / {maxWeeklyQuota} un. {isQuotaExhausted && '(Esgotada)'}
                          </span>
                        </div>

                        {/* Tratamento de Preço Spot / Convênio */}
                        <div className="pt-2 border-t border-stone-800/80 space-y-1">
                          {hasDiscount ? (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold">
                                Convênio B2B (-{Math.round(discountPct * 100)}%)
                              </span>
                              <div className="text-right">
                                <span className="text-[10px] text-stone-400 line-through mr-1 font-mono">
                                  ⬡ {part.base_cost}
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                  ⬡ {unitPrice} /un
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300 font-bold">
                                Tarifa Spot (+50% Ágio)
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-400">
                                ⬡ {unitPrice} /un
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Seletor de Quantidade & Compra */}
                      <div className="pt-3 border-t border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-stone-400 font-bold">Quantidade:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSpotQuantities(prev => ({
                                  ...prev,
                                  [pId]: Math.max(1, (prev[pId] ?? 1) - 1),
                                }))
                              }}
                              disabled={isQuotaExhausted}
                              className="w-7 h-7 rounded bg-stone-900 border border-stone-700 text-stone-200 font-mono font-bold hover:bg-stone-800 cursor-pointer flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-xs text-stone-100">
                              {qty}
                            </span>
                            <button
                              onClick={() => {
                                setSpotQuantities(prev => ({
                                  ...prev,
                                  [pId]: Math.min(remainingQuota, (prev[pId] ?? 1) + 1),
                                }))
                              }}
                              disabled={isQuotaExhausted || qty >= remainingQuota}
                              className="w-7 h-7 rounded bg-stone-900 border border-stone-700 text-stone-200 font-mono font-bold hover:bg-stone-800 cursor-pointer flex items-center justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuySpot(pId)}
                          disabled={!canAfford || isBuyingSpot || isLockedBySponsorship || isQuotaExhausted}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            canAfford && !isBuyingSpot && !isLockedBySponsorship && !isQuotaExhausted
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:brightness-110 shadow-md'
                              : 'bg-stone-950 border border-stone-800 text-stone-600 cursor-not-allowed'
                          }`}
                        >
                          {isLockedBySponsorship ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Requer Convênio {requiredTierName} (Nível {part.tier})</span>
                            </>
                          ) : isQuotaExhausted ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cota Semanal Esgotada ({maxWeeklyQuota}/{maxWeeklyQuota} un.)</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" />
                              <span>
                                {canAfford ? `Adquirir Lote Spot (⬡ ${totalCost})` : 'Tesouraria Insuficiente'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
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
                    <Tooltip term="Boletim de Mercado">Boletim de Mercado</Tooltip> Oficial da Liga
                  </span>
                  <p className="text-xs text-stone-200 font-semibold">{bulletin.headline}</p>
                </div>
              </div>
              <div className="shrink-0 bg-amber-500 text-stone-950 px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono shadow self-start sm:self-center">
                {bulletin.target}: Demanda x{bulletin.multiplier}
              </div>
            </div>
          )}

          {/* ── Card de Encomenda VIP da Nobreza ── */}
          {vipOrder && (
            <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👑</span>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Encomenda da Nobreza
                </span>
                <span className="ml-auto text-[10px] text-stone-400 font-mono">
                  Validade: {vipOrder.expires_in_rounds} rodada{vipOrder.expires_in_rounds !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-stone-300 italic mb-3">"{vipOrder.headline}"</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-stone-900/60 rounded-lg p-2 border border-stone-700/50">
                  <p className="text-[10px] text-stone-400 uppercase">Item</p>
                  <p className="text-xs font-bold text-stone-200 capitalize">{vipOrder.item_type}</p>
                </div>
                <div className="bg-stone-900/60 rounded-lg p-2 border border-stone-700/50">
                  <p className="text-[10px] text-stone-400 uppercase">Qualidade Mínima</p>
                  <p className="text-xs font-bold text-amber-300">{vipOrder.min_quality}</p>
                </div>
                <div className="bg-stone-900/60 rounded-lg p-2 border border-stone-700/50">
                  <p className="text-[10px] text-stone-400 uppercase">Recompensa</p>
                  <p className="text-xs font-bold text-emerald-400">⬡ {vipOrder.reward_gold}</p>
                  <p className="text-[10px] text-sky-400">+{vipOrder.reward_confidence}% Conf.</p>
                </div>
              </div>
              {vipEligibleItems.length > 0 ? (
                <div className="flex gap-2 items-center">
                  <select
                    value={vipSelectedItemId}
                    onChange={(e) => setVipSelectedItemId(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-lg px-2 py-1.5"
                  >
                    <option value="">— Selecionar artefato —</option>
                    {vipEligibleItems.map((it) => (
                      <option key={it.item_instance_id} value={it.item_instance_id}>
                        {it.name} ({it.quality})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleFulfillVip}
                    disabled={!vipSelectedItemId || isFulfillingVip}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {isFulfillingVip ? 'Enviando…' : 'Cumprir'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic text-center py-1">
                  Nenhum item em estoque atende os requisitos da Câmara.
                </p>
              )}
              {vipFeedback && (
                <p className="text-xs mt-2 text-center font-semibold text-stone-300">{vipFeedback}</p>
              )}
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
                <EmptyState variant="inventory" className="my-2" />
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
          CONTEÚDO: BOLSA DE CONTRATAÇÕES & TRANSFERÊNCIAS (ONDA 4)
         ───────────────────────────────────────────── */}
      {mainTab === 'transferencias' && (
        <div className="space-y-6">
          {/* Banner de Diretrizes da Bolsa */}
          <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-xl flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-800/40 text-amber-400 shrink-0 mt-0.5">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-amber-100 text-sm font-black uppercase tracking-wide">
                  Bolsa de Transferências & Agentes Livres
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-900 border border-stone-800 text-stone-300">
                  Lotação do Plantel: {currentTeamSize} de {maxTeamSize} heróis
                </span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                <strong className="text-amber-300 font-bold">O Trade-Off do Potencial:</strong> No mercado aberto, o potencial em estrelas dos aventureiros é estritamente <strong className="text-stone-200">Oculto ([???])</strong>.
                Você pode assumir o risco da contratação imediata ou encomendar uma <strong className="text-amber-400 font-bold">Auditoria Pericial de Olheiro (⬡ {scoutFee} Ouro)</strong> para auditar a projeção máxima do herói antes da compra.
              </p>
            </div>
          </div>

          {/* Grid de Aventureiros Disponíveis */}
          {marketListings.length === 0 ? (
            <div className="text-center py-12 bg-[#1c1917] border border-stone-800 rounded-xl text-stone-500 text-xs italic">
              Nenhum aventureiro listado na bolsa no momento. Novos agentes chegam a cada semana.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketListings.map(hero => {
                const isRevealed = hero.potential?.is_potential_revealed ?? false
                const stars = hero.potential?.star_potential ?? 3
                const transferCost = hero.transfer_fee ?? 300
                const salaryCost = hero.salary ?? 60

                return (
                  <div
                    key={hero.id}
                    className="bg-[#1c1917] border border-stone-800 hover:border-amber-900/60 rounded-xl p-4 shadow-xl flex flex-col justify-between gap-4 transition"
                  >
                    <div className="space-y-3">
                      {/* Cabeçalho do Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-stone-800/80 pb-2.5">
                        <div>
                          <h4 className="text-stone-100 font-black text-sm tracking-wide">{hero.name}</h4>
                          <span className="text-[10px] text-stone-400">
                            {hero.age} anos · {hero.class_name ?? hero.class ?? 'Combatente'} {hero.specialization_name ? `(${hero.specialization_name})` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 text-amber-400 font-mono text-sm font-bold">
                            <Zap className="w-3.5 h-3.5 fill-amber-400/20" />
                            <span>{hero.current_power ?? 50}</span>
                          </div>
                          <span className="text-[9px] text-stone-500 uppercase block font-mono">Poder Bruto</span>
                        </div>
                      </div>

                      {/* Caixa de Potencial Estelar */}
                      <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-400 text-[11px]">Potencial Auditado:</span>
                          {isRevealed ? (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${
                                    s <= stars
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-stone-700'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40">
                              [???] Não Auditado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500 block">
                          {isRevealed
                            ? `Auditoria pericial homologada: teto de ${stars} Estrelas.`
                            : 'Contrate no escuro ou envie um olheiro para avaliar.'}
                        </span>
                      </div>

                      {/* Custos Financeiros */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-stone-900/60 p-2 rounded border border-stone-800">
                          <span className="text-[10px] text-stone-500 block uppercase">Passe / Aquisição</span>
                          <strong className="text-amber-300">⬡ {transferCost} Ouro</strong>
                        </div>
                        <div className="bg-stone-900/60 p-2 rounded border border-stone-800">
                          <span className="text-[10px] text-stone-500 block uppercase">Vencimento Semanal</span>
                          <strong className="text-stone-200">⬡ {salaryCost}/sem</strong>
                        </div>
                      </div>
                    </div>

                    {/* Ações: Olheiro e Contratar */}
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      {!isRevealed && (
                        <button
                          onClick={() => handleScout(hero.id)}
                          disabled={isScoutingOrHiring || state.gold < scoutFee}
                          className="w-full py-1.5 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-900/40 hover:border-amber-700/50 text-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5 text-amber-400" />
                          <span>Auditoria de Olheiro (⬡ {scoutFee})</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleHire(hero.id)}
                        disabled={isScoutingOrHiring || state.gold < transferCost || currentTeamSize >= maxTeamSize}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {currentTeamSize >= maxTeamSize
                            ? 'Plantel Lotado (Máx 12)'
                            : `Homologar Aquisição (⬡ ${transferCost})`}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
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
            {(() => {
              const modalRarity = getMaterialRarity(materialSheetModal.material.id, materialSheetModal.material.name)
              const modalRStyle = MATERIAL_RARITY_STYLES[modalRarity]
              return (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${modalRStyle.bg} border ${modalRStyle.border} ${modalRStyle.glow} flex items-center justify-center shrink-0`}>
                      <Info className={`w-5 h-5 ${modalRStyle.text}`} />
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
                  <span className={modalRStyle.badge}>
                    {modalRarity}
                  </span>
                </div>
              )
            })()}

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
    </div>
  )
}
