"""
HeroFoot Market Engine
Gerencia o mercado rotativo com insumos e itens prontos para compra, além da liquidação de estoque.
"""

import os
import json
import random
import uuid

from constants import SLOTS
from balance import get_balance


def load_materials():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'materials_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
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
        {"name": "Espada de Cavalaria", "slot_type": "Arma", "quality": "Normal", "power_bonus": 18, "base_price": 220},
        {"name": "Montante de Aço Negro", "slot_type": "Arma", "quality": "Ótimo", "power_bonus": 28, "base_price": 380},
        {"name": "Armadura de Placas Leve", "slot_type": "Armadura", "quality": "Normal", "power_bonus": 15, "base_price": 240},
        {"name": "Gibão de Couro Endurecido", "slot_type": "Armadura", "quality": "Ótimo", "power_bonus": 24, "base_price": 360},
        {"name": "Manto Anti-Tóxico", "slot_type": "Armadura", "quality": "Normal", "power_bonus": 12, "terrain_mitigation": "toxic_swamp", "base_price": 270},
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
    def __init__(self, rng=None):
        self.materials_for_sale = []
        self.ready_items_for_sale = []
        self.bulletin = None
        self.refresh_market(round_number=1, rng=rng)

    def refresh_market(self, round_number=1, rng=None):
        """Gera um estoque rotativo de insumos e itens prontos para a rodada especificada."""
        if rng is None:
            rng = random.Random()

        self.materials_for_sale = []
        for mat in AVAILABLE_MATERIALS:
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

    def get_market_data(self):
        return {
            "materials_for_sale": self.materials_for_sale,
            "ready_items_for_sale": self.ready_items_for_sale,
            "bulletin": self.bulletin,
        }

    def to_dict(self) -> dict:
        """Serializa o catálogo e boletim do mercado para persistência."""
        import copy
        return {
            "materials_for_sale": copy.deepcopy(self.materials_for_sale),
            "ready_items_for_sale": copy.deepcopy(self.ready_items_for_sale),
            "bulletin": copy.deepcopy(self.bulletin),
        }

    def from_dict(self, data: dict):
        """Restaura o estado do mercado a partir de um dicionário serializado."""
        import copy
        if not isinstance(data, dict):
            return self
        if "materials_for_sale" in data:
            self.materials_for_sale = copy.deepcopy(data["materials_for_sale"])
        if "ready_items_for_sale" in data:
            self.ready_items_for_sale = copy.deepcopy(data["ready_items_for_sale"])
        if "bulletin" in data:
            self.bulletin = copy.deepcopy(data["bulletin"])
        return self

