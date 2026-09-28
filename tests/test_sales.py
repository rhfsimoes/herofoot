"""
Unit tests for HeroFoot Sales Engine, SalesService, and Market Bulletin (Task P1.4).
"""

import random
import unittest
from controller import GameController
from counter_sales import CounterSales
from market_engine import MarketEngine
from balance import get_balance
from constants import SLOTS


class TestSales(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        # Clean state for isolated tests
        self.controller.market_engine.bulletin = None
        self.controller.state.inventory = []
        self.controller.state.pending_offers = {}
        self.controller.state.gold = 1000

    def test_promocao_and_preco_justo_always_sell(self):
        """Promoção (0.8) e Preço Justo (1.0) sempre vendem (<= tolerância mínima de 1.0)."""
        cs = CounterSales()
        rng = random.Random(12345)

        for _ in range(500):
            res_promo = cs.list_item_for_sale(
                item_name="Espada Promoção",
                reference_price=100,
                margin_type="Promoção",
                rng=rng
            )
            self.assertEqual(res_promo["status"], "vendido")
            self.assertEqual(res_promo["asked_price"], 80)
            self.assertIsNone(res_promo["counter_offer"])

            res_justo = cs.list_item_for_sale(
                item_name="Espada Preço Justo",
                reference_price=100,
                margin_type="Preço Justo",
                rng=rng
            )
            self.assertEqual(res_justo["status"], "vendido")
            self.assertEqual(res_justo["asked_price"], 100)
            self.assertIsNone(res_justo["counter_offer"])

    def test_preco_abusivo_distribution_10000_trials(self):
        """Preço Abusivo em 10.000 anúncios resulta em ~30% vende, ~30% contraproposta, ~40% não vende (±3%)."""
        cs = CounterSales()
        rng = random.Random(42)
        total_trials = 10000

        counts = {"vendido": 0, "contraproposta": 0, "não vendido": 0}

        for _ in range(total_trials):
            res = cs.list_item_for_sale(
                item_name="Item Teste",
                reference_price=100,
                margin_type="Preço Abusivo",
                rng=rng
            )
            counts[res["status"]] += 1

        pct_vendido = counts["vendido"] / total_trials
        pct_contra = counts["contraproposta"] / total_trials
        pct_nao = counts["não vendido"] / total_trials

        self.assertAlmostEqual(pct_vendido, 0.30, delta=0.03,
                               msg=f"Vendido fora da margem de 30% ± 3%: {pct_vendido:.4f}")
        self.assertAlmostEqual(pct_contra, 0.30, delta=0.03,
                               msg=f"Contraproposta fora da margem de 30% ± 3%: {pct_contra:.4f}")
        self.assertAlmostEqual(pct_nao, 0.40, delta=0.03,
                               msg=f"Não vendido fora da margem de 40% ± 3%: {pct_nao:.4f}")

    def test_client_forged_base_price_ignored(self):
        """base_price forjado enviado pelo cliente é ignorado; usa estritamente market_value_base."""
        item = {
            "item_instance_id": "item_legit_01",
            "name": "Armadura de Ferro",
            "slot_type": "Armadura",
            "quality": "Normal",
            "power_bonus": 15,
            "market_value_base": 200,
        }
        self.controller.state.inventory.append(item)

        # Cliente tenta forjar preço para 999.999
        res = self.controller.list_item_for_sale(
            "item_legit_01",
            base_price=999999,
            margin_type="Preço Justo"
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["reference_price"], 200)
        self.assertEqual(res["asked_price"], 200)
        self.assertEqual(res["gold_received"], 200)
        self.assertEqual(self.controller.state.gold, 1200)

    def test_equipped_item_cannot_be_sold(self):
        """Item equipado na expedição não pode ser anunciado para venda."""
        item = {
            "item_instance_id": "equipped_item_01",
            "name": "Espada em Uso",
            "slot_type": "Arma",
            "quality": "Normal",
            "power_bonus": 20,
            "market_value_base": 150,
        }
        self.controller.state.inventory.append(item)
        self.controller.state.loadout["Arma"] = item

        initial_gold = self.controller.state.gold
        res = self.controller.list_item_for_sale("equipped_item_01", margin_type="Preço Justo")

        self.assertFalse(res["success"])
        self.assertIn("em uso", res["message"].lower())
        self.assertEqual(self.controller.state.gold, initial_gold)
        self.assertIn(item, self.controller.state.inventory)
        self.assertEqual(len(self.controller.state.pending_offers), 0)

    def test_bulletin_multiplier_triples_gold(self):
        """Com Boletim x3.0 para o slot correspondente, o valor recebido triplica."""
        self.controller.market_engine.bulletin = {
            "target": "Arma",
            "multiplier": 3.0,
            "headline": "Ruptura de fornecimento eleva a demanda por Armas junto à Câmara dos Mercadores."
        }

        arma = {
            "item_instance_id": "arma_01",
            "name": "Gládio Vitorioso",
            "slot_type": "Arma",
            "quality": "Normal",
            "power_bonus": 15,
            "market_value_base": 100,
        }
        armadura = {
            "item_instance_id": "armadura_01",
            "name": "Gibão de Couro",
            "slot_type": "Armadura",
            "quality": "Normal",
            "power_bonus": 15,
            "market_value_base": 100,
        }
        self.controller.state.inventory.extend([arma, armadura])

        # Venda da Arma (slot coincide com o Boletim): ouro triplica
        res_arma = self.controller.list_item_for_sale("arma_01", margin_type="Preço Justo")
        self.assertTrue(res_arma["success"])
        self.assertEqual(res_arma["demand_multiplier"], 3.0)
        self.assertEqual(res_arma["asked_price"], 300)
        self.assertEqual(res_arma["gold_received"], 300)

        # Venda da Armadura (slot NÃO coincide): multiplicador 1.0 padrão
        res_armadura = self.controller.list_item_for_sale("armadura_01", margin_type="Preço Justo")
        self.assertTrue(res_armadura["success"])
        self.assertEqual(res_armadura["demand_multiplier"], 1.0)
        self.assertEqual(res_armadura["asked_price"], 100)
        self.assertEqual(res_armadura["gold_received"], 100)

    def test_reject_counter_offer_returns_item_without_duplication(self):
        """Rejeitar contraproposta devolve o item sem duplicar; rejeitar novamente oferta já resolvida falha."""
        item = {
            "item_instance_id": "item_counter_01",
            "name": "Anel Valioso",
            "slot_type": "Joia",
            "quality": "Ótimo",
            "power_bonus": 12,
            "market_value_base": 200,
        }
        self.controller.state.inventory.append(item)

        # Deterministicamente induz contraproposta (taxa 1.35, tolerância 1.25)
        # 1.35 > 1.25 mas 1.35 <= 1.25 + 0.15 = 1.40 -> status 'contraproposta'
        class DeterministicRNG:
            def uniform(self, a, b):
                return 1.25

        res = self.controller.list_item_for_sale(
            "item_counter_01",
            margin_type="Preço Abusivo",
            rng=DeterministicRNG()
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "contraproposta")
        offer_id = res["offer_id"]

        # Item foi removido temporariamente do inventário
        self.assertNotIn(item, self.controller.state.inventory)
        self.assertIn(offer_id, self.controller.state.pending_offers)

        # Rejeitar proposta
        reject_res = self.controller.resolve_counter_offer(offer_id, accept=False)
        self.assertTrue(reject_res["success"])
        self.assertFalse(reject_res["accepted"])

        # Item voltou exatamente 1 vez
        matching_items = [i for i in self.controller.state.inventory if i["item_instance_id"] == "item_counter_01"]
        self.assertEqual(len(matching_items), 1)
        self.assertNotIn(offer_id, self.controller.state.pending_offers)

        # Rejeitar novamente deve falhar
        second_reject = self.controller.resolve_counter_offer(offer_id, accept=False)
        self.assertFalse(second_reject["success"])

        # Item NÃO deve ter sido duplicado no almoxarifado
        matching_items_after = [i for i in self.controller.state.inventory if i["item_instance_id"] == "item_counter_01"]
        self.assertEqual(len(matching_items_after), 1)

    def test_accept_counter_offer_credits_gold(self):
        """Aceitar contraproposta credita o valor e encerra a oferta."""
        item = {
            "item_instance_id": "item_counter_02",
            "name": "Amuleto Antigo",
            "slot_type": "Joia",
            "quality": "Normal",
            "power_bonus": 10,
            "market_value_base": 100,
        }
        self.controller.state.inventory.append(item)

        class DeterministicRNG:
            def uniform(self, a, b):
                return 1.25

        res = self.controller.list_item_for_sale(
            "item_counter_02",
            margin_type="Preço Abusivo",
            rng=DeterministicRNG()
        )
        offer_id = res["offer_id"]
        counter_offer_val = res["counter_offer"]  # round(100 * 1.0 * 1.25) = 125

        initial_gold = self.controller.state.gold
        accept_res = self.controller.resolve_counter_offer(offer_id, accept=True)

        self.assertTrue(accept_res["success"])
        self.assertTrue(accept_res["accepted"])
        self.assertEqual(self.controller.state.gold, initial_gold + counter_offer_val)
        self.assertNotIn(item, self.controller.state.inventory)

        # Tentar aceitar de novo falha
        again_res = self.controller.resolve_counter_offer(offer_id, accept=True)
        self.assertFalse(again_res["success"])

    def test_hidden_tolerance_never_exposed(self):
        """A resposta de anúncio NUNCA deve expor a tolerância oculta do comprador."""
        item = {
            "item_instance_id": "item_leak_check",
            "name": "Inscrição Rúnica",
            "slot_type": "Inscrição",
            "quality": "Normal",
            "power_bonus": 10,
            "market_value_base": 100,
        }
        self.controller.state.inventory.append(item)

        res = self.controller.list_item_for_sale("item_leak_check", margin_type="Preço Justo")
        self.assertNotIn("tolerance", res)
        self.assertNotIn("buyer_tolerance", res)
        self.assertNotIn("tolerancia", res)

        self.assertIn("reference_price", res)
        self.assertIn("asked_price", res)
        self.assertIn("demand_multiplier", res)

    def test_market_engine_bulletin_generation(self):
        """market_engine.refresh_market gera boletim válido conforme sementes e chances."""
        me = MarketEngine()

        class AlwaysBulletinRNG:
            def random(self):
                return 0.1  # < bulletin_chance
            def choice(self, seq):
                return seq[0]
            def uniform(self, a, b):
                return 2.5
            def sample(self, seq, k):
                return list(seq)[:k]
            def randint(self, a, b):
                return a

        me.refresh_market(round_number=1, rng=AlwaysBulletinRNG())
        self.assertIsNotNone(me.bulletin)
        self.assertIn(me.bulletin["target"], SLOTS)
        self.assertEqual(me.bulletin["multiplier"], 2.5)
        self.assertIsInstance(me.bulletin["headline"], str)
        self.assertGreater(len(me.bulletin["headline"]), 10)

        # Teste quando o sorteio não atinge a chance
        class NeverBulletinRNG:
            def random(self):
                return 0.99  # >= bulletin_chance
            def choice(self, seq):
                return seq[0]
            def uniform(self, a, b):
                return 1.5
            def sample(self, seq, k):
                return list(seq)[:k]
            def randint(self, a, b):
                return a

        me.refresh_market(round_number=2, rng=NeverBulletinRNG())
        self.assertIsNone(me.bulletin)

    def test_state_market_bulletin_structure(self):
        """get_state()['market']['bulletin'] expõe o boletim ou None conforme a rodada."""
        self.controller.market_engine.bulletin = {
            "target": "Armadura",
            "multiplier": 2.0,
            "headline": "Edital de suprimentos extraordinários abre concorrência urgente para lotes de Armaduras."
        }
        state = self.controller.get_state()
        self.assertIn("market", state)
        self.assertIn("bulletin", state["market"])
        self.assertEqual(state["market"]["bulletin"]["target"], "Armadura")
        self.assertEqual(state["market"]["bulletin"]["multiplier"], 2.0)


if __name__ == '__main__':
    unittest.main()
