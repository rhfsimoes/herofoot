"""
HeroFoot Testes Unitários de Salvamento e Arquivamento Corporativo (P1.1).
Valida round-trip, integridade de seeds, ausência de save bloat, resiliência a arquivos corrompidos,
cobertura de atributos de GameState e endpoints HTTP da API de persistência.
"""

import os
import json
import hashlib
import tempfile
import unittest
import threading
from http.server import HTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from game_state import GameState, SERIALIZED_FIELDS, TRANSIENT_FIELDS
from league_engine import LeagueEngine
from market_engine import MarketEngine
from controller import GameController
import save_system
from server import HeroFootAPIHandler


class TestSaveCoverageAndState(unittest.TestCase):
    def test_strict_game_state_field_coverage(self):
        """Regra estrita: TODO atributo de instância em GameState deve estar em SERIALIZED_FIELDS ou TRANSIENT_FIELDS."""
        state = GameState()
        instance_attrs = set(vars(state).keys())
        serialized_set = set(SERIALIZED_FIELDS)
        transient_set = set(TRANSIENT_FIELDS)
        classified_set = serialized_set | transient_set

        unclassified = instance_attrs - classified_set
        self.assertEqual(
            unclassified,
            set(),
            f"Atributos de GameState não classificados nas diretrizes corporativas: {unclassified}",
        )

        overlap = serialized_set & transient_set
        self.assertEqual(
            overlap,
            set(),
            f"Sobreposição proibida entre SERIALIZED_FIELDS e TRANSIENT_FIELDS: {overlap}",
        )

        # Confere que world_seed está em SERIALIZED_FIELDS
        self.assertIn("world_seed", serialized_set)
        self.assertIsNotNone(getattr(state, "world_seed", None))

    def test_game_state_to_dict_and_from_dict(self):
        """Valida que to_dict e from_dict serializam e deserializam com exatidão todos os campos."""
        state = GameState(world_seed=42)
        state.gold = 5432
        state.day = 14
        state.week = 14
        state.workshop_levels["Ferragem"] = 4
        state.materials["mat_iron_ore"] = 99

        data = state.to_dict()
        for field in SERIALIZED_FIELDS:
            self.assertIn(field, data, f"Campo obrigatório '{field}' ausente na serialização.")

        new_state = GameState(world_seed=999)
        new_state.from_dict(data)

        self.assertEqual(new_state.world_seed, 42)
        self.assertEqual(new_state.gold, 5432)
        self.assertEqual(new_state.day, 14)
        self.assertEqual(new_state.workshop_levels["Ferragem"], 4)
        self.assertEqual(new_state.materials["mat_iron_ore"], 99)


class TestLeagueAndMarketEnginesSerialization(unittest.TestCase):
    def test_league_engine_to_dict_omits_match_logs(self):
        """O save nunca deve conter match_log nem room_events."""
        league = LeagueEngine()
        # Injeta confrontos simulando histórico com logs detalhados
        league.last_round_matches = [
            {
                "home_name": "Guilda A",
                "home_score": 3,
                "away_name": "Guilda B",
                "away_score": 1,
                "is_player_match": True,
                "match_log": ["Golpe fulminante na sala 2", "Incursão bem-sucedida"],
                "room_events": [{"room": 1, "type": "trap"}],
            }
        ]

        serialized = league.to_dict()
        self.assertIn("table", serialized)
        self.assertIn("current_round", serialized)
        self.assertIn("last_round_matches", serialized)

        matches = serialized["last_round_matches"]
        self.assertEqual(len(matches), 1)
        self.assertNotIn("match_log", matches[0])
        self.assertNotIn("room_events", matches[0])
        self.assertEqual(matches[0]["home_score"], 3)
        self.assertEqual(matches[0]["away_score"], 1)

    def test_market_engine_to_dict_and_from_dict(self):
        market = MarketEngine()
        original_mats = list(market.materials_for_sale)
        data = market.to_dict()

        self.assertIn("materials_for_sale", data)
        self.assertIn("ready_items_for_sale", data)
        self.assertIn("bulletin", data)

        restored_market = MarketEngine()
        restored_market.from_dict(data)
        self.assertEqual(len(restored_market.materials_for_sale), len(original_mats))


class TestSaveSystemOperations(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.saves_dir = self.temp_dir.name

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_slot_normalization(self):
        self.assertEqual(save_system.normalize_slot("1"), "slot_1")
        self.assertEqual(save_system.normalize_slot(1), "slot_1")
        self.assertEqual(save_system.normalize_slot("slot_1"), "slot_1")
        self.assertEqual(save_system.normalize_slot("slot_1.json"), "slot_1")
        self.assertEqual(save_system.normalize_slot("2"), "slot_2")
        self.assertEqual(save_system.normalize_slot("3"), "slot_3")
        self.assertEqual(save_system.normalize_slot("autosave"), "autosave")
        self.assertEqual(save_system.normalize_slot("autosave.json"), "autosave")
        self.assertEqual(save_system.normalize_slot(None), "autosave")

        with self.assertRaises(ValueError):
            save_system.normalize_slot("slot_99")
        with self.assertRaises(ValueError):
            save_system.normalize_slot("invalid_path/hack")

    def test_atomic_save_and_load_bundle(self):
        state = GameState()
        league = LeagueEngine()
        market = MarketEngine()
        state.gold = 7777

        res = save_system.save_bundle(state, league, market, slot="1", saves_dir=self.saves_dir)
        self.assertTrue(res["success"])
        self.assertEqual(res["slot"], "slot_1")
        self.assertTrue(os.path.exists(res["filepath"]))

        # Confere que nenhum arquivo .tmp ficou pendente
        remaining_files = os.listdir(self.saves_dir)
        self.assertFalse(any(f.endswith(".tmp") for f in remaining_files))

        loaded = save_system.load_bundle("slot_1", saves_dir=self.saves_dir)
        self.assertEqual(loaded["save_version"], save_system.SAVE_VERSION)
        self.assertEqual(loaded["slot"], "slot_1")
        self.assertEqual(loaded["game_state"]["gold"], 7777)

    def test_list_saves_returns_metadata(self):
        state = GameState()
        league = LeagueEngine()
        market = MarketEngine()
        state.gold = 3000
        state.day = 5

        save_system.save_bundle(state, league, market, slot="2", saves_dir=self.saves_dir)
        saves = save_system.list_saves(saves_dir=self.saves_dir)

        self.assertEqual(len(saves), 4)  # slot_1, slot_2, slot_3, autosave
        slot_2_info = next(s for s in saves if s["slot"] == "slot_2")
        self.assertTrue(slot_2_info["exists"])
        self.assertEqual(slot_2_info["gold"], 3000)
        self.assertEqual(slot_2_info["day"], 5)
        self.assertFalse(slot_2_info.get("corrupted", False))

        slot_1_info = next(s for s in saves if s["slot"] == "slot_1")
        self.assertFalse(slot_1_info["exists"])

    def test_corrupted_file_handling(self):
        corrupted_path = os.path.join(self.saves_dir, "slot_1.json")
        with open(corrupted_path, "w", encoding="utf-8") as f:
            f.write("{ json inválido corrompido ...")

        with self.assertRaises(ValueError):
            save_system.load_bundle("slot_1", saves_dir=self.saves_dir)

        saves = save_system.list_saves(saves_dir=self.saves_dir)
        slot_1_info = next(s for s in saves if s["slot"] == "slot_1")
        self.assertTrue(slot_1_info["exists"])
        self.assertTrue(slot_1_info["corrupted"])

    def test_unsupported_save_version(self):
        fake_data = {
            "save_version": 999,
            "slot": "slot_1",
            "metadata": {},
            "game_state": {},
        }
        with self.assertRaises(ValueError):
            save_system.migrate_save(fake_data)

    def test_legacy_slot_migration(self):
        """Valida que migrate_save converte identificadores de slots legados em canonical slots."""
        old_data = {
            "save_version": 1,
            "slot": "slot_1",
            "metadata": {},
            "game_state": {
                "loadout": {
                    "Arma": {"item_instance_id": "i1", "slot_type": "Arma"},
                    "Armadura": None,
                },
                "inventory": [
                    {"item_instance_id": "i2", "slot": "Joia", "slot_type": "Joia"}
                ],
                "showcase": [],
            },
            "market_engine": {
                "ready_items_for_sale": [
                    {"market_item_id": "m1", "slot_type": "Consumível"}
                ],
                "vip_orders": [
                    {"id": "v1", "target_slot": "Inscrição"}
                ],
                "bulletin": {"target": "Arma"},
            }
        }
        migrated = save_system.migrate_save(old_data)
        gs = migrated["game_state"]
        self.assertIn("Arsenal Ofensivo", gs["loadout"])
        self.assertIn("Blindagem Operacional", gs["loadout"])
        self.assertIn("Ativo de Performance", gs["loadout"])
        self.assertIn("Alvará de Risco", gs["loadout"])
        self.assertIn("Provisão Logística", gs["loadout"])
        self.assertNotIn("Arma", gs["loadout"])
        self.assertNotIn("Armadura", gs["loadout"])
        self.assertEqual(gs["loadout"]["Arsenal Ofensivo"]["slot_type"], "Arsenal Ofensivo")
        self.assertEqual(gs["inventory"][0]["slot"], "Ativo de Performance")
        self.assertEqual(gs["inventory"][0]["slot_type"], "Ativo de Performance")
        self.assertEqual(migrated["market_engine"]["ready_items_for_sale"][0]["slot_type"], "Provisão Logística")
        self.assertEqual(migrated["market_engine"]["vip_orders"][0]["target_slot"], "Alvará de Risco")
        self.assertEqual(migrated["market_engine"]["bulletin"]["target"], "Arsenal Ofensivo")


class TestSeedsImmutabilityAndBloat(unittest.TestCase):
    def test_seed_files_byte_for_byte_unmodified_after_play_and_save(self):
        """Assegura que nenhum seed em data/*.json é alterado após operações de jogo e salvamento."""
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        seed_files = [f for f in os.listdir(data_dir) if f.endswith('.json')]

        def hash_files():
            hashes = {}
            for name in seed_files:
                path = os.path.join(data_dir, name)
                with open(path, 'rb') as f:
                    hashes[name] = hashlib.sha256(f.read()).hexdigest()
            return hashes

        initial_hashes = hash_files()

        # Executa ciclo com controller, avança fases, compra e salva
        controller = GameController()
        controller.advance_phase()
        controller.advance_phase()
        controller.save("autosave")
        controller.new_game()

        final_hashes = hash_files()
        for name in seed_files:
            self.assertEqual(
                initial_hashes[name],
                final_hashes[name],
                f"Arquivo seed 'data/{name}' foi indevidamente modificado em disco!",
            )

    def test_save_size_under_200kb_after_30_weeks(self):
        """Simulação de 30 semanas de jogo deve gerar save inferior a 200 KB e sem logs detalhados."""
        temp_dir = tempfile.TemporaryDirectory()
        try:
            controller = GameController()
            # 30 semanas = 30 * 5 fases = 150 avanços
            for _ in range(150):
                controller.advance_phase()

            # Salva no diretório temporário
            res = save_system.save_bundle(
                controller.state,
                controller.league_engine,
                controller.market_engine,
                slot="slot_1",
                saves_dir=temp_dir.name,
            )
            filepath = res["filepath"]
            file_size_bytes = os.path.getsize(filepath)
            file_size_kb = file_size_bytes / 1024

            self.assertLess(
                file_size_kb,
                200.0,
                f"O arquivo de salvamento excedeu o limite máximo (tamanho: {file_size_kb:.2f} KB > 200 KB)",
            )

            # Verifica ausência total de termos proibidos de log
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                self.assertNotIn("match_log", content)
                self.assertNotIn("room_events", content)
        finally:
            temp_dir.cleanup()


class TestControllerInPlacePersistence(unittest.TestCase):
    def test_controller_roundtrip_semantic_equivalence(self):
        """Valida round-trip completo através do facade GameController."""
        controller = GameController()
        controller.state.gold = 8888
        controller.state.day = 7
        controller.state.week = 7
        controller.state.workshop_levels["Joalheria"] = 3
        controller.save("slot_3")

        initial_snapshot = controller.get_state()

        # Inicia novo jogo limpando o estado
        controller.new_game()
        self.assertNotEqual(controller.state.gold, 8888)

        # Carrega o slot_3 salvo
        load_res = controller.load("slot_3")
        self.assertTrue(load_res["success"])
        self.assertEqual(controller.active_slot, "slot_3")

        loaded_snapshot = controller.get_state()
        self.assertEqual(initial_snapshot["gold"], loaded_snapshot["gold"])
        self.assertEqual(initial_snapshot["day"], loaded_snapshot["day"])
        self.assertEqual(initial_snapshot["week"], loaded_snapshot["week"])
        self.assertEqual(initial_snapshot["workshop_levels"], loaded_snapshot["workshop_levels"])


class TestServerSaveEndpoints(unittest.TestCase):
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

    def test_get_saves_endpoint(self):
        resp = self._get('/api/saves')
        self.assertEqual(resp.status, 200)
        data = json.loads(resp.read().decode('utf-8'))
        self.assertTrue(data.get("success"))
        self.assertIn("saves", data)
        self.assertIsInstance(data["saves"], list)

    def test_save_and_load_endpoints(self):
        # Salva no slot 1
        save_resp = self._post('/api/save', {"slot": "1"})
        self.assertEqual(save_resp.status, 200)
        save_data = json.loads(save_resp.read().decode('utf-8'))
        self.assertTrue(save_data.get("success"))
        self.assertEqual(save_data.get("slot"), "slot_1")

        # Carrega o slot 1
        load_resp = self._post('/api/load', {"slot": "1"})
        self.assertEqual(load_resp.status, 200)
        load_data = json.loads(load_resp.read().decode('utf-8'))
        self.assertTrue(load_data.get("success"))
        self.assertIn("state", load_data)

    def test_load_invalid_slot_returns_http_400(self):
        # Requisição com slot inexistente ou inválido deve retornar HTTP 400
        url = f"http://127.0.0.1:{self.port}/api/load"
        data = json.dumps({"slot": "slot_inexistente_999"}).encode('utf-8')
        req = Request(url, data=data, headers={'Content-Type': 'application/json'})

        with self.assertRaises(HTTPError) as ctx:
            urlopen(req)
        self.assertEqual(ctx.exception.code, 400)
        body = json.loads(ctx.exception.read().decode('utf-8'))
        self.assertFalse(body.get("success"))
        self.assertIn("error", body)

    def test_new_game_endpoint(self):
        resp = self._post('/api/new_game', {"slot": "autosave"})
        self.assertEqual(resp.status, 200)
        data = json.loads(resp.read().decode('utf-8'))
        self.assertTrue(data.get("success"))
        self.assertIn("state", data)
