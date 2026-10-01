import unittest
from game_state import GameState, SERIALIZED_FIELDS
from controller import GameController
from services.phase_service import PhaseService
from balance import get_balance

FORBIDDEN_TERMS = ["gol", "gramado", "estádio", "estadio", "escanteio", "bilheteria", "brasfoot"]


class TestTactics(unittest.TestCase):
    def setUp(self):
        self.controller = GameController()
        self.state = self.controller.state
        self.tactics_service = self.controller.tactics_service

        # Cria itens de teste no inventário
        self.weapon_item = {
            "item_instance_id": "sword_test_01",
            "name": "Espada de Aço Corporativo",
            "slot_type": "Arsenal Ofensivo",
            "quality": "Normal",
            "power_bonus": 10,
            "market_value_base": 120,
        }
        self.armor_item = {
            "item_instance_id": "armor_test_01",
            "name": "Cota de Malha Protocolar",
            "slot_type": "Blindagem Operacional",
            "quality": "Normal",
            "power_bonus": 12,
            "market_value_base": 150,
        }
        self.state.inventory.extend([self.weapon_item, self.armor_item])

    def test_serialized_fields_contains_reserves(self):
        """Verifica se o novo campo 'reserves' consta em SERIALIZED_FIELDS conforme contrato."""
        self.assertIn("reserves", SERIALIZED_FIELDS)
        self.assertTrue(hasattr(self.state, "reserves"))
        self.assertIsInstance(self.state.reserves, list)

    def test_controller_get_state_exposes_reserves(self):
        """Verifica se get_state()['tactics']['reserves'] está devidamente exposto."""
        state_dict = self.controller.get_state()
        self.assertIn("tactics", state_dict)
        self.assertIn("reserves", state_dict["tactics"])
        self.assertEqual(state_dict["tactics"]["reserves"], self.state.reserves)

    def test_initial_default_lineup_ordered_by_power(self):
        """
        Escalação padrão inicial em game_state.py:
        Os aptos de maior Poder são escalados em starters (até 6) e os seguintes em reserves (até 3).
        """
        # Cria um estado com 10 heróis aptos com poderes variados
        custom_state = GameState()
        mock_heroes = []
        for i in range(10):
            mock_heroes.append({
                "id": f"hero_mock_{i}",
                "name": f"Aventureiro {i}",
                "current_power": 50 + (i * 5),  # 50, 55, 60, ..., 95
                "status": "Apto",
                "injured": False,
                "injury_weeks_left": 0,
            })
        custom_state.team = mock_heroes

        # Simula a lógica de carga inicial
        balance = get_balance()
        max_starters = balance.get("party", {}).get("starters", 6)
        max_reserves = balance.get("party", {}).get("reserves", 3)

        apt = [h for h in custom_state.team if h.get("status") == "Apto" and not h.get("injured", False)]
        apt.sort(key=lambda h: h.get("current_power", h.get("power", 0)), reverse=True)

        expected_starters = [h["id"] for h in apt[:max_starters]]
        expected_reserves = [h["id"] for h in apt[max_starters:max_starters + max_reserves]]

        self.assertEqual(len(expected_starters), 6)
        self.assertEqual(len(expected_reserves), 3)

        # O herói com maior poder (95) deve ser o primeiro titular
        self.assertEqual(expected_starters[0], "hero_mock_9")
        # O 7º herói (poder 65) deve estar nas reservas
        self.assertEqual(expected_reserves[0], "hero_mock_3")

        # Verifica no GameState padrão carregado
        # Em team.json, temos 6 aptos titulares ordenados por poder descendente
        self.assertEqual(self.state.starters, ["hero_05", "hero_01", "hero_03", "hero_06", "hero_07", "hero_08"])

    def test_reject_forged_item(self):
        """Cliente que envia item forjado (que não existe no inventário) é rejeitado com mensagem corporativa."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={"Arsenal Ofensivo": "item_fantasma_inexistente"},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("não consta no inventário", result["message"].lower())

    def test_reject_item_object_payload(self):
        """Nunca aceitar o objeto do item enviado pelo cliente; apenas item_instance_id como string ou None."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={"Arsenal Ofensivo": {"item_instance_id": "sword_test_01", "name": "Item Forjado"}},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("objeto estruturado fornecido", result["message"].lower())

    def test_reject_swapped_slot_item(self):
        """Item com slot trocado (ex: espada no slot Blindagem Operacional) é rejeitado."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={"Blindagem Operacional": "sword_test_01"},  # sword_test_01 tem slot_type 'Arsenal Ofensivo'
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("incompatibilidade funcional", result["message"].lower())

    def test_reject_same_item_in_multiple_slots(self):
        """O mesmo item não pode ocupar dois slots simultaneamente."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={"Arsenal Ofensivo": "sword_test_01", "Alvará de Risco": "sword_test_01"},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("múltiplos compartimentos", result["message"].lower())

    def test_reject_injured_hero_in_starters(self):
        """Herói ferido (injured=True) não pode ser escalado em titulares."""
        # hero_04 em team.json possui injured=True
        result = self.tactics_service.save_tactics(
            starters=["hero_04"],
            loadout={},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("afastamento médico pericial", result["message"].lower())

    def test_reject_injured_hero_in_reserves(self):
        """Herói ferido (injured=True) não pode ser alocado na reserva."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={},
            reserves=["hero_04"]
        )
        self.assertFalse(result["success"])
        self.assertIn("afastamento médico pericial", result["message"].lower())

    def test_reject_afastado_status_hero(self):
        """Herói com status 'Afastado' mesmo sem flag injured é rejeitado."""
        # Configura hero_01 com status Afastado
        hero = self.state.hero_by_id("hero_01")
        hero["status"] = "Afastado"
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("afastamento médico pericial", result["message"].lower())

    def test_reject_more_than_six_starters(self):
        """Mais de 6 titulares são rejeitados com erro corporativo de excesso de contingente."""
        # Cria heróis aptos adicionais
        for i in range(10, 18):
            self.state.team.append({
                "id": f"hero_extra_{i}",
                "name": f"Colaborador {i}",
                "status": "Apto",
                "injured": False,
                "injury_weeks_left": 0,
                "current_power": 50
            })
        seven_ids = [f"hero_extra_{i}" for i in range(10, 17)]
        result = self.tactics_service.save_tactics(
            starters=seven_ids,
            loadout={},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("excesso de contingente", result["message"].lower())

    def test_reject_more_than_three_reserves(self):
        """Mais de 3 reservas são rejeitados."""
        for i in range(20, 25):
            self.state.team.append({
                "id": f"hero_extra_{i}",
                "name": f"Colaborador {i}",
                "status": "Apto",
                "injured": False,
                "injury_weeks_left": 0,
                "current_power": 50
            })
        four_reserves = [f"hero_extra_{i}" for i in range(20, 24)]
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={},
            reserves=four_reserves
        )
        self.assertFalse(result["success"])
        self.assertIn("excesso de contingente", result["message"].lower())

    def test_reject_duplicate_hero_in_starters(self):
        """IDs duplicados em titulares são rejeitados."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01", "hero_01"],
            loadout={},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("duplicidade de colaborador", result["message"].lower())

    def test_reject_hero_simultaneously_in_starters_and_reserves(self):
        """Um herói não pode estar em titulares e reservas ao mesmo tempo."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={},
            reserves=["hero_01"]
        )
        self.assertFalse(result["success"])
        self.assertIn("não pode constar simultaneamente", result["message"].lower())

    def test_reject_unknown_hero_id(self):
        """ID de herói inexistente na guilda é rejeitado."""
        result = self.tactics_service.save_tactics(
            starters=["hero_inexistente_999"],
            loadout={},
            reserves=[]
        )
        self.assertFalse(result["success"])
        self.assertIn("não localizado no quadro", result["message"].lower())

    def test_successful_tactics_saving(self):
        """Salva titulares, reservas e loadout com sucesso."""
        result = self.tactics_service.save_tactics(
            starters=["hero_01", "hero_03"],
            loadout={"Arsenal Ofensivo": "sword_test_01", "Blindagem Operacional": "armor_test_01"},
            reserves=["hero_05"]
        )
        self.assertTrue(result["success"])
        self.assertEqual(self.state.starters, ["hero_01", "hero_03"])
        self.assertEqual(self.state.reserves, ["hero_05"])
        self.assertIsNotNone(self.state.loadout["Arsenal Ofensivo"])
        self.assertEqual(self.state.loadout["Arsenal Ofensivo"]["item_instance_id"], "sword_test_01")
        self.assertIsNotNone(self.state.loadout["Blindagem Operacional"])
        self.assertEqual(self.state.loadout["Blindagem Operacional"]["item_instance_id"], "armor_test_01")
        self.assertIsNone(self.state.loadout["Ativo de Performance"])

    def test_phase_1_invalidation_of_injured_hero_and_missing_item(self):
        """
        Regra 5: Se uma escalação salva ficar inválida (herói ferido na Fase 1 ou item vendido/descartado),
        phase_1 remove o id inválido de starters/reserves e limpa o slot do loadout,
        registrando a ocorrência no relatório da fase.
        """
        # Salva tática válida com hero_01 em starters, hero_03 em reserves e espada equipada
        save_res = self.tactics_service.save_tactics(
            starters=["hero_01"],
            loadout={"Arsenal Ofensivo": "sword_test_01"},
            reserves=["hero_03"]
        )
        self.assertTrue(save_res["success"])

        # Agora causamos a invalidação:
        # 1. hero_01 sofre lesão
        h1 = self.state.hero_by_id("hero_01")
        h1["injured"] = True
        h1["injury_weeks_left"] = 2
        h1["status"] = "Afastado"

        # 2. hero_03 é afastado
        h3 = self.state.hero_by_id("hero_03")
        h3["status"] = "Afastado"

        # 3. Item é descartado/vendido (removido de state.inventory)
        item_to_remove = next(i for i in self.state.inventory if i.get("item_instance_id") == "sword_test_01")
        self.state.inventory.remove(item_to_remove)

        # Executa Fase 1
        phase_service = PhaseService(
            self.state, self.controller.dungeons, self.controller.league_engine, self.controller.market_engine
        )
        phase_res = phase_service.phase_1_cuidado()

        # Verifica saneamento automático
        self.assertNotIn("hero_01", self.state.starters)
        self.assertNotIn("hero_03", self.state.reserves)
        self.assertIsNone(self.state.loadout["Arsenal Ofensivo"])

        # Verifica registros no relatório da fase
        report_text = " ".join(phase_res["report"])
        self.assertIn("Valdris", report_text)
        self.assertIn("desconvocado da titularidade", report_text)
        self.assertIn("Magister Vorn", report_text)
        self.assertIn("desconvocado da reserva", report_text)
        self.assertIn("desvinculado do compartimento", report_text)

    def test_no_forbidden_terms_in_tactics_messages(self):
        """Garante que as mensagens do TacticsService não possuem termos proibidos."""
        test_calls = [
            lambda: self.tactics_service.save_tactics(starters=["hero_04"], loadout={}, reserves=[]),
            lambda: self.tactics_service.save_tactics(starters=["hero_01"], loadout={"Blindagem Operacional": "sword_test_01"}, reserves=[]),
            lambda: self.tactics_service.save_tactics(starters=["hero_01"], loadout={"Arsenal Ofensivo": "forged_item"}, reserves=[]),
            lambda: self.tactics_service.save_tactics(starters=["hero_01"], loadout={}, reserves=["hero_01"]),
            lambda: self.tactics_service.save_tactics(starters=["hero_01", "hero_03"], loadout={"Arsenal Ofensivo": "sword_test_01"}, reserves=[]),
        ]
        for call in test_calls:
            res = call()
            msg = res.get("message", "").lower()
            for term in FORBIDDEN_TERMS:
                self.assertNotIn(term, msg, f"Termo proibido '{term}' encontrado na mensagem: '{msg}'")


if __name__ == '__main__':
    unittest.main()
