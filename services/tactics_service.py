"""
HeroFoot Tactics Service.
Gerencia a escalação da party de titulares e o setup dos 5 slots de expedição.
"""

from constants import SLOTS, normalize_slot


class TacticsService:
    def __init__(self, state):
        self.state = state

    def save_tactics(self, starters: list, loadout: dict) -> dict:
        """Salva a escalação titular e os 5 slots de equipamento."""
        valid_starters = [
            sid for sid in starters
            if any(h["id"] == sid for h in self.state.team)
        ][:6]
        self.state.starters = valid_starters

        # Atualiza loadout para cada slot
        for slot in SLOTS:
            norm_slot = normalize_slot(slot)
            item = loadout.get(slot) or loadout.get(norm_slot)
            if item:
                if isinstance(item, dict):
                    matching = next(
                        (i for i in self.state.inventory if i.get("item_instance_id") == item.get("item_instance_id")),
                        None
                    )
                    self.state.loadout[norm_slot] = matching if matching else item
                else:
                    matching = next(
                        (i for i in self.state.inventory if i.get("item_instance_id") == item),
                        None
                    )
                    self.state.loadout[norm_slot] = matching
            else:
                self.state.loadout[norm_slot] = None

        return {
            "success": True,
            "message": "Escalação tática e 5 Slots da expedição autorizados pelo departamento.",
            "tactics": {
                "starters": self.state.starters,
                "loadout": self.state.loadout,
            }
        }
