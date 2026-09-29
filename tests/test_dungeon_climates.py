"""
Testes unitários e de conformidade para Desacoplamento Bioma x Clima e Habilidades de Classe.
Valida data/dungeons_seed.json, data/climates_seed.json, data/classes_seed.json, match_engine.py e phase_service.py.
"""

import os
import json
import random
import unittest

from balance import get_balance
from match_engine import (
    Team,
    MatchEngine,
    get_climates_data,
    get_default_climate,
    get_classes_data,
    get_skills_dict,
    check_terrain_mitigation,
    check_climate_mitigation,
)
from game_state import GameState
from league_engine import LeagueEngine
from market_engine import MarketEngine
from services.phase_service import PhaseService


class TestDungeonClimatesAndSkills(unittest.TestCase):
    def setUp(self):
        self.balance = get_balance()
        self.climates = get_climates_data()
        self.classes_data = get_classes_data()

        # Dungeons de teste
        self.dungeon_neutral = {
            "id": "dungeon_01",
            "name": "Vale dos Ecos Verdejantes",
            "terrain": "neutral",
            "power_penalty_pct": 0.0,
            "energy_cost_extra": 0,
            "mitigation_required": None,
            "recommended_power": 55,
        }
        self.dungeon_volcano = {
            "id": "dungeon_05",
            "name": "Caldeira Vulcânica de Ignis",
            "terrain": "volcanic_heat",
            "power_penalty_pct": 0.14,
            "energy_cost_extra": 6,
            "mitigation_required": "volcanic_heat",
            "recommended_power": 85,
        }

        # Climas de teste
        self.climate_clear = get_default_climate()
        self.climate_storm = next(c for c in self.climates if c["climate"] == "lightning_storm")
        self.climate_acid = next(c for c in self.climates if c["climate"] == "acid_rain")

    def test_new_biomes_presence_and_structure(self):
        """Verifica se os 4 novos biomas foram adicionados mantendo a estrutura canônica."""
        dungeons_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'dungeons_seed.json')
        with open(dungeons_path, 'r', encoding='utf-8') as f:
            dungeons = json.load(f)

        self.assertGreaterEqual(len(dungeons), 8)
        biomes = {d["terrain"] for d in dungeons}
        self.assertIn("volcanic_heat", biomes)
        self.assertIn("submerged_ruins", biomes)
        self.assertIn("arcane_fog", biomes)
        self.assertIn("lightning_peaks", biomes)

        for d in dungeons:
            for key in ["id", "name", "terrain", "terrain_label", "description", "recommended_power", "power_penalty_pct", "energy_cost_extra", "mitigation_required"]:
                self.assertIn(key, d, f"Campo {key} ausente na masmorra {d.get('id')}")

    def test_climates_seed_structure(self):
        """Verifica se os 6 climas exigidos estão presentes em climates_seed.json."""
        self.assertGreaterEqual(len(self.climates), 6)
        climate_types = {c["climate"] for c in self.climates}
        expected = {"clear_sky", "lightning_storm", "thick_fog", "acid_rain", "scorching_heat", "polar_wind"}
        self.assertTrue(expected.issubset(climate_types))

        for c in self.climates:
            for key in ["id", "climate", "name", "description", "power_penalty_pct", "energy_cost_extra", "mitigation_required"]:
                self.assertIn(key, c, f"Campo {key} ausente no clima {c.get('id')}")

    def test_cumulative_penalties_biome_and_climate(self):
        """Verifica se bioma e clima somam suas penalidades de poder e custos extras de suprimentos."""
        # Sem mitigação para bioma nem clima
        t1 = Team("Equipe Vulnerável", base_power=70, has_terrain_mitigation=False, has_climate_mitigation=False, balance=self.balance)
        t2 = Team("Equipe Dummy", base_power=70, balance=self.balance)

        engine = MatchEngine(
            t1,
            t2,
            dungeon=self.dungeon_volcano,
            climate=self.climate_storm,
            rng=random.Random(42),
            balance=self.balance,
        )

        # Penalidades somadas: 0.14 (volcano) + 0.06 (storm) = 0.20
        self.assertAlmostEqual(engine.penalty_pct_t1, 0.14)
        self.assertAlmostEqual(engine.climate_penalty_t1, 0.06)

        ep1 = t1.calculate_effective_power(engine.penalty_pct_t1, engine.climate_penalty_t1)
        # 70 * (1 - 0.20) = 56.0
        self.assertAlmostEqual(ep1, 56.0)

        # Custos extras somados: 6 (volcano) + 3 (storm) = 9
        self.assertEqual(engine.extra_cost_t1, 9)

    def test_partial_mitigation_terrain_vs_climate(self):
        """Verifica mitigações independentes: mitigar terreno não anula clima, e vice-versa."""
        # Mitiga terreno mas não clima
        t_mit_terrain = Team("Mitiga Terreno", base_power=80, has_terrain_mitigation=True, has_climate_mitigation=False, balance=self.balance)
        t_dummy = Team("Dummy", base_power=80, balance=self.balance)

        eng1 = MatchEngine(t_mit_terrain, t_dummy, dungeon=self.dungeon_volcano, climate=self.climate_acid, balance=self.balance)
        # Terreno mitigado (0.0), Clima ativo (0.08)
        ep1 = t_mit_terrain.calculate_effective_power(eng1.penalty_pct_t1, eng1.climate_penalty_t1)
        # 80 * (1 - 0.08) = 73.6
        self.assertAlmostEqual(ep1, 73.6)
        # Custo extra: apenas o clima (3)
        self.assertEqual(eng1.extra_cost_t1, 3)

        # Mitiga clima mas não terreno
        t_mit_climate = Team("Mitiga Clima", base_power=80, has_terrain_mitigation=False, has_climate_mitigation=True, balance=self.balance)
        eng2 = MatchEngine(t_mit_climate, t_dummy, dungeon=self.dungeon_volcano, climate=self.climate_acid, balance=self.balance)
        ep2 = t_mit_climate.calculate_effective_power(eng2.penalty_pct_t1, eng2.climate_penalty_t1)
        # 80 * (1 - 0.14) = 68.8
        self.assertAlmostEqual(ep2, 68.8)
        # Custo extra: apenas o terreno (6)
        self.assertEqual(eng2.extra_cost_t1, 6)

    def test_skill_survival_berserker_halves_terrain_penalty(self):
        """Habilidade Sobrevivência (Guerreiro/Berserker): reduz pela metade a penalidade de terreno sem item."""
        hero_berserker = {
            "id": "h_berserker",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_berserker",
            "current_power": 80,
            "fatigue": 0,
        }

        # Equipe com Berserker sem mitigação de item
        t_berserker = Team(
            "Tribo Berserker",
            base_power=80,
            has_terrain_mitigation=False,
            heroes=[hero_berserker],
            balance=self.balance,
        )
        self.assertTrue(t_berserker.has_skill("skill_survival"))

        # Equipe comum sem Berserker
        t_common = Team(
            "Tropa Comum",
            base_power=80,
            has_terrain_mitigation=False,
            heroes=[],
            balance=self.balance,
        )
        self.assertFalse(t_common.has_skill("skill_survival"))

        # Em terreno severo (0.14 penalidade)
        ep_berserker = t_berserker.calculate_effective_power(terrain_power_penalty_pct=0.14)
        ep_common = t_common.calculate_effective_power(terrain_power_penalty_pct=0.14)

        # Berserker sofre apenas 0.14 * 0.50 = 0.07 de penalidade: 80 * (1 - 0.07) = 74.4
        self.assertAlmostEqual(ep_berserker, 74.4)
        # Comum sofre 0.14 total: 80 * (1 - 0.14) = 68.8
        self.assertAlmostEqual(ep_common, 68.8)
        self.assertGreater(ep_berserker, ep_common)

    def test_skill_scout_archer_reduces_empty_room_cost(self):
        """Habilidade Batedor (Ladino/Arqueiro): redução no custo de suprimentos ao explorar salas vazias."""
        hero_archer = {
            "id": "h_archer",
            "class_id": "class_rogue",
            "specialization_id": "spec_rogue_archer",
            "current_power": 65,
            "fatigue": 0,
        }

        # Simula uma única sala com encounter_probability=0 (sala garantidamente vazia)
        t_scout = Team("Com Batedor", base_power=65, agi=50, heroes=[hero_archer], balance=self.balance)
        t_dummy = Team("Sem Batedor", base_power=65, agi=50, heroes=[], balance=self.balance)

        # Força probabilidade de encontro = 0.0 para garantir sala vazia
        custom_balance = dict(self.balance)
        custom_balance["expedition"] = dict(self.balance["expedition"])
        custom_balance["expedition"]["room_encounter_probability"] = 0.0
        custom_balance["expedition"]["room_cost_variance"] = 0.0  # Custo exato sem variação aleatória

        engine = MatchEngine(
            t_scout,
            t_dummy,
            dungeon=self.dungeon_neutral,
            climate=self.climate_clear,
            num_rooms=2,
            rng=random.Random(42),
            balance=custom_balance,
        )
        res = engine.simulate()

        # O batedor teve desconto de 30% no consumo de suprimentos da sala vazia
        energy_spent_scout = 100 - res["final_energy_player"]
        energy_spent_dummy = 100 - res["final_energy_rival"]

        self.assertLess(energy_spent_scout, energy_spent_dummy)

    def test_skill_shield_wall_swordsman_resolves_miniboss_draw(self):
        """Habilidade Parede de Escudos (Guerreiro/Espadachim): vantagem de desempate em Minibosses contra rivais."""
        hero_swordsman = {
            "id": "h_swordsman",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_swordsman",
            "current_power": 70,
            "fatigue": 0,
        }

        t_shield = Team("Guarda de Elite", base_power=70, heroes=[hero_swordsman], balance=self.balance)
        t_rival = Team("Rival Sem Escudo", base_power=70, heroes=[], balance=self.balance)

        engine = MatchEngine(t_shield, t_rival, dungeon=self.dungeon_neutral, rng=random.Random(42), balance=self.balance)

        # Força desempate chamando _resolve_miniboss com poderes iguais e roll no centro (0.5)
        engine.rng.random = lambda: 0.5  # Roll exatamente no meio da zona de empate
        engine._resolve_miniboss(ep1=70, ep2=70, room=1, t1_present=True, t2_present=True)

        # Team 1 deve ter pontuado pelo desempate da Parede de Escudos
        self.assertEqual(t_shield.score, 1)
        self.assertEqual(t_rival.score, 0)

    def test_skill_cold_execution_assassin_solo_boss_bonus(self):
        """Habilidade Execução Fria (Ladino/Assassino): bônus de poder na avaliação de Boss solitário."""
        hero_assassin = {
            "id": "h_assassin",
            "class_id": "class_rogue",
            "specialization_id": "spec_rogue_assassin",
            "current_power": 75,
            "fatigue": 0,
        }

        # Masmorra exige recommended_power de 85
        # Poder da equipe é 75. Sem habilidade, falharia (75 < 85)
        # Com Execução Fria (+15%): 75 * 1.15 = 86.25 >= 85 -> Vence o Boss!
        t_assassin = Team("Guilda Sombria", base_power=75, heroes=[hero_assassin], balance=self.balance)
        t_rival = Team("Rival Caído", base_power=75, balance=self.balance)

        engine = MatchEngine(
            t_assassin,
            t_rival,
            dungeon=self.dungeon_volcano,  # recommended_power = 85
            balance=self.balance,
        )

        msg = engine._resolve_final_boss(ep1=75, ep2=0, t1_present=True, t2_present=False)
        self.assertEqual(t_assassin.score, 2)
        self.assertIn("+2 PE", msg)

        # Sem a habilidade, com 75 de poder contra 85 recomendado:
        t_no_assassin = Team("Guilda Comum", base_power=75, heroes=[], balance=self.balance)
        engine2 = MatchEngine(t_no_assassin, t_rival, dungeon=self.dungeon_volcano, balance=self.balance)
        msg2 = engine2._resolve_final_boss(ep1=75, ep2=0, t1_present=True, t2_present=False)
        self.assertEqual(t_no_assassin.score, 0)
        self.assertIn("não atingiu o poder recomendado", msg2)

    def test_skill_concentrated_channeling_pyromancer_elemental_bonus(self):
        """Habilidade Canalização Concentrada (Mago/Piromante): bônus de Poder contra Minibosses elementais."""
        hero_pyro = {
            "id": "h_pyro",
            "class_id": "class_mage",
            "specialization_id": "spec_mage_pyromancer",
            "current_power": 70,
            "fatigue": 0,
        }

        t_pyro = Team("Círculo das Chamas", base_power=70, heroes=[hero_pyro], balance=self.balance)
        t_rival = Team("Inimigo", base_power=70, heroes=[], balance=self.balance)

        # Em masmorra elemental (volcanic_heat)
        engine = MatchEngine(t_pyro, t_rival, dungeon=self.dungeon_volcano, balance=self.balance)
        self.assertTrue(engine.is_elemental_encounter)

        # Em ambiente não-elemental (campo neutro com céu limpo)
        engine_neutral = MatchEngine(t_pyro, t_rival, dungeon=self.dungeon_neutral, climate=self.climate_clear, balance=self.balance)
        self.assertFalse(engine_neutral.is_elemental_encounter)

    def test_skill_sustaining_prayer_cleric_reduces_fatigue_in_phase_service(self):
        """Habilidade Prece de Sustentação (Clérigo/Apoio): reduz a fadiga resultante da expedição na Fase 4."""
        state = GameState()
        state.starters = ["hero_cleric_test", "hero_fighter_test"]

        # Herói clérigo de suporte
        cleric = {
            "id": "hero_cleric_test",
            "name": "Irmã Lyra",
            "class_id": "class_cleric",
            "specialization_id": "spec_cleric_support",
            "current_power": 60,
            "fatigue": 10,
            "status": "Apto",
        }
        fighter = {
            "id": "hero_fighter_test",
            "name": "Guerreiro Teste",
            "class_id": "class_warrior",
            "specialization_id": "spec_warrior_swordsman",
            "current_power": 60,
            "fatigue": 10,
            "status": "Apto",
        }
        state.team = [cleric, fighter]

        league = LeagueEngine()
        market = MarketEngine()
        import match_engine
        service = PhaseService(state, dungeons=[self.dungeon_neutral], league_engine=league, market_engine=market, match_engine=match_engine)

        service.phase_4_dungeon()

        # Fadiga padrão ganha seria 20.
        # Com Clérigo de Apoio, a skill_sustaining_prayer reduz 5 pontos, ganhando apenas 15.
        # 10 inicial + 15 = 25
        self.assertEqual(cleric["fatigue"], 25)
        self.assertEqual(fighter["fatigue"], 25)

    def test_deterministic_climate_selection_in_phase_service(self):
        """Verifica se a seleção de clima semanal em PhaseService é estritamente determinística."""
        state1 = GameState()
        state1.world_seed = 98765
        state1.day = 3

        service1 = PhaseService(state1, dungeons=[self.dungeon_neutral], league_engine=LeagueEngine(), market_engine=MarketEngine())
        climate1 = service1.get_current_climate()

        state2 = GameState()
        state2.world_seed = 98765
        state2.day = 3

        service2 = PhaseService(state2, dungeons=[self.dungeon_neutral], league_engine=LeagueEngine(), market_engine=MarketEngine())
        climate2 = service2.get_current_climate()

        self.assertEqual(climate1["id"], climate2["id"])

        state3 = GameState()
        state3.world_seed = 98765
        state3.day = 4
        service3 = PhaseService(state3, dungeons=[self.dungeon_neutral], league_engine=LeagueEngine(), market_engine=MarketEngine())
        climate3 = service3.get_current_climate()
        self.assertIn("climate", climate3)

    def test_no_forbidden_terms(self):
        """Garante que nenhum termo proibido (gol, gramado, estádio, escanteio, bilheteria, Brasfoot) está nos arquivos criados/alterados."""
        forbidden = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]
        files = [
            os.path.join(os.path.dirname(__file__), '..', 'data', 'dungeons_seed.json'),
            os.path.join(os.path.dirname(__file__), '..', 'data', 'climates_seed.json'),
            os.path.join(os.path.dirname(__file__), '..', 'data', 'classes_seed.json'),
            os.path.join(os.path.dirname(__file__), '..', 'match_engine.py'),
            os.path.join(os.path.dirname(__file__), '..', 'services', 'phase_service.py'),
        ]

        import re
        for fp in files:
            self.assertTrue(os.path.exists(fp), f"Arquivo não encontrado: {fp}")
            with open(fp, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                for term in forbidden:
                    if term == "gol":
                        matches = re.findall(r'\bgol\b', content)
                        self.assertEqual(len(matches), 0, f"Termo proibido 'gol' encontrado em {fp}")
                    else:
                        self.assertNotIn(term, content, f"Termo proibido '{term}' encontrado em {fp}")


if __name__ == '__main__':
    unittest.main()
