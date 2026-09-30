import unittest
from controller import GameController


class TestApiContract(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()

    def test_get_state_contract_keys(self):
        """Verifica se get_state() contém todas as chaves obrigatórias do contrato."""
        state = self.controller.get_state()
        expected_keys = {
            "day",
            "week",
            "gold",
            "current_phase",
            "workshop_levels",
            "materials",
            "inventory",
            "team",
            "team_size",
            "tactics",
            "current_dungeon",
            "pending_offers",
            "league_table",
            "last_round_matches",
            "current_fixture",
            "market",
            "recipes",
        }
        self.assertTrue(expected_keys.issubset(state.keys()), f"Chaves faltando no get_state: {expected_keys - state.keys()}")

        # Heróis devem conter nomes decorados
        self.assertGreater(len(state["team"]), 0)
        for hero in state["team"]:
            self.assertIn("class_name", hero)
            self.assertIn("specialization_name", hero)
            self.assertIn("stat_weight_profile", hero)

    def test_tactics_saving(self):
        """Verifica se save_tactics persiste titulares e loadout."""
        initial_hero = self.controller.state.team[0]["id"]
        result = self.controller.save_tactics(
            starters=[initial_hero],
            loadout={"Arsenal Ofensivo": None, "Blindagem Operacional": None, "Ativo de Performance": None, "Alvará de Risco": None, "Provisão Logística": None}
        )
        self.assertTrue(result["success"])
        self.assertIn("tactics", result)
        self.assertEqual(result["tactics"]["starters"], [initial_hero])

    def test_craft_flow(self):
        """Verifica ciclo de fabricação na oficina."""
        # Garante materiais suficientes
        self.controller.state.materials["mat_iron_ore"] = 10
        result = self.controller.ui_request_craft("rec_01", branch="Ferragem")
        self.assertTrue(result["success"], result.get("message"))
        self.assertIn("item", result)
        item = result["item"]
        self.assertIn("item_instance_id", item)
        self.assertEqual(item["slot_type"], "Arsenal Ofensivo")
        self.assertIn(item, self.controller.state.inventory)

    def test_market_buy_material_and_item(self):
        """Verifica compras de insumos e itens prontos."""
        initial_gold = self.controller.state.gold
        if self.controller.market_engine.materials_for_sale:
            target_mat = self.controller.market_engine.materials_for_sale[0]
            mat_res = self.controller.buy_material(target_mat["material_id"], quantity=1)
            self.assertTrue(mat_res["success"])
            self.assertLess(self.controller.state.gold, initial_gold)

        if self.controller.market_engine.ready_items_for_sale:
            target = self.controller.market_engine.ready_items_for_sale[0]
            item_res = self.controller.buy_ready_item(target["market_item_id"])
            self.assertTrue(item_res["success"])
            self.assertIn("item", item_res)

    def test_counter_sales_flow(self):
        """Verifica listagem de venda e resolução de proposta."""
        dummy_item = {
            "item_instance_id": "test_sale_item_01",
            "name": "Item Teste",
            "slot_type": "Arsenal Ofensivo",
            "quality": "Normal",
            "power_bonus": 10,
            "market_value_base": 100,
        }
        self.controller.state.inventory.append(dummy_item)

        # Venda a preço justo
        res = self.controller.list_item_for_sale("test_sale_item_01", base_price=100, margin_type="Preço Justo")
        self.assertTrue(res["success"])

    def test_full_five_phases_cycle(self):
        """Percorre todas as 5 fases do ciclo e valida avanço de rodada."""
        self.assertEqual(self.controller.state.current_phase, 1)
        r1 = self.controller.advance_phase()  # 1 -> 2
        self.assertEqual(r1["current_phase"], 2)
        r2 = self.controller.advance_phase()  # 2 -> 3
        self.assertEqual(r2["current_phase"], 3)
        r3 = self.controller.advance_phase()  # 3 -> 4
        self.assertEqual(r3["current_phase"], 4)
        r4 = self.controller.advance_phase()  # 4 -> 5
        self.assertEqual(r4["current_phase"], 5)
        self.assertIn("player_match", r4)
        r5 = self.controller.advance_phase()  # 5 -> 1 (nova rodada)
        self.assertEqual(r5["current_phase"], 1)
        self.assertEqual(r5["day"], 2)
        self.assertEqual(r5["week"], 2)


if __name__ == '__main__':
    unittest.main()
