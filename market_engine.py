"""
HeroFoot Market Engine
Gerencia o mercado rotativo com insumos e itens prontos para compra, além da liquidação de estoque.
"""

import os
import json
import random
import uuid
import copy
from typing import Optional, Dict, Any, List

from constants import SLOTS
from balance import get_balance


def load_materials():
    materials_path = os.path.join(os.path.dirname(__file__), 'data', 'materials_seed.json')
    values_path = os.path.join(os.path.dirname(__file__), 'data', 'material_values_seed.json')
    if os.path.exists(materials_path) and os.path.exists(values_path):
        try:
            with open(materials_path, 'r', encoding='utf-8') as f:
                mats = json.load(f)
            with open(values_path, 'r', encoding='utf-8') as f:
                vals = {v['material_id']: v for v in json.load(f)}
            combined = []
            for m in mats:
                mid = m['id']
                v = vals.get(mid, {})
                combined.append({
                    'id': mid,
                    'name': m['name'],
                    'category': m.get('category'),
                    'unit_price': v.get('price', 20),
                    'min_qty': v.get('min_qty', 1),
                    'max_qty': v.get('max_qty', 5),
                    'variance': v.get('variance', 0.2),
                })
            return combined
        except Exception:
            pass
    return [
        {"id": "mat_iron_ore", "name": "Minério de Ferro", "unit_price": 20, "min_qty": 3, "max_qty": 10},
        {"id": "mat_scaly_leather", "name": "Couro Escamoso", "unit_price": 35, "min_qty": 2, "max_qty": 7},
        {"id": "mat_mana_crystal", "name": "Cristal de Mana", "unit_price": 55, "min_qty": 1, "max_qty": 5},
        {"id": "mat_eucalyptus_herb", "name": "Erva de Eucalipto", "unit_price": 25, "min_qty": 2, "max_qty": 8},
        {"id": "mat_flour", "name": "Farinha de Trigo", "unit_price": 15, "min_qty": 4, "max_qty": 12},
    ]


def load_ready_templates():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'market_templates_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return [
        {"name": "Espada de Cavalaria", "slot_type": "Arsenal Ofensivo", "quality": "Normal", "power_bonus": 18, "base_price": 220},
        {"name": "Montante de Aço Negro", "slot_type": "Arsenal Ofensivo", "quality": "Ótimo", "power_bonus": 28, "base_price": 380},
        {"name": "Armadura de Placas Leve", "slot_type": "Blindagem Operacional", "quality": "Normal", "power_bonus": 15, "base_price": 240},
        {"name": "Gibão de Couro Endurecido", "slot_type": "Blindagem Operacional", "quality": "Ótimo", "power_bonus": 24, "base_price": 360},
        {"name": "Manto Anti-Tóxico", "slot_type": "Blindagem Operacional", "quality": "Normal", "power_bonus": 12, "terrain_mitigation": "toxic_swamp", "base_price": 270},
        {"name": "Anel de Prata Encantado", "slot_type": "Joia", "quality": "Normal", "power_bonus": 10, "base_price": 180},
        {"name": "Pingente de Guarda-Corpo", "slot_type": "Joia", "quality": "Ótimo", "power_bonus": 18, "base_price": 300},
        {"name": "Runa de Purificação do Pântano", "slot_type": "Inscrição", "quality": "Normal", "power_bonus": 10, "terrain_mitigation": "toxic_swamp", "base_price": 220},
        {"name": "Inscrição de Calor Ígneo", "slot_type": "Inscrição", "quality": "Normal", "power_bonus": 10, "terrain_mitigation": "glacier_frost", "base_price": 230},
        {"name": "Selo de Firmeza Estrutural", "slot_type": "Inscrição", "quality": "Normal", "power_bonus": 12, "terrain_mitigation": "unstable_mine", "base_price": 220},
        {"name": "Ração Militar Fortificada", "slot_type": "Consumível", "quality": "Normal", "power_bonus": 5, "energy_bonus": 25, "charges": 3, "base_price": 95},
        {"name": "Tônico de Foco Rápido", "slot_type": "Consumível", "quality": "Ótimo", "power_bonus": 8, "energy_bonus": 35, "charges": 3, "base_price": 160},
        {"name": "Elixir do Fôlego Ártico", "slot_type": "Consumível", "quality": "Normal", "power_bonus": 0, "energy_bonus": 25, "terrain_mitigation": "glacier_frost", "charges": 3, "base_price": 130},
    ]


def load_bulletins():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'bulletins_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []


def load_vip_orders():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'vip_orders_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return []


SLOT_PLURALS = {
    "Arma": "Armas",
    "Armadura": "Armaduras",
    "Joia": "Joias",
    "Inscrição": "Inscrições",
    "Consumível": "Consumíveis",
}


def _pick_bulletin_headline(slot: str, rng: random.Random) -> str:
    bulletins = load_bulletins()
    slot_label = SLOT_PLURALS.get(slot, slot)
    if bulletins:
        entry = rng.choice(bulletins)
        if isinstance(entry, dict):
            tmpl = entry.get("headline", entry.get("text", ""))
        else:
            tmpl = str(entry)
        try:
            return tmpl.format(slot=slot_label, slot_singular=slot)
        except Exception:
            return tmpl
    return f"Ruptura de fornecimento eleva a demanda por {slot_label} junto à Câmara dos Mercadores."


AVAILABLE_MATERIALS = load_materials()
READY_ITEM_TEMPLATES = load_ready_templates()


class MarketEngine:
    def __init__(self, rng=None, state=None):
        self.materials_for_sale = []
        self.ready_items_for_sale = []
        self.affix_manuals = []
        self.bulletin = None
        self.active_vip_order: Optional[Dict[str, Any]] = None
        self.refresh_market(round_number=1, rng=rng, state=state)

    def refresh_market(self, round_number=1, rng=None, state=None):
        """Gera um estoque rotativo de insumos, itens prontos e manuais para a rodada especificada."""
        if rng is None:
            rng = random.Random()

        available_mats = load_materials()
        self.materials_for_sale = []
        for mat in available_mats:
            if rng.random() < 0.85:
                qty = rng.randint(mat["min_qty"], mat["max_qty"])
                price_mult = rng.uniform(0.9, 1.2)
                price = int(mat["unit_price"] * price_mult)
                self.materials_for_sale.append({
                    "material_id": mat["id"],
                    "name": mat["name"],
                    "unit_price": price,
                    "available_quantity": qty,
                })

        self.ready_items_for_sale = []
        sampled_templates = rng.sample(READY_ITEM_TEMPLATES, k=min(5, len(READY_ITEM_TEMPLATES)))
        for tpl in sampled_templates:
            final_price = int(tpl["base_price"] * rng.uniform(0.95, 1.15))
            item_data = {
                "market_item_id": str(uuid.uuid4()),
                "name": tpl["name"],
                "slot_type": tpl["slot_type"],
                "quality": tpl["quality"],
                "power_bonus": tpl["power_bonus"],
                "energy_bonus": tpl.get("energy_bonus", 0),
                "terrain_mitigation": tpl.get("terrain_mitigation", None),
                "price": final_price,
            }
            if tpl["slot_type"] == "Consumível":
                item_data["charges"] = tpl.get("charges", 3)
                item_data["max_charges"] = tpl.get("charges", 3)
            self.ready_items_for_sale.append(item_data)

        # Boletim de Mercado semanal
        balance = get_balance()
        sales_cfg = balance.get("sales", {})
        bulletin_chance = float(sales_cfg.get("bulletin_chance", 0.35))
        b_min = float(sales_cfg.get("bulletin_multiplier_min", 1.5))
        b_max = float(sales_cfg.get("bulletin_multiplier_max", 3.0))

        if rng.random() < bulletin_chance:
            slot = rng.choice(SLOTS)
            mult = round(rng.uniform(b_min, b_max), 2)
            headline = _pick_bulletin_headline(slot, rng)
            self.bulletin = {
                "target": slot,
                "multiplier": mult,
                "headline": headline
            }
        else:
            self.bulletin = None

        # Encomendas VIP da Nobreza
        if self.active_vip_order:
            if round_number >= self.active_vip_order.get("expires_round", 0):
                self.active_vip_order = None

        if not self.active_vip_order:
            vip_chance = float(sales_cfg.get("vip_order_chance", 0.35))
            if rng.random() < vip_chance:
                vip_orders = load_vip_orders()
                if vip_orders:
                    chosen = copy.deepcopy(rng.choice(vip_orders))
                    duration = int(sales_cfg.get("vip_order_duration_rounds", 2))
                    chosen["expires_round"] = round_number + duration
                    self.active_vip_order = chosen

        # Manuais de Ofício (Crafting v2)
        self.affix_manuals = []
        try:
            from catalog import get_catalog
            cat = get_catalog()
            manual_offer_count = int(balance.get("crafting", {}).get("manual_offer_count", 2))
            known = set(getattr(state, "known_affixes", [])) if state else set()
            candidates = [
                a for a in cat.affixes.values()
                if a.get("unlock", {}).get("method") == "market" and a["affix_id"] not in known
            ]
            if candidates:
                sample_k = min(manual_offer_count, len(candidates))
                chosen = rng.sample(candidates, k=sample_k)
                for a in chosen:
                    slots = list({link["slot"] for link in cat.affix_material_links.get(a["affix_id"], [])})
                    name_disp = a.get("name")
                    if not name_disp:
                        nm_m = a.get("name_m", "")
                        nm_f = a.get("name_f", "")
                        name_disp = f"{nm_m} / {nm_f}" if nm_m and nm_f else (nm_m or nm_f)
                    self.affix_manuals.append({
                        "affix_id": a["affix_id"],
                        "name": name_disp,
                        "kind": a.get("kind"),
                        "cost": a.get("unlock", {}).get("cost", 250),
                        "slots": slots,
                    })
        except Exception:
            pass

    def get_market_data(self):
        return {
            "materials_for_sale": self.materials_for_sale,
            "ready_items_for_sale": self.ready_items_for_sale,
            "affix_manuals": self.affix_manuals,
            "bulletin": self.bulletin,
            "vip_order": self.active_vip_order,
        }

    def to_dict(self) -> dict:
        """Serializa o catálogo, manuais, boletim e encomenda VIP do mercado para persistência."""
        return {
            "materials_for_sale": copy.deepcopy(self.materials_for_sale),
            "ready_items_for_sale": copy.deepcopy(self.ready_items_for_sale),
            "affix_manuals": copy.deepcopy(self.affix_manuals),
            "bulletin": copy.deepcopy(self.bulletin),
            "active_vip_order": copy.deepcopy(self.active_vip_order),
        }

    def from_dict(self, data: dict):
        """Restaura o estado do mercado a partir de um dicionário serializado."""
        if not isinstance(data, dict):
            return self
        if "materials_for_sale" in data:
            self.materials_for_sale = copy.deepcopy(data["materials_for_sale"])
        if "ready_items_for_sale" in data:
            self.ready_items_for_sale = copy.deepcopy(data["ready_items_for_sale"])
        if "affix_manuals" in data:
            self.affix_manuals = copy.deepcopy(data["affix_manuals"])
        if "bulletin" in data:
            self.bulletin = copy.deepcopy(data["bulletin"])
        if "active_vip_order" in data:
            self.active_vip_order = copy.deepcopy(data["active_vip_order"])
        elif "vip_order" in data:
            self.active_vip_order = copy.deepcopy(data["vip_order"])
        return self

    def calculate_part_spot_price(self, part_id: str, state=None) -> int:
        """
        Calcula o preço de aquisição spot de uma peça modular.
        - Se houver contrato B2B ativo com a corporação produtora: aplica eventual desconto contratual (sem ágio).
        - Se não houver contrato ativo (ou se houver exclusividade com marca rival): aplica o ágio spot alfandegário de +50% (spot_markup: 1.50).
        """
        from b2b import get_parts_dict, get_b2b_balance
        parts = get_parts_dict()
        part = parts.get(part_id)
        if not part:
            return 100

        base_cost = int(part.get("base_cost", 50))
        corp_id = part.get("corp_id")
        b2b_cfg = get_b2b_balance()
        spot_markup = float(b2b_cfg.get("spot_markup", 1.50))

        if not state:
            return int(base_cost * spot_markup)

        contracts = getattr(state, "active_b2b_contracts", [])
        active_contract = next((c for c in contracts if c.get("corp_id") == corp_id), None)

        if active_contract:
            discount = float(active_contract.get("discount_pct", 0.0))
            return max(1, int(base_cost * (1.0 - discount)))

        # Sem contrato com a corporação da peça: tarifa spot de 50%
        return int(base_cost * spot_markup)

    def buy_spot_part(self, part_id: str, quantity: int = 1, state=None) -> dict:
        """
        Executa a compra spot de peças modulares no mercado industrial.
        """
        if state is None:
            return {"success": False, "message": "Estado do jogo indisponível para transação."}

        if quantity <= 0:
            return {"success": False, "message": "Quantidade solicitada deve ser maior que zero."}

        from b2b import get_parts_dict, get_b2b_balance
        parts = get_parts_dict()
        part = parts.get(part_id)
        if not part:
            return {"success": False, "message": f"Peça modular '{part_id}' não localizada no catálogo industrial."}

        # Cota semanal máxima de aquisição spot por peça (Anti-Exploit)
        b2b_cfg = get_b2b_balance()
        max_quota = int(b2b_cfg.get("weekly_spot_quota_per_part", 3))
        already_bought = state.get_spot_purchases_this_week(part_id) if hasattr(state, "get_spot_purchases_this_week") else 0
        if already_bought + quantity > max_quota:
            remaining = max(0, max_quota - already_bought)
            return {
                "success": False,
                "message": f"Cota semanal de aquisição spot esgotada para '{part.get('name', part_id)}': limite regulatório da junta comercial de {max_quota} un./semana (já adquirido: {already_bought}, cota restante: {remaining}).",
                "quota_exceeded": True,
                "remaining_quota": remaining,
            }

        # Bloqueio de componentes avançados conforme nível de patrocínio ativo (Bronze: T1, Prata: T1+T2, Ouro: T1+T2+T3)
        tier = part.get("tier", 1)
        corp_id = part.get("corp_id")
        active_contracts = getattr(state, "active_b2b_contracts", [])
        corp_contracts = [c for c in active_contracts if c.get("corp_id") == corp_id]

        max_unlocked_tier = 1
        if corp_contracts:
            contract_tier = str(corp_contracts[0].get("tier", "Bronze")).capitalize()
            if contract_tier == "Ouro":
                max_unlocked_tier = 3
            elif contract_tier == "Prata":
                max_unlocked_tier = 2
            elif contract_tier == "Bronze":
                max_unlocked_tier = 1

        if corp_id != "corp_crown_notarial" and tier > max_unlocked_tier:
            req_tier = "Prata" if tier == 2 else "Ouro"
            current_status = "Nenhum" if not corp_contracts else f"Nível {corp_contracts[0].get('tier')}"
            return {
                "success": False,
                "message": f"Aquisição embargada: peças da fornecedora de Nível {tier} exigem convênio ativo de Nível {req_tier} ou superior (Seu convênio atual: {current_status}). Celebre a parceria B2B na aba de Convênios.",
            }

        unit_price = self.calculate_part_spot_price(part_id, state)
        total_cost = unit_price * quantity

        if state.gold < total_cost:
            return {
                "success": False,
                "message": f"Saldo em tesouraria insuficiente para aquisição spot. Custo: {total_cost} Ouro, Saldo: {state.gold} Ouro.",
            }

        state.gold -= total_cost
        state.add_warehouse_part(part_id, quantity)
        if hasattr(state, "record_spot_purchase"):
            state.record_spot_purchase(part_id, quantity)

        new_bought = state.get_spot_purchases_this_week(part_id) if hasattr(state, "get_spot_purchases_this_week") else quantity
        remaining_quota = max(0, max_quota - new_bought)

        return {
            "success": True,
            "part_id": part_id,
            "part_name": part.get("name", part_id),
            "quantity": quantity,
            "unit_price": unit_price,
            "total_cost": total_cost,
            "gold": state.gold,
            "warehouse_parts": state.warehouse_parts,
            "spot_purchases_this_week": getattr(state, "spot_purchases_this_week", {}),
            "remaining_quota": remaining_quota,
            "message": f"Ordem spot aprovada: {quantity}x '{part.get('name')}' adquiridas por {total_cost} Ouro (Cota restante nesta semana: {remaining_quota} un.).",
        }


