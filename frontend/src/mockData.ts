import partsSeed from '../../data/parts_seed.json'

export type HeroStatus = 'Apto' | 'Fatigado' | 'Afastado' | 'Falecido'
export type ItemQuality = 'Fraco' | 'Normal' | 'Ótimo' | 'Lendário'
export type SaleStatus = 'vendido' | 'não vendido' | 'contraproposta'
export type WorkshopBranch = 'Ferragem' | 'Alquimia' | 'Joalheria' | 'Culinária'
export type MarginType = 'Promoção' | 'Preço Justo' | 'Preço Abusivo'

export interface Hero {
  id: string
  name: string
  position?: string
  position_id?: string
  position_icon?: string
  position_description?: string
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
  training_weeks?: number
  max_training_weeks?: number
  maturation_pct?: number
  is_graduated?: boolean
  traits?: string[]
}

export interface InventoryItem {
  item_instance_id: string
  name: string
  quality: ItemQuality
  slot_type: 'Arsenal Ofensivo' | 'Blindagem Operacional' | 'Ativo de Performance' | 'Alvará de Risco' | 'Provisão Logística'
  power_bonus: number
  energy_bonus?: number
  terrain_mitigation?: string | null
  mitigations?: string[]
  charges?: number
  max_charges?: number
  market_value_base: number
  branch?: string
  description?: string
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
  tier?: number
  xp_reward?: number
  ingredients: { item_id?: string; material_id?: string; label?: string; quantity: number }[]
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
  slot_type: 'Arsenal Ofensivo' | 'Blindagem Operacional' | 'Ativo de Performance' | 'Alvará de Risco' | 'Provisão Logística'
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
  drop_bonus_category?: string
  drop_bonus_pct?: number
  catalyst_drop_bonus_pct?: number
  market_trend?: string
  catalyst_label?: string
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
  score_t1?: number
  score_t2?: number
  points_t1?: number
  points_t2?: number
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

export interface ExpeditionLootItem {
  material_id?: string
  part_id?: string
  name: string
  quantity: number
  rarity?: string
  slot_role?: 'prefix' | 'base' | 'suffix'
  power_bonus?: number
}

export interface FinancialStatement {
  revenue?: number
  expedition_revenue?: number
  sales_revenue?: number
  assembly_sales_revenue?: number
  season_award?: number
  crown_subsidy?: number
  crown_penalty?: number
  salaries?: number
  maintenance?: number
  base_maintenance?: number
  medical_maintenance?: number
  academy_maintenance?: number
  b2b_royalties_cost?: number
  assembly_workers_salaries?: number
  market_expenses?: number
  contract_signing_expenses?: number
  hiring_expenses?: number
  total_revenue?: number
  total_expenses?: number
  net?: number
}

// ─── Complexo Industrial B2B & Montagem Modular (v0.7.0) ───────────────────
export interface Corporation {
  id: string
  name: string
  branch: WorkshopBranch | string
  specialty: string
  exclusivity_tag: string
  rival_corp_id: string | null
  description: string
}

export interface ModularPart {
  id: string
  part_id?: string
  corp_id: string
  brand_id?: string
  name: string
  branch?: WorkshopBranch | string
  part_type: 'blade' | 'hilt' | 'guard' | 'plating' | 'filter' | 'core' | 'gem' | string
  compatible_slots: ('Arsenal Ofensivo' | 'Blindagem Operacional' | 'Ativo de Performance' | 'Alvará de Risco' | 'Provisão Logística' | string)[]
  tier: number
  base_cost?: number
  market_price_base?: number
  power_bonus?: number
  power_contrib?: number
  energy_bonus?: number
  catalog_description?: string
  slot_role?: 'prefix' | 'base' | 'suffix'
  name_modifier?: string
  affix_id_source?: string
  effects?: { effect: string; value?: number | string; requires_quality?: string }[]
}

export interface B2BShipmentItem {
  part_id: string
  quantity: number
}

export interface B2BContractRequirement {
  min_confidence: number
  min_workshop_level: number
  requires_previous_tier: string | null
  description: string
}

export interface B2BContract {
  contract_id: string
  corp_id: string
  tier: 'Bronze' | 'Prata' | 'Ouro' | string
  title: string
  weekly_royalty: number
  is_exclusive: boolean
  discount_pct: number
  weekly_shipment: B2BShipmentItem[]
  description: string
  requirements?: B2BContractRequirement
}

export interface AssemblyWorker {
  worker_id: string
  name: string
  tier: number
  hiring_cost: number
  weekly_salary: number
  production_capacity: number
  supported_branches: string[]
  allowed_recipes: string[]
  description: string
}

export interface AssemblyWorkerInstance {
  worker_instance_id: string
  worker_id: string
  name: string
  tier: number
  weekly_salary: number
  production_capacity: number
  assigned_branch: string
  supported_branches: string[]
  allowed_recipes: string[]
  target_recipe: string | null
  target_corp_id?: string | null
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
  contractor_confidence?: number
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

export interface WorkshopXPProgression {
  xp_to_next_level: number | null
  xp_per_craft_tier1: number
  xp_per_craft_tier2: number
  xp_per_craft_tier3: number | null
  upgrade_cost_gold: number | null
}

export const WORKSHOP_XP_TABLE: Record<number, { xp_to_next: number | null; upgrade_cost: number }> = {
  1: { xp_to_next: 100, upgrade_cost: 500 },
  2: { xp_to_next: 150, upgrade_cost: 1000 },
  3: { xp_to_next: 225, upgrade_cost: 2000 },
  4: { xp_to_next: 338, upgrade_cost: 4000 },
  5: { xp_to_next: 506, upgrade_cost: 8000 },
  6: { xp_to_next: null, upgrade_cost: 0 },
}

export const WORKSHOP_LEVEL_BENEFITS: Record<number, { title: string; summary: string; branchBonus?: Record<string, string> }> = {
  1: {
    title: 'Bancada Básica',
    summary: 'Homologação para projetos comuns de Tier 1. Qualidades Fraco e Normal.',
  },
  2: {
    title: 'Processos Padronizados',
    summary: 'Desbloqueio de qualidade Ótimo e primeira calibragem estatística favorável na forja.',
  },
  3: {
    title: 'Economia de Escala (Aprendiz de Apoio)',
    summary: 'Redução de 15% no desperdício de insumos principais das ordens de serviço deste ramo.',
  },
  4: {
    title: 'Expansão de Linha Operacional',
    summary: 'Autorização plena de projetos Tier 2 (itens complexos) e novos afixos corporativos.',
  },
  5: {
    title: 'Mestre de Bancada Residente (Corpo Técnico)',
    summary: 'Contratação permanente de um mestre de ofício com bonificação exclusiva de filial.',
    branchBonus: {
      'Ferragem': 'Mestre Armeiro: Permite forjar projetos Tier 3 e concede probabilidade de afixo duplo.',
      'Alquimia': 'Mestre Boticário: +1 carga operacional máxima para todos os elixires e tônicos forjados.',
      'Joalheria': 'Mestre Lapidador: +20% de tolerância e aceitação de margens no Balcão de Vendas.',
      'Culinária': 'Chefe de Intendência: Rações e suprimentos restauram +15 de energia na expedição.',
    },
  },
  6: {
    title: 'Ateliê Imperial de Referência',
    summary: 'Acesso a projetos e afixos Lendários exclusivos + Selo Imperial que valoriza peças em +25%.',
  },
}

export interface CorporateEventEffect {
  gold?: number
  fatigue_all?: number
  supplies_bonus?: number
  morale?: number
  power_pct_modifier?: number
}

export interface CorporateEventOption {
  id: string
  label: string
  description: string
  consequence_narrative: string
  effects: CorporateEventEffect
}

export interface CorporateEvent {
  id: string
  title: string
  description: string
  category: string
  trigger_phase: string
  options: CorporateEventOption[]
}
export interface GameState {
  day: number
  week: number
  gold: number
  contractor_confidence?: number
  current_phase: number
  active_slot?: string | null
  active_event?: CorporateEvent | null
  resolved_events_history?: string[]
  supplies_bonus?: number
  workshop_levels: Record<string, number>
  workshop_xp?: Record<string, number>
  xp_progression?: Record<string | number, WorkshopXPProgression>
  materials: Record<string, number>
  inventory: InventoryItem[]
  warehouse_parts?: Record<string, number>
  brand_xp?: Record<string, number>
  b2b_slots_locked?: number
  active_b2b_contracts?: B2BContract[]
  assembly_line_workers?: AssemblyWorkerInstance[]
  corporate_exclusivity_tags?: string[]
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
    active_vip_order?: VipOrder | null
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
  financials?: FinancialStatement
  last_financial_statement?: FinancialStatement
  weekly_sales_revenue?: number
  last_expedition_loot?: ExpeditionLootItem[]
  rival_traits?: RivalTrait[]
  guild_name?: string
  consecutive_negative_gold_weeks?: number
  game_over?: boolean
  game_over_reason?: string | null
  season_completed?: boolean
  season_outcome?: SeasonSummary | null
}


export interface RivalTrait {
  id: string
  name: string
  description: string
  power_bonus_pct?: number
  supply_bonus_pct?: number
  terrain_mitigation?: string
  confidence_impact?: number
}

export interface VipOrder {
  id: string
  item_type: string
  min_quality: string
  reward_gold: number
  reward_confidence: number
  headline: string
  expires_in_rounds: number
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
    suffix: 'do Acidente de Trabalho', min_workshop_level: 1,
    ingredients: [{ item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 3 }],
    base_power: 25, market_value_base: 250,
  },
  {
    id: 'rec_fe_02', recipe_id: 'rec_fe_02', name: 'Machado de Guerra Pesado', branch: 'Ferragem',
    slot: 'Arma', prefix: 'Pesado', base_item: 'Machado de Guerra', base_item_id: 'item_wep_02',
    suffix: 'da Alta Produtividade', min_workshop_level: 2,
    ingredients: [
      { item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 4 },
      { item_id: 'mat_scaly_leather', label: 'Couro Escamoso', quantity: 2 },
    ],
    base_power: 45, market_value_base: 450,
  },
  {
    id: 'rec_fe_03', recipe_id: 'rec_fe_03', name: 'Armadura de Placas do Comendador', branch: 'Ferragem',
    slot: 'Armadura', prefix: 'Impenetrável', base_item: 'Armadura de Placas', base_item_id: 'item_arm_04',
    suffix: 'da Blindagem Contábil', min_workshop_level: 3,
    ingredients: [
      { item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 6 },
      { item_id: 'mat_scaly_leather', label: 'Couro Escamoso', quantity: 4 },
    ],
    base_power: 70, market_value_base: 850,
  },
  {
    id: 'rec_03', recipe_id: 'rec_03', name: 'Cota de Malha Reforçada', branch: 'Ferragem',
    slot: 'Armadura', prefix: 'Reforçada', base_item: 'Cota de Malha', base_item_id: 'item_arm_03',
    suffix: 'do Laudo Pericial Aprovado', min_workshop_level: 1,
    ingredients: [
      { item_id: 'mat_scaly_leather', label: 'Couro Escamoso', quantity: 3 },
      { item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 1 }
    ],
    base_power: 20, market_value_base: 220,
  },
  {
    id: 'rec_04', recipe_id: 'rec_04', name: 'Poção de Cura Concentrada', branch: 'Alquimia',
    slot: 'Consumível', prefix: 'Concentrada', base_item: 'Poção de Cura', base_item_id: 'item_cons_03',
    suffix: 'do Prontuário Médico Padrão', min_workshop_level: 1,
    ingredients: [{ item_id: 'mat_eucalyptus_herb', label: 'Erva de Eucalipto', quantity: 2 }],
    base_power: 0, energy_restore: 25, market_value_base: 120,
  },
  {
    id: 'rec_al_02', recipe_id: 'rec_al_02', name: 'Elixir de Vigor Operacional', branch: 'Alquimia',
    slot: 'Consumível', prefix: 'Revigorante', base_item: 'Elixir de Vigor', base_item_id: 'item_cons_05',
    suffix: 'do Adicional de Produtividade', min_workshop_level: 2,
    ingredients: [
      { item_id: 'mat_eucalyptus_herb', label: 'Erva de Eucalipto', quantity: 3 },
      { item_id: 'mat_mana_crystal', label: 'Cristal de Mana', quantity: 1 },
    ],
    base_power: 0, energy_restore: 50, market_value_base: 320, charges: 4,
  },
  {
    id: 'rec_02', recipe_id: 'rec_02', name: 'Amuleto de Guarda-Alma', branch: 'Joalheria',
    slot: 'Joia', prefix: 'Encantado', base_item: 'Amuleto de Guarda-Alma', base_item_id: 'item_jwl_03',
    suffix: 'do Adicional de Insalubridade', min_workshop_level: 1,
    ingredients: [{ item_id: 'mat_mana_crystal', label: 'Cristal de Mana', quantity: 2 }],
    base_power: 15, market_value_base: 180,
  },
  {
    id: 'rec_jw_02', recipe_id: 'rec_jw_02', name: 'Sinete de Chancela Imperial', branch: 'Joalheria',
    slot: 'Joia', prefix: 'Régio', base_item: 'Sinete de Chancela', base_item_id: 'item_jwl_04',
    suffix: 'da Autorização Notarial', min_workshop_level: 2,
    ingredients: [
      { item_id: 'mat_mana_crystal', label: 'Cristal de Mana', quantity: 3 },
      { item_id: 'mat_iron_ore', label: 'Minério de Ferro', quantity: 1 },
    ],
    base_power: 32, market_value_base: 400,
  },
  {
    id: 'rec_05', recipe_id: 'rec_05', name: 'Ração de Batalha Gourmet', branch: 'Culinária',
    slot: 'Consumível', prefix: 'Nutritiva', base_item: 'Ração de Batalha', base_item_id: 'item_cons_04',
    suffix: 'da Produtividade Sem Pausa', min_workshop_level: 1,
    ingredients: [{ item_id: 'mat_flour', label: 'Farinha de Trigo', quantity: 3 }],
    base_power: 5, energy_restore: 35, market_value_base: 140,
  },
  {
    id: 'rec_ck_02', recipe_id: 'rec_ck_02', name: 'Banquete de Prestação de Contas', branch: 'Culinária',
    slot: 'Consumível', prefix: 'Farto', base_item: 'Banquete de Prestação de Contas', base_item_id: 'item_cons_06',
    suffix: 'da Auditoria Sem Ressalvas', min_workshop_level: 2,
    ingredients: [
      { item_id: 'mat_flour', label: 'Farinha de Trigo', quantity: 4 },
      { item_id: 'mat_wild_honey', label: 'Mel Silvestre', quantity: 2 },
    ],
    base_power: 12, energy_restore: 65, market_value_base: 350, charges: 5,
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
  contractor_confidence: 75,
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
  workshop_xp: {
    Ferragem: 45,
    Alquimia: 20,
    Joalheria: 0,
    Culinária: 10,
  },
  materials: {
    mat_iron_ore: 18,
    mat_scaly_leather: 10,
    mat_mana_crystal: 8,
    mat_eucalyptus_herb: 10,
    mat_flour: 12,
    mat_wild_honey: 6,
    mat_ember_coal: 6,
    mat_granite_dust: 6,
  },
  brand_xp: {
    corp_aethelgard: 25,
    corp_swamp_alchemy: 0,
    corp_valkyria: 10,
    corp_iron_coalition: 0,
    corp_chancellor: 0,
  },
  b2b_slots_locked: 0,
  inventory: [
    {
      item_instance_id: 'starter_white_label_offensive',
      name: 'Lote Bélico Genérico (White-label)',
      quality: 'Fraco',
      slot_type: 'Arsenal Ofensivo',
      power_bonus: 10,
      energy_bonus: 0,
      market_value_base: 60,
      branch: 'Ferragem',
      description: 'Equipamento padronizado de baixo custo fornecido por terceirizados sem chancela de marca.',
    },
    {
      item_instance_id: 'starter_white_label_defensive',
      name: 'Blindagem Básica Não-Certificada (White-label)',
      quality: 'Fraco',
      slot_type: 'Blindagem Operacional',
      power_bonus: 8,
      energy_bonus: 0,
      market_value_base: 60,
      branch: 'Ferragem',
      description: 'Placas de ferro doce para proteção de contingência operacional.',
    },
    {
      item_instance_id: 'starter_white_label_performance',
      name: 'Amuleto de Eficiência Mínima (White-label)',
      quality: 'Fraco',
      slot_type: 'Ativo de Performance',
      power_bonus: 6,
      energy_bonus: 5,
      market_value_base: 70,
      branch: 'Joalheria',
      description: 'Dispositivo de incentivo arcano rudimentar para cumprimento de metas.',
    },
    {
      item_instance_id: 'starter_white_label_license',
      name: 'Alvará Provisório de Expedição (White-label)',
      quality: 'Fraco',
      slot_type: 'Alvará de Risco',
      power_bonus: 5,
      energy_bonus: 0,
      terrain_mitigation: null,
      market_value_base: 50,
      branch: 'Alquimia',
      description: 'Autorização de trânsito em papel timbrado simples para evitar multas de inspeção.',
    },
    {
      item_instance_id: 'starter_white_label_provision',
      name: 'Ração Logística de Emergência (White-label)',
      quality: 'Fraco',
      slot_type: 'Provisão Logística',
      power_bonus: 5,
      energy_bonus: 10,
      charges: 2,
      max_charges: 2,
      market_value_base: 40,
      branch: 'Culinária',
      description: 'Provisões secas hipercalóricas com sabor neutro e prazo de validade estendido.',
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
      'Arsenal Ofensivo': 'starter_white_label_offensive',
      'Blindagem Operacional': 'starter_white_label_defensive',
      'Ativo de Performance': 'starter_white_label_performance',
      'Alvará de Risco': 'starter_white_label_license',
      'Provisão Logística': 'starter_white_label_provision',
    },
  },
  market: {
    materials_for_sale: [
      { material_id: 'mat_iron_ore', name: 'Minério de Ferro', unit_price: 20, available_quantity: 8 },
      { material_id: 'mat_soapstone', name: 'Pedra-Sabão', unit_price: 22, available_quantity: 6 },
      { material_id: 'mat_ember_coal', name: 'Brasa de Carvão', unit_price: 30, available_quantity: 5 },
      { material_id: 'mat_granite_dust', name: 'Pó de Granito', unit_price: 28, available_quantity: 5 },
      { material_id: 'mat_mithril_ingot', name: 'Lingote de Mithril', unit_price: 120, available_quantity: 3 },
      { material_id: 'mat_black_steel', name: 'Aço Negro', unit_price: 110, available_quantity: 3 },
      { material_id: 'mat_adamantite_ore', name: 'Minério de Adamante', unit_price: 280, available_quantity: 2 },
      { material_id: 'mat_runic_gold', name: 'Ouro Rúnico', unit_price: 550, available_quantity: 1 },
      { material_id: 'mat_common_ash', name: 'Freixo Comum', unit_price: 18, available_quantity: 7 },
      { material_id: 'mat_ancient_wood', name: 'Madeira Antiga', unit_price: 95, available_quantity: 4 },
      { material_id: 'mat_glowing_moss', name: 'Musgo Brilhante', unit_price: 24, available_quantity: 6 },
      { material_id: 'mat_eucalyptus_herb', name: 'Erva de Eucalipto', unit_price: 25, available_quantity: 5 },
      { material_id: 'mat_mandrake_root', name: 'Raiz de Mandrágora', unit_price: 85, available_quantity: 3 },
      { material_id: 'mat_moonlight_herb', name: 'Erva do Luar', unit_price: 240, available_quantity: 2 },
      { material_id: 'mat_tanned_leather', name: 'Couro Curtido', unit_price: 26, available_quantity: 6 },
      { material_id: 'mat_scaly_leather', name: 'Couro Escamoso', unit_price: 35, available_quantity: 4 },
      { material_id: 'mat_basilisk_scale', name: 'Escama de Basilisco', unit_price: 105, available_quantity: 3 },
      { material_id: 'mat_griffin_claw', name: 'Garra de Grifo', unit_price: 115, available_quantity: 3 },
      { material_id: 'mat_chimera_horn', name: 'Chifre de Quimera', unit_price: 260, available_quantity: 2 },
      { material_id: 'mat_ancient_dragon_scale', name: 'Escama de Dragão Ancestral', unit_price: 600, available_quantity: 1 },
      { material_id: 'mat_lapis_powder', name: 'Pó de Lápis-Lazúli', unit_price: 32, available_quantity: 5 },
      { material_id: 'mat_mana_crystal', name: 'Cristal de Mana', unit_price: 55, available_quantity: 4 },
      { material_id: 'mat_pure_ectoplasm', name: 'Ectoplasma Puro', unit_price: 130, available_quantity: 3 },
      { material_id: 'mat_liquid_mana_crystal', name: 'Cristal de Mana Líquida', unit_price: 310, available_quantity: 2 },
      { material_id: 'mat_fire_golem_core', name: 'Núcleo de Golem de Fogo', unit_price: 350, available_quantity: 2 },
      { material_id: 'mat_soul_stone', name: 'Pedra da Alma', unit_price: 650, available_quantity: 1 },
      { material_id: 'mat_flour', name: 'Farinha de Trigo', unit_price: 15, available_quantity: 8 },
      { material_id: 'mat_wild_honey', name: 'Mel Silvestre', unit_price: 22, available_quantity: 6 },
    ],
    ready_items_for_sale: [
      { market_item_id: 'mkt_01', name: 'Espada de Cavalaria', slot_type: 'Arsenal Ofensivo', quality: 'Normal', power_bonus: 18, price: 220 },
      { market_item_id: 'mkt_02', name: 'Gibão de Couro Endurecido', slot_type: 'Blindagem Operacional', quality: 'Ótimo', power_bonus: 24, price: 360 },
      { market_item_id: 'mkt_03', name: 'Anel de Prata Encantado', slot_type: 'Ativo de Performance', quality: 'Normal', power_bonus: 10, price: 180 },
      { market_item_id: 'mkt_04', name: 'Ração Militar Fortificada', slot_type: 'Provisão Logística', quality: 'Normal', power_bonus: 5, energy_bonus: 25, price: 95 },
    ],
    bulletin: {
      target: 'Blindagem Operacional',
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
  },
  warehouse_parts: {
    part_aethelgard_blade: 4,
    part_aethelgard_hilt: 3,
    part_valkyria_guard: 2,
    part_valkyria_plate: 1,
    part_flamel_catalyst: 2,
    part_gob_blade_01: 3,
    part_elf_gem_01: 2,
    part_dwarf_plating_01: 2,
  },
  active_b2b_contracts: [
    {
      contract_id: 'b2b_aethelgard_bronze',
      corp_id: 'corp_aethelgard',
      tier: 'Bronze',
      title: 'Convênio Fornecimento Aethelgard - Padrão Bronze',
      weekly_royalty: 50,
      is_exclusive: false,
      discount_pct: 0.10,
      weekly_shipment: [
        { part_id: 'part_aethelgard_blade', quantity: 1 },
        { part_id: 'part_aethelgard_hilt', quantity: 1 }
      ],
      description: 'Fornecimento regular de lâminas e empunhaduras para sustentação da linha de montagem básica.'
    }
  ],
  assembly_line_workers: [
    {
      worker_instance_id: 'inst_worker_1',
      worker_id: 'worker_fitter_junior',
      name: 'Ajustador de Bancada Júnior',
      tier: 1,
      weekly_salary: 40,
      production_capacity: 1,
      assigned_branch: 'Ferragem',
      supported_branches: ['Ferragem', 'Alquimia', 'Joalheria', 'Culinária'],
      allowed_recipes: ['rec_01', 'rec_03', 'rec_04', 'rec_05'],
      target_recipe: 'rec_01'
    }
  ],
  corporate_exclusivity_tags: [],
  financials: {
    revenue: 250,
    sales_revenue: 120,
    assembly_sales_revenue: 0,
    salaries: 340,
    base_maintenance: 50,
    medical_maintenance: 20,
    academy_maintenance: 40,
    maintenance: 110,
    b2b_royalties_cost: 50,
    assembly_workers_salaries: 40,
    season_award: 0,
    crown_subsidy: 0,
    crown_penalty: 0,
    net: -170,
  },
  weekly_sales_revenue: 120,
  last_expedition_loot: [
    { part_id: 'part_gob_blade_01', name: 'Lâmina Dentada de Fricção Rápida', quantity: 2, rarity: 'Comum', slot_role: 'base', power_bonus: 8 },
    { part_id: 'part_valk_guard_01', name: 'Guarda Articulada de Choque', quantity: 1, rarity: 'Raro', slot_role: 'prefix', power_bonus: 10 },
    { part_id: 'part_elf_core_01', name: 'Núcleo de Safira Pura', quantity: 1, rarity: 'Lendário', slot_role: 'suffix', power_bonus: 16 },
  ],
}

// ─── Catálogos Oficiais B2B & Montagem Modular ──────────────────────────────

export const MOCK_CORPORATIONS: Corporation[] = [
  {
    id: 'corp_goblin_eng',
    name: 'Engenharia Goblin S.A.',
    branch: 'Ferragem',
    specialty: 'Peças de corte agressivo, módulos de detonação e propulsores a vapor.',
    exclusivity_tag: 'excl_goblin_eng',
    rival_corp_id: 'corp_elf_precision',
    description: 'Se não explodir na montagem, corta qualquer armadura. Foco em impacto maciço e risco mecânico.',
  },
  {
    id: 'corp_elf_precision',
    name: 'Consórcio Élfico de Alta Precisão',
    branch: 'Joalheria',
    specialty: 'Joias arcanas de fluxo estrito e componentes de lapidação micrométrica.',
    exclusivity_tag: 'excl_elf_precision',
    rival_corp_id: 'corp_goblin_eng',
    description: 'Perfeição micrométrica homologada em pergaminho velino. Foco em agilidade e valor comercial.',
  },
  {
    id: 'corp_dwarf_steel',
    name: 'Irmãos Anões de Aço Negro & Cia.',
    branch: 'Ferragem',
    specialty: 'Blindagens pesadas, chapas maciças de ferro fundido e escudos balísticos.',
    exclusivity_tag: 'excl_dwarf_steel',
    rival_corp_id: 'corp_swamp_alchemy',
    description: 'Fundido no fundo do abismo, forjado para a eternidade fiscal. Foco em blindagem e robustez defensiva.',
  },
  {
    id: 'corp_swamp_alchemy',
    name: 'Sindicato dos Alquimistas de Pântano',
    branch: 'Alquimia',
    specialty: 'Filtros respiratórios contra miasmas, concentrados e dosadores farmacológicos.',
    exclusivity_tag: 'excl_swamp_alchemy',
    rival_corp_id: 'corp_dwarf_steel',
    description: 'O miasma de hoje é o lucro líquido de amanhã. Foco em mitigação de veneno e cargas operacionais.',
  },
  {
    id: 'corp_crown_notarial',
    name: 'Manufatura Notarial da Coroa',
    branch: 'Ferragem',
    specialty: 'Peças genéricas de linha branca (white-label), alvarás gravados e armações universais.',
    exclusivity_tag: 'excl_crown_notarial',
    rival_corp_id: null,
    description: 'Padronização régia, carimbos invioláveis e estabilidade tributária. Compatível com todas as arquiteturas.',
  },
  {
    id: 'corp_aethelgard',
    name: 'Siderúrgica Aethelgard & Cia.',
    branch: 'Ferragem',
    specialty: 'Lâminas temperadas, chapas prensadas e engrenagens de alto impacto.',
    exclusivity_tag: 'excl_aethelgard',
    rival_corp_id: 'corp_valkyria',
    description: 'Conglomerado hegemônico da metalurgia nortenha com processos fabris certificados pelo Tribunal da Coroa.',
  },
  {
    id: 'corp_valkyria',
    name: 'Consórcio Bélico Valkyria',
    branch: 'Ferragem',
    specialty: 'Ligas estriadas, guardas articuladas e exoesqueletos de proteção.',
    exclusivity_tag: 'excl_valkyria',
    rival_corp_id: 'corp_aethelgard',
    description: 'Indústria armamentista de vanguarda que disputa licitações de suprimentos com a Siderúrgica Aethelgard.',
  },
  {
    id: 'corp_flamel',
    name: 'Sindicato Bioalquímico Flamel & Associados',
    branch: 'Alquimia',
    specialty: 'Extratos catalisadores, ampolas de vidro reforçado e reativos de regeneração.',
    exclusivity_tag: 'excl_flamel',
    rival_corp_id: 'corp_mercurius',
    description: 'Monopólio farmacêutico com patentes herméticas sobre destilados e solventes de mana.',
  },
  {
    id: 'corp_chancellor',
    name: 'Lapidação Imperial Chanceler & Filhos',
    branch: 'Joalheria',
    specialty: 'Amuletos com facetamento óptico, engastes de platina e núcleos prismáticos.',
    exclusivity_tag: 'excl_chancellor',
    rival_corp_id: null,
    description: 'Fornecedora tradicional da alta nobreza e de órgãos reguladores da Liga.',
  },
]

export const MOCK_B2B_CONTRACTS: B2BContract[] = [
  {
    "contract_id": "b2b_aethelgard_bronze",
    "corp_id": "corp_aethelgard",
    "tier": "Bronze",
    "title": "Convênio Fornecimento Aethelgard - Padrão Bronze",
    "weekly_royalty": 50,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_aethelgard_hilt",
        "quantity": 1
      },
      {
        "part_id": "part_aethelgard_blade",
        "quantity": 1
      },
      {
        "part_id": "part_aethelgard_core",
        "quantity": 1
      }
    ],
    "description": "Fornecimento regular de lâminas e empunhaduras para sustentação da linha de montagem básica.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_aethelgard_silver",
    "corp_id": "corp_aethelgard",
    "tier": "Prata",
    "title": "Homologação Metalúrgica Aethelgard - Nível Prata",
    "weekly_royalty": 115,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_aethelgard_hilt",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_blade",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_core",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_hilt_t2",
        "quantity": 1
      },
      {
        "part_id": "part_aethelgard_blade_t2",
        "quantity": 1
      },
      {
        "part_id": "part_aethelgard_core_t2",
        "quantity": 1
      }
    ],
    "description": "Fornecimento regular de chapas temperadas e empunhaduras reforçadas para forja intermediária.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_aethelgard_gold",
    "corp_id": "corp_aethelgard",
    "tier": "Ouro",
    "title": "Aliança Estratégica Aethelgard - Parceiro Ouro",
    "weekly_royalty": 180,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_aethelgard_hilt",
        "quantity": 3
      },
      {
        "part_id": "part_aethelgard_blade",
        "quantity": 3
      },
      {
        "part_id": "part_aethelgard_core",
        "quantity": 3
      },
      {
        "part_id": "part_aethelgard_hilt_t2",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_blade_t2",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_core_t2",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_hilt_t3",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_blade_t3",
        "quantity": 2
      },
      {
        "part_id": "part_aethelgard_core_t3",
        "quantity": 2
      }
    ],
    "description": "Contrato exclusivo de exclusividade territorial. Proíbe parcerias B2B com o Consórcio Bélico Valkyria sob pena de rescisão sumária.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_chancellor_bronze",
    "corp_id": "corp_chancellor",
    "tier": "Bronze",
    "title": "Lapidação Notarial Chanceler - Padrão Bronze",
    "weekly_royalty": 65,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_chancellor_pin",
        "quantity": 1
      },
      {
        "part_id": "part_chancellor_gem_t1",
        "quantity": 1
      },
      {
        "part_id": "part_chancellor_core",
        "quantity": 1
      }
    ],
    "description": "Remessa padrão de ágatas lapidadas e broches de fixação da Casa Chanceler.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_chancellor_silver",
    "corp_id": "corp_chancellor",
    "tier": "Prata",
    "title": "Fornecimento de Gemas Chanceler - Nível Prata",
    "weekly_royalty": 120,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_chancellor_pin",
        "quantity": 3
      },
      {
        "part_id": "part_chancellor_gem_t1",
        "quantity": 2
      },
      {
        "part_id": "part_chancellor_core",
        "quantity": 3
      },
      {
        "part_id": "part_chancellor_frame",
        "quantity": 1
      }
    ],
    "description": "Remessa de núcleos de safira polida para confecção seriada de amuletos corporativos.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_chancellor_gold",
    "corp_id": "corp_chancellor",
    "tier": "Ouro",
    "title": "Chancela Imperial de Platina - Parceiro Ouro",
    "weekly_royalty": 225,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_chancellor_pin",
        "quantity": 5
      },
      {
        "part_id": "part_chancellor_gem_t1",
        "quantity": 3
      },
      {
        "part_id": "part_chancellor_core",
        "quantity": 5
      },
      {
        "part_id": "part_chancellor_frame",
        "quantity": 2
      },
      {
        "part_id": "part_chancellor_frame_t3",
        "quantity": 2
      },
      {
        "part_id": "part_chancellor_gem_t3",
        "quantity": 2
      },
      {
        "part_id": "part_chancellor_core_t3",
        "quantity": 2
      }
    ],
    "description": "Exclusividade de alta nobreza. Lote duplo semanal de diamantes imperiais e prismas solares.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_crown_bronze",
    "corp_id": "corp_crown_notarial",
    "tier": "Bronze",
    "title": "Padronização Régia - Padrão Bronze",
    "weekly_royalty": 50,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_crown_hilt_01",
        "quantity": 1
      },
      {
        "part_id": "part_crown_seal_t1",
        "quantity": 1
      },
      {
        "part_id": "part_crown_gem_01",
        "quantity": 1
      }
    ],
    "description": "Linha branca de couro escamado e ágatas notariais universais da Fazenda Real.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_crown_silver",
    "corp_id": "corp_crown_notarial",
    "tier": "Prata",
    "title": "Certificação Notarial - Nível Prata",
    "weekly_royalty": 110,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_crown_hilt_01",
        "quantity": 1
      },
      {
        "part_id": "part_crown_seal_t1",
        "quantity": 1
      },
      {
        "part_id": "part_crown_gem_01",
        "quantity": 1
      },
      {
        "part_id": "part_crown_hilt_02",
        "quantity": 1
      },
      {
        "part_id": "part_crown_parchment_t2",
        "quantity": 1
      },
      {
        "part_id": "part_crown_gem_02",
        "quantity": 1
      }
    ],
    "description": "Braçadeiras chanceladas por laudo e selos rúnicos de alvará de funcionamento.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_crown_gold",
    "corp_id": "corp_crown_notarial",
    "tier": "Ouro",
    "title": "Chancela Régia Imperial - Parceiro Ouro",
    "weekly_royalty": 185,
    "is_exclusive": false,
    "discount_pct": 0.2,
    "weekly_shipment": [
      {
        "part_id": "part_crown_hilt_01",
        "quantity": 1
      },
      {
        "part_id": "part_crown_seal_t1",
        "quantity": 1
      },
      {
        "part_id": "part_crown_gem_01",
        "quantity": 1
      },
      {
        "part_id": "part_crown_hilt_02",
        "quantity": 1
      },
      {
        "part_id": "part_crown_parchment_t2",
        "quantity": 1
      },
      {
        "part_id": "part_crown_gem_02",
        "quantity": 1
      },
      {
        "part_id": "part_crown_blade_t3",
        "quantity": 2
      },
      {
        "part_id": "part_crown_seal_t3",
        "quantity": 2
      },
      {
        "part_id": "part_crown_gem_t3",
        "quantity": 2
      }
    ],
    "description": "Convênio nobre da Coroa. Totalmente compatível com todas as corporações do continente.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_dwarf_bronze",
    "corp_id": "corp_dwarf_steel",
    "tier": "Bronze",
    "title": "Fundição de Cidadela - Padrão Bronze",
    "weekly_royalty": 65,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_dwarf_prefix_01",
        "quantity": 1
      },
      {
        "part_id": "part_dwarf_plating_01",
        "quantity": 1
      },
      {
        "part_id": "part_dwarf_core_01",
        "quantity": 1
      }
    ],
    "description": "Placas reforçadas e âncoras gravitacionais forjadas no abismo anão.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_dwarf_silver",
    "corp_id": "corp_dwarf_steel",
    "tier": "Prata",
    "title": "Couraça de Rocha Negra - Nível Prata",
    "weekly_royalty": 125,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_dwarf_prefix_01",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_plating_01",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_core_01",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_plating_06",
        "quantity": 1
      },
      {
        "part_id": "part_dwarf_plating_03",
        "quantity": 1
      },
      {
        "part_id": "part_dwarf_core_02",
        "quantity": 1
      }
    ],
    "description": "Blindagens maciças de minério negro e reforços torácicos com apólice integrada.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_dwarf_gold",
    "corp_id": "corp_dwarf_steel",
    "tier": "Ouro",
    "title": "Pacto Subterrâneo Ouro de Aço Negro - Parceiro Ouro",
    "weekly_royalty": 210,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_dwarf_prefix_01",
        "quantity": 3
      },
      {
        "part_id": "part_dwarf_plating_01",
        "quantity": 3
      },
      {
        "part_id": "part_dwarf_core_01",
        "quantity": 3
      },
      {
        "part_id": "part_dwarf_plating_06",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_plating_03",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_core_02",
        "quantity": 4
      },
      {
        "part_id": "part_dwarf_plating_05",
        "quantity": 2
      },
      {
        "part_id": "part_dwarf_plating_04",
        "quantity": 2
      }
    ],
    "description": "Exclusividade de metalurgia pesada da Cidadela. Veda contratos com o Sindicato de Pântano.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_elf_bronze",
    "corp_id": "corp_elf_precision",
    "tier": "Bronze",
    "title": "Convênio Lapidação Básica - Padrão Bronze",
    "weekly_royalty": 70,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_elf_filter_01",
        "quantity": 1
      },
      {
        "part_id": "part_elf_gem_01",
        "quantity": 1
      },
      {
        "part_id": "part_elf_core_00",
        "quantity": 1
      }
    ],
    "description": "Remessa regular de gemas focalizadoras e refinadores gustativos élficos.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_elf_silver",
    "corp_id": "corp_elf_precision",
    "tier": "Prata",
    "title": "Fornecimento de Alta Frequência - Nível Prata",
    "weekly_royalty": 130,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_elf_filter_01",
        "quantity": 3
      },
      {
        "part_id": "part_elf_gem_01",
        "quantity": 2
      },
      {
        "part_id": "part_elf_core_00",
        "quantity": 2
      },
      {
        "part_id": "part_elf_blade_01",
        "quantity": 1
      },
      {
        "part_id": "part_elf_gem_03",
        "quantity": 1
      }
    ],
    "description": "Lote de safiras penitenciais e lâminas temperadas a frio élfico.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_elf_gold",
    "corp_id": "corp_elf_precision",
    "tier": "Ouro",
    "title": "Aliança Estratégica Élfica de Platina - Parceiro Ouro",
    "weekly_royalty": 220,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_elf_filter_01",
        "quantity": 7
      },
      {
        "part_id": "part_elf_gem_01",
        "quantity": 3
      },
      {
        "part_id": "part_elf_core_00",
        "quantity": 3
      },
      {
        "part_id": "part_elf_blade_01",
        "quantity": 4
      },
      {
        "part_id": "part_elf_gem_03",
        "quantity": 2
      },
      {
        "part_id": "part_elf_core_01",
        "quantity": 2
      }
    ],
    "description": "Exclusividade de alto escalão com o Consórcio Élfico. Embarga convênios com Engenharia Goblin S.A.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_flamel_bronze",
    "corp_id": "corp_flamel",
    "tier": "Bronze",
    "title": "Destilados Básicos Flamel - Padrão Bronze",
    "weekly_royalty": 55,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_flamel_nozzle",
        "quantity": 1
      },
      {
        "part_id": "part_flamel_vial",
        "quantity": 1
      },
      {
        "part_id": "part_flamel_catalyst",
        "quantity": 1
      }
    ],
    "description": "Remessa inicial de ampolas e bocais dosadores para solventes simples.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_flamel_standard",
    "corp_id": "corp_flamel",
    "tier": "Prata",
    "title": "Homologação de Destilados Flamel - Nível Prata",
    "weekly_royalty": 80,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_flamel_nozzle",
        "quantity": 3
      },
      {
        "part_id": "part_flamel_vial",
        "quantity": 3
      },
      {
        "part_id": "part_flamel_catalyst",
        "quantity": 3
      }
    ],
    "description": "Abastecimento semanal de frascos graduados e catalisadores certificados pela Guilda de Boticários.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_flamel_gold",
    "corp_id": "corp_flamel",
    "tier": "Ouro",
    "title": "Pacto de Alta Transmutação Flamel - Parceiro Ouro",
    "weekly_royalty": 215,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_flamel_nozzle",
        "quantity": 5
      },
      {
        "part_id": "part_flamel_vial",
        "quantity": 5
      },
      {
        "part_id": "part_flamel_catalyst",
        "quantity": 5
      },
      {
        "part_id": "part_flamel_vial_t3",
        "quantity": 2
      },
      {
        "part_id": "part_flamel_reagent_t3",
        "quantity": 2
      },
      {
        "part_id": "part_flamel_core_t3",
        "quantity": 2
      }
    ],
    "description": "Exclusividade bioalquímica imperial. Fornece ampolas dragônicas e reativos filosofais.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_goblin_bronze",
    "corp_id": "corp_goblin_eng",
    "tier": "Bronze",
    "title": "Fornecimento Rápido Goblin - Padrão Bronze",
    "weekly_royalty": 60,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_gob_hilt_01",
        "quantity": 1
      },
      {
        "part_id": "part_gob_blade_01",
        "quantity": 1
      },
      {
        "part_id": "part_gob_core_00",
        "quantity": 1
      }
    ],
    "description": "Remessa semanal de lâminas dentadas e empunhaduras de fricção rápida.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_goblin_silver",
    "corp_id": "corp_goblin_eng",
    "tier": "Prata",
    "title": "Homologação de Impacto Goblin - Nível Prata",
    "weekly_royalty": 120,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_gob_hilt_01",
        "quantity": 3
      },
      {
        "part_id": "part_gob_blade_01",
        "quantity": 2
      },
      {
        "part_id": "part_gob_core_00",
        "quantity": 2
      },
      {
        "part_id": "part_gob_blade_02",
        "quantity": 1
      },
      {
        "part_id": "part_gob_core_02",
        "quantity": 1
      }
    ],
    "description": "Cota regular de lâminas predatórias e disjuntores de sobrecarga calculada.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_goblin_gold",
    "corp_id": "corp_goblin_eng",
    "tier": "Ouro",
    "title": "Pacto Bélico de Alta Detonação - Parceiro Ouro",
    "weekly_royalty": 200,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_gob_hilt_01",
        "quantity": 7
      },
      {
        "part_id": "part_gob_blade_01",
        "quantity": 3
      },
      {
        "part_id": "part_gob_core_00",
        "quantity": 3
      },
      {
        "part_id": "part_gob_blade_02",
        "quantity": 2
      },
      {
        "part_id": "part_gob_core_02",
        "quantity": 2
      },
      {
        "part_id": "part_gob_blade_03",
        "quantity": 2
      },
      {
        "part_id": "part_gob_core_01",
        "quantity": 2
      }
    ],
    "description": "Exclusividade contratual com Engenharia Goblin S.A. Proíbe relações com o Consórcio Élfico.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_swamp_bronze",
    "corp_id": "corp_swamp_alchemy",
    "tier": "Bronze",
    "title": "Destilados do Charco - Padrão Bronze",
    "weekly_royalty": 55,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_swamp_prefix_01",
        "quantity": 1
      },
      {
        "part_id": "part_swamp_filter_01",
        "quantity": 1
      },
      {
        "part_id": "part_swamp_core_01",
        "quantity": 1
      }
    ],
    "description": "Filtros decantadores e filtros neutralizadores de miasmas virulentos.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_swamp_silver",
    "corp_id": "corp_swamp_alchemy",
    "tier": "Prata",
    "title": "Farmacologia de Miasma - Nível Prata",
    "weekly_royalty": 115,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_swamp_prefix_01",
        "quantity": 2
      },
      {
        "part_id": "part_swamp_filter_01",
        "quantity": 3
      },
      {
        "part_id": "part_swamp_core_01",
        "quantity": 2
      },
      {
        "part_id": "part_swamp_filter_03",
        "quantity": 1
      },
      {
        "part_id": "part_swamp_core_02",
        "quantity": 1
      }
    ],
    "description": "Dosadores graduados e injetores químicos certificados pelos boticários de pântano.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_swamp_gold",
    "corp_id": "corp_swamp_alchemy",
    "tier": "Ouro",
    "title": "Concessão Hermética de Pântano - Parceiro Ouro",
    "weekly_royalty": 195,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_swamp_prefix_01",
        "quantity": 3
      },
      {
        "part_id": "part_swamp_filter_01",
        "quantity": 7
      },
      {
        "part_id": "part_swamp_core_01",
        "quantity": 3
      },
      {
        "part_id": "part_swamp_filter_03",
        "quantity": 4
      },
      {
        "part_id": "part_swamp_core_02",
        "quantity": 4
      }
    ],
    "description": "Exclusividade sobre reativos de pântano. Incompatível com acordos dos Irmãos Anões de Aço Negro.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  },
  {
    "contract_id": "b2b_valkyria_bronze",
    "corp_id": "corp_valkyria",
    "tier": "Bronze",
    "title": "Fornecimento Balístico Valkyria - Padrão Bronze",
    "weekly_royalty": 60,
    "is_exclusive": false,
    "discount_pct": 0.1,
    "weekly_shipment": [
      {
        "part_id": "part_valkyria_guard",
        "quantity": 1
      },
      {
        "part_id": "part_valkyria_blade_t1",
        "quantity": 1
      },
      {
        "part_id": "part_valkyria_core_t1",
        "quantity": 1
      }
    ],
    "description": "Lote de entrada com lâminas estriadas e rebites balísticos do consórcio.",
    "requirements": {
      "min_confidence": 0,
      "min_workshop_level": 1,
      "requires_previous_tier": null,
      "description": "Homologação livre para guildas com alvará da Coroa."
    }
  },
  {
    "contract_id": "b2b_valkyria_silver",
    "corp_id": "corp_valkyria",
    "tier": "Prata",
    "title": "Blindagem Avançada Valkyria - Nível Prata",
    "weekly_royalty": 125,
    "is_exclusive": false,
    "discount_pct": 0.15,
    "weekly_shipment": [
      {
        "part_id": "part_valkyria_guard",
        "quantity": 2
      },
      {
        "part_id": "part_valkyria_blade_t1",
        "quantity": 1
      },
      {
        "part_id": "part_valkyria_core_t1",
        "quantity": 1
      },
      {
        "part_id": "part_valkyria_plate",
        "quantity": 1
      },
      {
        "part_id": "part_valkyria_core",
        "quantity": 1
      }
    ],
    "description": "Cota semanal de placas estriadas e chassis de combate homologados.",
    "requirements": {
      "min_confidence": 60,
      "min_workshop_level": 2,
      "requires_previous_tier": "Bronze",
      "description": "Requer Confiança da Contratante ≥ 60, Filial Nível 2+ e Convênio Bronze ativo."
    }
  },
  {
    "contract_id": "b2b_valkyria_gold",
    "corp_id": "corp_valkyria",
    "tier": "Ouro",
    "title": "Consórcio Bélico Valkyria - Parceiro Ouro",
    "weekly_royalty": 190,
    "is_exclusive": true,
    "discount_pct": 0.25,
    "weekly_shipment": [
      {
        "part_id": "part_valkyria_guard",
        "quantity": 6
      },
      {
        "part_id": "part_valkyria_blade_t1",
        "quantity": 2
      },
      {
        "part_id": "part_valkyria_core_t1",
        "quantity": 2
      },
      {
        "part_id": "part_valkyria_plate",
        "quantity": 4
      },
      {
        "part_id": "part_valkyria_core",
        "quantity": 4
      }
    ],
    "description": "Exclusividade contratual com a vanguarda fabril Valkyria. Incompatível com acordos da Siderúrgica Aethelgard.",
    "requirements": {
      "min_confidence": 75,
      "min_workshop_level": 3,
      "requires_previous_tier": "Prata",
      "description": "Requer Confiança da Contratante ≥ 75, Filial Nível 3+ e Convênio Prata ativo."
    }
  }
]

export const MOCK_ASSEMBLY_WORKERS: AssemblyWorker[] = [
  {
    worker_id: 'worker_fitter_junior',
    name: 'Ajustador de Bancada Júnior',
    tier: 1,
    hiring_cost: 150,
    weekly_salary: 40,
    production_capacity: 1,
    supported_branches: ['Ferragem', 'Alquimia', 'Joalheria', 'Culinária'],
    allowed_recipes: ['rec_01', 'rec_03', 'rec_04', 'rec_05'],
    description: 'Montador treinado em processos repetitivos. Converte peças de almoxarifado em artefatos padronizados para revenda.'
  },
  {
    worker_id: 'worker_assembler_senior',
    name: 'Operador Sênior de Linha Contínua',
    tier: 2,
    hiring_cost: 300,
    weekly_salary: 75,
    production_capacity: 2,
    supported_branches: ['Ferragem', 'Alquimia', 'Joalheria', 'Culinária'],
    allowed_recipes: ['rec_01', 'rec_02', 'rec_03', 'rec_04', 'rec_05', 'rec_06'],
    description: 'Especialista em cadência industrial capaz de coordenar montagens duplas sem interrupção de fluxo fabril.'
  }
]

const STATIC_MOCK_MODULAR_PARTS: ModularPart[] = [
  {
    "id": "part_aethelgard_blade",
    "part_id": "part_aethelgard_blade",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Bateria de Canhões Aethelgard",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "base_cost": 50,
    "market_price_base": 50,
    "power_bonus": 25,
    "power_contrib": 25,
    "catalog_description": "Bateria de canhões móveis temperada nas fundições de Aethelgard para apoio à força-tarefa.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 5
      }
    ],
    "slot_role": "base",
    "name_modifier": "Bateria de Canhões Aethelgard"
  },
  {
    "id": "part_aethelgard_hilt",
    "part_id": "part_aethelgard_hilt",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Mancal Estabilizador Aethelgard",
    "branch": "Ferragem",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "base_cost": 40,
    "market_price_base": 40,
    "power_bonus": 10,
    "power_contrib": 10,
    "catalog_description": "Mancal estabilizador com contrapesos para cadência contínua de disparo.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 2
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Equilibrado"
  },
  {
    "id": "part_valkyria_guard",
    "part_id": "part_valkyria_guard",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Guarda de Impacto Valkyria",
    "branch": "Ferragem",
    "part_type": "guard",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 1,
    "base_cost": 60,
    "market_price_base": 60,
    "power_bonus": 15,
    "power_contrib": 15,
    "catalog_description": "Mecanismo defensivo de absorção de impacto do Consórcio Bélico para a linha de frente.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 3
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Articulado"
  },
  {
    "id": "part_valkyria_plate",
    "part_id": "part_valkyria_plate",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Kit de Blindagem Valkyria",
    "branch": "Ferragem",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 2,
    "base_cost": 90,
    "market_price_base": 90,
    "power_bonus": 20,
    "power_contrib": 20,
    "catalog_description": "Blindagem de absorção de choque balístico para proteção coletiva da equipe.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      }
    ],
    "slot_role": "base",
    "name_modifier": "Kit de Blindagem Valkyria"
  },
  {
    "id": "part_flamel_catalyst",
    "part_id": "part_flamel_catalyst",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Catalisador Bioquímico Flamel",
    "branch": "Alquimia",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco",
      "Provisão Logística"
    ],
    "tier": 1,
    "base_cost": 55,
    "market_price_base": 55,
    "power_bonus": 12,
    "power_contrib": 12,
    "catalog_description": "Agente reagente de rápida dispersão para soluções químicas.",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 10
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Alquimia Pura"
  },
  {
    "id": "part_flamel_vial",
    "part_id": "part_flamel_vial",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Ampola Reforçada Flamel",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 1,
    "base_cost": 30,
    "market_price_base": 30,
    "power_bonus": 5,
    "power_contrib": 5,
    "catalog_description": "Recipiente estéril para acondicionamento de elixires de combate.",
    "effects": [
      {
        "effect": "charges_flat",
        "value": 1
      }
    ],
    "slot_role": "base",
    "name_modifier": "Ampola Reforçada Flamel"
  },
  {
    "id": "part_chancellor_core",
    "part_id": "part_chancellor_core",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Núcleo de Safira Imperial",
    "branch": "Joalheria",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 2,
    "base_cost": 110,
    "market_price_base": 110,
    "power_bonus": 18,
    "power_contrib": 18,
    "catalog_description": "Gema lapidada com corte prismático para condução energética sem perda.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 4
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Safira Imperial"
  },
  {
    "id": "part_gob_blade_01",
    "name": "Lâmina Dentada de Fricção Rápida",
    "brand_id": "corp_goblin_eng",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "market_price_base": 75,
    "catalog_description": "Lâmina de ferro cru forjada às pressas com gume serrilhado irregular. Corta rápido e desgasta com facilidade se não for lubrificada.",
    "part_id": "part_gob_blade_01",
    "corp_id": "corp_goblin_eng",
    "base_cost": 75,
    "affix_id_source": "pref_afiada",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.1
      },
      {
        "effect": "value_pct",
        "value": 0.1
      }
    ],
    "slot_role": "base",
    "name_modifier": "Lâmina Dentada de Fricção Rápida"
  },
  {
    "id": "part_gob_blade_02",
    "name": "Lâmina Predatória de Aço Farpado",
    "brand_id": "corp_goblin_eng",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "market_price_base": 180,
    "catalog_description": "Componente bélico dotado de farpas reversas para arrancar blindagem inimiga em combate próximo. Não recomendada para quem preza a integridade dos dedos.",
    "part_id": "part_gob_blade_02",
    "corp_id": "corp_goblin_eng",
    "base_cost": 180,
    "affix_id_source": "pref_predatorio",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.18
      },
      {
        "effect": "value_pct",
        "value": 0.4
      }
    ],
    "slot_role": "base",
    "name_modifier": "Lâmina Predatória de Aço Farpado"
  },
  {
    "id": "part_gob_core_01",
    "name": "Câmara de Detonação Magmática",
    "brand_id": "corp_goblin_eng",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 3,
    "market_price_base": 320,
    "catalog_description": "Módulo cilíndrico contendo resíduos pirotécnicos instáveis. Aquece o artefato e as mãos do operador até o limite da combustão espontânea.",
    "part_id": "part_gob_core_01",
    "corp_id": "corp_goblin_eng",
    "base_cost": 320,
    "affix_id_source": "pref_vulcanico",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.2
      },
      {
        "effect": "power_flat",
        "value": 4
      },
      {
        "effect": "value_pct",
        "value": 0.35
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Patrono"
  },
  {
    "id": "part_gob_filter_01",
    "name": "Compressor de Porções Industriais",
    "brand_id": "corp_goblin_eng",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 2,
    "market_price_base": 150,
    "catalog_description": "Prensa mecânica que compacta o dobro de matéria calórica num cartucho de ração sem se importar com a consistência final.",
    "part_id": "part_gob_filter_01",
    "corp_id": "corp_goblin_eng",
    "base_cost": 150,
    "affix_id_source": "pref_farta",
    "effects": [
      {
        "effect": "charges_flat",
        "value": 1
      },
      {
        "effect": "value_pct",
        "value": 0.3
      }
    ],
    "slot_role": "base",
    "name_modifier": "Compressor de Porções Industriais"
  },
  {
    "id": "part_gob_hilt_01",
    "name": "Empunhadura Sem Guarda de Risco",
    "brand_id": "corp_goblin_eng",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "market_price_base": 160,
    "catalog_description": "Cabo de combate sem anel protetor para corte de custos industriais. O aventureiro assume voluntariamente o risco de esmagamento de nós dos dedos.",
    "part_id": "part_gob_hilt_01",
    "corp_id": "corp_goblin_eng",
    "base_cost": 160,
    "affix_id_source": "suf_acidente_trabalho",
    "effects": [
      {
        "effect": "power_flat",
        "value": 5
      },
      {
        "effect": "value_pct",
        "value": 0.1
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Imprudente"
  },
  {
    "id": "part_gob_core_02",
    "name": "Disjuntor de Sobrecarga Calculada",
    "brand_id": "corp_goblin_eng",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "market_price_base": 210,
    "catalog_description": "Módulo mecânico que libera fluxo cinético desregulado no impacto, confiando que o portador aguentará o tranco da explosão.",
    "part_id": "part_gob_core_02",
    "corp_id": "corp_goblin_eng",
    "base_cost": 210,
    "affix_id_source": "suf_risco_calculado",
    "effects": [
      {
        "effect": "power_flat",
        "value": 4
      },
      {
        "effect": "value_pct",
        "value": 0.2
      },
      {
        "effect": "power_pct",
        "value": 0.12,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Sobrecarga"
  },
  {
    "id": "part_gob_blade_03",
    "name": "Gume Guilhotina de Demissão Sumária",
    "brand_id": "corp_goblin_eng",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "market_price_base": 380,
    "catalog_description": "Peça de impacto massivo projetada para encerrar discussões contratuais em um único golpe. Letalidade corporativa absoluta.",
    "part_id": "part_gob_blade_03",
    "corp_id": "corp_goblin_eng",
    "base_cost": 380,
    "affix_id_source": "suf_rescisao_imediata",
    "effects": [
      {
        "effect": "power_flat",
        "value": 7
      },
      {
        "effect": "power_pct",
        "value": 0.2
      },
      {
        "effect": "value_pct",
        "value": 0.35
      },
      {
        "effect": "power_pct",
        "value": 0.15,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "base",
    "name_modifier": "Gume Guilhotina de Demissão Sumária"
  },
  {
    "id": "part_gob_core_03",
    "name": "Injetor de Adrenalina de Turno Dobrado",
    "brand_id": "corp_goblin_eng",
    "part_type": "core",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 3,
    "market_price_base": 340,
    "catalog_description": "Cápsula química com estimulantes agressivos que impedem o aventureiro de desmaiar durante marchas noturnas prolongadas.",
    "part_id": "part_gob_core_03",
    "corp_id": "corp_goblin_eng",
    "base_cost": 340,
    "affix_id_source": "suf_turno_extraordinario",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 12
      },
      {
        "effect": "charges_flat",
        "value": 1
      },
      {
        "effect": "value_pct",
        "value": 0.25
      },
      {
        "effect": "energy_bonus_flat",
        "value": 15,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Turno Noturno"
  },
  {
    "id": "part_elf_blade_01",
    "name": "Lâmina Temperada a Frio Élfico",
    "brand_id": "corp_elf_precision",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "market_price_base": 190,
    "catalog_description": "Aço purificado submetido a resfriamento criogênico em banho de nascente mística. Fio de navalha com tolerância geométrica estrita.",
    "part_id": "part_elf_blade_01",
    "corp_id": "corp_elf_precision",
    "base_cost": 190,
    "affix_id_source": "pref_temperada",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.15
      },
      {
        "effect": "value_pct",
        "value": 0.15
      }
    ],
    "slot_role": "base",
    "name_modifier": "Lâmina Temperada a Frio Élfico"
  },
  {
    "id": "part_elf_gem_01",
    "name": "Gema Focalizadora de Cristal Élfico",
    "brand_id": "corp_elf_precision",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 1,
    "market_price_base": 130,
    "catalog_description": "Cristal lapidado com facetas de ressonância mística harmônica. Eleva o prestígio e o canal de fluxo de qualquer penduricalho.",
    "part_id": "part_elf_gem_01",
    "corp_id": "corp_elf_precision",
    "base_cost": 130,
    "affix_id_source": "pref_encantada",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.12
      },
      {
        "effect": "value_pct",
        "value": 0.4
      }
    ],
    "slot_role": "base",
    "name_modifier": "Gema Focalizadora de Cristal Élfico"
  },
  {
    "id": "part_elf_gem_02",
    "name": "Safira Penitencial de Condutividade Alta",
    "brand_id": "corp_elf_precision",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 2,
    "market_price_base": 240,
    "catalog_description": "Gema nobre que amplifica a saída de poder através de sacrifício de vibrações periféricas, amplamente apreciada pela nobreza.",
    "part_id": "part_elf_gem_02",
    "corp_id": "corp_elf_precision",
    "base_cost": 240,
    "affix_id_source": "pref_penitente",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.22
      },
      {
        "effect": "value_pct",
        "value": 0.4
      }
    ],
    "slot_role": "base",
    "name_modifier": "Safira Penitencial de Condutividade Alta"
  },
  {
    "id": "part_elf_core_01",
    "name": "Núcleo Criogênico de Estabilidade Boreal",
    "brand_id": "corp_elf_precision",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 3,
    "market_price_base": 330,
    "catalog_description": "Dispositivo arcano élfico que condensa o arredor em gelo puro, neutralizando o frio glacial externo e conferindo solidez estocástica.",
    "part_id": "part_elf_core_01",
    "corp_id": "corp_elf_precision",
    "base_cost": 330,
    "affix_id_source": "pref_glacial",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "glacier_frost"
      },
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.3
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Gelo Eterno"
  },
  {
    "id": "part_elf_filter_01",
    "name": "Refinador Gustativo de Alta Gastronomia",
    "brand_id": "corp_elf_precision",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 1,
    "market_price_base": 110,
    "catalog_description": "Cartucho de especiarias arcanas que converte gororobas secas em refeições dignas de um banquete do conselho ducal.",
    "part_id": "part_elf_filter_01",
    "corp_id": "corp_elf_precision",
    "base_cost": 110,
    "affix_id_source": "pref_saborosa",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 10
      },
      {
        "effect": "value_pct",
        "value": 0.35
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Refinada"
  },
  {
    "id": "part_elf_gem_03",
    "name": "Topázio de Compensação de Turno Noturno",
    "brand_id": "corp_elf_precision",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 2,
    "market_price_base": 190,
    "catalog_description": "Cristal sensível à luz baixa que harmoniza o ritmo circadiano de vigias noturnos e combate a fadiga em masmorras escuras.",
    "part_id": "part_elf_gem_03",
    "corp_id": "corp_elf_precision",
    "base_cost": 190,
    "affix_id_source": "suf_adicional_noturno",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.08
      },
      {
        "effect": "value_pct",
        "value": 0.25
      },
      {
        "effect": "power_pct",
        "value": 0.08,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Turno Noturno"
  },
  {
    "id": "part_elf_core_02",
    "name": "Matriz Rúnica de Compliance Arcano",
    "brand_id": "corp_elf_precision",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "market_price_base": 230,
    "catalog_description": "Inscrição de alta precisão que garante que nenhuma emissão mágica viole os tratados anti-poluição arcana da capital.",
    "part_id": "part_elf_core_02",
    "corp_id": "corp_elf_precision",
    "base_cost": 230,
    "affix_id_source": "suf_compliance_magico",
    "effects": [
      {
        "effect": "power_flat",
        "value": 5
      },
      {
        "effect": "value_pct",
        "value": 0.35
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Conformidade"
  },
  {
    "id": "part_elf_gem_04",
    "name": "Gema Lapidada de Isenção Fiscal",
    "brand_id": "corp_elf_precision",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 3,
    "market_price_base": 370,
    "catalog_description": "Amuleto com inscrição secreta de paraíso fiscal interplanar. Agrega valor astronômico de revenda para qualquer anel.",
    "part_id": "part_elf_gem_04",
    "corp_id": "corp_elf_precision",
    "base_cost": 370,
    "affix_id_source": "suf_eficiencia_tributaria",
    "effects": [
      {
        "effect": "value_pct",
        "value": 0.5
      },
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.3,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Patrono"
  },
  {
    "id": "part_dwarf_plating_01",
    "name": "Barricada de Aço Anão",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 1,
    "market_price_base": 85,
    "catalog_description": "Paredão de proteção portátil forjado pelos sindicatos mineiros subterrâneos.",
    "part_id": "part_dwarf_plating_01",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 85,
    "affix_id_source": "pref_reforcada",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.1
      },
      {
        "effect": "value_pct",
        "value": 0.15
      }
    ],
    "slot_role": "base",
    "name_modifier": "Barricada de Aço Anão"
  },
  {
    "id": "part_dwarf_plating_02",
    "name": "Kit de Blindagem Vulcânica",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 1,
    "market_price_base": 95,
    "catalog_description": "Blindagem térmica de alta resistência contra colapsos e calor extremo.",
    "part_id": "part_dwarf_plating_02",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 95,
    "affix_id_source": "pref_robusta",
    "effects": [
      {
        "effect": "power_flat",
        "value": 4
      },
      {
        "effect": "value_pct",
        "value": 0.2
      }
    ],
    "slot_role": "base",
    "name_modifier": "Kit de Blindagem Vulcânica"
  },
  {
    "id": "part_dwarf_plating_03",
    "name": "Barricada Portátil de Minério Negro",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 2,
    "market_price_base": 210,
    "catalog_description": "Estrutura modular pesada para contenção de ataques massivos de área.",
    "part_id": "part_dwarf_plating_03",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 210,
    "affix_id_source": "pref_macico",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      },
      {
        "effect": "value_pct",
        "value": 0.2
      }
    ],
    "slot_role": "base",
    "name_modifier": "Barricada de Minério Negro"
  },
  {
    "id": "part_dwarf_plating_04",
    "name": "Blindagem Coletiva da Cidadela",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 3,
    "market_price_base": 390,
    "catalog_description": "EPC completo de blindagem pesada para guarnecer toda a força-tarefa.",
    "part_id": "part_dwarf_plating_04",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 390,
    "affix_id_source": "pref_impenetravel",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      },
      {
        "effect": "power_pct",
        "value": 0.12
      },
      {
        "effect": "value_pct",
        "value": 0.4
      }
    ],
    "slot_role": "base",
    "name_modifier": "Blindagem da Cidadela"
  },
  {
    "id": "part_dwarf_plating_05",
    "name": "Revestimento Galvanizado",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "market_price_base": 350,
    "catalog_description": "Tratamento anticorrosivo para chapas de proteção e blindagens coletivas.",
    "part_id": "part_dwarf_plating_05",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 350,
    "affix_id_source": "pref_galvanizado",
    "effects": [
      {
        "effect": "power_flat",
        "value": 5
      },
      {
        "effect": "power_pct",
        "value": 0.1
      },
      {
        "effect": "value_pct",
        "value": 0.5
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Galvanizado"
  },
  {
    "id": "part_dwarf_core_01",
    "name": "Âncora Gravitacional",
    "brand_id": "corp_dwarf_steel",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 1,
    "market_price_base": 125,
    "catalog_description": "Mancal estabilizador que ancora o esquadrão perante desmoronamentos.",
    "part_id": "part_dwarf_core_01",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 125,
    "affix_id_source": "pref_firme",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "unstable_mine"
      },
      {
        "effect": "value_pct",
        "value": 0.2
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Pesado"
  },
  {
    "id": "part_dwarf_plating_06",
    "name": "Reforço Torácico com Apólice Integrada",
    "brand_id": "corp_dwarf_steel",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 2,
    "market_price_base": 230,
    "catalog_description": "Placa peitoral que atende todas as exigências das seguradoras para pagamento de indenização integral em caso de esmagamento.",
    "part_id": "part_dwarf_plating_06",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 230,
    "affix_id_source": "suf_seguro_vida",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      },
      {
        "effect": "value_pct",
        "value": 0.35
      },
      {
        "effect": "power_pct",
        "value": 0.12,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Apurada"
  },
  {
    "id": "part_dwarf_core_02",
    "name": "Estrutura de Contenção de Responsabilidade Limitada",
    "brand_id": "corp_dwarf_steel",
    "part_type": "core",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 2,
    "market_price_base": 220,
    "catalog_description": "Sistema de travas mecânicas que dissipa o impacto contra terceiros, blindando o patrimônio físico e civil do combatente.",
    "part_id": "part_dwarf_core_02",
    "corp_id": "corp_dwarf_steel",
    "base_cost": 220,
    "affix_id_source": "suf_responsabilidade_limitada",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      },
      {
        "effect": "value_pct",
        "value": 0.3
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Responsabilidade Limitada"
  },
  {
    "id": "part_swamp_filter_01",
    "name": "Lote de Provisões do Charco",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 1,
    "market_price_base": 75,
    "catalog_description": "Suprimentos nutritivos desidratados e adaptados para ambientes úmidos.",
    "part_id": "part_swamp_filter_01",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 75,
    "affix_id_source": "pref_concentrada",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 8
      },
      {
        "effect": "value_pct",
        "value": 0.25
      }
    ],
    "slot_role": "base",
    "name_modifier": "Provisões do Charco"
  },
  {
    "id": "part_swamp_filter_02",
    "name": "Catering Concentrado de Algas",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 1,
    "market_price_base": 65,
    "catalog_description": "Rações de alta caloria prensadas a partir de flora aquática pantanosa.",
    "part_id": "part_swamp_filter_02",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 65,
    "affix_id_source": "pref_nutritiva",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 5
      },
      {
        "effect": "value_pct",
        "value": 0.15
      }
    ],
    "slot_role": "base",
    "name_modifier": "Catering de Algas"
  },
  {
    "id": "part_swamp_core_01",
    "name": "Filtro Neutralizador de Miasma",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 1,
    "market_price_base": 120,
    "catalog_description": "Filtro especial de carvão ativado contra gases fétidos e esporos venenosos.",
    "part_id": "part_swamp_core_01",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 120,
    "affix_id_source": "pref_purificada",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "toxic_swamp"
      },
      {
        "effect": "value_pct",
        "value": 0.15
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Antídoto"
  },
  {
    "id": "part_swamp_filter_03",
    "name": "Dosador Graduado de Prontuário",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 2,
    "market_price_base": 175,
    "catalog_description": "Dispositivo para dosagem controlada de antibióticos e elixires.",
    "part_id": "part_swamp_filter_03",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 175,
    "affix_id_source": "suf_prontuario",
    "effects": [
      {
        "effect": "charges_flat",
        "value": 1
      },
      {
        "effect": "value_pct",
        "value": 0.25
      },
      {
        "effect": "energy_bonus_flat",
        "value": 10,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Graduado"
  },
  {
    "id": "part_swamp_filter_04",
    "name": "Válvula de Infusão de Produtividade",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 2,
    "market_price_base": 165,
    "catalog_description": "Regulador de fluxo para fornecimento constante de nutrientes.",
    "part_id": "part_swamp_filter_04",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 165,
    "affix_id_source": "suf_produtividade",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 6
      },
      {
        "effect": "value_pct",
        "value": 0.15
      },
      {
        "effect": "charges_flat",
        "value": 1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Apurado"
  },
  {
    "id": "part_swamp_core_02",
    "name": "Injetor Químico de Evacuação",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "core",
    "compatible_slots": [
      "Provisão Logística"
    ],
    "tier": 2,
    "market_price_base": 185,
    "catalog_description": "Sistema de liberação rápida de compostos estimulantes para retirada emergencial.",
    "part_id": "part_swamp_core_02",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 185,
    "affix_id_source": "suf_evacuacao",
    "effects": [
      {
        "effect": "energy_bonus_flat",
        "value": 8
      },
      {
        "effect": "value_pct",
        "value": 0.35
      },
      {
        "effect": "charges_flat",
        "value": 1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Fuga"
  },
  {
    "id": "part_swamp_core_03",
    "name": "Difusor Balsâmico Medicinal",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "market_price_base": 195,
    "catalog_description": "Dispersor aromático que alivia a fadiga pulmonar nas masmorras.",
    "part_id": "part_swamp_core_03",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 195,
    "affix_id_source": "suf_antidoto_eucalipto",
    "effects": [
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.15
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Balsâmico"
  },
  {
    "id": "part_swamp_gem_01",
    "name": "Âmbar de Insalubridade",
    "brand_id": "corp_swamp_alchemy",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 2,
    "market_price_base": 215,
    "catalog_description": "Compensação financeira e energética para missões em terreno tóxico.",
    "part_id": "part_swamp_gem_01",
    "corp_id": "corp_swamp_alchemy",
    "base_cost": 215,
    "affix_id_source": "suf_insalubridade",
    "effects": [
      {
        "effect": "power_flat",
        "value": 2
      },
      {
        "effect": "value_pct",
        "value": 0.4
      },
      {
        "effect": "power_pct",
        "value": 0.08,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "da Insalubridade"
  },
  {
    "id": "part_crown_plating_01",
    "name": "Fardamento Reforçado da Fazenda Real",
    "brand_id": "corp_crown_notarial",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 1,
    "market_price_base": 90,
    "catalog_description": "Uniformes com mantas protetoras padronizadas pela Coroa para o esquadrão.",
    "part_id": "part_crown_plating_01",
    "corp_id": "corp_crown_notarial",
    "base_cost": 90,
    "affix_id_source": "pref_escamada",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.15
      },
      {
        "effect": "value_pct",
        "value": 0.2
      }
    ],
    "slot_role": "base",
    "name_modifier": "Fardamento da Fazenda Real"
  },
  {
    "id": "part_crown_gem_01",
    "name": "Ágata Notarial de Vigor Funcional",
    "brand_id": "corp_crown_notarial",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 1,
    "market_price_base": 110,
    "catalog_description": "Pedra semipreciosa chancelada pelo conselho de saúde que atesta que o portador encontra-se apto para trabalho físico extenuante.",
    "part_id": "part_crown_gem_01",
    "corp_id": "corp_crown_notarial",
    "base_cost": 110,
    "affix_id_source": "pref_vigorosa",
    "effects": [
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.25
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Patrono"
  },
  {
    "id": "part_crown_gem_02",
    "name": "Quartzo de Austeridade Orçamentária",
    "brand_id": "corp_crown_notarial",
    "part_type": "gem",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 2,
    "market_price_base": 195,
    "catalog_description": "Componente lapidado sob rígidas metas de contenção de gastos fiscais. Maximiza a margem de liquidez em vendas no balcão.",
    "part_id": "part_crown_gem_02",
    "corp_id": "corp_crown_notarial",
    "base_cost": 195,
    "affix_id_source": "pref_economico",
    "effects": [
      {
        "effect": "value_pct",
        "value": 0.45
      },
      {
        "effect": "power_flat",
        "value": 2
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "da Austeridade"
  },
  {
    "id": "part_crown_core_01",
    "name": "Inscrição Ígnea de Calefação Regulatória",
    "brand_id": "corp_crown_notarial",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 1,
    "market_price_base": 130,
    "catalog_description": "Runa térmica padronizada pela comissão de inverno da Coroa. Impede o congelamento de engrenagens em tundras geladas.",
    "part_id": "part_crown_core_01",
    "corp_id": "corp_crown_notarial",
    "base_cost": 130,
    "affix_id_source": "pref_ignea",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "glacier_frost"
      },
      {
        "effect": "value_pct",
        "value": 0.2
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Patrono"
  },
  {
    "id": "part_crown_hilt_01",
    "name": "Pomo Notarial de Responsabilidade",
    "brand_id": "corp_crown_notarial",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "market_price_base": 115,
    "catalog_description": "Terminal de empunhadura com gravação oficial do conselho imperial.",
    "part_id": "part_crown_hilt_01",
    "corp_id": "corp_crown_notarial",
    "base_cost": 115,
    "affix_id_source": "suf_termo_responsabilidade",
    "effects": [
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.25
      },
      {
        "effect": "power_pct",
        "value": 0.08,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Chancelado"
  },
  {
    "id": "part_crown_hilt_02",
    "name": "Guarda de Cláusula Rescisória",
    "brand_id": "corp_crown_notarial",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "market_price_base": 185,
    "catalog_description": "Guarda-mão de aço forjado com garantia de indenização.",
    "part_id": "part_crown_hilt_02",
    "corp_id": "corp_crown_notarial",
    "base_cost": 185,
    "affix_id_source": "suf_rescisao",
    "effects": [
      {
        "effect": "power_pct",
        "value": 0.12
      },
      {
        "effect": "value_pct",
        "value": 0.15
      },
      {
        "effect": "power_pct",
        "value": 0.12,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Forjado"
  },
  {
    "id": "part_crown_plating_02",
    "name": "Braçadeira Chancelada",
    "brand_id": "corp_crown_notarial",
    "part_type": "plating",
    "compatible_slots": [
      "Blindagem Operacional"
    ],
    "tier": 2,
    "market_price_base": 200,
    "catalog_description": "Braçadeiras com selo de aprovação pericial da Coroa Imperial.",
    "part_id": "part_crown_plating_02",
    "corp_id": "corp_crown_notarial",
    "base_cost": 200,
    "affix_id_source": "suf_laudo_pericial",
    "effects": [
      {
        "effect": "power_flat",
        "value": 4
      },
      {
        "effect": "value_pct",
        "value": 0.2
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Homologado"
  },
  {
    "id": "part_crown_core_02",
    "name": "Selo Rúnico de Alvará de Funcionamento",
    "brand_id": "corp_crown_notarial",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "market_price_base": 220,
    "catalog_description": "Inscrição solene que homologa a permissão legal da força-tarefa para transitar e abater criaturas em recintos subterrâneos concedidos.",
    "part_id": "part_crown_core_02",
    "corp_id": "corp_crown_notarial",
    "base_cost": 220,
    "affix_id_source": "suf_alvara",
    "effects": [
      {
        "effect": "power_flat",
        "value": 5
      },
      {
        "effect": "value_pct",
        "value": 0.35
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "do Alvará Régio"
  },
  {
    "id": "part_crown_core_03",
    "name": "Condutor Térmico de Prevenção à Hipotermia",
    "brand_id": "corp_crown_notarial",
    "part_type": "core",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "market_price_base": 190,
    "catalog_description": "Matriz rúnica em conformidade com as normas regulamentadoras de trabalho em baixas temperaturas da Coroa.",
    "part_id": "part_crown_core_03",
    "corp_id": "corp_crown_notarial",
    "base_cost": 190,
    "affix_id_source": "suf_prevencao_hipotermia",
    "effects": [
      {
        "effect": "power_flat",
        "value": 3
      },
      {
        "effect": "value_pct",
        "value": 0.2
      },
      {
        "effect": "power_pct",
        "value": 0.1,
        "requires_quality": "Lendário"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "da Ordem Boreal"
  },
  {
    "id": "part_aethelgard_core",
    "part_id": "part_aethelgard_core",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Rebite de Fixação Aethelgard",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 1,
    "base_cost": 60,
    "market_price_base": 60,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Rebites de alta pressão para sustentação de baterias móveis de esquadrão.",
    "slot_role": "suffix",
    "name_modifier": "de Aethelgard",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_valkyria_core",
    "part_id": "part_valkyria_core",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Placa Balística Valkyria",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Blindagem Operacional",
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "base_cost": 160,
    "market_price_base": 160,
    "power_bonus": 14,
    "power_contrib": 14,
    "catalog_description": "Revestimento blindado contra ataques pesados e projéteis inimigos.",
    "slot_role": "suffix",
    "name_modifier": "da Valkyria",
    "effects": [
      {
        "effect": "power_flat",
        "value": 14
      }
    ]
  },
  {
    "id": "part_valkyria_blade",
    "part_id": "part_valkyria_blade",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Chassi Bélico Valkyria",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 2,
    "base_cost": 170,
    "market_price_base": 170,
    "power_bonus": 15,
    "power_contrib": 15,
    "catalog_description": "Estrutura tática móvel reforçada para armamento pesado e apoio ofensivo.",
    "slot_role": "base",
    "name_modifier": "Chassi Bélico Valkyria",
    "effects": [
      {
        "effect": "power_flat",
        "value": 15
      }
    ]
  },
  {
    "id": "part_flamel_nozzle",
    "part_id": "part_flamel_nozzle",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Bocal Dosador Flamel",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Provisão Logística",
      "Alvará de Risco"
    ],
    "tier": 1,
    "base_cost": 70,
    "market_price_base": 70,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Válvula de distribuição precisa de estimulantes e filtros para a equipe.",
    "slot_role": "prefix",
    "name_modifier": "Destilado",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_chancellor_frame",
    "part_id": "part_chancellor_frame",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Ativo de Retenção Chanceler",
    "branch": "Joalheria",
    "part_type": "plating",
    "compatible_slots": [
      "Ativo de Performance",
      "Blindagem Operacional"
    ],
    "tier": 2,
    "base_cost": 180,
    "market_price_base": 180,
    "power_bonus": 14,
    "power_contrib": 14,
    "catalog_description": "Insignia de premiação corporativa que eleva a moral e dedicação da guilda.",
    "slot_role": "base",
    "name_modifier": "Ativo Chanceler",
    "effects": [
      {
        "effect": "power_flat",
        "value": 14
      }
    ]
  },
  {
    "id": "part_chancellor_pin",
    "part_id": "part_chancellor_pin",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Broche de Fixação Imperial",
    "branch": "Joalheria",
    "part_type": "hilt",
    "compatible_slots": [
      "Ativo de Performance"
    ],
    "tier": 1,
    "base_cost": 80,
    "market_price_base": 80,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Fecho nobre decorativo para condecorações da Chancelaria.",
    "slot_role": "prefix",
    "name_modifier": "Aureolado",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_gob_core_00",
    "part_id": "part_gob_core_00",
    "corp_id": "corp_goblin_eng",
    "brand_id": "corp_goblin_eng",
    "name": "Lote de Dinamites Táticas Goblin",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Provisão Logística"
    ],
    "tier": 1,
    "base_cost": 65,
    "market_price_base": 65,
    "power_bonus": 7,
    "power_contrib": 7,
    "catalog_description": "Cartuchos explosivos concentrados para abrir caminhos e aniquilar aglomerações.",
    "slot_role": "suffix",
    "name_modifier": "Explosivo",
    "effects": [
      {
        "effect": "power_flat",
        "value": 7
      }
    ]
  },
  {
    "id": "part_elf_core_00",
    "part_id": "part_elf_core_00",
    "corp_id": "corp_elf_precision",
    "brand_id": "corp_elf_precision",
    "name": "Matriz de Ressonância Élfica",
    "branch": "Joalheria",
    "part_type": "core",
    "compatible_slots": [
      "Ativo de Performance",
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "base_cost": 75,
    "market_price_base": 75,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Cristal diminuto polido com frequências harmônicas que sintoniza as peças ao seu redor.",
    "slot_role": "suffix",
    "name_modifier": "de Precisão Élfica",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_dwarf_prefix_01",
    "part_id": "part_dwarf_prefix_01",
    "corp_id": "corp_dwarf_steel",
    "brand_id": "corp_dwarf_steel",
    "name": "Presilha Forjada Anã",
    "branch": "Ferragem",
    "part_type": "hilt",
    "compatible_slots": [
      "Blindagem Operacional",
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "base_cost": 70,
    "market_price_base": 70,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Travas de aço maciço para articulações pesadas de defesa e ataque.",
    "slot_role": "prefix",
    "name_modifier": "Maciço",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_swamp_prefix_01",
    "part_id": "part_swamp_prefix_01",
    "corp_id": "corp_swamp_alchemy",
    "brand_id": "corp_swamp_alchemy",
    "name": "Válvula de Lodo Filtrado",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Blindagem Operacional",
      "Provisão Logística"
    ],
    "tier": 1,
    "base_cost": 75,
    "market_price_base": 75,
    "power_bonus": 8,
    "power_contrib": 8,
    "catalog_description": "Válvula química com carvão ativado pantanoso para neutralizar miasmas corrosivos.",
    "slot_role": "prefix",
    "name_modifier": "Miasmático",
    "effects": [
      {
        "effect": "power_flat",
        "value": 8
      }
    ]
  },
  {
    "id": "part_aethelgard_blade_t2",
    "part_id": "part_aethelgard_blade_t2",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Canhões Prensados Aethelgard",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "base_cost": 110,
    "market_price_base": 110,
    "power_bonus": 50,
    "power_contrib": 50,
    "catalog_description": "Artilharia pesada de longo alcance prensada com ligas nobres da guilda Aethelgard.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 12
      }
    ],
    "slot_role": "base",
    "name_modifier": "Canhões Prensados Aethelgard"
  },
  {
    "id": "part_aethelgard_hilt_t2",
    "part_id": "part_aethelgard_hilt_t2",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Mancal Reforçado Aethelgard",
    "branch": "Ferragem",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 2,
    "base_cost": 95,
    "market_price_base": 95,
    "power_bonus": 40,
    "power_contrib": 40,
    "catalog_description": "Estrutura estabilizadora reforçada para absorver recuo de artilharia pesada.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 8
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Reforçado"
  },
  {
    "id": "part_aethelgard_core_t2",
    "part_id": "part_aethelgard_core_t2",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Rebite Temperado Aethelgard",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 2,
    "base_cost": 100,
    "market_price_base": 100,
    "power_bonus": 45,
    "power_contrib": 45,
    "catalog_description": "Elementos de fixação forjados a quente para máxima durabilidade estrutural.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 10
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Aço"
  },
  {
    "id": "part_aethelgard_blade_t3",
    "part_id": "part_aethelgard_blade_t3",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Arsenal de Mithril Aethelgard",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "base_cost": 220,
    "market_price_base": 220,
    "power_bonus": 90,
    "power_contrib": 90,
    "catalog_description": "Bateria móvel de elite revestida em mithril para bombardeio tático de alta cadência.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 25
      }
    ],
    "slot_role": "base",
    "name_modifier": "Arsenal de Mithril Aethelgard"
  },
  {
    "id": "part_aethelgard_hilt_t3",
    "part_id": "part_aethelgard_hilt_t3",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Mancal Nobre Aethelgard",
    "branch": "Ferragem",
    "part_type": "hilt",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "base_cost": 200,
    "market_price_base": 200,
    "power_bonus": 80,
    "power_contrib": 80,
    "catalog_description": "Engrenagens de precisão arcanas para direcionamento do arsenal de vanguarda.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 18
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Nobre"
  },
  {
    "id": "part_aethelgard_core_t3",
    "part_id": "part_aethelgard_core_t3",
    "corp_id": "corp_aethelgard",
    "brand_id": "corp_aethelgard",
    "name": "Núcleo de Forja Aethelgard",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "base_cost": 210,
    "market_price_base": 210,
    "power_bonus": 85,
    "power_contrib": 85,
    "catalog_description": "Matriz de combustão contínua para disparos ininterruptos do esquadrão.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 22
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Forja"
  },
  {
    "id": "part_valkyria_blade_t1",
    "part_id": "part_valkyria_blade_t1",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Artilharia Pesada Valkyria",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 1,
    "base_cost": 55,
    "market_price_base": 55,
    "power_bonus": 28,
    "power_contrib": 28,
    "catalog_description": "Artilharia de choque balístico para desestabilização de monstros de elite.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      }
    ],
    "slot_role": "base",
    "name_modifier": "Artilharia Valkyria"
  },
  {
    "id": "part_valkyria_core_t1",
    "part_id": "part_valkyria_core_t1",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Rebite Balístico Valkyria",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 1,
    "base_cost": 50,
    "market_price_base": 50,
    "power_bonus": 24,
    "power_contrib": 24,
    "catalog_description": "Conectores de alta tração resistentes a explosões e atrito severo.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 5
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Balístico"
  },
  {
    "id": "part_valkyria_guard_t3",
    "part_id": "part_valkyria_guard_t3",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Guarda de Titânio Valkyria",
    "branch": "Ferragem",
    "part_type": "guard",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "base_cost": 210,
    "market_price_base": 210,
    "power_bonus": 85,
    "power_contrib": 85,
    "catalog_description": "Protetores frontais pesados de titânio para blindagem de toda a guarnição.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 20
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Pesado"
  },
  {
    "id": "part_valkyria_blade_t3",
    "part_id": "part_valkyria_blade_t3",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Arsenal Exterminador Valkyria",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "base_cost": 230,
    "market_price_base": 230,
    "power_bonus": 95,
    "power_contrib": 95,
    "catalog_description": "Bateria de choque industrial de destruição massiva para a força-tarefa.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 28
      }
    ],
    "slot_role": "base",
    "name_modifier": "Arsenal Exterminador Valkyria"
  },
  {
    "id": "part_valkyria_core_t3",
    "part_id": "part_valkyria_core_t3",
    "corp_id": "corp_valkyria",
    "brand_id": "corp_valkyria",
    "name": "Núcleo de Deflexão Valkyria",
    "branch": "Ferragem",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "base_cost": 225,
    "market_price_base": 225,
    "power_bonus": 88,
    "power_contrib": 88,
    "catalog_description": "Sistema de absorção cinética que dispersa impactos de grande escala.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 22
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "de Deflexão"
  },
  {
    "id": "part_flamel_vial_t2",
    "part_id": "part_flamel_vial_t2",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Ampola Graduada Flamel",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Blindagem Operacional",
      "Acessório"
    ],
    "tier": 2,
    "base_cost": 105,
    "market_price_base": 105,
    "power_bonus": 45,
    "power_contrib": 45,
    "catalog_description": "Frascos de vidro temperado para preservação estéril de insumos do esquadrão.",
    "effects": [
      {
        "effect": "recovery_flat",
        "value": 10
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Hermético"
  },
  {
    "id": "part_flamel_reagent_t2",
    "part_id": "part_flamel_reagent_t2",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Remessa Química Flamel",
    "branch": "Alquimia",
    "part_type": "gem",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Acessório"
    ],
    "tier": 2,
    "base_cost": 115,
    "market_price_base": 115,
    "power_bonus": 50,
    "power_contrib": 50,
    "catalog_description": "Lote de soluções alcalinas estabilizadas para regeneração e vigor.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 12
      }
    ],
    "slot_role": "base",
    "name_modifier": "Remessa Flamel"
  },
  {
    "id": "part_flamel_core_t2",
    "part_id": "part_flamel_core_t2",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Catalisador Purificado Flamel",
    "branch": "Alquimia",
    "part_type": "core",
    "compatible_slots": [
      "Blindagem Operacional",
      "Acessório"
    ],
    "tier": 2,
    "base_cost": 110,
    "market_price_base": 110,
    "power_bonus": 48,
    "power_contrib": 48,
    "catalog_description": "Matriz reagente que acelera a absorção de provisões logísticas.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 10
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Purificado"
  },
  {
    "id": "part_flamel_vial_t3",
    "part_id": "part_flamel_vial_t3",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Ampola Dragônica Flamel",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Blindagem Operacional",
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 215,
    "market_price_base": 215,
    "power_bonus": 88,
    "power_contrib": 88,
    "catalog_description": "Recipiente alquímico imbuído de essência ígnea para potencializar compostos.",
    "effects": [
      {
        "effect": "recovery_flat",
        "value": 25
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Dragônico"
  },
  {
    "id": "part_flamel_reagent_t3",
    "part_id": "part_flamel_reagent_t3",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Provisão Alquímica Dragônica",
    "branch": "Alquimia",
    "part_type": "gem",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 235,
    "market_price_base": 235,
    "power_bonus": 96,
    "power_contrib": 96,
    "catalog_description": "Fórmula nobre de sustentação biológica em expedições prolongadas.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 28
      }
    ],
    "slot_role": "base",
    "name_modifier": "Provisão Dragônica"
  },
  {
    "id": "part_flamel_core_t3",
    "part_id": "part_flamel_core_t3",
    "corp_id": "corp_flamel",
    "brand_id": "corp_flamel",
    "name": "Catalisador Primordial Flamel",
    "branch": "Alquimia",
    "part_type": "core",
    "compatible_slots": [
      "Blindagem Operacional",
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 225,
    "market_price_base": 225,
    "power_bonus": 92,
    "power_contrib": 92,
    "catalog_description": "Elemento de pureza máxima para restauração metabólica instantânea.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 24
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Primordial"
  },
  {
    "id": "part_chancellor_gem_t1",
    "part_id": "part_chancellor_gem_t1",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Incentivo Notarial Lapidado",
    "branch": "Joalheria",
    "part_type": "gem",
    "compatible_slots": [
      "Acessório"
    ],
    "tier": 1,
    "base_cost": 55,
    "market_price_base": 55,
    "power_bonus": 26,
    "power_contrib": 26,
    "catalog_description": "Joia contábil lapidada vinculada a metas trimestrais da Coroa.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 6
      }
    ],
    "slot_role": "base",
    "name_modifier": "Incentivo Notarial"
  },
  {
    "id": "part_chancellor_pin_t2",
    "part_id": "part_chancellor_pin_t2",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Broche de Platina Chanceler",
    "branch": "Joalheria",
    "part_type": "hilt",
    "compatible_slots": [
      "Acessório"
    ],
    "tier": 2,
    "base_cost": 110,
    "market_price_base": 110,
    "power_bonus": 46,
    "power_contrib": 46,
    "catalog_description": "Ornamento honorífico que concede prestígio profissional aos heróis.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 10
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Platinado"
  },
  {
    "id": "part_chancellor_gem_t3",
    "part_id": "part_chancellor_gem_t3",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Ativo Imperial Chanceler",
    "branch": "Joalheria",
    "part_type": "gem",
    "compatible_slots": [
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 240,
    "market_price_base": 240,
    "power_bonus": 98,
    "power_contrib": 98,
    "catalog_description": "Diamante régio concedido a guildas de conduta irrepreensível.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 30
      }
    ],
    "slot_role": "base",
    "name_modifier": "Ativo Imperial"
  },
  {
    "id": "part_chancellor_frame_t3",
    "part_id": "part_chancellor_frame_t3",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Armação de Adamante Chanceler",
    "branch": "Joalheria",
    "part_type": "plating",
    "compatible_slots": [
      "Acessório",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "base_cost": 225,
    "market_price_base": 225,
    "power_bonus": 90,
    "power_contrib": 90,
    "catalog_description": "Engaste em liga pura de adamante lapidado para conter gemas de alta nobreza.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 22
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Armação de Adamante Chanceler"
  },
  {
    "id": "part_chancellor_core_t3",
    "part_id": "part_chancellor_core_t3",
    "corp_id": "corp_chancellor",
    "brand_id": "corp_chancellor",
    "name": "Prisma Solar Chanceler",
    "branch": "Joalheria",
    "part_type": "core",
    "compatible_slots": [
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 230,
    "market_price_base": 230,
    "power_bonus": 94,
    "power_contrib": 94,
    "catalog_description": "Gema solar que irradia confiança e estabilidade psicológica ao esquadrão.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 26
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Solar"
  },
  {
    "id": "part_swamp_filter_t3",
    "part_id": "part_swamp_filter_t3",
    "corp_id": "corp_swamp_alchemy",
    "brand_id": "corp_swamp_alchemy",
    "name": "Filtro de Bio-Éter do Charco",
    "branch": "Alquimia",
    "part_type": "filter",
    "compatible_slots": [
      "Blindagem Operacional",
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 210,
    "market_price_base": 210,
    "power_bonus": 86,
    "power_contrib": 86,
    "catalog_description": "Aparelhagem avançada para purificação de ar e água em qualquer câmara subterrânea.",
    "effects": [
      {
        "effect": "mitigation_flat",
        "value": 20
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Purificado"
  },
  {
    "id": "part_swamp_gem_t3",
    "part_id": "part_swamp_gem_t3",
    "corp_id": "corp_swamp_alchemy",
    "brand_id": "corp_swamp_alchemy",
    "name": "Incentivo Tóxico Concentrado",
    "branch": "Alquimia",
    "part_type": "gem",
    "compatible_slots": [
      "Acessório",
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "base_cost": 225,
    "market_price_base": 225,
    "power_bonus": 92,
    "power_contrib": 92,
    "catalog_description": "Bônus salarial de risco pago para atuar em masmorras biologicamente instáveis.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 26
      }
    ],
    "slot_role": "base",
    "name_modifier": "Incentivo Tóxico"
  },
  {
    "id": "part_swamp_core_t3",
    "part_id": "part_swamp_core_t3",
    "corp_id": "corp_swamp_alchemy",
    "brand_id": "corp_swamp_alchemy",
    "name": "Núcleo Virulento Concentrado",
    "branch": "Alquimia",
    "part_type": "core",
    "compatible_slots": [
      "Arsenal Ofensivo",
      "Blindagem Operacional"
    ],
    "tier": 3,
    "base_cost": 220,
    "market_price_base": 220,
    "power_bonus": 88,
    "power_contrib": 88,
    "catalog_description": "Carga química potente para sobrecarregar as defesas de monstros tóxicos.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 24
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Virulento"
  },
  {
    "id": "part_crown_blade_t3",
    "part_id": "part_crown_blade_t3",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Arsenal Imperial Notarial",
    "branch": "Ferragem",
    "part_type": "blade",
    "compatible_slots": [
      "Arsenal Ofensivo"
    ],
    "tier": 3,
    "base_cost": 200,
    "market_price_base": 200,
    "power_bonus": 84,
    "power_contrib": 84,
    "catalog_description": "Remessa bélica de artilharia pesada sancionada e chancelada pela Fazenda Real.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 22
      }
    ],
    "slot_role": "base",
    "name_modifier": "Arsenal Imperial Notarial"
  },
  {
    "id": "part_crown_gem_t3",
    "part_id": "part_crown_gem_t3",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Rubi Imperial Selado",
    "branch": "Joalheria",
    "part_type": "gem",
    "compatible_slots": [
      "Acessório"
    ],
    "tier": 3,
    "base_cost": 215,
    "market_price_base": 215,
    "power_bonus": 88,
    "power_contrib": 88,
    "catalog_description": "Rubi de lavra estatal gravado com as armas reais e lacrado em chumbo.",
    "effects": [
      {
        "effect": "power_flat",
        "value": 25
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Rubi Imperial Selado"
  },
  {
    "id": "part_crown_seal_t1",
    "part_id": "part_crown_seal_t1",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Atestado Notarial Régio",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 1,
    "base_cost": 60,
    "market_price_base": 60,
    "power_bonus": 10,
    "power_contrib": 10,
    "catalog_description": "Certidão notarial básica garantindo licença para incursões comerciais.",
    "effects": [],
    "slot_role": "base",
    "name_modifier": "Atestado Notarial"
  },
  {
    "id": "part_crown_parchment_t2",
    "part_id": "part_crown_parchment_t2",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Certidão de Risco Padronizada",
    "branch": "Ferragem",
    "part_type": "parchment",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 120,
    "market_price_base": 120,
    "power_bonus": 20,
    "power_contrib": 20,
    "catalog_description": "Documento oficial de homologação sanitária e mitigação de risco.",
    "effects": [],
    "slot_role": "base",
    "name_modifier": "Certidão de Risco"
  },
  {
    "id": "part_crown_seal_t3",
    "part_id": "part_crown_seal_t3",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Laudo Pericial Extraordinário",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 3,
    "base_cost": 220,
    "market_price_base": 220,
    "power_bonus": 35,
    "power_contrib": 35,
    "catalog_description": "Alvará extraordinário da Chancelaria para masmorras de alto perigo.",
    "effects": [],
    "slot_role": "base",
    "name_modifier": "Laudo Pericial"
  },
  {
    "id": "part_crown_lic_submerged",
    "part_id": "part_crown_lic_submerged",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Alvará de Operação Subaquática",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 130,
    "market_price_base": 130,
    "power_bonus": 15,
    "power_contrib": 15,
    "catalog_description": "Certidão notarial que habilita operações em ruínas alagadas e biomas aquáticos.",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "submerged_ruins"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Subaquático"
  },
  {
    "id": "part_crown_lic_arcane_fog",
    "part_id": "part_crown_lic_arcane_fog",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Laudo de Visibilidade Espectral",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 130,
    "market_price_base": 130,
    "power_bonus": 15,
    "power_contrib": 15,
    "catalog_description": "Atestado de navegação que dissipa as penalidades de névoas arcanas.",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "arcane_fog"
      },
      {
        "effect": "terrain_mitigation",
        "value": "thick_fog"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Espectral"
  },
  {
    "id": "part_crown_lic_lightning",
    "part_id": "part_crown_lic_lightning",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Certificado de Aterramento Voltaico",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 140,
    "market_price_base": 140,
    "power_bonus": 16,
    "power_contrib": 16,
    "catalog_description": "Garantia técnica de isolamento contra tempestades elétricas e picos voltaicos.",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "lightning_peaks"
      },
      {
        "effect": "terrain_mitigation",
        "value": "lightning_storm"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Voltaico"
  },
  {
    "id": "part_crown_lic_volcanic",
    "part_id": "part_crown_lic_volcanic",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Protocolo Termorregulador",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 135,
    "market_price_base": 135,
    "power_bonus": 15,
    "power_contrib": 15,
    "catalog_description": "Normativa oficial de refrigeração e isolamento contra calor vulcânico extremo.",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "volcanic_heat"
      },
      {
        "effect": "terrain_mitigation",
        "value": "scorching_heat"
      }
    ],
    "slot_role": "suffix",
    "name_modifier": "Termorregulador"
  },
  {
    "id": "part_crown_lic_acid_rain",
    "part_id": "part_crown_lic_acid_rain",
    "corp_id": "corp_crown_notarial",
    "brand_id": "corp_crown_notarial",
    "name": "Apólice contra Danos Corrosivos",
    "branch": "Ferragem",
    "part_type": "seal",
    "compatible_slots": [
      "Alvará de Risco"
    ],
    "tier": 2,
    "base_cost": 125,
    "market_price_base": 125,
    "power_bonus": 14,
    "power_contrib": 14,
    "catalog_description": "Seguro patrimonial que neutraliza corrosão ácida e desgastes químicos.",
    "effects": [
      {
        "effect": "terrain_mitigation",
        "value": "acid_rain"
      }
    ],
    "slot_role": "prefix",
    "name_modifier": "Anticorrosivo"
  }
]

const staticPartIds = new Set(STATIC_MOCK_MODULAR_PARTS.map(part => part.part_id || part.id))

export const MOCK_MODULAR_PARTS: ModularPart[] = [
  ...STATIC_MOCK_MODULAR_PARTS,
  ...partsSeed
    .filter(
      part =>
        (part.corp_id === 'corp_mercurius' || part.corp_id === 'corp_crown_rations') &&
        !staticPartIds.has(part.part_id || part.id)
    )
    .map(part => ({ ...part, slot_role: part.slot_role as ModularPart['slot_role'] })),
]

export const CORPORATIONS_MAP: Record<string, { id: string; name: string; tag: string; specialty: string }> = {
  corp_goblin_eng: { id: 'corp_goblin_eng', name: 'Engenharia Goblin S.A.', tag: 'goblin', specialty: 'Armamento de choque e sobrecarga' },
  corp_elf_precision: { id: 'corp_elf_precision', name: 'Consórcio Élfico de Precisão', tag: 'elf', specialty: 'Gemas e ligas criogênicas' },
  corp_dwarf_steel: { id: 'corp_dwarf_steel', name: 'Irmãos Anões de Aço', tag: 'dwarf', specialty: 'Blindagem pesada e ancoragem subterrânea' },
  corp_swamp_alchemy: { id: 'corp_swamp_alchemy', name: 'Sindicato Alquímico do Pântano', tag: 'swamp', specialty: 'Soluções bio-reativas e filtros' },
  corp_crown_notarial: { id: 'corp_crown_notarial', name: 'Chancelaria Notarial da Coroa', tag: 'crown', specialty: 'Componentes chancelados pela Coroa' },
  corp_aethelgard: { id: 'corp_aethelgard', name: 'Siderúrgica Real de Aethelgard', tag: 'aethelgard', specialty: 'Lâminas nobres temperadas' },
  corp_valkyria: { id: 'corp_valkyria', name: 'Consórcio Bélico Valkyria', tag: 'valkyria', specialty: 'Placas e guardas de vanguarda' },
  corp_flamel: { id: 'corp_flamel', name: 'Laboratórios Herméticos Flamel', tag: 'flamel', specialty: 'Catalisadores alquímicos e ampolas' },
  corp_chancellor: { id: 'corp_chancellor', name: 'Câmara Imperial dos Chanceleres', tag: 'chancellor', specialty: 'Joalheria heráldica imperial' },
  corp_generic: { id: 'corp_generic', name: 'Manufatura Padrão do Reino', tag: 'generic', specialty: 'Componentes fabris gerais' },
}
