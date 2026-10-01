"""
Testes de auditoria e validação das Posições Operacionais (Vanguarda, DPS, Suporte, Suporte Logístico)
Conforme Ordem de Serviço Técnica: Zero Hardcoding, Determinismo Estrito,
Ciclo de Vantagens (PvPvE), Dreno de Suprimentos, Alívio de Fadiga e Mitigação de Afastamento Médico.
"""

import unittest
import random
import json
import os
from match_engine import (
    Team,
    MatchEngine,
    calculate_positional_advantage,
    get_hero_position,
    get_positions_data,
    get_positions_config,
)
from controller import GameController


class TestPositionsSystem(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.phase_service = self.controller.phase_service
        self.tactics_service = self.controller.tactics_service
        self.hero_service = self.controller.hero_service

    def test_zero_hardcoding_positions_catalog(self):
        """As 4 posições operacionais e suas configurações devem existir em classes_seed.json."""
        positions = get_positions_data()
        self.assertEqual(len(positions), 4)

        pos_ids = {p["id"] for p in positions}
        expected = {"pos_vanguarda", "pos_dps", "pos_suporte", "pos_suporte_logistico"}
        self.assertEqual(pos_ids, expected)

        cfg = get_positions_config()
        self.assertIn("advantage_cycle", cfg)
        self.assertIn("counter_log_messages", cfg)
        self.assertGreaterEqual(float(cfg.get("advantage_multiplier", 0)), 1.1)

    def test_rock_paper_scissors_cycle(self):
        """
        Valida o ciclo canônico de vantagens:
        Vanguarda > DPS > Suporte > Suporte Logístico > Vanguarda.
        """
        cfg = get_positions_config()
        cycle = cfg.get("advantage_cycle", {})

        self.assertEqual(cycle.get("pos_vanguarda"), "pos_dps")
        self.assertEqual(cycle.get("pos_dps"), "pos_suporte")
        self.assertEqual(cycle.get("pos_suporte"), "pos_suporte_logistico")
        self.assertEqual(cycle.get("pos_suporte_logistico"), "pos_vanguarda")

        # 1. Vanguarda vs DPS -> Vanguarda vence na vantagem
        t_vanguard = Team("Time Vanguarda", base_power=60, heroes=[{"position_id": "pos_vanguarda"}])
        t_dps = Team("Time DPS", base_power=60, heroes=[{"position_id": "pos_dps"}])
        m1, m2, logs = calculate_positional_advantage(t_vanguard, t_dps)
        self.assertGreater(m1, 1.0)
        self.assertLess(m2, 1.0)
        self.assertTrue(any("Vanguarda absorveu" in l for l in logs))

        # 2. DPS vs Suporte -> DPS vence na vantagem
        t_sup = Team("Time Suporte", base_power=60, heroes=[{"position_id": "pos_suporte"}])
        m1, m2, logs = calculate_positional_advantage(t_dps, t_sup)
        self.assertGreater(m1, 1.0)
        self.assertLess(m2, 1.0)
        self.assertTrue(any("DPS avançou" in l for l in logs))

        # 3. Suporte vs Suporte Logístico -> Suporte vence na vantagem
        t_log = Team("Time Logístico", base_power=60, heroes=[{"position_id": "pos_suporte_logistico"}])
        m1, m2, logs = calculate_positional_advantage(t_sup, t_log)
        self.assertGreater(m1, 1.0)
        self.assertLess(m2, 1.0)
        self.assertTrue(any("Suporte manteve" in l for l in logs))

        # 4. Suporte Logístico vs Vanguarda -> Suporte Logístico vence na vantagem
        m1, m2, logs = calculate_positional_advantage(t_log, t_vanguard)
        self.assertGreater(m1, 1.0)
        self.assertLess(m2, 1.0)
        self.assertTrue(any("Suporte Logístico contornou" in l for l in logs))

    def test_logistics_energy_drain_reduction(self):
        """Suporte Logístico reduz o multiplicador de consumo de suprimentos nas câmaras."""
        team_without = Team("Sem Logístico", base_power=50, heroes=[])
        self.assertEqual(team_without.get_logistics_energy_multiplier(), 1.0)

        # 1 Suporte Logístico
        hero_log_1 = {"id": "h_log1", "position_id": "pos_suporte_logistico"}
        team_1 = Team("1 Logístico", base_power=50, heroes=[hero_log_1])
        mult_1 = team_1.get_logistics_energy_multiplier()
        self.assertAlmostEqual(mult_1, 0.85, places=2)

        # 2 Suportes Logísticos -> 30% redução (mult = 0.70)
        hero_log_2 = {"id": "h_log2", "position_id": "pos_suporte_logistico"}
        team_2 = Team("2 Logísticos", base_power=50, heroes=[hero_log_1, hero_log_2])
        mult_2 = team_2.get_logistics_energy_multiplier()
        self.assertAlmostEqual(mult_2, 0.70, places=2)

        # 3 Suportes Logísticos -> teto de 40% redução (mult = 0.60)
        hero_log_3 = {"id": "h_log3", "position_id": "pos_suporte_logistico"}
        team_3 = Team("3 Logísticos", base_power=50, heroes=[hero_log_1, hero_log_2, hero_log_3])
        mult_3 = team_3.get_logistics_energy_multiplier()
        self.assertAlmostEqual(mult_3, 0.60, places=2)

    def test_dps_boss_execution_bonus(self):
        """DPS confere bônus de execução na Câmara do Boss Final."""
        hero_dps_1 = {"id": "h_dps1", "position_id": "pos_dps"}
        hero_dps_2 = {"id": "h_dps2", "position_id": "pos_dps"}

        team_no_dps = Team("Sem DPS", base_power=50, heroes=[])
        self.assertEqual(team_no_dps.get_dps_boss_execution_bonus(), 0.0)

        team_with_dps = Team("Com DPS", base_power=50, heroes=[hero_dps_1, hero_dps_2])
        self.assertAlmostEqual(team_with_dps.get_dps_boss_execution_bonus(), 0.30, places=2)

    def test_post_expedition_fatigue_and_injury_mitigation(self):
        """Vanguarda centraliza desgaste e alivia companheiros; Suporte cura fadiga da expedição."""
        vanguard_hero = {
            "id": "h_van",
            "name": "Valdris",
            "position_id": "pos_vanguarda",
            "position": "Vanguarda",
            "fatigue": 0,
            "injured": False,
            "status": "Apto"
        }
        dps_hero = {
            "id": "h_dps",
            "name": "Magister",
            "position_id": "pos_dps",
            "position": "DPS",
            "fatigue": 0,
            "injured": False,
            "status": "Apto"
        }
        support_hero = {
            "id": "h_sup",
            "name": "Clérigo",
            "position_id": "pos_suporte",
            "position": "Suporte",
            "fatigue": 0,
            "injured": False,
            "status": "Apto"
        }

        self.state.team = [vanguard_hero, dps_hero, support_hero]
        self.state.starters = ["h_van", "h_dps", "h_sup"]

        # Executa simulação da masmorra
        res = self.phase_service.phase_4_dungeon()
        self.assertEqual(res["phase"], 4)

        # O DPS deve ter ganho menos fadiga que o Vanguarda porque Vanguarda absorve em si mesmo
        # e alivia os companheiros (além da cura de 5 pts do Suporte)
        self.assertGreater(vanguard_hero["fatigue"], dps_hero["fatigue"])

    def test_score_synchronization_in_save_data(self):
        """points_t1, points_t2, score_t1, score_t2, player_score e rival_score devem ser 100% consistentes."""
        t1 = Team("T1", base_power=60)
        t2 = Team("T2", base_power=60)
        engine = MatchEngine(t1, t2, rng=random.Random(1337))
        result = engine.simulate()

        self.assertEqual(result["player_score"], result["score_t1"])
        self.assertEqual(result["player_score"], result["points_t1"])
        self.assertEqual(result["rival_score"], result["score_t2"])
        self.assertEqual(result["rival_score"], result["points_t2"])

    def test_tactics_accepts_any_position_combination_with_six_slots(self):
        """A escalação aceita livremente qualquer combinação das 4 posições operacionais."""
        heroes = [
            {"id": f"hero_test_{i}", "name": f"H{i}", "position_id": pos, "status": "Apto", "injured": False, "salary": 50, "fatigue": 0}
            for i, pos in enumerate(["pos_vanguarda", "pos_vanguarda", "pos_dps", "pos_dps", "pos_suporte", "pos_suporte_logistico"])
        ]
        self.state.team = heroes
        starters_ids = [h["id"] for h in heroes]

        res = self.tactics_service.save_tactics(starters=starters_ids, loadout={}, reserves=[])
        self.assertTrue(res["success"])
        self.assertEqual(len(self.state.starters), 6)


if __name__ == "__main__":
    unittest.main()
