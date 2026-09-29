import sys
import os
import random

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from controller import GameController
from catalog import get_catalog
from constants import SLOTS, BRANCHES

def run_strategy(name, rounds=50, craft_strategy="casual", seed=42):
    random.seed(seed)
    c = GameController()
    c.state.world_seed = seed

    stats = {
        "gold_history": [],
        "items_sold": 0,
        "gold_from_sales": 0,
        "negative_weeks": 0,
        "crown_audits_passed": 0,
        "crown_audits_failed": 0,
        "weeks_below_200": 0,
        "points": 0,
        "listing_fees": 0,
        "crafting_costs": 0,
        "week_level_3": -1
    }

    start_gold = c.state.gold
    catalog = get_catalog()
    all_recipes = list(catalog.recipes.values()) if hasattr(catalog, "recipes") else []

    for r in range(1, rounds + 1):
        stats["gold_history"].append(c.state.gold)
        if c.state.gold < 0:
            stats["negative_weeks"] += 1
        if c.state.gold < 200:
            stats["weeks_below_200"] += 1

        current_day = c.state.day

        # FASE 1
        c.state.current_phase = 1
        c.phase_service.phase_1_cuidado()
        
        # Gestão de RH básica
        for hero in c.state.team:
            if hero.get("fatigue", 0) >= 85 and c.state.gold >= 500:
                c.hero_service.treat_hero_massage(hero["id"])
        
        pending = list(getattr(c.state, "pending_contract_renewals", []))
        for ren in pending:
            hid = ren.get("hero_id")
            bonus = ren.get("signing_bonus", 100)
            if c.state.gold >= bonus:
                c.hero_service.renew_contract(hid)

        while len(c.state.team) < 7:
            academy = getattr(c.state, "youth_academy", [])
            if not academy:
                c.hero_service.replenish_academy()
                academy = getattr(c.state, "youth_academy", [])
            if academy:
                best_youth = max(academy, key=lambda y: y.get("current_power", 40))
                c.hero_service.promote_youth_apprentice(best_youth["id"])
            else:
                break

        # FASE 2
        c.state.current_phase = 2

        if craft_strategy != "nenhuma" and c.state.gold >= 2500:
            target_branch = random.choice(BRANCHES)
            up_w = c.crafting_service.upgrade_workshop(target_branch)
            if up_w.get("success"):
                stats["crafting_costs"] += up_w.get("cost", 2500)
                if stats["week_level_3"] == -1 and any(level >= 3 for level in c.state.workshop_levels.values()):
                    stats["week_level_3"] = current_day
        
        active_bulletin = getattr(c.market_engine, "bulletin", None)
        bulletin_target = active_bulletin.get("target") if active_bulletin else None

        craft_limit = 0
        if craft_strategy == "casual":
            craft_limit = random.randint(1, 2)
        elif craft_strategy == "intensiva":
            craft_limit = 4
        
        # Comprar insumos
        if craft_limit > 0 and c.state.gold >= 250:
            mats_market = list(getattr(c.market_engine, "materials_for_sale", []))
            recipe_material_ids = {"mat_iron_ore", "mat_scaly_leather", "mat_mana_crystal", "mat_eucalyptus_herb", "mat_flour"}
            for m in mats_market:
                mid = m.get("material_id")
                if mid in recipe_material_ids and c.state.materials.get(mid, 0) < 6:
                    avail = m.get("available_quantity", 0)
                    to_buy = min(avail, 3)
                    cost = m.get("unit_price", 20) * to_buy
                    if to_buy > 0 and c.state.gold >= cost:
                        buy_res = c.market_service.buy_material(mid, quantity=to_buy)
                        if buy_res.get("success"):
                            stats["crafting_costs"] += cost

        # Forja
        known_recs = [rec for rec in all_recipes if rec.get("recipe_id") in getattr(c.state, "known_recipes", [])]
        if craft_strategy == "intensiva":
            known_recs.sort(key=lambda r: 100 if r.get("slot") == bulletin_target else r.get("market_value_base", 100), reverse=True)
        else:
            known_recs.sort(key=lambda r: r.get("market_value_base", 100), reverse=True)

        crafted_this_week = 0
        for rec in known_recs:
            if crafted_this_week >= craft_limit:
                break
            branch = rec.get("branch", "Ferragem")
            if c.state.workshop_levels.get(branch, 1) < rec.get("min_workshop_level", 1):
                continue
            ingrs = catalog.get_recipe_ingredients(rec["recipe_id"])

            while crafted_this_week < craft_limit:
                has_mats = all(c.state.materials.get(i["material_id"], 0) >= i["quantity"] for i in ingrs)
                if not has_mats:
                    break
                craft_res = c.crafting_service.craft_item(rec["recipe_id"], prefix_id=None, suffix_id=None)
                if craft_res.get("success"):
                    crafted_this_week += 1
                else:
                    break

        # Balcão
        unequipped_items = [it for it in c.state.inventory if not c.state.is_equipped(it.get("item_instance_id"))]
        if unequipped_items:
            def sales_priority(it):
                is_bull = 100 if it.get("slot_type") == bulletin_target else 0
                return is_bull + it.get("market_value_base", 100)
            unequipped_items.sort(key=sales_priority, reverse=True)

            sell_limit = 2 if craft_strategy == "casual" else (5 if craft_strategy == "intensiva" else 0)
            for item_to_sell in unequipped_items[:sell_limit]:
                iid = item_to_sell.get("item_instance_id")
                margin = "Preço Justo" if craft_strategy == "casual" else ("Promoção" if random.random() < 0.5 else "Preço Justo")
                
                sell_res = c.sales_service.list_item_for_sale(iid, margin_type=margin)
                if sell_res.get("listing_fee"):
                    stats["listing_fees"] += sell_res["listing_fee"]

                if sell_res.get("status") == "vendido":
                    stats["items_sold"] += 1
                    stats["gold_from_sales"] += sell_res.get("gold_received", 0)
                elif sell_res.get("status") == "contraproposta":
                    off_id = sell_res.get("offer_id")
                    c_price = sell_res.get("counter_offer", 0)
                    a_price = sell_res.get("asked_price", 1)
                    accept = (c_price / a_price) >= 0.60
                    res2 = c.sales_service.resolve_counter_offer(off_id, accept)
                    if res2.get("accepted"):
                        stats["items_sold"] += 1
                        stats["gold_from_sales"] += res2.get("gold_received", 0)

        # FASE 3
        c.state.current_phase = 3
        apt_heroes = [h for h in c.state.team if h.get("status") != "Afastado" and not h.get("injured", False)]
        def hero_effective_power(h):
            fat = h.get("fatigue", 0)
            if fat >= 50: return -100 + h.get("current_power", 50)
            return h.get("current_power", 50) * (1.0 - 0.30 * (fat / 100.0))
        apt_heroes.sort(key=hero_effective_power, reverse=True)
        new_starters = [h["id"] for h in apt_heroes[:6]]
        new_reserves = [h["id"] for h in apt_heroes[6:9]]
        
        new_loadout = {slot: None for slot in SLOTS}
        c.tactics_service.save_tactics(new_starters, new_reserves, new_loadout)

        # FASE 4
        c.state.current_phase = 4
        p4_res = c.phase_service.phase_4_dungeon()
        p_match = p4_res.get("player_match", {})
        p_score = p_match.get("player_pe", 0)
        r_score = p_match.get("rival_pe", 0)
        if p_score > r_score:
            stats["points"] += 3
        elif p_score == r_score:
            stats["points"] += 1

        # FASE 5
        c.state.current_phase = 5
        p5_res = c.phase_service.phase_5_results()

        caudit = p5_res.get("crown_audit")
        if caudit:
            if caudit.get("goals_completed", 0) >= caudit.get("min_goals_to_pass", 2):
                stats["crown_audits_passed"] += 1
            else:
                stats["crown_audits_failed"] += 1

        c.state.current_phase = 1
        c.state.day += 1
        c.state.week = c.state.day
        c.market_engine.refresh_market(c.state.day)
        c.hero_service.refresh_transfer_market()
        c.hero_service.replenish_academy()

    stats["final_gold"] = c.state.gold
    stats["min_gold"] = min(stats["gold_history"])
    return stats

def main():
    print("Iniciando auditoria v0.5.0...")
    res_a = run_strategy("Casual", 50, "casual")
    res_b = run_strategy("Intensiva", 50, "intensiva")
    res_c = run_strategy("Sem Forja", 50, "nenhuma")

    for name, res in [("Casual", res_a), ("Intensiva", res_b), ("Sem Forja", res_c)]:
        print(f"\n--- Estratégia: {name} ---")
        print(f"Ouro final: {res['final_gold']}")
        print(f"Ouro mínimo: {res['min_gold']}")
        print(f"Semanas Negativas: {res['negative_weeks']}")
        print(f"Risco de Falência (Semanas < 200): {res['weeks_below_200']} ({(res['weeks_below_200']/50)*100:.1f}%)")
        print(f"Pontos na Liga (Aprox): {res['points']}")
        print(f"Auditorias (Pass/Fail): {res['crown_audits_passed']}/{res['crown_audits_failed']}")
        
        receita_media = (res['gold_from_sales'] / res['items_sold']) if res['items_sold'] > 0 else 0
        print(f"Receita média por item vendido: {receita_media:.1f}")
        print(f"Semana para Nível 3 de Bancada: {res['week_level_3'] if res['week_level_3'] > 0 else 'Não alcançado'}")
        
        lucro_semanal = (res['final_gold'] - 1000) / 50
        print(f"Lucro médio por semana: {lucro_semanal:.1f}")
        
        # Breakeven calc
        start_gold = res['gold_history'][0]
        breakeven_week = -1
        for i in range(len(res['gold_history'])):
            if all(g > start_gold for g in res['gold_history'][i:]):
                breakeven_week = i + 1
                break
        print(f"Semanas para breakeven: {breakeven_week if breakeven_week > 0 else 'Não alcançado'}")

if __name__ == '__main__':
    main()
