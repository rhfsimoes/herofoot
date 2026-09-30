"""
Testes Unitários do Módulo B2B & Linha de Montagem Modular (v0.7.0).
Valida contratos de fornecimento, exclusividade corporativa, ágio spot de 50%,
montagem modular, tinkering entre marcas rivais, linha de montagem autônoma e DRE.
"""

import unittest
import random
import json
import threading
from http.server import HTTPServer
from urllib.request import Request, urlopen

from controller import GameController
from server import HeroFootAPIHandler
from b2b import (
    get_corporations,
    get_corporations_dict,
    get_parts_dict,
    get_b2b_contracts_dict,
    get_assembly_workers_dict,
    get_b2b_balance,
)

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class MockRNG:
    def __init__(self, val=0.5):
        self._val = val

    def random(self):
        return self._val

    def choice(self, seq):
        return seq[0]


class TestB2BAssembly(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.state.gold = 5000
        self.state.warehouse_parts = {}
        self.state.active_b2b_contracts = []
        self.state.corporate_exclusivity_tags = []
        self.state.assembly_line_workers = []

    def test_b2b_contract_signing_and_phase1_delivery(self):
        """Valida celebração de contrato B2B e remessa semanal automática na Fase 1."""
        res = self.controller.sign_b2b_contract("b2b_aethelgard_bronze")
        self.assertTrue(res["success"], res.get("message"))
        self.assertTrue(self.state.has_active_contract("b2b_aethelgard_bronze"))
        self.assertEqual(len(self.state.active_b2b_contracts), 1)

        # Não permite celebrar o mesmo contrato duas vezes
        dup_res = self.controller.sign_b2b_contract("b2b_aethelgard_bronze")
        self.assertFalse(dup_res["success"])

        # Executa entrega semanal de remessas
        delivered = self.controller.phase_service.deliver_b2b_shipments()
        self.assertGreater(len(delivered), 0)

        # Contrato Bronze entrega 1x lâmina e 1x empunhadura
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 1)
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_hilt"), 1)

        # Rescisão administrativa do contrato
        cancel_res = self.controller.cancel_b2b_contract("b2b_aethelgard_bronze")
        self.assertTrue(cancel_res["success"])
        self.assertFalse(self.state.has_active_contract("b2b_aethelgard_bronze"))

    def test_exclusive_contract_blocks_rival_brand(self):
        """Contrato exclusivo Ouro com Aethelgard impede convênios com o rival Consórcio Valkyria."""
        res_aethelgard = self.controller.sign_b2b_contract("b2b_aethelgard_gold")
        self.assertTrue(res_aethelgard["success"])
        self.assertTrue(self.state.has_exclusivity_tag("excl_aethelgard"))

        # Tentativa de celebrar contrato com o Consórcio Valkyria (rival direto)
        res_valkyria = self.controller.sign_b2b_contract("b2b_valkyria_gold")
        self.assertFalse(res_valkyria["success"])
        self.assertIn("exclusividade", res_valkyria["message"].lower())
        self.assertFalse(self.state.has_active_contract("b2b_valkyria_gold"))

    def test_spot_purchase_without_contract_charges_50_pct_markup(self):
        """Compra spot sem contrato ativo cobra ágio alfandegário de +50% (spot_markup: 1.50)."""
        # Base cost da lâmina Aethelgard: 50
        spot_price_no_contract = self.controller.calculate_part_spot_price("part_aethelgard_blade")
        self.assertEqual(spot_price_no_contract, int(50 * 1.50))  # 75

        init_gold = self.state.gold
        buy_res = self.controller.buy_part("part_aethelgard_blade", quantity=2)
        self.assertTrue(buy_res["success"])
        self.assertEqual(buy_res["unit_price"], 75)
        self.assertEqual(buy_res["total_cost"], 150)
        self.assertEqual(self.state.gold, init_gold - 150)
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 2)

        # Celebra convênio Bronze Aethelgard (desconto de 10%)
        self.controller.sign_b2b_contract("b2b_aethelgard_bronze")
        spot_price_with_contract = self.controller.calculate_part_spot_price("part_aethelgard_blade")
        self.assertEqual(spot_price_with_contract, int(50 * 0.90))  # 45

        buy_contract_res = self.controller.buy_part("part_aethelgard_blade", quantity=1)
        self.assertTrue(buy_contract_res["success"])
        self.assertEqual(buy_contract_res["unit_price"], 45)
        self.assertEqual(buy_contract_res["total_cost"], 45)
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 3)

    def test_modular_parts_assembly_same_brand_success(self):
        """Montagem modular com peças da mesma marca opera sem necessidade de Tinkering."""
        self.state.add_warehouse_part("part_aethelgard_blade", 1)
        self.state.add_warehouse_part("part_aethelgard_hilt", 1)

        res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_aethelgard_hilt"],
            base_name="Montante Padronizado",
            is_tinkering=False,
        )
        self.assertTrue(res["success"], res.get("message"))
        self.assertFalse(res["tinkering"])
        self.assertIn("item", res)
        item = res["item"]
        self.assertEqual(item["name"], "Montante Padronizado")
        self.assertTrue(item.get("is_modular"))
        self.assertFalse(item.get("overclock"))

        # Peças foram consumidas do almoxarifado
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 0)
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_hilt"), 0)
        self.assertIn(item, self.state.inventory)

    def test_inter_brand_assembly_without_tinkering_flag_rejected(self):
        """Montagem modular misturando marcas sem autorização de Tinkering é bloqueada."""
        self.state.add_warehouse_part("part_aethelgard_blade", 1)  # Aethelgard
        self.state.add_warehouse_part("part_valkyria_guard", 1)    # Valkyria

        res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_valkyria_guard"],
            base_name="Híbrido Bélico",
            is_tinkering=False,
        )
        self.assertFalse(res["success"])
        self.assertTrue(res.get("tinkering_required"))
        # Peças permanecem intactas no almoxarifado
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 1)
        self.assertEqual(self.state.get_part_quantity("part_valkyria_guard"), 1)

    def test_inter_brand_assembly_tinkering_failure_produces_gororoba(self):
        """Tinkering entre marcas com falha no RNG gera Gororoba Experimental e consome peças."""
        self.state.add_warehouse_part("part_aethelgard_blade", 1)
        self.state.add_warehouse_part("part_valkyria_guard", 1)

        # RNG retornando 0.99 (chance é 0.60, logo 0.99 é falha)
        mock_rng = MockRNG(0.99)
        res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_valkyria_guard"],
            base_name="Híbrido Bélico",
            is_tinkering=True,
            rng=mock_rng,
        )
        self.assertTrue(res["success"])
        self.assertTrue(res["tinkering"])
        self.assertFalse(res["tinkering_success"])
        item = res["item"]
        self.assertEqual(item["name"], "Gororoba Experimental")
        self.assertEqual(item["quality"], "Fraco")
        self.assertEqual(item["market_value_base"], 20)

        # Peças consumidas e refugo integrado ao inventário
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 0)
        self.assertEqual(self.state.get_part_quantity("part_valkyria_guard"), 0)
        self.assertIn(item, self.state.inventory)

    def test_inter_brand_assembly_tinkering_success_overclock(self):
        """Tinkering entre marcas com sucesso no RNG concede overclock de +15% de poder."""
        self.state.add_warehouse_part("part_aethelgard_blade", 1)  # power: 25
        self.state.add_warehouse_part("part_valkyria_guard", 1)    # power: 15

        # RNG retornando 0.10 (sucesso)
        mock_rng = MockRNG(0.10)
        res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_valkyria_guard"],
            base_name="Gládio Híbrido Estriado",
            is_tinkering=True,
            rng=mock_rng,
        )
        self.assertTrue(res["success"])
        self.assertTrue(res["tinkering"])
        self.assertTrue(res["tinkering_success"])
        self.assertTrue(res["overclock"])

        item = res["item"]
        self.assertTrue(item["overclock"])
        # Base power: 25 + 15 = 40. Com overclock +15%: int(40 * 1.15) = 46.
        self.assertEqual(item["power_bonus"], 46)

    def test_reject_duplicate_parts_in_assembly(self):
        """Montagem rejeita expressamente o uso de peças duplicadas ou cópias da mesma peça."""
        self.state.add_warehouse_part("part_aethelgard_blade", 3)
        res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_aethelgard_blade", "part_aethelgard_blade"],
            base_name="Espada Ilegal",
            is_tinkering=False,
        )
        self.assertFalse(res["success"])
        self.assertIn("duplicadas", res["message"].lower())
        # Peças permanecem no almoxarifado
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 3)

    def test_three_slots_functional_roles_assembly(self):
        """Montagem de 3 componentes requer exatamente 1 prefixo, 1 base e 1 sufixo."""
        # 3 peças sem prefixo (2 bases e 1 sufixo)
        self.state.add_warehouse_part("part_aethelgard_blade", 1)  # base
        self.state.add_warehouse_part("part_valkyria_plate", 1)    # base
        self.state.add_warehouse_part("part_chancellor_core", 1)   # suffix
        invalid_res = self.controller.assemble_modular_item(
            ["part_aethelgard_blade", "part_valkyria_plate", "part_chancellor_core"],
            is_tinkering=True,
        )
        self.assertFalse(invalid_res["success"])
        self.assertIn("requer exatamente 1 modificador", invalid_res["message"].lower())

        # Agora com o trio perfeito: hilt (prefixo) + blade (base) + core (sufixo)
        self.state.add_warehouse_part("part_aethelgard_hilt", 1)  # prefix (Equilibrada)
        valid_res = self.controller.assemble_modular_item(
            ["part_aethelgard_hilt", "part_aethelgard_blade", "part_chancellor_core"],
            is_tinkering=True,
            rng=MockRNG(0.10),
        )
        self.assertTrue(valid_res["success"], valid_res.get("message"))
        item = valid_res["item"]
        self.assertIn("Equilibrada", item["name"])
        self.assertIn("Lâmina Forjada", item["name"])
        """Operários montam produtos White-label autonomamente e consolidam no DRE contábil."""
        # 1. Contrata operário júnior para a Ferragem
        hire_res = self.controller.hire_assembly_worker("worker_fitter_junior", "Ferragem")
        self.assertTrue(hire_res["success"], hire_res.get("message"))
        worker = hire_res["worker"]
        self.assertEqual(worker["assigned_branch"], "Ferragem")

        # 2. Atribui ordem de produção para Gládio de Ferro (rec_01)
        order_res = self.controller.set_worker_order(worker["worker_instance_id"], "rec_01")
        self.assertTrue(order_res["success"], order_res.get("message"))

        # 3. Fornece peças no almoxarifado (2 peças necessárias por ciclo)
        self.state.add_warehouse_part("part_aethelgard_blade", 2)

        # 4. Ativa contrato B2B com royalties (Bronze: 50/sem)
        self.controller.sign_b2b_contract("b2b_aethelgard_bronze")

        # 5. Executa fechamento contábil e apuração financeira da Fase 5
        init_gold = self.state.gold
        dre_res = self.controller.phase_service.process_phase_5_settlement()
        stmt = dre_res["last_financial_statement"]

        # Validações DRE
        self.assertIn("assembly_sales_revenue", stmt)
        self.assertIn("b2b_royalties_cost", stmt)
        self.assertIn("assembly_workers_salaries", stmt)

        self.assertEqual(stmt["b2b_royalties_cost"], 50)
        self.assertEqual(stmt["assembly_workers_salaries"], 40)
        self.assertGreater(stmt["assembly_sales_revenue"], 0)

        # As 2 peças foram consumidas na montagem contínua
        self.assertEqual(self.state.get_part_quantity("part_aethelgard_blade"), 0)

        # XP da filial de Ferragem creditada na bancada fabril (10% rate)
        self.assertGreater(self.state.get_workshop_xp("Ferragem"), 0)

        # Cálculo do resultado líquido (net) confere perfeitamente
        expected_net = (
            stmt["revenue"]
            + stmt["sales_revenue"]
            + stmt["assembly_sales_revenue"]
            + stmt["season_award"]
            + stmt["crown_subsidy"]
            - stmt["crown_penalty"]
            - stmt["salaries"]
            - stmt["total_maintenance"]
            - stmt["b2b_royalties_cost"]
            - stmt["assembly_workers_salaries"]
        )
        self.assertEqual(stmt["net"], expected_net)
        self.assertEqual(self.state.gold, init_gold + expected_net)

    def test_forbidden_terms_compliance(self):
        """Verifica se nenhum termo esportivo proibido vaza nas descrições de corporações, peças e operários."""
        corps = get_corporations()
        for c in corps:
            text = f"{c.get('name')} {c.get('specialty')} {c.get('description')}".lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, text, f"Termo proibido '{term}' encontrado na corporação {c.get('id')}")

        parts = get_parts_dict()
        for pid, p in parts.items():
            text = f"{p.get('name')} {p.get('description')}".lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, text, f"Termo proibido '{term}' encontrado na peça {pid}")

        workers = get_assembly_workers_dict()
        for wid, w in workers.items():
            text = f"{w.get('name')} {w.get('description')}".lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, text, f"Termo proibido '{term}' encontrado no operário {wid}")

    def test_b2b_api_endpoints_via_http(self):
        """Valida que os novos endpoints REST de B2B e montagem respondem corretamente via HTTP."""
        test_port = 8089
        server = HTTPServer(('127.0.0.1', test_port), HeroFootAPIHandler)
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        base_url = f"http://127.0.0.1:{test_port}"
        try:
            # 1. POST /api/market/buy_part
            req_data = json.dumps({"part_id": "part_aethelgard_blade", "quantity": 1}).encode("utf-8")
            req = Request(f"{base_url}/api/market/buy_part", data=req_data, headers={"Content-Type": "application/json"})
            with urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(data.get("success"))
                self.assertIn("warehouse_parts", data.get("state", {}))

            # 2. POST /api/b2b/sign_contract
            req_data = json.dumps({"contract_id": "b2b_aethelgard_bronze"}).encode("utf-8")
            req = Request(f"{base_url}/api/b2b/sign_contract", data=req_data, headers={"Content-Type": "application/json"})
            with urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(data.get("success"))

            # 3. POST /api/b2b/hire_worker
            req_data = json.dumps({"worker_id": "worker_fitter_junior", "assigned_branch": "Ferragem"}).encode("utf-8")
            req = Request(f"{base_url}/api/b2b/hire_worker", data=req_data, headers={"Content-Type": "application/json"})
            with urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(data.get("success"))

        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main()
