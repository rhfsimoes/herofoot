import React, { useState } from 'react';
import { 
  GameSystem, 
  SystemPillar, 
  SystemStatus 
} from '../types/game';
import { 
  Layers, 
  Shield, 
  Flame, 
  Coins, 
  Gamepad2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Plus, 
  Filter, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

interface SystemsOverviewProps {
  systems: GameSystem[];
  onAddSystem: (newSystem: GameSystem) => void;
  onUpdateSystem: (updatedSystem: GameSystem) => void;
}

export const SystemsOverview: React.FC<SystemsOverviewProps> = ({
  systems,
  onAddSystem,
  onUpdateSystem,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<SystemPillar | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<SystemStatus | 'all'>('all');
  const [activeSystemModal, setActiveSystemModal] = useState<GameSystem | null>(null);

  // New system modal form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPillar, setNewPillar] = useState<SystemPillar>('phase2_workshop');
  const [newComplexity, setNewComplexity] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Alta');
  const [newDesc, setNewDesc] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const filteredSystems = systems.filter((sys) => {
    if (selectedPillar !== 'all' && sys.pillar !== selectedPillar) return false;
    if (selectedStatus !== 'all' && sys.status !== selectedStatus) return false;
    return true;
  });

  const getPillarBadge = (pillar: SystemPillar) => {
    switch (pillar) {
      case 'phase1_hr':
        return { label: 'Fase 1: RH & Saúde', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60', icon: Shield };
      case 'phase2_workshop':
        return { label: 'Fase 2: Complexo B2B', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60', icon: Flame };
      case 'phase3_tactics':
        return { label: 'Fase 3: Tática & 5 Slots', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60', icon: BookOpen };
      case 'phase4_dungeon':
        return { label: 'Fase 4: Incursão Masmorra', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60', icon: Gamepad2 };
      case 'phase5_results':
        return { label: 'Fase 5: DRE & Liga', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60', icon: Coins };
    }
  };

  const getStatusBadge = (status: SystemStatus) => {
    switch (status) {
      case 'implemented':
        return { label: 'Homologado (v0.7.1)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'in_progress':
        return { label: 'Em Desenvolvimento', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'planned':
        return { label: 'Roadmap v0.8.0', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
      case 'needs_review':
        return { label: 'Revisão Técnica', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
    }
  };

  const handleCreateSystem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSys: GameSystem = {
      id: `sys-${Date.now()}`,
      name: newName,
      pillar: newPillar,
      status: 'planned',
      complexity: newComplexity,
      version: 'v0.8.0',
      description: newDesc || 'Sem descrição cadastrada.',
      architectureDetails: ['Mapeado pelo Tech Lead'],
      dependencies: [],
      techLeadNotes: newNotes || 'Revisão pendente.'
    };

    onAddSystem(newSys);
    setIsAddingNew(false);
    setNewName('');
    setNewDesc('');
    setNewNotes('');
  };

  return (
    <div className="space-y-8">
      {/* 5 Canonical Phases Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Phase 1 */}
        <div 
          onClick={() => setSelectedPillar(selectedPillar === 'phase1_hr' ? 'all' : 'phase1_hr')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPillar === 'phase1_hr'
              ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-blue-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">Fase 1</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-2.5">RH & Saúde</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Contratos plurianuais, medicina ocupacional, academia e rotação de fadiga.
          </p>
        </div>

        {/* Phase 2 */}
        <div 
          onClick={() => setSelectedPillar(selectedPillar === 'phase2_workshop' ? 'all' : 'phase2_workshop')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPillar === 'phase2_workshop'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-amber-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">Fase 2</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-2.5">Complexo B2B</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            11 Corporações, montagem de 3 partes, linha fabril e mercado spot com ágio.
          </p>
        </div>

        {/* Phase 3 */}
        <div 
          onClick={() => setSelectedPillar(selectedPillar === 'phase3_tactics' ? 'all' : 'phase3_tactics')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPillar === 'phase3_tactics'
              ? 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-purple-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">Fase 3</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-2.5">Tática & 5 Slots</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Party de 6 titulares, loadout canônico de 5 compartimentos e mitigação.
          </p>
        </div>

        {/* Phase 4 */}
        <div 
          onClick={() => setSelectedPillar(selectedPillar === 'phase4_dungeon' ? 'all' : 'phase4_dungeon')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPillar === 'phase4_dungeon'
              ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-indigo-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Gamepad2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">Fase 4</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-2.5">Incursão Masmorra</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            10 Câmaras, 100 suprimentos, mini-bosses e boss final (Pontos de Expedição).
          </p>
        </div>

        {/* Phase 5 */}
        <div 
          onClick={() => setSelectedPillar(selectedPillar === 'phase5_results' ? 'all' : 'phase5_results')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedPillar === 'phase5_results'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-emerald-600/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">Fase 5</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-2.5">DRE & Liga</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Extrato dinâmico, classificação da liga, liquidação por falência e auditoria.
          </p>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <select
            value={selectedPillar}
            onChange={(e) => setSelectedPillar(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas as 5 Fases ({systems.length} sistemas)</option>
            <option value="phase1_hr">Fase 1: RH & Saúde</option>
            <option value="phase2_workshop">Fase 2: Complexo B2B & Montagem</option>
            <option value="phase3_tactics">Fase 3: Tática & 5 Slots</option>
            <option value="phase4_dungeon">Fase 4: Incursão Masmorra</option>
            <option value="phase5_results">Fase 5: DRE & Liga das Guildas</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos os Status</option>
            <option value="implemented">Implementado</option>
            <option value="in_progress">Em Andamento</option>
            <option value="planned">Planejado</option>
            <option value="needs_review">Revisão Técnica</option>
          </select>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Novo Sistema</span>
        </button>
      </div>

      {/* Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSystems.map((sys) => {
          const pillarInfo = getPillarBadge(sys.pillar);
          const statusInfo = getStatusBadge(sys.status);
          const PillarIcon = pillarInfo.icon;

          return (
            <div
              key={sys.id}
              onClick={() => setActiveSystemModal(sys)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between cursor-pointer group shadow-lg shadow-slate-950/40"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${pillarInfo.color}`}>
                    <PillarIcon className="w-3 h-3" />
                    {pillarInfo.label}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {sys.name}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {sys.description}
                </p>

                {/* Architecture Highlights */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Detalhes Técnicos:
                  </div>
                  {sys.architectureDetails.slice(0, 2).map((det, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span className="truncate">{det}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Lead Note preview */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-amber-400/90 font-medium text-[11px] truncate max-w-[200px]">
                  💡 Nota do Tech Lead
                </span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold text-[11px]">
                  Ver Análise <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Detail Modal */}
      {activeSystemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getPillarBadge(activeSystemModal.pillar).color}`}>
                    {getPillarBadge(activeSystemModal.pillar).label}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(activeSystemModal.status).color}`}>
                    {getStatusBadge(activeSystemModal.status).label}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Complexidade: <strong>{activeSystemModal.complexity}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-2">
                  {activeSystemModal.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveSystemModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">
                  Visão Geral do Sistema
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {activeSystemModal.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                  Regras de Arquitetura & Implementação
                </h4>
                <ul className="space-y-2">
                  {activeSystemModal.architectureDetails.map((det, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-emerald-400 font-bold">✔</span>
                      <span>{det}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Parecer Técnico do Tech Lead</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeSystemModal.techLeadNotes}
                </p>
              </div>

              {/* Status Updater */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Alterar Status:</span>
                  <select
                    value={activeSystemModal.status}
                    onChange={(e) => {
                      const updated = { ...activeSystemModal, status: e.target.value as SystemStatus };
                      setActiveSystemModal(updated);
                      onUpdateSystem(updated);
                    }}
                    className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1"
                  >
                    <option value="implemented">Implementado</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="planned">Planejado</option>
                    <option value="needs_review">Revisão Técnica</option>
                  </select>
                </div>

                <button
                  onClick={() => setActiveSystemModal(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New System Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSystem}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Registrar Novo Sistema do Jogo
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400">Nome do Sistema:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Sistema de Envelhecimento e Aposentadoria de Heróis"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Pilar Central:</label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as SystemPillar)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="phase1_hr">Fase 1: RH & Saúde</option>
                  <option value="phase2_workshop">Fase 2: Complexo B2B & Montagem</option>
                  <option value="phase3_tactics">Fase 3: Tática & 5 Slots</option>
                  <option value="phase4_dungeon">Fase 4: Incursão Masmorra</option>
                  <option value="phase5_results">Fase 5: DRE & Liga das Guildas</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Complexidade:</label>
                <select
                  value={newComplexity}
                  onChange={(e) => setNewComplexity(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Descrição / Mecânica:</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descreva as regras do sistema, cálculos e interação com outros subsistemas..."
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Parecer Inicial do Tech Lead:</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Necessário desacoplar do loop principal para permitir testes unitários."
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
              >
                Salvar Sistema
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
