"""
HeroFoot Phase Service.
Gerencia a execução e transição das 5 fases do ciclo semanal.
"""

import os
import json
import random
import copy
from typing import Optional, List, Dict, Any
from balance import get_balance
from constants import normalize_slot


class PhaseService:
    def __init__(self, state, dungeons, league_engine, market_engine, match_engine=None, hero_service=None, event_service=None, crafting_service=None):
        self.state = state
        self.dungeons = dungeons
        self.league_engine = league_engine
        self.market_engine = market_engine
        self.match_engine = match_engine
        self.crafting_service = crafting_service
        if hero_service:
            self.hero_service = hero_service
        else:
            from services.hero_service import HeroService
            self.hero_service = HeroService(self.state)
        if event_service:
            self.event_service = event_service
        else:
            from services.event_service import EventService
            self.event_service = EventService(self.state)

    def get_current_dungeon(self) -> dict:
        if not self.dungeons:
            dungeons_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'dungeons_seed.json')
            if os.path.exists(dungeons_path):
                with open(dungeons_path, 'r', encoding='utf-8') as f:
                    self.dungeons = json.load(f)
            else:
                self.dungeons = []
        if not self.dungeons:
            return {}
        idx = (self.state.day - 1) % len(self.dungeons)
        return self.dungeons[idx]

    def get_current_climate(self) -> dict:
        """Determina o clima da semana de forma determinística a partir de world_seed, dia/semana e tag climate."""
        from match_engine import get_climates_data, get_default_climate
        climates = get_climates_data()
        if not climates:
            return get_default_climate()

        world_seed = getattr(self.state, "world_seed", 42)
        day_or_week = self.state.day if hasattr(self.state, "day") else getattr(self.state, "week", 1)
        climate_seed = hash((world_seed, day_or_week, "climate"))
        climate_rng = random.Random(climate_seed)
        return climate_rng.choice(climates)

    def advance_phase(self, rng=None) -> dict:
        phase = self.state.current_phase
        result = {}

        if phase == 1:
            result = self.phase_1_cuidado()
            self.state.current_phase = 2
            if hasattr(self, "hero_service"):
                if not getattr(self.state, "transfer_market_listings", []):
                    self.hero_service.refresh_transfer_market()
        elif phase == 2:
            self.state.current_phase = 3
            result = {"phase": 2, "message": "Operações de oficina e mercado encerradas."}
        elif phase == 3:
            result = self.phase_3_tactics()
            self.state.current_phase = 4
        elif phase == 4:
            result = self.phase_4_dungeon()
            self.state.current_phase = 5
        elif phase == 5:
            result = self.phase_5_results()
            self.state.current_phase = 1
            self.state.day += 1
            self.state.week = self.state.day
            self.market_engine.refresh_market(self.state.day)
            if hasattr(self, "hero_service"):
                self.hero_service.refresh_transfer_market()
                if hasattr(self.hero_service, "train_youth_academy_weekly"):
                    self.hero_service.train_youth_academy_weekly(rng=rng)
                self.hero_service.replenish_academy()

            # Transição semanal para Fase 1: Reset de cotas spot e entrega de remessas B2B
            if hasattr(self.state, "reset_weekly_spot_purchases"):
                self.state.reset_weekly_spot_purchases()
            b2b_delivered = self.deliver_b2b_shipments()
            if b2b_delivered:
                result["b2b_shipments_delivered"] = b2b_delivered

            # Sorteio de incidente corporativo com 50% de chance
            if hasattr(self, "event_service") and self.event_service:
                balance = get_balance()
                event_chance = balance.get("events", {}).get("weekly_trigger_chance", 0.5)
                event_rng = rng if rng is not None else random.Random()
                if event_rng.random() < event_chance:
                    evt = self.event_service.roll_weekly_event("phase_1", rng=event_rng)
                    if evt:
                        result["active_event"] = evt

        result["current_phase"] = self.state.current_phase
        result["day"] = self.state.day
        result["week"] = self.state.week
        result["season"] = getattr(self.state, "season", 1)
        return result

    def deliver_b2b_shipments(self) -> list:
        """
        Entrega as remessas semanais dos contratos B2B vigentes diretamente em warehouse_parts.
        """
        delivered = []
        contracts = getattr(self.state, "active_b2b_contracts", [])
        for contract in contracts:
            shipment = contract.get("weekly_shipment", [])
            for item in shipment:
                pid = item.get("part_id")
                qty = item.get("quantity", 1)
                if pid and qty > 0:
                    self.state.add_warehouse_part(pid, qty)
                    delivered.append({
                        "contract_id": contract.get("contract_id"),
                        "part_id": pid,
                        "quantity": qty
                    })
        return delivered

    def advance_to_phase_1(self, rng=None) -> dict:
        """Executa a transição explícita para a Fase 1 com entrega de remessas B2B."""
        shipments = self.deliver_b2b_shipments()
        return {
            "phase": 1,
            "b2b_shipments_delivered": shipments,
            "warehouse_parts": getattr(self.state, "warehouse_parts", {}),
        }

    def phase_1_cuidado(self) -> dict:
        """Fase 1: Recuperação de fadiga em instalações médicas, atestados e altas."""
        report = []
        balance = get_balance()
        fatigue_cfg = balance.get("fatigue", {})
        
        fac_data = self.hero_service.get_medical_facilities_data() if hasattr(self, "hero_service") else {}
        recovery_val = fac_data.get("passive_recovery", fatigue_cfg.get("recovery_per_week", 20))
        starter_recovery_val = fatigue_cfg.get("starter_recovery_per_week", 5)
        recov_thresh = fatigue_cfg.get("recovered_threshold", 50)
        facility_name = fac_data.get("facility_name", "Tenda de Curativos")
        last_starters = set(getattr(self.state, "last_expedition_starters", []))

        for hero in self.state.team:
            if hero.get("fatigue", 0) > 0:
                is_starter = hero.get("id") in last_starters
                actual_recovery = starter_recovery_val if is_starter else recovery_val
                hero["fatigue"] = max(0, hero["fatigue"] - actual_recovery)
                if hero.get("status") == "Fatigado" and hero["fatigue"] < recov_thresh:
                    hero["status"] = "Apto"
                if is_starter:
                    report.append(f"{hero.get('name', 'Herói')} em repouso pós-expedição (-{actual_recovery} fadiga residual).")
                else:
                    report.append(f"{hero.get('name', 'Herói')} realizou repouso em '{facility_name}' (-{actual_recovery} fadiga).")

            if hero.get("injured", False) and hero.get("injury_weeks_left", 0) > 0:
                hero["injury_weeks_left"] -= 1
                if hero["injury_weeks_left"] == 0:
                    hero["injured"] = False
                    hero["status"] = "Apto"
                    report.append(f"{hero.get('name', 'Herói')} recebeu alta pericial e está apto para expedições.")

        # Auditoria de conformidade tática: saneamento de heróis inaptos da titularidade
        for hid in list(self.state.starters):
            hero = self.state.hero_by_id(hid)
            if not hero or hero.get("injured", False) or hero.get("status") in ("Afastado", "Falecido"):
                self.state.starters.remove(hid)
                hname = hero.get("name", hid) if hero else hid
                report.append(f"Ajuste na escala: colaborador '{hname}' desconvocado da titularidade por incapacidade funcional ou rescisão contratual.")

        # Auditoria de conformidade tática: saneamento de heróis inaptos da reserva
        for hid in list(getattr(self.state, "reserves", [])):
            hero = self.state.hero_by_id(hid)
            if not hero or hero.get("injured", False) or hero.get("status") in ("Afastado", "Falecido"):
                self.state.reserves.remove(hid)
                hname = hero.get("name", hid) if hero else hid
                report.append(f"Ajuste na escala: colaborador '{hname}' desconvocado da reserva por incapacidade funcional ou rescisão contratual.")

        # Auditoria patrimonial: saneamento do loadout de compartimentos
        for slot, item in list(self.state.loadout.items()):
            if item:
                item_id = item.get("item_instance_id") if isinstance(item, dict) else item
                matching = next((i for i in self.state.inventory if i.get("item_instance_id") == item_id), None)
                item_name = matching.get("name", item_id) if matching else (item.get("name", item_id) if isinstance(item, dict) else item_id)
                norm_slot = normalize_slot(slot)

                if not matching:
                    self.state.loadout[slot] = None
                    report.append(f"Auditoria patrimonial: item '{item_name}' desvinculado do compartimento '{slot}' por indisponibilidade no almoxarifado.")
                else:
                    matching_slot = normalize_slot(matching.get("slot_type", matching.get("slot", "")))
                    if matching_slot != norm_slot:
                        self.state.loadout[slot] = None
                        report.append(f"Auditoria patrimonial: item '{item_name}' desvinculado do compartimento '{slot}' por incompatibilidade de categoria.")

        return {"phase": 1, "report": report}

    def phase_3_tactics(self) -> dict:
        """Fase 3: Confirmação de escalação da equipe."""
        apt_count = len(self.state.starters)
        return {
            "phase": 3,
            "report": [f"Força-tarefa autorizada para a Semana {self.state.day}. Colaboradores titulares: {apt_count}."]
        }

    def phase_4_dungeon(self) -> dict:
        """
        Fase 4: Simulação da masmorra com cálculo real de Poder Efetivo, 5 Slots,
        mitigação de terreno e clima dinâmico da rodada, habilidades de classe e consumo de consumíveis.
        """
        from match_engine import (
            calculate_team_base_power,
            calculate_slot_bonus,
            check_terrain_mitigation,
            check_climate_mitigation,
            calculate_average_agi,
        )

        dungeon = self.get_current_dungeon()
        dungeon_name = dungeon.get("name", "Masmorra Desconhecida")
        required_mitigation = dungeon.get("mitigation_required")

        climate = self.get_current_climate()
        climate_name = climate.get("name", "Céu Limpo")
        required_climate_mitigation = climate.get("mitigation_required")

        # Determinismo baseado no seed global da campanha e rodada
        world_seed = getattr(self.state, "world_seed", 42)
        if not hasattr(self.state, "world_seed"):
            self.state.world_seed = world_seed
        week = getattr(self.state, "week", self.state.day)
        round_seed = hash((world_seed, week, "expedition"))
        round_rng = random.Random(round_seed)

        balance = get_balance()

        fixture = self.league_engine.get_player_match(self.state.day)
        rival_name = "Guilda Rival"
        if fixture:
            rival_name = fixture["away_name"] if fixture["home_is_player"] else fixture["home_name"]

        # 1. Poder Base e AGI média da equipe titular escalada
        starters_limit = balance.get("party", {}).get("starters", 6)
        starter_heroes = [h for h in self.state.team if h["id"] in self.state.starters]
        if not starter_heroes:
            starter_heroes = [h for h in self.state.team if h.get("status") == "Apto"][:starters_limit]

        base_power = calculate_team_base_power(starter_heroes, balance)
        player_agi = calculate_average_agi(starter_heroes)

        # 2. Bônus de Loadout dos 5 Slots e Mitigações de Terreno e Clima
        bonus_slots_power = calculate_slot_bonus(self.state.loadout, balance)
        has_terrain_mitigation = check_terrain_mitigation(self.state.loadout, required_mitigation)
        has_climate_mitigation = check_climate_mitigation(self.state.loadout, required_climate_mitigation)

        consumable_item = self.state.loadout.get("Provisão Logística")
        consumable_energy_bonus = 0
        if consumable_item and isinstance(consumable_item, dict):
            consumable_energy_bonus = consumable_item.get("energy_bonus", consumable_item.get("energy_restore", 0))

        # Bônus corporativo temporário de suprimentos
        supplies_bonus = getattr(self.state, "supplies_bonus", 0)
        if supplies_bonus:
            consumable_energy_bonus += supplies_bonus
            self.state.supplies_bonus = 0

        temporary_power_pct_modifier = float(getattr(self.state, "temporary_power_pct_modifier", 0.0))
        if temporary_power_pct_modifier:
            self.state.temporary_power_pct_modifier = 0.0

        # 3. Parâmetros da equipe Rival
        rival_guild_info = next((g for g in self.league_engine.guilds if g["name"] == rival_name), None)
        rival_base_power = rival_guild_info["power_rating"] if rival_guild_info else 60
        rival_cfg = balance.get("rival", {})
        rival_slot_bonus = rival_cfg.get("default_slot_bonus", 6)
        rival_mit_prob = rival_cfg.get("mitigation_probability", 0.5)
        rival_has_mitigation = (round_rng.random() < rival_mit_prob) if required_mitigation else True
        rival_climate_mit = (round_rng.random() < rival_mit_prob) if required_climate_mitigation else True
        rival_agi = rival_guild_info.get("average_agi", rival_base_power) if rival_guild_info else rival_base_power

        player_pe = 0
        rival_pe = 0
        match_log = []
        room_events = []
        sim_result = {}

        if self.match_engine:
            t1 = self.match_engine.Team(
                "Guilda do Jogador",
                base_power=base_power,
                bonus_slots=bonus_slots_power,
                consumable_energy_bonus=consumable_energy_bonus,
                temporary_power_pct_modifier=temporary_power_pct_modifier,
                agi=player_agi,
                has_terrain_mitigation=has_terrain_mitigation,
                has_climate_mitigation=has_climate_mitigation,
                heroes=starter_heroes,
                balance=balance,
                loadout=self.state.loadout,
            )
            t2 = self.match_engine.Team(
                rival_name,
                base_power=rival_base_power,
                bonus_slots=rival_slot_bonus,
                consumable_energy_bonus=0,
                agi=rival_agi,
                has_terrain_mitigation=rival_has_mitigation,
                has_climate_mitigation=rival_climate_mit,
                balance=balance,
                traits=rival_guild_info.get("traits", []) if rival_guild_info else [],
            )
            engine = self.match_engine.MatchEngine(
                t1,
                t2,
                dungeon=dungeon,
                climate=climate,
                rng=round_rng,
                fast_mode=False,
                balance=balance,
            )
            sim_result = engine.simulate()
            player_pe = sim_result["player_score"]
            rival_pe = sim_result["rival_score"]
            match_log = sim_result["match_log"]
            room_events = sim_result["room_events"]
        else:
            sim_result = {
                "rooms_explored_player": 0,
                "rooms_explored_rival": 0,
                "exit_reason_player": "Boss resolvido",
                "exit_reason_rival": "Boss resolvido",
            }
            player_pe = 2
            rival_pe = 1
            match_log = [f"Expedição em {dungeon_name} ({climate_name}) concluída com sucesso."]

        # 4. Regra das Cargas da Provisão Logística (usa max_charges configurado no item)
        consumable_report = None
        equipped_consumable = self.state.loadout.get("Provisão Logística")
        if equipped_consumable and isinstance(equipped_consumable, dict):
            instance_id = equipped_consumable.get("item_instance_id")
            inv_item = next((i for i in self.state.inventory if i.get("item_instance_id") == instance_id), None)
            target = inv_item if inv_item else equipped_consumable

            max_charges = target.get("max_charges", target.get("charges", 3))
            current_charges = target.get("charges", max_charges) - 1
            target["charges"] = current_charges

            if current_charges <= 0:
                self.state.loadout["Provisão Logística"] = None
                if inv_item in self.state.inventory:
                    self.state.inventory.remove(inv_item)
                consumable_report = f"O consumível '{target.get('name', 'Consumível')}' esgotou todas as suas rações operacionais e foi descartado."
                match_log.append(f"[Logística] {consumable_report}")
            else:
                consumable_report = f"O consumível '{target.get('name', 'Consumível')}' utilizou 1 carga ({current_charges}/{max_charges} cargas restantes)."
                match_log.append(f"[Logística] {consumable_report}")

        # 5. Adiciona fadiga e calcula risco pericial de afastamento (lesão) aos titulares
        from match_engine import get_hero_position, get_positions_data, get_positions_config
        fatigue_cfg = balance.get("fatigue", {})
        gain_val = fatigue_cfg.get("gain_per_expedition", 25)
        fatigued_thresh = fatigue_cfg.get("fatigued_threshold", 70)

        # Habilidade Prece de Sustentação (Clérigo/Apoio):
        # Reduz a fadiga resultante da expedição
        has_sustaining_prayer = False
        if self.match_engine and t1.has_skill("skill_sustaining_prayer"):
            has_sustaining_prayer = True
            skill_data = t1.get_skill("skill_sustaining_prayer") or {}
            fatigue_reduction = skill_data.get("fatigue_gain_reduction", 5)
            gain_val = max(0, gain_val - fatigue_reduction)

        # Mecânicas de Posições Operacionais (Vanguarda & Suporte)
        positions_catalog = get_positions_data()
        pos_cfg = get_positions_config()
        vanguard_info = next((p for p in positions_catalog if p.get("id") == "pos_vanguarda"), {})
        suporte_info = next((p for p in positions_catalog if p.get("id") == "pos_suporte"), {})

        num_vanguard = sum(1 for h in starter_heroes if get_hero_position(h) == "pos_vanguarda")
        num_suporte = sum(1 for h in starter_heroes if get_hero_position(h) == "pos_suporte")

        vanguard_fatigue_red = float(vanguard_info.get("team_fatigue_reduction_pct", 0.15))
        max_fatigue_red = float(pos_cfg.get("max_team_fatigue_reduction", 0.45))
        team_fatigue_red_pct = min(max_fatigue_red, num_vanguard * vanguard_fatigue_red)

        # Suporte cura fadiga se não tiver sido curado já pela Prece de Sustentação
        suporte_heal = 0
        if num_suporte > 0 and not has_sustaining_prayer:
            suporte_heal = int(suporte_info.get("expedition_fatigue_heal", 5))

        base_injury_risk = float(pos_cfg.get("base_injury_risk_per_expedition", 0.08))
        team_injury_red = float(vanguard_info.get("team_injury_risk_reduction_pct", 0.25))
        max_injury_red = float(pos_cfg.get("max_team_injury_reduction", 0.60))
        team_injury_red_pct = min(max_injury_red, num_vanguard * team_injury_red)

        for h in starter_heroes:
            h_pos = get_hero_position(h)
            if num_vanguard > 0:
                if h_pos == "pos_vanguarda":
                    # Centraliza o dano colateral em si mesmo
                    self_mult = float(vanguard_info.get("self_fatigue_mult", 1.25))
                    hero_gain = round(gain_val * self_mult) - suporte_heal
                else:
                    hero_gain = round(gain_val * (1.0 - team_fatigue_red_pct)) - suporte_heal
            else:
                hero_gain = gain_val - suporte_heal

            hero_gain = max(0, hero_gain)
            h["fatigue"] = min(100, h.get("fatigue", 0) + hero_gain)
            h["season_appearances"] = h.get("season_appearances", 0) + 1
            if h["fatigue"] >= fatigued_thresh:
                h["status"] = "Fatigado"

            # Avaliação pericial de acidente de trabalho (lesão com afastamento e fatalidade ocupacional - TASK-807)
            if h_pos and not h.get("injured", False) and h.get("status") not in ("Afastado", "Falecido"):
                if h_pos == "pos_vanguarda":
                    inj_risk = base_injury_risk * float(vanguard_info.get("self_injury_risk_mult", 1.25))
                else:
                    inj_risk = base_injury_risk * (1.0 - team_injury_red_pct)

                hero_rng_seed = hash((world_seed, week, h.get("id"), "injury"))
                hero_rng = random.Random(hero_rng_seed)
                if hero_rng.random() < inj_risk:
                    # Dado secundário para agravante fatal conforme posição operacional (TASK-807)
                    pos_obj = next((p for p in positions_catalog if p.get("id") == h_pos), {})
                    fatal_chance = float(pos_obj.get("fatal_injury_chance", 0.05))

                    fatal_rng_seed = hash((world_seed, week, h.get("id"), "fatal_injury"))
                    fatal_rng = random.Random(fatal_rng_seed)
                    is_fatal = fatal_rng.random() < fatal_chance

                    if is_fatal:
                        h["injured"] = True
                        h["status"] = "Falecido"
                        h["deceased"] = True
                        h["injury_weeks_left"] = 0
                        if hasattr(self.state, "starters") and h["id"] in self.state.starters:
                            if isinstance(self.state.starters, set):
                                self.state.starters.discard(h["id"])
                            elif isinstance(self.state.starters, list):
                                self.state.starters = [sid for sid in self.state.starters if sid != h["id"]]
                        match_log.append(
                            f"[Cartório Imperial - Atestado de Óbito] FATALIDADE EM SERVIÇO: O colaborador '{h.get('name')}' "
                            f"({pos_obj.get('name', h_pos)}) sucumbiu a traumatismo grave na masmorra. "
                            f"Baixa patrimonial homologada e vaga aberta no quadro de colaboradores sem cobertura securitária."
                        )
                    else:
                        h["injured"] = True
                        h["status"] = "Afastado"
                        h["injury_weeks_left"] = hero_rng.randint(1, 3)
                        match_log.append(
                            f"[Boletim Médico] Acidente de Trabalho: Colaborador '{h.get('name')}' sofreu lesão em serviço "
                            f"({h['injury_weeks_left']} semanas de afastamento pericial)."
                        )

        # Registro dos titulares da última expedição
        self.state.last_expedition_starters = [h["id"] for h in starter_heroes] if starter_heroes else list(self.state.starters)

        # Geração e Registro Real de Espólios de Masmorras (Peças Modulares Reais com Catalisador Climático - TASK-806)
        rooms_player = sim_result.get("rooms_explored_player", 0)
        dungeon_terrain = dungeon.get("terrain", "neutral")
        loot_dropped = self._generate_dungeon_loot(
            dungeon_terrain,
            rooms_player,
            round_rng,
            climate=climate,
            has_catalyst=has_climate_mitigation,
        )
        self.state.last_expedition_loot = loot_dropped
        for item in loot_dropped:
            if item.get("is_full_item"):
                full_item_data = item.get("item_data", item)
                if not hasattr(self.state, "inventory") or self.state.inventory is None:
                    self.state.inventory = []
                self.state.inventory.append(full_item_data)
                match_log.append(
                    f"[Achado Lendário de Masmorra] Item Completo Recuperado: '{full_item_data.get('name')}' "
                    f"({full_item_data.get('slot', 'Item')} - Qualidade {full_item_data.get('quality', 'Normal')}) "
                    f"inserido diretamente no arsenal da guilda!"
                )
            else:
                pid = item.get("part_id", item.get("material_id"))
                qty = item.get("quantity", 1)
                if hasattr(self.state, "add_warehouse_part"):
                    self.state.add_warehouse_part(pid, qty)
                else:
                    self.state.warehouse_parts[pid] = self.state.warehouse_parts.get(pid, 0) + qty
                self.state.materials[pid] = self.state.materials.get(pid, 0) + qty
                match_log.append(f"[Logística de Espólios] Recuperado: {qty}x '{item.get('name', pid)}' ({item.get('slot_role', 'Peça').capitalize()}).")

        # Atualização da Confiança da Contratante com base no resultado da expedição
        confidence_gain = balance.get("expedition", {}).get("confidence_gain_win", 3)
        confidence_loss = balance.get("expedition", {}).get("confidence_loss_defeat", 3)
        if player_pe > rival_pe:
            self.state.contractor_confidence = min(100, getattr(self.state, "contractor_confidence", 75) + confidence_gain)
            match_log.append(f"[Contratante] Vitória na expedição! Confiança da Coroa elevada (+{confidence_gain} pts).")
        elif player_pe < rival_pe:
            self.state.contractor_confidence = max(0, getattr(self.state, "contractor_confidence", 75) - confidence_loss)
            match_log.append(f"[Contratante] Desempenho insuficiente perante os rivais. Advertência notarial emitida (-{confidence_loss} pts).")
        else:
            match_log.append("[Contratante] Empate técnico homologado perante o consórcio rival (Confiança inalterada).")

        # 5.5. Acúmulo de Brand XP com base nos ativos equipados na expedição
        try:
            from b2b import get_parts_dict, get_corporations_dict
            parts_dict = get_parts_dict()
            corps_dict = get_corporations_dict()

            brand_counts = {}
            for slot_name, item_id in getattr(self.state, "loadout", {}).items():
                if not item_id:
                    continue
                item = next((it for it in getattr(self.state, "inventory", []) if it.get("item_instance_id") == item_id), None)
                if not item:
                    continue
                used_parts = item.get("modular_parts", [])
                if used_parts:
                    item_corps = []
                    for pid in used_parts:
                        p_info = parts_dict.get(pid, {})
                        cid = p_info.get("corp_id")
                        if cid and cid != "corp_crown_notarial":
                            brand_counts[cid] = brand_counts.get(cid, 0) + 10
                            item_corps.append(cid)
                    # Bônus Monomarca (+15 XP)
                    if len(item_corps) >= 3 and len(set(item_corps)) == 1:
                        monomarca_cid = item_corps[0]
                        brand_counts[monomarca_cid] = brand_counts.get(monomarca_cid, 0) + 15
                elif item.get("corp_id") and item.get("corp_id") != "corp_crown_notarial":
                    cid = item.get("corp_id")
                    brand_counts[cid] = brand_counts.get(cid, 0) + 10

            for cid, xp_gain in brand_counts.items():
                rival_id = corps_dict.get(cid, {}).get("rival_corp_id")
                if hasattr(self.state, "add_brand_xp"):
                    self.state.add_brand_xp(cid, xp_gain, rival_corp_id=rival_id)
                c_name = corps_dict.get(cid, {}).get("name", cid)
                curr_lvl = self.state.get_brand_level(cid) if hasattr(self.state, "get_brand_level") else 1
                match_log.append(f"[Relações B2B] +{xp_gain} Brand XP com {c_name} (Nível Comercial {curr_lvl}).")
        except Exception:
            pass

        # Liberação de carência de slots B2B após a conclusão da expedição
        self.state.b2b_slots_locked = 0

        # 6. Simulação de TODOS os confrontos da Liga
        round_results = self.league_engine.process_round_simulations(
            round_num=self.state.day,
            player_pe_for=player_pe,
            player_pe_against=rival_pe,
            dungeon=dungeon,
            climate=climate,
            rng=round_rng,
        )

        # Geração do DRE Semanal atualizado para exibição imediata na Fase 5
        weekly_statement = self.generate_weekly_financial_statement()
        self.state.last_financial_statement = weekly_statement
        self.state.financials = weekly_statement

        return {
            "phase": 4,
            "dungeon": dungeon,
            "climate": climate,
            "mitigation_applied": has_terrain_mitigation,
            "climate_applied": has_climate_mitigation,
            "player_match": {
                "player_guild": getattr(self.state, "guild_name", "Guilda do Jogador"),
                "rival_guild": rival_name,
                "player_pe": player_pe,
                "rival_pe": rival_pe,
                "match_log": match_log,
                "room_events": room_events,
                "rooms_explored_player": sim_result.get("rooms_explored_player", 0),
                "rooms_explored_rival": sim_result.get("rooms_explored_rival", 0),
                "exit_reason_player": sim_result.get("exit_reason_player", ""),
                "exit_reason_rival": sim_result.get("exit_reason_rival", ""),
            },
            "consumable_report": consumable_report,
            "loot_dropped": loot_dropped,
            "round_results": round_results,
            "league_matches": round_results,
            "standings": self.league_engine.get_standings(),
            "financials": weekly_statement,
            "last_financial_statement": weekly_statement,
        }

    def generate_weekly_financial_statement(self) -> dict:
        """
        Calcula e consolida o Demonstrativo do Resultado do Exercício (DRE) da semana atual.
        Garante rastreamento fidedigno de vendas de balcão, expedição, salários, manutenção e insumos.
        """
        balance = get_balance()
        econ_cfg = balance.get("economy", {})
        base_maintenance = econ_cfg.get("weekly_maintenance", 50)
        expedition_revenue = econ_cfg.get("base_expedition_revenue", 250)

        fac_data = self.hero_service.get_medical_facilities_data() if hasattr(self, "hero_service") else {}
        medical_maintenance = fac_data.get("weekly_maintenance", 20)
        acad_cfg = balance.get("academy", {})
        academy_maintenance = acad_cfg.get("weekly_maintenance", 40)
        total_maintenance = base_maintenance + medical_maintenance + academy_maintenance

        season_summary = getattr(self.league_engine, "season_summary", None)
        season_award = season_summary.get("award_gold", 0) if season_summary else 0

        salary_cost = sum(h.get("salary", 50) for h in self.state.team)

        crown_subsidy = 0
        crown_penalty = 0
        last_audit = getattr(self.state, "crown_goals", {}).get("last_audit_report")
        if last_audit and last_audit.get("audit_week") == (self.state.week or self.state.day):
            delta = last_audit.get("delta_gold", 0)
            if delta > 0:
                crown_subsidy = delta
            else:
                crown_penalty = abs(delta)

        b2b_royalties_cost = sum(
            int(c.get("weekly_royalty", 0))
            for c in getattr(self.state, "active_b2b_contracts", [])
        )
        assembly_workers_salaries = sum(
            int(w.get("weekly_salary", 0))
            for w in getattr(self.state, "assembly_line_workers", [])
        )

        assembly_sales_revenue = getattr(self.state, "assembly_sales_revenue", 0)
        sales_revenue = getattr(self.state, "weekly_sales_revenue", 0)
        sales_count = getattr(self.state, "weekly_sales_count", 0)
        market_expenses = getattr(self.state, "weekly_market_expenses", 0)
        contract_signing_expenses = getattr(self.state, "weekly_contract_signing_expenses", 0)
        hiring_expenses = getattr(self.state, "weekly_hiring_expenses", 0)

        total_revenue = expedition_revenue + sales_revenue + assembly_sales_revenue + season_award + crown_subsidy
        total_expenses = (
            salary_cost
            + total_maintenance
            + b2b_royalties_cost
            + assembly_workers_salaries
            + crown_penalty
            + market_expenses
            + contract_signing_expenses
            + hiring_expenses
        )
        net = (
            expedition_revenue
            + sales_revenue
            + assembly_sales_revenue
            + season_award
            + crown_subsidy
            - crown_penalty
            - salary_cost
            - total_maintenance
            - b2b_royalties_cost
            - assembly_workers_salaries
        )

        return {
            "week": getattr(self.state, "week", self.state.day),
            "season": getattr(self.state, "season", 1),
            "revenue": expedition_revenue,
            "expedition_revenue": expedition_revenue,
            "sales_revenue": sales_revenue,
            "sales_count": sales_count,
            "assembly_sales_revenue": assembly_sales_revenue,
            "season_award": season_award,
            "crown_subsidy": crown_subsidy,
            "crown_penalty": crown_penalty,
            "salaries": salary_cost,
            "maintenance": total_maintenance,
            "total_maintenance": total_maintenance,
            "base_maintenance": base_maintenance,
            "medical_maintenance": medical_maintenance,
            "academy_maintenance": academy_maintenance,
            "b2b_royalties_cost": b2b_royalties_cost,
            "assembly_workers_salaries": assembly_workers_salaries,
            "market_expenses": market_expenses,
            "contract_signing_expenses": contract_signing_expenses,
            "hiring_expenses": hiring_expenses,
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net": net,
        }

    def phase_5_results(self) -> dict:
        """Fase 5: Balanço financeiro semanal, despesas de manutenção predial/médica/base e fechamento."""
        season_award = 0
        development_report = None
        season_summary = getattr(self.league_engine, "season_summary", None)
        if season_summary:
            season_award = season_summary.get("award_gold", 0)

            # Processamento anual de evolução de atributos, declínio físico e envelhecimento
            if hasattr(self, "hero_service"):
                development_report = self.hero_service.process_annual_development_and_aging()

            # Processamento de contratos no encerramento da temporada
            for hero in self.state.team:
                hero["contract_seasons_left"] = max(0, hero.get("contract_seasons_left", 2) - 1)
                if hero["contract_seasons_left"] == 0 and not hero.get("pending_renewal"):
                    curr_sal = hero.get("salary", 50)
                    is_star = hero.get("current_power", 50) >= 65 or hero.get("season_appearances", 0) >= 10
                    mult = 1.45 if is_star else 1.25
                    demanded_sal = round(curr_sal * mult)
                    signing_bonus = round(demanded_sal * 3)
                    hero["pending_renewal"] = True
                    hero["renewal_demand"] = {
                        "salary": demanded_sal,
                        "signing_bonus": signing_bonus,
                        "seasons": 2
                    }
                    if not hasattr(self.state, "pending_contract_renewals"):
                        self.state.pending_contract_renewals = []
                    self.state.pending_contract_renewals.append({
                        "hero_id": hero["id"],
                        "hero_name": hero["name"],
                        "current_salary": curr_sal,
                        "demanded_salary": demanded_sal,
                        "signing_bonus": signing_bonus,
                        "seasons": 2
                    })
                hero["season_appearances"] = 0

            # Desativa o gatilho da engine para não reprocessar anualmente em todas as semanas seguintes
            self.state.season_summary = season_summary
            self.state.season_completed = True
            self.state.season_outcome = copy.deepcopy(season_summary)
            self.league_engine.season_summary = None

        # Auditoria Trimestral das Metas da Coroa
        from services.crown_service import get_crown_goals_data, process_quarterly_audit
        crown_audit_report = None
        crown_data = get_crown_goals_data(self.state, self.league_engine)
        if crown_data.get("is_audit_week"):
            crown_audit_report = process_quarterly_audit(self.state, self.league_engine)

        # Executa Linha de Montagem Autônoma de B2B se disponível
        assembly_sales_revenue = 0
        assembly_report = None
        if hasattr(self, "crafting_service") and self.crafting_service:
            assembly_report = self.crafting_service.process_assembly_line()
            assembly_sales_revenue = int(assembly_report.get("assembly_sales_revenue", 0))

        # Gera o extrato financeiro definitivo do ciclo
        financial_statement = self.generate_weekly_financial_statement()
        if assembly_sales_revenue > 0:
            financial_statement["assembly_sales_revenue"] = assembly_sales_revenue
            financial_statement["total_revenue"] += assembly_sales_revenue
            financial_statement["net"] += assembly_sales_revenue

        # Liquidação contábil no caixa da guilda:
        # O resultado líquido (net) liquida receitas e obrigações do ciclo, deduzindo o que já foi recebido em dinheiro
        already_collected = getattr(self.state, "weekly_sales_cash_collected", 0)
        self.state.gold += (financial_statement["net"] - already_collected)

        # Verificação de Falência por Inadimplência e Liquidação Judicial da Coroa
        if self.state.gold < 0:
            self.state.consecutive_negative_gold_weeks = getattr(self.state, "consecutive_negative_gold_weeks", 0) + 1
            if self.state.consecutive_negative_gold_weeks >= 2:
                self.state.game_over = True
                self.state.game_over_reason = (
                    "Liquidação Judicial por Insolvência Patrimonial: A guilda encerrou dois ciclos consecutivos "
                    "com saldo financeiro negativo perante o Tribunal da Coroa. Todos os contratos foram revogados "
                    "e os bens patrimoniais foram alienados pela Junta de Arbitragem Real."
                )
        else:
            self.state.consecutive_negative_gold_weeks = 0

        self.state.season = getattr(self.league_engine, "season_number", 1)

        # Salva o demonstrativo oficial
        self.state.last_financial_statement = financial_statement
        self.state.financials = financial_statement

        # Reinicia os acumuladores semanais para a rodada seguinte
        self.state.weekly_sales_revenue = 0
        self.state.weekly_sales_cash_collected = 0
        self.state.weekly_sales_count = 0
        self.state.weekly_market_expenses = 0
        self.state.weekly_contract_signing_expenses = 0
        self.state.weekly_hiring_expenses = 0

        return {
            "phase": 5,
            "financials": financial_statement,
            "last_financial_statement": financial_statement,
            "assembly_report": assembly_report,
            "crown_audit": crown_audit_report,
            "crown_goals": get_crown_goals_data(self.state, self.league_engine),
            "development_report": development_report,
            "gold": self.state.gold,
            "standings": self.league_engine.get_standings(),
            "divisions": self.league_engine.get_divisions_data(),
            "current_division": self.league_engine.get_current_division_info(),
            "season": self.state.season,
            "season_summary": season_summary,
            "season_completed": getattr(self.state, "season_completed", False),
            "season_outcome": getattr(self.state, "season_outcome", None),
            "game_over": getattr(self.state, "game_over", False),
            "game_over_reason": getattr(self.state, "game_over_reason", None),
            "consecutive_negative_gold_weeks": getattr(self.state, "consecutive_negative_gold_weeks", 0),
            "round_matches": getattr(self.league_engine, "last_round_matches", []),
            "pending_contract_renewals": getattr(self.state, "pending_contract_renewals", []),
        }

    def process_phase_5_settlement(self) -> dict:
        """Alias pericial para fechamento contábil e apuração financeira da Fase 5."""
        return self.phase_5_results()

    def _generate_dungeon_loot(
        self,
        terrain: str,
        rooms_explored: int,
        rng: random.Random,
        climate: Optional[dict] = None,
        has_catalyst: bool = False
    ) -> list:
        """Sorteia peças modulares físicas com base no terreno da masmorra, salas alcançadas e bônus climático B2B."""
        if rooms_explored <= 0:
            return []

        parts_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'parts_seed.json')
        if not os.path.exists(parts_path):
            return []

        try:
            with open(parts_path, 'r', encoding='utf-8') as f:
                all_parts = json.load(f)
        except Exception:
            return []

        terrain_corp_map = {
            "unstable_mine": ["corp_dwarf_steel", "corp_aethelgard", "corp_goblin_eng"],
            "toxic_swamp": ["corp_swamp_alchemy", "corp_flamel", "corp_goblin_eng"],
            "glacier_frost": ["corp_elf_precision", "corp_mercurius", "corp_dwarf_steel"],
            "submerged_ruins": ["corp_crown_notarial", "corp_elf_precision", "corp_mercurius"],
            "arcane_fog": ["corp_chancellor", "corp_crown_notarial", "corp_elf_precision"],
            "lightning_peaks": ["corp_valkyria", "corp_dwarf_steel", "corp_goblin_eng"],
            "volcanic_heat": ["corp_aethelgard", "corp_dwarf_steel", "corp_valkyria"],
            "neutral": ["corp_crown_notarial", "corp_aethelgard", "corp_valkyria", "corp_crown_rations"],
        }
        target_corps = terrain_corp_map.get(terrain, terrain_corp_map["neutral"])

        eligible = [p for p in all_parts if p.get("corp_id") in target_corps]
        if not eligible:
            eligible = all_parts

        if rooms_explored < 3:
            part_count = 1 if rng.random() < 0.75 else 0
        elif rooms_explored < 7:
            part_count = rng.randint(1, 2)
        else:
            part_count = rng.randint(2, 3)

        if part_count == 0:
            part_count = 1

        chosen_parts = rng.sample(eligible, min(part_count, len(eligible)))

        # Bônus de Drop B2B por Tendência Climática / Catalisador Climático (TASK-806)
        if climate and rooms_explored >= 2:
            drop_cat = climate.get("drop_bonus_category")
            if drop_cat:
                cat_bonus_chance = float(climate.get("catalyst_drop_bonus_pct", 0.30)) if has_catalyst else float(climate.get("drop_bonus_pct", 0.15))
                if rng.random() < cat_bonus_chance:
                    cat_parts = [
                        p for p in all_parts
                        if p.get("branch") == drop_cat
                        or drop_cat in p.get("compatible_slots", [])
                        or p.get("slot_role") == drop_cat
                        or drop_cat.lower() in p.get("name", "").lower()
                    ]
                    if cat_parts:
                        extra_cat_part = rng.choice(cat_parts)
                        if extra_cat_part not in chosen_parts:
                            chosen_parts.append(extra_cat_part)

        # Em incursões profundas (5+ salas), chance de recuperar mantimentos de campanha adicionais
        if rooms_explored >= 5 and rng.random() < 0.40:
            provision_parts = [p for p in all_parts if p.get("corp_id") == "corp_crown_rations" or "Provisão Logística" in p.get("compatible_slots", [])]
            if provision_parts:
                extra_prov = rng.choice(provision_parts)
                if extra_prov not in chosen_parts:
                    chosen_parts.append(extra_prov)
        loot = []
        for p in chosen_parts:
            pid = p.get("id", p.get("part_id"))
            tier = p.get("tier", 1)
            rarity = "Comum" if tier == 1 else ("Raro" if tier == 2 else "Lendário")
            loot.append({
                "part_id": pid,
                "material_id": pid,
                "name": p.get("name", pid),
                "quantity": 1,
                "rarity": rarity,
                "corp_id": p.get("corp_id", "corp_generic"),
                "slot_role": p.get("slot_role", "base"),
                "power_bonus": p.get("power_bonus", 10),
                "tier": tier,
                "branch": p.get("branch", "Ferragem"),
            })

        # TASK-810: Drop Raro de Itens Completos Manufaturados em Masmorras
        # Taxa de drop raro: 5% a 10% nas câmaras intermediárias (salas 3 a 9) e 25% no Boss Final (sala 10)
        full_item_chance = 0.0
        if rooms_explored >= 10:
            full_item_chance = 0.25
        elif rooms_explored >= 6:
            full_item_chance = 0.10
        elif rooms_explored >= 3:
            full_item_chance = 0.05

        if full_item_chance > 0 and rng.random() < full_item_chance:
            recipes_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'recipes_seed.json')
            if os.path.exists(recipes_path):
                try:
                    with open(recipes_path, 'r', encoding='utf-8') as f:
                        raw_recipes = json.load(f)
                    all_recipes = list(raw_recipes.values()) if isinstance(raw_recipes, dict) else raw_recipes
                    if all_recipes:
                        rec = rng.choice(all_recipes)
                        quality_roll = rng.random()
                        quality = "Lendário" if quality_roll < 0.10 else ("Ótimo" if quality_roll < 0.40 else "Normal")
                        mults = {"Fraco": 0.70, "Normal": 1.0, "Ótimo": 1.35, "Lendário": 1.80}
                        q_mult = mults.get(quality, 1.0)
                        base_pwr = int(rec.get("base_power", 20) * q_mult)
                        item_id = f"loot_{rec.get('id', 'item')}_{rng.randint(10000, 99999)}"
                        full_item = {
                            "item_instance_id": item_id,
                            "recipe_id": rec.get("id"),
                            "name": f"{rec.get('name', 'Artefato')} Resgatado",
                            "description": f"Item manufaturado completo resgatado dos tesouros da câmara {rooms_explored}.",
                            "slot": rec.get("slot", "Arsenal Ofensivo"),
                            "slot_type": rec.get("slot", "Arsenal Ofensivo"),
                            "branch": rec.get("branch", "Ferragem"),
                            "quality": quality,
                            "power_bonus": base_pwr,
                            "energy_bonus": int(rec.get("base_energy_bonus", 0) * q_mult),
                            "terrain_mitigation": rec.get("terrain_mitigation"),
                            "market_value_base": int(rec.get("base_value", 100) * q_mult),
                            "multiplier": q_mult,
                            "special_suffix_active": quality == "Lendário",
                        }
                        loot.append({
                            "is_full_item": True,
                            "part_id": item_id,
                            "material_id": item_id,
                            "name": full_item["name"],
                            "quantity": 1,
                            "rarity": quality,
                            "slot_role": rec.get("slot", "Arsenal Ofensivo"),
                            "item_data": full_item,
                            "power_bonus": base_pwr,
                            "tier": rec.get("tier", 1),
                            "branch": rec.get("branch", "Ferragem"),
                        })
                except Exception:
                    pass

        return loot
