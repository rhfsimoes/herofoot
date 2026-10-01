export type SystemPillar = 
  | 'phase1_hr'        // Fase 1: RH, Medicina Ocupacional, Academia & Transferências
  | 'phase2_workshop'  // Fase 2: Complexo Industrial B2B, Montagem Modular & Spot Market
  | 'phase3_tactics'   // Fase 3: Engenharia Tática, Party de 6 Titulares & Loadout 5 Slots
  | 'phase4_dungeon'   // Fase 4: Incursão em Masmorra, 10 Câmaras, Suprimentos & PE
  | 'phase5_results';  // Fase 5: DRE Dinâmico, Liga das Guildas & Auditorias da Coroa

export type SystemStatus = 'implemented' | 'in_progress' | 'planned' | 'needs_review';

export interface GameSystem {
  id: string;
  name: string;
  pillar: SystemPillar;
  status: SystemStatus;
  complexity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  version: string;
  description: string;
  sourceDoc?: string;
  architectureDetails: string[];
  dependencies: string[];
  techLeadNotes: string;
}

export interface HeroAthlete {
  id: string;
  name: string;
  position: 'Vanguarda' | 'Flanqueador' | 'Retaguarda' | 'Suporte' | 'Batedor';
  level: number;
  power: number; // 1 - 100 consolidado
  attributes: {
    str: number;
    agi: number;
    vit: number;
    int: number;
    wis: number;
    lck: number;
  };
  stamina: number;      // 0 - 100 (Fadiga)
  maxStamina: number;
  morale: number;       // Moral (0 - 100)
  wage: number;         // Salário semanal em ouro
  contractYears: number; // 1 a 3 temporadas
  status: 'Apto' | 'Fatigado' | 'Afastado';
  potentialStars: number; // 1 a 5 (Revelado na Academia, oculto [???] no Mercado)
}

export type CanonicalSlot = 
  | 'Arsenal Ofensivo'
  | 'Blindagem Operacional'
  | 'Dispositivo Tático'
  | 'Alvará de Risco'
  | 'Provisão Logística';

export interface ModularPart {
  id: string;
  name: string; // 1-2 palavras
  type: 'prefix' | 'base' | 'suffix';
  slot: CanonicalSlot;
  corporation: string; // ex: corp_iron_foundry, corp_alchemical, corp_mercurius
  tier: 1 | 2 | 3;
  powerBonus: number;
  energyBonus: number;
  terrainMitigation?: 'toxic_swamp' | 'glacier_frost' | 'unstable_mine';
  description: string;
}

export interface AssembledItem {
  id: string;
  name: string; // [Prefixo] [Base] [Sufixo]
  slot: CanonicalSlot;
  quality: 'Fraco' | 'Normal' | 'Ótimo' | 'Lendário';
  prefix: ModularPart;
  base: ModularPart;
  suffix: ModularPart;
  powerBonus: number;
  energyBonus: number;
  terrainMitigation?: string;
  isOverclocked?: boolean; // +15% PE (Tinkering Inter-Marcas)
  marketValue: number;
}

export interface ChamberEvent {
  chamber: number; // 1 a 10
  type: 'empty' | 'encounter' | 'miniboss' | 'boss_final' | 'supplies_critical' | 'tinkering_boost';
  suppliesT1: number;
  suppliesT2: number;
  scoreT1: number;
  scoreT2: number;
  description: string;
}

export interface DungeonExpeditionResult {
  homeGuild: string;
  awayGuild: string;
  homePE: number; // Pontos de Expedição
  awayPE: number;
  chambers: ChamberEvent[];
  bossOutcome: 'Abate Exclusivo' | 'Abate Conjunto' | 'Não Atingido';
  mvpHero: string;
  royalLoot: string[];
}

export interface BacklogTask {
  id: string;
  title: string;
  pillar: SystemPillar;
  priority: 'P0 - Crítica' | 'P1 - Alta' | 'P2 - Média' | 'P3 - Baixa';
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  versionTarget: 'v0.7.1' | 'v0.8.0' | 'v0.9.0' | 'v1.0.0';
  description: string;
  acceptanceCriteria: string[];
  estimatedPoints: number;
}
