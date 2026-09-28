"""
HeroFoot Central Controller Facade.
Fachada que unifica o GameState e delega operações para os serviços especializados.
"""

import os
import json
from game_state import GameState
from crafting import CraftingEngine
from counter_sales import CounterSales
from league_engine import LeagueEngine
from market_engine import MarketEngine

try:
    import match_engine
except ImportError:
    match_engine = None

from services.tactics_service import TacticsService
from services.phase_service import PhaseService
from services.crafting_service import CraftingService
from services.sales_service import SalesService
from services.market_service import MarketService

_CLASSES_CACHE = None

def _get_classes_data():
    global _CLASSES_CACHE
    if _CLASSES_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'classes_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _CLASSES_CACHE = json.load(f)
        else:
            _CLASSES_CACHE = {"classes": [], "specializations": []}
    return _CLASSES_CACHE


class GameController:
    def __init__(self):
        self.state = GameState()
        self.running = True
        self.crafting_engine = CraftingEngine()
        self.counter_sales = CounterSales()
        self.league_engine = LeagueEngine()
        self.market_engine = MarketEngine()
        self.dungeons = self._load_dungeons()

        # Serviços delegados
        self.tactics_service = TacticsService(self.state)
        self.phase_service = PhaseService(
            self.state, self.dungeons, self.league_engine, self.market_engine, match_engine
        )
        self.crafting_service = CraftingService(self.state, self.crafting_engine)
        self.sales_service = SalesService(self.state, self.counter_sales, self.market_engine)
        self.market_service = MarketService(self.state, self.market_engine)

    def _load_dungeons(self):
        dungeons_path = os.path.join(os.path.dirname(__file__), 'data', 'dungeons_seed.json')
        if os.path.exists(dungeons_path):
            try:
                with open(dungeons_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def get_current_dungeon(self) -> dict:
        return self.phase_service.get_current_dungeon()

    def get_state(self) -> dict:
        """Retorna snapshot do jogo com heróis decorados com nomes de classe e especialização."""
        dungeon = self.get_current_dungeon()
        classes_data = _get_classes_data()
        class_map = {c["id"]: c.get("name", "Combatente") for c in classes_data.get("classes", [])}
        spec_map = {s["id"]: s for s in classes_data.get("specializations", [])}

        decorated_team = []
        for hero in self.state.team:
            h = dict(hero)
            c_name = class_map.get(h.get("class_id"), h.get("class_name", "Combatente"))
            spec = spec_map.get(h.get("specialization_id"), {})
            h["class_name"] = c_name
            h["specialization_name"] = spec.get("name", c_name)
            h["stat_weight_profile"] = spec.get("stat_weight_profile", h.get("stat_weight_profile", {}))
            decorated_team.append(h)

        return {
            "day": self.state.day,
            "week": self.state.week,
            "gold": self.state.gold,
            "current_phase": self.state.current_phase,
            "workshop_levels": self.state.workshop_levels,
            "materials": self.state.materials,
            "inventory": self.state.inventory,
            "team": decorated_team,
            "team_size": len(self.state.team),
            "tactics": {
                "starters": self.state.starters,
                "reserves": self.state.reserves,
                "loadout": self.state.loadout,
            },
            "current_dungeon": dungeon,
            "pending_offers": {
                k: {"price": v["price"], "item_name": v["item"].get("name", "")}
                for k, v in self.state.pending_offers.items()
            },
            "league_table": self.league_engine.get_standings(),
            "last_round_matches": self.league_engine.last_round_matches,
            "current_fixture": self.league_engine.get_player_match(self.state.day),
            "market": self.market_engine.get_market_data(),
            "recipes": self.crafting_engine.recipe_db if self.crafting_engine else {},
        }

    # Operações de delegação
    def advance_phase(self) -> dict:
        return self.phase_service.advance_phase()

    def save_tactics(self, starters: list, loadout: dict, reserves: list = None) -> dict:
        return self.tactics_service.save_tactics(starters, loadout, reserves=reserves)

    def ui_request_craft(self, recipe_id: str, branch: str = "Ferragem", rng=None) -> dict:
        return self.crafting_service.craft_item(recipe_id, branch, rng=rng)

    def upgrade_workshop(self, branch: str = "Ferragem") -> dict:
        return self.crafting_service.upgrade_workshop(branch)

    def buy_material(self, material_id: str, quantity: int) -> dict:
        return self.market_service.buy_material(material_id, quantity)

    def buy_ready_item(self, market_item_id: str) -> dict:
        return self.market_service.buy_ready_item(market_item_id)

    def list_item_for_sale(self, item_instance_id: str, *args, margin_type: str = None, rng=None, **kwargs) -> dict:
        return self.sales_service.list_item_for_sale(
            item_instance_id, *args, margin_type=margin_type, rng=rng, **kwargs
        )

    def resolve_counter_offer(self, offer_id: str, accept: bool) -> dict:
        return self.sales_service.resolve_counter_offer(offer_id, accept)

    def hire_hero(self, hero_data: dict) -> dict:
        self.state.team.append(hero_data)
        return {"success": True, "message": f"Aventureiro '{hero_data.get('name')}' contratado."}

    def fire_hero(self, hero_id: str) -> dict:
        hero = self.state.hero_by_id(hero_id)
        if hero:
            self.state.team.remove(hero)
            if hero_id in self.state.starters:
                self.state.starters.remove(hero_id)
            return {"success": True, "message": f"Colaborador dispensado do quadro."}
        return {"success": False, "message": "Colaborador não localizado."}
