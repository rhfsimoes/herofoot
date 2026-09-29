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
]

export const MOCK_STATE: GameState = {
  day: 1,
  week: 1,
  season: 1,
  gold: 1000,
  current_phase: 1,
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
}

