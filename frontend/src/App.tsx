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
  buyMaterialBackend,
  buyItemBackend,
  sellItemBackend,
  resolveOfferBackend,
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

  // Handler para salvar tática
  async function handleSaveTactics(starters: string[], loadout: Record<string, any>) {
    if (isBackendOnline) {
      const res = await saveTacticsBackend(starters, loadout)
      if (res && res.state) {
        setGameState(prev => ({ ...prev, ...res.state }))
      }
      return res
    }
    setGameState(prev => ({
      ...prev,
      tactics: { starters, loadout: loadout as any }
    }))
    return null
  }

  // Handlers para o módulo de Oficina e Balcão
  async function handleCraft(recipeId: string) {
    if (isBackendOnline) {
      const res = await craftItemBackend(recipeId)
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

  async function handleSellItem(instanceId: string, basePrice: number, margin: string) {
    if (isBackendOnline) {
      const res = await sellItemBackend(instanceId, basePrice, margin)
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
      <Header state={gameState} isBackendOnline={isBackendOnline} />
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
              <Phase1HR team={gameState.team} onAdvance={advancePhase} />
            }
          />
          <Route
            path="/phase2"
            element={
              <Phase2Workshop
                state={gameState}
                onAdvance={advancePhase}
                onCraft={handleCraft}
                onBuyMaterial={handleBuyMaterial}
                onBuyItem={handleBuyItem}
                onSellItem={handleSellItem}
                onResolveOffer={handleResolveOffer}
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
                onAdvance={advancePhase}
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
