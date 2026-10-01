"""
Testes Unitários do Sistema de Eventos Corporativos Interativos (v0.5.0)
HeroFoot - Fantasy Corporate 7/10
"""

import unittest
import os
import random
import copy
import json
import re
import threading
from http.server import HTTPServer
from urllib.request import urlopen, Request

from game_state import GameState
from services.event_service import EventService
from controller import GameController
from server import HeroFootAPIHandler
import server


class TestCorporateEvents(unittest.TestCase):
    def setUp(self):
        self.state = GameState()
        self.state.gold = 1000
        self.state.contractor_confidence = 75
        self.state.team = [
            {"id": "hero_1", "name": "Geraldo da Contabilidade", "fatigue": 20, "status": "Apto"},
            {"id": "hero_2", "name": "Valéria da Auditoria", "fatigue": 30, "status": "Apto"},
        ]
        self.service = EventService(self.state)

    def test_load_events_from_seed(self):
        """Garante que todos os incidentes são carregados de data/events_seed.json sem hardcoding."""
        self.assertGreaterEqual(len(self.service.events), 10)
        first_event = self.service.events[0]
        self.assertIn("id", first_event)
        self.assertIn("title", first_event)
        self.assertIn("description", first_event)
        self.assertIn("options", first_event)
        self.assertGreater(len(first_event["options"]), 0)

    def test_roll_weekly_event_deterministic_rng(self):
        """Sorteio com RNG determinístico garante reprodutibilidade e elegibilidade por fase."""
        rng1 = random.Random(42)
        evt1 = self.service.roll_weekly_event("phase_1", rng=rng1)
        self.assertIsNotNone(evt1)
        self.assertIn(evt1["trigger_phase"], ["phase_1", "weekly_start"])
        self.assertEqual(self.state.active_event["id"], evt1["id"])

        # Teste com outro GameState e mesmo seed resulta no mesmo evento
        state2 = GameState()
        service2 = EventService(state2)
        rng2 = random.Random(42)
        evt2 = service2.roll_weekly_event("phase_1", rng=rng2)
        self.assertEqual(evt1["id"], evt2["id"])

    def test_roll_weekly_event_avoids_recent_duplicates(self):
        """Não repete eventos já resolvidos se houver outros disponíveis na temporada."""
        eligible_count = len([
            e for e in self.service.events
            if e.get("trigger_phase") in ("phase_1", "weekly_start")
        ])
        self.assertGreater(eligible_count, 1)

        rng = random.Random(101)
        evt1 = self.service.roll_weekly_event("phase_1", rng=rng)
        self.state.resolved_events_history.append(evt1["id"])

        # Novo sorteio deve evitar evt1 enquanto houver outros
        for _ in range(10):
            evt2 = self.service.roll_weekly_event("phase_1", rng=rng)
            self.assertNotEqual(evt2["id"], evt1["id"])

    def test_roll_weekly_event_fallback_when_all_resolved(self):
        """Se todos os eventos da fase já foram resolvidos, faz fallback gracioso para todos os elegíveis."""
        eligible = [
            e for e in self.service.events
            if e.get("trigger_phase") in ("phase_1", "weekly_start")
        ]
        self.state.resolved_events_history = [e["id"] for e in eligible]
        evt = self.service.roll_weekly_event("phase_1", rng=random.Random(7))
        self.assertIsNotNone(evt)
        self.assertIn(evt["id"], [e["id"] for e in eligible])

    def test_resolve_event_choice_effects(self):
        """Aplica com precisão os impactos de ouro, fadiga, confiança e suprimentos."""
        mock_event = {
            "id": "evt_test_audit",
            "title": "Auditoria de Teste",
            "description": "Dilema contábil de teste.",
            "category": "fiscal",
            "trigger_phase": "phase_1",
            "options": [
                {
                    "id": "opt_pay_fine",
                    "label": "Liquidar Multa",
                    "description": "Pagamento de taxa de regularização.",
                    "consequence_narrative": "Laudo deferido mediante recolhimento de emolumentos.",
                    "effects": {
                        "gold": -250,
                        "fatigue_all": 15,
                        "supplies_bonus": 10,
                        "morale": -8,
                    },
                }
            ],
        }
        self.state.active_event = mock_event
        self.state.gold = 1000
        self.state.contractor_confidence = 75
        self.state.team[0]["fatigue"] = 20
        self.state.team[1]["fatigue"] = 40

        res = self.service.resolve_event_choice("evt_test_audit", "opt_pay_fine")
        self.assertTrue(res["success"])
        self.assertEqual(res["consequence"], "Laudo deferido mediante recolhimento de emolumentos.")
        self.assertEqual(res["effects_applied"]["gold"], -250)

        # Validação dos impactos no GameState
        self.assertEqual(self.state.gold, 750)
        self.assertEqual(self.state.team[0]["fatigue"], 35)
        self.assertEqual(self.state.team[1]["fatigue"], 55)
        self.assertEqual(self.state.contractor_confidence, 67)
        self.assertEqual(self.state.supplies_bonus, 10)

        # Validação do ciclo do evento
        self.assertIsNone(self.state.active_event)
        self.assertIn("evt_test_audit", self.state.resolved_events_history)

    def test_resolve_event_fatigue_and_morale_clamping(self):
        """Fadiga e confiança da contratante devem ser estritamente limitadas entre 0 e 100."""
        mock_event = {
            "id": "evt_clamping_test",
            "title": "Inspeção de Extremos",
            "description": "Teste de limites operacionais.",
            "category": "operations",
            "trigger_phase": "phase_1",
            "options": [
                {
                    "id": "opt_extreme_positive",
                    "label": "Bonificação Plena",
                    "description": "Alívio extremo de fadiga e moral máximo.",
                    "consequence_narrative": "Parecer com louvor.",
                    "effects": {
                        "gold": 500,
                        "fatigue_all": -80,
                        "morale": 50,
                    },
                },
                {
                    "id": "opt_extreme_negative",
                    "label": "Penalidade Máxima",
                    "description": "Sobrecarga extrema e colapso de moral.",
                    "consequence_narrative": "Parecer desastroso.",
                    "effects": {
                        "gold": -2000,
                        "fatigue_all": 120,
                        "morale": -95,
                    },
                },
            ],
        }

        # 1. Alívio extremo: fadiga não cai abaixo de 0, confiança não supera 100
        self.state.active_event = copy.deepcopy(mock_event)
        self.state.contractor_confidence = 80
        self.state.team[0]["fatigue"] = 25
        res = self.service.resolve_event_choice("evt_clamping_test", "opt_extreme_positive")
        self.assertTrue(res["success"])
        self.assertEqual(self.state.team[0]["fatigue"], 0)
        self.assertEqual(self.state.contractor_confidence, 100)

        # 2. Sobrecarga extrema: fadiga não passa de 100, confiança não cai abaixo de 0
        self.state.active_event = copy.deepcopy(mock_event)
        self.state.contractor_confidence = 20
        self.state.team[0]["fatigue"] = 90
        res2 = self.service.resolve_event_choice("evt_clamping_test", "opt_extreme_negative")
        self.assertTrue(res2["success"])
        self.assertEqual(self.state.team[0]["fatigue"], 100)
        self.assertEqual(self.state.contractor_confidence, 0)

    def test_resolve_errors_return_corporate_messages(self):
        """Erros de resolução sem evento ativo, ID divergente ou opção inexistente retornam mensagem formal."""
        # Caso 1: Nenhum evento ativo
        self.state.active_event = None
        res1 = self.service.resolve_event_choice("evt_qualquer", "opt_qualquer")
        self.assertFalse(res1["success"])
        self.assertIn("Nenhum incidente corporativo ativo", res1["message"])

        # Caso 2: Event ID incompatível
        self.state.active_event = {
            "id": "evt_real",
            "title": "Incidente Real",
            "description": "Desc",
            "options": [{"id": "opt_1", "label": "Opção 1", "consequence_narrative": "Ok", "effects": {}}],
        }
        res2 = self.service.resolve_event_choice("evt_falso", "opt_1")
        self.assertFalse(res2["success"])
        self.assertIn("Discrepância protocolar", res2["message"])

        # Caso 3: Opção inexistente
        res3 = self.service.resolve_event_choice("evt_real", "opt_inexistente")
        self.assertFalse(res3["success"])
        self.assertIn("Deliberação administrativa inválida", res3["message"])

        # Em caso de erro, o evento ativo não é apagado
        self.assertIsNotNone(self.state.active_event)

    def test_forbidden_terms_absent(self):
        """Verifica estritamente que nenhum termo esportivo proibido existe no serviço de eventos."""
        forbidden_regex = re.compile(
            r'\b(gol|gols|gramado|gramados|estádio|estádios|escanteio|escanteios|bilheteria|bilheterias|brasfoot)\b',
            re.IGNORECASE
        )
        path = "services/event_service.py"
        if not os.path.exists(path):
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "services", "event_service.py")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        matches = forbidden_regex.findall(content)
        self.assertEqual(matches, [], f"Termos proibidos detectados em services/event_service.py: {matches}")

    def test_controller_delegation(self):
        """GameController expõe e delega os métodos de eventos corretamente."""
        controller = GameController()
        evt = controller.roll_weekly_event("phase_1", rng=random.Random(1337))
        self.assertIsNotNone(evt)
        self.assertEqual(controller.get_active_event()["id"], evt["id"])

        opt_id = evt["options"][0]["id"]
        res = controller.resolve_event_choice(evt["id"], opt_id)
        self.assertTrue(res["success"])
        self.assertIsNone(controller.get_active_event())

    def test_advance_phase_weekly_transition_rolls_event(self):
        """Na transição de Fase 5 para Fase 1, advance_phase sorteia evento corporativo."""
        controller = GameController()
        controller.state.current_phase = 5
        # Com um rng que retorne roll < chance, o evento deve ser sorteado
        class FixedRNG:
            def random(self):
                return 0.1  # menor que 0.5 (garante trigger)
            def choice(self, seq):
                return seq[0]

        res = controller.advance_phase(rng=FixedRNG())
        self.assertEqual(res["current_phase"], 1)
        self.assertIsNotNone(controller.state.active_event)
        self.assertIn("active_event", res)


class TestServerEventEndpoints(unittest.TestCase):
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

    def _get(self, path: str):
        url = f"http://127.0.0.1:{self.port}{path}"
        req = Request(url, method='GET')
        return urlopen(req, timeout=3)

    def _post(self, path: str, payload: dict):
        url = f"http://127.0.0.1:{self.port}{path}"
        data = json.dumps(payload).encode('utf-8')
        req = Request(url, data=data, headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
        return urlopen(req, timeout=3)

    def test_http_get_active_event_and_resolve(self):
        """Endpoint GET /api/events/active e POST /api/events/resolve funcionam via HTTP."""
        # 1. Sem evento ativo inicialmente
        server.controller.state.active_event = None
        resp = self._get('/api/events/active')
        self.assertEqual(resp.status, 200)
        data = json.loads(resp.read().decode('utf-8'))
        self.assertIsNone(data.get("active_event"))

        # 2. Sorteia evento no controller e confere no GET
        server.controller.roll_weekly_event("phase_1", rng=random.Random(42))
        active = server.controller.state.active_event
        self.assertIsNotNone(active)

        resp2 = self._get('/api/events/active')
        self.assertEqual(resp2.status, 200)
        data2 = json.loads(resp2.read().decode('utf-8'))
        self.assertEqual(data2["active_event"]["id"], active["id"])

        # 3. Resolve evento via POST /api/events/resolve
        opt_id = active["options"][0]["id"]
        payload = {"event_id": active["id"], "option_id": opt_id}
        resp3 = self._post('/api/events/resolve', payload)
        self.assertEqual(resp3.status, 200)
        res_data = json.loads(resp3.read().decode('utf-8'))
        self.assertTrue(res_data.get("success"))
        self.assertIn("consequence", res_data)
        self.assertIn("effects_applied", res_data)
        self.assertIsNone(server.controller.state.active_event)


if __name__ == '__main__':
    unittest.main()
