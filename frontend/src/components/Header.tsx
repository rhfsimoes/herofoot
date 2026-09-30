import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Coins,
  Trophy,
  Star,
  FolderArchive,
  Save,
  Download,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Crown,
} from 'lucide-react'
import type { GameState, SaveSlotInfo } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'
import {
  fetchSavesBackend,
  saveGameBackend,
  loadGameBackend,
  newGameBackend,
} from '../api'
import { GuildCrest } from './art'
import PhaseProgress from './PhaseProgress'

interface HeaderProps {
  state: GameState
  isBackendOnline?: boolean
  onStateChange?: (newState: GameState) => void
}

const DEFAULT_SLOTS: SaveSlotInfo[] = [
  { slot: 'slot_1', label: 'Compartimento 1', exists: false },
  { slot: 'slot_2', label: 'Compartimento 2', exists: false },
  { slot: 'slot_3', label: 'Compartimento 3', exists: false },
  { slot: 'autosave', label: 'Salvamento Automático', exists: false },
]

function generateTimestamp(): string {
  return new Date().toISOString()
}

export default function Header({ state, isBackendOnline, onStateChange }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>(DEFAULT_SLOTS)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Posição do jogador na liga
  const playerRank = (
    state.league_table?.find((r: any) => r.is_player || r.guild_name === 'Guilda do Jogador' || r.id === 'g_player') ||
    state.divisions?.find((d: any) => d.is_player_division)?.standings?.find((r: any) => r.is_player || r.guild_name === 'Guilda do Jogador' || r.id === 'g_player')
  )?.rank ?? 1

  const reputation = 85

  const loadSaves = useCallback(async () => {
    if (!isBackendOnline) {
      // Modo local simulado
      const localSaves = localStorage.getItem('herofoot_saves')
      if (localSaves) {
        try {
          setSaveSlots(JSON.parse(localSaves))
          return
        } catch {
          // ignore
        }
      }
      setSaveSlots(DEFAULT_SLOTS)
      return
    }

    try {
      const saves = await fetchSavesBackend()
      if (saves && Array.isArray(saves)) {
        setSaveSlots(saves)
      }
    } catch (err) {
      console.warn('Erro ao carregar lista de saves:', err)
    }
  }, [isBackendOnline])

  const handleOpenMenu = useCallback(() => {
    setFeedback(null)
    setIsMenuOpen(true)
    loadSaves()
  }, [loadSaves])

  async function handleSave(slotId: string, exists: boolean) {
    if (exists) {
      const confirmed = window.confirm(
        `Confirmação de Arquivamento:\nSobrescrever o registro existente no compartimento '${slotId}'?`
      )
      if (!confirmed) return
    }

    setLoadingAction(`save_${slotId}`)
    setFeedback(null)

    if (isBackendOnline) {
      const res = await saveGameBackend(slotId)
      setLoadingAction(null)
      if (res && res.success) {
        setFeedback({
          type: 'success',
          text: res.message || `Registro corporativo arquivado com sucesso no compartimento [${slotId}].`,
        })
        if (res.saves && Array.isArray(res.saves)) {
          setSaveSlots(res.saves)
        } else {
          await loadSaves()
        }
        if (onStateChange) {
          onStateChange({
            ...state,
            active_slot: res.slot || slotId,
          })
        }
      } else {
        setFeedback({
          type: 'error',
          text: res?.error || res?.message || 'Falha ao registrar arquivamento no servidor.',
        })
      }
      return
    }

    // Fallback local
    const now = generateTimestamp()
    const updated = saveSlots.map(s =>
      s.slot === slotId
        ? {
            ...s,
            exists: true,
            week: state.week || state.day,
            day: state.day,
            gold: state.gold,
            timestamp: now,
            team_size: state.team?.length || 5,
          }
        : s
    )
    setSaveSlots(updated)
    localStorage.setItem('herofoot_saves', JSON.stringify(updated))
    localStorage.setItem(`herofoot_state_${slotId}`, JSON.stringify(state))
    setLoadingAction(null)
    setFeedback({
      type: 'success',
      text: `[Modo Local] Progresso salvo no compartimento [${slotId}].`,
    })
  }

  async function handleLoad(slotId: string) {
    const confirmed = window.confirm(
      `Confirmação de Restauração:\nCarregar o arquivamento corporativo do compartimento '${slotId}'? Quaisquer alterações não salvas serão substituídas.`
    )
    if (!confirmed) return

    setLoadingAction(`load_${slotId}`)
    setFeedback(null)

    if (isBackendOnline) {
      const res = await loadGameBackend(slotId)
      setLoadingAction(null)
      if (res && res.success && res.state) {
        setFeedback({
          type: 'success',
          text: res.message || `Auditoria fiscal concluída: sessão [${slotId}] carregada com sucesso.`,
        })
        if (onStateChange) {
          onStateChange(res.state)
        }
        setTimeout(() => setIsMenuOpen(false), 1000)
      } else {
        setFeedback({
          type: 'error',
          text: res?.error || res?.message || 'Falha ao carregar save corporativo.',
        })
      }
      return
    }

    // Fallback local
    const savedStateStr = localStorage.getItem(`herofoot_state_${slotId}`)
    setLoadingAction(null)
    if (savedStateStr) {
      try {
        const loadedState = JSON.parse(savedStateStr)
        if (onStateChange) onStateChange(loadedState)
        setFeedback({ type: 'success', text: `Sessão [${slotId}] carregada localmente.` })
        setTimeout(() => setIsMenuOpen(false), 800)
        return
      } catch {
        // error
      }
    }
    setFeedback({ type: 'error', text: 'Compartimento corrompido ou inacessível no armazenamento local.' })
  }

  async function handleNewGame() {
    const confirmed = window.confirm(
      'Atenção — Abertura de Novo Exercício Fiscal:\nIniciar um Novo Jogo? O estado operacional da guilda será reiniciado a partir dos alvarás fundamentais.'
    )
    if (!confirmed) return

    setLoadingAction('new_game')
    setFeedback(null)

    if (isBackendOnline) {
      const res = await newGameBackend('autosave')
      setLoadingAction(null)
      if (res && res.success && res.state) {
        setFeedback({
          type: 'success',
          text: res.message || 'Novo exercício fiscal iniciado sob alvará da Liga.',
        })
        if (onStateChange) {
          onStateChange(res.state)
        }
        setTimeout(() => setIsMenuOpen(false), 1000)
      } else {
        setFeedback({
          type: 'error',
          text: res?.error || res?.message || 'Falha ao processar abertura de novo exercício fiscal.',
        })
      }
      return
    }

    // Fallback local
    setLoadingAction(null)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur border-b border-stone-800 px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        {/* Nome da Loja / Guilda com Brasão Heráldico */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" title="Brasão Heráldico da Guilda">
            <GuildCrest size={46} guildName="HEROFOOT" variant="full" interactive />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-amber-100 font-black text-sm tracking-wider uppercase">
                Guilda do Jogador
              </h1>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isBackendOnline
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
                title={isBackendOnline ? 'Conexão ativa com o backend' : 'Modo autônomo offline'}
              >
                {isBackendOnline ? '● ONLINE' : '○ LOCAL'}
              </span>
            </div>
            <p className="text-stone-400 text-[11px] flex items-center gap-1.5 flex-wrap">
              <span className="text-amber-300 font-bold">Temporada {state.season ?? 1}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-300">{state.current_division?.name ?? 'Divisão de Acesso Mercante'}</span>
            </p>
          </div>
        </div>

        {/* KPIs em Cards de Madeira & Ouro + Menu da Guilda */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Saldo em Ouro */}
          <div className="bg-[#1c1917] border border-amber-950/50 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block -mb-0.5">Caixa</span>
              <span className={`${GOLD_GRADIENT_TEXT} text-base`}>
                {state.gold.toLocaleString('pt-BR')} <span className="text-xs text-amber-300 font-bold">G</span>
              </span>
            </div>
          </div>

          {/* Posição na Liga */}
          <div className="bg-[#1c1917] border border-stone-800 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 shadow-md">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 block -mb-0.5">Liga</span>
              <span className="bg-stone-900 border border-amber-900/50 text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold inline-block">
                {playerRank}º Lugar
              </span>
            </div>
          </div>

          {/* Metas da Coroa */}
          {state.crown_goals && (
            <div
              className="hidden lg:flex bg-[#1c1917] border border-amber-950/60 rounded-xl px-3.5 py-1.5 items-center gap-2.5 shadow-md cursor-default"
              title={`Metas da Coroa: ${state.crown_goals.goals_completed_count} de ${state.crown_goals.goals.length} aprovadas. Prazo: Semana ${state.crown_goals.cycle_deadline_week}.`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block -mb-0.5">
                  Metas Reais (T{state.crown_goals.current_cycle})
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {state.crown_goals.goals_completed_count}/3 Homologadas
                </span>
              </div>
            </div>
          )}

          {/* Confiança da População */}
          <div className="hidden md:flex bg-[#1c1917] border border-stone-800 rounded-xl px-3.5 py-1.5 items-center gap-2.5 shadow-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            <div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-stone-400 gap-2 -mb-0.5">
                <span>Confiança</span>
                <span className="text-stone-300 font-bold">{reputation}%</span>
              </div>
              <div className="w-16 bg-stone-800 rounded-full h-1.5 mt-1 overflow-hidden border border-stone-700/50">
                <div
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-1.5 rounded-full"
                  style={{ width: `${reputation}%` }}
                />
              </div>
            </div>
          </div>

          {/* Semana / Rodada Atual (R-X) */}
          <div className="bg-stone-900 border-2 border-amber-500/80 rounded-xl px-3.5 py-1.5 flex flex-col items-center justify-center shadow-lg shadow-amber-950/40">
            <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold">Semana</span>
            <span className="text-sm font-black text-amber-100 font-mono">
              R-{state.week ?? state.day}
            </span>
          </div>

          {/* Progresso de Fases */}
          <PhaseProgress
            currentPhase={state.current_phase ?? 1}
            week={state.week ?? state.day ?? 1}
          />

          {/* BOTÃO DO MENU DA GUILDA (SAVES E ARQUIVO) */}
          <button
            onClick={handleOpenMenu}
            className="bg-gradient-to-r from-amber-700/70 to-amber-900/90 border border-amber-500/60 hover:border-amber-400 text-amber-100 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-950/40 hover:brightness-110 transition active:scale-95 text-xs font-black uppercase tracking-wider"
            title="Menu de Gestão de Arquivamento, Salvamento e Novo Exercício Fiscal"
          >
            <FolderArchive className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Menu da Guilda</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          MODAL DE ARQUIVAMENTO CORPORATIVO (SAVES / LOAD)
         ───────────────────────────────────────────── */}
      {isMenuOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-stone-900 border-2 border-amber-800/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-stone-200">
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-start border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600/50 flex items-center justify-center text-amber-400">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-amber-100 font-black text-lg uppercase tracking-wide">
                    Arquivo Geral da Corporação
                  </h3>
                  <p className="text-xs text-stone-400">
                    Controle de Exercícios Fiscais, Livros Contábeis e Salvamento Atômico de Sessão.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-stone-400 hover:text-amber-200 p-1 rounded-lg hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerta de Feedback */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-700 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                )}
                <div>
                  <strong className="block font-bold mb-0.5">
                    {feedback.type === 'success' ? 'Protocolo Homologado' : 'Aviso de Não-Conformidade'}
                  </strong>
                  <span>{feedback.text}</span>
                </div>
              </div>
            )}

            {/* Lista dos 4 Compartimentos de Arquivo */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>Compartimentos de Persistência em Cofre</span>
                <span className="text-[10px] text-stone-500 font-normal">(Slots 1 a 3 & Salvamento Automático)</span>
              </h4>

              <div className="grid gap-3">
                {saveSlots.map(slot => {
                  const isCurrentActive = state.active_slot === slot.slot
                  const isSavingThis = loadingAction === `save_${slot.slot}`
                  const isLoadingThis = loadingAction === `load_${slot.slot}`

                  return (
                    <div
                      key={slot.slot}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrentActive
                          ? 'bg-amber-950/30 border-amber-600/70 shadow-md shadow-amber-950/30'
                          : slot.exists
                          ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                          : 'bg-stone-950/40 border-stone-800/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-200">
                              {slot.label || slot.slot}
                            </span>
                            {slot.slot === 'autosave' && (
                              <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                SISTEMA
                              </span>
                            )}
                            {isCurrentActive && (
                              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">
                                SESSÃO ATIVA
                              </span>
                            )}
                            {slot.corrupted && (
                              <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                CORROMPIDO
                              </span>
                            )}
                          </div>

                          {slot.exists && !slot.corrupted ? (
                            <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                              <span className="text-amber-400 font-bold">
                                Semana R-{slot.week ?? slot.day ?? 1}
                              </span>
                              <span className="text-stone-600">·</span>
                              <span className="text-stone-300">
                                ⬡ {(slot.gold ?? 0).toLocaleString('pt-BR')} Ouro
                              </span>
                              {slot.team_size !== undefined && (
                                <>
                                  <span className="text-stone-600">·</span>
                                  <span>{slot.team_size} Colaboradores</span>
                                </>
                              )}
                              {slot.timestamp && (
                                <>
                                  <span className="text-stone-600">·</span>
                                  <span className="text-stone-500 text-[11px]">
                                    {new Date(slot.timestamp).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : slot.corrupted ? (
                            <p className="text-xs text-rose-400 font-mono">
                              {slot.error || 'Falha de verificação de integridade no cofre.'}
                            </p>
                          ) : (
                            <p className="text-xs text-stone-500 italic">
                              Compartimento vazio. Sem atas arquivadas neste compartimento.
                            </p>
                          )}
                        </div>

                        {/* Botões de Ação para o Slot */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {/* Botão Salvar */}
                          <button
                            onClick={() => handleSave(slot.slot, slot.exists)}
                            disabled={loadingAction !== null}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40"
                            title={`Gravar estado operacional atual no ${slot.label}`}
                          >
                            <Save className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isSavingThis ? 'Arquivando...' : 'Salvar'}</span>
                          </button>

                          {/* Botão Carregar */}
                          <button
                            onClick={() => handleLoad(slot.slot)}
                            disabled={!slot.exists || slot.corrupted || loadingAction !== null}
                            className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition disabled:opacity-30 disabled:pointer-events-none"
                            title={`Carregar ata registrada no ${slot.label}`}
                          >
                            <Download className="w-3.5 h-3.5 text-stone-950" />
                            <span>{isLoadingThis ? 'Restaurando...' : 'Carregar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Divisor & Seção de Novo Jogo */}
            <div className="border-t border-stone-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-300">
                  Abertura de Novo Exercício Fiscal
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Restaura o estado da guilda para a Semana 1 a partir dos registros fundamentais da Liga.
                </p>
              </div>

              <button
                onClick={handleNewGame}
                disabled={loadingAction !== null}
                className="bg-stone-800 hover:bg-rose-950 hover:border-rose-700 text-stone-300 hover:text-rose-200 border border-stone-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-40"
              >
                <PlusCircle className="w-4 h-4 text-stone-400" />
                <span>{loadingAction === 'new_game' ? 'Reiniciando...' : 'Novo Exercício Fiscal'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}

