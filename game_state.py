"""
HeroFoot GameState Module.
Contém a classe GameState e o rastreamento de campos serializáveis e transientes.
"""

import os
import json
from constants import normalize_branch
from balance import get_balance

from typing import Optional, Dict, Any, List
import copy

SERIALIZED_FIELDS = [
    "world_seed",
    "day",
    "week",
    "season",
    "gold",
    "team",
    "inventory",
    "showcase",
    "pending_offers",
    "current_phase",
    "starters",
    "reserves",
    "loadout",
    "workshop_levels",
    "workshop_xp",
    "materials",
    "known_affixes",
    "known_recipes",
    "catalog_version",
    "medical_level",
    "pending_contract_renewals",
    "youth_academy",
    "transfer_market_listings",
    "crown_goals",
    "last_expedition_starters",
    "weekly_sales_revenue",
    "contractor_confidence",
    "active_event",
    "resolved_events_history",
    "supplies_bonus",
    "active_b2b_contracts",
    "assembly_line_workers",
    "corporate_exclusivity_tags",
    "warehouse_parts",
    "brand_xp",
    "b2b_slots_locked",
    "spot_purchases_this_week",
    "weekly_sales_count",
    "weekly_sales_cash_collected",
    "weekly_market_expenses",
    "weekly_contract_signing_expenses",
    "weekly_hiring_expenses",
    "guild_name",
    "consecutive_negative_gold_weeks",
    "game_over",
    "game_over_reason",
    "season_completed",
    "season_outcome",
]

TRANSIENT_FIELDS = [
    "last_match_result",
    "last_round_results",
    "current_dungeon",
    "active_save_slot",
    "last_expedition_loot",
    "last_financial_statement",
]


class GameState:
    def __init__(self, world_seed: int = 1337):
        self.world_seed = world_seed
        self.day = 1               # Rodada / Semana do campeonato
        self.week = 1              # Sinônimo canônico de rodada
        self.season = 1            # Temporada anual da Liga
        self.gold = 1000
        self.medical_level = 1     # Nível do Departamento de Saúde & Bem-Estar Ocupacional (1 a 5)
        self.pending_contract_renewals = []  # Heróis aguardando renovação contratual
        self.youth_academy = []    # Aprendizes em formação na Academia de Base
        self.transfer_market_listings = []  # Aventureiros disponíveis para transferência/contratação
        self.crown_goals = {}      # Metas da Coroa e diretrizes trimestrais
        self.team = []             # Lista de heróis contratados
        self.inventory = []        # Itens no almoxarifado
        self.showcase = []         # Itens em negociação
        self.pending_offers = {}   # Contrapropostas pendentes: offer_id → {price, item}
        self.current_phase = 1

        # Tática e Loadout dos 5 Slots da Expedição
        self.starters = []         # IDs dos heróis titulares (máx 6)
        self.reserves = []         # IDs dos heróis reservas (máx 3)
        self.loadout = {
    "Arsenal Ofensivo": None,
    "Blindagem Operacional": None,
    "Ativo de Performance": None,
    "Alvará de Risco": None,
    "Provisão Logística": None,
}

        # Níveis de especialização por ramo da oficina (Níveis 1 a 6)
        self.workshop_levels = {
            "Ferragem": 1,
            "Alquimia": 1,
            "Joalheria": 1,
            "Culinária": 1,
        }
        self.workshop_xp = {
            "Ferragem": 0,
            "Alquimia": 0,
            "Joalheria": 0,
            "Culinária": 0,
        }
        self.materials = {}        # {"mat_id": quantidade}

        # Crafting v2
        self.known_affixes = []
        self.known_recipes = []
        self.catalog_version = 1

        # DRE e Expedição
        self.last_expedition_starters = []
        self.weekly_sales_revenue = 0
        self.contractor_confidence = 75  # Confiança da Contratante/Conselho (0 a 100)

        # Incidentes Corporativos Interativos (v0.5.0)
        self.active_event: Optional[Dict[str, Any]] = None
        self.resolved_events_history: List[str] = []
        self.supplies_bonus: int = 0

        # Pivot B2B & Linha de Montagem Modular (v0.7.0)
        self.active_b2b_contracts: List[Dict[str, Any]] = []
        self.assembly_line_workers: List[Dict[str, Any]] = []
        self.corporate_exclusivity_tags: List[str] = []
        self.warehouse_parts: Dict[str, int] = {}
        self.brand_xp: Dict[str, int] = {}
        self.b2b_slots_locked: int = 0
        self.spot_purchases_this_week: Dict[str, int] = {}
        self.weekly_sales_count: int = 0
        self.weekly_sales_cash_collected: int = 0
        self.weekly_market_expenses: int = 0
        self.weekly_contract_signing_expenses: int = 0
        self.weekly_hiring_expenses: int = 0

        # Identidade e Stakes de Falência e Temporada
        self.guild_name: str = "Guilda do Jogador"
        self.consecutive_negative_gold_weeks: int = 0
        self.game_over: bool = False
        self.game_over_reason: Optional[str] = None
        self.season_completed: bool = False
        self.season_outcome: Optional[Dict[str, Any]] = None

        # Campos transientes de execução
        self.last_match_result = None
        self.last_round_results = None
        self.current_dungeon = None
        self.active_save_slot = None
        self.last_expedition_loot = []
        self.last_financial_statement = {}

        self.load_initial_data()

    def to_dict(self) -> dict:
        """Serializa todos os campos de SERIALIZED_FIELDS."""
        data = {}
        for field in SERIALIZED_FIELDS:
            data[field] = copy.deepcopy(getattr(self, field, None))
        return data

    def from_dict(self, data: dict):
        """Restaura todos os campos de SERIALIZED_FIELDS a partir de um dicionário."""
        if not isinstance(data, dict):
            return self
        for field in SERIALIZED_FIELDS:
            if field in data:
                setattr(self, field, copy.deepcopy(data[field]))
        if not hasattr(self, "active_event"):
            self.active_event = None
        if not hasattr(self, "resolved_events_history") or not isinstance(self.resolved_events_history, list):
            self.resolved_events_history = []
        if not hasattr(self, "supplies_bonus"):
            self.supplies_bonus = 0
        if not hasattr(self, "workshop_xp") or not isinstance(self.workshop_xp, dict):
            self.workshop_xp = {
                "Ferragem": 0,
                "Alquimia": 0,
                "Joalheria": 0,
                "Culinária": 0,
            }
        else:
            for b in ["Ferragem", "Alquimia", "Joalheria", "Culinária"]:
                if b not in self.workshop_xp:
                    self.workshop_xp[b] = 0
        if not hasattr(self, "active_b2b_contracts") or not isinstance(self.active_b2b_contracts, list):
            self.active_b2b_contracts = []
        if not hasattr(self, "assembly_line_workers") or not isinstance(self.assembly_line_workers, list):
            self.assembly_line_workers = []
        if not hasattr(self, "corporate_exclusivity_tags") or not isinstance(self.corporate_exclusivity_tags, list):
            self.corporate_exclusivity_tags = []
        if not hasattr(self, "warehouse_parts") or not isinstance(self.warehouse_parts, dict):
            self.warehouse_parts = {}
        if not hasattr(self, "brand_xp") or not isinstance(self.brand_xp, dict):
            self.brand_xp = {}
        if not hasattr(self, "b2b_slots_locked"):
            self.b2b_slots_locked = 0
        if not hasattr(self, "spot_purchases_this_week") or not isinstance(self.spot_purchases_this_week, dict):
            self.spot_purchases_this_week = {}
        if not hasattr(self, "weekly_sales_count"):
            self.weekly_sales_count = 0
        if not hasattr(self, "weekly_sales_cash_collected"):
            self.weekly_sales_cash_collected = 0
        if not hasattr(self, "weekly_market_expenses"):
            self.weekly_market_expenses = 0
        if not hasattr(self, "weekly_contract_signing_expenses"):
            self.weekly_contract_signing_expenses = 0
        if not hasattr(self, "weekly_hiring_expenses"):
            self.weekly_hiring_expenses = 0
        return self

    def get_spot_purchases_this_week(self, part_id: str) -> int:
        """Retorna o total de unidades de uma peça adquiridas no mercado spot no ciclo atual."""
        if not hasattr(self, "spot_purchases_this_week") or not isinstance(self.spot_purchases_this_week, dict):
            self.spot_purchases_this_week = {}
        return self.spot_purchases_this_week.get(part_id, 0)

    def record_spot_purchase(self, part_id: str, quantity: int) -> None:
        """Registra a compra spot de peças para controle da cota semanal anti-exploit."""
        if not hasattr(self, "spot_purchases_this_week") or not isinstance(self.spot_purchases_this_week, dict):
            self.spot_purchases_this_week = {}
        self.spot_purchases_this_week[part_id] = self.spot_purchases_this_week.get(part_id, 0) + quantity

    def reset_weekly_spot_purchases(self) -> None:
        """Reseta o teto semanal de aquisição spot no fechamento de ciclo."""
        self.spot_purchases_this_week = {}
        self.weekly_market_expenses = 0
        self.weekly_contract_signing_expenses = 0
        self.weekly_hiring_expenses = 0

    def get_brand_xp(self, corp_id: str) -> int:
        """Retorna os pontos de EXP comercial acumulados com a corporação."""
        if not hasattr(self, "brand_xp") or not isinstance(self.brand_xp, dict):
            self.brand_xp = {}
        return self.brand_xp.get(corp_id, 0)

    def get_brand_level(self, corp_id: str) -> int:
        """Nível de Relacionamento Comercial (1 a 10). Nível 1: 0-49, Nível 3: 100+ (Prata), Nível 7: 300+ (Ouro)."""
        xp = self.get_brand_xp(corp_id)
        return min(10, max(1, 1 + xp // 50))

    def add_brand_xp(self, corp_id: str, amount: int, rival_corp_id: Optional[str] = None):
        """Acumula Brand XP e aplica dreno proporcional de 30% na concorrente direta."""
        if not hasattr(self, "brand_xp") or not isinstance(self.brand_xp, dict):
            self.brand_xp = {}
        self.brand_xp[corp_id] = self.brand_xp.get(corp_id, 0) + amount
        if rival_corp_id and rival_corp_id in self.brand_xp:
            drain = max(1, int(amount * 0.30))
            self.brand_xp[rival_corp_id] = max(0, self.brand_xp[rival_corp_id] - drain)

    def load_initial_data(self):
        """Carrega dados iniciais a partir dos arquivos JSON na pasta data/."""
        data_path = os.path.join(os.path.dirname(__file__), 'data')

        # Time de aventureiros
        team_file = os.path.join(data_path, 'team.json')
        if os.path.exists(team_file):
            with open(team_file, 'r', encoding='utf-8') as f:
                try:
                    self.team = json.load(f)
                    balance = get_balance()
                    party_cfg = balance.get("party", {})
                    max_starters = party_cfg.get("starters", 6)
                    max_reserves = party_cfg.get("reserves", 3)

                    apt_heroes = [
                        h for h in self.team
                        if h.get("status") == "Apto" and not h.get("injured", False)
                    ]
                    apt_heroes.sort(
                        key=lambda h: h.get("current_power", h.get("power", 0)),
                        reverse=True
                    )
                    self.starters = [h["id"] for h in apt_heroes[:max_starters]]
                    self.reserves = [h["id"] for h in apt_heroes[max_starters:max_starters + max_reserves]]
                except Exception:
                    pass

        # Inventário e parâmetros da loja
        shop_file = os.path.join(data_path, 'shop_inventory_schema.json')
        if os.path.exists(shop_file):
            with open(shop_file, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    if "workshop_levels" in data:
                        for k, v in data["workshop_levels"].items():
                            norm_k = normalize_branch(k)
                            self.workshop_levels[norm_k] = v
                    if "materials_inventory" in data:
                        self.materials = data["materials_inventory"]
                    if "shop_gold" in data:
                        self.gold = data["shop_gold"]
                    if "crafted_items_inventory" in data:
                        self.inventory = data["crafted_items_inventory"]
                except Exception:
                    pass

        # Kit Inicial White-label da Coroa (Garante nenhum slot de expedição vazio)
        starter_whitelabel_items = [
            {
                "item_instance_id": "starter_white_label_offensive",
                "name": "Arsenal Padrão White-label",
                "slot_type": "Arsenal Ofensivo",
                "quality": "Normal",
                "power_bonus": 10,
                "market_value_base": 80,
                "corp_id": "corp_generic",
                "description": "Lote de armamento básico fornecido pela Coroa sem homologação de marca. Eficiência modesta, mas evita autuações por esquadrão desarmado.",
            },
            {
                "item_instance_id": "starter_white_label_defensive",
                "name": "Blindagem Coletiva White-label",
                "slot_type": "Blindagem Operacional",
                "quality": "Normal",
                "power_bonus": 8,
                "market_value_base": 70,
                "corp_id": "corp_generic",
                "description": "Equipamentos de Proteção Coletiva de chapa simples. Sem certificação de conforto operacional, porém em conformidade mínima.",
            },
            {
                "item_instance_id": "starter_white_label_performance",
                "name": "Ativo de Vigor White-label",
                "slot_type": "Ativo de Performance",
                "quality": "Normal",
                "power_bonus": 6,
                "market_value_base": 60,
                "corp_id": "corp_generic",
                "description": "Amuleto de liga de cobre de distribuição em massa. Concede incentivo anímico básico ao esquadrão sem custos de royalties.",
            },
            {
                "item_instance_id": "starter_white_label_license",
                "name": "Alvará Provisório White-label",
                "slot_type": "Alvará de Risco",
                "quality": "Normal",
                "power_bonus": 5,
                "market_value_base": 50,
                "corp_id": "corp_crown_notarial",
                "description": "Certidão de operação provisória emitida pelo cartório central. Atesta perante a Liga que a guilda possui licença de exploração ativa.",
            },
            {
                "item_instance_id": "starter_white_label_provision",
                "name": "Ração de Campanha White-label",
                "slot_type": "Provisão Logística",
                "quality": "Normal",
                "power_bonus": 5,
                "market_value_base": 40,
                "corp_id": "corp_generic",
                "description": "Fardamento de mantimentos secos padronizados. Sabor questionável, mas supre as necessidades calóricas básicas da força-tarefa.",
            },
        ]
        existing_ids = {it.get("item_instance_id") for it in self.inventory}
        for item in starter_whitelabel_items:
            if item["item_instance_id"] not in existing_ids:
                self.inventory.append(item)

        slot_item_map = {
            "Arsenal Ofensivo": "starter_white_label_offensive",
            "Blindagem Operacional": "starter_white_label_defensive",
            "Ativo de Performance": "starter_white_label_performance",
            "Alvará de Risco": "starter_white_label_license",
            "Provisão Logística": "starter_white_label_provision",
        }
        for slot, iid in slot_item_map.items():
            if not self.loadout.get(slot):
                self.loadout[slot] = iid

        # Catálogo Crafting v2: Afixos e Receitas iniciais com unlock.method == 'start'
        try:
            from catalog import get_catalog
            cat = get_catalog()
            self.catalog_version = cat.catalog_version
            self.known_affixes = [
                aid for aid, a in cat.affixes.items()
                if a.get("unlock", {}).get("method") == "start"
            ]
            self.known_recipes = [
                rid for rid, r in cat.recipes.items()
                if r.get("unlock", {}).get("method") == "start"
            ]
        except Exception:
            pass

        # Inicialização da Academia de Base e Bolsa de Transferências
        try:
            from services.hero_service import generate_hero
            import random
            rng = random.Random(self.world_seed)
            if not self.youth_academy:
                balance = get_balance()
                initial_youth = balance.get("academy", {}).get("initial_youth_count", 3)
                self.youth_academy = [generate_hero(is_youth=True, rng=rng) for _ in range(initial_youth)]
            if not self.transfer_market_listings:
                balance = get_balance()
                initial_listings = balance.get("transfer_market", {}).get("listings_count", 5)
                self.transfer_market_listings = [generate_hero(is_youth=False, rng=rng) for _ in range(initial_listings)]
            if not self.crown_goals:
                from services.crown_service import init_crown_goals
                init_crown_goals(self)
        except Exception:
            pass

    def is_equipped(self, item_instance_id: str) -> bool:
        """Verifica se um item do almoxarifado está equipado no loadout atual."""
        if not item_instance_id:
            return False
        for slot, item in self.loadout.items():
            if not item:
                continue
            if isinstance(item, dict) and item.get("item_instance_id") == item_instance_id:
                return True
            if item == item_instance_id:
                return True
        return False

    def hero_by_id(self, hero_id: str) -> dict | None:
        """Localiza um herói contratado pelo identificador único."""
        for hero in self.team:
            if hero.get("id") == hero_id:
                return hero
        return None

    def get_workshop_level(self, branch: str) -> int:
        norm_branch = normalize_branch(branch)
        return self.workshop_levels.get(norm_branch, 1)

    def get_workshop_xp(self, branch: str) -> int:
        norm_branch = normalize_branch(branch)
        if not hasattr(self, "workshop_xp") or not isinstance(self.workshop_xp, dict):
            self.workshop_xp = {
                "Ferragem": 0,
                "Alquimia": 0,
                "Joalheria": 0,
                "Culinária": 0,
            }
        return self.workshop_xp.get(norm_branch, 0)

    def has_materials_for(self, recipe: dict) -> bool:
        """Verifica se o jogador possui os insumos necessários para uma receita."""
        ingredients = recipe.get("ingredients")
        if ingredients is None:
            from catalog import get_catalog
            ingredients = get_catalog().get_recipe_ingredients(recipe.get("recipe_id", ""))
        for ingredient in ingredients:
            mat_id = ingredient.get("material_id") or ingredient.get("item_id")
            qty_needed = ingredient.get("quantity", 1)
            if self.materials.get(mat_id, 0) < qty_needed:
                return False
        return True

    def consume_materials(self, recipe: dict):
        """Consome os insumos da receita do inventário de materiais."""
        ingredients = recipe.get("ingredients")
        if ingredients is None:
            from catalog import get_catalog
            ingredients = get_catalog().get_recipe_ingredients(recipe.get("recipe_id", ""))
        for ingredient in ingredients:
            mat_id = ingredient.get("material_id") or ingredient.get("item_id")
            qty_needed = ingredient.get("quantity", 1)
            self.materials[mat_id] = max(0, self.materials.get(mat_id, 0) - qty_needed)

    def get_part_quantity(self, part_id: str) -> int:
        """Retorna o saldo em almoxarifado de uma peça modular."""
        if not hasattr(self, "warehouse_parts") or not isinstance(self.warehouse_parts, dict):
            self.warehouse_parts = {}
        return self.warehouse_parts.get(part_id, 0)

    def add_warehouse_part(self, part_id: str, quantity: int = 1):
        """Acrescenta peças modulares ao estoque do almoxarifado fabril."""
        if not hasattr(self, "warehouse_parts") or not isinstance(self.warehouse_parts, dict):
            self.warehouse_parts = {}
        self.warehouse_parts[part_id] = self.warehouse_parts.get(part_id, 0) + quantity

    def consume_warehouse_part(self, part_id: str, quantity: int = 1) -> bool:
        """Consome peças modulares do almoxarifado se houver estoque suficiente."""
        if not hasattr(self, "warehouse_parts") or not isinstance(self.warehouse_parts, dict):
            self.warehouse_parts = {}
        if self.warehouse_parts.get(part_id, 0) < quantity:
            return False
        self.warehouse_parts[part_id] -= quantity
        return True

    def has_active_contract(self, identifier: str) -> bool:
        """Verifica se há convênio de fornecimento vigente com a corporação ou por ID de contrato."""
        contracts = getattr(self, "active_b2b_contracts", [])
        return any(c.get("corp_id") == identifier or c.get("contract_id") == identifier for c in contracts)

    def has_exclusivity_tag(self, tag: str) -> bool:
        """Verifica se a guilda possui uma cláusula de exclusividade corporativa ativa."""
        tags = getattr(self, "corporate_exclusivity_tags", [])
        return tag in tags

    def rename_guild(self, new_name: str) -> str:
        """Atualiza a razão social da guilda corporativa."""
        cleaned = new_name.strip() if new_name else ""
        if not cleaned:
            cleaned = "Guilda do Jogador"
        self.guild_name = cleaned[:40]
        return self.guild_name

    def rename_hero(self, hero_id: str, new_name: str) -> Optional[dict]:
        """Atualiza o nome de registro de um aventureiro no quadro funcional."""
        cleaned = new_name.strip() if new_name else ""
        if not cleaned:
            return None
        hero = self.hero_by_id(hero_id)
        if hero:
            hero["name"] = cleaned[:35]
            return hero
        return None
