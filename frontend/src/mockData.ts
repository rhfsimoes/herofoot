export type HeroStatus = 'Apto' | 'Fatigado' | 'Afastado'
export type ItemQuality = 'Fraco' | 'Normal' | 'Ótimo' | 'Lendário'
export type SaleStatus = 'vendido' | 'não vendido' | 'contraproposta'
export type WorkshopBranch = 'Ferragem' | 'Alquimia' | 'Joalheria' | 'Culinária'
export type MarginType = 'Promoção' | 'Preço Justo' | 'Preço Abusivo'

export interface Hero {
  id: string
  name: string
  class_name?: string
  specialization_name?: string
  class?: string
  current_power?: number
  power?: number
  fatigue: number     // 0–100
  status: HeroStatus
  salary: number
  injured?: boolean
  injury_weeks_left?: number
  age?: number
  level?: number
  contract_seasons_left?: number
  season_appearances?: number
  happiness?: number
  pending_renewal?: boolean
  renewal_demand?: {
    salary: number
    signing_bonus: number
    seasons: number
  } | null
  potential?: {
    star_potential: number
    is_potential_revealed: boolean
  }
  transfer_fee?: number
}

export interface InventoryItem {
  item_instance_id: string
  name: string
  quality: ItemQuality
  slot_type: 'Arma' | 'Armadura' | 'Joia' | 'Inscrição' | 'Consumível'
  power_bonus: number
  energy_bonus?: number
  terrain_mitigation?: string | null
  charges?: number
  max_charges?: number
  market_value_base: number
  branch?: string
}

export interface Recipe {
  recipe_id?: string
  id?: string
  name: string
  branch: WorkshopBranch
  slot: string
  prefix_component?: string
  prefix?: string
  base_item: string
  base_item_id?: string
  suffix_component?: string
  suffix?: string
  min_workshop_level?: number
  ingredients: { item_id?: string; label?: string; quantity: number }[]
  base_power?: number
  energy_bonus?: number
  energy_restore?: number
  market_value_base?: number
  charges?: number
  terrain_mitigation?: string | null
}

export interface LeagueEntry {
  rank: number
  id?: string
  guild_name: string
  is_player?: boolean
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  pe_for: number
  pe_against: number
  pe_diff: number
  is_promotion_zone?: boolean
  is_relegation_zone?: boolean
}

export interface DivisionInfo {
  id: string
  name: string
  tier: number
  promotion_spots: number
  relegation_spots: number
  season?: number
  rounds_per_season?: number
}

export interface DivisionData {
  id: string
  name: string
  tier: number
  promotion_spots: number
  relegation_spots: number
  is_player_division: boolean
  standings: LeagueEntry[]
}

export interface SeasonSummary {
  season: number
  player_division_id: string
  player_division_name: string
  player_rank: number
  player_promoted: boolean
  player_relegated: boolean
  award_gold: number
  verdict: string
  promoted_guilds: string[]
  relegated_guilds: string[]
  champion_nobre?: string
  champion_acesso?: string
}

export interface MatchResult {
  home_name: string
  home_score: number
  away_name: string
  away_score: number
  is_player_match?: boolean
}

export interface MarketMaterial {
  material_id: string
  name: string
  unit_price: number
  available_quantity: number
}

export interface MarketReadyItem {
  market_item_id: string
  name: string
  slot_type: 'Arma' | 'Armadura' | 'Joia' | 'Inscrição' | 'Consumível'
  quality: ItemQuality
  power_bonus: number
  energy_bonus?: number
  terrain_mitigation?: string | null
  price: number
  charges?: number
  max_charges?: number
}

export interface DungeonClimateInfo {
  id: string
  climate: string
  name: string
  description: string
  power_penalty_pct: number
  energy_cost_extra: number
  mitigation_required: string | null
  mitigation_label: string
}

export interface DungeonInfo {
  id: string
  name: string
  terrain: string
  terrain_label: string
  description: string
  power_penalty_pct?: number
  power_penalty?: number
  energy_cost_extra: number
  mitigation_required: string | null
  mitigation_label: string
  recommended_power: number
  climate?: DungeonClimateInfo
}

export interface SaveSlotInfo {
  slot: string
  label: string
  exists: boolean
  corrupted?: boolean
  error?: string
  save_version?: number
  timestamp?: string
  day?: number
  week?: number
  gold?: number
  team_size?: number
}

export interface DungeonRoomEvent {
  room: number
  is_final_boss: boolean
  energy_t1: number
  energy_t2: number
  t1_present: boolean
  t2_present: boolean
  event: string
}

export interface ExpeditionSummary {
  player_guild: string
  rival_guild: string
  player_pe: number
  rival_pe: number
  match_log: string[]
  room_events: DungeonRoomEvent[]
  rooms_explored_player: number
  rooms_explored_rival: number
  exit_reason_player: string
  exit_reason_rival: string
  climate?: DungeonClimateInfo
}

export interface AffixManual {
  affix_id: string
  name: string
  kind: 'prefix' | 'suffix'
  cost: number
  slots: string[]
}

export interface CraftOptionAffix {
  affix_id: string
  name: string
  kind: 'prefix' | 'suffix'
  available: boolean
  materials: {
    material_id: string
    name: string
    quantity: number
    current: number
    available: boolean
  }[]
  missing_reasons: string[]
  effects_description: string[]
}

export interface CraftOptions {
  success: boolean
  recipe: Recipe
  ingredients: {
    material_id: string
    name: string
    quantity_needed: number
    quantity_current: number
    has_enough: boolean
  }[]
  prefixes: CraftOptionAffix[]
  suffixes: CraftOptionAffix[]
  undiscovered_count: number
}

export interface CraftPreview {
  success: boolean
  can_craft: boolean
  reasons: string[]
  final_name: string
  materials_summary: {
    material_id: string
    name: string
    needed: number
    current: number
    has_enough: boolean
  }[]
  qualities: Record<string, InventoryItem>
  workshop_chances: Record<string, number>
  workshop_level: number
  branch: string
}

export interface MaterialSheet {
  success: boolean
  material: {
    id: string
    name: string
    category: string
    unit_price: number
    min_qty?: number
    max_qty?: number
  }
  used_in_recipes: {
    recipe_id: string
    name: string
    slot: string
    branch: string
  }[]
  enables_affixes: {
    affix_id: string
    name: string
    kind: string
  }[]
  sources: {
    material_id: string
    terrain: string
    chance: number
    quantity_min: number
    quantity_max: number
    min_room: number
    boss_only: boolean
  }[]
}

export interface MedicalFacilityInfo {
  current_level: number
  max_level: number
  facility_name: string
  description: string
  passive_recovery: number
  weekly_maintenance: number
  injury_reduction_pct: number
  next_upgrade?: {
    level: number
    name: string
    cost: number
    passive_recovery: number
    weekly_maintenance: number
  } | null
  actions: {
    massage?: {
      name: string
      description: string
      cost: number
      fatigue_relief: number
    }
    accelerate_injury?: {
      name: string
      description: string
      cost: number
      weeks_reduced: number
    }
    collective_banquet?: {
      name: string
      description: string
      cost: number
      fatigue_relief_all: number
    }
  }
}

export interface PendingContractRenewal {
  hero_id: string
  hero_name: string
  current_salary: number
  demanded_salary: number
  signing_bonus: number
  seasons: number
}

export interface CrownGoal {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  completed: boolean
}

export interface CrownAuditReport {
  cycle: number
  audit_week: number
  status: 'Aprovado' | 'Autuado' | string
  passed: boolean
  goals_completed: number
  total_goals: number
  delta_gold: number
  headline: string
  details: {
    title: string
    target: number
    current: number
    unit: string
    completed: boolean
  }[]
}

export interface CrownGoalsData {
  current_cycle: number
  cycle_start_week: number
  cycle_deadline_week: number
  weeks_remaining: number
  is_audit_week: boolean
  min_goals_to_pass: number
  subsidy_reward: number
  penalty_tax: number
  goals: CrownGoal[]
  goals_completed_count: number
  last_audit_report?: CrownAuditReport | null
  audit_history?: CrownAuditReport[]
}

export interface TransferMarketData {
  listings: Hero[]
  scout_fee: number
  team_size: number
  max_team_size: number
}

export interface GameState {
  day: number
  week: number
  gold: number
  current_phase: number
  active_slot?: string | null
  workshop_levels: Record<string, number>
  materials: Record<string, number>
  inventory: InventoryItem[]
  team: Hero[]
  tactics?: {
    starters: string[]
    reserves?: string[]
    loadout: Record<string, InventoryItem | string | null>
  }
  current_dungeon?: DungeonInfo
  league_table: LeagueEntry[]
  last_round_matches?: MatchResult[]
  last_expedition?: ExpeditionSummary
  current_fixture?: {
    home_name: string
    away_name: string
    home_is_player: boolean
    away_is_player: boolean
  }
  market?: {
    materials_for_sale: MarketMaterial[]
    ready_items_for_sale: MarketReadyItem[]
    affix_manuals?: AffixManual[]
    bulletin?: {
      target: string
      multiplier: number
      headline: string
    } | null
  }
  recipes?: Record<string, Recipe>
  known_affixes?: string[]
  known_recipes?: string[]
  catalog_version?: number
  season?: number
  divisions?: DivisionData[]
  current_division?: DivisionInfo
  season_summary?: SeasonSummary | null
  medical_level?: number
  medical_facilities?: MedicalFacilityInfo
  pending_contract_renewals?: PendingContractRenewal[]
  youth_academy?: Hero[]
  transfer_market?: TransferMarketData
  crown_goals?: CrownGoalsData
}

export const MATERIAL_LABELS: Record<string, string> = {
  mat_iron_ore: 'Minério de Ferro',
  mat_scaly_leather: 'Couro Escamoso',
  mat_mana_crystal: 'Cristal de Mana',
  mat_eucalyptus_herb: 'Erva de Eucalipto',
  mat_flour: 'Farinha de Trigo',
  mat_ember_coal: 'Brasa de Carvão',
  mat_granite_dust: 'Pó de Granito',
  mat_wild_honey: 'Mel Silvestre',
}

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'rec_01', recipe_id: 'rec_01', name: 'Espada Longa de Aço', branch: 'Ferragem',
    slot: 'Arma', prefix: 'Afiada', base_item: 'Espada Longa de Aço', base_item_id: 'item_wep_01',
    suffix: 'do Acidente de Trabalho',
    ingredients: [{ item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 3 }],
    base_power: 25, market_value_base: 250,
  },
  {
    id: 'rec_03', recipe_id: 'rec_03', name: 'Cota de Malha Reforçada', branch: 'Ferragem',
    slot: 'Armadura', prefix: 'Reforçada', base_item: 'Cota de Malha', base_item_id: 'item_arm_03',
    suffix: 'do Laudo Pericial Aprovado',
    ingredients: [
      { item_id: 'mat_scaly_leather', label: 'Couro Escamoso', quantity: 3 },
      { item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 1 }
    ],
    base_power: 20, market_value_base: 220,
  },
  {
    id: 'rec_04', recipe_id: 'rec_04', name: 'Poção de Cura Concentrada', branch: 'Alquimia',
    slot: 'Consumível', prefix: 'Concentrada', base_item: 'Poção de Cura', base_item_id: 'item_cons_03',
    suffix: 'do Prontuário Médico Padrão',
    ingredients: [{ item_id: 'mat_eucalyptus_herb', label: 'Erva de Eucalipto', quantity: 2 }],
    base_power: 0, market_value_base: 120,
  },
  {
    id: 'rec_02', recipe_id: 'rec_02', name: 'Amuleto de Guarda-Alma', branch: 'Joalheria',
    slot: 'Joia', prefix: 'Encantado', base_item: 'Amuleto de Guarda-Alma', base_item_id: 'item_jwl_03',
    suffix: 'do Adicional de Insalubridade',
    ingredients: [{ item_id: 'mat_mana_crystal', label: 'Cristal de Mana', quantity: 2 }],
    base_power: 15, market_value_base: 180,
  },
  {
    id: 'rec_05', recipe_id: 'rec_05', name: 'Ração de Batalha Gourmet', branch: 'Culinária',
    slot: 'Consumível', prefix: 'Nutritiva', base_item: 'Ração de Batalha', base_item_id: 'item_cons_04',
    suffix: 'da Produtividade Sem Pausa',
    ingredients: [{ item_id: 'mat_flour', label: 'Farinha de Trigo', quantity: 3 }],
    base_power: 5, market_value_base: 140,
  },
];

export const CLIMATES_CATALOG: DungeonClimateInfo[] = [
  {
    id: 'climate_clear_sky',
    climate: 'clear_sky',
    name: 'Céu Limpo',
    description: 'Visibilidade plena e condições atmosféricas estáveis. Sem interferências climáticas nas operações da expedição.',
    power_penalty_pct: 0.0,
    energy_cost_extra: 0,
    mitigation_required: null,
    mitigation_label: 'Nenhuma mitigação necessária',
  },
  {
    id: 'climate_lightning_storm',
    climate: 'lightning_storm',
    name: 'Tempestade Elétrica',
    description: 'Descargas atmosféricas violentas que interferem na cadência da expedição e sobrecarregam condutores metálicos.',
    power_penalty_pct: 0.06,
    energy_cost_extra: 3,
    mitigation_required: 'lightning_storm',
    mitigation_label: 'Condutor Aterrado ou Barreira Voltaica',
  },
  {
    id: 'climate_thick_fog',
    climate: 'thick_fog',
    name: 'Névoa Espessa',
    description: 'Bruma densa que retarda a progressão nas galerias e desorienta os exploradores, elevando o tempo de trânsito.',
    power_penalty_pct: 0.05,
    energy_cost_extra: 4,
    mitigation_required: 'thick_fog',
    mitigation_label: 'Lanterna Ocular ou Sinalizador Rúnico',
  },
  {
    id: 'climate_acid_rain',
    climate: 'acid_rain',
    name: 'Chuva Ácida',
    description: 'Precipitação corrosiva que degrada mantimentos e deteriora armaduras em trânsito, elevando o desgaste físico.',
    power_penalty_pct: 0.08,
    energy_cost_extra: 3,
    mitigation_required: 'acid_rain',
    mitigation_label: 'Verniz Neutralizador ou Manto Impermeável',
  },
  {
    id: 'climate_scorching_heat',
    climate: 'scorching_heat',
    name: 'Calor Tórrido',
    description: 'Altas temperaturas com sensação térmica extrema, acelerando a desidratação e o consumo de rações operacionais.',
    power_penalty_pct: 0.06,
    energy_cost_extra: 4,
    mitigation_required: 'scorching_heat',
    mitigation_label: 'Cantil Termorregulado ou Pedra de Gelo',
  },
  {
    id: 'climate_polar_wind',
    climate: 'polar_wind',
    name: 'Vento Polar',
    description: 'Correntes gélidas que entorpecem as articulações dos colaboradores e congelam provisões operacionais.',
    power_penalty_pct: 0.07,
    energy_cost_extra: 4,
    mitigation_required: 'polar_wind',
    mitigation_label: 'Sobretudo Isotérmico ou Brasero Portátil',
  },
]

export const DUNGEONS_CATALOG: DungeonInfo[] = [
  {
    id: 'dungeon_01',
    name: 'Vale dos Ecos Verdejantes',
    terrain: 'neutral',
    terrain_label: 'Campo Aberto Verdejante',
    description: 'Terreno padrão da Liga, sem penalidades ambientais. Trilha seca em campo aberto verdejante.',
    power_penalty_pct: 0.0,
    power_penalty: 0,
    energy_cost_extra: 0,
    mitigation_required: null,
    mitigation_label: 'Nenhuma mitigação necessária',
    recommended_power: 55,
  },
  {
    id: 'dungeon_02',
    name: 'Pântano Pútrido do Vale Baixo',
    terrain: 'toxic_swamp',
    terrain_label: 'Terreno Alagado & Emanações Venenosas',
    description: 'Lama densa e miasma tóxico. Drena suprimentos e reduz a capacidade de combate sem proteção respiratória.',
    power_penalty_pct: 0.12,
    power_penalty: 10,
    energy_cost_extra: 5,
    mitigation_required: 'toxic_swamp',
    mitigation_label: 'EPI Anti-Tóxico ou Runa do Pântano',
    recommended_power: 72,
  },
  {
    id: 'dungeon_03',
    name: 'Cripta do Pico Glacial',
    terrain: 'glacier_frost',
    terrain_label: 'Frio Extremo & Solo Escorregadio',
    description: 'Gelo cristalizado e ventos cortantes. Causa dormência muscular e congelamento rápido de rações.',
    power_penalty_pct: 0.12,
    power_penalty: 10,
    energy_cost_extra: 5,
    mitigation_required: 'glacier_frost',
    mitigation_label: 'Cota Térmica ou Inscrição do Fogo',
    recommended_power: 77,
  },
  {
    id: 'dungeon_04',
    name: 'Mina Profunda dos Desabamentos',
    terrain: 'unstable_mine',
    terrain_label: 'Solo Sísmico & Risco de Queda de Rochas',
    description: 'Estrutura geológica frágil. Exige equipamentos reforçados contra impacto de estalactites.',
    power_penalty_pct: 0.12,
    power_penalty: 12,
    energy_cost_extra: 5,
    mitigation_required: 'unstable_mine',
    mitigation_label: 'Armadura Reforçada ou Amuleto Sísmico',
    recommended_power: 83,
  },
  {
    id: 'dungeon_05',
    name: 'Caldeira Vulcânica de Ignis',
    terrain: 'volcanic_heat',
    terrain_label: 'Calor Magmático & Fissuras Térmicas',
    description: 'Gases incandescentes e solo instável com rios de lava corporativamente delimitados.',
    power_penalty_pct: 0.14,
    power_penalty: 14,
    energy_cost_extra: 6,
    mitigation_required: 'volcanic_heat',
    mitigation_label: 'Manto Ígneo ou Runa de Resfriamento',
    recommended_power: 85,
  },
  {
    id: 'dungeon_06',
    name: 'Ruínas Submersas de Nereus',
    terrain: 'submerged_ruins',
    terrain_label: 'Galerias Inundadas & Pressão Aquática',
    description: 'Câmaras ancestrais submersas onde a movimentação e a conservação de rações são severamente comprometidas.',
    power_penalty_pct: 0.12,
    power_penalty: 11,
    energy_cost_extra: 6,
    mitigation_required: 'submerged_ruins',
    mitigation_label: 'Gel Respiratório ou Botas de Lastro',
    recommended_power: 80,
  },
  {
    id: 'dungeon_07',
    name: 'Bosque Rúnico das Névoas',
    terrain: 'arcane_fog',
    terrain_label: 'Distorção Mística & Eflúvios Arcanos',
    description: 'Mata fechada saturada por resíduos de feitiçaria corporativa desregulada, gerando ilusões e perda de orientação.',
    power_penalty_pct: 0.10,
    power_penalty: 9,
    energy_cost_extra: 5,
    mitigation_required: 'arcane_fog',
    mitigation_label: 'Bússola Espectral ou Lente Reveladora',
    recommended_power: 75,
  },
  {
    id: 'dungeon_08',
    name: 'Pico das Tormentas Elétricas',
    terrain: 'lightning_peaks',
    terrain_label: 'Cordilheira Tempestuosa & Descargas Atmosféricas',
    description: 'Cumes rochosos expostos a arcos voltaicos constantes que sobrecarregam condutores metálicos da party.',
    power_penalty_pct: 0.15,
    power_penalty: 15,
    energy_cost_extra: 7,
    mitigation_required: 'lightning_peaks',
    mitigation_label: 'Aterramento Isolante ou Amuleto do Pára-Raio',
    recommended_power: 88,
  },
]

export function getDungeonForDay(dayOrWeek: number): DungeonInfo {
  const idx = Math.max(0, dayOrWeek - 1) % DUNGEONS_CATALOG.length
  return DUNGEONS_CATALOG[idx]
}

export function getClimateForDay(dayOrWeek: number): DungeonClimateInfo {
  const idx = Math.max(0, dayOrWeek - 1) % CLIMATES_CATALOG.length
  return CLIMATES_CATALOG[idx]
}

export const MOCK_STATE: GameState = {
  day: 1,
  week: 1,
  season: 1,
  gold: 1000,
  current_phase: 1,
  current_dungeon: {
    ...DUNGEONS_CATALOG[0],
    climate: CLIMATES_CATALOG[1], // Tempestade Elétrica
  },
  current_division: {
    id: 'div_acesso',
    name: 'Divisão de Acesso Mercante',
    tier: 2,
    promotion_spots: 2,
    relegation_spots: 0,
    season: 1,
    rounds_per_season: 7,
  },
  workshop_levels: { Ferragem: 1, Alquimia: 1, Joalheria: 1, Culinária: 1 },
  materials: {
    mat_iron_ore: 10,
    mat_scaly_leather: 6,
    mat_mana_crystal: 4,
    mat_eucalyptus_herb: 5,
    mat_flour: 8,
  },
  inventory: [
    {
      item_instance_id: 'item_001',
      name: 'Afiada Espada Longa de Aço do Acidente de Trabalho',
      quality: 'Ótimo',
      slot_type: 'Arma',
      power_bonus: 34,
      market_value_base: 350,
    },
    {
      item_instance_id: 'item_002',
      name: 'Concentrada Poção de Cura do Prontuário Médico Padrão',
      quality: 'Normal',
      slot_type: 'Consumível',
      power_bonus: 0,
      market_value_base: 80,
      charges: 3,
      max_charges: 3,
    },
  ],
  team: [
    { id: 'hero_01', name: 'Valdris, o Escudeiro Sênior', class_name: 'Guerreiro', specialization_name: 'Espadachim', current_power: 66, fatigue: 20, status: 'Apto', salary: 60, contract_seasons_left: 2, season_appearances: 0, happiness: 85 },
    { id: 'hero_02', name: 'Seren Ironthorn, a Berserker', class_name: 'Guerreiro', specialization_name: 'Berserker', current_power: 52, fatigue: 65, status: 'Fatigado', salary: 50, contract_seasons_left: 2, season_appearances: 0, happiness: 75 },
    { id: 'hero_03', name: 'Magister Vorn (Especialista em Fogo)', class_name: 'Mago', specialization_name: 'Piromante', current_power: 63, fatigue: 0, status: 'Apto', salary: 75, contract_seasons_left: 1, season_appearances: 0, happiness: 90 },
    { id: 'hero_04', name: 'Reva, a Aprendiz de Alquimia', class_name: 'Clérigo', specialization_name: 'Clérigo de Apoio', current_power: 36, fatigue: 0, status: 'Afastado', salary: 35, injury_weeks_left: 1, contract_seasons_left: 2, season_appearances: 0, happiness: 60 },
    { id: 'hero_05', name: 'Dorath Pedra-Cinza (Bárbaro Contratado)', class_name: 'Guerreiro', specialization_name: 'Berserker', current_power: 80, fatigue: 15, status: 'Apto', salary: 85, contract_seasons_left: 2, season_appearances: 0, happiness: 80 },
  ],
  league_table: [
    { rank: 1, guild_name: 'Ordem do Grifo Dourado', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 2, guild_name: 'Irmandade do Aço Negro', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 3, guild_name: 'Lança da Alvorada', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 4, guild_name: 'Guilda do Jogador', is_player: true, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 5, guild_name: 'Corvo e Osso', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 6, guild_name: 'Sentinelas da Prata', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 7, guild_name: 'Vigia de Pedra', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
    { rank: 8, guild_name: 'Legião do Crepúsculo', is_player: false, played: 0, wins: 0, draws: 0, losses: 0, points: 0, pe_for: 0, pe_against: 0, pe_diff: 0 },
  ],
  tactics: {
    starters: ['hero_01', 'hero_02', 'hero_03', 'hero_05'],
    reserves: [],
    loadout: {
      Arma: 'item_001',
      Armadura: null,
      Joia: null,
      Inscrição: null,
      Consumível: 'item_002',
    },
  },
  market: {
    materials_for_sale: [
      { material_id: 'mat_iron_ore', name: 'Minério de Ferro', unit_price: 20, available_quantity: 6 },
      { material_id: 'mat_scaly_leather', name: 'Couro Escamoso', unit_price: 35, available_quantity: 4 },
      { material_id: 'mat_mana_crystal', name: 'Cristal de Mana', unit_price: 55, available_quantity: 2 },
      { material_id: 'mat_eucalyptus_herb', name: 'Erva de Eucalipto', unit_price: 25, available_quantity: 5 },
      { material_id: 'mat_flour', name: 'Farinha de Trigo', unit_price: 15, available_quantity: 8 },
    ],
    ready_items_for_sale: [
      { market_item_id: 'mkt_01', name: 'Espada de Cavalaria', slot_type: 'Arma', quality: 'Normal', power_bonus: 18, price: 220 },
      { market_item_id: 'mkt_02', name: 'Gibão de Couro Endurecido', slot_type: 'Armadura', quality: 'Ótimo', power_bonus: 24, price: 360 },
      { market_item_id: 'mkt_03', name: 'Anel de Prata Encantado', slot_type: 'Joia', quality: 'Normal', power_bonus: 10, price: 180 },
      { market_item_id: 'mkt_04', name: 'Ração Militar Fortificada', slot_type: 'Consumível', quality: 'Normal', power_bonus: 5, energy_bonus: 25, price: 95 },
    ],
    bulletin: {
      target: 'Armadura',
      multiplier: 2.2,
      headline: 'Ruptura de fornecimento eleva a demanda por Armaduras junto à Câmara dos Mercadores.',
    },
  },
  youth_academy: [
    {
      id: 'youth_01',
      name: 'Elysia Carvalho',
      class_name: 'Guerreiro',
      specialization_name: 'Espadachim',
      age: 16,
      level: 1,
      current_power: 42,
      fatigue: 0,
      status: 'Apto',
      salary: 15,
      contract_seasons_left: 0,
      season_appearances: 0,
      happiness: 95,
      potential: { star_potential: 4, is_potential_revealed: true }
    },
    {
      id: 'youth_02',
      name: 'Kaelan Sombras',
      class_name: 'Ladino',
      specialization_name: 'Arqueiro',
      age: 17,
      level: 1,
      current_power: 38,
      fatigue: 0,
      status: 'Apto',
      salary: 15,
      contract_seasons_left: 0,
      season_appearances: 0,
      happiness: 90,
      potential: { star_potential: 5, is_potential_revealed: true }
    }
  ],
  transfer_market: {
    scout_fee: 150,
    team_size: 5,
    max_team_size: 12,
    listings: [
      {
        id: 'mkt_hero_01',
        name: 'Garrick Martel',
        class_name: 'Guerreiro',
        specialization_name: 'Berserker',
        age: 23,
        level: 2,
        current_power: 58,
        fatigue: 0,
        status: 'Apto',
        salary: 65,
        transfer_fee: 380,
        contract_seasons_left: 2,
        season_appearances: 0,
        happiness: 85,
        potential: { star_potential: 3, is_potential_revealed: false }
      },
      {
        id: 'mkt_hero_02',
        name: 'Isolde Névoa',
        class_name: 'Mago',
        specialization_name: 'Piromante',
        age: 26,
        level: 3,
        current_power: 68,
        fatigue: 0,
        status: 'Apto',
        salary: 80,
        transfer_fee: 520,
        contract_seasons_left: 2,
        season_appearances: 0,
        happiness: 80,
        potential: { star_potential: 4, is_potential_revealed: false }
      }
    ]
  },
  crown_goals: {
    current_cycle: 1,
    cycle_start_week: 1,
    cycle_deadline_week: 8,
    weeks_remaining: 7,
    is_audit_week: false,
    min_goals_to_pass: 2,
    subsidy_reward: 400,
    penalty_tax: 200,
    goals_completed_count: 2,
    goals: [
      {
        id: 'financial_solvency',
        title: 'Superávit e Solvência de Caixa',
        description: 'Manter saldo em caixa de pelo menos 1000 Moedas de Ouro no encerramento pericial.',
        target: 1000,
        current: 1000,
        unit: 'Ouro',
        completed: true
      },
      {
        id: 'league_performance',
        title: 'Eficácia Competitiva na Liga',
        description: 'Conquistar pelo menos 8 pontos na Liga das Guildas durante o trimestre fiscal.',
        target: 8,
        current: 0,
        unit: 'Pontos',
        completed: false
      },
      {
        id: 'operational_health',
        title: 'Conformidade e Segurança Ocupacional',
        description: 'Apresentar no máximo 0 herói(s) afastado(s) por lesão na auditoria do Conselho.',
        target: 0,
        current: 0,
        unit: 'Afastados',
        completed: true
      }
    ]
  }
}


