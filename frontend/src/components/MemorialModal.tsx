import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Skull,
  Award,
  ShieldAlert,
  Flame,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';

export interface DecoratedHero {
  id: string;
  name: string;
  position: string;
  title: string;
  expeditionsCompleted: number;
  peGenerated: number;
  decoration: string;
  decorationIcon: string;
  joinedWeek: number;
  status: string;
  commendationText: string;
}

export interface FallenHeroRecord {
  id: string;
  name: string;
  position: string;
  level: number;
  incidentWeek: number;
  dungeonName: string;
  chamber: number;
  legalCause: string;
  notarySealNumber: string;
  dreImpact: string;
  epitaph: string;
  honored: boolean;
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
];

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
];

interface MemorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemorialModal: React.FC<MemorialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'hall' | 'memorial'>('hall');
  const [honoredList, setHonoredList] = useState<DecoratedHero[]>(() => {
    try {
      const saved = localStorage.getItem('herofoot_hall_of_fame_applet');
      return saved ? JSON.parse(saved) : DEFAULT_HONORED_HEROES;
    } catch {
      return DEFAULT_HONORED_HEROES;
    }
  });

  const [fallenList, setFallenList] = useState<FallenHeroRecord[]>(() => {
    try {
      const saved = localStorage.getItem('herofoot_memorial_records_applet');
      return saved ? JSON.parse(saved) : DEFAULT_FALLEN_HEROES;
    } catch {
      return DEFAULT_FALLEN_HEROES;
    }
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('herofoot_hall_of_fame_applet', JSON.stringify(honoredList));
    } catch (e) {
      console.warn(e);
    }
  }, [honoredList]);

  useEffect(() => {
    try {
      localStorage.setItem('herofoot_memorial_records_applet', JSON.stringify(fallenList));
    } catch (e) {
      console.warn(e);
    }
  }, [fallenList]);

  const handlePayTribute = (id: string, name: string) => {
    setFallenList(prev => prev.map(f => (f.id === id ? { ...f, honored: true } : f)));
    setToastMsg(`Tributo Corporativo solene prestado a ${name}. Autos protocolados na Coroa.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-900/60 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Toast */}
        {toastMsg && (
          <div className="bg-amber-950 border-b border-amber-500/80 px-4 py-2.5 text-xs text-amber-300 font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/70 border border-amber-700/60 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
                  TASK-801 • Cartório Régio
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
                Mural da Glória & Memorial de Baixas em Serviço
              </h2>
              <p className="text-xs text-slate-400">
                Prontuário perpétuo de atletas condecorados e baixas notariais em masmorras de alto risco
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('hall')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'hall'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Quadro de Honra ({honoredList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('memorial')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'memorial'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Skull className="w-4 h-4 text-rose-400" />
              <span>Memorial de Baixas ({fallenList.length})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Persistência Local Perpétua (Sem impacto no save)
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'hall' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-amber-200">
                  ✨ Condecorações oficiais conferidas aos colaboradores da guilda com faturamento extraordinário de PE.
                </span>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Láureas da Coroa</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {honoredList.map(hero => (
                  <div
                    key={hero.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-600/50 transition flex flex-col justify-between shadow-lg relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase font-bold text-amber-500">
                            {hero.position}
                          </span>
                          <h3 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition">
                            {hero.name}
                          </h3>
                        </div>
                        <span className="text-2xl">{hero.decorationIcon}</span>
                      </div>

                      <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] space-y-1">
                        <span className="font-bold text-amber-300 block">{hero.decoration}</span>
                        <p className="text-[10px] text-slate-400">{hero.commendationText}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                      <div className="p-1.5 rounded-lg bg-slate-900">
                        <span className="text-[9px] text-slate-500 block uppercase">Expedições</span>
                        <span className="font-bold text-slate-200">{hero.expeditionsCompleted}</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-900">
                        <span className="text-[9px] text-slate-500 block uppercase">PE Gerados</span>
                        <span className="font-bold text-amber-400">+{hero.peGenerated} PE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'memorial' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-rose-200">
                  ⚰️ Prontuário solene das baixas ocorridas em combate. Atestados emitidos com isenção securitária.
                </span>
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">Livro Tombo Imperial</span>
              </div>

              <div className="space-y-3">
                {fallenList.map(record => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-800/50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0 mt-1">
                        <Skull className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{record.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {record.position} · Nv. {record.level}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Baixa na Semana #{record.incidentWeek}
                          </span>
                        </div>

                        <div className="text-xs font-mono text-rose-400">
                          <strong>Causa Notarial:</strong> {record.legalCause}
                        </div>

                        <div className="text-[11px] text-slate-400 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                          "{record.epitaph}"
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-1">
                          <span>Selo: <strong className="text-slate-300">{record.notarySealNumber}</strong></span>
                          <span>·</span>
                          <span className="text-emerald-400 font-bold">{record.dreImpact}</span>
                          <span>·</span>
                          <span>{record.dungeonName} (Câmara {record.chamber})</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex justify-end">
                      {record.honored ? (
                        <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Homenagem Prestada</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePayTribute(record.id, record.name)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
          <span>Registrado sob a Lei Régia de Fomento e Auditoria das Guildas • v0.8.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
