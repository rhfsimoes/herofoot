"""
HeroFoot Testes Unitários de Renomeação, Boletim da Liga, Falência e Fim de Temporada.
Valida o sistema de identidade corporativa (renomear guilda e heróis),
apuração de falência por dois ciclos deficitários, e condições de promoção/título/rebaixamento.
"""

import unittest
from game_state import GameState
from controller import GameController
from league_engine import LeagueEngine


class TestRenamingAndStakes(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()

    def test_rename_guild(self):
        """Valida que a guilda pode ser renomeada com propagação para GameState e LeagueEngine."""
        res = self.controller.rename_guild("Companhia de Aço da Coroa")
        self.assertTrue(res["success"])
        self.assertEqual(res["guild_name"], "Companhia de Aço da Coroa")
        self.assertEqual(self.controller.state.guild_name, "Companhia de Aço da Coroa")
        self.assertEqual(self.controller.league_engine.all_guilds["g_player"]["name"], "Companhia de Aço da Coroa")

        state = self.controller.get_state()
        self.assertEqual(state["guild_name"], "Companhia de Aço da Coroa")

    def test_rename_hero(self):
        """Valida que um aventureiro do quadro funcional pode ser renomeado."""
        self.assertTrue(len(self.controller.state.team) > 0)
        target_hero = self.controller.state.team[0]
        hero_id = target_hero["id"]

        res = self.controller.rename_hero(hero_id, "Geralt de Rívia")
        self.assertTrue(res["success"])
        self.assertEqual(res["hero"]["name"], "Geralt de Rívia")
        self.assertEqual(target_hero["name"], "Geralt de Rívia")

        # Tentativa de renomear ID inexistente falha amigavelmente
        res_fail = self.controller.rename_hero("hero_inexistente_999", "Invasor")
        self.assertFalse(res_fail["success"])

    def test_bankruptcy_two_consecutive_weeks(self):
        """Dois ciclos consecutivos com tesouro negativo disparam Falência e Liquidação Judicial."""
        self.assertEqual(self.controller.state.consecutive_negative_gold_weeks, 0)
        self.assertFalse(self.controller.state.game_over)

        # Semana 1 com saldo negativo
        self.controller.state.gold = -100
        # Simula fechamento de semana
        self.controller.phase_service.phase_5_results()
        self.assertEqual(self.controller.state.consecutive_negative_gold_weeks, 1)
        self.assertFalse(self.controller.state.game_over)

        # Semana 2 continua com saldo negativo
        self.controller.state.gold = -250
        self.controller.phase_service.phase_5_results()
        self.assertEqual(self.controller.state.consecutive_negative_gold_weeks, 2)
        self.assertTrue(self.controller.state.game_over)
        self.assertIsNotNone(self.controller.state.game_over_reason)
        self.assertIn("Liquidação Judicial", self.controller.state.game_over_reason)

        # Se recuperar o saldo positivo, o contador reseta
        self.controller.state.gold = 500
        self.controller.phase_service.phase_5_results()
        self.assertEqual(self.controller.state.consecutive_negative_gold_weeks, 0)

    def test_season_completed_flag(self):
        """Ao fechar uma temporada na semana de encerramento, season_completed e season_outcome são preenchidos."""
        # Força season_summary na engine
        fake_summary = {
            "season": 1,
            "player_division_id": "div_acesso",
            "player_division_name": "Divisão de Acesso Mercante",
            "player_rank": 1,
            "player_promoted": True,
            "player_relegated": False,
            "award_gold": 800,
            "verdict": "Concedida homologação de Acesso à Divisão Nobre da Coroa.",
            "promoted_guilds": ["Guilda do Jogador", "Outra Guilda"],
            "relegated_guilds": [],
            "liquidated_guilds": [],
            "champion_nobre": "Guilda Nobre Campeã",
            "champion_acesso": "Guilda do Jogador",
        }
        self.controller.league_engine.season_summary = fake_summary
        res = self.controller.phase_service.phase_5_results()

        self.assertTrue(self.controller.state.season_completed)
        self.assertIsNotNone(self.controller.state.season_outcome)
        self.assertEqual(self.controller.state.season_outcome["player_rank"], 1)
        self.assertTrue(res["season_completed"])
        self.assertEqual(res["season_outcome"]["champion_acesso"], "Guilda do Jogador")


if __name__ == "__main__":
    unittest.main()
