"""Integridade do catálogo de crafting v2. Uso: python -m unittest tests/test_catalog.py
A pasta de dados vem de HEROFOOT_DATA_DIR (padrão: data)."""
import json, os, re, unittest

default_data = "data" if os.path.exists("data") else os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA = os.environ.get("HEROFOOT_DATA_DIR", default_data)
SLOTS = {"Arsenal Ofensivo", "Blindagem Operacional", "Ativo de Performance", "Alvará de Risco", "Provisão Logística"}
BRANCHES = {"Ferragem", "Alquimia", "Joalheria", "Culinária"}
TERRAINS = {"neutral", "toxic_swamp", "glacier_frost", "unstable_mine", "submerged_ruins", "arcane_fog", "lightning_peaks", "volcanic_heat"}
EFFECTS = {"power_flat", "power_pct", "terrain_mitigation", "climate_mitigation",
           "energy_bonus_flat", "charges_flat", "value_pct"}
UNLOCKS = {"start", "market", "loot"}
FORBIDDEN = re.compile(r"\b(gramado|estádio|gol|bilheteria|escanteio|brasfoot)\b", re.I)


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


class TestCatalog(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.materials = {m["id"]: m for m in load("materials_seed.json")}
        cls.values = {v["material_id"]: v for v in load("material_values_seed.json")}
        cls.recipes = load("recipes_seed.json")
        cls.ingredients = load("recipe_ingredients_seed.json")
        cls.affixes = {a["affix_id"]: a for a in load("affixes_seed.json")}
        cls.rows = load("material_affixes_seed.json")
        cls.effects = load("affix_effects_seed.json")
        cls.sources = load("material_sources_seed.json")

    def test_ids_unicos(self):
        self.assertEqual(len(self.materials), len(load("materials_seed.json")))
        self.assertEqual(len(self.affixes), len(load("affixes_seed.json")))

    def test_receitas(self):
        for rid, r in self.recipes.items():
            self.assertEqual(rid, r["recipe_id"])
            self.assertIn(r["slot"], SLOTS)
            self.assertIn(r["branch"], BRANCHES)
            self.assertIn(r["gender"], {"m", "f"})
            self.assertTrue(1 <= r["min_workshop_level"] <= 6)
            self.assertIn(r["unlock"]["method"], UNLOCKS)
            self.assertNotIn("ingredients", r)

    def test_ingredientes(self):
        for rid in self.recipes:
            self.assertTrue([i for i in self.ingredients if i["recipe_id"] == rid],
                            f"{rid} sem ingredientes")
        for i in self.ingredients:
            self.assertIn(i["recipe_id"], self.recipes)
            self.assertIn(i["material_id"], self.materials)
            self.assertGreaterEqual(i["quantity"], 1)

    def test_afixos_basico(self):
        for aid, a in self.affixes.items():
            self.assertIn(a["kind"], {"prefix", "suffix"})
            if a["kind"] == "prefix":
                self.assertTrue(a.get("name_m") and a.get("name_f"), aid)
            else:
                self.assertTrue(a.get("name"), aid)
            self.assertIn(a["unlock"]["method"], UNLOCKS)
            if a["unlock"]["method"] == "market":
                self.assertGreater(a["unlock"].get("cost", 0), 0, aid)
            self.assertTrue([r for r in self.rows if r["affix_id"] == aid], f"{aid} sem material")
            self.assertTrue([e for e in self.effects if e["affix_id"] == aid], f"{aid} sem efeito")

    def test_ligacoes(self):
        for r in self.rows:
            self.assertIn(r["material_id"], self.materials)
            self.assertIn(r["affix_id"], self.affixes)
            self.assertIn(r["slot"], SLOTS)
            self.assertGreaterEqual(r["quantity"], 1)
            if "recipe_id" in r:
                self.assertIn(r["recipe_id"], self.recipes)
                self.assertEqual(self.recipes[r["recipe_id"]]["slot"], r["slot"])
        # o mesmo afixo não pode aparecer em slots incompatíveis com o vocabulário
        for e in self.effects:
            self.assertIn(e["affix_id"], self.affixes)
            self.assertIn(e["effect"], EFFECTS)
            if "requires_quality" in e:
                self.assertEqual(e["requires_quality"], "Lendário")
                self.assertEqual(self.affixes[e["affix_id"]]["kind"], "suffix")

    def test_vocabulario_por_slot(self):
        slots_do_afixo = {}
        for r in self.rows:
            slots_do_afixo.setdefault(r["affix_id"], set()).add(r["slot"])
        for e in self.effects:
            slots = slots_do_afixo[e["affix_id"]]
            if e["effect"] in ("energy_bonus_flat", "charges_flat"):
                self.assertEqual(slots, {"Provisão Logística"}, e["affix_id"])
            if e["effect"] == "terrain_mitigation":
                self.assertEqual(slots, {"Alvará de Risco"}, e["affix_id"])
                self.assertEqual(self.affixes[e["affix_id"]]["kind"], "prefix")
                self.assertIn(e["value"], TERRAINS)
            if e["effect"] == "climate_mitigation":
                self.assertEqual(slots, {"Alvará de Risco"}, e["affix_id"])
                self.assertEqual(self.affixes[e["affix_id"]]["kind"], "prefix")
        for aid in self.affixes:
            n = [e for e in self.effects if e["affix_id"] == aid and e["effect"] == "terrain_mitigation"]
            self.assertLessEqual(len(n), 1, aid)

    def test_cobertura_inicial(self):
        """Toda receita tem, desde o início, ao menos 1 prefixo e 1 sufixo conhecidos."""
        for rid, rec in self.recipes.items():
            for kind in ("prefix", "suffix"):
                ok = [r for r in self.rows
                      if r["slot"] == rec["slot"]
                      and r.get("recipe_id", rid) == rid
                      and self.affixes[r["affix_id"]]["kind"] == kind
                      and self.affixes[r["affix_id"]]["unlock"]["method"] == "start"]
                self.assertTrue(ok, f"{rid} sem {kind} inicial")

    def test_mitigacao_inicial_disponivel(self):
        """Pântano e Glacial são mitigáveis desde o início; a Mina exige Manual de Ofício."""
        inicio = {e["value"] for e in self.effects if e["effect"] == "terrain_mitigation"
                  and self.affixes[e["affix_id"]]["unlock"]["method"] == "start"}
        self.assertEqual(inicio, {"toxic_swamp", "glacier_frost"})
        todos = {e["value"] for e in self.effects if e["effect"] == "terrain_mitigation"}
        self.assertEqual(todos, TERRAINS - {"neutral"})

    def test_materiais_tem_uso_e_origem(self):
        usados = {i["material_id"] for i in self.ingredients} | {r["material_id"] for r in self.rows}
        for m in self.materials:
            self.assertIn(m, usados, f"{m} sem uso")
            drop = any(s["material_id"] == m for s in self.sources)
            self.assertTrue(m in self.values or drop, f"{m} sem origem")
            self.assertIn(m, self.values, f"{m} sem preço")

    def test_fontes(self):
        for s in self.sources:
            self.assertIn(s["terrain"], TERRAINS)
            self.assertIn(s["material_id"], self.materials)
            self.assertTrue(0 < s["chance"] <= 1)
            self.assertLessEqual(s["qty_min"], s["qty_max"])
            self.assertTrue(1 <= s["min_rooms_reached"] <= 10)

    def test_margem_dos_afixos(self):
        """Afixo com bônus de valor deve pagar o material gasto (média das receitas onde se aplica)."""
        for aid in self.affixes:
            v = sum(e["value"] for e in self.effects
                    if e["affix_id"] == aid and e["effect"] == "value_pct" and "requires_quality" not in e)
            rows = [r for r in self.rows if r["affix_id"] == aid]
            bases = [x["market_value_base"] for x in self.recipes.values()
                     if x["slot"] in {r["slot"] for r in rows}]
            ganho = v * (sum(bases) / len(bases))
            custo = min(r["quantity"] * self.values[r["material_id"]]["unit_price"] for r in rows)
            self.assertGreaterEqual(ganho, custo * 0.9, f"{aid}: ganho {ganho:.0f} < custo {custo}")

    def test_termos_proibidos(self):
        textos = [m["name"] for m in self.materials.values()]
        textos += [r["name"] for r in self.recipes.values()]
        for a in self.affixes.values():
            textos += [a.get("name", ""), a.get("name_m", ""), a.get("name_f", "")]
        for t in textos:
            self.assertIsNone(FORBIDDEN.search(t), t)


if __name__ == "__main__":
    unittest.main()
