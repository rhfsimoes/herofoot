import unittest
import random
import json
import threading
from http.server import HTTPServer
from urllib.request import Request, urlopen
from controller import GameController
from server import HeroFootAPIHandler
from crafting import (
    determine_quality,
    create_gororoba,
    get_workshops_data,
)

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestCrafting(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.crafting_service = self.controller.crafting_service
        self.crafting_engine = self.controller.crafting_engine
        self.workshops_data = get_workshops_data()

    def test_10000_crafts_per_level_match_seed_probabilities(self):
        """
        10.000 crafts por nível batem as probabilidades da tabela do seed com ±1,5 ponto percentual.
        Verifica todos os níveis de 1 a 6.
        """
        levels_config = self.workshops_data.get("levels", {})
        total_crafts = 10000

        for level_int in range(1, 7):
            level_str = str(level_int)
            expected_probs = levels_config[level_str]

            # RNG determinístico e injetável para cada nível
            rng = random.Random(20260928 + level_int)
            counts = {"Fraco": 0, "Normal": 0, "Ótimo": 0, "Lendário": 0}

            for _ in range(total_crafts):
                q = determine_quality(level_int, rng=rng)
                counts[q] += 1

            for quality, expected_pct in expected_probs.items():
                observed_pct = (counts[quality] / total_crafts) * 100.0
                diff = abs(observed_pct - expected_pct)
                self.assertLessEqual(
                    diff,
                    1.5,
                    f"Nível {level_int} - {quality}: esperado {expected_pct}%, obtido {observed_pct:.2f}% (dif {diff:.2f}%)"
                )

    def test_level_1_never_generates_legendary(self):
        """Nível 1 nunca gera Lendário em nenhum sorteio."""
        rng = random.Random(1337)
        for _ in range(10000):
            q = determine_quality(1, rng=rng)
            self.assertNotEqual(q, "Lendário", "Nível 1 não pode gerar qualidade Lendário.")

    def test_recipe_alchemy_with_blacksmithing_branch_uses_alchemy(self):
        """
        O ramo é sempre recipe['branch'] (normalizado).
        O parâmetro branch do cliente é ignorado; receita de Alquimia com branch enviado como Ferragem usa Alquimia.
        """
        from catalog import get_catalog
        cat = get_catalog()
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2
        try:
            # Configura filial de Ferragem em nível alto e Alquimia em nível 1
            self.state.workshop_levels["Ferragem"] = 5
            self.state.workshop_levels["Alquimia"] = 1

            # rec_06 é da Alquimia e exige min_workshop_level = 2
            # Abastece materiais para rec_06
            self.state.materials["mat_eucalyptus_herb"] = 10
            self.state.materials["mat_mana_crystal"] = 10

            # Tenta craftar enviando branch "Ferragem"
            res_fail = self.crafting_service.craft_item("rec_06", branch="Ferragem")
            self.assertFalse(res_fail["success"])
            self.assertIn("alquimia", res_fail["message"].lower())
            self.assertIn("laudo pericial", res_fail["message"].lower())

            # Agora promove Alquimia para nível 2
            self.state.workshop_levels["Alquimia"] = 2
            res_success = self.crafting_service.craft_item("rec_06", branch="Ferragem")
            self.assertTrue(res_success["success"])
            self.assertEqual(res_success["item"]["branch"], "Alquimia")
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min

    def test_insufficient_workshop_level_rejected_with_inspection_report(self):
        """
        Nível insuficiente de oficina é rejeitado com laudo de inspeção pericial
        e não consome insumos.
        """
        from catalog import get_catalog
        cat = get_catalog()
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2
        try:
            self.state.workshop_levels["Alquimia"] = 1
            self.state.materials["mat_eucalyptus_herb"] = 5
            self.state.materials["mat_mana_crystal"] = 5

            herb_before = self.state.materials["mat_eucalyptus_herb"]
            crystal_before = self.state.materials["mat_mana_crystal"]
            inv_len_before = len(self.state.inventory)

            result = self.crafting_service.craft_item("rec_06")  # exige nível 2

            self.assertFalse(result["success"])
            msg = result["message"].lower()
            self.assertIn("laudo pericial", msg)
            self.assertIn("alquimia", msg)
            self.assertIn("nível 1", msg)
            self.assertIn("nível 2", msg)

            # Insumos não devem ser debitados
            self.assertEqual(self.state.materials["mat_eucalyptus_herb"], herb_before)
            self.assertEqual(self.state.materials["mat_mana_crystal"], crystal_before)
            self.assertEqual(len(self.state.inventory), inv_len_before)
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min

    def test_upgrade_workshop_debits_gold_and_stops_at_level_6(self):
        """
        Upgrade debita o ouro correto lido de workshops_seed.json e para no nível 6
        (rejeita upgrades além do 6).
        """
        upgrade_costs = self.workshops_data.get("upgrade_costs", {})
        self.state.gold = 20000
        self.state.workshop_levels["Ferragem"] = 1

        for target_level in range(2, 7):
            expected_cost = upgrade_costs[str(target_level)]
            gold_before = self.state.gold

            res = self.crafting_service.upgrade_workshop("Ferragem")

            self.assertTrue(res["success"])
            self.assertEqual(res["level"], target_level)
            self.assertEqual(res["cost"], expected_cost)
            self.assertEqual(self.state.workshop_levels["Ferragem"], target_level)
            self.assertEqual(self.state.gold, gold_before - expected_cost)
            # Refletido no get_state do controller
            self.assertEqual(self.controller.get_state()["workshop_levels"]["Ferragem"], target_level)

        # Tentativa de upgrade além do nível 6 deve ser rejeitada
        gold_at_max = self.state.gold
        res_beyond = self.crafting_service.upgrade_workshop("Ferragem")
        self.assertFalse(res_beyond["success"])
        self.assertEqual(self.state.workshop_levels["Ferragem"], 6)
        self.assertEqual(self.state.gold, gold_at_max)
        self.assertIn("máximo", res_beyond["message"].lower())

    def test_upgrade_with_insufficient_gold_rejected(self):
        """Upgrade com ouro insuficiente é rejeitado e não altera o estado nem o ouro."""
        self.state.workshop_levels["Joalheria"] = 1
        self.state.gold = 100  # Custo do nível 2 é 500

        res = self.crafting_service.upgrade_workshop("Joalheria")
        self.assertFalse(res["success"])
        self.assertEqual(self.state.workshop_levels["Joalheria"], 1)
        self.assertEqual(self.state.gold, 100)
        self.assertIn("insuficientes", res["message"].lower())

    def test_gororoba_fallback_function(self):
        """Fallback 'Gororoba' é uma função separada e é invocado para receitas inexistentes."""
        g = create_gororoba()
        self.assertEqual(g["name"], "Gororoba")
        self.assertEqual(g["quality"], "Fraco")
        self.assertFalse(g["special_suffix_active"])
        multipliers = self.workshops_data.get("quality_multipliers", {})
        self.assertEqual(g["multiplier"], multipliers.get("Fraco", 0.70))

        # Teste via CraftingEngine com receita desconhecida
        res = self.crafting_engine.craft_item("receita_fantasma_inexistente", 1)
        self.assertEqual(res["name"], "Gororoba")
        self.assertEqual(res["quality"], "Fraco")

    def test_quality_multipliers_from_seed_and_special_suffix(self):
        """Multiplicadores de qualidade vêm de workshops_seed.json e special_suffix_active é True sse Lendário."""
        seed_multipliers = self.workshops_data.get("quality_multipliers", {})

        # Cria uma classe dummy RNG para forçar cada qualidade
        class MockRng:
            def __init__(self, fixed_roll):
                self.fixed_roll = fixed_roll

            def uniform(self, a, b):
                return self.fixed_roll

        # Nível 4: Fraco 0, Normal 30, Ótimo 50, Lendário 20
        # roll = 10 -> Normal, roll = 40 -> Ótimo, roll = 90 -> Lendário
        mock_normal = MockRng(10.0)
        res_normal = self.crafting_engine.craft_item("rec_01", 4, rng=mock_normal)
        self.assertEqual(res_normal["quality"], "Normal")
        self.assertEqual(res_normal["multiplier"], seed_multipliers["Normal"])
        self.assertFalse(res_normal["special_suffix_active"])

        mock_legendary = MockRng(90.0)
        res_legendary = self.crafting_engine.craft_item("rec_01", 4, rng=mock_legendary)
        self.assertEqual(res_legendary["quality"], "Lendário")
        self.assertEqual(res_legendary["multiplier"], seed_multipliers["Lendário"])
        self.assertTrue(res_legendary["special_suffix_active"])

    def test_regular_craft_awards_xp_tier1(self):
        """Forja regular de receita Tier 1 credita 10 XP à respectiva bancada e atualiza o estado."""
        from catalog import get_catalog
        cat = get_catalog()
        for ing in cat.get_recipe_ingredients("rec_01"):
            self.state.materials[ing["material_id"]] = 50

        self.state.workshop_levels["Ferragem"] = 1
        self.state.workshop_xp["Ferragem"] = 0
        self.assertEqual(self.state.get_workshop_xp("Ferragem"), 0)

        # Primeiro craft
        res = self.crafting_service.craft_item("rec_01")
        self.assertTrue(res["success"])
        self.assertEqual(res["xp_gained"], 10)
        self.assertEqual(res["current_xp"], 10)
        self.assertEqual(self.state.get_workshop_xp("Ferragem"), 10)

        # Segundo craft acumula XP
        res2 = self.crafting_service.craft_item("rec_01")
        self.assertTrue(res2["success"])
        self.assertEqual(res2["xp_gained"], 10)
        self.assertEqual(res2["current_xp"], 20)
        self.assertEqual(self.state.get_workshop_xp("Ferragem"), 20)

        # Refletido no get_state do controller
        state_view = self.controller.get_state()
        self.assertEqual(state_view["workshop_xp"]["Ferragem"], 20)
        self.assertIn("1", state_view["xp_progression"])

    def test_tinkering_failure_produces_gororoba_unlocks_recipe_and_awards_fail_xp(self):
        """
        Tinkering com falha induzida (workshop_level < min_level):
        - Consome insumos
        - Produz Gororoba Experimental (slot da receita, qualidade Fraco, valor base 20)
        - Homologa a receita em known_recipes
        - Credita 5 XP de refugo fabril à bancada
        """
        from catalog import get_catalog
        cat = get_catalog()
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2

        try:
            self.state.workshop_levels["Alquimia"] = 1
            self.state.workshop_xp["Alquimia"] = 0
            if "rec_06" in self.state.known_recipes:
                self.state.known_recipes.remove("rec_06")

            for ing in cat.get_recipe_ingredients("rec_06"):
                self.state.materials[ing["material_id"]] = 10

            class MockFailRng:
                def random(self):
                    return 0.99  # Falha garantida (> 0.65)
                def uniform(self, a, b):
                    return 50.0

            res = self.crafting_service.craft_item("rec_06", is_tinkering=True, rng=MockFailRng())

            self.assertTrue(res["success"])
            self.assertTrue(res["tinkering"])
            self.assertFalse(res["tinkering_success"])
            self.assertTrue(res["recipe_unlocked"])
            self.assertEqual(res["quality"], "Fraco")
            self.assertEqual(res["xp_gained"], 5)
            self.assertEqual(self.state.get_workshop_xp("Alquimia"), 5)

            # Receita homologada no catálogo da guilda
            self.assertIn("rec_06", self.state.known_recipes)

            # Item de refugo
            item = res["item"]
            self.assertEqual(item["name"], "Gororoba Experimental")
            self.assertEqual(item["quality"], "Fraco")
            self.assertEqual(item["market_value_base"], 20)
            self.assertEqual(item["slot"], cat.recipes["rec_06"]["slot"])
            self.assertIn(item, self.state.inventory)
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min

    def test_tinkering_success_produces_item_unlocks_recipe_and_awards_bonus_xp(self):
        """
        Tinkering com sucesso induzido (workshop_level < min_level):
        - Consome insumos
        - Produz o item normal homologado
        - Homologa a receita em known_recipes
        - Credita XP ampliada em 1.5x (10 * 1.5 = 15 XP)
        """
        from catalog import get_catalog
        cat = get_catalog()
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2

        try:
            self.state.workshop_levels["Alquimia"] = 1
            self.state.workshop_xp["Alquimia"] = 0
            if "rec_06" in self.state.known_recipes:
                self.state.known_recipes.remove("rec_06")

            for ing in cat.get_recipe_ingredients("rec_06"):
                self.state.materials[ing["material_id"]] = 10

            class MockSuccessRng:
                def random(self):
                    return 0.01  # Sucesso garantido (< 0.65)
                def uniform(self, a, b):
                    return 50.0

            res = self.crafting_service.craft_item("rec_06", is_tinkering=True, rng=MockSuccessRng())

            self.assertTrue(res["success"])
            self.assertTrue(res["tinkering"])
            self.assertTrue(res["tinkering_success"])
            self.assertTrue(res["recipe_unlocked"])
            self.assertNotEqual(res["item"]["name"], "Gororoba Experimental")
            self.assertEqual(res["xp_gained"], 15)  # 10 * 1.5
            self.assertEqual(self.state.get_workshop_xp("Alquimia"), 15)
            self.assertIn("rec_06", self.state.known_recipes)
            self.assertIn(res["item"], self.state.inventory)
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min

    def test_upgrade_workshop_debits_gold_and_consumes_xp(self):
        """Upgrade de oficina debita ouro de tesouraria e consome a XP acumulada requerida."""
        self.state.gold = 2000
        self.state.workshop_levels["Ferragem"] = 1
        self.state.workshop_xp["Ferragem"] = 140

        # Nível 1 -> 2 exige 100 XP e 500 Ouro
        res = self.crafting_service.upgrade_workshop("Ferragem")

        self.assertTrue(res["success"])
        self.assertEqual(res["level"], 2)
        self.assertEqual(res["cost"], 500)
        self.assertEqual(res["xp_consumed"], 100)
        self.assertEqual(res["current_xp"], 40)
        self.assertEqual(self.state.gold, 1500)
        self.assertEqual(self.state.get_workshop_xp("Ferragem"), 40)
        self.assertEqual(self.state.workshop_levels["Ferragem"], 2)

        # Refletido no get_state do controller
        state_view = self.controller.get_state()
        self.assertEqual(state_view["workshop_levels"]["Ferragem"], 2)
        self.assertEqual(state_view["workshop_xp"]["Ferragem"], 40)

    def test_no_forbidden_terms_in_crafting_messages(self):
        """Garante que as mensagens de crafting, tinkering e upgrade não possuem termos proibidos."""
        from catalog import get_catalog
        cat = get_catalog()
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2

        try:
            self.state.workshop_levels["Ferragem"] = 1
            self.state.workshop_levels["Alquimia"] = 1
            self.state.gold = 50

            for ing in cat.get_recipe_ingredients("rec_06"):
                self.state.materials[ing["material_id"]] = 10

            class MockFailRng:
                def random(self):
                    return 0.99
                def uniform(self, a, b):
                    return 50.0

            class MockSuccessRng:
                def random(self):
                    return 0.01
                def uniform(self, a, b):
                    return 50.0

            calls = [
                lambda: self.crafting_service.craft_item("receita_inexistente"),
                lambda: self.crafting_service.craft_item("rec_06"),  # Nível insuficiente sem tinkering
                lambda: self.crafting_service.craft_item("rec_01"),  # Falta insumo
                lambda: self.crafting_service.craft_item("rec_06", is_tinkering=True, rng=MockFailRng()),
                lambda: self.crafting_service.craft_item("rec_06", is_tinkering=True, rng=MockSuccessRng()),
                lambda: self.crafting_service.upgrade_workshop("Ferragem"),  # Falta ouro
                lambda: self.crafting_service.upgrade_workshop("ramo_inexistente"),
            ]

            for call in calls:
                res = call()
                msg = res.get("message", "").lower()
                for term in FORBIDDEN_TERMS:
                    self.assertNotIn(term, msg, f"Termo proibido '{term}' encontrado na mensagem: '{msg}'")
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min


class TestServerCraftingEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = HTTPServer(('127.0.0.1', 0), HeroFootAPIHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _post(self, path: str, payload: dict):
        url = f"http://127.0.0.1:{self.port}{path}"
        data = json.dumps(payload).encode('utf-8')
        req = Request(url, data=data, headers={'Content-Type': 'application/json'})
        return urlopen(req)

    def _get(self, path: str):
        url = f"http://127.0.0.1:{self.port}{path}"
        return urlopen(url)

    def test_http_get_state_exposes_workshop_xp_and_progression(self):
        """Endpoint /api/state expõe workshop_xp e xp_progression."""
        resp = self._get('/api/state')
        self.assertEqual(resp.status, 200)
        data = json.loads(resp.read().decode('utf-8'))
        self.assertIn("workshop_xp", data)
        self.assertIn("Ferragem", data["workshop_xp"])
        self.assertIn("Alquimia", data["workshop_xp"])
        self.assertIn("Joalheria", data["workshop_xp"])
        self.assertIn("Culinária", data["workshop_xp"])
        self.assertIn("xp_progression", data)
        self.assertIn("1", data["xp_progression"])

    def test_http_post_craft_regular_and_tinkering(self):
        """Endpoint /api/craft processa forja regular e suporta flag is_tinkering."""
        import server
        from catalog import get_catalog
        cat = get_catalog()

        # Abastece materiais no controller do servidor
        for ing in cat.get_recipe_ingredients("rec_01"):
            server.controller.state.materials[ing["material_id"]] = 50

        # Craft regular via HTTP
        payload_regular = {"recipe_id": "rec_01", "is_tinkering": False}
        resp = self._post('/api/craft', payload_regular)
        self.assertEqual(resp.status, 200)
        res_data = json.loads(resp.read().decode('utf-8'))
        self.assertTrue(res_data.get("success"))
        self.assertEqual(res_data.get("xp_gained"), 10)

        # Tinkering via HTTP
        orig_min = cat.recipes["rec_06"].get("min_workshop_level", 1)
        cat.recipes["rec_06"]["min_workshop_level"] = 2
        try:
            server.controller.state.workshop_levels["Alquimia"] = 1
            for ing in cat.get_recipe_ingredients("rec_06"):
                server.controller.state.materials[ing["material_id"]] = 50

            payload_tinkering = {"recipe_id": "rec_06", "is_tinkering": True}
            resp_tink = self._post('/api/craft', payload_tinkering)
            self.assertEqual(resp_tink.status, 200)
            res_tink_data = json.loads(resp_tink.read().decode('utf-8'))
            self.assertTrue(res_tink_data.get("success"))
            self.assertTrue(res_tink_data.get("tinkering"))
            self.assertTrue(res_tink_data.get("recipe_unlocked"))
        finally:
            cat.recipes["rec_06"]["min_workshop_level"] = orig_min

    def test_http_post_upgrade_workshop(self):
        """Endpoint /api/upgrade_workshop consome ouro e XP acumulada via HTTP."""
        import server
        server.controller.state.gold = 5000
        server.controller.state.workshop_levels["Joalheria"] = 1
        server.controller.state.workshop_xp["Joalheria"] = 150

        payload = {"branch": "Joalheria"}
        resp = self._post('/api/upgrade_workshop', payload)
        self.assertEqual(resp.status, 200)
        res_data = json.loads(resp.read().decode('utf-8'))
        self.assertTrue(res_data.get("success"))
        self.assertEqual(res_data.get("level"), 2)
        self.assertEqual(res_data.get("cost"), 500)
        self.assertEqual(res_data.get("xp_consumed"), 100)
        self.assertEqual(res_data.get("current_xp"), 50)


if __name__ == '__main__':
    unittest.main()
