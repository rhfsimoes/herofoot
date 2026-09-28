"""
HeroFoot Crafting Service.
Gerencia as ordens de fabricação de itens nas 4 bancadas da oficina.
"""

import uuid
from constants import normalize_branch, normalize_slot


class CraftingService:
    def __init__(self, state, crafting_engine):
        self.state = state
        self.crafting_engine = crafting_engine

    def craft_item(self, recipe_id: str, branch: str = "Ferragem") -> dict:
        """Fabrica um item na oficina usando a receita e nível da filial."""
        if not self.crafting_engine:
            return {"success": False, "message": "Motor de produção indisponível."}

        recipe = self.crafting_engine.recipe_db.get(recipe_id)
        if not recipe:
            return {"success": False, "message": "Receita não localizada no Livro de Ordens."}

        if not self.state.has_materials_for(recipe):
            return {"success": False, "message": "Insumos insuficientes para esta ordem de serviço."}

        # Consome insumos
        self.state.consume_materials(recipe)

        # Determina nível da filial (Ferragem, Alquimia, etc.)
        norm_branch = normalize_branch(recipe.get("branch", branch))
        workshop_level = self.state.get_workshop_level(norm_branch)
        crafted_item = self.crafting_engine.craft_item(recipe_id, workshop_level)

        slot = normalize_slot(recipe.get("slot", "Arma"))
        crafted_item["item_instance_id"] = str(uuid.uuid4())
        crafted_item["slot_type"] = slot
        crafted_item["branch"] = norm_branch
        crafted_item["power_bonus"] = int(recipe.get("base_power", 20) * crafted_item.get("multiplier", 1.0))
        crafted_item["market_value_base"] = int(recipe.get("market_value_base", 150) * crafted_item.get("multiplier", 1.0))

        if recipe.get("terrain_mitigation"):
            crafted_item["terrain_mitigation"] = recipe["terrain_mitigation"]
        if recipe.get("energy_bonus") or recipe.get("energy_restore"):
            crafted_item["energy_bonus"] = recipe.get("energy_bonus", recipe.get("energy_restore", 0))

        # Cargas em consumíveis (padrão 3 cargas)
        if slot == "Consumível":
            crafted_item["charges"] = recipe.get("charges", 3)
            crafted_item["max_charges"] = recipe.get("charges", 3)

        self.state.inventory.append(crafted_item)

        return {"success": True, "item": crafted_item}
