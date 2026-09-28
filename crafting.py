import os
import json
import random

# Re-export CounterSales from counter_sales for backwards compatibility
from counter_sales import CounterSales

_WORKSHOPS_CACHE = None

def _get_workshops_data():
    global _WORKSHOPS_CACHE
    if _WORKSHOPS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'workshops_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _WORKSHOPS_CACHE = json.load(f)
        else:
            _WORKSHOPS_CACHE = {}
    return _WORKSHOPS_CACHE


class Workshop:
    @staticmethod
    def determine_quality(level):
        """
        Determines the item quality deterministically based on workshop level.
        Levels range from 1 to 6. Probabilities read from workshops_seed.json.
        """
        roll = random.uniform(0, 100)
        data = _get_workshops_data()
        levels_map = data.get("levels", {})

        # Default fallback if level not found
        default_probs = {"Fraco": 50, "Normal": 40, "Ótimo": 10, "Lendário": 0}
        q_probs = levels_map.get(str(level), default_probs)

        fraco_pct = q_probs.get("Fraco", 0)
        normal_pct = q_probs.get("Normal", 0)
        otimo_pct = q_probs.get("Ótimo", 0)

        if roll <= fraco_pct:
            return "Fraco"
        elif roll <= fraco_pct + normal_pct:
            return "Normal"
        elif roll <= fraco_pct + normal_pct + otimo_pct:
            return "Ótimo"
        else:
            return "Lendário"


class CraftingEngine:
    def __init__(self, recipe_db_path=None):
        if not recipe_db_path:
            default_path = os.path.join(os.path.dirname(__file__), 'data', 'recipes_seed.json')
            if os.path.exists(default_path):
                recipe_db_path = default_path
        self.recipe_db = self._load_recipes(recipe_db_path) if recipe_db_path else {}

    def _load_recipes(self, path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}

    def craft_item(self, recipe_id, workshop_level):
        """
        Main method to craft an item using a recipe ID and workshop level.
        Returns a dictionary with the final generated name, quality, and multipliers.
        """
        recipe = self.recipe_db.get(recipe_id)

        if not recipe:
            # Fallback for unknown recipe ('Cozinhando no Escuro')
            return {
                "name": "Gororoba",
                "quality": "Fraco",
                "multiplier": 0.5,
                "special_suffix_active": False
            }

        prefix = recipe.get("prefix_component", "Prefixo Desconhecido")
        base = recipe.get("base_item", "Item Base")
        suffix = recipe.get("suffix_component", "Sufixo Desconhecido")

        quality = Workshop.determine_quality(workshop_level)
        data = _get_workshops_data()
        multipliers = data.get("quality_multipliers", {
            "Fraco": 0.70,
            "Normal": 1.0,
            "Ótimo": 1.35,
            "Lendário": 1.80
        })
        multiplier = multipliers.get(quality, 1.0)

        final_name = f"{prefix} {base} {suffix}"

        return {
            "name": final_name,
            "quality": quality,
            "multiplier": multiplier,
            "components": {
                "prefix": prefix,
                "base_item": base,
                "suffix": suffix
            },
            "special_suffix_active": quality == "Lendário"
        }
