"""
HeroFoot GameState Module.
Contém a classe GameState e o rastreamento de campos serializáveis e transientes.
"""

import os
import json
from constants import normalize_branch, normalize_slot
from balance import get_balance

SERIALIZED_FIELDS = [
    "day",
    "week",
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
]

TRANSIENT_FIELDS = [
    "last_match_result",
    "last_round_results",
    "current_dungeon",
]


class GameState:
    def __init__(self):
        self.day = 1               # Rodada / Semana do campeonato
        self.week = 1              # Sinônimo canônico de rodada
        self.gold = 1000
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

        self.load_initial_data()

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
        for ingredient in recipe.get("ingredients", []):
            mat_id = ingredient["item_id"]
            qty_needed = ingredient["quantity"]
            if self.materials.get(mat_id, 0) < qty_needed:
                return False
        return True

    def consume_materials(self, recipe: dict):
        """Consome os insumos da receita do inventário de materiais."""
        for ingredient in recipe.get("ingredients", []):
            mat_id = ingredient["item_id"]
            qty_needed = ingredient["quantity"]
            self.materials[mat_id] = max(0, self.materials.get(mat_id, 0) - qty_needed)
