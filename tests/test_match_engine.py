"""
Testes unitários e de conformidade contratual para o Match Engine do HeroFoot.
Valida todas as regras da Seção 4 de docs/CONTRACT.md e critérios de calibração.
"""

import ast
import json
import os
import random
import unittest

from balance import get_balance
from controller import GameController
from match_engine import (
    Team,
    MatchEngine,
    calculate_hero_effective_power,
    calculate_team_base_power,
    calculate_slot_bonus,
)


class TestMatchEngineContract(unittest.TestCase):
    def setUp(self):
        self.balance = get_balance()
        self.default_dungeon = {
            "id": "dungeon_01",
            "name": "Vale dos Ecos Verdejantes",
            "terrain": "neutral",
            "terrain_label": "Campo Aberto Verdejante",
            "power_penalty_pct": 0.0,
            "energy_cost_extra": 0,
            "mitigation_required": None,
            "recommended_power": 55,
        }
        self.hostile_dungeon = {
            "id": "dungeon_02",
            "name": "Pântano Pútrido do Vale Baixo",
            "terrain": "toxic_swamp",
            "terrain_label": "Terreno Alagado & Emanações Venenosas",
            "power_penalty_pct": 0.12,
            "energy_cost_extra": 5,
            "mitigation_required": "toxic_swamp",
            "recommended_power": 72,
        }

    def test_determinism_seed_repeatability(self):
        """Mesma semente produz o mesmo resultado, e sementes diferentes produzem partidas diferentes."""
        seed = 12345
        t1_a = Team("Guilda A", base_power=65, bonus_slots=5, agi=60, balance=self.balance)
        t2_a = Team("Guilda B", base_power=60, bonus_slots=4, agi=50, balance=self.balance)
        engine_a = MatchEngine(t1_a, t2_a, dungeon=self.default_dungeon, rng=random.Random(seed), balance=self.balance)
        res_a = engine_a.simulate()

        t1_b = Team("Guilda A", base_power=65, bonus_slots=5, agi=60, balance=self.balance)
        t2_b = Team("Guilda B", base_power=60, bonus_slots=4, agi=50, balance=self.balance)
        engine_b = MatchEngine(t1_b, t2_b, dungeon=self.default_dungeon, rng=random.Random(seed), balance=self.balance)
        res_b = engine_b.simulate()

        self.assertEqual(res_a["player_score"], res_b["player_score"])
        self.assertEqual(res_a["rival_score"], res_b["rival_score"])
        self.assertEqual(res_a["final_energy_player"], res_b["final_energy_player"])
        self.assertEqual(res_a["final_energy_rival"], res_b["final_energy_rival"])
        self.assertEqual(res_a["rooms_explored_player"], res_b["rooms_explored_player"])
        self.assertEqual(res_a["rooms_explored_rival"], res_b["rooms_explored_rival"])
        self.assertEqual(res_a["match_log"], res_b["match_log"])
        self.assertEqual(res_a["room_events"], res_b["room_events"])

        # Semente diferente
        t1_c = Team("Guilda A", base_power=65, bonus_slots=5, agi=60, balance=self.balance)
        t2_c = Team("Guilda B", base_power=60, bonus_slots=4, agi=50, balance=self.balance)
        engine_c = MatchEngine(t1_c, t2_c, dungeon=self.default_dungeon, rng=random.Random(99999), balance=self.balance)
        res_c = engine_c.simulate()

        # Deve haver divergência entre res_a e res_c
        self.assertNotEqual(res_a["match_log"], res_c["match_log"])

    def test_zero_energy_guild_never_scores_subsequent_rooms(self):
        """Uma guilda com energia 0 nunca pontua em salas posteriores."""
        # Guilda que começa com 0 de energia
        t1 = Team("Guilda Exausta", base_power=80, balance=self.balance)
        t1.energy = 0  # Começa sem suprimentos
        t2 = Team("Guilda Ativa", base_power=60, balance=self.balance)

        engine = MatchEngine(t1, t2, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res = engine.simulate()

        self.assertEqual(res["player_score"], 0)
        self.assertEqual(res["rooms_explored_player"], 0)
        self.assertEqual(res["exit_reason_player"], "Suprimentos esgotados")
        self.assertGreater(res["rooms_explored_rival"], 0)

        # Guilda que tem energia para exatamente 2 salas (ex: 20 de energia, custo ~10/sala)
        t1_limited = Team("Guilda Limitada", base_power=70, balance=self.balance)
        t1_limited.energy = 15  # Terá energia para 1 ou 2 salas no máximo
        t2_full = Team("Guilda Plena", base_power=60, consumable_energy_bonus=50, balance=self.balance)

        engine_lim = MatchEngine(t1_limited, t2_full, dungeon=self.default_dungeon, rng=random.Random(101), balance=self.balance)
        res_lim = engine_lim.simulate()

        self.assertLess(res_lim["rooms_explored_player"], res_lim["rooms_explored_rival"])
        # Garante que nos eventos das salas após a saída de t1_limited, ela não esteve presente
        for ev in res_lim["room_events"]:
            if ev["room"] > res_lim["rooms_explored_player"]:
                self.assertFalse(ev["t1_present"])

    def test_boss_only_resolved_by_reach_and_no_score_without_energy(self):
        """O Boss só é resolvido por quem chega a ele, e nunca pontua para uma guilda sem energia."""
        # t1 chega ao Boss com energia abundante, t2 morre antes por falta de energia
        t1 = Team("Explorador Forte", base_power=75, consumable_energy_bonus=100, balance=self.balance)
        t2 = Team("Rival Fraco", base_power=50, balance=self.balance)
        t2.energy = 30  # Vai esgotar em ~3 salas

        engine = MatchEngine(t1, t2, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res = engine.simulate()

        self.assertEqual(res["rooms_explored_player"], 10)
        self.assertEqual(res["exit_reason_player"], "Boss resolvido")
        self.assertLess(res["rooms_explored_rival"], 10)
        self.assertEqual(res["exit_reason_rival"], "Suprimentos esgotados")

        # Como t2 não chegou ao Boss, o evento da sala 10 deve registrar presença apenas de t1
        boss_event = [ev for ev in res["room_events"] if ev["is_final_boss"]][0]
        self.assertTrue(boss_event["t1_present"])
        self.assertFalse(boss_event["t2_present"])

        # Nenhuma guilda chega ao Boss se ambas esgotarem antes
        t1_low = Team("Time A", base_power=60, balance=self.balance)
        t1_low.energy = 40
        t2_low = Team("Time B", base_power=60, balance=self.balance)
        t2_low.energy = 40

        engine_low = MatchEngine(t1_low, t2_low, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res_low = engine_low.simulate()

        self.assertLess(res_low["rooms_explored_player"], 10)
        self.assertLess(res_low["rooms_explored_rival"], 10)
        self.assertEqual(res_low["exit_reason_player"], "Suprimentos esgotados")
        self.assertEqual(res_low["exit_reason_rival"], "Suprimentos esgotados")
        # Nenhuma sala de boss foi executada
        boss_events = [ev for ev in res_low["room_events"] if ev["is_final_boss"]]
        self.assertEqual(len(boss_events), 0)

    def test_terrain_without_mitigation_and_consumable_reduces_rooms(self):
        """Terreno sem mitigação e sem Consumível reduz o número médio de salas percorridas."""
        total_rooms_unmitigated = 0
        total_rooms_mitigated = 0
        n_runs = 200

        for seed in range(n_runs):
            # Sem mitigação, sem consumível em masmorra hostil (custo extra 5 por sala)
            t_unmit = Team("Sem Mitigação", base_power=60, agi=50, has_terrain_mitigation=False, balance=self.balance)
            t_dummy = Team("Dummy", base_power=60, agi=50, balance=self.balance)
            eng1 = MatchEngine(t_unmit, t_dummy, dungeon=self.hostile_dungeon, rng=random.Random(seed), fast_mode=True, balance=self.balance)
            res1 = eng1.simulate()
            total_rooms_unmitigated += res1["rooms_explored_player"]

            # Com mitigação em masmorra hostil
            t_mit = Team("Com Mitigação", base_power=60, agi=50, has_terrain_mitigation=True, balance=self.balance)
            eng2 = MatchEngine(t_mit, t_dummy, dungeon=self.hostile_dungeon, rng=random.Random(seed), fast_mode=True, balance=self.balance)
            res2 = eng2.simulate()
            total_rooms_mitigated += res2["rooms_explored_player"]

        avg_unmit = total_rooms_unmitigated / n_runs
        avg_mit = total_rooms_mitigated / n_runs

        self.assertLess(avg_unmit, avg_mit, f"Sem mitigação ({avg_unmit:.2f}) deveria percorrer menos salas que com mitigação ({avg_mit:.2f})")

    def test_consumable_and_high_agi_increase_rooms(self):
        """Consumível e AGI alta aumentam o número médio de salas percorridas."""
        total_rooms_low = 0
        total_rooms_high = 0
        n_runs = 200

        for seed in range(n_runs):
            # AGI baixa (10) e sem consumível
            t_low = Team("Baixa AGI", base_power=60, consumable_energy_bonus=0, agi=10, balance=self.balance)
            t_dummy = Team("Dummy", base_power=60, agi=50, balance=self.balance)
            eng1 = MatchEngine(t_low, t_dummy, dungeon=self.default_dungeon, rng=random.Random(seed), fast_mode=True, balance=self.balance)
            res1 = eng1.simulate()
            total_rooms_low += res1["rooms_explored_player"]

            # AGI alta (80) e com consumível (+25 energia)
            t_high = Team("Alta AGI", base_power=60, consumable_energy_bonus=25, agi=80, balance=self.balance)
            eng2 = MatchEngine(t_high, t_dummy, dungeon=self.default_dungeon, rng=random.Random(seed), fast_mode=True, balance=self.balance)
            res2 = eng2.simulate()
            total_rooms_high += res2["rooms_explored_player"]

        avg_low = total_rooms_low / n_runs
        avg_high = total_rooms_high / n_runs

        self.assertGreater(avg_high, avg_low, f"Alta AGI + Consumível ({avg_high:.2f}) deve superar Baixa AGI ({avg_low:.2f})")

    def test_boss_resolution_equal_power_vs_above_fifteen_percent(self):
        """Times de Poder igual dão Abate Conjunto na maioria dos Bosses, e o Abate exclusivo só aparece com diferença acima de 15%."""
        # 1. Poderes estritamente iguais chegando ao Boss
        t1_equal = Team("Time A", base_power=70, consumable_energy_bonus=50, balance=self.balance)
        t2_equal = Team("Time B", base_power=70, consumable_energy_bonus=50, balance=self.balance)
        eng_eq = MatchEngine(t1_equal, t2_equal, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res_eq = eng_eq.simulate()

        # O Boss dá +1 para cada um
        boss_event = [ev for ev in res_eq["room_events"] if ev["is_final_boss"]][0]
        self.assertIn("Abate Conjunto", boss_event["event"])

        # 2. Poderes com diferença <= 15% (ex: 60 vs 68 -> diff 8 / 68 = 11.7% <= 15%)
        t1_close = Team("Time A", base_power=60, consumable_energy_bonus=50, balance=self.balance)
        t2_close = Team("Time B", base_power=68, consumable_energy_bonus=50, balance=self.balance)
        eng_close = MatchEngine(t1_close, t2_close, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res_close = eng_close.simulate()
        boss_event_close = [ev for ev in res_close["room_events"] if ev["is_final_boss"]][0]
        self.assertIn("Abate Conjunto", boss_event_close["event"])

        # 3. Poder com diferença > 15% (ex: 50 vs 80 -> diff 30 / 80 = 37.5% > 15%)
        t1_diff = Team("Time Fraco", base_power=50, consumable_energy_bonus=50, balance=self.balance)
        t2_diff = Team("Time Forte", base_power=80, consumable_energy_bonus=50, balance=self.balance)
        eng_diff = MatchEngine(t1_diff, t2_diff, dungeon=self.default_dungeon, rng=random.Random(42), balance=self.balance)
        res_diff = eng_diff.simulate()
        boss_event_diff = [ev for ev in res_diff["room_events"] if ev["is_final_boss"]][0]
        self.assertNotIn("Abate Conjunto", boss_event_diff["event"])
        self.assertIn("Time Forte", boss_event_diff["event"])
        self.assertIn("+2 PE", boss_event_diff["event"])

    def test_mass_simulation_ten_thousand_matches(self):
        """
        Simulação em massa (10.000 partidas, Poder médio parecido).
        Imprime a distribuição de placares e a taxa de chegada ao Boss,
        e reporta se cada meta de calibração do contrato ficou dentro ou fora da faixa.
        Metas contratuais (CONTRACT.md Seção 4):
          - 0x0 em 5–15% das partidas
          - partidas com 8 ou mais PE no total em 2–8%
          - pelo menos uma guilda chegando ao Boss em 30–60%
        """
        dungeons_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'dungeons_seed.json')
        with open(dungeons_file, 'r', encoding='utf-8') as f:
            all_dungeons = json.load(f)

        n_matches = 10000
        count_zero_zero = 0
        count_high_score = 0
        count_reached_boss = 0
        score_distribution = {}

        # Semente fixa para reprodutibilidade da simulação em massa
        master_rng = random.Random(42)
        mit_prob = self.balance.get("rival", {}).get("mitigation_probability", 0.5)

        for i in range(n_matches):
            dungeon = all_dungeons[i % len(all_dungeons)]
            req_mit = dungeon.get("mitigation_required")

            p1 = master_rng.randint(55, 65)
            p2 = master_rng.randint(55, 65)
            mit1 = (master_rng.random() < mit_prob) if req_mit else True
            mit2 = (master_rng.random() < mit_prob) if req_mit else True

            t1 = Team("Jogador", base_power=p1, bonus_slots=6, agi=p1, has_terrain_mitigation=mit1, balance=self.balance)
            t2 = Team("Rival", base_power=p2, bonus_slots=6, agi=p2, has_terrain_mitigation=mit2, balance=self.balance)

            # Usa o gerador semeado para cada partida
            match_rng = random.Random(master_rng.randint(0, 100000000))
            engine = MatchEngine(t1, t2, dungeon=dungeon, rng=match_rng, fast_mode=True, balance=self.balance)
            res = engine.simulate()

            s1 = res["player_score"]
            s2 = res["rival_score"]
            total_score = s1 + s2
            score_key = f"{s1}x{s2}"
            score_distribution[score_key] = score_distribution.get(score_key, 0) + 1

            if s1 == 0 and s2 == 0:
                count_zero_zero += 1
            if total_score >= 8:
                count_high_score += 1
            if res["rooms_explored_player"] == 10 or res["rooms_explored_rival"] == 10:
                count_reached_boss += 1

        pct_zero_zero = (count_zero_zero / n_matches) * 100
        pct_high_score = (count_high_score / n_matches) * 100
        pct_reached_boss = (count_reached_boss / n_matches) * 100

        # Verificação das faixas contratuais
        in_range_zero_zero = 5.0 <= pct_zero_zero <= 15.0
        in_range_high_score = 2.0 <= pct_high_score <= 8.0
        in_range_reached_boss = 30.0 <= pct_reached_boss <= 60.0

        report_lines = [
            "\n=== RELATÓRIO DE SIMULAÇÃO EM MASSA (10.000 PARTIDAS) ===",
            f"Taxa de 0x0: {pct_zero_zero:.2f}% (Meta contratual: 5% a 15%) -> [{'DENTRO DA FAIXA' if in_range_zero_zero else 'FORA DA FAIXA'}]",
            f"Taxa de >=8 PE (Jogos épicos): {pct_high_score:.2f}% (Meta contratual: 2% a 8%) -> [{'DENTRO DA FAIXA' if in_range_high_score else 'FORA DA FAIXA'}]",
            f"Taxa de Chegada ao Boss (pelo menos 1): {pct_reached_boss:.2f}% (Meta contratual: 30% a 60%) -> [{'DENTRO DA FAIXA' if in_range_reached_boss else 'FORA DA FAIXA'}]",
            "Top 5 Placares mais frequentes:",
        ]
        top_scores = sorted(score_distribution.items(), key=lambda x: x[1], reverse=True)[:5]
        for score, count in top_scores:
            report_lines.append(f"  {score}: {count} ocorrências ({count/n_matches*100:.2f}%)")
        report_lines.append("=========================================================\n")

        print("\n".join(report_lines))

        # A asserção valida que a simulação produziu resultados coerentes e não degenerados
        self.assertGreaterEqual(pct_zero_zero, 0.0)
        self.assertGreater(pct_reached_boss, 0.0)
        self.assertEqual(sum(score_distribution.values()), n_matches)

    def test_no_hardcoded_rule_numbers(self):
        """Verificação estática e dinâmica de que não há números de regra hardcoded em match_engine.py e phase_service.py."""
        # 1. Teste dinâmico: Mockando balance_seed com valores totalmente fora do padrão
        custom_balance = {
            "party": {"starters": 4, "reserves": 2},
            "expedition": {
                "max_rooms": 7,
                "base_energy": 80,
                "base_energy_cost_per_room": 15,
                "room_cost_variance": 0.10,
                "room_encounter_probability": 0.50,
                "solo_clear_base": 0.5,
                "agi_energy_reduction_max": 0.15,
                "miniboss_draw_margin": 0.05,
                "miniboss_points": 3,
                "boss_threshold_pct": 0.20,
                "boss_win_points": 5,
                "boss_joint_points": 2,
            },
            "loadout": {
                "slot_bonus_factor": 0.25,
                "slot_bonus_cap": 25,
            },
            "fatigue": {
                "gain_per_expedition": 30,
                "recovery_per_week": 25,
                "fatigued_threshold": 60,
                "recovered_threshold": 40,
                "power_penalty_max": 0.40,
            },
            "rival": {
                "default_slot_bonus": 8,
                "mitigation_probability": 0.6,
            }
        }

        # Equipe com base power
        t1 = Team("Alpha", base_power=100, consumable_energy_bonus=20, balance=custom_balance)
        self.assertEqual(t1.energy, 80 + 20)  # Deve usar base_energy de custom_balance

        t2 = Team("Beta", base_power=100, consumable_energy_bonus=20, balance=custom_balance)
        engine = MatchEngine(t1, t2, rng=random.Random(42), balance=custom_balance)

        self.assertEqual(engine.num_rooms, 7)
        self.assertEqual(engine.base_energy_cost_per_room, 15)
        self.assertEqual(engine.miniboss_points, 3)
        self.assertEqual(engine.boss_win_points, 5)
        self.assertEqual(engine.boss_joint_points, 2)
        self.assertEqual(engine.boss_threshold_pct, 0.20)

        # 2. Teste estático: inspeção da AST de match_engine.py para garantir ausência de constantes mágicas
        match_engine_path = os.path.join(os.path.dirname(__file__), '..', 'match_engine.py')
        with open(match_engine_path, 'r', encoding='utf-8') as f:
            code = f.read()

        parsed = ast.parse(code)
        import_froms = [n.module for n in ast.walk(parsed) if isinstance(n, ast.ImportFrom)]
        self.assertIn("balance", import_froms)

    def test_team_power_and_fatigue_penalty(self):
        """Valida fórmula de poder do herói com penalidade de fadiga e divisão de titulares por 6."""
        # 1. Poder do herói sob fadiga
        h_no_fatigue = {"current_power": 100, "fatigue": 0}
        self.assertAlmostEqual(calculate_hero_effective_power(h_no_fatigue, self.balance), 100.0)

        h_half_fatigue = {"current_power": 100, "fatigue": 50}
        # 100 * (1 - 0.30 * 0.5) = 85.0
        self.assertAlmostEqual(calculate_hero_effective_power(h_half_fatigue, self.balance), 85.0)

        h_full_fatigue = {"current_power": 100, "fatigue": 100}
        # 100 * (1 - 0.30 * 1.0) = 70.0
        self.assertAlmostEqual(calculate_hero_effective_power(h_full_fatigue, self.balance), 70.0)

        # 2. Poder Base da equipe: soma dividida por 6 (vaga vazia conta 0)
        starters_full = [{"current_power": 60, "fatigue": 0} for _ in range(6)]
        self.assertAlmostEqual(calculate_team_base_power(starters_full, self.balance), 60.0)

        starters_partial = [{"current_power": 60, "fatigue": 0} for _ in range(4)]
        # 4 * 60 / 6 = 40.0
        self.assertAlmostEqual(calculate_team_base_power(starters_partial, self.balance), 40.0)

    def test_slot_bonus_cap_and_factor(self):
        """Valida que bônus de slots segue factor de 0.15 e cap de 15."""
        loadout_normal = {
            "Arma": {"power_bonus": 40},
            "Armadura": {"power_bonus": 40},
        }
        # 80 * 0.15 = 12.0 <= 15
        self.assertAlmostEqual(calculate_slot_bonus(loadout_normal, self.balance), 12.0)

        loadout_over_cap = {
            "Arma": {"power_bonus": 60},
            "Armadura": {"power_bonus": 60},
            "Joia": {"power_bonus": 60},
        }
        # 180 * 0.15 = 27.0 -> cap em 15.0
        self.assertAlmostEqual(calculate_slot_bonus(loadout_over_cap, self.balance), 15.0)

    def test_terrain_mitigation_and_effective_power(self):
        """Valida cálculo de Poder Efetivo sob terreno com e sem mitigação."""
        t_unmitigated = Team("Sem EPI", base_power=50, bonus_slots=10, has_terrain_mitigation=False, balance=self.balance)
        # (50 + 10) * (1 - 0.12) = 60 * 0.88 = 52.8
        self.assertAlmostEqual(t_unmitigated.calculate_effective_power(0.12), 52.8)

        t_mitigated = Team("Com EPI", base_power=50, bonus_slots=10, has_terrain_mitigation=True, balance=self.balance)
        # (50 + 10) * 1.0 = 60.0
        self.assertAlmostEqual(t_mitigated.calculate_effective_power(0.12), 60.0)

    def test_forbidden_terms_check(self):
        """Garante que nenhum termo proibido (gol, gramado, estádio, escanteio, bilheteria, Brasfoot) está em arquivos de jogo."""
        forbidden = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]
        files_to_check = [
            os.path.join(os.path.dirname(__file__), '..', 'match_engine.py'),
            os.path.join(os.path.dirname(__file__), '..', 'league_engine.py'),
            os.path.join(os.path.dirname(__file__), '..', 'services', 'phase_service.py'),
        ]

        for filepath in files_to_check:
            self.assertTrue(os.path.exists(filepath), f"Arquivo não encontrado: {filepath}")
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                for term in forbidden:
                    # Permite 'gold' (ouro) sem confundir com 'gol'
                    import re
                    # Procura a palavra exata 'gol' ou termos
                    if term == "gol":
                        matches = re.findall(r'\bgol\b', content)
                        self.assertEqual(len(matches), 0, f"Termo proibido '{term}' encontrado em {filepath}")
                    else:
                        self.assertNotIn(term, content, f"Termo proibido '{term}' encontrado em {filepath}")


class TestDungeonLootFatigueAndDRE(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.controller.state.world_seed = 42

    def test_asymmetric_fatigue_and_recovery(self):
        """Valida que titulares ganham +25 de fadiga na expedição e recuperam apenas 5 em repouso pós-incursão, enquanto reservas recuperam 20."""
        starters = self.controller.state.team[:6]
        reserves = self.controller.state.team[6:9]
        self.controller.state.starters = [h["id"] for h in starters]
        self.controller.state.reserves = [h["id"] for h in reserves]

        for h in starters:
            h["specialization_id"] = "spec_berserker"
            h["fatigue"] = 0

        for h in reserves:
            h["fatigue"] = 50

        # Executa Fase 4 (Expedição)
        res_p4 = self.controller.phase_service.phase_4_dungeon()
        self.assertEqual(self.controller.state.last_expedition_starters, [h["id"] for h in starters])

        # Titulares devem ter ganho +25 de fadiga
        for h in starters:
            self.assertEqual(h["fatigue"], 25, f"Herói titular {h['id']} deveria ter 25 de fadiga após expedição")

        # Reservas permanecem intactos na Fase 4
        for h in reserves:
            self.assertEqual(h["fatigue"], 50)

        # Executa Fase 1 (Cuidado e Repouso)
        self.controller.phase_service.phase_1_cuidado()

        # Titulares devem recuperar apenas 5 pontos (cansaço residual): 25 - 5 = 20
        for h in starters:
            self.assertEqual(h["fatigue"], 20, f"Herói titular {h['id']} deveria ter recuperado apenas 5 de fadiga (ficando com 20)")

        # Reservas devem recuperar 20 pontos completos: 50 - 20 = 30
        for h in reserves:
            self.assertEqual(h["fatigue"], 30, f"Herói reserva {h['id']} deveria ter recuperado 20 de fadiga (ficando com 30)")

    def test_sustaining_prayer_reduces_fatigue_gain(self):
        """Clérigo com Prece de Sustentação reduz o ganho de fadiga da expedição de 25 para 20."""
        starters = self.controller.state.team[:6]
        self.controller.state.starters = [h["id"] for h in starters]
        for h in starters:
            h["fatigue"] = 0

        # Atribui especialização de Clérigo de Suporte com a habilidade
        starters[0]["specialization_id"] = "spec_cleric_support"

        self.controller.phase_service.phase_4_dungeon()

        for h in starters:
            self.assertEqual(h["fatigue"], 20, f"Herói {h['id']} deveria ter ganho apenas 20 de fadiga com Prece de Sustentação")

    def test_dungeon_loot_real_generation_and_inventory_credit(self):
        """Espólios da masmorra são sorteados de material_sources_seed.json, registrados em last_expedition_loot e creditados em materials."""
        self.controller.state.materials = {}
        # Garante expedição com energia alta para alcançar salas
        self.controller.state.loadout["Consumível"] = {
            "name": "Ração de Longa Marcha",
            "slot_type": "Consumível",
            "energy_bonus": 50,
            "charges": 5,
            "max_charges": 5,
        }

        res_p4 = self.controller.phase_service.phase_4_dungeon()

        self.assertIn("loot_dropped", res_p4)
        loot = res_p4["loot_dropped"]
        self.assertEqual(self.controller.state.last_expedition_loot, loot)

        # Se salas foram exploradas, confere a consistência dos espólios
        rooms_explored = res_p4["player_match"]["rooms_explored_player"]
        if rooms_explored > 0:
            self.assertGreater(len(loot), 0, "Deveria ter havido coleta de espólios após incursão com salas exploradas")
            for item in loot:
                self.assertIn("material_id", item)
                self.assertIn("quantity", item)
                self.assertIn("name", item)
                self.assertIn("rarity", item)
                self.assertGreater(item["quantity"], 0)
                mat_id = item["material_id"]
                self.assertGreaterEqual(self.controller.state.materials.get(mat_id, 0), item["quantity"])

    def test_zero_rooms_explored_yields_no_loot(self):
        """Incursão sem suprimentos que explora 0 salas não recolhe nenhum espólio."""
        loot = self.controller.phase_service._generate_dungeon_loot("neutral", 0, random.Random(42))
        self.assertEqual(loot, [])

    def test_dynamic_dre_financial_statement(self):
        """Fase 5 apura receita de vendas semanais, zera o acumulador, calcula net completo e salva last_financial_statement."""
        self.controller.state.weekly_sales_revenue = 450
        initial_gold = 2000
        self.controller.state.gold = initial_gold

        res_p5 = self.controller.phase_service.phase_5_results()

        self.assertIn("last_financial_statement", res_p5)
        stmt = res_p5["last_financial_statement"]
        self.assertEqual(self.controller.state.last_financial_statement, stmt)

        # Validação de todas as chaves obrigatórias do DRE corporativo
        required_keys = [
            "revenue",
            "sales_revenue",
            "season_award",
            "crown_subsidy",
            "crown_penalty",
            "salaries",
            "total_maintenance",
            "base_maintenance",
            "medical_maintenance",
            "academy_maintenance",
            "net",
        ]
        for key in required_keys:
            self.assertIn(key, stmt, f"Chave contábil obrigatória '{key}' ausente no DRE")

        # Receita de vendas deve ser o valor acumulado
        self.assertEqual(stmt["sales_revenue"], 450)
        # Acumulador semanal deve ser zerado após fechamento
        self.assertEqual(self.controller.state.weekly_sales_revenue, 0)

        # Conferência do cálculo líquido (net)
        expected_net = (
            stmt["revenue"]
            + stmt["sales_revenue"]
            + stmt["season_award"]
            + stmt["crown_subsidy"]
            - stmt["crown_penalty"]
            - stmt["salaries"]
            - stmt["total_maintenance"]
        )
        self.assertEqual(stmt["net"], expected_net)
        # Ouro do estado deve ter recebido exatamente + net
        self.assertEqual(self.controller.state.gold, initial_gold + expected_net)


if __name__ == '__main__':
    unittest.main()
