"""
Testes Unitários para a Onda 4:
- Academia de Base & Olheiros (Potencial Revelado, Promoção, Dispensa)
- Mercado de Transferências & Agentes Livres (Potencial Oculto, Auditoria de Olheiro, Contratação)
- Envelhecimento e Desenvolvimento Anual (Evolução de Jovens e Declínio Físico de Veteranos)
- Custos Operacionais da Base no DRE da Fase 5
"""

import unittest
import os
import re
import random
from game_state import GameState
from services.hero_service import HeroService, generate_hero, calculate_hero_power
from controller import GameController
from balance import get_balance

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestAcademyAndTransferMarket(unittest.TestCase):
    def setUp(self):
        self.state = GameState()
        self.hero_service = HeroService(self.state)

    def test_generate_hero_youth_attributes(self):
        """Heróis da base (aprendizes) nascem com 16-18 anos e Potencial Revelado."""
        rng = random.Random(42)
        youth = generate_hero(is_youth=True, rng=rng)

        self.assertTrue(16 <= youth["age"] <= 18)
        self.assertEqual(youth["level"], 1)
        self.assertTrue(youth["potential"]["is_potential_revealed"])
        self.assertTrue(1 <= youth["potential"]["star_potential"] <= 5)
        self.assertEqual(youth["salary"], 15)
        self.assertEqual(youth["transfer_fee"], 0)
        self.assertTrue(1 <= youth["current_power"] <= 100)

    def test_generate_hero_market_attributes(self):
        """Heróis do mercado nascem adultos, com Potencial Oculto e taxa de aquisição."""
        rng = random.Random(99)
        market_hero = generate_hero(is_youth=False, rng=rng)

        self.assertTrue(19 <= market_hero["age"] <= 32)
        self.assertFalse(market_hero["potential"]["is_potential_revealed"])
        self.assertTrue(1 <= market_hero["potential"]["star_potential"] <= 5)
        self.assertGreater(market_hero["transfer_fee"], 0)
        self.assertGreater(market_hero["salary"], 20)
        self.assertTrue(1 <= market_hero["current_power"] <= 100)

    def test_academy_promote_and_dismiss_flow(self):
        """Promoção ao time profissional atualiza vínculo e salário; dispensa desocupa vaga."""
        self.hero_service.replenish_academy(rng=random.Random(10))
        apprentice = self.state.youth_academy[0]
        apprentice_id = apprentice["id"]
        initial_team_len = len(self.state.team)

        # Promoção
        res = self.hero_service.promote_youth_apprentice(apprentice_id)
        self.assertTrue(res["success"])
        self.assertEqual(len(self.state.team), initial_team_len + 1)
        self.assertIn(apprentice, self.state.team)
        self.assertEqual(apprentice["contract_seasons_left"], 2)
        self.assertEqual(apprentice["salary"], 35)

        # Tenta promover com plantel cheio (12 heróis)
        balance = get_balance()
        max_size = balance.get("roster", {}).get("max_team_size", 12)
        while len(self.state.team) < max_size:
            dummy = generate_hero(is_youth=False)
            self.state.team.append(dummy)

        self.hero_service.replenish_academy(rng=random.Random(11))
        cand = self.state.youth_academy[0]
        res_limit = self.hero_service.promote_youth_apprentice(cand["id"])
        self.assertFalse(res_limit["success"])
        self.assertIn("capacidade máxima", res_limit["message"].lower())

        # Dispensa de aprendiz
        res_dis = self.hero_service.dismiss_youth_apprentice(cand["id"])
        self.assertTrue(res_dis["success"])
        self.assertNotIn(cand, self.state.youth_academy)

    def test_transfer_market_scout_flow(self):
        """Olheiro pericial consome 150 ouro e revela o potencial estelar do herói."""
        self.hero_service.refresh_transfer_market(rng=random.Random(77))
        target = self.state.transfer_market_listings[0]
        self.assertFalse(target["potential"]["is_potential_revealed"])

        # Sem ouro suficiente
        self.state.gold = 50
        res_fail = self.hero_service.scout_market_hero(target["id"])
        self.assertFalse(res_fail["success"])
        self.assertIn("insuficiente", res_fail["message"])

        # Com ouro suficiente
        self.state.gold = 500
        res_ok = self.hero_service.scout_market_hero(target["id"])
        self.assertTrue(res_ok["success"])
        self.assertEqual(self.state.gold, 350)
        self.assertTrue(target["potential"]["is_potential_revealed"])
        self.assertIn(str(target["potential"]["star_potential"]), res_ok["message"])

        # Segunda auditoria no mesmo é rejeitada por já estar conclusivo
        res_repeat = self.hero_service.scout_market_hero(target["id"])
        self.assertFalse(res_repeat["success"])

    def test_transfer_market_hire_flow(self):
        """Contratação debita taxa de transferência e adiciona aventureiro com contrato de 2 temporadas."""
        self.hero_service.refresh_transfer_market(rng=random.Random(55))
        hero = self.state.transfer_market_listings[0]
        fee = hero["transfer_fee"]
        self.state.gold = fee + 200
        initial_team_len = len(self.state.team)

        res = self.hero_service.hire_market_hero(hero["id"])
        self.assertTrue(res["success"])
        self.assertEqual(self.state.gold, 200)
        self.assertEqual(len(self.state.team), initial_team_len + 1)
        self.assertIn(hero, self.state.team)
        self.assertNotIn(hero, self.state.transfer_market_listings)
        self.assertEqual(hero["contract_seasons_left"], 2)

    def test_annual_development_and_physical_decline(self):
        """Ao fim do ano, jovens com minutagem evoluem atributos e veteranos sofrem leve declínio."""
        young_prodigy = {
            "id": "h_young",
            "name": "Jovem Promissor",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_berserker",
            "age": 20,
            "season_appearances": 15,
            "hidden_attributes": {"str": 40, "agi": 30, "vit": 40, "int": 10, "wis": 10, "lck": 20},
            "potential": {"star_potential": 4, "is_potential_revealed": True}
        }
        young_prodigy["current_power"] = calculate_hero_power(young_prodigy)

        veteran = {
            "id": "h_vet",
            "name": "Veterano Decano",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_swordsman",
            "age": 34,
            "season_appearances": 20,
            "hidden_attributes": {"str": 70, "agi": 70, "vit": 70, "int": 20, "wis": 20, "lck": 30},
            "potential": {"star_potential": 3, "is_potential_revealed": True}
        }
        veteran["current_power"] = calculate_hero_power(veteran)

        self.state.team = [young_prodigy, veteran]
        dev_report = self.hero_service.process_annual_development_and_aging(rng=random.Random(123))

        self.assertEqual(young_prodigy["age"], 21)
        self.assertEqual(veteran["age"], 35)

        # O jovem teve evolução positiva em atributos principais
        self.assertGreaterEqual(young_prodigy["current_power"], young_prodigy.get("old_power", 0))
        self.assertTrue(len(dev_report["evolved"]) >= 1)

        # O veterano sofreu declínio
        self.assertTrue(len(dev_report["declined"]) >= 1)

    def test_phase_5_includes_academy_maintenance(self):
        """DRE da Fase 5 contabiliza a manutenção da Academia de Base (40 Ouro)."""
        ctrl = GameController()
        ctrl.state.gold = 5000
        report = ctrl.phase_service.phase_5_results()
        financials = report["financials"]

        self.assertIn("academy_maintenance", financials)
        self.assertEqual(financials["academy_maintenance"], 40)
        self.assertEqual(financials["maintenance"], financials["base_maintenance"] + financials["medical_maintenance"] + 40)

    def test_no_forbidden_terms(self):
        """Garante ausência de termos esportivos proibidos em arquivos da Onda 4."""
        paths = [
            os.path.join(os.path.dirname(__file__), "..", "services", "hero_service.py"),
            os.path.join(os.path.dirname(__file__), "..", "data", "balance_seed.json")
        ]
        for p in paths:
            with open(p, "r", encoding="utf-8") as f:
                content = f.read()
            for term in FORBIDDEN_TERMS:
                if term == "gol":
                    matches = re.findall(r'\bgol\b', content, re.IGNORECASE)
                else:
                    matches = re.findall(re.escape(term), content, re.IGNORECASE)
                self.assertEqual(len(matches), 0, f"Termo proibido '{term}' encontrado em {p}")


if __name__ == "__main__":
    unittest.main()
