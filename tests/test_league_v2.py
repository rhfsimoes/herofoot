import unittest
import os
import random
from league_engine import LeagueEngine

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestLeagueV2(unittest.TestCase):
    def setUp(self):
        self.league = LeagueEngine()

    def test_multi_division_initialization(self):
        """Verifica a inicialização das 2 divisões (Nobre e Acesso) com 8 guildas cada."""
        self.assertEqual(len(self.league.divisions), 2)
        self.assertIn("div_nobre", self.league.divisions)
        self.assertIn("div_acesso", self.league.divisions)

        div_nobre = self.league.divisions["div_nobre"]
        div_acesso = self.league.divisions["div_acesso"]

        self.assertEqual(len(div_nobre["guild_ids"]), 8)
        self.assertEqual(len(div_acesso["guild_ids"]), 8)

        # Regras de acesso e descenso
        self.assertEqual(div_nobre["tier"], 1)
        self.assertEqual(div_nobre["relegation_spots"], 2)
        self.assertEqual(div_nobre["promotion_spots"], 0)

        self.assertEqual(div_acesso["tier"], 2)
        self.assertEqual(div_acesso["promotion_spots"], 2)
        self.assertEqual(div_acesso["relegation_spots"], 0)

        # Guilda do jogador inicia na Divisão de Acesso
        self.assertEqual(self.league.current_division_id, "div_acesso")
        self.assertIn("g_player", div_acesso["guild_ids"])
        self.assertNotIn("g_player", div_nobre["guild_ids"])

    def test_rival_rosters_and_attributes(self):
        """Verifica se as guildas rivais possuem elencos de 6 heróis com atributos reais."""
        rival_count = 0
        for gid, g in self.league.all_guilds.items():
            if g.get("is_player"):
                continue
            rival_count += 1
            roster = g.get("roster", [])
            self.assertEqual(len(roster), 6, f"Guilda {gid} não possui 6 heróis no elenco")
            self.assertGreater(g.get("power_rating", 0), 40)
            self.assertGreater(g.get("average_agi", 0), 30)

            for h in roster:
                self.assertIn("class_id", h)
                self.assertIn("specialization_id", h)
                self.assertIn("attributes", h)
                self.assertIn("agi", h["attributes"])
                self.assertTrue(1 <= h["attributes"]["agi"] <= 100)

        self.assertEqual(rival_count, 15, "Esperava 15 guildas rivais catalogadas")

    def test_round_simulations_all_divisions(self):
        """Uma rodada simula partidas de todas as divisões e atualiza tabelas."""
        rng = random.Random(42)
        results = self.league.process_round_simulations(
            round_num=1,
            player_pe_for=3,
            player_pe_against=1,
            rng=rng
        )

        self.assertGreater(len(results), 0)
        # Na divisão do jogador: todas as 8 equipes jogaram 1 partida
        for row in self.league.get_standings("div_acesso"):
            self.assertEqual(row["played"], 1, f"Equipe {row['id']} não jogou a rodada")

        # Na divisão nobre: todas as 8 equipes também jogaram 1 partida
        for row in self.league.get_standings("div_nobre"):
            self.assertEqual(row["played"], 1, f"Equipe {row['id']} da divisão nobre não jogou")

    def test_season_end_and_promotions_relegations(self):
        """Simulação de todas as rodadas encerra a temporada, promove top 2 do Acesso e rebaixa bottom 2 da Nobre."""
        rng = random.Random(1337)
        # Roda todas as rodadas para concluir a temporada
        for r in range(1, self.league.rounds_per_season + 1):
            self.league.process_round_simulations(
                round_num=r,
                player_pe_for=2,
                player_pe_against=1,
                rng=rng
            )

        summary = self.league.season_summary
        self.assertIsNotNone(summary, f"Resumo de temporada não foi gerado ao fim da {self.league.rounds_per_season}ª rodada")
        self.assertEqual(summary["season"], 1)
        self.assertEqual(len(summary["promoted_guilds"]), 2)
        self.assertEqual(len(summary["relegated_guilds"]), 2)
        self.assertGreater(summary["award_gold"], 0)

        # Após encerramento, season_number incrementou e tabelas foram zeradas para a Temporada 2
        self.assertEqual(self.league.season_number, 2)
        for row in self.league.get_standings("div_acesso"):
            self.assertEqual(row["played"], 0, "Tabela da nova temporada deveria iniciar zerada")
        for row in self.league.get_standings("div_nobre"):
            self.assertEqual(row["played"], 0, "Tabela da nova temporada deveria iniciar zerada")

    def test_player_promotion_flow(self):
        """Se o jogador terminar no Top 2 da Divisão de Acesso, ascende à Divisão Nobre."""
        # Força o jogador a vencer todas as partidas com folga
        for r in range(1, self.league.rounds_per_season + 1):
            self.league.process_round_simulations(
                round_num=r,
                player_pe_for=10,
                player_pe_against=0,
                rng=random.Random(r)
            )

        summary = self.league.season_summary
        self.assertTrue(summary["player_promoted"])
        self.assertIn("homologação de Acesso", summary["verdict"])
        # O jogador agora está na Divisão Nobre
        self.assertEqual(self.league.current_division_id, "div_nobre")
        self.assertIn("g_player", self.league.divisions["div_nobre"]["guild_ids"])
        self.assertNotIn("g_player", self.league.divisions["div_acesso"]["guild_ids"])

    def test_player_relegation_flow(self):
        """Se o jogador estiver na Divisão Nobre e terminar no Z-2, sofre rebaixamento."""
        # Coloca o jogador na Divisão Nobre trocando com uma guilda nobre
        self.league.divisions["div_acesso"]["guild_ids"].remove("g_player")
        self.league.divisions["div_acesso"]["guild_ids"].append("g_grifo")
        self.league.divisions["div_nobre"]["guild_ids"].remove("g_grifo")
        self.league.divisions["div_nobre"]["guild_ids"].append("g_player")
        self.league.current_division_id = "div_nobre"
        self.league._init_division_table("div_nobre")
        self.league._init_division_table("div_acesso")
        self.league.divisions["div_nobre"]["_schedule"] = self.league._generate_round_robin_schedule(
            self.league.divisions["div_nobre"]["guild_ids"]
        )
        self.league.divisions["div_acesso"]["_schedule"] = self.league._generate_round_robin_schedule(
            self.league.divisions["div_acesso"]["guild_ids"]
        )

        # Força derrotas pesadas em todas as partidas
        for r in range(1, self.league.rounds_per_season + 1):
            self.league.process_round_simulations(
                round_num=r,
                player_pe_for=0,
                player_pe_against=10,
                rng=random.Random(r)
            )

        summary = self.league.season_summary
        self.assertTrue(summary["player_relegated"])
        self.assertIn("Rebaixamento Compulsório", summary["verdict"])
        self.assertEqual(self.league.current_division_id, "div_acesso")
        self.assertIn("g_player", self.league.divisions["div_acesso"]["guild_ids"])
        self.assertNotIn("g_player", self.league.divisions["div_nobre"]["guild_ids"])

    def test_serialization_roundtrip(self):
        """Verifica se to_dict e from_dict persistem divisões e temporadas com fidelidade."""
        self.league.season_number = 3
        self.league.current_division_id = "div_nobre"
        data = self.league.to_dict()

        self.assertIn("divisions", data)
        self.assertIn("season_number", data)
        self.assertIn("current_division_id", data)

        restored = LeagueEngine()
        restored.from_dict(data)

        self.assertEqual(restored.season_number, 3)
        self.assertEqual(restored.current_division_id, "div_nobre")
        self.assertEqual(len(restored.divisions), 2)

    def test_no_forbidden_terms_in_league_texts(self):
        """Garante ausência total de jargões esportivos ou termos proibidos no módulo."""
        with open(os.path.join(os.path.dirname(__file__), "..", "league_engine.py"), "r", encoding="utf-8") as f:
            code = f.read()

        import re
        for term in FORBIDDEN_TERMS:
            if term == "gol":
                matches = re.findall(r'\bgol\b', code, re.IGNORECASE)
            else:
                matches = re.findall(re.escape(term), code, re.IGNORECASE)
            self.assertEqual(len(matches), 0, f"Termo proibido '{term}' encontrado em league_engine.py")


if __name__ == "__main__":
    unittest.main()
