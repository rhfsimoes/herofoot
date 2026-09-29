import os
import json
import random


_WORKSHOPS_CACHE = None

def get_workshops_data():
    global _WORKSHOPS_CACHE
    if _WORKSHOPS_CACHE is None:
        path = os.path.join(os.path.dirname(__file__), 'data', 'workshops_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                _WORKSHOPS_CACHE = json.load(f)
        else:
            _WORKSHOPS_CACHE = {}
    return _WORKSHOPS_CACHE


_get_workshops_data = get_workshops_data


def create_gororoba() -> dict:
    """Fallback para ordem de produção sem receita homologada ('Cozinhando no Escuro')."""
    data = get_workshops_data()
    multipliers = data.get("quality_multipliers", {})
    return {
        "name": "Gororoba",
        "quality": "Fraco",
        "multiplier": multipliers.get("Fraco", 1.0),
        "special_suffix_active": False
    }


def determine_quality(level: int, rng=None) -> str:
    """
    Determina a qualidade do item com base estrita no nível da oficina (1 a 6).
    As probabilidades são lidas de workshops_seed.json.
    Aleatoriedade exclusivamente via random.Random injetável.
    Comparação estrita por '<', ignorando faixas com 0% de probabilidade.
    """
    if rng is None:
        rng = random.Random()

    data = get_workshops_data()
    levels_map = data.get("levels", {})
    q_probs = levels_map.get(str(level))
    if not q_probs:
        q_probs = levels_map.get("1", {})

    roll = rng.uniform(0, 100)

    cumulative = 0.0
    last_valid_quality = "Normal"
    for quality in ["Fraco", "Normal", "Ótimo", "Lendário"]:
        weight = q_probs.get(quality, 0)
        if weight <= 0:
            continue
        last_valid_quality = quality
        cumulative += weight
        if roll < cumulative:
            return quality

    return last_valid_quality


class Workshop:
    @staticmethod
    def determine_quality(level, rng=None):
        return determine_quality(level, rng=rng)


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

    def craft_item(self, recipe_id, workshop_level, rng=None):
        """
        Executa a ordem de fabricação de um item usando recipe_id e o nível da oficina.
        Retorna dicionário com o item gerado, sua qualidade e multiplicadores de auditoria.
        """
        recipe = self.recipe_db.get(recipe_id)

        if not recipe:
            return create_gororoba()

        prefix = recipe.get("prefix_component", "Prefixo Desconhecido")
        base = recipe.get("base_item", "Item Base")
        suffix = recipe.get("suffix_component", "Sufixo Desconhecido")

        quality = Workshop.determine_quality(workshop_level, rng=rng)
        data = get_workshops_data()
        multipliers = data.get("quality_multipliers", {})
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
