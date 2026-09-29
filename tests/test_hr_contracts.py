"""
Testes Unitários para a Onda 3:
- Departamento Médico & Bem-Estar Ocupacional (Money Sinks)
- Ações Imediatas (Massagem, Aceleração de Lesão, Banquete Coletivo)
- Cálculo de Poder via Pesos de Atributos das Classes/Especializações
- Contratos de Temporada, Encerramento de Ciclo e Renovações/Rescisões
- Integração de Custos de Manutenção na Fase 5
"""

import unittest
import os
import re
from game_state import GameState
from services.hero_service import HeroService, calculate_hero_power
from controller import GameController

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestHRContractsAndMedical(unittest.TestCase):
    def setUp(self):
        self.state = GameState()
        self.hero_service = HeroService(self.state)

    def test_calculate_hero_power_weights(self):
        """Verifica o cálculo de poder conforme perfil de pesos de especializações."""
        # Teste com herói guerreiro / berserker (foco em STR e VIT)
        sample_hero = {
            "id": "h_test",
            "name": "Test Herói",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_berserker",
            "hidden_attributes": {
                "str": 80,
                "agi": 60,
                "vit": 70,
                "int": 10,
                "wis": 20,
                "lck": 40
            }
        }
        power = calculate_hero_power(sample_hero)
        self.assertTrue(1 <= power <= 100)
        self.assertGreater(power, 50, "Atributos altos em STR e VIT deveriam render bom poder a um Berserker")

    def test_medical_facilities_query_and_upgrade(self):
        """Consulta e modernização das instalações médicas com débito de ouro."""
        fac_data = self.hero_service.get_medical_facilities_data()
        self.assertEqual(fac_data["current_level"], 1)
        self.assertIsNotNone(fac_data["next_upgrade"])
        upgrade_cost = fac_data["next_upgrade"]["cost"]

        # Tentativa de upgrade sem ouro
        self.state.gold = upgrade_cost - 1
        res = self.hero_service.upgrade_medical_facility()
        self.assertFalse(res["success"])
        self.assertIn("insuficientes", res["message"])

        # Upgrade com ouro suficiente
        self.state.gold = upgrade_cost + 500
        res = self.hero_service.upgrade_medical_facility()
        self.assertTrue(res["success"])
        self.assertEqual(self.state.medical_level, 2)
        self.assertEqual(self.state.gold, 500)

        # Atualiza até o nível 5 (teto)
        for target_lvl in range(3, 6):
            self.state.gold = 50000
            res = self.hero_service.upgrade_medical_facility()
            self.assertTrue(res["success"])
            self.assertEqual(self.state.medical_level, target_lvl)

        # Tentativa além do teto é rejeitada
        res = self.hero_service.upgrade_medical_facility()
        self.assertFalse(res["success"])
        self.assertIn("nível máximo", res["message"])

    def test_massage_action_reduces_fatigue_and_drains_gold(self):
        """Massagem avulsa drena ouro e reduz fadiga de aventureiro cansado."""
        hero = self.state.team[0]
        hero["fatigue"] = 60
        self.state.gold = 200

        res = self.hero_service.treat_hero_massage(hero["id"])
        self.assertTrue(res["success"])
        self.assertLess(hero["fatigue"], 60)
        self.assertLess(self.state.gold, 200)

        # Teste quando já em repouso pleno (0 de fadiga)
        hero["fatigue"] = 0
        res = self.hero_service.treat_hero_massage(hero["id"])
        self.assertFalse(res["success"])
        self.assertIn("repouso pleno", res["message"])

    def test_accelerate_injury_reduces_weeks(self):
        """Tratamento de lesão reduz semanas de licença médica até a alta."""
        hero = self.state.team[0]
        hero["injured"] = True
        hero["status"] = "Afastado por Lesão"
        hero["injury_weeks_left"] = 2
        self.state.gold = 1000

        res = self.hero_service.accelerate_hero_injury(hero["id"])
        self.assertTrue(res["success"])
        self.assertEqual(hero["injury_weeks_left"], 1)
        self.assertTrue(hero["injured"])

        # Segunda aplicação zera a licença e dá alta médica
        res = self.hero_service.accelerate_hero_injury(hero["id"])
        self.assertTrue(res["success"])
        self.assertEqual(hero["injury_weeks_left"], 0)
        self.assertFalse(hero["injured"])
        self.assertEqual(hero["status"], "Apto")

    def test_collective_banquet_heals_all_heroes(self):
        """Banquete de descompressão custa ouro e alivia fadiga de todos os heróis."""
        for h in self.state.team:
            h["fatigue"] = 50
        self.state.gold = 1000

        res = self.hero_service.collective_banquet()
        self.assertTrue(res["success"])
        self.assertLess(self.state.gold, 1000)
        for h in self.state.team:
            self.assertLess(h["fatigue"], 50)

    def test_phase_5_includes_medical_maintenance(self):
        """A Fase 5 contabiliza custo de manutenção médica somado aos salários e oficina."""
        ctrl = GameController()
        ctrl.state.medical_level = 3  # Nível 3 tem manutenção de 60 ouro
        ctrl.state.gold = 5000

        # Roda a fase 5
        report = ctrl.phase_service.phase_5_results()
        financials = report["financials"]
        self.assertIn("maintenance", financials)
        self.assertGreater(financials["maintenance"], 100)
        self.assertIn("medical_maintenance", financials)
        self.assertEqual(financials["medical_maintenance"], 80)

    def test_seasonal_contract_expiry_and_renewal_flow(self):
        """Contrato de temporada expira, exige renovação com luvas e pode ser rescindido."""
        hero = self.state.team[0]
        hero["contract_seasons_left"] = 1
        hero["season_appearances"] = 25  # Jogador atuou muito, demandará aumento

        # Simula encerramento de temporada na Fase 5
        ctrl = GameController()
        ctrl.state.team = [hero]
        ctrl.state.gold = 5000
        ctrl.league_engine.season_summary = {"award_gold": 1000, "season": 1}

        ctrl.phase_service.phase_5_results()
        self.assertEqual(hero["contract_seasons_left"], 0)
        self.assertTrue(hero["pending_renewal"])
        self.assertIsNotNone(hero.get("renewal_demand"))

        # Renova o contrato
        demand = hero["renewal_demand"]
        bonus = demand["signing_bonus"]
        initial_gold = ctrl.state.gold

        hero_service = HeroService(ctrl.state)
        res = hero_service.renew_contract(hero["id"])
        self.assertTrue(res["success"])
        self.assertEqual(ctrl.state.gold, initial_gold - bonus)
        self.assertFalse(hero["pending_renewal"])
        self.assertEqual(hero["contract_seasons_left"], demand["seasons"])

        # Teste de rescisão
        res_del = hero_service.release_hero(hero["id"])
        self.assertTrue(res_del["success"])
        self.assertNotIn(hero, ctrl.state.team)

    def test_no_forbidden_terms_in_hr_service(self):
        """Garante conformidade com as restrições terminológicas do projeto."""
        paths = [
            os.path.join(os.path.dirname(__file__), "..", "services", "hero_service.py"),
            os.path.join(os.path.dirname(__file__), "..", "data", "facilities_seed.json")
        ]
        for path in paths:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            for term in FORBIDDEN_TERMS:
                if term == "gol":
                    matches = re.findall(r'\bgol\b', content, re.IGNORECASE)
                else:
                    matches = re.findall(re.escape(term), content, re.IGNORECASE)
                self.assertEqual(len(matches), 0, f"Termo proibido '{term}' encontrado em {path}")


if __name__ == "__main__":
    unittest.main()
