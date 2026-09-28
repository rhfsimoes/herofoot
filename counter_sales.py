"""
HeroFoot Counter Sales Engine.
Gerencia as margens, precificação no balcão e resolução de contrapropostas de mercadores.
"""

from constants import normalize_margin
from balance import get_balance


class CounterSales:
    def __init__(self):
        balance = get_balance()
        sales_cfg = balance.get("sales", {})
        self.margin_rates = sales_cfg.get("margin_rates", {
            "Promoção": 0.8,
            "Preço Justo": 1.0,
            "Preço Abusivo": 1.35
        })
        self.speculation_modifier = 1.0

    def set_market_speculation(self, modifier: float):
        self.speculation_modifier = modifier

    def list_item_for_sale(self, item_name: str, base_price: float, margin_type: str):
        norm_margin = normalize_margin(margin_type)
        rate = self.margin_rates.get(norm_margin, 1.0)
        final_price = int(base_price * rate * self.speculation_modifier)

        ratio = final_price / base_price if base_price > 0 else 1.0

        if ratio >= 1.50:
            status = 'não vendido'
            counter_offer = None
        elif ratio <= 1.0:
            status = 'vendido'
            counter_offer = None
        else:
            status = 'contraproposta'
            counter_offer = int(final_price * 0.90)

        return {
            "item_name": item_name,
            "base_price": base_price,
            "margin_type": norm_margin,
            "final_price": final_price,
            "status": status,
            "counter_offer": counter_offer
        }
