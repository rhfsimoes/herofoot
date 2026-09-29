"""
HeroFoot — Testes de Materiais de Fantasia, Afixos PoE e Sufixos Corporativos.
Valida:
1. Catálogo de 20-25+ materiais canônicos e distribuição nas 4 faixas de raridade (Comum, Raro, Épico, Lendário).
2. Tabelas agregadas: valores de mercado, origens de espólio por terreno e afinidades de afixos.
3. Prefixos táticos PoE e Sufixos corporativos Munchkin (7/10 contido).
4. Forja modular com os novos materiais e afixos consumindo o estoque correto.
5. Ausência absoluta de termos proibidos.
"""

import re
import unittest
from controller import GameController
from catalog import get_catalog
from item_resolver import resolve_item

FORBIDDEN_REGEX = re.compile(r"\b(gramado|estádio|estadio|gol|bilheteria|escanteio|brasfoot)\b", re.I)

EXPECTED_MATERIALS = [
    # Minérios / Metais
    ("mat_iron_ore", "Minério de Ferro", "Comum"),
    ("mat_soapstone", "Pedra-Sabão", "Comum"),
    ("mat_mithril_ingot", "Lingote de Mithril", "Raro"),
    ("mat_black_steel", "Aço Negro", "Raro"),
    ("mat_adamantite_ore", "Minério de Adamante", "Épico"),
    ("mat_runic_gold", "Ouro Rúnico", "Lendário"),
    # Madeira / Plantas
    ("mat_common_ash", "Freixo Comum", "Comum"),
    ("mat_ancient_wood", "Madeira Antiga", "Raro"),
    ("mat_mandrake_root", "Raiz de Mandrágora", "Raro"),
    ("mat_moonlight_herb", "Erva do Luar", "Épico"),
    ("mat_glowing_moss", "Musgo Brilhante", "Comum"),
    # Animais / Monstros
    ("mat_tanned_leather", "Couro Curtido", "Comum"),
    ("mat_basilisk_scale", "Escama de Basilisco", "Raro"),
    ("mat_chimera_horn", "Chifre de Quimera", "Épico"),
    ("mat_ancient_dragon_scale", "Escama de Dragão Ancestral", "Lendário"),
    ("mat_griffin_claw", "Garra de Grifo", "Raro"),
    # Místicos / Arcanos
    ("mat_pure_ectoplasm", "Ectoplasma Puro", "Raro"),
    ("mat_liquid_mana_crystal", "Cristal de Mana Líquida", "Épico"),
    ("mat_lapis_powder", "Pó de Lápis-Lazúli", "Comum"),
    ("mat_fire_golem_core", "Núcleo de Golem de Fogo", "Épico"),
    ("mat_soul_stone", "Pedra da Alma", "Lendário"),
]

EXPECTED_POE_PREFIXES = [
    ("pref_afiada", "Afiado"),
    ("pref_predatorio", "Predatório"),
    ("pref_galvanizado", "Galvanizado"),
    ("pref_glacial", "Glacial"),
    ("pref_vulcanico", "Vulcânico"),
    ("pref_macico", "Maciço"),
    ("pref_impenetravel", "Impenetrável"),
    ("pref_penitente", "Penitente"),
    ("pref_economico", "Econômico"),
]

EXPECTED_MUNCHKIN_SUFFIXES = [
    ("suf_risco_calculado", "do Risco Calculado"),
    ("suf_eficiencia_tributaria", "da Eficiência Tributária"),
    ("suf_rescisao_imediata", "da Rescisão Imediata"),
    ("suf_turno_extraordinario", "do Turno Extraordinário"),
    ("suf_compliance_magico", "do Compliance Mágico"),
    ("suf_responsabilidade_limitada", "da Responsabilidade Limitada"),
]


class TestMaterialsAndAffixes(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.crafting_service = self.controller.crafting_service
        self.catalog = get_catalog()

    def test_materials_catalogue_completeness_and_rarity_tiers(self):
        """Verifica a presença dos 20+ materiais canônicos e suas faixas de raridade."""
        self.assertGreaterEqual(len(self.catalog.materials), 20)

        # Checa presença de todos os materiais canônicos solicitados
        for mat_id, name, expected_rarity in EXPECTED_MATERIALS:
            mat = self.catalog.get_material(mat_id)
            self.assertIsNotNone(mat, f"Material '{mat_id}' ({name}) não encontrado no catálogo.")
            self.assertEqual(mat["name"], name)
            self.assertEqual(mat["rarity"], expected_rarity, f"Raridade divergente para '{mat_id}'.")

        # Checa cobertura de todas as 4 faixas de raridade
        rarities_found = {m.get("rarity") for m in self.catalog.materials.values()}
        for tier in ["Comum", "Raro", "Épico", "Lendário"]:
            self.assertIn(tier, rarities_found, f"Faixa de raridade '{tier}' vazia no catálogo.")

    def test_material_values_and_market_tier_pricing(self):
        """Valores de mercado aumentam progressivamente pelas faixas de raridade."""
        tier_prices = {"Comum": [], "Raro": [], "Épico": [], "Lendário": []}
        for mat_id, m in self.catalog.materials.items():
            mat_info = self.catalog.get_material(mat_id)
            self.assertIsNotNone(mat_info)
            price = mat_info["unit_price"]
            self.assertGreater(price, 0)
            self.assertEqual(mat_info["market_value_base"], price)
            tier_prices[mat_info["rarity"]].append(price)

        avg_comum = sum(tier_prices["Comum"]) / len(tier_prices["Comum"])
        avg_raro = sum(tier_prices["Raro"]) / len(tier_prices["Raro"])
        avg_epico = sum(tier_prices["Épico"]) / len(tier_prices["Épico"])
        avg_lendario = sum(tier_prices["Lendário"]) / len(tier_prices["Lendário"])

        self.assertLess(avg_comum, avg_raro, "Média Comum deve ser menor que Raro")
        self.assertLess(avg_raro, avg_epico, "Média Raro deve ser menor que Épico")
        self.assertLess(avg_epico, avg_lendario, "Média Épico deve ser menor que Lendário")

    def test_material_sources_distribution(self):
        """Todos os materiais possuem fontes mapeadas em biomas válidos."""
        valid_terrains = {"neutral", "toxic_swamp", "glacier_frost", "unstable_mine"}
        for mat_id in self.catalog.materials:
            sources = self.catalog.get_material_sources(mat_id)
            self.assertGreater(len(sources), 0, f"Material '{mat_id}' não possui nenhuma fonte de espólio.")
            for s in sources:
                self.assertIn(s["terrain"], valid_terrains)
                self.assertGreater(s["chance"], 0)
                self.assertLessEqual(s["chance"], 1.0)
                self.assertLessEqual(s["qty_min"], s["qty_max"])

    def test_poe_prefixes_and_corporate_suffixes_loaded(self):
        """Verifica a presença dos prefixos PoE e dos sufixos corporativos com seus efeitos."""
        for pref_id, expected_name_m in EXPECTED_POE_PREFIXES:
            affix = self.catalog.get_affix(pref_id)
            self.assertIsNotNone(affix, f"Prefixo '{pref_id}' não carregado.")
            self.assertEqual(affix["kind"], "prefix")
            self.assertEqual(affix["name_m"], expected_name_m)
            effects = self.catalog.get_affix_effects(pref_id)
            self.assertGreater(len(effects), 0, f"Prefixo '{pref_id}' sem efeitos associados.")

        for suf_id, expected_name in EXPECTED_MUNCHKIN_SUFFIXES:
            affix = self.catalog.get_affix(suf_id)
            self.assertIsNotNone(affix, f"Sufixo '{suf_id}' não carregado.")
            self.assertEqual(affix["kind"], "suffix")
            self.assertEqual(affix["name"], expected_name)
            effects = self.catalog.get_affix_effects(suf_id)
            self.assertGreater(len(effects), 0, f"Sufixo '{suf_id}' sem efeitos associados.")

    def test_modular_crafting_with_new_materials_and_affixes(self):
        """Testa a forja modular completa combinando novo prefixo PoE e novo sufixo corporativo."""
        # rec_01 (Espada Longa de Aço) requer:
        # - base: 3x mat_iron_ore
        # - pref_predatorio: 1x mat_black_steel
        # - suf_rescisao_imediata: 1x mat_chimera_horn
        self.state.materials["mat_iron_ore"] = 10
        self.state.materials["mat_black_steel"] = 5
        self.state.materials["mat_chimera_horn"] = 5

        # Registra afixos como conhecidos se a guilda tiver lista de conhecidos
        if hasattr(self.state, "known_affixes") and self.state.known_affixes:
            if "pref_predatorio" not in self.state.known_affixes:
                self.state.known_affixes.append("pref_predatorio")
            if "suf_rescisao_imediata" not in self.state.known_affixes:
                self.state.known_affixes.append("suf_rescisao_imediata")

        res = self.crafting_service.craft_item(
            "rec_01",
            prefix_id="pref_predatorio",
            suffix_id="suf_rescisao_imediata"
        )
        self.assertTrue(res["success"], f"Falha na forja: {res.get('message')}")
        item = res["item"]

        # Espada Longa de Aço tem gender 'f', então prefixo flexiona para 'Predatória'
        self.assertIn("Predatória", item["name"])
        self.assertIn("Espada Longa de Aço", item["name"])
        self.assertIn("da Rescisão Imediata", item["name"])

        # Consumo de materiais validado
        self.assertEqual(self.state.materials["mat_iron_ore"], 7)
        self.assertEqual(self.state.materials["mat_black_steel"], 4)
        self.assertEqual(self.state.materials["mat_chimera_horn"], 4)

    def test_no_forbidden_terms_in_materials_and_affixes(self):
        """Garante que nenhum nome de material ou afixo utilize termos proibidos do contrato."""
        all_texts = []
        for m in self.catalog.materials.values():
            all_texts.append(m["name"])
        for a in self.catalog.affixes.values():
            if "name" in a:
                all_texts.append(a["name"])
            if "name_m" in a:
                all_texts.append(a["name_m"])
            if "name_f" in a:
                all_texts.append(a["name_f"])

        for text in all_texts:
            self.assertIsNone(FORBIDDEN_REGEX.search(text), f"Termo proibido encontrado em '{text}'.")


if __name__ == "__main__":
    unittest.main()
