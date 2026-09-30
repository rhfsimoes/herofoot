"""
HeroFoot Market Service.
Gerencia as transações de compra de insumos e aquisições de itens prontos no mercado.
"""

import uuid


class MarketService:
    def __init__(self, state, market_engine):
        self.state = state
        self.market_engine = market_engine

    def buy_material(self, material_id: str, quantity: int) -> dict:
        """Compra insumo ofertado pelo mercado da rodada."""
        market_item = next(
            (m for m in self.market_engine.materials_for_sale if m["material_id"] == material_id),
            None
        )
        if not market_item:
            return {"success": False, "message": "Insumo não disponível nesta rodada."}

        if quantity > market_item["available_quantity"]:
            return {"success": False, "message": "Quantidade solicitada excede o estoque do fornecedor."}

        total_cost = market_item["unit_price"] * quantity
        if self.state.gold < total_cost:
            return {"success": False, "message": "Saldo em ouro insuficiente para esta aquisição."}

        self.state.gold -= total_cost
        market_item["available_quantity"] -= quantity
        self.state.materials[material_id] = self.state.materials.get(material_id, 0) + quantity

        return {
            "success": True,
            "message": f"Aquisição autorizada: {quantity}x {market_item['name']} por {total_cost} Moedas de Ouro.",
            "gold": self.state.gold,
            "materials": self.state.materials,
        }

    def buy_ready_item(self, market_item_id: str) -> dict:
        """Compra um item pronto listado no mercado da rodada."""
        item = next(
            (i for i in self.market_engine.ready_items_for_sale if i["market_item_id"] == market_item_id),
            None
        )
        if not item:
            return {"success": False, "message": "Ativo não localizado no catálogo de fornecedores."}

        if self.state.gold < item["price"]:
            return {"success": False, "message": "Saldo em ouro insuficiente para comprar este ativo."}

        self.state.gold -= item["price"]
        self.market_engine.ready_items_for_sale.remove(item)

        inventory_item = {
            "item_instance_id": str(uuid.uuid4()),
            "name": item["name"],
            "slot_type": item["slot_type"],
            "quality": item["quality"],
            "power_bonus": item["power_bonus"],
            "energy_bonus": item.get("energy_bonus", 0),
            "terrain_mitigation": item.get("terrain_mitigation", None),
            "market_value_base": int(item["price"] * 0.8),
        }
        if item["slot_type"] == "Provisão Logística":
            inventory_item["charges"] = item.get("charges", 3)
            inventory_item["max_charges"] = item.get("max_charges", 3)

        self.state.inventory.append(inventory_item)

        return {
            "success": True,
            "message": f"Contrato firmado: '{item['name']}' integrado ao inventário.",
            "gold": self.state.gold,
            "item": inventory_item,
        }
