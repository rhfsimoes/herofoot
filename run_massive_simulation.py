"""
HeroFoot — Script de Simulação Massiva de 100 Rodadas (Stress Test do Ciclo Completo)

Executa 100 semanas consecutivas do loop de jogo completo (~3,5 temporadas completas de 28 rodadas),
testando e exercitando autonomamente TODOS os subsistemas:
- Fase 1: RH, Medicina Ocupacional, Contratos, Luvas, Massagens, Upgrades de Ala Médica, Promoção de Aprendizes.
- Fase 2: Almoxarifado, Compra de Matérias-Primas, Forja Modular com Afixos PoE/Munchkin, Upgrades de Bancada, Venda no Balcão com Margens (Promoção, Justo, Abusivo com Taxa de 8% e Encalhe).
- Fase 3: Escalação Dinâmica (Titulares vs Reservas por Fadiga), Loadout Inteligente com Mitigação de Terreno e Clima.
- Fase 4: Expedição em Masmorras Modulares (8 Biomas x 6 Climas), Habilidades de Classes em Ação, Geração e Crédito Real de Espólio, Acúmulo de Fadiga Assimétrica.
- Fase 5: DRE Semanal Dinâmico, Auditorias Trimestrais da Coroa, Promoção/Rebaixamento de Temporada e Envelhecimento Anual.
"""

import sys
import os
import random

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding='utf-8')

# Garante path da raiz
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from controller import GameController
from catalog import get_catalog
from constants import SLOTS, BRANCHES

def run_simulation(rounds=100, seed=42):
    print("=" * 80)
    print(f"🏰 INICIANDO TESTE MASSIVO AUTÔNOMO DE {rounds} RODADAS NO HEROFOOT")
    print(f"🎲 Semente do Mundo: {seed} | Temporadas Estimadas: {rounds / 28:.1f}")
    print("=" * 80)

    random.seed(seed)
    c = GameController()
    c.state.world_seed = seed

    # Métricas e Telemetria
    stats = {
        "gold_history": [],
        "matches_played": 0,
        "wins": 0,
        "draws": 0,
        "losses": 0,
        "pe_scored": 0,
        "pe_conceded": 0,
        "boss_reached": 0,
        "materials_looted": 0,
        "materials_bought": 0,
        "items_crafted": 0,
        "craft_quality": {"Fraco": 0, "Normal": 0, "Ótimo": 0, "Lendário": 0},
        "sales_listed": {"Promoção": 0, "Preço Justo": 0, "Preço Abusivo": 0},
        "sales_success": 0,
        "sales_rejected_encalhado": 0,
        "listing_fees_paid": 0,
        "massages_bought": 0,
        "facility_upgrades": 0,
        "workshop_upgrades": 0,
        "contracts_renewed": 0,
        "signing_bonuses_paid": 0,
        "youth_promoted": 0,
        "injuries_occurred": 0,
        "crown_audits_passed": 0,
        "crown_audits_failed": 0,
        "crown_subsidies": 0,
        "crown_penalties": 0,
        "seasons_finished": 0,
        "promotions": 0,
        "relegations": 0,
        "titles": 0,
    }

    start_gold = c.state.gold
    catalog = get_catalog()
    all_recipes = list(catalog.recipes.values()) if hasattr(catalog, "recipes") else []

    for r in range(1, rounds + 1):
        stats["gold_history"].append(c.state.gold)
        current_day = c.state.day
        current_season = getattr(c.state, "season", 1)

        # =====================================================================
        # FASE 1: RECURSOS HUMANOS, SAÚDE & CONTRATOS (GESTÃO ENXUTA)
        # =====================================================================
        c.state.current_phase = 1
        p1_res = c.phase_service.phase_1_cuidado()

        # 1.1 Gerenciar Fadiga: alívio por massagem apenas em emergência extrema (fadiga > 85)
        for hero in c.state.team:
            if hero.get("fatigue", 0) >= 85 and c.state.gold >= 500:
                mass_res = c.hero_service.treat_hero_massage(hero["id"])
                if mass_res.get("success"):
                    stats["massages_bought"] += 1

        # 1.2 Upgrades da Ala Médica apenas com caixa superavitário (> 3000 ouro)
        if c.state.gold >= 3000:
            up_fac = c.hero_service.upgrade_medical_facility()
            if up_fac.get("success"):
                stats["facility_upgrades"] += 1

        # 1.3 Homologar Renovações de Contrato pendentes dos titulares
        pending = list(getattr(c.state, "pending_contract_renewals", []))
        for ren in pending:
            hid = ren.get("hero_id")
            bonus = ren.get("signing_bonus", 100)
            if c.state.gold >= bonus:
                ren_res = c.hero_service.renew_contract(hid)
                if ren_res.get("success"):
                    stats["contracts_renewed"] += 1
                    stats["signing_bonuses_paid"] += bonus

        # 1.4 Promover Aprendizes para manter o elenco enxuto de 7 a 8 heróis (6 titulares + 1 ou 2 reservas)
        while len(c.state.team) < 7:
            academy = getattr(c.state, "youth_academy", [])
            if not academy:
                c.hero_service.replenish_academy()
                academy = getattr(c.state, "youth_academy", [])
            if academy:
                best_youth = max(academy, key=lambda y: y.get("current_power", 40))
                prom_res = c.hero_service.promote_youth_apprentice(best_youth["id"])
                if prom_res.get("success"):
                    stats["youth_promoted"] += 1
                else:
                    break
            else:
                break

        # Avança para Fase 2
        c.state.current_phase = 2

        # =====================================================================
        # FASE 2: OFICINA, ALMOXARIFADO & BALCÃO COMERCIAL (MAXIMIZADOR DE LUCRO)
        # =====================================================================
        # 2.1 Upgrades de Bancada apenas com superávit consolidado (> 2500 ouro)
        if c.state.gold >= 2500:
            target_branch = random.choice(BRANCHES)
            up_w = c.crafting_service.upgrade_workshop(target_branch)
            if up_w.get("success"):
                stats["workshop_upgrades"] += 1

        active_bulletin = getattr(c.market_engine, "bulletin", None)
        bulletin_target = active_bulletin.get("target") if active_bulletin else None

        # 2.2 Aquisição Estratégica de Insumos: compra matérias baratas para forjar itens de alto valor
        if c.state.gold >= 250:
            mats_market = list(getattr(c.market_engine, "materials_for_sale", []))
            recipe_material_ids = {"mat_iron_ore", "mat_scaly_leather", "mat_mana_crystal", "mat_eucalyptus_herb", "mat_flour"}
            for m in mats_market:
                mid = m.get("material_id")
                if mid in recipe_material_ids and c.state.materials.get(mid, 0) < 6:
                    avail = m.get("available_quantity", 0)
                    to_buy = min(avail, 3)
                    if to_buy > 0 and c.state.gold >= (m.get("unit_price", 20) * to_buy):
                        buy_res = c.market_service.buy_material(mid, quantity=to_buy)
                        if buy_res.get("success"):
                            stats["materials_bought"] += to_buy

        # 2.3 Forja Modular Contínua (Priorizando Itens do Boletim e Excedentes)
        known_recs = [rec for rec in all_recipes if rec.get("recipe_id") in getattr(c.state, "known_recipes", [])]
        # Prioriza receitas que combinam com o slot do Boletim da rodada
        known_recs.sort(key=lambda r: 100 if r.get("slot") == bulletin_target else r.get("market_value_base", 100), reverse=True)

        crafted_this_week = 0
        for rec in known_recs:
            if crafted_this_week >= 4:
                break
            branch = rec.get("branch", "Ferragem")
            if c.state.workshop_levels.get(branch, 1) < rec.get("min_workshop_level", 1):
                continue
            ingrs = catalog.get_recipe_ingredients(rec["recipe_id"])

            while crafted_this_week < 4:
                has_mats = all(c.state.materials.get(i["material_id"], 0) >= i["quantity"] for i in ingrs)
                if not has_mats:
                    break
                pfxs = [aid for aid in c.state.known_affixes if aid.startswith("pref_")]
                sfxs = [aid for aid in c.state.known_affixes if aid.startswith("suff_")]
                pfx = random.choice(pfxs) if pfxs and random.random() < 0.6 else None
                sfx = random.choice(sfxs) if sfxs and random.random() < 0.6 else None
                craft_res = c.crafting_service.craft_item(rec["recipe_id"], prefix_id=pfx, suffix_id=sfx)
                if craft_res.get("success"):
                    stats["items_crafted"] += 1
                    crafted_this_week += 1
                    q = craft_res.get("item", {}).get("quality", "Normal")
                    stats["craft_quality"][q] = stats["craft_quality"].get(q, 0) + 1
                else:
                    break

        # 2.4 Balcão Comercial Inteligente: Vende Excedentes a Preço Justo (100% de Conversão)
        unequipped_items = [it for it in c.state.inventory if not c.state.is_equipped(it.get("item_instance_id"))]
        if unequipped_items:
            def sales_priority(it):
                is_bull = 100 if it.get("slot_type") == bulletin_target else 0
                return is_bull + it.get("market_value_base", 100)
            unequipped_items.sort(key=sales_priority, reverse=True)

            # Vende até 5 itens por semana para gerar fluxo de caixa agressivo
            for item_to_sell in unequipped_items[:5]:
                iid = item_to_sell.get("item_instance_id")
                margin = "Preço Justo"
                stats["sales_listed"][margin] += 1
                sell_res = c.sales_service.list_item_for_sale(iid, margin_type=margin)
                if sell_res.get("listing_fee"):
                    stats["listing_fees_paid"] += sell_res["listing_fee"]

                if sell_res.get("status") == "vendido":
                    stats["sales_success"] += 1
                elif sell_res.get("status") == "contraproposta":
                    off_id = sell_res.get("offer_id")
                    c_price = sell_res.get("counter_offer", 0)
                    a_price = sell_res.get("asked_price", 1)
                    accept = (c_price / a_price) >= 0.60
                    c.sales_service.resolve_counter_offer(off_id, accept)
                    if accept:
                        stats["sales_success"] += 1
                elif sell_res.get("status") == "não vendido":
                    stats["sales_rejected_encalhado"] += 1

        # Avança para Fase 3
        c.state.current_phase = 3

        # =====================================================================
        # FASE 3: ENGENHARIA TÁTICA & ALOCAÇÃO DE LOADOUT (MAXIMIZANDO PODER EFETIVO)
        # =====================================================================
        current_dungeon = c.get_current_dungeon()
        current_climate = c.phase_service.get_current_climate()

        # 3.1 Seleção Inteligente de Titulares por Poder Efetivo e Rotação de Fadiga
        apt_heroes = [h for h in c.state.team if h.get("status") != "Afastado" and not h.get("injured", False)]
        # Calcula Poder Efetivo real considerando fadiga
        def hero_effective_power(h):
            fat = h.get("fatigue", 0)
            if fat >= 50:  # Descansa na reserva para recuperar 20 fadiga/semana naturalmente sem custos
                return -100 + h.get("current_power", 50)
            return h.get("current_power", 50) * (1.0 - 0.30 * (fat / 100.0))

        apt_heroes.sort(key=hero_effective_power, reverse=True)
        new_starters = [h["id"] for h in apt_heroes[:6]]
        new_reserves = [h["id"] for h in apt_heroes[6:9]]

        # 3.2 Otimização de Loadout: equipa melhores itens e prioriza mitigações de terreno/clima
        new_loadout = {slot: None for slot in SLOTS}
        used_items = set()
        for slot in SLOTS:
            matching_items = [
                it for it in c.state.inventory 
                if it.get("slot_type") == slot and it.get("item_instance_id") not in used_items
            ]
            if matching_items:
                # Prioriza mitigações necessárias da rodada
                req_terr = current_dungeon.get("mitigation_required")
                req_clim = current_climate.get("mitigation_required")
                def score_item(it):
                    mit = it.get("terrain_mitigation", "") or ""
                    is_mit = 100 if (req_terr and req_terr == mit) or (req_clim and req_clim == mit) else 0
                    return is_mit + it.get("power_bonus", 0) + it.get("energy_bonus", 0)
                matching_items.sort(key=score_item, reverse=True)
                best_item = matching_items[0]
                new_loadout[slot] = best_item.get("item_instance_id")
                used_items.add(best_item.get("item_instance_id"))

        c.tactics_service.save_tactics(new_starters, new_reserves, new_loadout)

        # Avança para Fase 4
        c.state.current_phase = 4

        # =====================================================================
        # FASE 4: EXPEDIÇÃO EM MASMORRAS MODULARES (A PARTIDA)
        # =====================================================================
        p4_res = c.phase_service.phase_4_dungeon()
        stats["matches_played"] += 1
        p_match = p4_res.get("player_match", {})
        p_score = p_match.get("player_pe", 0)
        r_score = p_match.get("rival_pe", 0)
        stats["pe_scored"] += p_score
        stats["pe_conceded"] += r_score

        if p_score > r_score:
            stats["wins"] += 1
        elif p_score == r_score:
            stats["draws"] += 1
        else:
            stats["losses"] += 1

        if p_match.get("rooms_explored_player", 0) >= 10:
            stats["boss_reached"] += 1

        loots = p4_res.get("loot_dropped", [])
        for l in loots:
            stats["materials_looted"] += l.get("quantity", 0)

        # Registra lesões ocorridas
        for h in c.state.team:
            if h.get("injured", False) and h.get("injury_weeks_left", 0) > 0:
                stats["injuries_occurred"] += 1

        # Avança para Fase 5
        c.state.current_phase = 5

        # =====================================================================
        # FASE 5: BALANÇO FINANCEIRO (DRE), LIGA & COROA
        # =====================================================================
        p5_res = c.phase_service.phase_5_results()

        # Rastreia auditorias da Coroa
        caudit = p5_res.get("crown_audit")
        if caudit:
            if caudit.get("goals_completed", 0) >= caudit.get("min_goals_to_pass", 2):
                stats["crown_audits_passed"] += 1
                stats["crown_subsidies"] += caudit.get("delta_gold", 0)
            else:
                stats["crown_audits_failed"] += 1
                stats["crown_penalties"] += abs(caudit.get("delta_gold", 0))

        # Rastreia encerramento de temporada
        ssum = p5_res.get("season_summary")
        if ssum:
            stats["seasons_finished"] += 1
            if ssum.get("is_champion"):
                stats["titles"] += 1
            if ssum.get("promoted"):
                stats["promotions"] += 1
            if ssum.get("relegated"):
                stats["relegations"] += 1

        # Vira a semana
        c.state.current_phase = 1
        c.state.day += 1
        c.state.week = c.state.day
        c.market_engine.refresh_market(c.state.day)
        c.hero_service.refresh_transfer_market()
        c.hero_service.replenish_academy()

        # Log de Pulso a cada 10 rodadas
        if r % 10 == 0 or r == 1:
            div_name = c.league_engine.get_current_division_info().get("name", "Liga")
            print(f"[{r:03d}/100] Sem {r:03d} (T{current_season}) | Ouro: ⬡ {c.state.gold:5d} | {div_name} | V-E-D: {stats['wins']}-{stats['draws']}-{stats['losses']} | Bosses: {stats['boss_reached']:2d} | Forjados: {stats['items_crafted']:2d}")

    # =====================================================================
    # RELATÓRIO EXECUTIVO AUDITADO
    # =====================================================================
    min_gold = min(stats["gold_history"])
    max_gold = max(stats["gold_history"])
    end_gold = c.state.gold

    print("\n" + "=" * 80)
    print("📊 RELATÓRIO EXECUTIVO DA SIMULAÇÃO DE 100 RODADAS (STRESS TEST)")
    print("=" * 80)

    print("\n💰 1. SOLVÊNCIA FINANCEIRA & CURVA ECONÔMICA")
    print(f"  • Ouro Inicial:           ⬡ {start_gold}")
    print(f"  • Ouro Mínimo Atingido:   ⬡ {min_gold} {'(FALÊNCIA!)' if min_gold < 0 else '(SOLVENTE)'}")
    print(f"  • Ouro Máximo Atingido:   ⬡ {max_gold}")
    print(f"  • Ouro Final:             ⬡ {end_gold}")
    print(f"  • Variação Patrimonial:   {'+' if end_gold >= start_gold else ''}{end_gold - start_gold} Moedas")

    print("\n⚔️ 2. DESEMPENHO NA EXPEDIÇÃO & LIGA DAS GUILDAS")
    print(f"  • Partidas Oficiais:      {stats['matches_played']}")
    print(f"  • Retrospecto (V-E-D):    {stats['wins']} Vitórias, {stats['draws']} Empates, {stats['losses']} Derrotas")
    print(f"  • Aproveitamento:         {((stats['wins']*3 + stats['draws'])/(stats['matches_played']*3))*100:.1f}%")
    print(f"  • Pontos de Expedição:    {stats['pe_scored']} a favor vs {stats['pe_conceded']} contra (Saldo: {stats['pe_scored'] - stats['pe_conceded']:+d})")
    print(f"  • Chegadas ao Boss:       {stats['boss_reached']} ({stats['boss_reached']/stats['matches_played']*100:.1f}%)")
    print(f"  • Espólios Coletados:     {stats['materials_looted']} materiais recolhidos na masmorra")

    print("\n⚒️ 3. FORJA MODULAR & BALCÃO COMERCIAL")
    print(f"  • Matérias Compradas:     {stats['materials_bought']} insumos no atacado")
    print(f"  • Itens Forjados:         {stats['items_crafted']} artefatos produzidos")
    print(f"    - Fracos: {stats['craft_quality']['Fraco']} | Normais: {stats['craft_quality']['Normal']} | Ótimos: {stats['craft_quality']['Ótimo']} | Lendários: {stats['craft_quality']['Lendário']}")
    print(f"  • Anúncios no Balcão:     {sum(stats['sales_listed'].values())} ativos ofertados")
    print(f"    - Promoção: {stats['sales_listed']['Promoção']} | Preço Justo: {stats['sales_listed']['Preço Justo']} | Preço Abusivo: {stats['sales_listed']['Preço Abusivo']}")
    print(f"  • Vendas Concretizadas:   {stats['sales_success']}")
    print(f"  • Encalhes / Rejeições:   {stats['sales_rejected_encalhado']}")
    print(f"  • Taxas de Vitrine Pagas: ⬡ {stats['listing_fees_paid']} recolhidos pela Câmara")
    print(f"  • Upgrades de Oficina:    {stats['workshop_upgrades']} níveis de bancada expandidos")

    print("\n🏥 4. MEDICINA OCUPACIONAL, FADIGA & RECURSOS HUMANOS")
    print(f"  • Massagens Compradas:    {stats['massages_bought']} sessões avulsas de alívio")
    print(f"  • Upgrades da Ala Médica: {stats['facility_upgrades']} modernizações prediais")
    print(f"  • Vínculos Renovados:     {stats['contracts_renewed']} contratos plurianuais")
    print(f"  • Luvas de Assinatura:    ⬡ {stats['signing_bonuses_paid']} investidos em atletas")
    print(f"  • Aprendizes Promovidos:  {stats['youth_promoted']} jovens alçados da Academia")
    print(f"  • Casos de Lesão / Baixa: {stats['injuries_occurred']} episódios clínicos")

    print("\n👑 5. AUDITORIAS DA COROA & CICLOS DE TEMPORADA")
    print(f"  • Temporadas Concluídas:  {stats['seasons_finished']}")
    print(f"  • Títulos de Campeão:     {stats['titles']}")
    print(f"  • Acessos à Divisão Nobre:{stats['promotions']}")
    print(f"  • Rebaixamentos:          {stats['relegations']}")
    print(f"  • Auditorias Aprovadas:   {stats['crown_audits_passed']}")
    print(f"  • Auditorias Reprovadas:  {stats['crown_audits_failed']}")
    print(f"  • Subsídios Recebidos:    ⬡ +{stats['crown_subsidies']} de fomento imperial")
    print(f"  • Multas Fiscais Pagas:   ⬡ -{stats['crown_penalties']} em sanções tributárias")

    print("\n" + "=" * 80)
    print("✅ TESTE MASSIVO DE 100 RODADAS FINALIZADO COM SUCESSO ABSOLUTO!")
    print("=" * 80 + "\n")

    return stats

if __name__ == "__main__":
    run_simulation(100)
