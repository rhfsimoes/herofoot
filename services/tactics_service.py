"""
HeroFoot Tactics Service.
Gerencia e valida a escalação da força-tarefa (titulares e reservas) e o setup de compartimentos da expedição.
"""

from constants import SLOTS, normalize_slot
from balance import get_balance


class TacticsService:
    def __init__(self, state):
        self.state = state

    def detect_b2b_synergies(self, starters: list, loadout: dict) -> list:
        """
        Detecta e calcula as 3 sinergias táticas canônicas B2B com base na composição de titulares e loadout equipado:
        1. Monopólio Ofensivo (Arsenal Ofensivo + >=2 DPS): +5% PE por DPS escalado.
        2. Blindagem Pesada (Blindagem Operacional + >=2 Vanguardas): +5% PE defensivo conjunto.
        3. Logística Avançada (Alvará/Provisão + >=1 Suporte Logístico): +5% PE de eficiência de suprimentos.
        """
        if not starters or not isinstance(starters, list):
            return []
        if not loadout or not isinstance(loadout, dict):
            loadout = {}

        from match_engine import get_hero_position

        # Mapeia heróis escalados
        starter_heroes = []
        for s in starters:
            if isinstance(s, dict):
                starter_heroes.append(s)
            elif isinstance(s, str):
                h = self.state.hero_by_id(s)
                if h:
                    starter_heroes.append(h)

        num_dps = sum(1 for h in starter_heroes if get_hero_position(h) == "pos_dps")
        num_vanguarda = sum(1 for h in starter_heroes if get_hero_position(h) == "pos_vanguarda")
        num_logistica = sum(1 for h in starter_heroes if get_hero_position(h) == "pos_suporte_logistico")

        has_arsenal = loadout.get("Arsenal Ofensivo") is not None
        has_blindagem = loadout.get("Blindagem Operacional") is not None
        has_logistica = (loadout.get("Alvará de Risco") is not None) or (loadout.get("Provisão Logística") is not None)

        synergies = []

        # 1. Monopólio Ofensivo
        if num_dps >= 2 and has_arsenal:
            bonus_pe = round(num_dps * 0.05, 2)
            synergies.append({
                "id": "syn_monopolio_ofensivo",
                "name": "Monopólio Ofensivo",
                "position_count": num_dps,
                "bonus_pe_pct": bonus_pe,
                "description": f"Sinergia B2B Ofensiva: +{int(bonus_pe * 100)}% no Poder Efetivo pelo domínio da linha de frente com {num_dps} DPS armados.",
            })

        # 2. Blindagem Pesada
        if num_vanguarda >= 2 and has_blindagem:
            synergies.append({
                "id": "syn_blindagem_pesada",
                "name": "Blindagem Pesada",
                "position_count": num_vanguarda,
                "damage_mitigation_pct": 0.05,
                "description": f"Sinergia B2B Defensiva: +5% de mitigação de dano pela couraça blindada sustentada por {num_vanguarda} Vanguardas.",
            })

        # 3. Logística Avançada
        if num_logistica >= 1 and has_logistica:
            synergies.append({
                "id": "syn_logistica_avancada",
                "name": "Logística Avançada",
                "position_count": num_logistica,
                "energy_reduction_pct": 0.05,
                "description": f"Sinergia B2B Logística: Redução extra no dreno de suprimentos pela otimização e fluxo de carga.",
            })

        self.state.active_tactical_synergies = synergies
        return synergies

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
