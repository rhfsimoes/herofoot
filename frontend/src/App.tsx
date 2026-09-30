import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import PhaseStepper from './components/PhaseStepper'
import Dashboard from './pages/Dashboard'
import Phase1HR from './pages/Phase1HR'
import Phase2Workshop from './pages/Phase2Workshop'
import Phase3Tactics from './pages/Phase3Tactics'
import Phase4Dungeon from './pages/Phase4Dungeon'
import Phase5Results from './pages/Phase5Results'
import {
  MOCK_STATE,
  MOCK_RECIPES,
  WORKSHOP_XP_TABLE,
  MOCK_B2B_CONTRACTS,
  MOCK_CORPORATIONS,
  MOCK_ASSEMBLY_WORKERS,
  MOCK_MODULAR_PARTS,
  type GameState,
  type InventoryItem,
  type Recipe,
  type AssemblyWorkerInstance,
} from './mockData'
import {
  checkBackendLive,
  fetchStateFromBackend,
  advancePhaseBackend,
  saveTacticsBackend,
  craftItemBackend,
  upgradeWorkshopBackend,
  buyMaterialBackend,
  buyItemBackend,
  sellItemBackend,
  resolveOfferBackend,
  learnAffixBackend,
  signB2BContractBackend,
  cancelB2BContractBackend,
  hireAssemblyWorkerBackend,
  setWorkerOrderBackend,
  dismissAssemblyWorkerBackend,
  assembleModularItemBackend,
  buyModularPartBackend,
  type CraftPayload,
} from './api'
import './index.css'

function AppContent() {
  const [gameState, setGameState] = useState<GameState>(MOCK_STATE)
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false)
  const navigate = useNavigate()

  const PHASE_PATHS = ['/', '/phase1', '/phase2', '/phase3', '/phase4', '/phase5']

  // Sincronização inicial com o backend se disponível
  useEffect(() => {
    async function init() {
      const isLive = await checkBackendLive()
      setIsBackendOnline(isLive)
      if (isLive) {
        const remoteState = await fetchStateFromBackend()
        if (remoteState) {
          setGameState(prev => ({
            ...prev,
            ...remoteState,
            day: remoteState.day || remoteState.week || prev.day,
            current_phase: remoteState.current_phase || prev.current_phase,
          }))
        }
      }
    }
    init()
  }, [])

  function handleStateChange(newState: GameState, shouldNavigate: boolean = false) {
    setGameState(prev => ({
      ...prev,
      ...newState,
      day: newState.day || newState.week || prev.day,
      current_phase: newState.current_phase || prev.current_phase,
    }))
    if (shouldNavigate) {
      const targetPhase = newState.current_phase || 1
      navigate(PHASE_PATHS[targetPhase] || '/')
    }
  }

  // Avanço de fases integrado
  async function advancePhase() {
    if (isBackendOnline) {
      const res = await advancePhaseBackend()
      if (res && res.state) {
        const newState = res.state
        setGameState(prev => ({
          ...prev,
          ...newState,
          day: newState.day || newState.week || prev.day,
          current_phase: newState.current_phase,
        }))
        navigate(PHASE_PATHS[newState.current_phase])
        return
      }
    }

    // Fallback local
    const next = (gameState.current_phase % 5) + 1
    const isNewDay = gameState.current_phase === 5
    setGameState(prev => ({
      ...prev,
      current_phase: next,
      day: isNewDay ? prev.day + 1 : prev.day,
    }))
    navigate(PHASE_PATHS[next])
  }

  // Execução de Expedição na Fase 4 (Chama avanço no backend que simula a masmorra e devolve room_events)
  async function handleExecuteExpedition() {
    if (isBackendOnline) {
      const res = await advancePhaseBackend()
      if (res && res.state) {
        const stateData = res.state
        setGameState(prev => ({
          ...prev,
          ...stateData,
          day: stateData.day || stateData.week || prev.day,
          current_phase: stateData.current_phase,
        }))
      }
      return res
    }
    return null
  }

  function handleAdvanceFromPhase1() {
    if (gameState.current_phase > 1) {
      navigate('/phase2')
    } else {
      advancePhase()
    }
  }

  function handleAdvanceFromPhase2() {
    if (gameState.current_phase > 2) {
      navigate('/phase3')
    } else {
      advancePhase()
    }
  }

  function handleAdvanceFromPhase3() {
    if (gameState.current_phase > 3) {
      navigate('/phase4')
    } else {
      advancePhase()
    }
  }

  function handleAdvanceFromPhase4() {
    if (gameState.current_phase === 5) {
      navigate('/phase5')
    } else {
      advancePhase()
    }
  }

  // Handler para salvar tática (titulares, reservas e loadout com IDs)
  async function handleSaveTactics(
    starters: string[],
    loadout: Record<string, string | null>,
    reserves?: string[]
  ) {
    if (isBackendOnline) {
      const res = await saveTacticsBackend(starters, loadout, reserves)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    setGameState(prev => ({
      ...prev,
      tactics: { starters, reserves: reserves || [], loadout: loadout as any },
    }))
    return null
  }

  // Handlers para o módulo de Oficina e Balcão
  async function handleCraft(payload: string | CraftPayload) {
    if (isBackendOnline) {
      const res = await craftItemBackend(payload)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    // Fallback local offline
    const recipeId = typeof payload === 'string' ? payload : payload.recipe_id
    const prefixId = typeof payload === 'string' ? null : payload.prefix_id
    const suffixId = typeof payload === 'string' ? null : payload.suffix_id
    const isTinkering = typeof payload === 'object' && !!payload.is_tinkering
    let createdItem: InventoryItem = {
      item_instance_id: `item_craft_${Date.now()}`,
      name: 'Item',
      quality: 'Normal',
      slot_type: 'Arsenal Ofensivo',
      power_bonus: 20,
      market_value_base: 150,
    }
    let updatedState: GameState = gameState
    let xpGained = 10
    let tinkeringSuccess = true

    setGameState((prev: GameState): GameState => {
      const recipes: Recipe[] = prev.recipes ? Object.values(prev.recipes) : MOCK_RECIPES
      const rec = recipes.find(r => (r.recipe_id || r.id) === recipeId) || recipes[0]
      const branch = (typeof payload === 'object' && payload.branch) || rec?.branch || 'Ferragem'
      const currentLevel = prev.workshop_levels?.[branch] ?? 1
      const minLevel = rec?.min_workshop_level ?? 1
      const tier = rec?.tier ?? (minLevel >= 3 ? 3 : (minLevel === 2 ? 2 : 1))
      const baseXp = tier === 1 ? 10 : (tier === 2 ? 25 : 60)

      if (isTinkering) {
        const gap = Math.max(1, minLevel - currentLevel)
        const successChance = Math.max(0.05, 1 - gap * 0.35)
        tinkeringSuccess = Math.random() < successChance
        xpGained = tinkeringSuccess ? Math.round(baseXp * 1.5) : 5
      } else {
        xpGained = baseXp
      }

      const newMaterials = { ...prev.materials }
      
      // Deduct ingredients
      if (rec?.ingredients) {
        rec.ingredients.forEach((ing: any) => {
          const mid = ing.material_id || ing.item_id
          const qty = ing.quantity || 1
          newMaterials[mid] = Math.max(0, (newMaterials[mid] ?? 0) - qty)
        })
      }

      if (isTinkering && !tinkeringSuccess) {
        const targetSlot = (rec?.slot as any) || 'offensive_asset'
        const isCorpAsset = ['offensive_asset', 'defensive_asset', 'terrain_license', 'Arsenal Ofensivo', 'Blindagem Operacional', 'Alvará de Risco', 'Arma', 'Armadura', 'Inscrição'].includes(targetSlot)
        createdItem = {
          item_instance_id: `item_scrap_${Date.now()}`,
          name: isCorpAsset ? 'Ativo Não-Conforme' : 'Gororoba Experimental',
          slot_type: targetSlot,
          quality: 'Fraco',
          power_bonus: 0,
          market_value_base: 20,
          description: isCorpAsset
            ? 'Lote fabril retido na malha fina por desconformidade técnica e ausência de tolerância dimensional.'
            : 'Resíduo operacional oriundo de processo experimental sem conformidade técnica homologada.',
        }
      } else {
        createdItem = {
          item_instance_id: `item_craft_${Date.now()}`,
          name: `${prefixId ? prefixId + ' ' : ''}${rec?.base_item || rec?.name || 'Item'}${suffixId ? ' ' + suffixId : ''}`.trim(),
          slot_type: (rec?.slot as any) || 'Arma',
          quality: 'Normal',
          power_bonus: rec?.base_power || 20,
          market_value_base: rec?.market_value_base || 150,
        }
      }

      const currentXp = prev.workshop_xp?.[branch] ?? 0
      const newWorkshopXp = {
        ...(prev.workshop_xp ?? {}),
        [branch]: currentXp + xpGained,
      }

      updatedState = {
        ...prev,
        materials: newMaterials,
        inventory: [createdItem, ...prev.inventory],
        workshop_xp: newWorkshopXp,
      }
      return updatedState
    })

    return {
      success: true,
      result: {
        success: true,
        item: createdItem,
        xp_gained: xpGained,
        is_tinkering: isTinkering,
        tinkering_success: isTinkering ? tinkeringSuccess : undefined,
        recipe_unlocked: isTinkering,
      },
      item: createdItem,
      xp_gained: xpGained,
      is_tinkering: isTinkering,
      tinkering_success: isTinkering ? tinkeringSuccess : undefined,
      recipe_unlocked: isTinkering,
      state: updatedState ?? undefined,
    } as any
  }

  async function handleLearnAffix(affixId: string) {
    if (isBackendOnline) {
      const res = await learnAffixBackend(affixId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return { success: true } as any
  }

  async function handleUpgradeWorkshop(branch: string) {
    if (isBackendOnline) {
      const res = await upgradeWorkshopBackend(branch)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    let updatedState: GameState | null = null
    let success = false
    let message = ''
    setGameState((prev: GameState): GameState => {
      const currentLvl = prev.workshop_levels?.[branch] ?? 1
      if (currentLvl >= 6) {
        message = `Filial de ${branch} já opera no nível máximo homologado (nível 6).`
        return prev
      }
      const xpConfig = WORKSHOP_XP_TABLE[currentLvl]
      const cost = xpConfig?.upgrade_cost ?? 500
      const xpReq = xpConfig?.xp_to_next ?? 0
      const currentXp = prev.workshop_xp?.[branch] ?? 0

      if (currentXp < xpReq) {
        message = `XP insuficiente: requer ${xpReq} XP, filial possui ${currentXp} XP.`
        return prev
      }
      if (prev.gold < cost) {
        message = `Recursos financeiros insuficientes: requer ${cost} Ouro.`
        return prev
      }

      success = true
      updatedState = {
        ...prev,
        gold: prev.gold - cost,
        workshop_levels: {
          ...prev.workshop_levels,
          [branch]: currentLvl + 1,
        },
        workshop_xp: {
          ...(prev.workshop_xp ?? {}),
          [branch]: Math.max(0, currentXp - xpReq),
        },
      }
      return updatedState
    })
    return {
      success,
      result: {
        success,
        level: updatedState ? (updatedState as GameState).workshop_levels?.[branch] : undefined,
        message,
      },
      message,
      state: updatedState ?? undefined,
    } as any
  }

  async function handleBuyMaterial(matId: string, qty: number) {
    if (isBackendOnline) {
      const res = await buyMaterialBackend(matId, qty)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    // Fallback local se backend offline
    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const mat = prev.market?.materials_for_sale?.find(m => m.material_id === matId)
      const cost = (mat?.unit_price ?? 30) * qty
      if (prev.gold < cost) return prev
      const newMaterials = {
        ...prev.materials,
        [matId]: (prev.materials[matId] ?? 0) + qty,
      }
      const newMarketMats = prev.market?.materials_for_sale?.map(m =>
        m.material_id === matId
          ? { ...m, available_quantity: Math.max(0, m.available_quantity - qty) }
          : m
      )
      updatedState = {
        ...prev,
        gold: prev.gold - cost,
        materials: newMaterials,
        market: {
          materials_for_sale: newMarketMats || [],
          ready_items_for_sale: prev.market?.ready_items_for_sale || [],
          affix_manuals: prev.market?.affix_manuals,
          bulletin: prev.market?.bulletin,
        },
      }
      return updatedState
    })
    return { success: true, state: updatedState ?? undefined } as any
  }

  async function handleBuyItem(marketItemId: string) {
    if (isBackendOnline) {
      const res = await buyItemBackend(marketItemId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const item = prev.market?.ready_items_for_sale?.find(i => i.market_item_id === marketItemId)
      if (!item || prev.gold < item.price) return prev
      const newItem: InventoryItem = {
        item_instance_id: `item_mkt_${Date.now()}`,
        name: item.name,
        slot_type: item.slot_type,
        quality: item.quality,
        power_bonus: item.power_bonus,
        market_value_base: item.price,
      }
      const newReadyItems = prev.market?.ready_items_for_sale?.filter(i => i.market_item_id !== marketItemId)
      updatedState = {
        ...prev,
        gold: prev.gold - item.price,
        inventory: [newItem, ...prev.inventory],
        market: {
          materials_for_sale: prev.market?.materials_for_sale || [],
          ready_items_for_sale: newReadyItems || [],
          affix_manuals: prev.market?.affix_manuals,
          bulletin: prev.market?.bulletin,
        },
      }
      return updatedState
    })
    return { success: true, state: updatedState ?? undefined } as any
  }

  async function handleSellItem(instanceId: string, margin: string) {
    if (isBackendOnline) {
      const res = await sellItemBackend(instanceId, margin)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  async function handleResolveOffer(offerId: string, accept: boolean) {
    if (isBackendOnline) {
      const res = await resolveOfferBackend(offerId, accept)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  // ─────────────────────────────────────────────
  // B2B & LINHA DE MONTAGEM HANDLERS
  // ─────────────────────────────────────────────
  async function handleSignB2BContract(contractId: string) {
    if (isBackendOnline) {
      const res = await signB2BContractBackend(contractId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    // Fallback local
    const contract = MOCK_B2B_CONTRACTS.find(c => c.contract_id === contractId)
    if (!contract) return { success: false, message: 'Contrato não localizado no catálogo.' } as any
    const corp = MOCK_CORPORATIONS.find(c => c.id === contract.corp_id)

    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const currentContracts = prev.active_b2b_contracts ?? []
      if (currentContracts.some(c => c.contract_id === contractId)) {
        return prev
      }
      const newContracts = [...currentContracts, contract]
      const newTags = [...(prev.corporate_exclusivity_tags ?? [])]
      if (contract.is_exclusive && corp?.exclusivity_tag && !newTags.includes(corp.exclusivity_tag)) {
        newTags.push(corp.exclusivity_tag)
      }
      const newWarehouse = { ...(prev.warehouse_parts ?? {}) }
      if (contract.weekly_shipment) {
        for (const item of contract.weekly_shipment) {
          newWarehouse[item.part_id] = (newWarehouse[item.part_id] ?? 0) + item.quantity
        }
      }
      updatedState = {
        ...prev,
        active_b2b_contracts: newContracts,
        corporate_exclusivity_tags: newTags,
        warehouse_parts: newWarehouse,
      }
      return updatedState
    })
    return {
      success: true,
      message: `Convênio B2B com ${corp?.name ?? 'Corporação'} homologado com sucesso!`,
      state: updatedState ?? undefined,
      active_b2b_contracts: updatedState ? (updatedState as GameState).active_b2b_contracts : undefined,
      corporate_exclusivity_tags: updatedState ? (updatedState as GameState).corporate_exclusivity_tags : undefined,
      warehouse_parts: updatedState ? (updatedState as GameState).warehouse_parts : undefined,
    } as any
  }

  async function handleCancelB2BContract(contractId: string) {
    if (isBackendOnline) {
      const res = await cancelB2BContractBackend(contractId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const contract = (prev.active_b2b_contracts ?? []).find(c => c.contract_id === contractId)
      const newContracts = (prev.active_b2b_contracts ?? []).filter(c => c.contract_id !== contractId)
      const corp = MOCK_CORPORATIONS.find(c => c.id === contract?.corp_id)
      let newTags = [...(prev.corporate_exclusivity_tags ?? [])]
      if (corp?.exclusivity_tag) {
        newTags = newTags.filter(t => t !== corp.exclusivity_tag)
      }
      updatedState = {
        ...prev,
        active_b2b_contracts: newContracts,
        corporate_exclusivity_tags: newTags,
      }
      return updatedState
    })
    return {
      success: true,
      message: 'Rescisão notarial homologada.',
      state: updatedState ?? undefined,
      active_b2b_contracts: updatedState ? (updatedState as GameState).active_b2b_contracts : undefined,
      corporate_exclusivity_tags: updatedState ? (updatedState as GameState).corporate_exclusivity_tags : undefined,
    } as any
  }

  async function handleHireAssemblyWorker(workerId: string, assignedBranch: string = 'Ferragem') {
    if (isBackendOnline) {
      const res = await hireAssemblyWorkerBackend(workerId, assignedBranch)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    const candidate = MOCK_ASSEMBLY_WORKERS.find(w => w.worker_id === workerId)
    if (!candidate) return { success: false, message: 'Candidato não localizado.' } as any

    let updatedState: GameState | null = null
    let errorMsg = ''
    setGameState((prev: GameState): GameState => {
      const currentWorkers = prev.assembly_line_workers ?? []
      if (currentWorkers.length >= 4) {
        errorMsg = 'Capacidade máxima de operários atingida (4/4).'
        return prev
      }
      if (prev.gold < candidate.hiring_cost) {
        errorMsg = `Ouro insuficiente para admissão (${candidate.hiring_cost} ⬡ requeridos).`
        return prev
      }
      const newInstance: AssemblyWorkerInstance = {
        worker_instance_id: `worker_inst_${Date.now()}`,
        worker_id: candidate.worker_id,
        name: candidate.name,
        tier: candidate.tier,
        weekly_salary: candidate.weekly_salary,
        production_capacity: candidate.production_capacity,
        assigned_branch: assignedBranch,
        supported_branches: candidate.supported_branches || [],
        allowed_recipes: candidate.allowed_recipes || [],
        target_recipe: candidate.allowed_recipes?.[0] || 'rec_01',
      }
      const newWorkers = [...currentWorkers, newInstance]
      updatedState = {
        ...prev,
        gold: prev.gold - candidate.hiring_cost,
        assembly_line_workers: newWorkers,
      }
      return updatedState
    })
    if (errorMsg) return { success: false, message: errorMsg } as any
    return {
      success: true,
      message: `${candidate.name} admitido na linha de produção da filial ${assignedBranch}!`,
      state: updatedState ?? undefined,
      assembly_line_workers: updatedState ? (updatedState as GameState).assembly_line_workers : undefined,
    } as any
  }

  async function handleSetWorkerOrder(workerInstanceId: string, targetRecipe: string) {
    if (isBackendOnline) {
      const res = await setWorkerOrderBackend(workerInstanceId, targetRecipe)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const newWorkers = (prev.assembly_line_workers ?? []).map(w =>
        w.worker_instance_id === workerInstanceId ? { ...w, target_recipe: targetRecipe } : w
      )
      updatedState = {
        ...prev,
        assembly_line_workers: newWorkers,
      }
      return updatedState
    })
    return {
      success: true,
      message: 'Diretriz de manufatura atualizada com sucesso.',
      state: updatedState ?? undefined,
      assembly_line_workers: updatedState ? (updatedState as GameState).assembly_line_workers : undefined,
    } as any
  }

  async function handleDismissAssemblyWorker(workerInstanceId: string) {
    if (isBackendOnline) {
      const res = await dismissAssemblyWorkerBackend(workerInstanceId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const newWorkers = (prev.assembly_line_workers ?? []).filter(w => w.worker_instance_id !== workerInstanceId)
      updatedState = {
        ...prev,
        assembly_line_workers: newWorkers,
      }
      return updatedState
    })
    return {
      success: true,
      message: 'Operário desligado do quadro fabril.',
      state: updatedState ?? undefined,
      assembly_line_workers: updatedState ? (updatedState as GameState).assembly_line_workers : undefined,
    } as any
  }

  async function handleAssembleModularItem(partIds: string[], baseName: string, isTinkering: boolean) {
    if (isBackendOnline) {
      const res = await assembleModularItemBackend(partIds, baseName, isTinkering)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    // Fallback local
    const parts = partIds.map(pid => MOCK_MODULAR_PARTS.find(p => p.part_id === pid || p.id === pid)).filter(Boolean) as any[]
    const brands = Array.from(new Set(parts.map(p => p.corp_id || p.brand_id)))
    const isInterBrand = brands.length > 1

    let createdItem: InventoryItem
    let overclock = false
    let tinkeringSuccess = true

    if (isInterBrand) {
      tinkeringSuccess = Math.random() < 0.60
      if (!tinkeringSuccess) {
        const targetSlot = (parts[0]?.compatible_slots?.[0] || 'Arsenal Ofensivo') as any
        const scrapName = targetSlot === 'Provisão Logística' ? 'Gororoba Experimental' : 'Ativo Não-Conforme'
        createdItem = {
          item_instance_id: `mod_scrap_${Date.now()}`,
          name: scrapName,
          slot_type: targetSlot,
          quality: 'Fraco',
          power_bonus: 0,
          market_value_base: 20,
          description: 'Refugo mecânico de montagem inter-marcas incompatível com as tolerâncias de fábrica (reprovado na inspeção).',
        }
      } else {
        overclock = true
        const sumPower = parts.reduce((acc, p) => acc + (p.power_bonus || 10), 0)
        const boostedPower = Math.round(sumPower * 1.15)
        createdItem = {
          item_instance_id: `mod_item_${Date.now()}`,
          name: `${baseName || 'Artefato Modular Híbrido'} (Overclock)`,
          slot_type: (parts[0]?.compatible_slots?.[0] || 'Arsenal Ofensivo') as any,
          quality: 'Ótimo',
          power_bonus: boostedPower,
          market_value_base: parts.reduce((acc, p) => acc + (p.base_cost || 100), 0) * 1.3,
          description: 'Artefato montado com peças de marcas distintas sob tensão de overclock não-autorizado (+15% poder).',
        }
      }
    } else {
      const sumPower = parts.reduce((acc, p) => acc + (p.power_bonus || 10), 0)
      const tunedPower = Math.round(sumPower * 1.05)
      createdItem = {
        item_instance_id: `mod_item_${Date.now()}`,
        name: baseName || 'Artefato Modular Padronizado',
        slot_type: (parts[0]?.compatible_slots?.[0] || 'Arsenal Ofensivo') as any,
        quality: 'Normal',
        power_bonus: tunedPower,
        market_value_base: parts.reduce((acc, p) => acc + (p.base_cost || 100), 0) * 1.2,
        description: 'Artefato de engenharia monomarca com tolerância dimensional perfeita (+5% sintonia).',
      }
    }

    let updatedState: GameState | null = null
    setGameState((prev: GameState): GameState => {
      const newWarehouse = { ...(prev.warehouse_parts ?? {}) }
      for (const pid of partIds) {
        if (newWarehouse[pid]) {
          newWarehouse[pid] = Math.max(0, newWarehouse[pid] - 1)
          if (newWarehouse[pid] === 0) delete newWarehouse[pid]
        }
      }
      updatedState = {
        ...prev,
        warehouse_parts: newWarehouse,
        inventory: [createdItem, ...prev.inventory],
      }
      return updatedState
    })

    return {
      success: true,
      item: createdItem,
      tinkering: isInterBrand,
      tinkering_success: tinkeringSuccess,
      overclock,
      message: isInterBrand
        ? tinkeringSuccess
          ? 'Overclock Homologado com Sucesso (+15% Poder)!'
          : 'Falha Mecânica: Gororoba Experimental gerada (20 ⬡).'
        : 'Montagem Padronizada Concluída com Sucesso (+5% Sintonia)!',
      state: updatedState ?? undefined,
      warehouse_parts: updatedState ? (updatedState as GameState).warehouse_parts : undefined,
    } as any
  }

  async function handleBuyModularPart(partId: string, quantity: number = 1) {
    if (isBackendOnline) {
      const res = await buyModularPartBackend(partId, quantity)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    const part = MOCK_MODULAR_PARTS.find(p => p.part_id === partId || p.id === partId)
    if (!part) return { success: false, message: 'Peça não localizada no catálogo.' } as any

    let updatedState: GameState | null = null
    let errorMsg = ''
    setGameState((prev: GameState): GameState => {
      const activeContract = (prev.active_b2b_contracts ?? []).find(c => c.corp_id === part.corp_id)
      const baseCost = part.base_cost ?? part.market_price_base ?? 50
      const unitPrice = activeContract
        ? Math.round(baseCost * (1 - activeContract.discount_pct))
        : Math.round(baseCost * 1.50)
      const totalCost = unitPrice * quantity

      if (prev.gold < totalCost) {
        errorMsg = `Tesouraria insuficiente: requer ${totalCost} ⬡, você possui ${prev.gold} ⬡.`
        return prev
      }

      const newWarehouse = {
        ...(prev.warehouse_parts ?? {}),
        [partId]: ((prev.warehouse_parts ?? {})[partId] ?? 0) + quantity,
      }
      updatedState = {
        ...prev,
        gold: prev.gold - totalCost,
        warehouse_parts: newWarehouse,
      }
      return updatedState
    })

    if (errorMsg) return { success: false, message: errorMsg } as any
    return {
      success: true,
      message: `Lote de ${quantity}x ${part.name} adquirido no mercado spot com sucesso!`,
      state: updatedState ?? undefined,
      warehouse_parts: updatedState ? (updatedState as GameState).warehouse_parts : undefined,
    } as any
  }

  // Nome do rival do dia
  const rivalGuild = gameState.current_fixture
    ? gameState.current_fixture.home_is_player
      ? gameState.current_fixture.away_name
      : gameState.current_fixture.home_name
    : 'Ordem do Grifo Dourado'

  return (
    <div className="min-h-screen flex flex-col guild-hall-atmosphere text-stone-100 selection:bg-amber-900 selection:text-amber-100">
      <Header
        state={gameState}
        isBackendOnline={isBackendOnline}
        onStateChange={(st) => handleStateChange(st, true)}
      />
      <PhaseStepper currentPhase={gameState.current_phase} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard state={gameState} onAdvancePhase={advancePhase} />
            }
          />
          <Route
            path="/phase1"
            element={
              <Phase1HR
                team={gameState.team}
                gold={gameState.gold}
                medicalFacilities={gameState.medical_facilities}
                pendingRenewals={gameState.pending_contract_renewals}
                youthAcademy={gameState.youth_academy}
                activeEvent={gameState.active_event}
                onAdvance={handleAdvanceFromPhase1}
                onStateUpdate={handleStateChange as any}
              />
            }
          />
          <Route
            path="/phase2"
            element={
              <Phase2Workshop
                state={gameState}
                onAdvance={handleAdvanceFromPhase2}
                onCraft={handleCraft}
                onUpgradeWorkshop={handleUpgradeWorkshop}
                onBuyMaterial={handleBuyMaterial}
                onBuyItem={handleBuyItem}
                onSellItem={handleSellItem}
                onResolveOffer={handleResolveOffer}
                onLearnAffix={handleLearnAffix}
                onStateUpdate={handleStateChange as any}
                onSignB2BContract={handleSignB2BContract}
                onCancelB2BContract={handleCancelB2BContract}
                onHireAssemblyWorker={handleHireAssemblyWorker}
                onSetWorkerOrder={handleSetWorkerOrder}
                onDismissAssemblyWorker={handleDismissAssemblyWorker}
                onAssembleModularItem={handleAssembleModularItem}
                onBuyModularPart={handleBuyModularPart}
              />
            }
          />
          <Route
            path="/phase3"
            element={
              <Phase3Tactics
                state={gameState}
                onAdvance={handleAdvanceFromPhase3}
                onSaveTactics={handleSaveTactics}
              />
            }
          />
          <Route
            path="/phase4"
            element={
              <Phase4Dungeon
                onAdvance={handleAdvanceFromPhase4}
                onExecuteExpedition={handleExecuteExpedition}
                day={gameState.day}
                rivalGuildName={rivalGuild}
                state={gameState}
                currentDungeon={gameState.current_dungeon}
              />
            }
          />
          <Route
            path="/phase5"
            element={
              <Phase5Results state={gameState} onAdvance={advancePhase} />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
