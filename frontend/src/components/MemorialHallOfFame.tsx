import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Skull,
  Scroll,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Award,
  Calendar,
  Compass,
  FileText,
  UserX,
  Sparkles,
  ExternalLink,
  PlusCircle,
  X
} from 'lucide-react'
import { CrownSeal } from './art'
import { GOLD_GRADIENT_TEXT } from '../utils/rarityStyles'

export interface DecoratedHero {
  id: string
  name: string
  position: string
  title: string
  expeditionsCompleted: number
  peGenerated: number
  decoration: string
  decorationIcon: string
  joinedWeek: number
  status: string
  commendationText: string
}

export interface FallenHeroRecord {
  id: string
  name: string
  position: string
  level: number
  incidentWeek: number
  dungeonName: string
  chamber: number
  legalCause: string
  notarySealNumber: string
  dreImpact: string
  epitaph: string
  honored: boolean
}

const DEFAULT_HONORED_HEROES: DecoratedHero[] = [
  {
    id: 'dec-1',
    name: 'Valdris, o Predatório',
    position: 'Vanguarda',
    title: 'Comandante da Linha de Frente',
    expeditionsCompleted: 42,
    peGenerated: 68,
    decoration: 'Láurea Imperial de Solvência Marcial',
    decorationIcon: '🎖️',
    joinedWeek: 1,
    status: 'Ativo',
    commendationText: 'Por sustentar a integridade tática da firma em 18 câmaras de Boss com margem superior a 15%.'
  },
  {
    id: 'dec-2',
    name: 'Lyra Alchemis',
    position: 'Suporte',
    title: 'Supervisora de Manipulação Arcana',
    expeditionsCompleted: 38,
    peGenerated: 54,
    decoration: 'Ordem Régia do Rendimento Extraordinário',
    decorationIcon: '📜',
    joinedWeek: 1,
    status: 'Ativo',
    commendationText: 'Isolou com sucesso 29 Mini-Bosses rivais, assegurando a liquidez dos pontos de expedição da guilda.'
  },
  {
    id: 'dec-3',
    name: 'Thorin Quebra-Rocha',
    position: 'Vanguarda',
    title: 'Capitão Emérito de Blindagem',
    expeditionsCompleted: 56,
    peGenerated: 82,
    decoration: 'Grã-Cruz de Basalto da Coroa',
    decorationIcon: '🛡️',
    joinedWeek: 1,
    status: 'Ativo',
    commendationText: 'Veterano titular invicto em masmorras vulcânicas e glaciais sem registro de afastamento por sinistro.'
  }
]

const DEFAULT_FALLEN_HEROES: FallenHeroRecord[] = [
  {
    id: 'fall-1',
    name: 'Gromm, o Incansável',
    position: 'Vanguarda',
    level: 14,
    incidentWeek: 12,
    dungeonName: 'Caldeira de Enxofre — Magma & Basalto',
    chamber: 9,
    legalCause: 'Sinistro em Incursão sem Cobertura Securitária',
    notarySealNumber: 'CERT-OB-782/A',
    dreImpact: 'Economia salarial de 1.450 PO/semana registrada em cartório',
    epitaph: 'Protocolado no Livro Tombo da Coroa. Sua contribuição para o EBITDA da guilda foi devidamente arquivada. Descanse em conformidade com o Regulamento Interno.',
    honored: true
  },
  {
    id: 'fall-2',
    name: 'Theron Olho-de-Águia',
    position: 'DPS',
    level: 11,
    incidentWeek: 8,
    dungeonName: 'Mina do Abismo de Ferro — Caverna Profunda',
    chamber: 7,
    legalCause: 'Colapso Estrutural em Masmorra Classe 4 por Descumprimento de Alvará',
    notarySealNumber: 'CERT-OB-614/B',
    dreImpact: 'Baixa patrimonial sem direito a indenização póstuma',
    epitaph: 'Tombou no disparo final contra o Mini-Boss. A Coroa homologou o ponto de expedição post-mortem antes do recolhimento dos despojos.',
    honored: false
  },
  {
    id: 'fall-3',
    name: 'Caelen, o Silencioso',
    position: 'Suporte Logístico',
    level: 9,
    incidentWeek: 5,
    dungeonName: 'Pântano dos Murmúrios — Limo & Névoa Ácida',
    chamber: 6,
    legalCause: 'Falência Logística Severa com Desidratação pós-Esgotamento de Suprimentos',
    notarySealNumber: 'CERT-OB-409/D',
    dreImpact: 'Despesas com urna fúnebre deduzidas da cota da Divisão de Acesso',
    epitaph: 'Mapeou armadilhas até o último suspiro logístico da equipe. O Almoxarifado corporativo presta solenes homenagens ao seu inventário.',
    honored: false
  }
]

const STORAGE_KEY_HONORED = 'herofoot_hall_of_fame_v1'
const STORAGE_KEY_FALLEN = 'herofoot_memorial_records_v1'

interface MemorialHallOfFameProps {
  onClose?: () => void
  currentWeek?: number
}

export default function MemorialHallOfFame({ onClose, currentWeek = 1 }: MemorialHallOfFameProps) {
  const [activeTab, setActiveTab] = useState<'hall' | 'memorial'>('hall')
  const [honoredList, setHonoredList] = useState<DecoratedHero[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HONORED)
      return saved ? JSON.parse(saved) : DEFAULT_HONORED_HEROES
    } catch {
      return DEFAULT_HONORED_HEROES
    }
  })

  const [fallenList, setFallenList] = useState<FallenHeroRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FALLEN)
      return saved ? JSON.parse(saved) : DEFAULT_FALLEN_HEROES
    } catch {
      return DEFAULT_FALLEN_HEROES
    }
  })

  const [tributeToast, setTributeToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HONORED, JSON.stringify(honoredList))
    } catch (e) {
      console.warn('Falha ao persistir Hall da Fama no localStorage:', e)
    }
  }, [honoredList])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FALLEN, JSON.stringify(fallenList))
    } catch (e) {
      console.warn('Falha ao persistir Memorial no localStorage:', e)
    }
  }, [fallenList])

  const handlePayTribute = (id: string, name: string) => {
    setFallenList(prev =>
      prev.map(f => (f.id === id ? { ...f, honored: true } : f))
    )
    setTributeToast(`Tributo Corporativo prestado ao veterano ${name}. O Cartório anexou as condolências aos autos.`)
    setTimeout(() => setTributeToast(null), 4000)
  }

  return (
    <div className="bg-[#1c1917] border border-amber-950/70 rounded-2xl shadow-2xl overflow-hidden text-stone-200">
      {/* Toast de Homenagem */}
      {tributeToast && (
        <div className="bg-amber-950 border border-amber-500 text-amber-200 px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{tributeToast}</span>
          </div>
          <button onClick={() => setTributeToast(null)} className="text-stone-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header com Selo de Cera Imperial e Abas */}
      <div className="p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-amber-950/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <CrownSeal size={50} withRibbon={false} withGlow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Cartório & Livro Tombo da Guilda
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-[10px] font-mono text-stone-400">Semana {currentWeek}</span>
            </div>
            <h2 className="text-xl font-black text-amber-100 uppercase tracking-wide flex items-center gap-2">
              <span>Mural da Glória & Memorial Corporativo</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Registro perpétuo de aventureiros laureados e baixas notariais em serviço ativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="bg-stone-950 p-1 rounded-xl border border-stone-800 flex gap-1 text-xs">
            <button
              onClick={() => setActiveTab('hall')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'hall'
                  ? 'bg-amber-600 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Quadro de Honra ({honoredList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('memorial')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'memorial'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>Memorial de Baixas ({fallenList.length})</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da Aba 1: QUADRO DE HONRA */}
      {activeTab === 'hall' && (
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-stone-300">
                Aventureiros com mais de 30 expedições concluídas e índice de faturamento superior a 50 PE.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Atestados Homologados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {honoredList.map(hero => (
              <div
                key={hero.id}
                className="bg-stone-950/70 border border-amber-950/60 rounded-xl p-4 flex flex-col justify-between hover:border-amber-700/60 transition shadow-lg group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-wider">
                        {hero.position} · {hero.title}
                      </span>
                      <h3 className="text-base font-black text-amber-100 group-hover:text-amber-300 transition">
                        {hero.name}
                      </h3>
                    </div>
                    <span className="text-xl" title={hero.decoration}>
                      {hero.decorationIcon}
                    </span>
                  </div>

                  <div className="mt-3 py-1.5 px-2 bg-stone-900/90 border border-stone-800 rounded-lg text-[11px] font-mono text-stone-300">
                    <span className="text-amber-400 font-bold block">{hero.decoration}</span>
                    <span className="text-stone-400 text-[10px] block mt-0.5">{hero.commendationText}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="bg-stone-900/60 p-1.5 rounded">
                    <span className="text-[10px] text-stone-500 block uppercase">Expedições</span>
                    <span className="text-sm font-bold text-stone-200">{hero.expeditionsCompleted}</span>
                  </div>
                  <div className="bg-stone-900/60 p-1.5 rounded">
                    <span className="text-[10px] text-stone-500 block uppercase">PE Gerados</span>
                    <span className="text-sm font-bold text-amber-400">+{hero.peGenerated} PE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: MEMORIAL DE BAIXAS */}
      {activeTab === 'memorial' && (
        <div className="p-6 space-y-4">
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-stone-300">
                Prontuário solene de sinistros fatais ocorridos em incursões. Todos os óbitos foram notificados à Coroa Imperial.
              </span>
            </div>
            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">Livro Tombo Notarial</span>
          </div>

          <div className="space-y-3">
            {fallenList.map(record => (
              <div
                key={record.id}
                className="bg-stone-950/80 border border-stone-800 hover:border-rose-900/60 rounded-xl p-4 transition shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 max-w-2xl">
                  <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center shrink-0 text-rose-400 mt-1">
                    <Skull className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-stone-100">{record.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
                        {record.position} · Nv. {record.level}
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        Baixa na Semana #{record.incidentWeek}
                      </span>
                    </div>

                    <div className="text-xs text-rose-300 font-mono flex items-center gap-1.5">
                      <span className="font-bold">Causa Notarial:</span>
                      <span>{record.legalCause}</span>
                    </div>

                    <div className="text-[11px] text-stone-400 italic bg-stone-900/70 p-2 rounded border border-stone-800/80">
                      "{record.epitaph}"
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-stone-500">
                      <span>Protocolo: <strong className="text-stone-400">{record.notarySealNumber}</strong></span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">{record.dreImpact}</span>
                      <span>·</span>
                      <span>Local: {record.dungeonName} (Câmara {record.chamber})</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                  {record.honored ? (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-700/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Homenagem Registrada</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePayTribute(record.id, record.name)}
                      className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prestar Tributo Póstumo</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer solene com observação jurídica */}
      <div className="p-4 bg-stone-950 border-t border-stone-900 text-[10px] font-mono text-stone-500 flex flex-wrap items-center justify-between gap-2">
        <span>Homologado pelo Cartório Real de Fomento e Registro de Aventureiros da Coroa.</span>
        <span>Isenção tributária assegurada pela Lei Régia nº 107/B2B.</span>
      </div>
    </div>
  )
}
