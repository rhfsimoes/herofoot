"""
HeroFoot Sales Service.
Gerencia a negociação de excedentes no balcão e a resolução de contrapropostas.
"""

import uuid
from constants import normalize_margin, normalize_slot, normalize_quality, QUALITIES


class SalesService:
    def __init__(self, state, counter_sales, market_engine=None):
        self.state = state
        self.counter_sales = counter_sales
        self.market_engine = market_engine

    def list_item_for_sale(
        self,
        item_instance_id: str,
        *args,
        margin_type: str = None,
        demand_multiplier: float = None,
        rng=None,
        **kwargs
    ) -> dict:
        """Coloca um item no Balcão para venda com regras de precificação."""
        if args:
            first = args[0]
            if isinstance(first, (int, float)):
                if len(args) > 1 and isinstance(args[1], str):
                    margin_type = args[1]
            elif isinstance(first, str):
                margin_type = first
        if not margin_type:
            margin_type = kwargs.get("margin_type", "Preço Justo")

        item = next(
            (i for i in self.state.inventory if i.get("item_instance_id") == item_instance_id),
            None
        )
        if not item:
            return {"success": False, "message": "Ativo não localizado no almoxarifado."}

        # Não permite vender item equipado no loadout
        if self.state.is_equipped(item_instance_id):
            return {"success": False, "message": "Ativo em uso na expedição. Desequipe antes de anunciar."}

        # Verifica se o ativo foi rejeitado nesta mesma rodada (encalhado)
        current_day = getattr(self.state, "day", 1)
        encalhado_ate = item.get("encalhado_ate_semana")
        if encalhado_ate is not None and encalhado_ate >= current_day:
            return {
                "success": False,
                "message": "Ativo encalhado em vitrine nesta semana. Reanúncio bloqueado pela Câmara dos Mercadores até a próxima rodada.",
            }
        elif encalhado_ate is not None and encalhado_ate < current_day:
            item["encalhado"] = False
            item["encalhado_ate_semana"] = None

        if not self.counter_sales:
            return {"success": False, "message": "Módulo de vendas indisponível."}

        # Preço de referência é estritamente o market_value_base do item do inventário
        reference_price = item.get("market_value_base")
        if reference_price is None:
            reference_price = item.get("base_price", 100)
        reference_price = int(reference_price)

        norm_margin = normalize_margin(margin_type)

        # Taxa de vitrine e especulação da Câmara dos Mercadores (Listing Fee para Preço Abusivo)
        listing_fee = 0
        if hasattr(self.counter_sales, "calculate_listing_fee"):
            listing_fee = self.counter_sales.calculate_listing_fee(reference_price, norm_margin)
        elif norm_margin == "Preço Abusivo":
            listing_fee = max(10, round(reference_price * 0.08))

        if listing_fee > 0 and self.state.gold < listing_fee:
            return {
                "success": False,
                "message": f"Tesouraria insuficiente para recolher a taxa de vitrine e especulação da Câmara dos Mercadores (Custo: {listing_fee} Ouro).",
            }

        # Debita a taxa não reembolsável da tesouraria da guilda
        if listing_fee > 0:
            self.state.gold -= listing_fee

        # Multiplicador de demanda vindo do Boletim de Mercado
        if demand_multiplier is None:
            demand = 1.0
            if self.market_engine and getattr(self.market_engine, "bulletin", None):
                bulletin = self.market_engine.bulletin
                if bulletin and isinstance(bulletin, dict):
                    item_slot = normalize_slot(item.get("slot_type", item.get("slot", "")))
                    target_slot = normalize_slot(bulletin.get("target", ""))
                    if item_slot and target_slot and item_slot == target_slot:
                        demand = float(bulletin.get("multiplier", 1.0))
            demand_multiplier = demand
        else:
            demand_multiplier = float(demand_multiplier)

        result = self.counter_sales.list_item_for_sale(
            item_name=item.get("name", "Item"),
            reference_price=reference_price,
            margin_type=norm_margin,
            demand_multiplier=demand_multiplier,
            rng=rng,
        )

        status = result["status"]
        asked_price = int(result["asked_price"])
        ref_price = int(result["reference_price"])
        demand_mult = float(result["demand_multiplier"])

        if status == "vendido":
            self.state.inventory.remove(item)
            self.state.gold += asked_price
            self.state.weekly_sales_revenue = getattr(self.state, "weekly_sales_revenue", 0) + asked_price
            self.state.weekly_sales_count = getattr(self.state, "weekly_sales_count", 0) + 1
            self.state.weekly_sales_cash_collected = getattr(self.state, "weekly_sales_cash_collected", 0) + asked_price
            return {
                "success": True,
                "status": "vendido",
                "action": "sold",
                "gold_received": asked_price,
                "final_price": asked_price,
                "reference_price": ref_price,
                "asked_price": asked_price,
                "demand_multiplier": demand_mult,
                "listing_fee": listing_fee,
                "message": f"Venda aprovada a preço de tabela (+{asked_price} Moedas de Ouro).",
            }

        elif status == "não vendido":
            # Item permanece no inventário intacto com aviso corporativo
            item["encalhado_ate_semana"] = self.state.day
            item["encalhado"] = True
            if listing_fee > 0:
                msg = f"Ativo rejeitado pelo mercado por preço excessivo. Custas de vitrine de {listing_fee} Moedas de Ouro foram retidas pela junta comercial. O item retornou à custódia da guilda."
            else:
                msg = "Preço excessivo. Nenhum comprador manifestou interesse no ativo. O item retornou à custódia da guilda."
            return {
                "success": False,
                "status": "não vendido",
                "action": "rejected",
                "reference_price": ref_price,
                "asked_price": asked_price,
                "demand_multiplier": demand_mult,
                "listing_fee": listing_fee,
                "message": msg,
            }

        elif status == "contraproposta":
            offer_id = str(uuid.uuid4())
            counter_offer_val = int(result["counter_offer"])
            self.state.inventory.remove(item)
            self.state.pending_offers[offer_id] = {
                "price": counter_offer_val,
                "item": item,
            }
            return {
                "success": True,
                "status": "contraproposta",
                "action": "counter_offer",
                "offer_id": offer_id,
                "counter_offer": counter_offer_val,
                "reference_price": ref_price,
                "asked_price": asked_price,
                "demand_multiplier": demand_mult,
                "listing_fee": listing_fee,
                "message": f"Comprador realizou contraproposta de {counter_offer_val} Moedas de Ouro.",
            }

        return {"success": False, "message": "Estado de venda desconhecido."}

    def resolve_counter_offer(self, offer_id: str, accept: bool) -> dict:
        """Aceita ou rejeita contraproposta recebida."""
        if not offer_id or offer_id not in self.state.pending_offers:
            return {"success": False, "message": "Proposta não encontrada ou expirada."}

        offer = self.state.pending_offers.pop(offer_id)

        if accept:
            accepted_price = int(offer["price"])
            self.state.gold += accepted_price
            self.state.weekly_sales_revenue = getattr(self.state, "weekly_sales_revenue", 0) + accepted_price
            self.state.weekly_sales_count = getattr(self.state, "weekly_sales_count", 0) + 1
            self.state.weekly_sales_cash_collected = getattr(self.state, "weekly_sales_cash_collected", 0) + accepted_price
            return {
                "success": True,
                "accepted": True,
                "gold_received": accepted_price,
                "message": f"Contrato aceito. {accepted_price} Moedas de Ouro creditadas.",
            }
        else:
            self.state.inventory.append(offer["item"])
            return {
                "success": True,
                "accepted": False,
                "message": "Contraproposta rejeitada. Ativo retornou ao almoxarifado.",
            }

    def fulfill_vip_order(self, item_instance_id: str) -> dict:
        """Entrega encomenda VIP da Nobreza com validação de requisitos, liquidação e bonificação."""
        active_order = getattr(self.market_engine, "active_vip_order", None) if self.market_engine else None
        if not active_order:
            return {
                "success": False,
                "message": "Nenhum edital de encomenda VIP ativo no Boletim de Mercado.",
            }

        item = next(
            (i for i in self.state.inventory if i.get("item_instance_id") == item_instance_id),
            None
        )
        if not item:
            return {"success": False, "message": "Ativo não localizado no almoxarifado."}

        # Valida que o ativo não está equipado no loadout
        if hasattr(self.state, "is_equipped") and self.state.is_equipped(item_instance_id):
            return {
                "success": False,
                "message": "Ativo em uso na expedição. Desequipe antes de realizar a entrega do edital comissionado.",
            }

        # Valida conformidade do compartimento (slot)
        item_slot = normalize_slot(item.get("slot_type", item.get("slot", "")))
        target_slot = normalize_slot(active_order.get("target_slot", ""))
        if item_slot != target_slot:
            return {
                "success": False,
                "message": f"Laudo de conformidade técnica: o compartimento do ativo ({item_slot}) diverge da especificação do edital ({target_slot}).",
            }

        # Valida conformidade da qualidade
        quality_ranks = {q: i for i, q in enumerate(QUALITIES)}
        item_quality = normalize_quality(item.get("quality", "Normal"))
        required_quality = normalize_quality(active_order.get("required_quality", "Normal"))

        if quality_ranks.get(item_quality, 1) < quality_ranks.get(required_quality, 1):
            return {
                "success": False,
                "message": f"Laudo de conformidade técnica: o padrão de qualidade do ativo ({item_quality}) é inferior à especificação exigida pelo edital ({required_quality}).",
            }

        # Cálculo de recompensa com lastro no preço base
        reference_price = item.get("market_value_base")
        if reference_price is None:
            reference_price = item.get("base_price", 100)
        reference_price = int(reference_price)

        reward_multiplier = float(active_order.get("reward_multiplier", 1.0))
        gold_paid = round(reference_price * reward_multiplier)

        # Atualiza tesouraria e faturamento
        self.state.gold += gold_paid
        if hasattr(self.state, "weekly_sales_revenue"):
            self.state.weekly_sales_revenue = getattr(self.state, "weekly_sales_revenue", 0) + gold_paid

        # Credita reputação da contratante (cap em 100)
        confidence_reward = int(active_order.get("confidence_reward", 10))
        current_confidence = getattr(self.state, "contractor_confidence", 75)
        self.state.contractor_confidence = min(100, current_confidence + confidence_reward)

        # Baixa do ativo no almoxarifado
        self.state.inventory.remove(item)

        # Encerra o edital comissionado no mercado
        if self.market_engine:
            self.market_engine.active_vip_order = None

        return {
            "success": True,
            "gold_earned": gold_paid,
            "confidence_earned": confidence_reward,
            "message": "Encomenda VIP entregue com sucesso à Câmara dos Mercadores!",
        }

    def queue_auto_sale(self, item: dict) -> dict:
        """
        Liquida imediatamente um ativo produzido na linha de montagem autônoma a Preço Justo.
        Retorna o valor apurado para consolidação no extrato financeiro (DRE) da Fase 5.
        """
        sale_price = item.get("market_value_base")
        if sale_price is None:
            sale_price = item.get("base_price", 100)
        sale_price = int(sale_price)

        return {
            "success": True,
            "item_name": item.get("name"),
            "sale_price": sale_price,
            "gold": self.state.gold,
        }


