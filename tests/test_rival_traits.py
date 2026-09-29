"""
Testes unitários para o sistema de Perfis Permanentes de Rivais e Liquidação Judicial por Falência.
Valida determinismo de traços, mitigações ambientais, bônus de combate e processo de falência.
"""

import json
import os
import random
import unittest

from balance import get_balance
from league_engine import (
    LeagueEngine,
    assign_guild_traits,
    get_tactical_traits,
    get_corporate_traits,
    load_rival_traits_catalog,
)
from match_engine import Team, MatchEngine, calculate_rival_power

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestRivalTraitsAndLiquidation(unittest.TestCase):
    def setUp(self):
        self.balance = get_balance()
        self.dungeon_swamp = {
            "id": "dungeon_02",
            "name": "Pântano Pútrido do Vale Baixo",
            "terrain": "toxic_swamp",
            "terrain_label": "Terreno Alagado & Emanações Venenosas",
            "power_penalty_pct": 0.12,
            "energy_cost_extra": 5,
            "mitigation_required": "toxic_swamp",
            "recommended_power": 72,
        }
        self.dungeon_glacial = {
            "id": "dungeon_03",
            "name": "Cripta do Pico Glacial",
            "terrain": "glacier_frost",
            "terrain_label": "Frio Extremo & Solo Escorregadio",
            "power_penalty_pct": 0.12,
            "energy_cost_extra": 5,
            "mitigation_required": "glacier_frost",
            "recommended_power": 77,
        }
        self.dungeon_neutral = {
            "id": "dungeon_01",
            "name": "Vale dos Ecos Verdejantes",
            "terrain": "neutral",
            "terrain_label": "Campo Aberto Verdejante",
            "power_penalty_pct": 0.0,
            "energy_cost_extra": 0,
            "mitigation_required": None,
            "recommended_power": 55,
        }

    def test_traits_seed_catalog_validity(self):
        """O catálogo de traços possui seções táticas e corporativas válidas."""
        catalog = load_rival_traits_catalog()
        tactical = get_tactical_traits()
        corporate = get_corporate_traits()

        self.assertGreaterEqual(len(tactical), 8)
        self.assertGreaterEqual(len(corporate), 8)

        for t in tactical:
            self.assertEqual(t.get("type"), "tactical")
            self.assertTrue(t["id"].startswith("trait_tact_"))
            self.assertIn("effects", t)

        for c in corporate:
            self.assertEqual(c.get("type"), "corporate")
            self.assertTrue(c["id"].startswith("trait_corp_"))
            self.assertIn("effects", c)

    def test_traits_determinism_with_same_seed(self):
        """Traços sorteados são estritamente determinísticos com a mesma semente mundial."""
        engine1 = LeagueEngine(world_seed=42)
        engine2 = LeagueEngine(world_seed=42)

        rival_ids = [gid for gid, g in engine1.all_guilds.items() if not g.get("is_player")]
        self.assertGreater(len(rival_ids), 0)

        for gid in rival_ids:
            traits_1 = [t["id"] for t in engine1.all_guilds[gid]["traits"]]
            traits_2 = [t["id"] for t in engine2.all_guilds[gid]["traits"]]
            self.assertEqual(
                traits_1,
                traits_2,
                f"Divergência de traços para a guilda {gid} com mesma semente 42."
            )

        # Semente diferente deve divergir para pelo menos uma guilda
        engine3 = LeagueEngine(world_seed=99999)
        differences = 0
        for gid in rival_ids:
            traits_1 = [t["id"] for t in engine1.all_guilds[gid]["traits"]]
            traits_3 = [t["id"] for t in engine3.all_guilds[gid]["traits"]]
            if traits_1 != traits_3:
                differences += 1

        self.assertGreater(differences, 0, "Esperava divergência de traços com sementes mundiais distintas.")

    def test_each_rival_guild_has_one_tactical_and_one_corporate_trait(self):
        """Cada guilda rival recebe exatamente 1 traço tático e 1 traço corporativo."""
        engine = LeagueEngine(world_seed=1337)

        for gid, g in engine.all_guilds.items():
            if g.get("is_player"):
                self.assertEqual(len(g.get("traits", [])), 0, "Guilda do jogador não deve possuir traços de rival.")
                continue

            traits = g.get("traits", [])
            self.assertEqual(
                len(traits),
                2,
                f"Guilda {gid} deveria possuir exatamente 2 traços, possui {len(traits)}"
            )

            types = [t.get("type") for t in traits]
            self.assertIn("tactical", types, f"Guilda {gid} não possui traço tático.")
            self.assertIn("corporate", types, f"Guilda {gid} não possui traço corporativo.")

            ids = [t.get("id") for t in traits]
            self.assertTrue(any(i.startswith("trait_tact_") for i in ids))
            self.assertTrue(any(i.startswith("trait_corp_") for i in ids))

        # Verifica presença de traits na tabela das divisões
        for div_id, div in engine.divisions.items():
            for gid, row in div["table"].items():
                if row.get("is_player"):
                    continue
                self.assertIn("traits", row)
                self.assertEqual(len(row["traits"]), 2)

    def test_trait_swamp_specialists_auto_mitigation(self):
        """Traço trait_tact_swamp_specialists mitiga automaticamente masmorras de toxic_swamp."""
        trait_swamp = next(t for t in get_tactical_traits() if t["id"] == "trait_tact_swamp_specialists")

        # Equipe com traço especialista em pântano (sem EPI convencional)
        team_with_trait = Team(
            name="Especialistas do Pântano",
            base_power=60,
            has_terrain_mitigation=False,
            traits=[trait_swamp],
            balance=self.balance,
        )

        # Equipe padrão sem mitigação
        team_without_trait = Team(
            name="Guilda Vulnerável",
            base_power=60,
            has_terrain_mitigation=False,
            traits=[],
            balance=self.balance,
        )

        engine = MatchEngine(
            team_with_trait,
            team_without_trait,
            dungeon=self.dungeon_swamp,
            fast_mode=True,
            balance=self.balance,
        )

        # Team 1 teve mitigação automática ativada pelo traço
        self.assertTrue(team_with_trait.has_terrain_mitigation)
        self.assertEqual(engine.penalty_pct_t1, 0.0)
        self.assertEqual(engine.extra_cost_t1, 0)

        # Team 2 sem mitigação sofre penalidade e custo extra
        self.assertFalse(team_without_trait.has_terrain_mitigation)
        self.assertEqual(engine.penalty_pct_t2, self.dungeon_swamp["power_penalty_pct"])
        self.assertEqual(engine.extra_cost_t2, self.dungeon_swamp["energy_cost_extra"])

        # O cálculo de poder de rival também deve refletir a mitigação e o bônus de pântano
        rival_guild_data = {
            "id": "g_test_swamp",
            "name": "Rival do Pântano",
            "power_rating": 60,
            "traits": [trait_swamp],
        }
        effective_p = calculate_rival_power(rival_guild_data, dungeon=self.dungeon_swamp)
        # 60 + 6 (slots) + 4 (swamp bonus) = 70 sem penalidade
        self.assertAlmostEqual(effective_p, 70.0)

    def test_trait_cryo_drills_auto_mitigation(self):
        """Traço trait_tact_cryo_drills mitiga automaticamente masmorras de glacier_frost."""
        trait_cryo = next(t for t in get_tactical_traits() if t["id"] == "trait_tact_cryo_drills")

        team_cryo = Team(
            name="Engenharia Polar",
            base_power=60,
            has_terrain_mitigation=False,
            traits=[trait_cryo],
            balance=self.balance,
        )
        team_std = Team(
            name="Guilda Despreparada",
            base_power=60,
            has_terrain_mitigation=False,
            traits=[],
            balance=self.balance,
        )

        engine = MatchEngine(
            team_cryo,
            team_std,
            dungeon=self.dungeon_glacial,
            fast_mode=True,
            balance=self.balance,
        )

        self.assertTrue(team_cryo.has_terrain_mitigation)
        self.assertEqual(engine.penalty_pct_t1, 0.0)
        self.assertEqual(engine.extra_cost_t1, 0)

        # Team standard sofre penalidade
        self.assertFalse(team_std.has_terrain_mitigation)
        self.assertEqual(engine.penalty_pct_t2, self.dungeon_glacial["power_penalty_pct"])

    def test_trait_steel_wall_power_and_energy_cost(self):
        """Traço trait_tact_steel_wall confere poder defensivo (+6) e eleva custo de energia (1.20x)."""
        trait_steel = next(t for t in get_tactical_traits() if t["id"] == "trait_tact_steel_wall")

        team_steel = Team(
            name="Paredão de Ferro",
            base_power=50,
            bonus_slots=0,
            consumable_energy_bonus=150,
            has_terrain_mitigation=True,
            traits=[trait_steel],
            balance=self.balance,
        )
        team_base = Team(
            name="Contingente Base",
            base_power=50,
            bonus_slots=0,
            consumable_energy_bonus=150,
            has_terrain_mitigation=True,
            traits=[],
            balance=self.balance,
        )

        # Bônus de poder defensivo
        p_steel = team_steel.calculate_effective_power(0.0)
        p_base = team_base.calculate_effective_power(0.0)
        self.assertEqual(p_steel, p_base + 6)

        # Custo de suprimentos: paredão consome 1.20x
        mult_steel = team_steel.get_trait_energy_multiplier()
        mult_base = team_base.get_trait_energy_multiplier()
        self.assertAlmostEqual(mult_steel, 1.20)
        self.assertAlmostEqual(mult_base, 1.00)

        # Simulação: equipe com steel wall termina com menos energia que base sob as mesmas condições
        engine = MatchEngine(
            team_steel,
            team_base,
            dungeon=self.dungeon_neutral,
            rng=random.Random(42),
            fast_mode=True,
            balance=self.balance,
        )
        engine.simulate()
        self.assertLess(team_steel.energy, team_base.energy)

    def test_trait_reckless_offensive_combat_power_and_miniboss(self):
        """Traço trait_tact_reckless_offensive adiciona +4 de poder de combate e maior desgaste."""
        trait_reckless = next(t for t in get_tactical_traits() if t["id"] == "trait_tact_reckless_offensive")

        team_reckless = Team(
            name="Vanguarda de Choque",
            base_power=50,
            bonus_slots=0,
            traits=[trait_reckless],
            balance=self.balance,
        )
        team_base = Team(
            name="Contingente Regular",
            base_power=50,
            bonus_slots=0,
            traits=[],
            balance=self.balance,
        )

        p_reckless = team_reckless.calculate_effective_power(0.0)
        p_base = team_base.calculate_effective_power(0.0)
        self.assertEqual(p_reckless, p_base + 4)

        # Desgaste de suprimentos é maior
        self.assertGreater(team_reckless.get_trait_energy_multiplier(), 1.0)

    def test_season_end_bankruptcy_liquidation(self):
        """Ao fim da temporada, as 2 lanternas da Divisão de Acesso são liquidadas e duas novas assumem."""
        league = LeagueEngine(world_seed=777)

        # Recupera as duas últimas guildas atuais da Divisão de Acesso
        standings_initial = league.get_standings("div_acesso")
        self.assertEqual(len(standings_initial), 8)

        # Força classificação conhecida: últimas 2 são rivais
        last_two_initial = [r["id"] for r in standings_initial[-2:]]
        last_two_names = [r["guild_name"] for r in standings_initial[-2:]]

        # Encerra a temporada
        summary = league.process_season_end()

        # 1. Verifica registro formal de liquidação no resumo da temporada
        self.assertIn("liquidated_guilds", summary)
        self.assertEqual(len(summary["liquidated_guilds"]), 2)
        for name in last_two_names:
            self.assertIn(name, summary["liquidated_guilds"])

        # 2. As duas guildas liquidadas foram removidas
        div_acesso_guilds = league.divisions["div_acesso"]["guild_ids"]
        for gid in last_two_initial:
            self.assertNotIn(gid, div_acesso_guilds, f"Guilda falida {gid} ainda consta nos IDs de Acesso")
            self.assertNotIn(gid, league.all_guilds, f"Guilda falida {gid} ainda consta em all_guilds")
            self.assertNotIn(gid, league.divisions["div_acesso"]["table"], f"Guilda falida {gid} ainda consta na tabela")

        # 3. Exatamente 2 novas guildas foram fundadas pela Câmara dos Mercadores
        self.assertEqual(len(div_acesso_guilds), 8)
        new_guilds = [
            league.all_guilds[gid]
            for gid in div_acesso_guilds
            if gid.startswith("g_camara_")
        ]
        self.assertEqual(len(new_guilds), 2, "Esperava 2 novas guildas fundadas pela Câmara")

        for ng in new_guilds:
            # Poder médio entre 50 e 54
            self.assertTrue(
                50 <= ng["power_rating"] <= 54,
                f"Poder da nova guilda {ng['name']} ({ng['power_rating']}) fora da faixa 50-54"
            )
            # Nome heráldico corporativo (formado por múltiplos vocativos)
            self.assertGreater(len(ng["name"].split()), 1)
            # Exatamente 2 novos traços (1 tático, 1 corporativo)
            traits = ng.get("traits", [])
            self.assertEqual(len(traits), 2)
            types = {t.get("type") for t in traits}
            self.assertEqual(types, {"tactical", "corporate"})

    def test_serialization_roundtrip_preserves_traits(self):
        """to_dict e from_dict preservam fielmente os traços das guildas e novas concessões."""
        league = LeagueEngine(world_seed=123)
        league.process_season_end()

        data = league.to_dict()
        self.assertIn("world_seed", data)
        self.assertIn("all_guilds", data)

        restored = LeagueEngine(world_seed=999)
        restored.from_dict(data)

        self.assertEqual(restored.world_seed, 123)
        self.assertEqual(restored.season_number, league.season_number)

        for gid, g in league.all_guilds.items():
            self.assertIn(gid, restored.all_guilds)
            original_traits = [t["id"] for t in g.get("traits", [])]
            restored_traits = [t["id"] for t in restored.all_guilds[gid].get("traits", [])]
            self.assertEqual(original_traits, restored_traits)

    def test_no_forbidden_terms(self):
        """Garante conformidade com o vocabulário e ausência de termos proibidos nos arquivos de jogo."""
        import re
        files_to_check = [
            os.path.join(os.path.dirname(__file__), "..", "match_engine.py"),
            os.path.join(os.path.dirname(__file__), "..", "league_engine.py"),
            os.path.join(os.path.dirname(__file__), "..", "services", "phase_service.py"),
            os.path.join(os.path.dirname(__file__), "..", "data", "rival_traits_seed.json"),
        ]

        for filepath in files_to_check:
            self.assertTrue(os.path.exists(filepath), f"Arquivo não encontrado: {filepath}")
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read().lower()

            for term in FORBIDDEN_TERMS:
                if term == "gol":
                    matches = re.findall(r"\bgol\b", content)
                    self.assertEqual(len(matches), 0, f"Termo proibido '{term}' encontrado em {filepath}.")
                else:
                    self.assertNotIn(term, content, f"Termo proibido '{term}' encontrado em {filepath}.")


if __name__ == "__main__":
    unittest.main()
