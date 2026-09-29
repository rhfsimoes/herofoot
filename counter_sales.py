"""
HeroFoot Counter Sales Engine.
Gerencia as margens, precificação no balcão e resolução de contrapropostas de mercadores.
"""

import random
from constants import normalize_margin
from balance import get_balance


class CounterSales:
    def __init__(self, balance=None):
        if balance is None:
            balance = get_balance()
        sales_cfg = balance.get("sales", {})
        self.margin_rates = sales_cfg.get("margin_rates", {
            "Promoção": 0.8,
            "Preço Justo": 1.0,
            "Preço Abusivo": 1.35
        })
        self.buyer_tolerance_min = float(sales_cfg.get("buyer_tolerance_min", 1.0))
        self.buyer_tolerance_max = float(sales_cfg.get("buyer_tolerance_max", 1.5))
        self.counter_zone = float(sales_cfg.get("counter_zone", 0.15))
        self.listing_fee_rate = float(sales_cfg.get("listing_fee_rate", 0.08))
        self.listing_fee_min = int(sales_cfg.get("listing_fee_min", 10))

    def calculate_listing_fee(self, reference_price: int, margin_type: str) -> int:
        """Calcula a taxa de vitrine da Câmara dos Mercadores (8% do valor base, mínimo de 10 ouro para margem abusiva)."""
        norm_margin = normalize_margin(margin_type)
        if norm_margin == "Preço Abusivo":
            return max(self.listing_fee_min, round(reference_price * self.listing_fee_rate))
        return 0

    def list_item_for_sale(
        self,
        item_name: str,
        reference_price: int = None,
        margin_type: str = "Preço Justo",
        demand_multiplier: float = 1.0,
        rng=None,
        base_price: int = None,
        **kwargs
    ):
        ref_price = reference_price if reference_price is not None else (base_price if base_price is not None else 100)
        norm_margin = normalize_margin(margin_type)
        rate = self.margin_rates.get(norm_margin, 1.0)
        demand_mult = float(demand_multiplier) if demand_multiplier is not None else 1.0
        listing_fee = self.calculate_listing_fee(ref_price, norm_margin)

        asked_price = round(ref_price * rate * demand_mult)

        if rng is None:
            rng = random.Random()

        tolerance = rng.uniform(self.buyer_tolerance_min, self.buyer_tolerance_max)

        if rate <= tolerance:
            status = 'vendido'
            counter_offer = None
        elif rate <= tolerance + self.counter_zone:
            status = 'contraproposta'
            counter_offer = round(ref_price * demand_mult * tolerance)
        else:
            status = 'não vendido'
            counter_offer = None

        return {
            "item_name": item_name,
            "reference_price": ref_price,
            "base_price": ref_price,
            "margin_type": norm_margin,
            "margin_rate": rate,
            "demand_multiplier": demand_mult,
            "asked_price": asked_price,
            "final_price": asked_price,
            "listing_fee": listing_fee,
            "status": status,
            "counter_offer": counter_offer
        }

