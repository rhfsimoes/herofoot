import React, { useState } from 'react';
import { BacklogTask, SystemPillar } from '../types/game';
import { 
  KanbanSquare, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Filter, 
  Download, 
  Layers,
  ChevronRight,
  ArrowRight,
  Code
} from 'lucide-react';

interface TechLeadBacklogProps {
  tasks: BacklogTask[];
  onAddTask: (task: BacklogTask) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: BacklogTask['status']) => void;
}

export const TechLeadBacklog: React.FC<TechLeadBacklogProps> = ({
  tasks,
  onAddTask,
  onUpdateTaskStatus,
}) => {
  const [filterPillar, setFilterPillar] = useState<SystemPillar | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // New Request to Spec Converter
  const [userPromptInput, setUserPromptInput] = useState('');
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState<{
    title: string;
    pillar: SystemPillar;
    priority: BacklogTask['priority'];
    description: string;
    acceptanceCriteria: string[];
    architectureNotes: string;
  } | null>(null);

  // Manual Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPillar, setManualPillar] = useState<SystemPillar>('phase1_hr');
  const [manualPriority, setManualPriority] = useState<BacklogTask['priority']>('P1 - Alta');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCriteria, setManualCriteria] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterPillar !== 'all' && t.pillar !== filterPillar) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const columns: Array<{ id: BacklogTask['status']; title: string; color: string }> = [
    { id: 'backlog', title: 'Backlog Priorizado', color: 'border-slate-700 bg-slate-900/60' },
    { id: 'in_progress', title: 'Em Desenvolvimento', color: 'border-amber-600/50 bg-amber-950/20' },
    { id: 'review', title: 'Revisão Técnica / QA', color: 'border-indigo-600/50 bg-indigo-950/20' },
    { id: 'done', title: 'Concluído & Integrado', color: 'border-emerald-600/50 bg-emerald-950/20' },
  ];

  // Helper to convert natural language request into technical specification
  const handleGenerateSpec = () => {
    if (!userPromptInput.trim()) return;
    setIsGeneratingSpec(true);

    setTimeout(() => {
      const lower = userPromptInput.toLowerCase();
      let pillar: SystemPillar = 'phase2_workshop';
      if (lower.includes('rh') || lower.includes('medicina') || lower.includes('contrato') || lower.includes('fadiga') || lower.includes('posicao') || lower.includes('academia') || lower.includes('memorial') || lower.includes('aposentado')) {
        pillar = 'phase1_hr';
      } else if (lower.includes('b2b') || lower.includes('montagem') || lower.includes('forja') || lower.includes('spot') || lower.includes('peca') || lower.includes('operario') || lower.includes('vip')) {
        pillar = 'phase2_workshop';
      } else if (lower.includes('tatica') || lower.includes('loadout') || lower.includes('slot') || lower.includes('mitigacao') || lower.includes('party')) {
        pillar = 'phase3_tactics';
      } else if (lower.includes('incursao') || lower.includes('masmorra') || lower.includes('suprimento') || lower.includes('camara') || lower.includes('boss') || lower.includes('rei demonio')) {
        pillar = 'phase4_dungeon';
      } else if (lower.includes('dre') || lower.includes('liga') || lower.includes('auditoria') || lower.includes('coroa') || lower.includes('falencia')) {
        pillar = 'phase5_results';
      }

      setGeneratedSpec({
        title: userPromptInput.slice(0, 50) + (userPromptInput.length > 50 ? '...' : ''),
        pillar,
        priority: 'P1 - Alta',
        description: `Implementação orientada pelo Tech Lead a partir da demanda: "${userPromptInput}".`,
        acceptanceCriteria: [
          'Estruturar interfaces e tipos TypeScript/Python correspondentes sem violar CONTRACT.md',
          'Conectar lógica ao GameState e garantir conformidade com SERIALIZED_FIELDS',
          'Zero hardcoding: todos os coeficientes devem residir em data/*.json',
          'Implementar testes unitários em tests/ com 100% de aprovação'
        ],
        architectureNotes: 'Garantir determinismo por hash((world_seed, week, entity_id)) e linguagem 7/10 de Fantasia Corporativa.'
      });

      setIsGeneratingSpec(false);
    }, 600);
  };

  const handleAcceptGeneratedSpec = () => {
    if (!generatedSpec) return;

    const newTask: BacklogTask = {
      id: `TASK-${Date.now().toString().slice(-4)}`,
      title: generatedSpec.title,
      pillar: generatedSpec.pillar,
      priority: generatedSpec.priority,
      status: 'backlog',
      versionTarget: 'v0.8.0',
      description: generatedSpec.description,
      acceptanceCriteria: generatedSpec.acceptanceCriteria,
      estimatedPoints: 5,
    };

    onAddTask(newTask);
    setGeneratedSpec(null);
    setUserPromptInput('');
  };

  const handleExportMarkdown = () => {
    const md = `# HEROFOOT - ROADMAP & BACKLOG TÉCNICO
Gerado pelo Tech Lead em ${new Date().toLocaleDateString('pt-BR')}

## Resumo das Tarefas
${tasks.map(t => `- [${t.status.toUpperCase()}] **${t.id}: ${t.title}** (${t.priority} | Pilar: ${t.pillar})
  - Descrição: ${t.description}
  - Critérios de Aceite:
${t.acceptanceCriteria.map(c => `    * ${c}`).join('\n')}
`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HeroFoot_Backlog_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Converter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Gestão de Engenharia & Roadmap</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Tech Lead: <span className="text-purple-400">Refinamento de Pedidos</span> & Backlog
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Descreva em linguagem natural qualquer ideia ou sistema que você queira implementar. Como Tech Lead, eu quebro o seu pedido em especificações técnicas, critérios de aceitação e arquitetura!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Roadmap (.md)</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Natural Language Prompt to Technical Spec Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Qual sistema ou ajuste você deseja trabalhar agora no HeroFoot?
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={userPromptInput}
              onChange={(e) => setUserPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateSpec()}
              placeholder="Ex: Quero um sistema onde poções fracassadas no caldeirão gerem gosmas venenosas que heróis usam para sabotar o rival"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleGenerateSpec}
              disabled={isGeneratingSpec || !userPromptInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Code className="w-4 h-4" />
              <span>{isGeneratingSpec ? 'Arquitetando...' : 'Trabalhar Pedido'}</span>
            </button>
          </div>

          {/* Generated Specification Preview */}
          {generatedSpec && (
            <div className="mt-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/60 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                    Especificação Técnica Gerada pelo Tech Lead
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {generatedSpec.title}
                  </h4>
                </div>
                <span className="text-xs bg-purple-900/60 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-700">
                  Pilar: {generatedSpec.pillar.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <strong>Critérios de Aceite para Desenvolvimento:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside text-slate-400">
                  {generatedSpec.acceptanceCriteria.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="text-[11px] text-amber-300 bg-slate-950 p-2.5 rounded-xl border border-amber-500/30">
                <strong>💡 Diretriz de Arquitetura:</strong> {generatedSpec.architectureNotes}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setGeneratedSpec(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-xl"
                >
                  Descartar
                </button>
                <button
                  onClick={handleAcceptGeneratedSpec}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Adicionar ao Backlog do Jogo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filtrar Backlog:
        </span>
        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value="all">Todas as 5 Fases</option>
          <option value="phase1_hr">Fase 1: RH & Saúde</option>
          <option value="phase2_workshop">Fase 2: Complexo B2B & Montagem</option>
          <option value="phase3_tactics">Fase 3: Tática & 5 Slots</option>
          <option value="phase4_dungeon">Fase 4: Incursão Masmorra</option>
          <option value="phase5_results">Fase 5: DRE & Liga das Guildas</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
        >
          <option value="all">Todas as Prioridades</option>
          <option value="P0 - Crítica">P0 - Crítica</option>
          <option value="P1 - Alta">P1 - Alta</option>
          <option value="P2 - Média">P2 - Média</option>
          <option value="P3 - Baixa">P3 - Baixa</option>
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border p-4 flex flex-col space-y-3 min-h-[400px] ${col.color}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  {col.title}
                </h3>
                <span className="text-[11px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-full text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-[11px] text-slate-500">
                    Nenhuma tarefa
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-md hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{t.id}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            t.versionTarget === 'v0.8.0' 
                              ? 'bg-purple-950/80 text-purple-300 border-purple-700' 
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          }`}>
                            {t.versionTarget}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          t.priority.includes('P0')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : t.priority.includes('P1')
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-white leading-snug">
                        {t.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      {/* Status Transition buttons */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-purple-400 font-semibold uppercase">
                          {t.pillar.replace('phase', 'Fase ')}
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id !== 'backlog' && (
                            <button
                              onClick={() => {
                                const prev = col.id === 'done' ? 'review' : col.id === 'review' ? 'in_progress' : 'backlog';
                                onUpdateTaskStatus(t.id, prev);
                              }}
                              title="Mover para status anterior"
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={() => {
                                const next = col.id === 'backlog' ? 'in_progress' : col.id === 'in_progress' ? 'review' : 'done';
                                onUpdateTaskStatus(t.id, next);
                              }}
                              title="Avançar status"
                              className="px-1.5 py-0.5 bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-0.5"
                            >
                              <span>Avançar</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Criar Nova Tarefa no Backlog
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <label className="text-xs text-slate-400">Título da Tarefa:</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Ex: Desenvolver tela de olheiros e prospecção de jovens alquimistas"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Pilar:</label>
                <select
                  value={manualPillar}
                  onChange={(e) => setManualPillar(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="phase1_hr">Fase 1: RH & Saúde</option>
                  <option value="phase2_workshop">Fase 2: Complexo B2B & Montagem</option>
                  <option value="phase3_tactics">Fase 3: Tática & 5 Slots</option>
                  <option value="phase4_dungeon">Fase 4: Incursão Masmorra</option>
                  <option value="phase5_results">Fase 5: DRE & Liga das Guildas</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Prioridade:</label>
                <select
                  value={manualPriority}
                  onChange={(e) => setManualPriority(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="P0 - Crítica">P0 - Crítica</option>
                  <option value="P1 - Alta">P1 - Alta</option>
                  <option value="P2 - Média">P2 - Média</option>
                  <option value="P3 - Baixa">P3 - Baixa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Descrição:</label>
              <textarea
                rows={3}
                value={manualDesc}
                onChange={(e) => setManualDesc(e.target.value)}
                placeholder="Objetivo da feature, valor para o jogador..."
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!manualTitle.trim()) return;
                  onAddTask({
                    id: `TASK-${Date.now().toString().slice(-4)}`,
                    title: manualTitle,
                    pillar: manualPillar,
                    priority: manualPriority,
                    status: 'backlog',
                    versionTarget: 'v0.8.0',
                    description: manualDesc || 'Sem descrição.',
                    acceptanceCriteria: ['Revisão técnica de arquitetura', 'Validação funcional'],
                    estimatedPoints: 5
                  });
                  setIsModalOpen(false);
                  setManualTitle('');
                  setManualDesc('');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs"
              >
                Criar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
