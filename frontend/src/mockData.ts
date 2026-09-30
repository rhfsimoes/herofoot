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

export interface ExpeditionLootItem {
  material_id?: string
  name: string
  quantity: number
  rarity?: string
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
  branch: WorkshopBranch | string
  part_type: 'blade' | 'hilt' | 'guard' | 'plating' | 'filter' | 'core' | 'gem' | string
  compatible_slots: ('Arma' | 'Armadura' | 'Joia' | 'Inscrição' | 'Consumível' | string)[]
  tier: number
  base_cost: number
  market_price_base?: number
  power_bonus?: number
  power_contrib?: number
  energy_bonus?: number
  catalog_description?: string
  effects?: { effect: string; value?: number; requires_quality?: string }[]
}

export interface B2BShipmentItem {
  part_id: string
  quantity: number
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
    { material_id: 'mat_mana_crystal', name: 'Cristal de Mana', quantity: 2, rarity: 'Raro' },
    { material_id: 'mat_scaly_leather', name: 'Couro Escamoso', quantity: 3, rarity: 'Comum' },
    { material_id: 'mat_iron_ore', name: 'Minério de Ferro', quantity: 4, rarity: 'Comum' },
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
  // 1. Goblin S.A.
  {
    contract_id: 'b2b_goblin_bronze',
    corp_id: 'corp_goblin_eng',
    tier: 'Bronze',
    title: 'Fornecimento Rápido Goblin - Padrão Bronze',
    weekly_royalty: 60,
    is_exclusive: false,
    discount_pct: 0.10,
    weekly_shipment: [
      { part_id: 'part_gob_blade_01', quantity: 2 },
      { part_id: 'part_gob_hilt_01', quantity: 1 }
    ],
    description: 'Remessa semanal de lâminas dentadas e empunhaduras de fricção rápida.'
  },
  {
    contract_id: 'b2b_goblin_silver',
    corp_id: 'corp_goblin_eng',
    tier: 'Prata',
    title: 'Homologação de Impacto Goblin - Nível Prata',
    weekly_royalty: 120,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_gob_blade_02', quantity: 2 },
      { part_id: 'part_gob_core_02', quantity: 1 }
    ],
    description: 'Cota regular de lâminas predatórias e disjuntores de sobrecarga calculada.'
  },
  {
    contract_id: 'b2b_goblin_gold',
    corp_id: 'corp_goblin_eng',
    tier: 'Ouro',
    title: 'Pacto Bélico de Alta Detonação - Parceiro Ouro',
    weekly_royalty: 200,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_gob_blade_03', quantity: 2 },
      { part_id: 'part_gob_core_01', quantity: 1 }
    ],
    description: 'Exclusividade contratual com Engenharia Goblin S.A. Proíbe relações com o Consórcio Élfico.'
  },
  // 2. Consórcio Élfico
  {
    contract_id: 'b2b_elf_bronze',
    corp_id: 'corp_elf_precision',
    tier: 'Bronze',
    title: 'Convênio Lapidação Básica - Padrão Bronze',
    weekly_royalty: 70,
    is_exclusive: false,
    discount_pct: 0.10,
    weekly_shipment: [
      { part_id: 'part_elf_gem_01', quantity: 2 },
      { part_id: 'part_elf_filter_01', quantity: 1 }
    ],
    description: 'Remessa regular de gemas focalizadoras e refinadores gustativos élficos.'
  },
  {
    contract_id: 'b2b_elf_silver',
    corp_id: 'corp_elf_precision',
    tier: 'Prata',
    title: 'Fornecimento de Alta Frequência - Nível Prata',
    weekly_royalty: 130,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_elf_gem_02', quantity: 2 },
      { part_id: 'part_elf_blade_01', quantity: 1 }
    ],
    description: 'Lote de safiras penitenciais e lâminas temperadas a frio élfico.'
  },
  {
    contract_id: 'b2b_elf_gold',
    corp_id: 'corp_elf_precision',
    tier: 'Ouro',
    title: 'Aliança Estratégica Élfica de Platina - Parceiro Ouro',
    weekly_royalty: 220,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_elf_gem_04', quantity: 2 },
      { part_id: 'part_elf_core_01', quantity: 1 }
    ],
    description: 'Exclusividade de alto escalão com o Consórcio Élfico. Embarga convênios com Engenharia Goblin S.A.'
  },
  // 3. Anões de Aço Negro
  {
    contract_id: 'b2b_dwarf_bronze',
    corp_id: 'corp_dwarf_steel',
    tier: 'Bronze',
    title: 'Fundição de Cidadela - Padrão Bronze',
    weekly_royalty: 65,
    is_exclusive: false,
    discount_pct: 0.10,
    weekly_shipment: [
      { part_id: 'part_dwarf_plating_01', quantity: 2 },
      { part_id: 'part_dwarf_core_01', quantity: 1 }
    ],
    description: 'Placas reforçadas e âncoras gravitacionais forjadas no abismo anão.'
  },
  {
    contract_id: 'b2b_dwarf_silver',
    corp_id: 'corp_dwarf_steel',
    tier: 'Prata',
    title: 'Couraça de Rocha Negra - Nível Prata',
    weekly_royalty: 125,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_dwarf_plating_03', quantity: 2 },
      { part_id: 'part_dwarf_plating_06', quantity: 1 }
    ],
    description: 'Blindagens maciças de minério negro e reforços torácicos com apólice integrada.'
  },
  {
    contract_id: 'b2b_dwarf_gold',
    corp_id: 'corp_dwarf_steel',
    tier: 'Ouro',
    title: 'Pacto Subterrâneo Ouro de Aço Negro - Parceiro Ouro',
    weekly_royalty: 210,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_dwarf_plating_04', quantity: 2 },
      { part_id: 'part_dwarf_plating_05', quantity: 1 }
    ],
    description: 'Exclusividade de metalurgia pesada da Cidadela. Veda contratos com o Sindicato de Pântano.'
  },
  // 4. Alquimistas de Pântano
  {
    contract_id: 'b2b_swamp_bronze',
    corp_id: 'corp_swamp_alchemy',
    tier: 'Bronze',
    title: 'Destilados do Charco - Padrão Bronze',
    weekly_royalty: 55,
    is_exclusive: false,
    discount_pct: 0.10,
    weekly_shipment: [
      { part_id: 'part_swamp_filter_01', quantity: 2 },
      { part_id: 'part_swamp_core_01', quantity: 1 }
    ],
    description: 'Filtros decantadores e filtros neutralizadores de miasmas virulentos.'
  },
  {
    contract_id: 'b2b_swamp_silver',
    corp_id: 'corp_swamp_alchemy',
    tier: 'Prata',
    title: 'Farmacologia de Miasma - Nível Prata',
    weekly_royalty: 115,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_swamp_filter_03', quantity: 2 },
      { part_id: 'part_swamp_core_02', quantity: 1 }
    ],
    description: 'Dosadores graduados e injetores químicos certificados pelos boticários de pântano.'
  },
  {
    contract_id: 'b2b_swamp_gold',
    corp_id: 'corp_swamp_alchemy',
    tier: 'Ouro',
    title: 'Concessão Hermética de Pântano - Parceiro Ouro',
    weekly_royalty: 195,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_swamp_gem_01', quantity: 2 },
      { part_id: 'part_swamp_core_03', quantity: 1 }
    ],
    description: 'Exclusividade sobre reativos de pântano. Incompatível com acordos dos Irmãos Anões de Aço Negro.'
  },
  // 5. Manufatura Notarial da Coroa
  {
    contract_id: 'b2b_crown_bronze',
    corp_id: 'corp_crown_notarial',
    tier: 'Bronze',
    title: 'Padronização Régia - Padrão Bronze',
    weekly_royalty: 50,
    is_exclusive: false,
    discount_pct: 0.10,
    weekly_shipment: [
      { part_id: 'part_crown_plating_01', quantity: 2 },
      { part_id: 'part_crown_gem_01', quantity: 1 }
    ],
    description: 'Linha branca de couro escamado e ágatas notariais universais da Fazenda Real.'
  },
  {
    contract_id: 'b2b_crown_silver',
    corp_id: 'corp_crown_notarial',
    tier: 'Prata',
    title: 'Certificação Notarial - Nível Prata',
    weekly_royalty: 110,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_crown_plating_02', quantity: 2 },
      { part_id: 'part_crown_core_02', quantity: 1 }
    ],
    description: 'Braçadeiras chanceladas por laudo e selos rúnicos de alvará de funcionamento.'
  },
  {
    contract_id: 'b2b_crown_gold',
    corp_id: 'corp_crown_notarial',
    tier: 'Ouro',
    title: 'Chancela Régia Imperial - Parceiro Ouro',
    weekly_royalty: 185,
    is_exclusive: false,
    discount_pct: 0.20,
    weekly_shipment: [
      { part_id: 'part_crown_core_01', quantity: 2 },
      { part_id: 'part_crown_hilt_02', quantity: 1 }
    ],
    description: 'Convênio nobre da Coroa. Totalmente compatível com todas as corporações do continente.'
  },
  // 6. Aethelgard & Valkyria & Chanceler (Compatibilidade de Testes)
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
  },
  {
    contract_id: 'b2b_aethelgard_gold',
    corp_id: 'corp_aethelgard',
    tier: 'Ouro',
    title: 'Aliança Estratégica Aethelgard - Parceiro Ouro',
    weekly_royalty: 180,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_aethelgard_blade', quantity: 3 },
      { part_id: 'part_aethelgard_hilt', quantity: 3 }
    ],
    description: 'Contrato exclusivo com Aethelgard. Proíbe parcerias com o Consórcio Bélico Valkyria.'
  },
  {
    contract_id: 'b2b_valkyria_gold',
    corp_id: 'corp_valkyria',
    tier: 'Ouro',
    title: 'Consórcio Bélico Valkyria - Parceiro Ouro',
    weekly_royalty: 190,
    is_exclusive: true,
    discount_pct: 0.25,
    weekly_shipment: [
      { part_id: 'part_valkyria_guard', quantity: 3 },
      { part_id: 'part_valkyria_plate', quantity: 2 }
    ],
    description: 'Exclusividade contratual Valkyria. Incompatível com acordos da Siderúrgica Aethelgard.'
  },
  {
    contract_id: 'b2b_flamel_standard',
    corp_id: 'corp_flamel',
    tier: 'Prata',
    title: 'Homologação de Destilados Flamel - Nível Prata',
    weekly_royalty: 80,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_flamel_catalyst', quantity: 2 },
      { part_id: 'part_flamel_vial', quantity: 4 }
    ],
    description: 'Abastecimento semanal de frascos graduados e catalisadores certificados pela Guilda de Boticários.'
  },
  {
    contract_id: 'b2b_chancellor_silver',
    corp_id: 'corp_chancellor',
    tier: 'Prata',
    title: 'Fornecimento de Gemas Chanceler - Nível Prata',
    weekly_royalty: 120,
    is_exclusive: false,
    discount_pct: 0.15,
    weekly_shipment: [
      { part_id: 'part_chancellor_core', quantity: 2 }
    ],
    description: 'Remessa de núcleos de safira polida para confecção seriada de amuletos corporativos.'
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

export const MOCK_MODULAR_PARTS: ModularPart[] = [
  // Goblin S.A.
  {
    id: 'part_gob_blade_01',
    part_id: 'part_gob_blade_01',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Lâmina Dentada de Fricção Rápida',
    branch: 'Ferragem',
    part_type: 'blade',
    compatible_slots: ['Arma'],
    tier: 1,
    base_cost: 75,
    market_price_base: 75,
    power_bonus: 15,
    catalog_description: 'Peça cortante agressiva com dentes de aço endurecido.',
    effects: [{ effect: 'power_pct', value: 0.1 }]
  },
  {
    id: 'part_gob_blade_02',
    part_id: 'part_gob_blade_02',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Lâmina Predatória de Aço Farpado',
    branch: 'Ferragem',
    part_type: 'blade',
    compatible_slots: ['Arma'],
    tier: 2,
    base_cost: 180,
    market_price_base: 180,
    power_bonus: 30,
    catalog_description: 'Gume duplo serrilhado desenvolvido para corte profundo.',
    effects: [{ effect: 'power_pct', value: 0.18 }]
  },
  {
    id: 'part_gob_blade_03',
    part_id: 'part_gob_blade_03',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Gume Guilhotina de Demissão Sumária',
    branch: 'Ferragem',
    part_type: 'blade',
    compatible_slots: ['Arma'],
    tier: 3,
    base_cost: 380,
    market_price_base: 380,
    power_bonus: 50,
    catalog_description: 'Lâmina de impacto massivo projetada para rescisão definitiva de debates.',
    effects: [{ effect: 'power_flat', value: 7 }, { effect: 'power_pct', value: 0.2 }]
  },
  {
    id: 'part_gob_hilt_01',
    part_id: 'part_gob_hilt_01',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Empunhadura Sem Guarda de Risco',
    branch: 'Ferragem',
    part_type: 'hilt',
    compatible_slots: ['Arma'],
    tier: 2,
    base_cost: 160,
    market_price_base: 160,
    power_bonus: 15,
    catalog_description: 'Empunhadura leve que prioriza velocidade sobre proteção das mãos.',
    effects: [{ effect: 'power_flat', value: 5 }]
  },
  {
    id: 'part_gob_core_01',
    part_id: 'part_gob_core_01',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Câmara de Detonação Magmática',
    branch: 'Ferragem',
    part_type: 'core',
    compatible_slots: ['Inscrição', 'Arma'],
    tier: 3,
    base_cost: 320,
    market_price_base: 320,
    power_bonus: 40,
    catalog_description: 'Módulo propulsor que injeta faíscas incandescentes em cada golpe.',
    effects: [{ effect: 'power_pct', value: 0.2 }, { effect: 'power_flat', value: 4 }]
  },
  {
    id: 'part_gob_core_02',
    part_id: 'part_gob_core_02',
    corp_id: 'corp_goblin_eng',
    brand_id: 'corp_goblin_eng',
    name: 'Disjuntor de Sobrecarga Calculada',
    branch: 'Ferragem',
    part_type: 'core',
    compatible_slots: ['Arma'],
    tier: 2,
    base_cost: 210,
    market_price_base: 210,
    power_bonus: 25,
    catalog_description: 'Circuito que descarrega energia arcana concentrada sob impacto.',
    effects: [{ effect: 'power_flat', value: 4 }]
  },

  // Consórcio Élfico
  {
    id: 'part_elf_gem_01',
    part_id: 'part_elf_gem_01',
    corp_id: 'corp_elf_precision',
    brand_id: 'corp_elf_precision',
    name: 'Gema Focalizadora de Cristal Élfico',
    branch: 'Joalheria',
    part_type: 'gem',
    compatible_slots: ['Joia', 'Arma'],
    tier: 1,
    base_cost: 130,
    market_price_base: 130,
    power_bonus: 20,
    catalog_description: 'Cristal límpido facetado sob rigorosas métricas arcanas.',
    effects: [{ effect: 'power_pct', value: 0.12 }]
  },
  {
    id: 'part_elf_gem_02',
    part_id: 'part_elf_gem_02',
    corp_id: 'corp_elf_precision',
    brand_id: 'corp_elf_precision',
    name: 'Safira Penitencial de Alta Frequência',
    branch: 'Joalheria',
    part_type: 'gem',
    compatible_slots: ['Joia'],
    tier: 2,
    base_cost: 240,
    market_price_base: 240,
    power_bonus: 35,
    catalog_description: 'Gema ressonante que amplifica campos mágicos com pureza acústica.',
    effects: [{ effect: 'power_pct', value: 0.22 }]
  },
  {
    id: 'part_elf_blade_01',
    part_id: 'part_elf_blade_01',
    corp_id: 'corp_elf_precision',
    brand_id: 'corp_elf_precision',
    name: 'Lâmina Temperada a Frio Élfico',
    branch: 'Ferragem',
    part_type: 'blade',
    compatible_slots: ['Arma'],
    tier: 2,
    base_cost: 190,
    market_price_base: 190,
    power_bonus: 28,
    catalog_description: 'Aço tratado em vapores boreais para minimizar atrito e vibração.',
    effects: [{ effect: 'power_pct', value: 0.15 }]
  },
  {
    id: 'part_elf_core_01',
    part_id: 'part_elf_core_01',
    corp_id: 'corp_elf_precision',
    brand_id: 'corp_elf_precision',
    name: 'Núcleo Criogênico Boreal',
    branch: 'Ferragem',
    part_type: 'core',
    compatible_slots: ['Inscrição', 'Armadura'],
    tier: 3,
    base_cost: 330,
    market_price_base: 330,
    power_bonus: 30,
    catalog_description: 'Emissor rúnico de resfriamento constante com blindagem glacial.',
    effects: [{ effect: 'power_flat', value: 3 }]
  },

  // Anões de Aço Negro
  {
    id: 'part_dwarf_plating_01',
    part_id: 'part_dwarf_plating_01',
    corp_id: 'corp_dwarf_steel',
    brand_id: 'corp_dwarf_steel',
    name: 'Placa Reforçada de Aço Anão',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 1,
    base_cost: 85,
    market_price_base: 85,
    power_bonus: 20,
    catalog_description: 'Chapa de ferro fundido nas forjas geotérmicas da Cidadela.',
    effects: [{ effect: 'power_pct', value: 0.1 }]
  },
  {
    id: 'part_dwarf_plating_03',
    part_id: 'part_dwarf_plating_03',
    corp_id: 'corp_dwarf_steel',
    brand_id: 'corp_dwarf_steel',
    name: 'Couraça Maciça de Minério Negro',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 2,
    base_cost: 210,
    market_price_base: 210,
    power_bonus: 35,
    catalog_description: 'Blindagem espessa prensada com rebites reforçados de aço escuro.',
    effects: [{ effect: 'power_flat', value: 6 }]
  },
  {
    id: 'part_dwarf_plating_04',
    part_id: 'part_dwarf_plating_04',
    corp_id: 'corp_dwarf_steel',
    brand_id: 'corp_dwarf_steel',
    name: 'Blindagem Impenetrável da Cidadela',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 3,
    base_cost: 390,
    market_price_base: 390,
    power_bonus: 55,
    catalog_description: 'O ápice da metalurgia subterrânea: absorve qualquer impacto convencional.',
    effects: [{ effect: 'power_flat', value: 8 }, { effect: 'power_pct', value: 0.12 }]
  },
  {
    id: 'part_dwarf_core_01',
    part_id: 'part_dwarf_core_01',
    corp_id: 'corp_dwarf_steel',
    brand_id: 'corp_dwarf_steel',
    name: 'Âncora Gravitacional de Minas',
    branch: 'Ferragem',
    part_type: 'core',
    compatible_slots: ['Inscrição', 'Armadura'],
    tier: 1,
    base_cost: 125,
    market_price_base: 125,
    power_bonus: 15,
    catalog_description: 'Mecanismo giroscópico que estabiliza a postura em terrenos acidentados.',
    effects: [{ effect: 'power_flat', value: 2 }]
  },

  // Alquimistas de Pântano
  {
    id: 'part_swamp_filter_01',
    part_id: 'part_swamp_filter_01',
    corp_id: 'corp_swamp_alchemy',
    brand_id: 'corp_swamp_alchemy',
    name: 'Filtro Decantador Concentrado',
    branch: 'Alquimia',
    part_type: 'filter',
    compatible_slots: ['Consumível'],
    tier: 1,
    base_cost: 75,
    market_price_base: 75,
    power_bonus: 10,
    energy_bonus: 12,
    catalog_description: 'Membrana de decantação que purifica compostos orgânicos em suspensão.',
    effects: [{ effect: 'energy_flat', value: 8 }]
  },
  {
    id: 'part_swamp_filter_03',
    part_id: 'part_swamp_filter_03',
    corp_id: 'corp_swamp_alchemy',
    brand_id: 'corp_swamp_alchemy',
    name: 'Dosador Graduado de Prontuário',
    branch: 'Alquimia',
    part_type: 'filter',
    compatible_slots: ['Consumível'],
    tier: 2,
    base_cost: 175,
    market_price_base: 175,
    power_bonus: 18,
    energy_bonus: 20,
    catalog_description: 'Válvula de administração contínua de elixires de sustentação.',
    effects: [{ effect: 'energy_flat', value: 12 }]
  },
  {
    id: 'part_swamp_core_01',
    part_id: 'part_swamp_core_01',
    corp_id: 'corp_swamp_alchemy',
    brand_id: 'corp_swamp_alchemy',
    name: 'Filtro Neutralizador de Miasma',
    branch: 'Alquimia',
    part_type: 'core',
    compatible_slots: ['Inscrição', 'Consumível'],
    tier: 1,
    base_cost: 120,
    market_price_base: 120,
    power_bonus: 15,
    catalog_description: 'Filtro de carvão ativado com extratos de cipreste para conter vapores tóxicos.',
    effects: [{ effect: 'power_flat', value: 3 }]
  },

  // Manufatura Notarial da Coroa
  {
    id: 'part_crown_plating_01',
    part_id: 'part_crown_plating_01',
    corp_id: 'corp_crown_notarial',
    brand_id: 'corp_crown_notarial',
    name: 'Couro Escamado Padrão Fazenda Real',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 1,
    base_cost: 90,
    market_price_base: 90,
    power_bonus: 18,
    catalog_description: 'Revestimento flexível certificado pelo departamento fazendário.',
    effects: [{ effect: 'power_pct', value: 0.15 }]
  },
  {
    id: 'part_crown_plating_02',
    part_id: 'part_crown_plating_02',
    corp_id: 'corp_crown_notarial',
    brand_id: 'corp_crown_notarial',
    name: 'Braçadeira Chancelada por Laudo',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 2,
    base_cost: 200,
    market_price_base: 200,
    power_bonus: 30,
    catalog_description: 'Peça estandardizada gravada com sinete oficial de conformidade técnica.',
    effects: [{ effect: 'power_flat', value: 4 }]
  },
  {
    id: 'part_crown_hilt_02',
    part_id: 'part_crown_hilt_02',
    corp_id: 'corp_crown_notarial',
    brand_id: 'corp_crown_notarial',
    name: 'Guarda-Mão de Cláusula Rescisória',
    branch: 'Ferragem',
    part_type: 'hilt',
    compatible_slots: ['Arma'],
    tier: 2,
    base_cost: 185,
    market_price_base: 185,
    power_bonus: 22,
    catalog_description: 'Guarda simétrica com travamento seguro e ergonomia homologada.',
    effects: [{ effect: 'power_pct', value: 0.12 }]
  },

  // Peças Siderúrgica Aethelgard & Consórcio Valkyria (Testes e Compatibilidade)
  {
    id: 'part_aethelgard_blade',
    part_id: 'part_aethelgard_blade',
    corp_id: 'corp_aethelgard',
    brand_id: 'corp_aethelgard',
    name: 'Lâmina Forjada Aethelgard',
    branch: 'Ferragem',
    part_type: 'blade',
    compatible_slots: ['Arma'],
    tier: 1,
    base_cost: 50,
    market_price_base: 50,
    power_bonus: 25,
    catalog_description: 'Lâmina de corte preciso temperada nas fundições de Aethelgard.',
    effects: [{ effect: 'power_flat', value: 5 }]
  },
  {
    id: 'part_aethelgard_hilt',
    part_id: 'part_aethelgard_hilt',
    corp_id: 'corp_aethelgard',
    brand_id: 'corp_aethelgard',
    name: 'Empunhadura Padrão Aethelgard',
    branch: 'Ferragem',
    part_type: 'hilt',
    compatible_slots: ['Arma'],
    tier: 1,
    base_cost: 40,
    market_price_base: 40,
    power_bonus: 10,
    catalog_description: 'Guarda de couro trançado com contrapeso balanceado.',
    effects: [{ effect: 'power_flat', value: 2 }]
  },
  {
    id: 'part_valkyria_guard',
    part_id: 'part_valkyria_guard',
    corp_id: 'corp_valkyria',
    brand_id: 'corp_valkyria',
    name: 'Guarda Articulada Valkyria',
    branch: 'Ferragem',
    part_type: 'guard',
    compatible_slots: ['Arma', 'Armadura'],
    tier: 1,
    base_cost: 60,
    market_price_base: 60,
    power_bonus: 15,
    catalog_description: 'Mecanismo defensivo de absorção de impacto do Consórcio Bélico.',
    effects: [{ effect: 'power_flat', value: 3 }]
  },
  {
    id: 'part_valkyria_plate',
    part_id: 'part_valkyria_plate',
    corp_id: 'corp_valkyria',
    brand_id: 'corp_valkyria',
    name: 'Placa Estriada Valkyria',
    branch: 'Ferragem',
    part_type: 'plating',
    compatible_slots: ['Armadura'],
    tier: 1,
    base_cost: 70,
    market_price_base: 70,
    power_bonus: 20,
    catalog_description: 'Chapa estriada para deflexão de projéteis e golpes perfurantes.',
    effects: [{ effect: 'power_flat', value: 4 }]
  },
  {
    id: 'part_flamel_catalyst',
    part_id: 'part_flamel_catalyst',
    corp_id: 'corp_flamel',
    brand_id: 'corp_flamel',
    name: 'Catalisador de Regeneração Flamel',
    branch: 'Alquimia',
    part_type: 'core',
    compatible_slots: ['Consumível'],
    tier: 1,
    base_cost: 80,
    market_price_base: 80,
    power_bonus: 15,
    catalog_description: 'Reativo químico que acelera a cicatrização celular em campo.',
    effects: [{ effect: 'energy_flat', value: 10 }]
  }
]



