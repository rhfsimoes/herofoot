"""
Testes Unitários de Balanceamento Massivo e Curvas Matemáticas (v0.8.0)
Valida TASK-805, TASK-808, TASK-809 e TASK-810.
"""

import unittest
import random
import os
import json

from match_engine import Team, MatchEngine
from balance import get_balance
from controller import GameController
from services.hero_service import generate_hero, calculate_hero_power


class TestBalanceMassive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.balance = get_balance()

    def test_task_809_b2b_spot_quota_is_3(self):
        """TASK-809: Verifica se a cota semanal de peças spot foi reduzida de 5 para 3."""
        quota = self.balance.get("b2b", {}).get("weekly_spot_quota_per_part")
        self.assertEqual(quota, 3, "A cota semanal de aquisição spot por peça deve ser estritamente 3.")

        controller = GameController()
        # Tenta comprar 3 unidades (permitido)
        res1 = controller.market_engine.buy_spot_part("part_aethelgard_blade", quantity=3, state=controller.state)
        self.assertTrue(res1.get("success"), f"Compra de 3 peças falhou: {res1.get('message')}")

        # Tenta comprar a 4ª unidade na mesma semana (deve ser rejeitada pela cota de 3)
        res2 = controller.market_engine.buy_spot_part("part_aethelgard_blade", quantity=1, state=controller.state)
        self.assertFalse(res2.get("success"), "A 4ª peça na mesma semana deveria ser bloqueada.")
        self.assertTrue(res2.get("quota_exceeded"), "Mensagem de cota excedida deve estar sinalizada.")

    def test_task_805_academy_training_weeks_is_10(self):
        """TASK-805: Verifica se o tempo de maturação da Academia foi alterado de 4 para 10 semanas."""
        training_weeks = self.balance.get("academy", {}).get("training_weeks")
        self.assertEqual(training_weeks, 10, "O tempo de treinamento da Academia de Base deve ser de 10 semanas.")

        youth = generate_hero(is_youth=True, rng=random.Random(42))
        self.assertEqual(youth.get("training_weeks"), 0)
        self.assertEqual(youth.get("max_training_weeks"), 10)
        self.assertEqual(youth.get("maturation_pct"), 0)
        self.assertFalse(youth.get("is_graduated"))
        # Verifica que o novato sai no Tier 1 (poder inicial baixo)
        self.assertLessEqual(youth.get("current_power"), 35)

    def test_task_805_academy_growth_over_10_weeks(self):
        """TASK-805: Simula 10 semanas na academia e verifica que a graduação ocorre sem inflação de atributos."""
        controller = GameController()
        controller.state.youth_academy = [generate_hero(is_youth=True, rng=random.Random(100 + i)) for i in range(3)]

        for week in range(1, 11):
            reports = controller.hero_service.train_youth_academy_weekly(rng=random.Random(week * 7))

        graduated = [y for y in controller.state.youth_academy if y.get("is_graduated")]
        self.assertEqual(len(graduated), 3, "Todos os 3 aprendizes deveriam ter se graduado na 10ª semana.")
        for g in graduated:
            self.assertEqual(g.get("maturation_pct"), 100)
            self.assertIn("Graduado com Láurea", g.get("traits", []))
            # Garante que o jovem graduado seja Tier 1 (Nível 1, poder estritamente controlado abaixo de 55)
            self.assertLessEqual(g.get("current_power"), 55, f"Jovem graduado {g.get('name')} excedeu o teto de Tier 1: {g.get('current_power')}")

    def test_task_810_full_item_drop_in_dungeon(self):
        """TASK-810: Verifica que itens manufaturados completos podem ser sorteados em masmorras."""
        controller = GameController()
        # Simula sala 10 (Boss Final - 25% chance de drop de item completo)
        found_full_item = False
        for i in range(30):
            loot = controller.phase_service._generate_dungeon_loot(
                terrain="volcanic_heat",
                rooms_explored=10,
                rng=random.Random(i * 1337)
            )
            for item in loot:
                if item.get("is_full_item"):
                    found_full_item = True
                    self.assertIn("item_data", item)
                    self.assertIn("item_instance_id", item["item_data"])
                    break
            if found_full_item:
                break

        self.assertTrue(found_full_item, "Pelo menos um item completo deveria ter sido dropado em 30 rolagens de sala 10.")


if __name__ == "__main__":
    unittest.main()
