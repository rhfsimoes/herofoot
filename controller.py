"""
HeroFoot Central Controller Facade.
Fachada que unifica o GameState e delega operações para os serviços especializados.
"""

import os
import json
from game_state import GameState
from crafting import CraftingEngine, get_workshops_data
from counter_sales import CounterSales
from league_engine import LeagueEngine
from market_engine import MarketEngine
import save_system

try:
    import match_engine
except ImportError:
    match_engine = None

from services.tactics_service import TacticsService
from services.phase_service import PhaseService
from services.crafting_service import CraftingService
from services.sales_service import SalesService
from services.market_service import MarketService
from services.hero_service import HeroService, calculate_hero_power
from services.event_service import EventService

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
        self.active_slot = None
        self.crafting_engine = CraftingEngine()
        self.counter_sales = CounterSales()
        self.league_engine = LeagueEngine()
        self.market_engine = MarketEngine()
        self.dungeons = self._load_dungeons()

        # Serviços delegados
        self.tactics_service = TacticsService(self.state)
        self.hero_service = HeroService(self.state)
        self.event_service = EventService(self.state)
        self.phase_service = PhaseService(
            self.state, self.dungeons, self.league_engine, self.market_engine, match_engine, self.hero_service, self.event_service
        )
        self.crafting_service = CraftingService(self.state, self.crafting_engine)
        self.sales_service = SalesService(self.state, self.counter_sales, self.market_engine)
        self.market_service = MarketService(self.state, self.market_engine)

    def _rebind_services(self):
        """Reatualiza as referências do estado e motores nos serviços após operações in-place."""
        self.tactics_service.state = self.state
        self.hero_service.state = self.state
        self.event_service.state = self.state
        self.phase_service.state = self.state
        self.phase_service.hero_service = self.hero_service
        self.phase_service.event_service = self.event_service
        self.phase_service.league_engine = self.league_engine
        self.phase_service.market_engine = self.market_engine
        self.crafting_service.state = self.state
        self.sales_service.state = self.state
        self.sales_service.market_engine = self.market_engine
        self.market_service.state = self.state
        self.market_service.market_engine = self.market_engine

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
            h["current_power"] = calculate_hero_power(h)
            decorated_team.append(h)

        decorated_youth = []
        for y in getattr(self.state, "youth_academy", []):
            h = dict(y)
            c_name = class_map.get(h.get("class_id"), h.get("class_name", "Combatente"))
            spec = spec_map.get(h.get("specialization_id"), {})
            h["class_name"] = c_name
            h["specialization_name"] = spec.get("name", c_name)
            h["stat_weight_profile"] = spec.get("stat_weight_profile", h.get("stat_weight_profile", {}))
            h["current_power"] = calculate_hero_power(h)
            decorated_youth.append(h)

        decorated_market = []
        for m in getattr(self.state, "transfer_market_listings", []):
            h = dict(m)
            c_name = class_map.get(h.get("class_id"), h.get("class_name", "Combatente"))
            spec = spec_map.get(h.get("specialization_id"), {})
            h["class_name"] = c_name
            h["specialization_name"] = spec.get("name", c_name)
            h["stat_weight_profile"] = spec.get("stat_weight_profile", h.get("stat_weight_profile", {}))
            h["current_power"] = calculate_hero_power(h)
            decorated_market.append(h)

        # Montagem das receitas com ingredientes a partir do catálogo normalizado
        from catalog import get_catalog
        cat = get_catalog()
        assembled_recipes = {}
        for rid, r in cat.recipes.items():
            r_copy = dict(r)
            r_copy["ingredients"] = [
                {
                    "item_id": i["material_id"],
                    "material_id": i["material_id"],
                    "quantity": i["quantity"],
                }
                for i in cat.get_recipe_ingredients(rid)
            ]
            assembled_recipes[rid] = r_copy

        return {
            "day": self.state.day,
            "week": self.state.week,
            "gold": self.state.gold,
            "current_phase": self.state.current_phase,
            "workshop_levels": self.state.workshop_levels,
            "workshop_xp": getattr(self.state, "workshop_xp", {"Ferragem": 0, "Alquimia": 0, "Joalheria": 0, "Culinária": 0}),
            "xp_progression": get_workshops_data().get("xp_progression", {}),
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
            "divisions": self.league_engine.get_divisions_data(),
            "current_division": self.league_engine.get_current_division_info(),
            "season": getattr(self.state, "season", 1),
            "season_summary": getattr(self.league_engine, "season_summary", None),
            "last_round_matches": self.league_engine.last_round_matches,
            "current_fixture": self.league_engine.get_player_match(self.state.day),
            "market": self.market_engine.get_market_data(),
            "recipes": assembled_recipes,
            "known_affixes": getattr(self.state, "known_affixes", []),
            "known_recipes": getattr(self.state, "known_recipes", []),
            "catalog_version": getattr(self.state, "catalog_version", 1),
            "medical_facilities": self.hero_service.get_medical_facilities_data(),
            "pending_contract_renewals": getattr(self.state, "pending_contract_renewals", []),
            "youth_academy": decorated_youth,
            "transfer_market": {
                "listings": decorated_market,
                "scout_fee": 150,
                "team_size": len(self.state.team),
                "max_team_size": 12,
            },
            "crown_goals": self.get_crown_goals(),
            "contractor_confidence": getattr(self.state, "contractor_confidence", 75),
            "active_event": self.event_service.get_active_event(),
            "resolved_events_history": getattr(self.state, "resolved_events_history", []),
            "supplies_bonus": getattr(self.state, "supplies_bonus", 0),
            "active_slot": self.active_slot,
        }

    # Operações de persistência corporativa
    def save(self, slot: str = None) -> dict:
        target_slot = slot if slot is not None else (self.active_slot or "autosave")
        res = save_system.save_bundle(self.state, self.league_engine, self.market_engine, slot=target_slot)
        self.active_slot = res["slot"]
        self.state.active_save_slot = res["slot"]
        return res

    def load(self, slot: str) -> dict:
        bundle = save_system.load_bundle(slot)
        norm_slot = save_system.normalize_slot(slot)
        if "game_state" in bundle:
            self.state.from_dict(bundle["game_state"])
        if "league_engine" in bundle:
            self.league_engine.from_dict(bundle["league_engine"])
        if "market_engine" in bundle:
            self.market_engine.from_dict(bundle["market_engine"])

        self.active_slot = norm_slot
        self.state.active_save_slot = norm_slot
        self._rebind_services()
        return {
            "success": True,
            "slot": norm_slot,
            "message": f"Registro corporativo '{norm_slot}' carregado com êxito.",
        }

    def new_game(self, slot: str = None) -> dict:
        new_st, new_le, new_me = save_system.new_game(slot=slot)
        self.state = new_st
        self.league_engine = new_le
        self.market_engine = new_me
        norm_slot = save_system.normalize_slot(slot) if slot is not None else None
        self.active_slot = norm_slot
        self.state.active_save_slot = norm_slot
        self._rebind_services()
        return {
            "success": True,
            "slot": norm_slot,
            "message": "Novo ciclo corporativo iniciado para a guilda.",
        }

    # Operações de delegação
    def advance_phase(self, rng=None) -> dict:
        return self.phase_service.advance_phase(rng=rng)

    def save_tactics(self, starters: list, loadout: dict, reserves: list = None) -> dict:
        return self.tactics_service.save_tactics(starters, loadout, reserves=reserves)

    def ui_request_craft(
        self,
        recipe_id: str,
        branch: str = "Ferragem",
        prefix_id: str = None,
        suffix_id: str = None,
        prefix_material_id: str = None,
        suffix_material_id: str = None,
        is_tinkering: bool = False,
        rng=None,
    ) -> dict:
        return self.crafting_service.craft_item(
            recipe_id,
            branch=branch,
            prefix_id=prefix_id,
            suffix_id=suffix_id,
            prefix_material_id=prefix_material_id,
            suffix_material_id=suffix_material_id,
            is_tinkering=is_tinkering,
            rng=rng,
        )

    def get_craft_options(self, recipe_id: str) -> dict:
        return self.crafting_service.get_craft_options(recipe_id)

    def get_craft_preview(
        self,
        recipe_id: str,
        prefix_id: str = None,
        suffix_id: str = None,
        prefix_material_id: str = None,
        suffix_material_id: str = None,
    ) -> dict:
        return self.crafting_service.get_craft_preview(
            recipe_id,
            prefix_id=prefix_id,
            suffix_id=suffix_id,
            prefix_material_id=prefix_material_id,
            suffix_material_id=suffix_material_id,
        )

    def learn_affix(self, affix_id: str) -> dict:
        res = self.crafting_service.learn_affix(affix_id)
        if res.get("success"):
            if hasattr(self.market_engine, "affix_manuals"):
                self.market_engine.affix_manuals = [
                    m for m in self.market_engine.affix_manuals if m["affix_id"] != affix_id
                ]
        return res

    def get_material_sheet(self, material_id: str) -> dict:
        return self.crafting_service.get_material_sheet(material_id)

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

    def fulfill_vip_order(self, item_instance_id: str) -> dict:
        return self.sales_service.fulfill_vip_order(item_instance_id)

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

    # Operações de Saúde Ocupacional & Contratos (Onda 3)
    def get_medical_facilities(self) -> dict:
        return self.hero_service.get_medical_facilities_data()

    def upgrade_medical_facility(self) -> dict:
        return self.hero_service.upgrade_medical_facility()

    def treat_hero_massage(self, hero_id: str) -> dict:
        return self.hero_service.treat_hero_massage(hero_id)

    def accelerate_hero_injury(self, hero_id: str) -> dict:
        return self.hero_service.accelerate_hero_injury(hero_id)

    def collective_banquet(self) -> dict:
        return self.hero_service.collective_banquet()

    def renew_hero_contract(self, hero_id: str) -> dict:
        return self.hero_service.renew_contract(hero_id)

    def release_hero_contract(self, hero_id: str) -> dict:
        return self.hero_service.release_hero(hero_id)

    # Operações de Academia de Base & Transferências (Onda 4)
    def get_academy(self) -> dict:
        return self.hero_service.get_academy_data()

    def promote_youth(self, hero_id: str) -> dict:
        return self.hero_service.promote_youth_apprentice(hero_id)

    def dismiss_youth(self, hero_id: str) -> dict:
        return self.hero_service.dismiss_youth_apprentice(hero_id)

    def get_transfer_market(self) -> dict:
        return self.hero_service.get_transfer_market_data()

    def scout_market_hero(self, hero_id: str) -> dict:
        return self.hero_service.scout_market_hero(hero_id)

    def hire_market_hero(self, hero_id: str) -> dict:
        return self.hero_service.hire_market_hero(hero_id)

    # Diretrizes e Metas da Coroa
    def get_crown_goals(self) -> dict:
        from services.crown_service import get_crown_goals_data
        return get_crown_goals_data(self.state, self.league_engine)

    # Incidentes Corporativos Interativos (v0.5.0)
    def get_active_event(self):
        return self.event_service.get_active_event()

    def roll_weekly_event(self, phase: str = "phase_1", rng=None):
        return self.event_service.roll_weekly_event(phase=phase, rng=rng)

    def resolve_event_choice(self, event_id: str, option_id: str) -> dict:
        return self.event_service.resolve_event_choice(event_id, option_id)

