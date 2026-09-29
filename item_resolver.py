"""
HeroFoot — Resolvedor de Itens e Estatísticas de Crafting v2
Calcula atributos numéricos a partir da base e afixos conforme regras da seção 3 do contrato.
Gera nome composto respeitando o gênero da base e gerencia foto/reidratação do item.
"""

import os
import json
import uuid
from typing import Dict, Any, Optional

from catalog import get_catalog, Catalog

DEFAULT_WORKSHOP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "workshops_seed.json")

def get_quality_multipliers() -> Dict[str, float]:
    path = os.environ.get("HEROFOOT_WORKSHOPS_SEED", DEFAULT_WORKSHOP_PATH)
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("quality_multipliers", {
                    "Fraco": 0.70, "Normal": 1.00, "Ótimo": 1.35, "Lendário": 1.80
                })
        except Exception:
            pass
    return {"Fraco": 0.70, "Normal": 1.00, "Ótimo": 1.35, "Lendário": 1.80}


def build_name(recipe: Dict[str, Any], prefix: Optional[Dict[str, Any]] = None, suffix: Optional[Dict[str, Any]] = None) -> str:
    """
    Constrói a denominação corporativa do item:
    nome = [prefixo no gênero da base] + base + [sufixo] (partes ausentes são omitidas)
    """
    parts = []
    gender = recipe.get("gender", "m")

    if prefix:
        pref_text = prefix.get("name_f") if gender == "f" else prefix.get("name_m")
        if pref_text:
            parts.append(pref_text)

    base_name = recipe.get("name", "Item")
    parts.append(base_name)

    if suffix:
        suf_text = suffix.get("name")
        if suf_text:
            parts.append(suf_text)

    return " ".join(parts)


def resolve_item(
    recipe_id: str,
    prefix_id: Optional[str] = None,
    suffix_id: Optional[str] = None,
    quality: str = "Normal",
    prefix_material_id: Optional[str] = None,
    suffix_material_id: Optional[str] = None,
    catalog: Optional[Catalog] = None,
    item_instance_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calcula e instancia um item de crafting v2 com os atributos numéricos congelados (foto).
    """
    cat = catalog or get_catalog()
    recipe = cat.get_recipe(recipe_id)
    if not recipe:
        raise ValueError(f"Ordem de serviço inválida: receita '{recipe_id}' não localizada no catálogo.")

    prefix = cat.get_affix(prefix_id) if prefix_id else None
    suffix = cat.get_affix(suffix_id) if suffix_id else None

    # Multiplicador de qualidade da oficina
    mults = get_quality_multipliers()
    q_mult = float(mults.get(quality, 1.00))

    # Consolidação dos efeitos dos afixos
    effects = []
    if prefix_id:
        effects.extend(cat.get_affix_effects(prefix_id, quality=quality))
    if suffix_id:
        effects.extend(cat.get_affix_effects(suffix_id, quality=quality))

    power_flat = sum(float(e["value"]) for e in effects if e.get("effect") == "power_flat")
    power_pct = sum(float(e["value"]) for e in effects if e.get("effect") == "power_pct")
    energy_bonus_flat = sum(float(e["value"]) for e in effects if e.get("effect") == "energy_bonus_flat")
    charges_flat = sum(int(e["value"]) for e in effects if e.get("effect") == "charges_flat")
    value_pct = sum(float(e["value"]) for e in effects if e.get("effect") == "value_pct")

    # Mitigação de terreno (no máximo uma, do prefixo)
    terrain_mitigation = None
    if prefix_id:
        for e in cat.get_affix_effects(prefix_id, quality=quality):
            if e.get("effect") == "terrain_mitigation":
                terrain_mitigation = e.get("value")
                break

    # Cálculos canônicos da seção 3
    base_power = float(recipe.get("base_power", 0))
    power_bonus = round((base_power + power_flat) * (1.0 + power_pct) * q_mult)

    slot = recipe.get("slot")
    energy_bonus = 0
    charges = 0
    if slot == "Consumível":
        base_energy = float(recipe.get("energy_restore", 0))
        energy_bonus = round((base_energy + energy_bonus_flat) * q_mult)
        base_charges = int(recipe.get("charges", 3))
        charges = base_charges + charges_flat

    base_value = float(recipe.get("market_value_base", 100))
    market_value_base = round(base_value * (1.0 + value_pct) * q_mult)

    full_name = build_name(recipe, prefix, suffix)

    item = {
        "item_instance_id": item_instance_id or str(uuid.uuid4()),
        "recipe_id": recipe_id,
        "name": full_name,
        "slot": slot,
        "slot_type": slot,
        "branch": recipe.get("branch"),
        "quality": quality,
        "power_bonus": int(power_bonus),
        "energy_bonus": int(energy_bonus),
        "charges": int(charges) if slot == "Consumível" else None,
        "max_charges": int(charges) if slot == "Consumível" else None,
        "terrain_mitigation": terrain_mitigation,
        "market_value_base": int(market_value_base),
        "prefix_id": prefix_id,
        "suffix_id": suffix_id,
        "prefix_material_id": prefix_material_id,
        "suffix_material_id": suffix_material_id,
        "catalog_version": cat.catalog_version,
        "special_suffix_active": (quality == "Lendário"),
    }

    if slot != "Consumível":
        item.pop("charges", None)
        item.pop("max_charges", None)

    return item


def rehydrate_item(item_data: Dict[str, Any], catalog: Optional[Catalog] = None) -> Dict[str, Any]:
    """
    Recalcula as propriedades de um item a partir de seus identificadores originais de catálogo.
    """
    recipe_id = item_data.get("recipe_id")
    if not recipe_id:
        return item_data

    recalculated = resolve_item(
        recipe_id=recipe_id,
        prefix_id=item_data.get("prefix_id"),
        suffix_id=item_data.get("suffix_id"),
        quality=item_data.get("quality", "Normal"),
        prefix_material_id=item_data.get("prefix_material_id"),
        suffix_material_id=item_data.get("suffix_material_id"),
        catalog=catalog,
        item_instance_id=item_data.get("item_instance_id"),
    )
    return recalculated
