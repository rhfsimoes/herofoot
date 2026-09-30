"""
Unit tests for HeroFoot VIP Orders from Nobility (Encomendas VIP da Nobreza) v0.6.0.
"""

import json
import os
import random
import threading
import unittest
from http.server import HTTPServer
from urllib.request import Request, urlopen

import server
from controller import GameController
from market_engine import MarketEngine, load_vip_orders
from server import HeroFootAPIHandler


class DeterministicRNG:
    """RNG controlado para testes determinísticos de encomendas VIP."""
    def __init__(self, random_val=0.1, choice_idx=0):
        self.random_val = random_val
        self.choice_idx = choice_idx

    def random(self):
        return self.random_val

    def choice(self, seq):
        return seq[self.choice_idx % len(seq)]

    def sample(self, seq, k):
        return seq[:k]

    def randint(self, a, b):
        return a

    def uniform(self, a, b):
        return a


class TestVipOrders(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.controller.market_engine.bulletin = None
        self.controller.market_engine.active_vip_order = None
        self.controller.state.inventory = []
        self.controller.state.pending_offers = {}
        self.controller.state.gold = 1000
        self.controller.state.contractor_confidence = 75

    def test_seed_contains_valid_vip_orders_without_prohibited_terms(self):
        """Seed data/vip_orders_seed.json deve conter encomendas válidas e sem termos proibidos."""
        orders = load_vip_orders()
        self.assertGreater(len(orders), 0)
        prohibited = ["gol", "gramado", "estádio", "escanteio", "bilheteria", "brasfoot"]
        for o in orders:
            self.assertIn("id", o)
            self.assertIn("client_name", o)
            self.assertIn("target_slot", o)
            self.assertIn("required_quality", o)
            self.assertIn("reward_multiplier", o)
            self.assertIn("confidence_reward", o)
            self.assertIn("flavor_text", o)
            for p in prohibited:
                self.assertNotIn(p, o["client_name"].lower())
                self.assertNotIn(p, o["flavor_text"].lower())

    def test_vip_order_spawn_with_2_weeks_duration(self):
        """Com chance favorável, sorteia encomenda VIP com prazo de validade de 2 semanas (expires_round = round + 2)."""
        me = MarketEngine(rng=DeterministicRNG(random_val=0.99))  # Inicializa sem encomenda
        me.active_vip_order = None

        # Rodada 1: Sorteia com RNG favorável (0.1 < 0.35)
        me.refresh_market(round_number=1, rng=DeterministicRNG(random_val=0.1, choice_idx=0))
        self.assertIsNotNone(me.active_vip_order)
        order = me.active_vip_order
        self.assertEqual(order["expires_round"], 3)  # 1 + 2 = 3

        # Rodada 2: Ainda não expirou (2 < 3), mantém a mesma encomenda ativa
        me.refresh_market(round_number=2, rng=DeterministicRNG(random_val=0.99))
        self.assertIsNotNone(me.active_vip_order)
        self.assertEqual(me.active_vip_order["id"], order["id"])
        self.assertEqual(me.active_vip_order["expires_round"], 3)

        # Rodada 3: Expirou (3 >= 3), e com RNG desfavorável não sorteia nova
        me.refresh_market(round_number=3, rng=DeterministicRNG(random_val=0.99))
        self.assertIsNone(me.active_vip_order)

    def test_vip_order_serialization_to_dict_and_from_dict(self):
        """to_dict e from_dict persistem adequadamente a encomenda VIP ativa."""
        me = MarketEngine(rng=DeterministicRNG(random_val=0.99))
        dummy_order = {
            "id": "vip_test_01",
            "client_name": "Auditoria Imperial",
            "target_slot": "Blindagem Operacional",
            "required_quality": "Ótimo",
            "reward_multiplier": 3.0,
            "confidence_reward": 15,
            "expires_round": 5,
        }
        me.active_vip_order = dummy_order

        data = me.to_dict()
        self.assertIn("active_vip_order", data)
        self.assertEqual(data["active_vip_order"]["id"], "vip_test_01")

        me2 = MarketEngine(rng=DeterministicRNG(random_val=0.99))
        me2.active_vip_order = None
        me2.from_dict(data)
        self.assertIsNotNone(me2.active_vip_order)
        self.assertEqual(me2.active_vip_order["id"], "vip_test_01")
        self.assertEqual(me2.active_vip_order["expires_round"], 5)

    def test_active_vip_order_exposed_in_get_state(self):
        """get_state()['market']['vip_order'] expõe a encomenda VIP ativa."""
        dummy_order = {
            "id": "vip_test_state",
            "client_name": "Consórcio Real",
            "target_slot": "Arsenal Ofensivo",
            "required_quality": "Lendário",
            "reward_multiplier": 4.5,
            "confidence_reward": 25,
            "expires_round": 4,
        }
        self.controller.market_engine.active_vip_order = dummy_order
        st = self.controller.get_state()
        self.assertIn("market", st)
        self.assertIn("vip_order", st["market"])
        self.assertEqual(st["market"]["vip_order"]["id"], "vip_test_state")

    def test_fulfill_vip_order_success_credits_gold_and_confidence(self):
        """Entrega de ativo com requisitos compatíveis credita ouro multiplicado e bônus de confiança sem taxa de anúncio."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_01",
            "client_name": "Guarda Ducal de Prata",
            "target_slot": "Blindagem Operacional",
            "required_quality": "Ótimo",
            "reward_multiplier": 2.6,
            "confidence_reward": 12,
            "expires_round": 3,
        }
        item = {
            "item_instance_id": "plate_armor_01",
            "name": "Couraça Espelhada da Guarda",
            "slot_type": "Blindagem Operacional",
            "quality": "Ótimo",
            "power_bonus": 25,
            "market_value_base": 200,
        }
        self.controller.state.inventory.append(item)
        self.controller.state.gold = 1000
        self.controller.state.contractor_confidence = 70

        res = self.controller.fulfill_vip_order("plate_armor_01")
        self.assertTrue(res["success"])
        expected_gold = round(200 * 2.6)  # 520
        self.assertEqual(res["gold_earned"], expected_gold)
        self.assertEqual(res["confidence_earned"], 12)
        self.assertEqual(res["message"], "Encomenda VIP entregue com sucesso à Câmara dos Mercadores!")

        # Confere alterações no estado da guilda
        self.assertEqual(self.controller.state.gold, 1000 + expected_gold)
        self.assertEqual(self.controller.state.contractor_confidence, 70 + 12)
        self.assertNotIn(item, self.controller.state.inventory)
        self.assertIsNone(self.controller.market_engine.active_vip_order)

    def test_fulfill_vip_order_higher_quality_is_accepted(self):
        """Ativo com qualidade superior à exigida no edital é homologado com louvor."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_02",
            "client_name": "Ordem dos Clérigos",
            "target_slot": "Ativo de Performance",
            "required_quality": "Normal",
            "reward_multiplier": 2.2,
            "confidence_reward": 10,
            "expires_round": 3,
        }
        # Item é 'Lendário' (superior a 'Normal')
        item = {
            "item_instance_id": "legendary_ring_01",
            "name": "Anel Sagrado dos Auditores",
            "slot_type": "Ativo de Performance",
            "quality": "Lendário",
            "power_bonus": 40,
            "market_value_base": 300,
        }
        self.controller.state.inventory.append(item)

        res = self.controller.fulfill_vip_order("legendary_ring_01")
        self.assertTrue(res["success"])
        self.assertEqual(res["gold_earned"], round(300 * 2.2))
        self.assertNotIn(item, self.controller.state.inventory)

    def test_fulfill_vip_order_inferior_quality_rejected_with_laudo(self):
        """Tentativa de entregar ativo com qualidade inferior é reprovada com laudo corporativo de não conformidade."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_03",
            "client_name": "Sindicato dos Mineiros",
            "target_slot": "Arsenal Ofensivo",
            "required_quality": "Ótimo",
            "reward_multiplier": 2.8,
            "confidence_reward": 14,
            "expires_round": 3,
        }
        # Item é 'Normal' (inferior a 'Ótimo')
        item = {
            "item_instance_id": "basic_axe_01",
            "name": "Machado de Desbaste Rústico",
            "slot_type": "Arsenal Ofensivo",
            "quality": "Normal",
            "power_bonus": 15,
            "market_value_base": 150,
        }
        self.controller.state.inventory.append(item)
        initial_gold = self.controller.state.gold
        initial_conf = self.controller.state.contractor_confidence

        res = self.controller.fulfill_vip_order("basic_axe_01")
        self.assertFalse(res["success"])
        self.assertIn("Laudo de conformidade técnica", res["message"])
        self.assertIn("inferior", res["message"])

        # Estado da guilda permanece inalterado
        self.assertEqual(self.controller.state.gold, initial_gold)
        self.assertEqual(self.controller.state.contractor_confidence, initial_conf)
        self.assertIn(item, self.controller.state.inventory)
        self.assertIsNotNone(self.controller.market_engine.active_vip_order)

    def test_fulfill_vip_order_wrong_slot_rejected_with_laudo(self):
        """Tentativa de entregar ativo com compartimento (slot) divergente é rejeitada com laudo corporativo."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_04",
            "client_name": "Consórcio Real de Seguros",
            "target_slot": "Provisão Logística",
            "required_quality": "Ótimo",
            "reward_multiplier": 2.4,
            "confidence_reward": 10,
            "expires_round": 3,
        }
        # Item é Blindagem Operacional, não Provisão Logística
        item = {
            "item_instance_id": "armor_for_consumable_01",
            "name": "Escudo Reforçado",
            "slot_type": "Blindagem Operacional",
            "quality": "Ótimo",
            "power_bonus": 20,
            "market_value_base": 180,
        }
        self.controller.state.inventory.append(item)

        res = self.controller.fulfill_vip_order("armor_for_consumable_01")
        self.assertFalse(res["success"])
        self.assertIn("Laudo de conformidade técnica", res["message"])
        self.assertIn("diverge", res["message"])
        self.assertIn(item, self.controller.state.inventory)
        self.assertIsNotNone(self.controller.market_engine.active_vip_order)

    def test_fulfill_vip_order_equipped_item_rejected(self):
        """Ativo equipado no loadout de expedição não pode ser entregue para a encomenda VIP."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_05",
            "client_name": "Inspetoria de Postura",
            "target_slot": "Alvará de Risco",
            "required_quality": "Normal",
            "reward_multiplier": 2.1,
            "confidence_reward": 8,
            "expires_round": 3,
        }
        item = {
            "item_instance_id": "rune_equipped_01",
            "name": "Runa de Proteção Polar",
            "slot_type": "Alvará de Risco",
            "quality": "Normal",
            "power_bonus": 12,
            "market_value_base": 100,
        }
        self.controller.state.inventory.append(item)
        self.controller.state.loadout["Alvará de Risco"] = "rune_equipped_01"

        res = self.controller.fulfill_vip_order("rune_equipped_01")
        self.assertFalse(res["success"])
        self.assertIn("Ativo em uso na expedição", res["message"])
        self.assertIn("Desequipe", res["message"])
        self.assertIn(item, self.controller.state.inventory)
        self.assertIsNotNone(self.controller.market_engine.active_vip_order)

    def test_confidence_capped_at_100(self):
        """Bônus de confiança não ultrapassa a barreira institucional de 100%."""
        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_cap",
            "client_name": "Grão-Duque",
            "target_slot": "Arsenal Ofensivo",
            "required_quality": "Normal",
            "reward_multiplier": 2.0,
            "confidence_reward": 20,
            "expires_round": 3,
        }
        item = {
            "item_instance_id": "sword_cap_01",
            "name": "Espada Cerimonial",
            "slot_type": "Arsenal Ofensivo",
            "quality": "Normal",
            "power_bonus": 10,
            "market_value_base": 100,
        }
        self.controller.state.inventory.append(item)
        self.controller.state.contractor_confidence = 92

        res = self.controller.fulfill_vip_order("sword_cap_01")
        self.assertTrue(res["success"])
        self.assertEqual(self.controller.state.contractor_confidence, 100)

    def test_fulfill_vip_order_without_active_order_or_missing_item(self):
        """Validações de segurança: recusa quando não há edital aberto ou ativo não existe no almoxarifado."""
        self.controller.market_engine.active_vip_order = None
        res_no_order = self.controller.fulfill_vip_order("item_inexistente")
        self.assertFalse(res_no_order["success"])
        self.assertIn("Nenhum edital de encomenda VIP ativo", res_no_order["message"])

        self.controller.market_engine.active_vip_order = {
            "id": "vip_order_dummy",
            "target_slot": "Arsenal Ofensivo",
            "required_quality": "Normal",
            "reward_multiplier": 2.0,
            "confidence_reward": 10,
        }
        res_missing = self.controller.fulfill_vip_order("id_fantasma")
        self.assertFalse(res_missing["success"])
        self.assertIn("Ativo não localizado no almoxarifado", res_missing["message"])


class TestServerVipOrderEndpoints(unittest.TestCase):
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
        req = Request(url, data=data, headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
        return urlopen(req, timeout=3)

    def test_http_fulfill_vip_order_endpoint_success_and_failure(self):
        """Endpoint HTTP POST /api/fulfill_vip_order processa entregas com sucesso e rejeições técnicas."""
        # 1. Setup no controller compartilhado do servidor
        server.controller.state.gold = 1000
        server.controller.state.contractor_confidence = 80
        server.controller.market_engine.active_vip_order = {
            "id": "vip_http_01",
            "client_name": "Câmara dos Mercadores",
            "target_slot": "Blindagem Operacional",
            "required_quality": "Normal",
            "reward_multiplier": 2.5,
            "confidence_reward": 15,
            "expires_round": 4,
        }
        valid_item = {
            "item_instance_id": "http_armor_01",
            "name": "Blindagem de Campanha",
            "slot_type": "Blindagem Operacional",
            "quality": "Normal",
            "power_bonus": 18,
            "market_value_base": 200,
        }
        server.controller.state.inventory = [valid_item]

        # 2. Rejeição via HTTP: tentativa com item inexistente
        resp_err = self._post('/api/fulfill_vip_order', {"item_instance_id": "non_existent_item"})
        self.assertEqual(resp_err.status, 200)
        data_err = json.loads(resp_err.read().decode('utf-8'))
        self.assertFalse(data_err.get("success"))
        self.assertIn("Ativo não localizado", data_err.get("message", ""))

        # 3. Sucesso via HTTP: entrega de item válido
        resp_ok = self._post('/api/fulfill_vip_order', {"item_instance_id": "http_armor_01"})
        self.assertEqual(resp_ok.status, 200)
        data_ok = json.loads(resp_ok.read().decode('utf-8'))
        self.assertTrue(data_ok.get("success"))
        self.assertEqual(data_ok.get("gold_earned"), 500)
        self.assertEqual(data_ok.get("confidence_earned"), 15)
        self.assertIn("Encomenda VIP entregue com sucesso", data_ok.get("message", ""))

        # Valida que o estado retornado pelo endpoint reflete as alterações
        state_in_resp = data_ok.get("state", {})
        self.assertEqual(state_in_resp.get("gold"), 1500)
        self.assertEqual(state_in_resp.get("contractor_confidence"), 95)
        self.assertIsNone(state_in_resp.get("market", {}).get("vip_order"))


if __name__ == '__main__':
    unittest.main()
