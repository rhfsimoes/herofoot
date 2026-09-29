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
import { MOCK_STATE, MOCK_RECIPES, WORKSHOP_XP_TABLE, type GameState, type InventoryItem, type Recipe } from './mockData'
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

  function handleStateChange(newState: GameState) {
    setGameState(prev => ({
      ...prev,
      ...newState,
      day: newState.day || newState.week || prev.day,
      current_phase: newState.current_phase || prev.current_phase,
    }))
    const targetPhase = newState.current_phase || 1
    navigate(PHASE_PATHS[targetPhase] || '/')
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
    const isTinkering = typeof payload === 'string' ? false : (payload.is_tinkering ?? false)
    let createdItem: InventoryItem | null = null
    let updatedState: GameState | null = null
    let xpGained = 10
    let tinkeringSuccess = true

    setGameState((prev: GameState): GameState => {
      const recipes: Recipe[] = prev.recipes ? Object.values(prev.recipes) : MOCK_RECIPES
      const rec = recipes.find(r => (r.recipe_id || r.id) === recipeId) || recipes[0]
      const branch = (typeof payload !== 'string' && payload.branch) ? payload.branch : (rec?.branch || 'Ferragem')
      const currentBranchLvl = prev.workshop_levels?.[branch] ?? 1
      const recipeMinLvl = rec?.min_workshop_level ?? 1
      const newMaterials = { ...prev.materials }
      
      // Deduct ingredients
      if (rec?.ingredients) {
        rec.ingredients.forEach((ing: any) => {
          const mid = ing.material_id || ing.item_id
          const qty = ing.quantity || 1
          newMaterials[mid] = Math.max(0, (newMaterials[mid] ?? 0) - qty)
        })
      }

      if (isTinkering) {
        const diff = Math.max(1, recipeMinLvl - currentBranchLvl)
        const successChance = Math.max(0.05, 1 - diff * 0.35)
        tinkeringSuccess = Math.random() <= successChance

        if (tinkeringSuccess) {
          const nominalXp = recipeMinLvl >= 3 ? 60 : (recipeMinLvl === 2 ? 25 : 10)
          xpGained = Math.round(nominalXp * 1.5)
          createdItem = {
            item_instance_id: `item_craft_${Date.now()}`,
            name: `${prefixId ? prefixId + ' ' : ''}${rec?.base_item || rec?.name || 'Item'}${suffixId ? ' ' + suffixId : ''}`.trim(),
            slot_type: (rec?.slot as any) || 'Arma',
            quality: 'Normal',
            power_bonus: rec?.base_power || 20,
            market_value_base: rec?.market_value_base || 150,
          }
        } else {
          xpGained = 5
          createdItem = {
            item_instance_id: `item_craft_gororoba_${Date.now()}`,
            name: `Gororoba Experimental de ${rec?.name || 'Projeto'}`,
            slot_type: 'Consumível',
            quality: 'Fraco',
            power_bonus: 0,
            market_value_base: 20,
          }
        }
      } else {
        xpGained = recipeMinLvl >= 3 ? 60 : (recipeMinLvl === 2 ? 25 : 10)
        createdItem = {
          item_instance_id: `item_craft_${Date.now()}`,
          name: `${prefixId ? prefixId + ' ' : ''}${rec?.base_item || rec?.name || 'Item'}${suffixId ? ' ' + suffixId : ''}`.trim(),
          slot_type: (rec?.slot as any) || 'Arma',
          quality: 'Normal',
          power_bonus: rec?.base_power || 20,
          market_value_base: rec?.market_value_base || 150,
        }
      }

      const curBranchXp = prev.workshop_xp?.[branch] ?? 0
      const newWorkshopXp = {
        ...(prev.workshop_xp || {}),
        [branch]: curBranchXp + xpGained,
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
        recipe_unlocked: true,
      },
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
    setGameState((prev: GameState): GameState => {
      const currentLvl = prev.workshop_levels?.[branch] ?? 1
      if (currentLvl >= 6) return prev
      const cost = WORKSHOP_XP_TABLE[currentLvl]?.upgrade_cost ?? 500
      const xpReq = WORKSHOP_XP_TABLE[currentLvl]?.xp_to_next ?? 100
      const curXp = prev.workshop_xp?.[branch] ?? 0
      if (prev.gold < cost || curXp < xpReq) return prev

      updatedState = {
        ...prev,
        gold: prev.gold - cost,
        workshop_levels: {
          ...prev.workshop_levels,
          [branch]: currentLvl + 1,
        },
        workshop_xp: {
          ...(prev.workshop_xp || {}),
          [branch]: Math.max(0, curXp - xpReq),
        },
      }
      return updatedState
    })
    return { success: true, result: { success: true, level: (updatedState as any)?.workshop_levels?.[branch] }, state: updatedState ?? undefined } as any
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
        onStateChange={handleStateChange}
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
                onAdvance={advancePhase}
                onStateUpdate={handleStateChange as any}
              />
            }
          />
          <Route
            path="/phase2"
            element={
              <Phase2Workshop
                state={gameState}
                onAdvance={advancePhase}
                onCraft={handleCraft}
                onUpgradeWorkshop={handleUpgradeWorkshop}
                onBuyMaterial={handleBuyMaterial}
                onBuyItem={handleBuyItem}
                onSellItem={handleSellItem}
                onResolveOffer={handleResolveOffer}
                onLearnAffix={handleLearnAffix}
                onStateUpdate={handleStateChange as any}
              />
            }
          />
          <Route
            path="/phase3"
            element={
              <Phase3Tactics
                state={gameState}
                onAdvance={advancePhase}
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
