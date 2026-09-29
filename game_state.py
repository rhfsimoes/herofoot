"""
HeroFoot GameState Module.
Contém a classe GameState e o rastreamento de campos serializáveis e transientes.
"""

import os
import json
from constants import normalize_branch
from balance import get_balance

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
            "Arma": None,
            "Armadura": None,
            "Joia": None,
            "Inscrição": None,
            "Consumível": None,
        }

        # Níveis de especialização por ramo da oficina (Níveis 1 a 6)
        self.workshop_levels = {
            "Ferragem": 1,
            "Alquimia": 1,
            "Joalheria": 1,
            "Culinária": 1,
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
        return self

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
