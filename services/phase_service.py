"""
HeroFoot Phase Service.
Gerencia a execução e transição das 5 fases do ciclo semanal.
"""

import os
import json
import random
from balance import get_balance
from constants import normalize_slot


class PhaseService:
    def __init__(self, state, dungeons, league_engine, market_engine, match_engine=None, hero_service=None, event_service=None):
        self.state = state
        self.dungeons = dungeons
        self.league_engine = league_engine
        self.market_engine = market_engine
        self.match_engine = match_engine
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
                self.hero_service.replenish_academy()

            # Transição semanal para Fase 1: Sorteio de incidente corporativo com 50% de chance
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
            if not hero or hero.get("injured", False) or hero.get("status") == "Afastado":
                self.state.starters.remove(hid)
                hname = hero.get("name", hid) if hero else hid
                report.append(f"Ajuste na escala: colaborador '{hname}' desconvocado da titularidade por incapacidade funcional ou rescisão contratual.")

        # Auditoria de conformidade tática: saneamento de heróis inaptos da reserva
        for hid in list(getattr(self.state, "reserves", [])):
            hero = self.state.hero_by_id(hid)
            if not hero or hero.get("injured", False) or hero.get("status") == "Afastado":
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

        consumable_item = self.state.loadout.get("Consumível")
        consumable_energy_bonus = 0
        if consumable_item and isinstance(consumable_item, dict):
            consumable_energy_bonus = consumable_item.get("energy_bonus", consumable_item.get("energy_restore", 0))

        # Bônus corporativo temporário de suprimentos
        supplies_bonus = getattr(self.state, "supplies_bonus", 0)
        if supplies_bonus:
            consumable_energy_bonus += supplies_bonus
            self.state.supplies_bonus = 0

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
                agi=player_agi,
                has_terrain_mitigation=has_terrain_mitigation,
                has_climate_mitigation=has_climate_mitigation,
                heroes=starter_heroes,
                balance=balance,
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

        # 4. Regra das Cargas do Consumível (usa max_charges configurado no item)
        consumable_report = None
        equipped_consumable = self.state.loadout.get("Consumível")
        if equipped_consumable and isinstance(equipped_consumable, dict):
            instance_id = equipped_consumable.get("item_instance_id")
            inv_item = next((i for i in self.state.inventory if i.get("item_instance_id") == instance_id), None)
            target = inv_item if inv_item else equipped_consumable

            max_charges = target.get("max_charges", target.get("charges", 3))
            current_charges = target.get("charges", max_charges) - 1
            target["charges"] = current_charges

            if current_charges <= 0:
                self.state.loadout["Consumível"] = None
                if inv_item in self.state.inventory:
                    self.state.inventory.remove(inv_item)
                consumable_report = f"O consumível '{target.get('name', 'Consumível')}' esgotou todas as suas rações operacionais e foi descartado."
                match_log.append(f"[Logística] {consumable_report}")
            else:
                consumable_report = f"O consumível '{target.get('name', 'Consumível')}' utilizou 1 carga ({current_charges}/{max_charges} cargas restantes)."
                match_log.append(f"[Logística] {consumable_report}")

        # 5. Adiciona fadiga aos titulares que exploraram a masmorra
        fatigue_cfg = balance.get("fatigue", {})
        gain_val = fatigue_cfg.get("gain_per_expedition", 25)
        fatigued_thresh = fatigue_cfg.get("fatigued_threshold", 70)

        # Habilidade Prece de Sustentação (Clérigo/Apoio):
        # Reduz a fadiga resultante da expedição
        if self.match_engine and t1.has_skill("skill_sustaining_prayer"):
            skill_data = t1.get_skill("skill_sustaining_prayer") or {}
            fatigue_reduction = skill_data.get("fatigue_gain_reduction", 5)
            gain_val = max(0, gain_val - fatigue_reduction)

        for h in starter_heroes:
            h["fatigue"] = min(100, h.get("fatigue", 0) + gain_val)
            h["season_appearances"] = h.get("season_appearances", 0) + 1
            if h["fatigue"] >= fatigued_thresh:
                h["status"] = "Fatigado"

        # Registro dos titulares da última expedição
        self.state.last_expedition_starters = [h["id"] for h in starter_heroes] if starter_heroes else list(self.state.starters)

        # Geração e Registro Real de Espólios de Masmorras (Loot Real)
        rooms_player = sim_result.get("rooms_explored_player", 0)
        dungeon_terrain = dungeon.get("terrain", "neutral")
        loot_dropped = self._generate_dungeon_loot(dungeon_terrain, rooms_player, round_rng)
        self.state.last_expedition_loot = loot_dropped
        for item in loot_dropped:
            mat_id = item["material_id"]
            qty = item["quantity"]
            self.state.materials[mat_id] = self.state.materials.get(mat_id, 0) + qty
            match_log.append(f"[Logística de Espólios] Recuperado: {qty}x '{item.get('name', mat_id)}' ({item.get('rarity', 'Comum')}).")

        # 6. Simulação de TODOS os confrontos da Liga
        round_results = self.league_engine.process_round_simulations(
            round_num=self.state.day,
            player_pe_for=player_pe,
            player_pe_against=rival_pe,
            dungeon=dungeon,
            climate=climate,
            rng=round_rng,
        )

        return {
            "phase": 4,
            "dungeon": dungeon,
            "climate": climate,
            "mitigation_applied": has_terrain_mitigation,
            "climate_applied": has_climate_mitigation,
            "player_match": {
                "player_guild": "Guilda do Jogador",
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
            "standings": self.league_engine.get_standings(),
        }

    def phase_5_results(self) -> dict:
        """Fase 5: Balanço financeiro semanal, despesas de manutenção predial/médica/base e fechamento."""
        balance = get_balance()
        econ_cfg = balance.get("economy", {})
        base_maintenance = econ_cfg.get("weekly_maintenance", 50)
        expedition_revenue = econ_cfg.get("base_expedition_revenue", 250)

        fac_data = self.hero_service.get_medical_facilities_data() if hasattr(self, "hero_service") else {}
        medical_maintenance = fac_data.get("weekly_maintenance", 20)
        acad_cfg = balance.get("academy", {})
        academy_maintenance = acad_cfg.get("weekly_maintenance", 40)
        total_maintenance = base_maintenance + medical_maintenance + academy_maintenance

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
            self.league_engine.season_summary = None

        salary_cost = sum(h.get("salary", 50) for h in self.state.team)

        # Auditoria Trimestral das Metas da Coroa
        from services.crown_service import get_crown_goals_data, process_quarterly_audit
        crown_audit_report = None
        crown_subsidy = 0
        crown_penalty = 0
        crown_data = get_crown_goals_data(self.state, self.league_engine)
        if crown_data.get("is_audit_week"):
            crown_audit_report = process_quarterly_audit(self.state, self.league_engine)
            if crown_audit_report:
                delta = crown_audit_report.get("delta_gold", 0)
                if delta > 0:
                    crown_subsidy = delta
                else:
                    crown_penalty = abs(delta)

        # Extrato DRE Dinâmico: apuração de receita de vendas e fechamento contábil
        sales_revenue = getattr(self.state, "weekly_sales_revenue", 0)
        self.state.weekly_sales_revenue = 0

        net = expedition_revenue + sales_revenue + season_award + crown_subsidy - crown_penalty - salary_cost - total_maintenance
        self.state.gold += net

        self.state.season = getattr(self.league_engine, "season_number", 1)

        last_financial_statement = {
            "revenue": expedition_revenue,
            "sales_revenue": sales_revenue,
            "season_award": season_award,
            "crown_subsidy": crown_subsidy,
            "crown_penalty": crown_penalty,
            "salaries": salary_cost,
            "total_maintenance": total_maintenance,
            "base_maintenance": base_maintenance,
            "medical_maintenance": medical_maintenance,
            "academy_maintenance": academy_maintenance,
            "net": net,
        }
        self.state.last_financial_statement = last_financial_statement

        return {
            "phase": 5,
            "financials": {
                **last_financial_statement,
                "maintenance": total_maintenance,
            },
            "last_financial_statement": last_financial_statement,
            "crown_audit": crown_audit_report,
            "crown_goals": get_crown_goals_data(self.state, self.league_engine),
            "development_report": development_report,
            "gold": self.state.gold,
            "standings": self.league_engine.get_standings(),
            "divisions": self.league_engine.get_divisions_data(),
            "current_division": self.league_engine.get_current_division_info(),
            "season": self.state.season,
            "season_summary": season_summary,
            "pending_contract_renewals": getattr(self.state, "pending_contract_renewals", []),
        }

    def _generate_dungeon_loot(self, terrain: str, rooms_explored: int, rng: random.Random) -> list:
        """Sorteia insumos corporativos com base no terreno da masmorra e nas salas alcançadas."""
        if rooms_explored <= 0:
            return []

        sources_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'material_sources_seed.json')
        if not os.path.exists(sources_path):
            return []

        try:
            with open(sources_path, 'r', encoding='utf-8') as f:
                all_sources = json.load(f)
        except Exception:
            return []

        materials_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'materials_seed.json')
        materials_meta = {}
        if os.path.exists(materials_path):
            try:
                with open(materials_path, 'r', encoding='utf-8') as f:
                    for mat in json.load(f):
                        materials_meta[mat.get("id")] = mat
            except Exception:
                pass

        matching_sources = [s for s in all_sources if s.get("terrain") == terrain]
        if not matching_sources:
            matching_sources = [s for s in all_sources if s.get("terrain") == "neutral"]

        loot = []
        for src in matching_sources:
            min_rooms = src.get("min_rooms_reached", 1)
            if rooms_explored < min_rooms:
                continue

            boss_only = src.get("boss_only", False)
            if boss_only and rooms_explored < 10:
                continue

            chance = src.get("chance", 0.0)
            if rng.random() < chance:
                qty_min = src.get("qty_min", 1)
                qty_max = src.get("qty_max", 1)
                qty = rng.randint(qty_min, qty_max)
                mat_id = src.get("material_id")
                mat_info = materials_meta.get(mat_id, {})
                mat_name = mat_info.get("name", mat_id)
                mat_rarity = mat_info.get("rarity", "Comum")

                loot.append({
                    "material_id": mat_id,
                    "name": mat_name,
                    "quantity": qty,
                    "rarity": mat_rarity,
                })

        return loot
