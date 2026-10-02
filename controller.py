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
from b2b import get_corporations, get_parts_dict, get_b2b_contracts_dict, get_assembly_workers_dict, get_b2b_balance

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
        self.sales_service = SalesService(self.state, self.counter_sales, self.market_engine)
        self.crafting_service = CraftingService(self.state, self.crafting_engine, sales_service=self.sales_service)
        self.phase_service = PhaseService(
            self.state, self.dungeons, self.league_engine, self.market_engine, match_engine, self.hero_service, self.event_service, crafting_service=self.crafting_service
        )
        self.market_service = MarketService(self.state, self.market_engine)

    def _rebind_services(self):
        """Reatualiza as referências do estado e motores nos serviços após operações in-place."""
        self.tactics_service.state = self.state
        self.hero_service.state = self.state
        self.event_service.state = self.state
        self.sales_service.state = self.state
        self.sales_service.market_engine = self.market_engine
        self.crafting_service.state = self.state
        self.crafting_service.sales_service = self.sales_service
        self.phase_service.state = self.state
        self.phase_service.hero_service = self.hero_service
        self.phase_service.event_service = self.event_service
        self.phase_service.league_engine = self.league_engine
        self.phase_service.market_engine = self.market_engine
        self.phase_service.crafting_service = self.crafting_service
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
        pos_map = {p["id"]: p for p in classes_data.get("positions", [])}

        def decorate_hero_dict(hero_dict: dict) -> dict:
            h = dict(hero_dict)
            spec = spec_map.get(h.get("specialization_id"), {})
            spec_name = spec.get("name") or h.get("specialization_name") or h.get("specialization") or "Especialista"

            # Posições Operacionais Canônicas
            pos_id = h.get("position_id") or spec.get("position_id") or "pos_vanguarda"
            pos_info = pos_map.get(pos_id, {})
            pos_name = h.get("position") or pos_info.get("name", "Vanguarda")

            h["position_id"] = pos_id
            h["position"] = pos_name
            h["position_icon"] = pos_info.get("icon", "Shield")
            h["position_description"] = pos_info.get("description", "")
            h["specialization"] = spec_name
            h["specialization_name"] = spec_name
            h["stat_weight_profile"] = spec.get("stat_weight_profile", h.get("stat_weight_profile", {}))

            # Formato Canônico: "Posição - Especialização" (ex: "Vanguarda - Berserk")
            role_title = f"{pos_name} - {spec_name}"
            h["role_title"] = role_title
            h["class_name"] = role_title

            h["current_power"] = calculate_hero_power(h)
            return h

        decorated_team = [decorate_hero_dict(hero) for hero in self.state.team]
        decorated_youth = [decorate_hero_dict(y) for y in getattr(self.state, "youth_academy", [])]
        decorated_market = [decorate_hero_dict(m) for m in getattr(self.state, "transfer_market_listings", [])]

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
            "weekly_sales_revenue": getattr(self.state, "weekly_sales_revenue", 0),
            "weekly_sales_count": getattr(self.state, "weekly_sales_count", 0),
            "weekly_market_expenses": getattr(self.state, "weekly_market_expenses", 0),
            "weekly_contract_signing_expenses": getattr(self.state, "weekly_contract_signing_expenses", 0),
            "weekly_hiring_expenses": getattr(self.state, "weekly_hiring_expenses", 0),
            "last_financial_statement": getattr(self.state, "last_financial_statement", {}),
            "financials": getattr(self.state, "last_financial_statement", {}),
            "active_b2b_contracts": getattr(self.state, "active_b2b_contracts", []),
            "assembly_line_workers": getattr(self.state, "assembly_line_workers", []),
            "corporate_exclusivity_tags": getattr(self.state, "corporate_exclusivity_tags", []),
            "warehouse_parts": getattr(self.state, "warehouse_parts", {}),
            "brand_xp": getattr(self.state, "brand_xp", {}),
            "b2b_slots_locked": getattr(self.state, "b2b_slots_locked", 0),
            "last_expedition_loot": getattr(self.state, "last_expedition_loot", []),
            "guild_name": getattr(self.state, "guild_name", "Guilda do Jogador"),
            "consecutive_negative_gold_weeks": getattr(self.state, "consecutive_negative_gold_weeks", 0),
            "game_over": getattr(self.state, "game_over", False),
            "game_over_reason": getattr(self.state, "game_over_reason", None),
            "season_completed": getattr(self.state, "season_completed", False),
            "season_outcome": getattr(self.state, "season_outcome", None),
            "b2b_catalog": {
                "corporations": get_corporations(),
                "parts": get_parts_dict(),
                "contracts": get_b2b_contracts_dict(),
                "assembly_workers": get_assembly_workers_dict(),
                "balance": get_b2b_balance(),
            },
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

    # Operações B2B & Linha de Montagem Modular (v0.7.0)
    def sign_b2b_contract(self, contract_id: str) -> dict:
        from b2b import get_b2b_contracts_dict, get_corporations_dict
        contracts = get_b2b_contracts_dict()
        contract = contracts.get(contract_id)
        if not contract:
            return {"success": False, "message": f"Contrato B2B '{contract_id}' não localizado no catálogo industrial."}

        if self.state.has_active_contract(contract_id):
            return {"success": False, "message": "Contrato de fornecimento já vigente com esta fornecedora."}

        corp_id = contract.get("corp_id")
        corps = get_corporations_dict()
        corp = corps.get(corp_id, {})
        requirements = contract.get("requirements", {})
        min_confidence = int(requirements.get("min_confidence", 0))
        min_workshop_level = int(requirements.get("min_workshop_level", 1))
        requires_previous_tier = requirements.get("requires_previous_tier")

        # Validação de Confiança da Contratante
        if self.state.contractor_confidence < min_confidence:
            return {
                "success": False,
                "message": f"Homologação indeferida: a corporação exige Confiança da Contratante mínima de {min_confidence} pontos (Atual: {self.state.contractor_confidence}).",
            }

        # Validação de Progressão Gradual (Bronze -> Prata -> Ouro)
        corp_active_contracts = [c for c in self.state.active_b2b_contracts if c.get("corp_id") == corp_id]
        if requires_previous_tier:
            tier_order = {"Bronze": 1, "Prata": 2, "Ouro": 3}
            req_order = tier_order.get(requires_previous_tier, 1)
            has_prev = any(tier_order.get(c.get("tier"), 1) >= req_order for c in corp_active_contracts)
            if not has_prev:
                return {
                    "success": False,
                    "message": f"Progressão indeferida: para homologar um convênio {contract.get('tier')}, a guilda precisa possuir convênio {requires_previous_tier} ativo com a {corp.get('name', 'fornecedora')}.",
                }

        # Validação de Brand XP (Relacionamento Corporativo)
        current_brand_lvl = self.state.get_brand_level(corp_id) if hasattr(self.state, "get_brand_level") else 1
        tier = contract.get("tier", "Bronze")
        required_brand_lvl = 1 if tier == "Bronze" else (3 if tier == "Prata" else 7)
        if current_brand_lvl < required_brand_lvl:
            req_xp = (required_brand_lvl - 1) * 50
            return {
                "success": False,
                "message": f"Homologação indeferida: convênios {tier} exigem Nível de Relacionamento Comercial {required_brand_lvl}+ com a {corp.get('name', 'marca')} (Requer {req_xp} Brand XP; Nível atual: {current_brand_lvl}).",
            }

        # Limite regulatório da Coroa: no máximo 3 convênios ativos (respeitando carência de cancelamento)
        total_occupied_slots = len(getattr(self.state, "active_b2b_contracts", [])) + getattr(self.state, "b2b_slots_locked", 0)
        if not corp_active_contracts and total_occupied_slots >= 3:
            if getattr(self.state, "b2b_slots_locked", 0) > 0:
                return {
                    "success": False,
                    "message": "Limite regulatório atingido: você possui contratos rescindidos em carência de desvinculação. O slot será liberado após a expedição desta semana.",
                }
            return {
                "success": False,
                "message": "Limite regulatório atingido: a guilda pode manter no máximo 3 convênios de patrocínio corporativo ativos simultaneamente.",
            }

        # Taxa de homologação inicial (debitada no ato)
        royalty = int(contract.get("weekly_royalty", 50))
        if self.state.gold < royalty:
            return {
                "success": False,
                "message": f"Saldo em tesouraria insuficiente: a taxa de homologação do convênio requer {royalty} Ouro (Saldo atual: {self.state.gold} Ouro).",
            }

        is_exclusive = contract.get("is_exclusive", False)
        exclusivity_tag = corp.get("exclusivity_tag")
        rival_corp_id = corp.get("rival_corp_id")

        # 1. Se o novo contrato é exclusivo, rejeita se já possuir contrato ou tag com o rival corporativo
        if is_exclusive and rival_corp_id:
            rival_corp = corps.get(rival_corp_id, {})
            rival_tag = rival_corp.get("exclusivity_tag")
            has_rival_contract = any(c.get("corp_id") == rival_corp_id for c in self.state.active_b2b_contracts)
            if has_rival_contract or (rival_tag and self.state.has_exclusivity_tag(rival_tag)):
                return {
                    "success": False,
                    "message": f"Contrato rejeitado: cláusula de exclusividade com a concorrente '{rival_corp.get('name', rival_corp_id)}' impede a celebração deste convênio.",
                }

        # 2. Se já possuímos exclusividade com o rival, rejeita qualquer novo contrato com esta corporação
        if rival_corp_id:
            rival_corp = corps.get(rival_corp_id, {})
            rival_tag = rival_corp.get("exclusivity_tag")
            if rival_tag and self.state.has_exclusivity_tag(rival_tag):
                return {
                    "success": False,
                    "message": f"Contrato rejeitado: parceria exclusiva vigente com a concorrente '{rival_corp.get('name', rival_corp_id)}' impede novos convênios com esta marca.",
                }

        # Deduz taxa de homologação inicial e registra no DRE
        self.state.gold -= royalty
        self.state.weekly_contract_signing_expenses = getattr(self.state, "weekly_contract_signing_expenses", 0) + royalty

        # Homologação do contrato (Upgrade ou Novo)
        is_upgrade = len(corp_active_contracts) > 0
        if is_upgrade:
            # Substitui contrato anterior da mesma corporação
            self.state.active_b2b_contracts = [
                c for c in self.state.active_b2b_contracts if c.get("corp_id") != corp_id
            ]

        self.state.active_b2b_contracts.append(dict(contract))
        if is_exclusive and exclusivity_tag:
            if not self.state.has_exclusivity_tag(exclusivity_tag):
                self.state.corporate_exclusivity_tags.append(exclusivity_tag)

        # Entrega imediata do pacote semanal de peças no ato da assinatura
        weekly_shipment = contract.get("weekly_shipment", [])
        for item in weekly_shipment:
            pid = item.get("part_id")
            qty = item.get("quantity", 1)
            if pid:
                self.state.add_warehouse_part(pid, qty)

        success_msg = (
            f"Convênio promovido com sucesso! Sua parceria com {corp.get('name', 'a fornecedora')} subiu para o escalão {contract.get('tier')} e as remessas foram entregues no almoxarifado."
            if is_upgrade
            else f"Contrato B2B '{contract.get('title')}' celebrado com sucesso! Taxa de {royalty} Ouro debitada e primeiro lote de peças entregue no almoxarifado."
        )

        return {
            "success": True,
            "contract": contract,
            "is_upgrade": is_upgrade,
            "active_b2b_contracts": self.state.active_b2b_contracts,
            "message": success_msg,
        }

    def cancel_b2b_contract(self, contract_id: str) -> dict:
        contract = next((c for c in self.state.active_b2b_contracts if c.get("contract_id") == contract_id), None)
        if not contract:
            return {"success": False, "message": "Contrato B2B não encontrado entre os vigentes."}
        self.state.active_b2b_contracts.remove(contract)
        # O slot entra em carência regulatória e só é liberado no ciclo seguinte (após a expedição)
        self.state.b2b_slots_locked = getattr(self.state, "b2b_slots_locked", 0) + 1

        corp_id = contract.get("corp_id")
        from b2b import get_corporations_dict
        corps = get_corporations_dict()
        corp = corps.get(corp_id, {})
        excl_tag = corp.get("exclusivity_tag")
        if excl_tag and excl_tag in self.state.corporate_exclusivity_tags:
            has_other_excl = any(c.get("corp_id") == corp_id and c.get("is_exclusive") for c in self.state.active_b2b_contracts)
            if not has_other_excl:
                self.state.corporate_exclusivity_tags.remove(excl_tag)
        return {
            "success": True,
            "message": f"Contrato B2B '{contract.get('title')}' rescindido administrativamente. O slot regulatório permanecerá em carência até a conclusão da próxima expedição."
        }

    def hire_assembly_worker(self, worker_id: str, assigned_branch: str = "Ferragem") -> dict:
        from b2b import get_assembly_workers_dict
        import uuid
        from constants import normalize_branch
        workers = get_assembly_workers_dict()
        worker = workers.get(worker_id)
        if not worker:
            return {"success": False, "message": f"Modelo de operário '{worker_id}' não homologado pelo departamento pessoal."}

        norm_branch = normalize_branch(assigned_branch)
        if norm_branch not in worker.get("supported_branches", []):
            return {"success": False, "message": f"Operário '{worker.get('name')}' não possui certificação para operar na filial de {norm_branch}."}

        cost = int(worker.get("hiring_cost", 150))
        if self.state.gold < cost:
            return {"success": False, "message": f"Tesouraria insuficiente para admissão do operário (Custo: {cost} Ouro, Saldo: {self.state.gold} Ouro)."}

        self.state.gold -= cost
        self.state.weekly_hiring_expenses = getattr(self.state, "weekly_hiring_expenses", 0) + cost
        active_contracts = getattr(self.state, "active_b2b_contracts", [])
        default_corp = active_contracts[0].get("corp_id") if active_contracts else None
        default_recipe = default_corp or (worker.get("allowed_recipes", [None])[0] if worker.get("allowed_recipes") else None)

        worker_instance = {
            "worker_instance_id": str(uuid.uuid4()),
            "worker_id": worker_id,
            "name": worker.get("name"),
            "tier": worker.get("tier", 1),
            "weekly_salary": worker.get("weekly_salary", 40),
            "production_capacity": worker.get("production_capacity", 1),
            "assigned_branch": norm_branch,
            "supported_branches": worker.get("supported_branches", []),
            "allowed_recipes": worker.get("allowed_recipes", []),
            "target_recipe": default_recipe,
            "target_corp_id": default_corp,
        }
        self.state.assembly_line_workers.append(worker_instance)
        return {
            "success": True,
            "worker": worker_instance,
            "gold": self.state.gold,
            "assembly_line_workers": self.state.assembly_line_workers,
            "message": f"Operário '{worker.get('name')}' admitido e integrado à linha fabril de {norm_branch}.",
        }

    def set_worker_order(self, worker_instance_id: str, target_order: str) -> dict:
        worker = next(
            (w for w in self.state.assembly_line_workers if w.get("worker_instance_id") == worker_instance_id or w.get("worker_id") == worker_instance_id),
            None
        )
        if not worker:
            return {"success": False, "message": "Operário fabril não localizado na linha de montagem."}

        from b2b import get_corporations_dict
        corps = get_corporations_dict()
        if target_order in corps or target_order.startswith("corp_"):
            active_corp_ids = [c.get("corp_id") for c in getattr(self.state, "active_b2b_contracts", [])]
            if target_order not in active_corp_ids:
                corp_name = corps.get(target_order, {}).get("name", target_order)
                return {
                    "success": False,
                    "message": f"Ordem técnica rejeitada: a guilda não possui convênio ativo com '{corp_name}'. Celebre um contrato antes de alocar a linha de montagem.",
                }
            worker["target_corp_id"] = target_order
            worker["target_recipe"] = target_order
            corp_name = corps.get(target_order, {}).get("name", target_order)
            return {
                "success": True,
                "worker": worker,
                "message": f"Ordem de manufatura seriada atribuída: Linha de produção voltada para '{corp_name}'.",
            }

        from catalog import get_catalog
        recipe = get_catalog().get_recipe(target_order)
        if not recipe:
            return {"success": False, "message": f"Ordem ou corporação '{target_order}' não localizada no catálogo corporativo."}

        allowed = worker.get("allowed_recipes", [])
        if allowed and target_order not in allowed:
            return {"success": False, "message": f"Ordem técnica rejeitada: operário não habilitado para produzir '{recipe.get('name', target_order)}'."}

        worker["target_recipe"] = target_order
        worker["target_corp_id"] = None
        return {
            "success": True,
            "worker": worker,
            "message": f"Ordem de fabricação atribuída com sucesso: '{recipe.get('name', target_order)}'.",
        }

    def dismiss_assembly_worker(self, worker_instance_id: str) -> dict:
        worker = next(
            (w for w in self.state.assembly_line_workers if w.get("worker_instance_id") == worker_instance_id or w.get("worker_id") == worker_instance_id),
            None
        )
        if not worker:
            return {"success": False, "message": "Operário não localizado para rescisão."}
        self.state.assembly_line_workers.remove(worker)
        return {"success": True, "message": f"Operário '{worker.get('name')}' desligado da linha fabril."}

    def assemble_modular_item(self, part_ids: list, base_name: str = "Artefato Modular", is_tinkering: bool = False, rng=None) -> dict:
        return self.crafting_service.assemble_item(part_ids, base_name=base_name, is_tinkering=is_tinkering, rng=rng)

    def buy_part(self, part_id: str, quantity: int = 1) -> dict:
        res = self.market_engine.buy_spot_part(part_id, quantity=quantity, state=self.state)
        if res.get("success"):
            cost = int(res.get("total_cost", 0))
            self.state.weekly_market_expenses = getattr(self.state, "weekly_market_expenses", 0) + cost
        return res

    def calculate_part_spot_price(self, part_id: str) -> int:
        return self.market_engine.calculate_part_spot_price(part_id, state=self.state)

    def rename_guild(self, name: str) -> dict:
        new_name = self.state.rename_guild(name)
        self.league_engine.rename_player_guild(new_name)
        return {
            "success": True,
            "guild_name": new_name,
            "message": f"Registro notarial: Razão social alterada para '{new_name}' com êxito."
        }

    def rename_hero(self, hero_id: str, name: str) -> dict:
        hero = self.state.rename_hero(hero_id, name)
        if hero:
            return {
                "success": True,
                "hero": hero,
                "message": f"Certidão de alistamento atualizada: Colaborador renomeado para '{hero['name']}'."
            }
        return {
            "success": False,
            "error": "Colaborador não localizado no quadro funcional da guilda."
        }


