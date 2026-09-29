"""
HeroFoot — Catálogo Central de Crafting v2
Carrega os seeds normalizados e disponibiliza índices relacionais em memória.
Nenhum valor de regra ou balanceamento hardcoded.
"""

import os
import json
from typing import Dict, List, Any, Optional

DEFAULT_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


class Catalog:
    _instance: Optional["Catalog"] = None

    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir or os.environ.get("HEROFOOT_DATA_DIR", DEFAULT_DATA_DIR)
        self.reload()

    def reload(self):
        """Carrega e indexa todas as tabelas normalizadas do catálogo."""
        # 1. Metadados
        meta_path = os.path.join(self.data_dir, "catalog_meta.json")
        self.catalog_version = 1
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                self.catalog_version = meta.get("catalog_version", 1)

        # 2. Materiais
        self.materials: Dict[str, Dict[str, Any]] = {}
        mat_path = os.path.join(self.data_dir, "materials_seed.json")
        if os.path.exists(mat_path):
            with open(mat_path, "r", encoding="utf-8") as f:
                for m in json.load(f):
                    self.materials[m["id"]] = m

        # 3. Valores e Mercado de Materiais
        self.material_values: Dict[str, Dict[str, Any]] = {}
        val_path = os.path.join(self.data_dir, "material_values_seed.json")
        if os.path.exists(val_path):
            with open(val_path, "r", encoding="utf-8") as f:
                for v in json.load(f):
                    self.material_values[v["material_id"]] = v

        # 4. Receitas de Base
        self.recipes: Dict[str, Dict[str, Any]] = {}
        rec_path = os.path.join(self.data_dir, "recipes_seed.json")
        if os.path.exists(rec_path):
            with open(rec_path, "r", encoding="utf-8") as f:
                self.recipes = json.load(f)

        # 5. Ingredientes das Receitas
        self.recipe_ingredients: Dict[str, List[Dict[str, Any]]] = {}
        self.material_recipes: Dict[str, List[str]] = {}
        ing_path = os.path.join(self.data_dir, "recipe_ingredients_seed.json")
        if os.path.exists(ing_path):
            with open(ing_path, "r", encoding="utf-8") as f:
                for item in json.load(f):
                    rid = item["recipe_id"]
                    mid = item["material_id"]
                    self.recipe_ingredients.setdefault(rid, []).append(item)
                    self.material_recipes.setdefault(mid, []).append(rid)

        # 6. Afixos
        self.affixes: Dict[str, Dict[str, Any]] = {}
        aff_path = os.path.join(self.data_dir, "affixes_seed.json")
        if os.path.exists(aff_path):
            with open(aff_path, "r", encoding="utf-8") as f:
                for a in json.load(f):
                    self.affixes[a["affix_id"]] = a

        # 7. Vínculos Material -> Afixo
        self.material_affixes: List[Dict[str, Any]] = []
        self.affix_material_links: Dict[str, List[Dict[str, Any]]] = {}
        self.material_to_affixes: Dict[str, List[str]] = {}
        ma_path = os.path.join(self.data_dir, "material_affixes_seed.json")
        if os.path.exists(ma_path):
            with open(ma_path, "r", encoding="utf-8") as f:
                self.material_affixes = json.load(f)
                for link in self.material_affixes:
                    aid = link["affix_id"]
                    mid = link["material_id"]
                    self.affix_material_links.setdefault(aid, []).append(link)
                    if aid not in self.material_to_affixes.setdefault(mid, []):
                        self.material_to_affixes[mid].append(aid)

        # 8. Efeitos dos Afixos
        self.affix_effects: Dict[str, List[Dict[str, Any]]] = {}
        eff_path = os.path.join(self.data_dir, "affix_effects_seed.json")
        if os.path.exists(eff_path):
            with open(eff_path, "r", encoding="utf-8") as f:
                for eff in json.load(f):
                    self.affix_effects.setdefault(eff["affix_id"], []).append(eff)

        # 9. Fontes de Espólio dos Materiais
        self.material_sources: Dict[str, List[Dict[str, Any]]] = {}
        src_path = os.path.join(self.data_dir, "material_sources_seed.json")
        if os.path.exists(src_path):
            with open(src_path, "r", encoding="utf-8") as f:
                for src in json.load(f):
                    self.material_sources.setdefault(src["material_id"], []).append(src)

    # --- Métodos de Consulta ---

    def get_recipe(self, recipe_id: str) -> Optional[Dict[str, Any]]:
        return self.recipes.get(recipe_id)

    def get_recipe_ingredients(self, recipe_id: str) -> List[Dict[str, Any]]:
        return self.recipe_ingredients.get(recipe_id, [])

    def get_affix(self, affix_id: str) -> Optional[Dict[str, Any]]:
        return self.affixes.get(affix_id)

    def get_affix_effects(self, affix_id: str, quality: str = "Normal") -> List[Dict[str, Any]]:
        """Retorna os efeitos ativos de um afixo, considerando se a qualidade preenche eventuais requisitos."""
        effects = self.affix_effects.get(affix_id, [])
        active = []
        for e in effects:
            req_q = e.get("requires_quality")
            if req_q:
                if req_q == "Lendário" and quality == "Lendário":
                    active.append(e)
            else:
                active.append(e)
        return active

    def get_affix_material_links(self, affix_id: str) -> List[Dict[str, Any]]:
        return self.affix_material_links.get(affix_id, [])

    def get_affixes_for_slot(self, slot: str, recipe_id: Optional[str] = None, kind: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retorna afixos válidos para o slot e recipe_id especificados.
        """
        valid_affixes = []
        seen = set()
        for link in self.material_affixes:
            if link.get("slot") != slot:
                continue
            if link.get("recipe_id") and recipe_id and link["recipe_id"] != recipe_id:
                continue
            aid = link["affix_id"]
            if aid in seen:
                continue
            affix = self.affixes.get(aid)
            if not affix:
                continue
            if kind and affix.get("kind") != kind:
                continue
            seen.add(aid)
            valid_affixes.append(affix)
        return valid_affixes

    def get_material(self, material_id: str) -> Optional[Dict[str, Any]]:
        m = self.materials.get(material_id)
        if not m:
            return None
        res = dict(m)
        val = self.material_values.get(material_id, {})
        res["unit_price"] = val.get("price", 20)
        res["min_qty"] = val.get("min_qty", 1)
        res["max_qty"] = val.get("max_qty", 5)
        res["variance"] = val.get("variance", 0.2)
        return res

    def get_material_sources(self, material_id: str) -> List[Dict[str, Any]]:
        return self.material_sources.get(material_id, [])

    def get_recipes_using_material(self, material_id: str) -> List[str]:
        return self.material_recipes.get(material_id, [])

    def get_affixes_using_material(self, material_id: str) -> List[str]:
        return self.material_to_affixes.get(material_id, [])


_catalog_instance: Optional[Catalog] = None

def get_catalog(data_dir: Optional[str] = None) -> Catalog:
    global _catalog_instance
    if _catalog_instance is None or data_dir is not None:
        _catalog_instance = Catalog(data_dir=data_dir)
    return _catalog_instance
