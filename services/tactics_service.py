"""
HeroFoot Tactics Service.
Gerencia e valida a escalação da força-tarefa (titulares e reservas) e o setup de compartimentos da expedição.
"""

from constants import SLOTS, normalize_slot
from balance import get_balance


class TacticsService:
    def __init__(self, state):
        self.state = state

    def save_tactics(self, starters: list, loadout: dict, reserves: list = None) -> dict:
        """
        Valida e persiste a escalação de titulares, reservas e compartimentos de suprimentos.
        O servidor é autoridade absoluta sobre escalação e equipamentos.
        """
        if starters is None:
            starters = []
        if reserves is None:
            reserves = []
        if loadout is None:
            loadout = {}

        if not isinstance(starters, list) or not isinstance(reserves, list) or not isinstance(loadout, dict):
            return {
                "success": False,
                "message": "Parâmetros de submissão tática em formato irregular perante as normas da guilda."
            }

        balance = get_balance()
        party_cfg = balance.get("party", {})
        max_starters = party_cfg.get("starters", 6)
        max_reserves = party_cfg.get("reserves", 3)

        # 1. Validação de limite numérico de titulares e reservas
        if len(starters) > max_starters:
            return {
                "success": False,
                "message": f"Excesso de contingente: a escala titular comporta no máximo {max_starters} colaboradores."
            }

        if len(reserves) > max_reserves:
            return {
                "success": False,
                "message": f"Excesso de contingente: o banco de reservas comporta no máximo {max_reserves} colaboradores."
            }

        # 2. Validação de formato dos identificadores de heróis
        for hid in starters + reserves:
            if not isinstance(hid, str) or not hid.strip():
                return {
                    "success": False,
                    "message": "Identificador de colaborador funcional em formato irregular."
                }

        # 3. Unicidade dentro de titulares e dentro de reservas
        if len(starters) != len(set(starters)):
            return {
                "success": False,
                "message": "Inconsistência cadastral: duplicidade de colaborador detectada na titularidade."
            }

        if len(reserves) != len(set(reserves)):
            return {
                "success": False,
                "message": "Inconsistência cadastral: duplicidade de colaborador detectada na reserva."
            }

        # 4. Um herói não pode estar em titulares e reservas ao mesmo tempo
        overlap = set(starters).intersection(set(reserves))
        if overlap:
            return {
                "success": False,
                "message": "Conflito de designação: colaborador não pode constar simultaneamente na titularidade e na reserva."
            }

        # 5. Existência do herói e aptidão física/médica
        for hid in starters + reserves:
            hero = self.state.hero_by_id(hid)
            if not hero:
                return {
                    "success": False,
                    "message": f"Colaborador com registro '{hid}' não localizado no quadro funcional da guilda."
                }
            if hero.get("injured", False) or hero.get("status") in ("Afastado", "Falecido"):
                reason = "óbito em serviço homologado em cartório" if hero.get("status") == "Falecido" else "afastamento médico pericial"
                return {
                    "success": False,
                    "message": f"Colaborador '{hero.get('name', hid)}' sob {reason}. Alocação indeferida pelo departamento de saúde ocupacional."
                }

        # 6. Validação do loadout de itens
        # Rejeitar objetos forjados enviados pelo cliente: aceita somente item_instance_id como string ou null/None
        equipped_item_ids = []
        resolved_loadout = {normalize_slot(s): None for s in SLOTS}

        for slot_key, item_ref in loadout.items():
            norm_slot = normalize_slot(slot_key)
            if norm_slot not in [normalize_slot(s) for s in SLOTS]:
                return {
                    "success": False,
                    "message": f"Compartimento '{slot_key}' não homologado pelo departamento de intendência."
                }

            if item_ref is None:
                continue

            if isinstance(item_ref, dict):
                return {
                    "success": False,
                    "message": "Submissão irregular: objeto estruturado fornecido para compartimento de suprimento. Exige-se estritamente o identificador patrimonial."
                }

            if not isinstance(item_ref, str) or not item_ref.strip():
                return {
                    "success": False,
                    "message": "Formato de identificador de patrimônio incompatível com o sistema de intendência."
                }

            # Proibição de alocar o mesmo item em dois compartimentos
            if item_ref in equipped_item_ids:
                return {
                    "success": False,
                    "message": "Inconsistência patrimonial: o mesmo item não pode ser alocado em múltiplos compartimentos simultaneamente."
                }
            equipped_item_ids.append(item_ref)

            # O item deve existir no almoxarifado (state.inventory)
            inv_item = next(
                (i for i in self.state.inventory if i.get("item_instance_id") == item_ref),
                None
            )
            if not inv_item:
                return {
                    "success": False,
                    "message": f"Patrimônio não localizado: o item '{item_ref}' não consta no inventário do almoxarifado."
                }

            # O item deve pertencer ao compartimento correspondente
            item_slot_type = normalize_slot(inv_item.get("slot_type", inv_item.get("slot", "")))
            if item_slot_type != norm_slot:
                return {
                    "success": False,
                    "message": f"Incompatibilidade funcional: o item '{inv_item.get('name', item_ref)}' pertence ao compartimento '{item_slot_type}' e não pode ser alocado em '{norm_slot}'."
                }

            resolved_loadout[norm_slot] = inv_item

        # 7. Persistência da escalação e loadout validados
        self.state.starters = list(starters)
        self.state.reserves = list(reserves)
        self.state.loadout = resolved_loadout

        return {
            "success": True,
            "message": "Escalação tática e compartimentos de suprimentos homologados pelo departamento de operações.",
            "tactics": {
                "starters": self.state.starters,
                "reserves": self.state.reserves,
                "loadout": self.state.loadout,
            }
        }
