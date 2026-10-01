import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  HeroAthlete, 
  CanonicalSlot, 
  ModularPart, 
  AssembledItem, 
  ChamberEvent, 
  DungeonExpeditionResult 
} from '../types/game';
import { INITIAL_MODULAR_PARTS } from '../data/initialSystems';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Trophy, 
  Boxes, 
  Check, 
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  Activity,
  AlertTriangle,
  Flame,
  FileText
} from 'lucide-react';

interface InteractiveSimulatorProps {
  heroes: HeroAthlete[];
  onHeroEquip?: (heroId: string, item: any) => void;
}

// 1. Trânsito Livre (Salas Vazias)
const emptyLogs = [
  'Corredor silencioso. O Suporte Logístico mapeia as armadilhas no chão e a equipe avança sem gastar recursos extras.',
  'A câmara está vazia, mas a tensão continua. Trânsito livre aprovado e a formação tática se mantém intacta.',
  'Nenhum monstro à vista. O Suporte aproveita para curar escoriações leves e a expedição ganha fôlego.',
  'Caminho limpo! A equipe economiza Suprimentos e marcha a passos largos para a próxima câmara.'
];

// 2. Disputa de Mini-boss (Vitória do Jogador)
const playerMinibossLogs = [
  'O Vanguarda segura a linha de frente de forma heroica, abrindo espaço para a Guilda do Jogador esmagar a ameaça! (+1 PE).',
  'Lâminas e magias voando! Os DPS limpam a câmara em tempo recorde e faturam o Abate Prioritário para a nossa Guilda! (+1 PE).',
  'Numa manobra brilhante de controle, o Suporte isola o Mini-boss e a Guilda do Jogador garante mais um abate! (+1 PE).',
  'Deixamos a concorrência comendo poeira! A Guilda do Jogador limpa a sala e o Cartório homologa o Ponto! (+1 PE).'
];

// 3. Disputa de Mini-boss (Vitória do Rival)
const rivalMinibossLogs = [
  `Que golpe baixo! O Suporte Logístico rival passou furtivamente pelo nosso bloqueio e roubou o Abate Prioritário! (+1 PE).`,
  `A Vanguarda rival formou uma parede intransponível, esmagando o monstro antes da nossa equipe se posicionar! (+1 PE).`,
  `Desastre tático! Os DPS rivais foram mais rápidos no gatilho e limparam a sala na nossa frente! (+1 PE).`,
  `Fomos atropelados na corrida! A guilda rival finaliza o Mini-boss e garante o ponto da câmara! (+1 PE).`
];

// 4. Boss Final
const playerBossLogs = [
  'UM VERDADEIRO MASSACRE! Os DPS da Guilda do Jogador atropelam o Boss Final com vantagem máxima e levam a glória exclusiva! (+2 PE).',
  'É O FIM DA LINHA PARA O BOSS! A Guilda do Jogador domina a arena, fatura o Abate Exclusivo e a torcida vai à loucura! (+2 PE).'
];
const jointBossLogs = [
  'QUE LUTA FRENÉTICA! Ninguém cedeu espaço! O Boss cai sob os ataques cruzados das duas guildas e o abate é dividido! (+1 PE para cada).',
  'Empate técnico e brutal na câmara final! As espadas se cruzaram no golpe fatal, e a Coroa homologa um Abate Conjunto! (+1 PE para cada).'
];

// 5. Eventos Críticos: Exaustão e Falência Logística
const playerExhaustionLogs = [
  'FALÊNCIA LOGÍSTICA! Os Suprimentos da Guilda do Jogador zeraram antes da reta final! A equipe abandona a masmorra exausta!',
  'Pane no planejamento! A equipe do Jogador não aguenta o dreno da masmorra, recua e deixa o caminho livre para a concorrência!'
];
const rivalExhaustionLogs = [
  `QUEBROU O MOTOR! A guilda rival ficou sem Suprimentos no meio do caminho e joga a toalha! O caminho está livre!`,
  `Que vexame logístico! Os rivais ficaram sem rações e bateram em retirada. A nossa torcida faz a festa!`
];

// 6. Eventos Críticos: Lesão e Morte (Acidente de Trabalho)
const injuryLogs = [
  'CENA TERRÍVEL NA MASMORRA! A linha de frente cede e um herói sofre um dano colateral gravíssimo! O Cartório já prepara a notificação de Afastamento Médico!',
  'Um golpe fatal devastador quebra a nossa formação! Baixa confirmada na equipe! Isso vai custar caro no DRE e na alma da Guilda!'
];

// 7. Eventos Críticos: Espólios B2B Lendários
const legendaryLootLogs = [
  'BINGO OPERACIONAL!!! O Suporte Logístico encontrou um baú oculto contendo um Ativo Lendário! A diretoria da Guilda vai à loucura!',
  'INACREDITÁVEL! No meio dos escombros, a equipe fatura um Lote Nível Ouro! O Almoxarifado nunca viu uma peça tão valiosa!'
];

export const InteractiveSimulator: React.FC<InteractiveSimulatorProps> = ({
  heroes,
  onHeroEquip,
}) => {
  // Step 1: B2B Modular Assembly State
  const [selectedSlot, setSelectedSlot] = useState<CanonicalSlot>('Arsenal Ofensivo');
  const [selectedPrefix, setSelectedPrefix] = useState<ModularPart>(INITIAL_MODULAR_PARTS[0]);
  const [selectedBase, setSelectedBase] = useState<ModularPart>(INITIAL_MODULAR_PARTS[1]);
  const [selectedSuffix, setSelectedSuffix] = useState<ModularPart>(INITIAL_MODULAR_PARTS[2]);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledItem, setAssembledItem] = useState<AssembledItem | null>(null);

  // Step 2: Squad / Loadout State
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || '');
  const activeHero = heroes.find(h => h.id === selectedHeroId) || heroes[0];

  // Step 3: 10-Chamber Dungeon Incursion State
  const [isExpeditionRunning, setIsExpeditionRunning] = useState(false);
  const [currentChamber, setCurrentChamber] = useState(0);
  const [suppliesT1, setSuppliesT1] = useState(100);
  const [suppliesT2, setSuppliesT2] = useState(100);
  const [scoreT1, setScoreT1] = useState(0); // Pontos de Expedição (PE)
  const [scoreT2, setScoreT2] = useState(0);
  const [chamberLogs, setChamberLogs] = useState<ChamberEvent[]>([]);
  const [expeditionFinished, setExpeditionFinished] = useState(false);

  // B2B 3-Part Modular Assembly Logic
  const handleAssemble = () => {
    setIsAssembling(true);
    setAssembledItem(null);

    setTimeout(() => {
      // Check for Tinkering Inter-Marcas (different corporations)
      const corps = new Set([selectedPrefix.corporation, selectedBase.corporation, selectedSuffix.corporation]);
      const isCrossBrand = corps.size > 1;

      // 30% chance of Overclock if cross-brand, or standard assembly
      const isOverclocked = isCrossBrand && Math.random() < 0.45;
      const basePower = selectedPrefix.powerBonus + selectedBase.powerBonus + selectedSuffix.powerBonus;
      const finalPower = isOverclocked ? Math.round(basePower * 1.15) : basePower;
      const totalEnergy = selectedPrefix.energyBonus + selectedBase.energyBonus + selectedSuffix.energyBonus;

      const item: AssembledItem = {
        id: `item-${Date.now()}`,
        name: `${selectedPrefix.name} ${selectedBase.name} ${selectedSuffix.name}`,
        slot: selectedSlot,
        quality: isOverclocked ? 'Lendário' : 'Ótimo',
        prefix: selectedPrefix,
        base: selectedBase,
        suffix: selectedSuffix,
        powerBonus: finalPower,
        energyBonus: totalEnergy,
        isOverclocked,
        terrainMitigation: selectedPrefix.terrainMitigation || selectedBase.terrainMitigation || selectedSuffix.terrainMitigation,
        marketValue: 450 + finalPower * 25,
      };

      setAssembledItem(item);
      setIsAssembling(false);
    }, 800);
  };

  // Run 10-Chamber Dungeon Incursion (Fase 4 Match Engine)
  const startExpedition = () => {
    setIsExpeditionRunning(true);
    setCurrentChamber(0);
    setSuppliesT1(100 + (assembledItem?.energyBonus || 0));
    setSuppliesT2(100);
    setScoreT1(0);
    setScoreT2(0);
    setChamberLogs([]);
    setExpeditionFinished(false);

    let chamber = 0;
    let sT1 = 100 + (assembledItem?.energyBonus || 0);
    let sT2 = 100;
    let peT1 = 0;
    let peT2 = 0;
    const logs: ChamberEvent[] = [];

    const interval = setInterval(() => {
      chamber += 1;
      setCurrentChamber(chamber);

      // Drain supplies based on terrain and AGI
      const drainT1 = Math.max(6, Math.round(10 * (1 - (activeHero?.attributes.agi || 70) / 400)));
      const drainT2 = Math.round(9 + Math.random() * 3);

      sT1 = Math.max(0, sT1 - drainT1);
      sT2 = Math.max(0, sT2 - drainT2);
      setSuppliesT1(sT1);
      setSuppliesT2(sT2);

      // If chamber is 1 to 9 (Mini-Bosses & Encounters)
      if (chamber < 10) {
        // Chance of critical events
        if (sT1 <= 15 && Math.random() < 0.3) {
          const exMsg = playerExhaustionLogs[Math.floor(Math.random() * playerExhaustionLogs.length)];
          logs.unshift({
            chamber,
            type: 'supplies_critical',
            suppliesT1: sT1,
            suppliesT2: sT2,
            scoreT1: peT1,
            scoreT2: peT2,
            description: `⚠️ Câmara ${chamber}: ${exMsg}`
          });
        }

        const hasEncounter = Math.random() < 0.65;
        if (hasEncounter) {
          const powerT1 = (activeHero?.power || 80) + (assembledItem?.powerBonus || 0);
          const powerT2 = 78 + Math.floor(Math.random() * 10);

          if (sT1 > 0 && (powerT1 > powerT2 || sT2 === 0)) {
            peT1 += 1;
            setScoreT1(peT1);
            const msg = playerMinibossLogs[Math.floor(Math.random() * playerMinibossLogs.length)];
            
            // 20% chance of Legendary B2B loot discovery
            const hasLoot = Math.random() < 0.20;
            const lootMsg = hasLoot ? ` — ${legendaryLootLogs[Math.floor(Math.random() * legendaryLootLogs.length)]}` : '';

            logs.unshift({
              chamber,
              type: 'miniboss',
              suppliesT1: sT1,
              suppliesT2: sT2,
              scoreT1: peT1,
              scoreT2: peT2,
              description: `⚔️ Câmara ${chamber}: ${msg}${lootMsg}`
            });
          } else if (sT2 > 0) {
            peT2 += 1;
            setScoreT2(peT2);
            const msg = rivalMinibossLogs[Math.floor(Math.random() * rivalMinibossLogs.length)];
            
            // 15% chance of work injury accident
            const hasInjury = Math.random() < 0.15;
            const injMsg = hasInjury ? ` — ⚠️ ${injuryLogs[Math.floor(Math.random() * injuryLogs.length)]}` : '';

            logs.unshift({
              chamber,
              type: 'miniboss',
              suppliesT1: sT1,
              suppliesT2: sT2,
              scoreT1: peT1,
              scoreT2: peT2,
              description: `⚠️ Câmara ${chamber}: ${msg}${injMsg}`
            });
          }
        } else {
          const emptyMsg = emptyLogs[Math.floor(Math.random() * emptyLogs.length)];
          logs.unshift({
            chamber,
            type: 'empty',
            suppliesT1: sT1,
            suppliesT2: sT2,
            scoreT1: peT1,
            scoreT2: peT2,
            description: `🗺️ Câmara ${chamber}: ${emptyMsg}`
          });
        }
      } 
      // Chamber 10: Boss da Masmorra
      else if (chamber === 10) {
        clearInterval(interval);
        setIsExpeditionRunning(false);
        setExpeditionFinished(true);

        const powerT1 = (activeHero?.power || 80) + (assembledItem?.powerBonus || 0);
        const powerT2 = 82;

        if (sT1 > 0 && sT2 > 0) {
          const diffPct = Math.abs(powerT1 - powerT2) / Math.max(powerT1, powerT2);
          if (diffPct > 0.15 && powerT1 > powerT2) {
            peT1 += 2;
            setScoreT1(peT1);
            const bossMsg = playerBossLogs[Math.floor(Math.random() * playerBossLogs.length)];
            logs.unshift({
              chamber: 10,
              type: 'boss_final',
              suppliesT1: sT1,
              suppliesT2: sT2,
              scoreT1: peT1,
              scoreT2: peT2,
              description: `👑 CÂMARA 10 (ÁPICE): ${bossMsg}`
            });
          } else {
            peT1 += 1;
            peT2 += 1;
            setScoreT1(peT1);
            setScoreT2(peT2);
            const jointMsg = jointBossLogs[Math.floor(Math.random() * jointBossLogs.length)];
            logs.unshift({
              chamber: 10,
              type: 'boss_final',
              suppliesT1: sT1,
              suppliesT2: sT2,
              scoreT1: peT1,
              scoreT2: peT2,
              description: `🤝 CÂMARA 10: ${jointMsg}`
            });
          }
        } else if (sT1 > 0) {
          peT1 += 2;
          setScoreT1(peT1);
          const bossMsg = playerBossLogs[Math.floor(Math.random() * playerBossLogs.length)];
          const rivalEx = rivalExhaustionLogs[Math.floor(Math.random() * rivalExhaustionLogs.length)];
          logs.unshift({
            chamber: 10,
            type: 'boss_final',
            suppliesT1: sT1,
            suppliesT2: sT2,
            scoreT1: peT1,
            scoreT2: peT2,
            description: `👑 CÂMARA 10: ${rivalEx} ${bossMsg}`
          });
        } else {
          const playerEx = playerExhaustionLogs[Math.floor(Math.random() * playerExhaustionLogs.length)];
          logs.unshift({
            chamber: 10,
            type: 'supplies_critical',
            suppliesT1: 0,
            suppliesT2: sT2,
            scoreT1: peT1,
            scoreT2: peT2,
            description: `⛔ CÂMARA 10: ${playerEx}`
          });
        }

        setChamberLogs([...logs]);

        if (peT1 > peT2) {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 }
          });
        }
      }

      setChamberLogs([...logs]);
    }, 650);
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Boxes className="w-3.5 h-3.5" />
          <span>Simulador Operacional do Ciclo v0.7.1</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Montagem Modular B2B ➔ <span className="text-indigo-400">Loadout 5 Slots</span> ➔ <span className="text-emerald-400">Incursão de 10 Câmaras</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          Experimente em tempo real a montagem de 3 partes (Prefixo + Chassi + Núcleo), o teste de Tinkering Inter-Marcas (com risco de Overclock +15% PE) e o envio da expedição com drenagem de suprimentos e disputa de Pontos de Expedição (PE) na masmorra!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* STEP 1: B2B MODULAR ASSEMBLY (FASE 2) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  ⚒️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">1. Complexo Industrial B2B (Fase 2)</h3>
                  <p className="text-[11px] text-slate-400">Montagem física de 3 partes com regra de concisão</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800">
                v0.7.1 B2B
              </span>
            </div>

            {/* Slot Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Compartimento de Destino:</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Arsenal Ofensivo', 'Provisão Logística'] as CanonicalSlot[]).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(slot);
                      if (slot === 'Provisão Logística') {
                        setSelectedPrefix(INITIAL_MODULAR_PARTS[3]);
                        setSelectedBase(INITIAL_MODULAR_PARTS[4]);
                        setSelectedSuffix(INITIAL_MODULAR_PARTS[5]);
                      } else {
                        setSelectedPrefix(INITIAL_MODULAR_PARTS[0]);
                        setSelectedBase(INITIAL_MODULAR_PARTS[1]);
                        setSelectedSuffix(INITIAL_MODULAR_PARTS[2]);
                      }
                      setAssembledItem(null);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      selectedSlot === slot
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Component Slots */}
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">1. Modificador de Entrada (Prefixo):</span>
                <div className="text-xs font-bold text-white">{selectedPrefix.name} ({selectedPrefix.corporation})</div>
                <div className="text-[11px] text-slate-400">{selectedPrefix.description}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">2. Chassi Principal (Base):</span>
                <div className="text-xs font-bold text-white">{selectedBase.name} ({selectedBase.corporation})</div>
                <div className="text-[11px] text-slate-400">{selectedBase.description}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">3. Núcleo de Ajuste (Sufixo):</span>
                <div className="text-xs font-bold text-white">{selectedSuffix.name} ({selectedSuffix.corporation})</div>
                <div className="text-[11px] text-slate-400">{selectedSuffix.description}</div>
              </div>
            </div>

            {/* Assemble Action */}
            <button
              onClick={handleAssemble}
              disabled={isAssembling}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Boxes className={`w-4 h-4 ${isAssembling ? 'animate-spin' : ''}`} />
              <span>{isAssembling ? 'Integrando Componentes na Bancada...' : 'Executar Montagem Modular B2B'}</span>
            </button>

            {/* Assembled Item Card */}
            {assembledItem && (
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-950/60 to-slate-950 border border-amber-500/60 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400">
                      Equipamento Homologado
                    </span>
                    <h4 className="text-base font-extrabold text-white">
                      {assembledItem.name}
                    </h4>
                  </div>
                  {assembledItem.isOverclocked && (
                    <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-400" /> Overclock (+15% PE)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Bônus de Poder</span>
                    <span className="font-bold text-emerald-400">+{assembledItem.powerBonus} PE</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Reserva de Suprimentos</span>
                    <span className="font-bold text-cyan-400">+{assembledItem.energyBonus} Energia</span>
                  </div>
                </div>

                {assembledItem.terrainMitigation && (
                  <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-xl border border-amber-800">
                    🛡️ Mitigação Ativa: Anula penalidade de 12% em biomas de <strong>Mina Instável</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2 & 3: TACTICS & 10-CHAMBER DUNGEON INCURSION */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  ⚔️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">2. Incursão na Masmorra (Fase 4)</h3>
                  <p className="text-[11px] text-slate-400">10 Câmaras com consumo de Suprimentos e Pontos de Expedição</p>
                </div>
              </div>

              {/* Active Hero Picker */}
              <select
                value={selectedHeroId}
                onChange={(e) => setSelectedHeroId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {heroes.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} (Poder {h.power})
                  </option>
                ))}
              </select>
            </div>

            {/* Combatant Specs */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{activeHero.name}</span>
                  <span className="text-indigo-400 ml-2 font-semibold">[{activeHero.position}]</span>
                </div>
                <span className="text-amber-400 font-mono font-bold">Poder Efetivo: {activeHero.power + (assembledItem?.powerBonus || 0)}</span>
              </div>

              {/* Attributes Strip */}
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">STR</span>
                  <span className="font-bold text-rose-300">{activeHero.attributes.str}</span>
                </div>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">AGI</span>
                  <span className="font-bold text-cyan-300">{activeHero.attributes.agi}</span>
                </div>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">VIT</span>
                  <span className="font-bold text-emerald-300">{activeHero.attributes.vit}</span>
                </div>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">INT</span>
                  <span className="font-bold text-blue-300">{activeHero.attributes.int}</span>
                </div>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">WIS</span>
                  <span className="font-bold text-purple-300">{activeHero.attributes.wis}</span>
                </div>
                <div className="bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">LCK</span>
                  <span className="font-bold text-amber-300">{activeHero.attributes.lck}</span>
                </div>
              </div>
            </div>

            {/* Incursion Scoreboard & Supplies Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Barra de Suprimentos da Força-Tarefa:</span>
                <span className="font-mono text-cyan-400 font-bold">{suppliesT1} / 100</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${
                    suppliesT1 > 40 ? 'bg-cyan-500' : suppliesT1 > 15 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, suppliesT1)}%` }}
                />
              </div>

              {/* Placar Oficial de PE (Pontos de Expedição) */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-indigo-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="text-center flex-1">
                  <span className="text-xs font-bold text-emerald-400">Nossa Guilda</span>
                  <p className="text-[10px] text-slate-400">{suppliesT1} Suprimentos</p>
                </div>
                <div className="text-center px-4 font-mono font-black text-2xl text-white">
                  {scoreT1} - {scoreT2}
                  <span className="block text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    Pontos de Expedição (PE)
                  </span>
                </div>
                <div className="text-center flex-1">
                  <span className="text-xs font-bold text-rose-400">Guilda Rival</span>
                  <p className="text-[10px] text-slate-400">{suppliesT2} Suprimentos</p>
                </div>
              </div>

              {/* Start Incursion Button */}
              <button
                onClick={startExpedition}
                disabled={isExpeditionRunning}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {isExpeditionRunning ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-indigo-300" />
                    <span>Incursionando Câmara {currentChamber} de 10...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>{expeditionFinished ? 'Iniciar Nova Incursão' : 'Despachar Incursão na Masmorra (10 Câmaras)'}</span>
                  </>
                )}
              </button>

              {/* Chamber by Chamber Narrative Feed */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 h-48 overflow-y-auto font-mono text-xs space-y-2">
                {chamberLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-center">
                    Clique no botão acima para simular a marcha pelas 10 Câmaras da masmorra conforme o Match Engine oficial.
                  </div>
                ) : (
                  chamberLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl text-[11px] leading-relaxed border ${
                        log.type === 'boss_final'
                          ? 'bg-amber-950/50 border-amber-500 text-amber-200 font-bold'
                          : log.type === 'miniboss'
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      {log.description}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
