import { useState } from 'react'
import {
  Zap,
  Swords,
  HeartPulse,
  Sparkles,
  Bed,
  UserX,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  DollarSign,
  Utensils,
  Clock,
  Smile,
  GraduationCap,
  Star,
  Award
} from 'lucide-react'
import type { Hero, MedicalFacilityInfo, PendingContractRenewal, GameState } from '../mockData'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'
import {
  upgradeMedicalFacilityBackend,
  treatHeroMassageBackend,
  accelerateInjuryBackend,
  collectiveBanquetBackend,
  renewContractBackend,
  releaseContractBackend,
  promoteYouthBackend,
  dismissYouthBackend
} from '../api'

interface Phase1HRProps {
  team: Hero[]
  gold?: number
  medicalFacilities?: MedicalFacilityInfo
  pendingRenewals?: PendingContractRenewal[]
  youthAcademy?: Hero[]
  onAdvance: () => void
  onStateUpdate?: (newState: Partial<GameState>) => void
}

export default function Phase1HR({
  team: initialTeam,
  gold = 1000,
  medicalFacilities: initialFacilities,
  pendingRenewals: initialRenewals = [],
  youthAcademy: initialYouthAcademy = [],
  onAdvance,
  onStateUpdate
}: Phase1HRProps) {
  const [team, setTeam] = useState<Hero[]>(initialTeam)
  const [currentGold, setCurrentGold] = useState<number>(gold)
  const [facilities, setFacilities] = useState<MedicalFacilityInfo | undefined>(initialFacilities)
  const [renewals, setRenewals] = useState<PendingContractRenewal[]>(initialRenewals)
  const [youthAcademy, setYouthAcademy] = useState<Hero[]>(initialYouthAcademy)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Modernização do Departamento Médico
  async function handleUpgradeFacility() {
    setIsLoading(true)
    try {
      const res = await upgradeMedicalFacilityBackend()
      if (res && res.success) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          setFacilities(res.state.medical_facilities)
          onStateUpdate?.(res.state)
        } else if (res.gold !== undefined) {
          setCurrentGold(res.gold)
          if (res.facilities) setFacilities(res.facilities)
          onStateUpdate?.({ gold: res.gold, medical_facilities: res.facilities })
        }
        setActionLog(l => [res.message || 'Departamento Médico modernizado com sucesso.', ...l])
      } else {
        alert(res?.message || 'Falha ao processar modernização predial.')
      }
    } catch {
      alert('Erro de conexão com o servidor de obras.')
    } finally {
      setIsLoading(false)
    }
  }

  // Massagem e Banhos Termais avulsa
  async function handleMassage(heroId: string) {
    setIsLoading(true)
    try {
      const res = await treatHeroMassageBackend(heroId)
      const isSuccess = (res?.success ?? res?.result?.success) ?? false
      if (res && isSuccess) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          onStateUpdate?.(res.state)
        } else if (res.hero || res.result?.hero) {
          const hData = res.hero || res.result?.hero
          setTeam(prev => prev.map(h => (h.id === heroId ? { ...h, ...hData } : h)))
          const gVal = res.gold ?? res.result?.gold
          if (gVal !== undefined) {
            setCurrentGold(gVal)
            onStateUpdate?.({ gold: gVal })
          }
        }
        setActionLog(l => [res.message || res.result?.message || 'Sessão de massagem realizada.', ...l])
      } else if (res) {
        alert(res?.message || res?.result?.message || 'Não foi possível autorizar a sessão de massagem.')
      } else {
        // Fallback local se backend offline
        const hero = team.find(h => h.id === heroId)
        if (hero) {
          if (currentGold < 75) {
            alert('Saldo insuficiente em tesouraria (Custo: 75 Ouro).')
            return
          }
          if (hero.fatigue <= 0) {
            alert(`Laudo Clínico: ${hero.name} já se encontra com 0% de fadiga.`)
            return
          }
          const newGold = currentGold - 75
          const newFatigue = Math.max(0, hero.fatigue - 40)
          const updatedTeam = team.map(h =>
            h.id === heroId
              ? {
                  ...h,
                  fatigue: newFatigue,
                  status: newFatigue < 70 && !h.injured ? 'Apto' : h.status,
                  happiness: Math.min(100, (h.happiness ?? 80) + 5),
                }
              : h
          )
          setTeam(updatedTeam)
          setCurrentGold(newGold)
          onStateUpdate?.({ gold: newGold, team: updatedTeam })
          setActionLog(l => [`[Sessão de Massagem] ${hero.name} aliviou 40 pontos de fadiga.`, ...l])
        }
      }
    } catch {
      alert('Erro de conexão ao solicitar procedimento terapêutico.')
    } finally {
      setIsLoading(false)
    }
  }

  // Tratamento especializado para acelerar lesão
  async function handleAccelerateInjury(heroId: string) {
    setIsLoading(true)
    try {
      const res = await accelerateInjuryBackend(heroId)
      if (res && res.success) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          onStateUpdate?.(res.state)
        } else if (res.hero) {
          setTeam(prev => prev.map(h => (h.id === heroId ? { ...h, ...res.hero } : h)))
          if (res.gold !== undefined) {
            setCurrentGold(res.gold)
            onStateUpdate?.({ gold: res.gold })
          }
        }
        setActionLog(l => [res.message || 'Tratamento de lesão administrado.', ...l])
      } else {
        alert(res?.message || 'Não foi possível ministrar o tratamento alquímico.')
      }
    } catch {
      alert('Erro de conexão com o corpo clínico.')
    } finally {
      setIsLoading(false)
    }
  }

  // Banquete coletivo
  async function handleCollectiveBanquet() {
    setIsLoading(true)
    try {
      const res = await collectiveBanquetBackend()
      if (res && res.success) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          onStateUpdate?.(res.state)
        } else if (res.gold !== undefined) {
          setCurrentGold(res.gold)
          setTeam(prev =>
            prev.map(h => ({
              ...h,
              fatigue: Math.max(0, h.fatigue - 25),
              status: h.fatigue - 25 < 70 && !h.injured ? 'Apto' : h.status,
              happiness: Math.min(100, (h.happiness ?? 80) + 10)
            }))
          )
          onStateUpdate?.({ gold: res.gold })
        }
        setActionLog(l => [res.message || 'Banquete Institucional realizado.', ...l])
      } else {
        alert(res?.message || 'Recursos insuficientes para o banquete.')
      }
    } catch {
      alert('Falha na comunicação com o refeitório central.')
    } finally {
      setIsLoading(false)
    }
  }

  // Homologar renovação de contrato
  async function handleRenewContract(heroId: string) {
    setIsLoading(true)
    try {
      const res = await renewContractBackend(heroId)
      if (res && res.success) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          setRenewals(res.state.pending_contract_renewals || [])
          onStateUpdate?.(res.state)
        } else {
          if (res.hero) {
            setTeam(prev => prev.map(h => (h.id === heroId ? { ...h, ...res.hero } : h)))
          }
          if (res.gold !== undefined) {
            setCurrentGold(res.gold)
            onStateUpdate?.({ gold: res.gold })
          }
          setRenewals(prev => prev.filter(r => r.hero_id !== heroId))
        }
        setActionLog(l => [res.message || 'Contrato homologado e luvas quitadas.', ...l])
      } else {
        alert(res?.message || 'Falha ao homologar renovação contratual.')
      }
    } catch {
      alert('Erro ao submeter aditivo contratual ao cartório da guilda.')
    } finally {
      setIsLoading(false)
    }
  }

  // Rescisão amigável de contrato
  async function handleReleaseContract(heroId: string) {
    if (!confirm('Confirmar rescisão contratual imediata deste aventureiro? Esta decisão é irrevogável.')) {
      return
    }
    setIsLoading(true)
    try {
      const res = await releaseContractBackend(heroId)
      if (res && res.success) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          setRenewals(res.state.pending_contract_renewals || [])
          onStateUpdate?.(res.state)
        } else {
          setTeam(prev => prev.filter(h => h.id !== heroId))
          setRenewals(prev => prev.filter(r => r.hero_id !== heroId))
        }
        setActionLog(l => [res.message || 'Rescisão homologada. Aventureiro desligado do quadro.', ...l])
      } else {
        alert(res?.message || 'Falha ao processar rescisão funcional.')
      }
    } catch {
      alert('Erro de conexão com o departamento de desligamento.')
    } finally {
      setIsLoading(false)
    }
  }

  // Promover aprendiz da base
  async function handlePromoteYouth(heroId: string) {
    if (team.length >= 12) {
      alert('Capacidade máxima do alojamento atingida: o quadro profissional já possui o limite de 12 colaboradores.')
      return
    }
    setIsLoading(true)
    try {
      const res = await promoteYouthBackend(heroId)
      const isSuccess = (res?.success ?? res?.result?.success) ?? false
      if (res && isSuccess) {
        if (res.state) {
          setTeam(res.state.team)
          setCurrentGold(res.state.gold)
          setYouthAcademy(res.state.youth_academy || [])
          onStateUpdate?.(res.state)
        } else {
          const promoted = youthAcademy.find(y => y.id === heroId)
          if (promoted) {
            const updatedYouth = youthAcademy.filter(y => y.id !== heroId)
            const updatedTeam = [...team, { ...promoted, salary: 35, contract_seasons_left: 2 }]
            setYouthAcademy(updatedYouth)
            setTeam(updatedTeam)
            onStateUpdate?.({ youth_academy: updatedYouth, team: updatedTeam })
          }
        }
        setActionLog(l => [res.message || res.result?.message || 'Promoção funcional homologada.', ...l])
      } else if (res) {
        alert(res?.message || res?.result?.message || 'Falha ao promover aprendiz da base.')
      } else {
        // Fallback local se backend offline
        const promoted = youthAcademy.find(y => y.id === heroId)
        if (promoted) {
          const updatedYouth = youthAcademy.filter(y => y.id !== heroId)
          const updatedTeam = [...team, { ...promoted, salary: 35, contract_seasons_left: 2 }]
          setYouthAcademy(updatedYouth)
          setTeam(updatedTeam)
          onStateUpdate?.({ youth_academy: updatedYouth, team: updatedTeam })
          setActionLog(l => [`[Promoção da Base] ${promoted.name} promovido ao quadro profissional.`, ...l])
        }
      }
    } catch {
      alert('Erro de conexão com o conselho pedagógico.')
    } finally {
      setIsLoading(false)
    }
  }

  // Dispensar aprendiz da base
  async function handleDismissYouth(heroId: string) {
    if (!confirm('Confirmar desligamento deste aprendiz do programa de base?')) {
      return
    }
    setIsLoading(true)
    try {
      const res = await dismissYouthBackend(heroId)
      const isSuccess = (res?.success ?? res?.result?.success) ?? false
      if (res && isSuccess) {
        if (res.state) {
          setYouthAcademy(res.state.youth_academy || [])
          onStateUpdate?.(res.state)
        } else {
          const updatedYouth = youthAcademy.filter(y => y.id !== heroId)
          setYouthAcademy(updatedYouth)
          onStateUpdate?.({ youth_academy: updatedYouth })
        }
        setActionLog(l => [res.message || res.result?.message || 'Desligamento de aprendiz formalizado.', ...l])
      } else if (res) {
        alert(res?.message || res?.result?.message || 'Falha ao dispensar aprendiz.')
      } else {
        const updatedYouth = youthAcademy.filter(y => y.id !== heroId)
        setYouthAcademy(updatedYouth)
        onStateUpdate?.({ youth_academy: updatedYouth })
        setActionLog(l => ['[Academia] Aprendiz desligado do programa de base.', ...l])
      }
    } catch {
      alert('Erro ao submeter desligamento.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentLevel = facilities?.current_level ?? 1
  const facilityName = facilities?.facility_name ?? 'Tenda de Curativos de Campanha'
  const passiveRecovery = facilities?.passive_recovery ?? 15
  const weeklyMaint = facilities?.weekly_maintenance ?? 20
  const injuryMitigation = Math.round((facilities?.injury_reduction_pct ?? 0) * 100)
  const nextUpgrade = facilities?.next_upgrade

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Cabeçalho da Fase */}
      <div className="border-b border-stone-800 pb-4 flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-mono text-xs uppercase tracking-widest font-bold">Fase I</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400 text-xs">Gestão do Efetivo & Bem-Estar</span>
          </div>
          <h2 className="text-amber-100 text-xl font-black mt-0.5 tracking-wide">
            Recursos Humanos, Medicina Ocupacional & Contratos
          </h2>
          <p className="text-stone-400 text-xs mt-1">
            Auditoria médica, recuperação física, renovação de vínculos funcionais e modernização predial da guilda.
          </p>
        </div>

        <button
          onClick={onAdvance}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50"
        >
          <span>Homologar Expediente & Avançar p/ Oficina</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Seção 1: Painel do Departamento Médico & Ações Coletivas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cartão de Instalação Médica */}
        <div className="md:col-span-2 bg-[#1c1917] border border-amber-950/40 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                      Instalação Nível {currentLevel} de 5
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                      Manutenção: ⬡ {weeklyMaint}/sem
                    </span>
                  </div>
                  <h3 className="text-amber-100 text-base font-black tracking-wide">
                    {facilityName}
                  </h3>
                </div>
              </div>

              {/* Botão de Upgrade */}
              {nextUpgrade ? (
                <button
                  onClick={handleUpgradeFacility}
                  disabled={isLoading || currentGold < nextUpgrade.cost}
                  className="px-3.5 py-2 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-700/60 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  title={`Custo: ${nextUpgrade.cost} Ouro`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Modernizar para Nível {nextUpgrade.level} (⬡ {nextUpgrade.cost})
                  </span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Nível Máximo Atingido
                </span>
              )}
            </div>

            <p className="text-stone-400 text-xs leading-relaxed">
              {facilities?.description || 'Instalação médica para tratamento e descompressão do efetivo da guilda.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800/70 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
              <span className="text-stone-500 text-[10px] block uppercase font-mono">Recuperação Passiva</span>
              <strong className="text-emerald-400 text-sm font-mono">+{passiveRecovery}% / sem</strong>
            </div>
            <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
              <span className="text-stone-500 text-[10px] block uppercase font-mono">Atenuação de Licenças</span>
              <strong className="text-amber-400 text-sm font-mono">-{injuryMitigation}% semanas</strong>
            </div>
            <div className="bg-stone-900/80 p-2 rounded-lg border border-stone-800">
              <span className="text-stone-500 text-[10px] block uppercase font-mono">Custo Operacional</span>
              <strong className="text-stone-300 text-sm font-mono">⬡ {weeklyMaint} / sem</strong>
            </div>
          </div>
        </div>

        {/* Cartão de Ações Coletivas */}
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Utensils className="w-4 h-4" />
              <h4 className="text-amber-200 text-xs font-black uppercase tracking-wider">
                Bem-Estar Coletivo & Moral
              </h4>
            </div>
            <p className="text-stone-400 text-xs mb-4">
              Realize eventos de integração e descompressão para aliviar o esgotamento profissional de todo o quadro simultaneamente.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCollectiveBanquet}
              disabled={isLoading || currentGold < 350}
              className="w-full py-2.5 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-900/50 hover:border-amber-700/60 text-stone-200 text-xs font-bold transition flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <div className="text-stone-100 text-xs">Banquete Institucional</div>
                  <div className="text-[10px] text-stone-400">-25 Fadiga & +10 Felicidade Geral</div>
                </div>
              </div>
              <span className="text-amber-400 font-mono text-xs font-bold">⬡ 350 Ouro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção 2: Pendências de Renovação Contratual de Temporada */}
      {renewals.length > 0 && (
        <div className="bg-rose-950/20 border-2 border-rose-800/60 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 text-rose-300 border-b border-rose-800/40 pb-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <h3 className="text-rose-200 text-sm font-black uppercase tracking-wider">
                Pendências de Renovação Contratual ({renewals.length})
              </h3>
              <p className="text-rose-300/80 text-xs">
                A vigência dos contratos de temporada expirou. Homologue a renovação mediante pagamento das luvas exigidas ou realize a rescisão funcional amigável.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renewals.map(r => (
              <div
                key={r.hero_id}
                className="bg-stone-900/90 border border-stone-800 rounded-lg p-3.5 flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-stone-100 font-bold text-xs">{r.hero_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/50">
                      Vínculo Vencido
                    </span>
                  </div>
                  <div className="mt-2 text-xs space-y-1 text-stone-400">
                    <div className="flex justify-between">
                      <span>Salário Atual vs Exigido:</span>
                      <strong className="text-amber-300 font-mono">
                        ⬡ {r.current_salary} ➔ ⬡ {r.demanded_salary}/sem
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Bônus de Assinatura (Luvas):</span>
                      <strong className="text-rose-300 font-mono">⬡ {r.signing_bonus} Ouro</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Novo Prazo Contratual:</span>
                      <strong className="text-stone-200 font-mono">{r.seasons} Temporadas</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => handleRenewContract(r.hero_id)}
                    disabled={isLoading || currentGold < r.signing_bonus}
                    className="flex-1 py-1.5 px-3 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Pagar ⬡ ${r.signing_bonus} Ouro`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Homologar Renovação (⬡ {r.signing_bonus})</span>
                  </button>

                  <button
                    onClick={() => handleReleaseContract(r.hero_id)}
                    disabled={isLoading}
                    className="py-1.5 px-3 rounded bg-stone-900 hover:bg-rose-950 border border-stone-700 hover:border-rose-900 text-stone-400 hover:text-rose-300 text-xs font-bold transition flex items-center gap-1"
                    title="Rescindir vínculo sem custos"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Rescindir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção: Academia de Base & Novos Talentos */}
      <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-amber-100 text-sm font-black uppercase tracking-wider">
                  Academia de Base & Alojamento de Aprendizes ({youthAcademy.length} de 4)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                  Manutenção: ⬡ 40 Ouro/sem
                </span>
              </div>
              <p className="text-stone-400 text-xs">
                O único setor onde o <strong className="text-amber-300">Potencial em Estrelas é 100% Revelado</strong> antes da promoção profissional.
              </p>
            </div>
          </div>
        </div>

        {youthAcademy.length === 0 ? (
          <div className="text-center py-6 text-stone-500 text-xs italic">
            Nenhum jovem em formação no momento. Novos aprendizes se alistam periodicamente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {youthAcademy.map(y => {
              const stars = y.potential?.star_potential ?? 3
              return (
                <div
                  key={y.id}
                  className="bg-stone-900/80 border border-stone-800 hover:border-amber-900/50 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow transition"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-stone-100 font-bold text-xs block">{y.name}</span>
                        <span className="text-[10px] text-stone-400">
                          {y.age} anos · {y.class_name ?? y.class ?? 'Combatente'} {y.specialization_name ? `(${y.specialization_name})` : ''}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-amber-400 border border-stone-700">
                        {y.current_power ?? 40} Pod.
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-800/80">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-400">Potencial:</span>
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
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                        {stars >= 4 ? 'Alta Projeção de Carreira' : stars === 3 ? 'Potencial Padrão' : 'Margem Limitada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-stone-800">
                    <button
                      onClick={() => handlePromoteYouth(y.id)}
                      disabled={isLoading || team.length >= 12}
                      className="flex-1 py-1.5 px-2 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-700/60 text-amber-200 text-[10px] font-bold transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={team.length >= 12 ? 'Plantel cheio (máx 12)' : 'Promover ao quadro profissional (Vínculo 2 temporadas)'}
                    >
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>Promover</span>
                    </button>
                    <button
                      onClick={() => handleDismissYouth(y.id)}
                      disabled={isLoading}
                      className="p-1.5 rounded bg-stone-900 hover:bg-rose-950 border border-stone-700 hover:border-rose-900 text-stone-500 hover:text-rose-300 text-[10px] transition"
                      title="Dispensar aprendiz da base"
                    >
                      <UserX className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Seção 3: Tabela de Elenco da Guilda */}
      <div className="bg-[#1c1917] border border-amber-950/40 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-stone-950/80 border-b border-stone-800 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-500" />
            <h3 className="text-amber-200 text-xs font-black uppercase tracking-wider">
              Quadro de Colaboradores Registrados ({team.length})
            </h3>
          </div>
          <span className="text-stone-500 text-xs">
            Folha Semanal Total:{' '}
            <strong className="text-amber-400 font-mono">
              ⬡ {team.reduce((s, h) => s + h.salary, 0)} Ouro/semana
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-stone-400 text-[11px] uppercase tracking-wider bg-stone-950/40 border-b border-stone-800">
                <th className="py-3 px-4 text-left font-semibold">Aventureiro</th>
                <th className="py-3 px-3 text-left font-semibold">Classe & Esp.</th>
                <th className="py-3 px-3 text-center font-semibold">Poder Bruto</th>
                <th className="py-3 px-3 text-center font-semibold">Fadiga</th>
                <th className="py-3 px-3 text-center font-semibold">Contrato & Moral</th>
                <th className="py-3 px-3 text-center font-semibold">Status</th>
                <th className="py-3 px-3 text-right font-semibold">Salário/sem</th>
                <th className="py-3 px-4 text-right font-semibold">Intervenção Clínica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {team.map((hero, index) => {
                const isInjured = hero.status === 'Afastado' || hero.injured
                const isEven = index % 2 === 0
                const power = hero.current_power ?? hero.power ?? 50
                const seasonsLeft = hero.contract_seasons_left ?? 2
                const happiness = hero.happiness ?? 80

                // Badges de Fadiga/Status
                let fatigueBadgeClass = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                let fatigueLabel = 'Pronto'
                if (hero.fatigue > 50 || isInjured) {
                  fatigueBadgeClass = 'bg-rose-950/80 text-rose-400 border border-rose-800/50 animate-pulse'
                  fatigueLabel = isInjured ? 'Lesionado' : 'Exausto'
                } else if (hero.fatigue > 20) {
                  fatigueBadgeClass = 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                  fatigueLabel = 'Cansado'
                }

                return (
                  <tr
                    key={hero.id}
                    className={`transition-colors hover:bg-stone-800/60 ${
                      isEven ? 'bg-stone-900/80' : 'bg-stone-900/30'
                    }`}
                  >
                    {/* Aventureiro */}
                    <td className="py-3 px-4 font-medium text-stone-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                          {hero.name[0]}
                        </div>
                        <div>
                          <span className="truncate max-w-[180px] font-semibold block">{hero.name}</span>
                          {hero.age && <span className="text-[10px] text-stone-500">{hero.age} anos</span>}
                        </div>
                      </div>
                    </td>

                    {/* Classe & Esp */}
                    <td className="py-3 px-3 text-stone-400">
                      <div>{hero.class_name ?? hero.class ?? 'Combatente'}</div>
                      {hero.specialization_name && (
                        <div className="text-[10px] text-stone-500">{hero.specialization_name}</div>
                      )}
                    </td>

                    {/* Poder com Zap */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                        <span className={`${GOLD_GRADIENT_TEXT} text-sm font-mono font-bold`}>
                          {power}
                        </span>
                      </div>
                    </td>

                    {/* Barra de Fadiga */}
                    <td className="py-3 px-3">
                      <div className="max-w-[110px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                          <span>{hero.fatigue}%</span>
                          <span className={hero.fatigue > 50 ? 'text-rose-400 font-bold' : ''}>
                            {hero.fatigue > 50 ? 'Risco' : 'Estável'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden border border-stone-800">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              hero.fatigue > 50 ? 'bg-rose-500' : hero.fatigue > 20 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${hero.fatigue}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Contrato & Felicidade */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-mono text-stone-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {seasonsLeft} temp.
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                          <Smile className="w-3 h-3 text-emerald-400" />
                          {happiness}%
                        </span>
                      </div>
                    </td>

                    {/* Badge de Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide inline-block ${fatigueBadgeClass}`}>
                        {fatigueLabel}
                      </span>
                    </td>

                    {/* Salário */}
                    <td className="py-3 px-3 text-right font-mono text-stone-300">
                      ⬡ {hero.salary}
                    </td>

                    {/* Ações Clínicas */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isInjured ? (
                          <button
                            onClick={() => handleAccelerateInjury(hero.id)}
                            disabled={isLoading || currentGold < 180}
                            className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-[10px] flex items-center gap-1 transition disabled:opacity-40"
                            title={`Tratar lesão com especialista (-1 sem.) [180 Ouro]`}
                          >
                            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                            <span>Tratar (⬡ 180)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMassage(hero.id)}
                            disabled={isLoading || hero.fatigue === 0 || currentGold < 75}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950/60 border border-stone-700 hover:border-amber-700/60 text-stone-300 hover:text-amber-200 text-[10px] flex items-center gap-1 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={`Massagem & Banhos Termais (-40 Fadiga) [75 Ouro]`}
                          >
                            <Bed className="w-3.5 h-3.5 text-amber-400" />
                            <span>Massagem (⬡ 75)</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleReleaseContract(hero.id)}
                          disabled={isLoading}
                          className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950/80 border border-stone-800 hover:border-rose-900 text-stone-500 hover:text-rose-400 transition"
                          title="Rescindir contrato amigavelmente"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registro de Ações */}
      {actionLog.length > 0 && (
        <div className="bg-[#1c1917] border border-stone-800 rounded-xl p-4 space-y-1 shadow-md">
          <p className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-2">
            Diário Médico & Despachos Administrativos
          </p>
          {actionLog.slice(0, 5).map((log, i) => (
            <p key={i} className="text-stone-300 text-xs font-mono">
              · {log}
            </p>
          ))}
        </div>
      )}

      {/* Alerta de Diretrizes Corporativas */}
      <div className="bg-stone-900/60 border border-amber-950/40 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-400">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-stone-200 font-bold">Norma Regulamentadora de Expedição (Cláusula 12):</p>
          <p>
            Colaboradores escalados com índice de fadiga superior a 50% sofrem severa perda de rendimento e possuem probabilidade quadruplicada de sofrerem acidentes graves em masmorras. A manutenção das instalações médicas consome recursos semanais da guilda (DRE), mas acelera a regeneração de todo o contingente.
          </p>
        </div>
      </div>
    </div>
  )
}
