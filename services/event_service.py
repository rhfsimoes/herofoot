"""
HeroFoot Corporate Event Service.
Gerencia o sorteio e resolução de incidentes corporativos no loop semanal.
"""

import os
import json
import copy
import random
from typing import Optional, Dict, Any, List


class EventService:
    """Serviço corporativo para sorteio e resolução de incidentes burocráticos."""

    def __init__(self, state, events_data: Optional[List[Dict[str, Any]]] = None):
        self.state = state
        if events_data is not None:
            self.events = events_data
        else:
            self.events = self._load_events_seed()

    def _load_events_seed(self) -> List[Dict[str, Any]]:
        path = os.path.join(os.path.dirname(__file__), '..', 'data', 'events_seed.json')
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def get_active_event(self) -> Optional[Dict[str, Any]]:
        """Retorna o incidente corporativo atualmente pendente de resolução."""
        return getattr(self.state, "active_event", None)

    def roll_weekly_event(
        self,
        phase: str = "phase_1",
        rng: Optional[random.Random] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Sorteia um incidente corporativo elegível do acervo oficial (events_seed.json).
        Filtra por trigger_phase == phase ou trigger_phase == 'weekly_start'.
        Evita repetição de incidentes já resolvidos caso haja alternativas disponíveis.
        """
        if not self.events:
            return None

        # Filtragem por fase de disparo
        eligible = [
            e for e in self.events
            if e.get("trigger_phase") == phase or e.get("trigger_phase") == "weekly_start"
        ]
        if not eligible:
            return None

        # Histórico de incidentes já despachados
        resolved_history = getattr(self.state, "resolved_events_history", [])
        if not isinstance(resolved_history, list):
            resolved_history = []

        # Prioriza incidentes inéditos ou não resolvidos recentemente
        unresolved = [e for e in eligible if e.get("id") not in resolved_history]
        pool = unresolved if unresolved else eligible

        if rng is None:
            rng = random.Random()

        chosen = copy.deepcopy(rng.choice(pool))
        self.state.active_event = chosen
        return chosen

    def resolve_event_choice(self, event_id: str, option_id: str) -> Dict[str, Any]:
        """
        Processa e homologa a deliberação administrativa de um incidente corporativo.
        Aplica os impactos orçamentários, de fadiga, moral da contratante e suprimentos.
        """
        active_event = getattr(self.state, "active_event", None)
        if not active_event:
            return {
                "success": False,
                "message": "Nenhum incidente corporativo ativo pendente de homologação na mesa diretora."
            }

        if active_event.get("id") != event_id:
            return {
                "success": False,
                "message": (
                    f"Discrepância protocolar: identificador informado '{event_id}' "
                    f"incompatível com o incidente ativo '{active_event.get('id')}'."
                )
            }

        # Localiza a diretriz/opção escolhida
        options = active_event.get("options", [])
        selected_option = next((opt for opt in options if opt.get("id") == option_id), None)
        if not selected_option:
            return {
                "success": False,
                "message": f"Deliberação administrativa inválida: opção '{option_id}' não homologada no laudo do incidente."
            }

        effects = selected_option.get("effects", {})

        # 1. Impacto no Tesouro da Guilda (Gold)
        if "gold" in effects:
            self.state.gold += int(effects["gold"])

        # 2. Impacto de Fadiga do Plantel de Heróis (Fatigue All: 0 a 100)
        fatigue_delta = int(effects.get("fatigue_all", 0))
        if fatigue_delta != 0:
            for hero in getattr(self.state, "team", []):
                curr_fatigue = hero.get("fatigue", 0)
                hero["fatigue"] = max(0, min(100, curr_fatigue + fatigue_delta))

        # 3. Impacto na Confiança da Contratante / Moral Corporativo (0 a 100)
        morale_delta = int(effects.get("morale", 0))
        if morale_delta != 0:
            curr_conf = getattr(self.state, "contractor_confidence", 75)
            self.state.contractor_confidence = max(0, min(100, curr_conf + morale_delta))

        # 4. Bônus Temporário de Suprimentos para a Expedição
        supplies_bonus = int(effects.get("supplies_bonus", 0))
        if supplies_bonus != 0:
            self.state.supplies_bonus = getattr(self.state, "supplies_bonus", 0) + supplies_bonus

        # 5. Modificador Percentual de Poder Operacional (se houver)
        if "power_pct_modifier" in effects:
            power_mod = float(effects["power_pct_modifier"])
            curr_mod = getattr(self.state, "temporary_power_pct_modifier", 0.0)
            self.state.temporary_power_pct_modifier = curr_mod + power_mod

        # Registra no histórico de laudos resolvidos
        if not hasattr(self.state, "resolved_events_history") or not isinstance(self.state.resolved_events_history, list):
            self.state.resolved_events_history = []
        if event_id not in self.state.resolved_events_history:
            self.state.resolved_events_history.append(event_id)

        # Limpa o evento ativo
        self.state.active_event = None

        return {
            "success": True,
            "consequence": selected_option.get("consequence_narrative", ""),
            "effects_applied": effects,
        }
