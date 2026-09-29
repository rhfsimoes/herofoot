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
import { MOCK_STATE, type GameState } from './mockData'
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
  async function handleCraft(payload: string | { recipe_id: string; branch?: string; prefix_id?: string | null; suffix_id?: string | null; prefix_material_id?: string | null; suffix_material_id?: string | null }) {
    if (isBackendOnline) {
      const res = await craftItemBackend(payload)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  async function handleLearnAffix(affixId: string) {
    if (isBackendOnline) {
      const res = await learnAffixBackend(affixId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  async function handleUpgradeWorkshop(branch: string) {
    if (isBackendOnline) {
      const res = await upgradeWorkshopBackend(branch)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  async function handleBuyMaterial(matId: string, qty: number) {
    if (isBackendOnline) {
      const res = await buyMaterialBackend(matId, qty)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
  }

  async function handleBuyItem(marketItemId: string) {
    if (isBackendOnline) {
      const res = await buyItemBackend(marketItemId)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    return null
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
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100">
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
                lastRoundResults={gameState.last_round_matches}
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
