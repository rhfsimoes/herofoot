"""
Testes unitários para o sistema de Metas da Coroa e Auditorias Trimestrais do HeroFoot.
"""

import os
import unittest
from game_state import GameState
from services.crown_service import (
    get_crown_goals_data,
    process_quarterly_audit,
)
from services.phase_service import PhaseService
from league_engine import LeagueEngine


class TestCrownGoals(unittest.TestCase):
    def setUp(self):
        self.state = GameState(world_seed=42)
        self.league = LeagueEngine()

    def test_initialization(self):
        """Verifica se as metas da coroa inicializam com ciclo 1 e prazo na semana 8."""
        data = get_crown_goals_data(self.state, self.league)
        self.assertEqual(data["current_cycle"], 1)
        self.assertEqual(data["cycle_start_week"], 1)
        self.assertEqual(data["cycle_deadline_week"], 8)
        self.assertEqual(len(data["goals"]), 3)
        self.assertEqual(data["subsidy_reward"], 400)
        self.assertEqual(data["penalty_tax"], 200)

    def test_goals_progress_tracking(self):
        """Verifica rastreamento dinâmico de metas (ouro, pontos da liga e heróis lesionados)."""
        self.state.gold = 1500
        # Simula pontos na liga
        div_id = self.league.current_division_id
        if "g_player" in self.league.divisions[div_id]["table"]:
            self.league.divisions[div_id]["table"]["g_player"]["points"] = 12

        # Sem heróis lesionados
        for h in self.state.team:
            h["status"] = "Apto"
            h["injured"] = False

        data = get_crown_goals_data(self.state, self.league)
        self.assertEqual(data["goals_completed_count"], 3)
        for g in data["goals"]:
            self.assertTrue(g["completed"])

    def test_successful_quarterly_audit(self):
        """Verifica homologação com louvor imperial e crédito de subsídio de 400 ouro."""
        self.state.week = 8
        self.state.gold = 1200
        div_id = self.league.current_division_id
        if "g_player" in self.league.divisions[div_id]["table"]:
            self.league.divisions[div_id]["table"]["g_player"]["points"] = 10

        audit = process_quarterly_audit(self.state, self.league)
        self.assertIsNotNone(audit)
        self.assertTrue(audit["passed"])
        self.assertEqual(audit["status"], "Aprovado")
        self.assertEqual(audit["delta_gold"], 400)
        self.assertIn("Louvor Imperial", audit["headline"])

        # Deve avançar para ciclo 2 (semanas 9 a 16)
        self.assertEqual(self.state.crown_goals["current_cycle"], 2)
        self.assertEqual(self.state.crown_goals["cycle_start_week"], 9)
        self.assertEqual(self.state.crown_goals["cycle_deadline_week"], 16)

    def test_failed_quarterly_audit(self):
        """Verifica autuação fiscal com retenção tributária de 200 ouro por descumprimento."""
        self.state.week = 8
        self.state.gold = 400  # Abaixo de 1000
        div_id = self.league.current_division_id
        if "g_player" in self.league.divisions[div_id]["table"]:
            self.league.divisions[div_id]["table"]["g_player"]["points"] = 2  # Abaixo de 8

        # Afasta heróis por lesão
        if self.state.team:
            self.state.team[0]["status"] = "Afastado"
            self.state.team[0]["injured"] = True

        audit = process_quarterly_audit(self.state, self.league)
        self.assertIsNotNone(audit)
        self.assertFalse(audit["passed"])
        self.assertEqual(audit["status"], "Autuado")
        self.assertEqual(audit["delta_gold"], -200)
        self.assertIn("Autuação Fiscal", audit["headline"])

    def test_phase_5_quarterly_audit_integration(self):
        """Verifica se a Fase 5 processa a auditoria no término do ciclo e reflete no DRE."""
        ps = PhaseService(self.state, dungeons=[], league_engine=self.league, market_engine=None)
        self.state.week = 8
        self.state.gold = 1500

        # Simula vitória na liga para ter pontos
        div_id = self.league.current_division_id
        if "g_player" in self.league.divisions[div_id]["table"]:
            self.league.divisions[div_id]["table"]["g_player"]["points"] = 9

        res = ps.phase_5_results()
        self.assertIn("crown_audit", res)
        self.assertIsNotNone(res["crown_audit"])
        self.assertEqual(res["crown_audit"]["status"], "Aprovado")
        self.assertEqual(res["financials"]["crown_subsidy"], 400)
        self.assertEqual(res["financials"]["crown_penalty"], 0)

    def test_zero_forbidden_terms(self):
        """Garante conformidade com o tom de Fantasia Corporativa e ausência de termos de futebol."""
        forbidden = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]
        service_path = os.path.join(os.path.dirname(__file__), "..", "services", "crown_service.py")
        with open(service_path, "r", encoding="utf-8") as f:
            content = f.read().lower()

        for term in forbidden:
            if term == "gol":
                # Permite gold
                import re
                self.assertIsNone(re.search(r"\bgol\b|\bgols\b", content), f"Termo proibido '{term}' detectado!")
            else:
                self.assertNotIn(term, content, f"Termo proibido '{term}' detectado!")


if __name__ == "__main__":
    unittest.main()
