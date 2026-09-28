"""
HeroFoot Sales Service.
Gerencia a negociação de excedentes no balcão e a resolução de contrapropostas.
"""

import uuid
from constants import normalize_margin


class SalesService:
    def __init__(self, state, counter_sales):
        self.state = state
        self.counter_sales = counter_sales

    def list_item_for_sale(self, item_instance_id: str, base_price: int, margin_type: str) -> dict:
        """Coloca um item no Balcão para venda com regras de precificação."""
        item = next(
            (i for i in self.state.inventory if i.get("item_instance_id") == item_instance_id),
            None
        )
        if not item:
            return {"success": False, "message": "Ativo não localizado no almoxarifado."}

        # Não permite vender item equipado no loadout
        if self.state.is_equipped(item_instance_id):
            return {"success": False, "message": "Ativo em uso na expedição. Desequipe antes de anunciar."}

        if not self.counter_sales:
            return {"success": False, "message": "Módulo de vendas indisponível."}

        norm_margin = normalize_margin(margin_type)
        result = self.counter_sales.list_item_for_sale(
            item_name=item.get("name", "Item"),
            base_price=base_price,
            margin_type=norm_margin
        )

        status = result["status"]

        if status == "vendido":
            self.state.inventory.remove(item)
            self.state.gold += int(result["final_price"])
            return {
                "success": True,
                "status": "vendido",
                "gold_received": int(result["final_price"]),
                "message": f"Venda aprovada a preço de tabela (+{int(result['final_price'])} Moedas de Ouro).",
            }

        elif status == "não vendido":
            return {
                "success": False,
                "status": "não vendido",
                "message": "Preço excessivo. Nenhum comprador manifestou interesse no ativo.",
            }

        elif status == "contraproposta":
            offer_id = str(uuid.uuid4())
            self.state.inventory.remove(item)
            self.state.pending_offers[offer_id] = {
                "price": int(result["counter_offer"]),
                "item": item,
            }
            return {
                "success": True,
                "status": "contraproposta",
                "offer_id": offer_id,
                "counter_offer": int(result["counter_offer"]),
                "message": f"Comprador realizou contraproposta de {int(result['counter_offer'])} Moedas de Ouro.",
            }

        return {"success": False, "message": "Estado de venda desconhecido."}

    def resolve_counter_offer(self, offer_id: str, accept: bool) -> dict:
        """Aceita ou rejeita contraproposta recebida."""
        if offer_id not in self.state.pending_offers:
            return {"success": False, "message": "Proposta não encontrada ou expirada."}

        offer = self.state.pending_offers.pop(offer_id)

        if accept:
            self.state.gold += offer["price"]
            return {
                "success": True,
                "accepted": True,
                "gold_received": offer["price"],
                "message": f"Contrato aceito. {offer['price']} Moedas de Ouro creditadas.",
            }
        else:
            self.state.inventory.append(offer["item"])
            return {
                "success": True,
                "accepted": False,
                "message": "Contraproposta rejeitada. Ativo retornou ao almoxarifado.",
            }
