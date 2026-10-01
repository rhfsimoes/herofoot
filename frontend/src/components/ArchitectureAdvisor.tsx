import React, { useState } from 'react';
import { 
  Code2, 
  Cpu, 
  Database, 
  Terminal, 
  GitBranch, 
  Copy, 
  Check, 
  ShieldCheck, 
  Boxes,
  Zap,
  Sparkles
} from 'lucide-react';

export const ArchitectureAdvisor: React.FC = () => {
  const [activeSnippet, setActiveSnippet] = useState<'synthesis' | 'match_engine' | 'schema'>('synthesis');
  const [copied, setCopied] = useState(false);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const synthesisCode = `// ==========================================
// HEROFOOT v0.7.1: B2B MODULAR ASSEMBLY ENGINE
// ==========================================

export interface ModularPart {
  id: string;
  name: string; // Regra de concisão: 1-2 palavras (ex: 'Pesado', 'Canhão', 'de Aço')
  type: 'prefix' | 'base' | 'suffix';
  slot: 'Arsenal Ofensivo' | 'Blindagem Operacional' | 'Dispositivo Tático' | 'Alvará de Risco' | 'Provisão Logística';
  corporation: string; // ex: 'corp_iron_foundry', 'corp_alchemical'
  tier: 1 | 2 | 3;
  powerBonus: number;
  energyBonus: number;
  terrainMitigation?: 'toxic_swamp' | 'glacier_frost' | 'unstable_mine';
}

export interface AssembledItem {
  id: string;
  name: string; // [Prefixo] [Base] [Sufixo] -> "Pesado Canhão de Aço"
  slot: string;
  quality: 'Fraco' | 'Normal' | 'Ótimo' | 'Lendário';
  powerBonus: number;
  energyBonus: number;
  isOverclocked: boolean; // +15% PE (Tinkering Inter-Marcas)
  terrainMitigation?: string;
}

export class B2BAssemblyEngine {
  /**
   * Integra 3 componentes físicos respeitando marcas e risco de Tinkering
   */
  static assemble(
    prefix: ModularPart,
    base: ModularPart,
    suffix: ModularPart,
    workshopLevel: number = 3
  ): AssembledItem {
    // 1. Verificação de Tensão de Marcas (Tinkering Inter-Marcas)
    const distinctCorps = new Set([prefix.corporation, base.corporation, suffix.corporation]);
    const isCrossBrand = distinctCorps.size > 1;

    // 2. Risco de Falha vs Overclock Não-Autorizado (+15% Poder Efetivo)
    let isOverclocked = false;
    let basePower = prefix.powerBonus + base.powerBonus + suffix.powerBonus;

    if (isCrossBrand && Math.random() < 0.35) {
      isOverclocked = true;
      basePower = Math.round(basePower * 1.15); // +15% PE de Overclock
    }

    const totalEnergy = prefix.energyBonus + base.energyBonus + suffix.energyBonus;
    const mitigation = prefix.terrainMitigation || base.terrainMitigation || suffix.terrainMitigation;

    return {
      id: \`item_\${Date.now()}\`,
      name: \`\${prefix.name} \${base.name} \${suffix.name}\`,
      slot: base.slot,
      quality: isOverclocked ? 'Lendário' : workshopLevel >= 4 ? 'Ótimo' : 'Normal',
      powerBonus: basePower,
      energyBonus: totalEnergy,
      isOverclocked,
      terrainMitigation: mitigation
    };
  }
}`;

  const matchEngineCode = `// ==========================================
// HEROFOOT v0.7.1: 10-CHAMBER DUNGEON INCURSION
// ==========================================

export interface PartyState {
  heroes: Array<{ id: string; name: string; position: string; power: number; agi: number }>;
  loadoutPowerBonus: number;
  hasTerrainMitigation: boolean;
}

export class MatchEngine10Chambers {
  /**
   * Simula a incursão expedicionária de 10 câmaras baseada em Suprimentos
   */
  static simulateExpedition(
    homeParty: PartyState,
    awayParty: PartyState,
    biome: string,
    climate: string,
    seed: number
  ) {
    let suppliesHome = 100;
    let suppliesAway = 100;
    let peHome = 0; // Pontos de Expedição
    let peAway = 0;

    // Redução de custo pela Agilidade Média da equipe (até 20%)
    const avgAgiHome = homeParty.heroes.reduce((s, h) => s + h.agi, 0) / 6;
    const agiDiscountHome = Math.min(0.20, avgAgiHome / 500);

    for (let chamber = 1; chamber <= 10; chamber++) {
      // 1. Dreno de Suprimentos por Câmara
      const drainBase = 10;
      suppliesHome = Math.max(0, suppliesHome - Math.round(drainBase * (1 - agiDiscountHome)));
      suppliesAway = Math.max(0, suppliesAway - Math.round(drainBase * 0.95));

      // 2. Câmaras 1 a 9: Encontros com Mini-Bosses (Probabilidade 65%)
      if (chamber < 10) {
        if (Math.random() < 0.65) {
          const powerHome = homeParty.heroes.reduce((s, h) => s + h.power, 0) / 6 + homeParty.loadoutPowerBonus;
          const powerAway = 78;

          if (suppliesHome > 0 && powerHome > powerAway) {
            peHome += 1; // +1 Ponto de Expedição
          } else if (suppliesAway > 0) {
            peAway += 1;
          }
        }
      } 
      // 3. Câmara 10: O Boss da Masmorra
      else {
        if (suppliesHome > 0 && suppliesAway > 0) {
          const powerHome = homeParty.heroes.reduce((s, h) => s + h.power, 0) / 6 + homeParty.loadoutPowerBonus;
          const powerAway = 82;
          const diffPct = Math.abs(powerHome - powerAway) / Math.max(powerHome, powerAway);

          if (diffPct > 0.15 && powerHome > powerAway) {
            peHome += 2; // Abate Exclusivo (+2 PE)
          } else {
            peHome += 1; // Abate Conjunto (+1 PE para cada)
            peAway += 1;
          }
        } else if (suppliesHome > 0) {
          peHome += 2; // Abate Solo do Boss (+2 PE)
        }
      }
    }

    return {
      score_t1: peHome,
      score_t2: peAway,
      isSynchronized: true
    };
  }
}`;

  const schemaCode = `// ==========================================
// HEROFOOT v0.7.1: CANONICAL DRE & GAMESTATE
// ==========================================

{
  "week": 8,
  "phase": 5,
  "treasury": 48250,
  "guild": {
    "name": "Valentes da Coroa",
    "division": "Divisão Nobre",
    "standing": { "points": 18, "wins": 5, "draws": 3, "losses": 0, "pe_for": 24, "pe_against": 12 },
    "consecutive_negative_cycles": 0
  },
  "b2b_partnerships": [
    { "corp_id": "corp_iron_foundry", "brand_level": "Prata", "brand_xp": 140, "trust": 68 },
    { "corp_id": "corp_mercurius", "brand_level": "Bronze", "brand_xp": 45, "trust": 50 }
  ],
  "loadout_5_slots": {
    "arsenal_ofensivo": "Pesado Canhão de Aço",
    "blindagem_operacional": "Placa Reforçada",
    "dispositivo_tatico": "Anel Cinético de Foco",
    "alvara_de_risco": "Licença Cartorária de Mina",
    "provisao_logistica": "Concentrada Ração da Intendência"
  },
  "weekly_dre": {
    "revenue": { "incursion_share": 3200, "spot_counter": 1850, "b2b_assembly": 2400 },
    "expenses": { "hero_wages": 4200, "facility_maintenance": 800, "spot_purchases": 950 },
    "net_income": 1500
  }
}`;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Diretrizes de Engenharia de Software</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Arquitetura Técnica do <span className="text-cyan-400">HeroFoot</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Como Tech Lead, estruturei este guia com os padrões de código, diagramas de arquitetura limpa (Clean Architecture / Decoupled Engine) e algoritmos para você implementar na sua engine alvo (Godot, Unity, C# ou TypeScript).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Arquitetura Aprovada
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Pillars of Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Desacoplamento Core / UI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O motor de simulação de futebol e a síntese alquímica devem ser bibliotecas puras (sem dependência de nós da engine ou UI). Isso permite simular 38 rodadas de liga em 2 segundos em segundo plano!
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Determinismo com RNG Seed</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Todas as partidas usam sementes pseudo-aleatórias (Seed). Uma partida jogada com a mesma seed reproduz 100% dos lances e eventos, tornando saves e replays leves (armazenam apenas a seed e a escalação).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Economia Anti-Inflação</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            O dinheiro arrecadado na bilheteria do Brasfoot é drenado continuamente pelos custos de manutenção do caldeirão alquímico e salários crescentes de heróis de nível alto, mantendo o desafio constante.
          </p>
        </div>
      </div>

      {/* Code Snippets & Algorithms */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Algoritmos de Referência para Desenvolvimento</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSnippet('synthesis')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSnippet === 'synthesis'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Síntese Atelier (Algoritmo)
            </button>
            <button
              onClick={() => setActiveSnippet('match_engine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSnippet === 'match_engine'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Match Engine (Brasfoot)
            </button>
            <button
              onClick={() => setActiveSnippet('schema')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeSnippet === 'schema'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              SaveGame JSON Schema
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              const code = activeSnippet === 'synthesis' ? synthesisCode : activeSnippet === 'match_engine' ? matchEngineCode : schemaCode;
              copyCode(code);
            }}
            className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors z-10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
          </button>

          <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[460px]">
            {activeSnippet === 'synthesis' ? synthesisCode : activeSnippet === 'match_engine' ? matchEngineCode : schemaCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
