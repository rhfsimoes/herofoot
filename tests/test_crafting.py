import unittest
import copy
import random
from controller import GameController
from crafting import (
    determine_quality,
    create_gororoba,
    get_workshops_data,
    CraftingEngine,
    Workshop,
)
from services.crafting_service import CraftingService

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestCrafting(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.crafting_service = self.controller.crafting_service
        self.crafting_engine = self.controller.crafting_engine
        self.workshops_data = get_workshops_data()

    def test_10000_crafts_per_level_match_seed_probabilities(self):
        """
        10.000 crafts por nível batem as probabilidades da tabela do seed com ±1,5 ponto percentual.
        Verifica todos os níveis de 1 a 6.
        """
        levels_config = self.workshops_data.get("levels", {})
        total_crafts = 10000

        for level_int in range(1, 7):
            level_str = str(level_int)
            expected_probs = levels_config[level_str]

            # RNG determinístico e injetável para cada nível
            rng = random.Random(20260928 + level_int)
            counts = {"Fraco": 0, "Normal": 0, "Ótimo": 0, "Lendário": 0}

            for _ in range(total_crafts):
                q = determine_quality(level_int, rng=rng)
                counts[q] += 1

            for quality, expected_pct in expected_probs.items():
                observed_pct = (counts[quality] / total_crafts) * 100.0
                diff = abs(observed_pct - expected_pct)
                self.assertLessEqual(
                    diff,
                    1.5,
                    f"Nível {level_int} - {quality}: esperado {expected_pct}%, obtido {observed_pct:.2f}% (dif {diff:.2f}%)"
                )

    def test_level_1_never_generates_legendary(self):
        """Nível 1 nunca gera Lendário em nenhum sorteio."""
        rng = random.Random(1337)
        for _ in range(10000):
            q = determine_quality(1, rng=rng)
            self.assertNotEqual(q, "Lendário", "Nível 1 não pode gerar qualidade Lendário.")

    def test_recipe_alchemy_with_blacksmithing_branch_uses_alchemy(self):
        """
        O ramo é sempre recipe['branch'] (normalizado).
        O parâmetro branch do cliente é ignorado; receita de Alquimia com branch enviado como Ferragem usa Alquimia.
        """
        # Configura filial de Ferragem em nível alto e Alquimia em nível 1
        self.state.workshop_levels["Ferragem"] = 5
        self.state.workshop_levels["Alquimia"] = 1

        # rec_06 é da Alquimia e exige min_workshop_level = 2
        # Abastece materiais para rec_06
        self.state.materials["mat_eucalyptus_herb"] = 10
        self.state.materials["mat_mana_crystal"] = 10

        # Tenta craftar enviando branch "Ferragem"
        res_fail = self.crafting_service.craft_item("rec_06", branch="Ferragem")
        self.assertFalse(res_fail["success"])
        self.assertIn("alquimia", res_fail["message"].lower())
        self.assertIn("laudo pericial", res_fail["message"].lower())

        # Agora promove Alquimia para nível 2
        self.state.workshop_levels["Alquimia"] = 2
        res_success = self.crafting_service.craft_item("rec_06", branch="Ferragem")
        self.assertTrue(res_success["success"])
        self.assertEqual(res_success["item"]["branch"], "Alquimia")

    def test_insufficient_workshop_level_rejected_with_inspection_report(self):
        """
        Nível insuficiente de oficina é rejeitado com laudo de inspeção pericial
        e não consome insumos.
        """
        self.state.workshop_levels["Alquimia"] = 1
        self.state.materials["mat_eucalyptus_herb"] = 5
        self.state.materials["mat_mana_crystal"] = 5

        herb_before = self.state.materials["mat_eucalyptus_herb"]
        crystal_before = self.state.materials["mat_mana_crystal"]
        inv_len_before = len(self.state.inventory)

        result = self.crafting_service.craft_item("rec_06")  # exige nível 2

        self.assertFalse(result["success"])
        msg = result["message"].lower()
        self.assertIn("laudo pericial", msg)
        self.assertIn("alquimia", msg)
        self.assertIn("nível 1", msg)
        self.assertIn("nível 2", msg)

        # Insumos não devem ser debitados
        self.assertEqual(self.state.materials["mat_eucalyptus_herb"], herb_before)
        self.assertEqual(self.state.materials["mat_mana_crystal"], crystal_before)
        self.assertEqual(len(self.state.inventory), inv_len_before)

    def test_upgrade_workshop_debits_gold_and_stops_at_level_6(self):
        """
        Upgrade debita o ouro correto lido de workshops_seed.json e para no nível 6
        (rejeita upgrades além do 6).
        """
        upgrade_costs = self.workshops_data.get("upgrade_costs", {})
        self.state.gold = 20000
        self.state.workshop_levels["Ferragem"] = 1

        for target_level in range(2, 7):
            expected_cost = upgrade_costs[str(target_level)]
            gold_before = self.state.gold

            res = self.crafting_service.upgrade_workshop("Ferragem")

            self.assertTrue(res["success"])
            self.assertEqual(res["level"], target_level)
            self.assertEqual(res["cost"], expected_cost)
            self.assertEqual(self.state.workshop_levels["Ferragem"], target_level)
            self.assertEqual(self.state.gold, gold_before - expected_cost)
            # Refletido no get_state do controller
            self.assertEqual(self.controller.get_state()["workshop_levels"]["Ferragem"], target_level)

        # Tentativa de upgrade além do nível 6 deve ser rejeitada
        gold_at_max = self.state.gold
        res_beyond = self.crafting_service.upgrade_workshop("Ferragem")
        self.assertFalse(res_beyond["success"])
        self.assertEqual(self.state.workshop_levels["Ferragem"], 6)
        self.assertEqual(self.state.gold, gold_at_max)
        self.assertIn("máximo", res_beyond["message"].lower())

    def test_upgrade_with_insufficient_gold_rejected(self):
        """Upgrade com ouro insuficiente é rejeitado e não altera o estado nem o ouro."""
        self.state.workshop_levels["Joalheria"] = 1
        self.state.gold = 100  # Custo do nível 2 é 500

        res = self.crafting_service.upgrade_workshop("Joalheria")
        self.assertFalse(res["success"])
        self.assertEqual(self.state.workshop_levels["Joalheria"], 1)
        self.assertEqual(self.state.gold, 100)
        self.assertIn("insuficientes", res["message"].lower())

    def test_gororoba_fallback_function(self):
        """Fallback 'Gororoba' é uma função separada e é invocado para receitas inexistentes."""
        g = create_gororoba()
        self.assertEqual(g["name"], "Gororoba")
        self.assertEqual(g["quality"], "Fraco")
        self.assertFalse(g["special_suffix_active"])
        multipliers = self.workshops_data.get("quality_multipliers", {})
        self.assertEqual(g["multiplier"], multipliers.get("Fraco", 0.70))

        # Teste via CraftingEngine com receita desconhecida
        res = self.crafting_engine.craft_item("receita_fantasma_inexistente", 1)
        self.assertEqual(res["name"], "Gororoba")
        self.assertEqual(res["quality"], "Fraco")

    def test_quality_multipliers_from_seed_and_special_suffix(self):
        """Multiplicadores de qualidade vêm de workshops_seed.json e special_suffix_active é True sse Lendário."""
        seed_multipliers = self.workshops_data.get("quality_multipliers", {})

        # Cria uma classe dummy RNG para forçar cada qualidade
        class MockRng:
            def __init__(self, fixed_roll):
                self.fixed_roll = fixed_roll

            def uniform(self, a, b):
                return self.fixed_roll

        # Nível 4: Fraco 0, Normal 30, Ótimo 50, Lendário 20
        # roll = 10 -> Normal, roll = 40 -> Ótimo, roll = 90 -> Lendário
        mock_normal = MockRng(10.0)
        res_normal = self.crafting_engine.craft_item("rec_01", 4, rng=mock_normal)
        self.assertEqual(res_normal["quality"], "Normal")
        self.assertEqual(res_normal["multiplier"], seed_multipliers["Normal"])
        self.assertFalse(res_normal["special_suffix_active"])

        mock_legendary = MockRng(90.0)
        res_legendary = self.crafting_engine.craft_item("rec_01", 4, rng=mock_legendary)
        self.assertEqual(res_legendary["quality"], "Lendário")
        self.assertEqual(res_legendary["multiplier"], seed_multipliers["Lendário"])
        self.assertTrue(res_legendary["special_suffix_active"])

    def test_no_forbidden_terms_in_crafting_messages(self):
        """Garante que as mensagens de crafting e upgrade não possuem termos proibidos."""
        self.state.workshop_levels["Ferragem"] = 1
        self.state.gold = 50

        calls = [
            lambda: self.crafting_service.craft_item("receita_inexistente"),
            lambda: self.crafting_service.craft_item("rec_06"),  # Nível insuficiente
            lambda: self.crafting_service.craft_item("rec_01"),  # Falta insumo
            lambda: self.crafting_service.upgrade_workshop("Ferragem"),  # Falta ouro
            lambda: self.crafting_service.upgrade_workshop("ramo_inexistente"),
        ]

        for call in calls:
            res = call()
            msg = res.get("message", "").lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, msg, f"Termo proibido '{term}' encontrado na mensagem: '{msg}'")


if __name__ == '__main__':
    unittest.main()
