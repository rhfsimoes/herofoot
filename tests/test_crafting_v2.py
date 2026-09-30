"""
HeroFoot Testes Unitários de Crafting v2 (P3.2).
Valida:
1. Valores de referência numéricos exatos da seção 3 do contrato.
2. Consumo de base + afixos e rejeição de afixo desconhecido, slot incompatível e materiais insuficientes.
3. Forja sem afixos produz base pura com nome canônico.
4. Efeito especial do sufixo ativado exclusivamente na qualidade Lendário.
5. Regra de unicidade de mitigação de terreno (máximo 1 mitigação).
6. Aquisição de Manuais de Ofício (learn_affix) com débito fiscal e rejeição de start/loot.
7. Persistência e round-trip de save preservando known_affixes e known_recipes.
"""

import unittest
from controller import GameController
from catalog import get_catalog
from item_resolver import resolve_item


class TestCraftingV2(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.crafting_service = self.controller.crafting_service
        self.catalog = get_catalog()

    def test_section_3_reference_values_match_exactly(self):
        """
        Garante conformidade estrita com a tabela de valores de referência da §3:
        - rec_01 + pref_afiada + suf_acidente_trabalho:
            Fraco: Poder 23, valor 210
            Normal: Poder 33, valor 300
            Lendário: Poder 65, valor 540
        - rec_04 + pref_concentrada + suf_prontuario:
            Normal: Suprimentos 33, cargas 4, valor 180
            Lendário: Suprimentos 77, cargas 4, valor 324
        - rec_06 + pref_ignea (sem sufixo):
            Normal: Poder 12, protege glacier_frost, valor 252
            Lendário: Poder 22, valor 454
        - rec_03 sem afixos:
            Normal: Poder 20, valor 220
        """
        # Caso 1: rec_01 + pref_afiada + suf_acidente_trabalho
        c1_fraco = resolve_item("rec_01", "pref_afiada", "suf_acidente_trabalho", quality="Fraco")
        self.assertEqual(c1_fraco["power_bonus"], 23)
        self.assertEqual(c1_fraco["market_value_base"], 210)

        c1_normal = resolve_item("rec_01", "pref_afiada", "suf_acidente_trabalho", quality="Normal")
        self.assertEqual(c1_normal["power_bonus"], 33)
        self.assertEqual(c1_normal["market_value_base"], 300)

        c1_lendario = resolve_item("rec_01", "pref_afiada", "suf_acidente_trabalho", quality="Lendário")
        self.assertEqual(c1_lendario["power_bonus"], 65)
        self.assertEqual(c1_lendario["market_value_base"], 540)
        self.assertTrue(c1_lendario["special_suffix_active"])

        # Caso 2: rec_04 + pref_concentrada + suf_prontuario
        c2_normal = resolve_item("rec_04", "pref_concentrada", "suf_prontuario", quality="Normal")
        self.assertEqual(c2_normal["energy_bonus"], 33)
        self.assertEqual(c2_normal["charges"], 4)
        self.assertEqual(c2_normal["market_value_base"], 180)

        c2_lendario = resolve_item("rec_04", "pref_concentrada", "suf_prontuario", quality="Lendário")
        self.assertEqual(c2_lendario["energy_bonus"], 77)
        self.assertEqual(c2_lendario["charges"], 4)
        self.assertEqual(c2_lendario["market_value_base"], 324)

        # Caso 3: rec_06 + pref_ignea (sem sufixo)
        c3_normal = resolve_item("rec_06", "pref_ignea", None, quality="Normal")
        self.assertEqual(c3_normal["power_bonus"], 12)
        self.assertEqual(c3_normal["terrain_mitigation"], "glacier_frost")
        self.assertEqual(c3_normal["market_value_base"], 252)

        c3_lendario = resolve_item("rec_06", "pref_ignea", None, quality="Lendário")
        self.assertEqual(c3_lendario["power_bonus"], 22)
        self.assertEqual(c3_lendario["market_value_base"], 454)

        # Caso 4: rec_03 sem afixos
        c4_normal = resolve_item("rec_03", None, None, quality="Normal")
        self.assertEqual(c4_normal["power_bonus"], 20)
        self.assertEqual(c4_normal["market_value_base"], 220)
        self.assertEqual(c4_normal["name"], "Cota de Malha")

    def test_craft_consumes_base_and_affix_materials(self):
        """Craft consome os insumos da base e os materiais dos afixos."""
        # rec_01 requer 3x mat_iron_ore
        # pref_afiada requer 1x mat_iron_ore
        # suf_acidente_trabalho requer 1x mat_iron_ore
        # Total necessário: 5x mat_iron_ore
        self.state.materials["mat_iron_ore"] = 10
        inv_before = len(self.state.inventory)
        iron_before = self.state.materials["mat_iron_ore"]

        res = self.crafting_service.craft_item(
            "rec_01",
            prefix_id="pref_afiada",
            suffix_id="suf_acidente_trabalho"
        )
        self.assertTrue(res["success"])
        self.assertEqual(self.state.materials["mat_iron_ore"], iron_before - 5)
        self.assertEqual(len(self.state.inventory), inv_before + 1)

    def test_craft_rejects_insufficient_materials(self):
        """Rejeita ordem de serviço se faltar material para a base ou para algum afixo."""
        self.state.materials["mat_iron_ore"] = 4  # Precisa de 5
        res = self.crafting_service.craft_item(
            "rec_01",
            prefix_id="pref_afiada",
            suffix_id="suf_acidente_trabalho"
        )
        self.assertFalse(res["success"])
        self.assertIn("insuficientes", res["message"].lower())
        self.assertEqual(self.state.materials["mat_iron_ore"], 4)

    def test_craft_rejects_unknown_affix(self):
        """Rejeita afixo não conhecido pela guilda."""
        # pref_temperada é de mercado e não é conhecida inicialmente
        self.state.materials["mat_iron_ore"] = 10
        self.state.materials["mat_ember_coal"] = 10
        res = self.crafting_service.craft_item("rec_01", prefix_id="pref_temperada")
        self.assertFalse(res["success"])
        self.assertIn("não homologado", res["message"].lower())

    def test_craft_rejects_affix_of_wrong_slot(self):
        """Rejeita afixo pertencente a outro slot (ex: pref_reforcada de Blindagem Operacional no Arsenal Ofensivo)."""
        # Adiciona pref_reforcada temporariamente para testar compatibilidade de slot
        if "pref_reforcada" not in self.state.known_affixes:
            self.state.known_affixes.append("pref_reforcada")
        self.state.materials["mat_iron_ore"] = 10

        res = self.crafting_service.craft_item("rec_01", prefix_id="pref_reforcada")
        self.assertFalse(res["success"])
        self.assertIn("incompatível", res["message"].lower())

    def test_craft_rejects_prefix_as_suffix(self):
        """Rejeita quando um prefixo é enviado no campo suffix_id."""
        self.state.materials["mat_iron_ore"] = 10
        res = self.crafting_service.craft_item("rec_01", suffix_id="pref_afiada")
        self.assertFalse(res["success"])
        self.assertIn("categoria de prefixos", res["message"].lower())

    def test_craft_without_affixes_produces_pure_base(self):
        """Sem afixos produz a base pura com nome e stats canônicos."""
        self.state.materials["mat_iron_ore"] = 10
        res = self.crafting_service.craft_item("rec_01")
        self.assertTrue(res["success"])
        item = res["item"]
        self.assertEqual(item["name"], "Espada Longa de Aço")
        self.assertIsNone(item.get("prefix_id"))
        self.assertIsNone(item.get("suffix_id"))

    def test_suffix_extra_effect_only_on_legendary(self):
        """O efeito extra do sufixo só se ativa na qualidade Lendário."""
        # suf_acidente_trabalho concede +10% power_pct extra se Lendário
        normal_item = resolve_item("rec_01", None, "suf_acidente_trabalho", quality="Normal")
        # normal: (25 + 5) * 1.0 = 30
        self.assertEqual(normal_item["power_bonus"], 30)

        legendary_item = resolve_item("rec_01", None, "suf_acidente_trabalho", quality="Lendário")
        # lendário: (25 + 5) * (1 + 0.10) * 1.80 = 30 * 1.10 * 1.80 = 33 * 1.80 = 59.4 -> 59
        self.assertEqual(legendary_item["power_bonus"], 59)
        self.assertTrue(legendary_item["special_suffix_active"])

    def test_no_item_has_more_than_one_terrain_mitigation(self):
        """Nenhum item pode ter mais de uma mitigação de terreno."""
        for rid in self.catalog.recipes:
            for aid in self.catalog.affixes:
                item = resolve_item(rid, prefix_id=aid, quality="Normal")
                mit = item.get("terrain_mitigation")
                if mit:
                    self.assertIsInstance(mit, str)

    def test_learn_affix_debits_gold_and_rejects_start_or_loot(self):
        """learn_affix debita o ouro certo e recusa afixos de 'start' ou de 'loot'."""
        self.state.gold = 1000

        # pref_temperada é de mercado e custa 300 ouro
        res = self.crafting_service.learn_affix("pref_temperada")
        self.assertTrue(res["success"])
        self.assertEqual(self.state.gold, 700)
        self.assertIn("pref_temperada", self.state.known_affixes)

        # Tentar comprar afixo já conhecido deve falhar
        res_dup = self.crafting_service.learn_affix("pref_temperada")
        self.assertFalse(res_dup["success"])

        # Tentar comprar afixo 'start' (ex: pref_afiada) deve falhar
        res_start = self.crafting_service.learn_affix("pref_afiada")
        self.assertFalse(res_start["success"])
        self.assertIn("não está disponível para aquisição mercantil", res_start["message"].lower())

        # Tentar comprar com ouro insuficiente
        self.state.gold = 50
        res_poor = self.crafting_service.learn_affix("pref_escamada")  # custa 300
        self.assertFalse(res_poor["success"])
        self.assertIn("insuficientes", res_poor["message"].lower())

    def test_save_roundtrip_preserves_known_affixes_and_recipes(self):
        """Round-trip de save preserva known_affixes e known_recipes."""
        self.crafting_service.learn_affix("pref_temperada")
        self.assertIn("pref_temperada", self.state.known_affixes)

        # Salva e recarrega via controller
        save_res = self.controller.save("slot_1")
        self.assertTrue(save_res["success"])

        # Reinicia e confere restauração
        new_ctrl = GameController()
        new_ctrl.load("slot_1")
        self.assertIn("pref_temperada", new_ctrl.state.known_affixes)
        self.assertEqual(new_ctrl.state.known_recipes, self.state.known_recipes)
        self.assertEqual(new_ctrl.state.catalog_version, self.state.catalog_version)


if __name__ == "__main__":
    unittest.main()
