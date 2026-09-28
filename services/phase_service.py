"""
HeroFoot Phase Service.
Gerencia a execução e transição das 5 fases do ciclo semanal.
"""

from balance import get_balance


class PhaseService:
    def __init__(self, state, dungeons, league_engine, market_engine, match_engine=None):
        self.state = state
        self.dungeons = dungeons
        self.league_engine = league_engine
        self.market_engine = market_engine
        self.match_engine = match_engine

    def get_current_dungeon(self) -> dict:
        if not self.dungeons:
            return {
                "id": "dungeon_01",
                "name": "Vale dos Ecos Verdejantes",
                "terrain": "neutral",
                "terrain_label": "Campo Aberto Verdejante",
                "description": "Terreno padrão da Liga, sem penalidades ambientais.",
                "power_penalty_pct": 0.0,
                "energy_cost_extra": 0,
                "mitigation_required": None,
                "mitigation_label": "Nenhuma mitigação necessária",
                "recommended_power": 55,
            }
        idx = (self.state.day - 1) % len(self.dungeons)
        return self.dungeons[idx]

    def advance_phase(self) -> dict:
        phase = self.state.current_phase
        result = {}

        if phase == 1:
            result = self.phase_1_cuidado()
            self.state.current_phase = 2
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

        result["current_phase"] = self.state.current_phase
        result["day"] = self.state.day
        result["week"] = self.state.week
        return result

    def phase_1_cuidado(self) -> dict:
        """Fase 1: Recuperação de fadiga, atestados médicos e altas."""
        report = []
        balance = get_balance()
        fatigue_cfg = balance.get("fatigue", {})
        recovery_val = fatigue_cfg.get("recovery_per_week", 20)
        recov_thresh = fatigue_cfg.get("recovered_threshold", 50)

        for hero in self.state.team:
            if hero.get("fatigue", 0) > 0:
                hero["fatigue"] = max(0, hero["fatigue"] - recovery_val)
                if hero.get("status") == "Fatigado" and hero["fatigue"] < recov_thresh:
                    hero["status"] = "Apto"
                report.append(f"{hero.get('name', 'Herói')} realizou descompressão (-{recovery_val} fadiga).")

            if hero.get("injured", False) and hero.get("injury_weeks_left", 0) > 0:
                hero["injury_weeks_left"] -= 1
                if hero["injury_weeks_left"] == 0:
                    hero["injured"] = False
                    hero["status"] = "Apto"
                    report.append(f"{hero.get('name', 'Herói')} recebeu alta pericial e está apto para expedições.")
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
        mitigação de terreno da rodada e consumo de cargas de consumíveis.
        """
        dungeon = self.get_current_dungeon()
        dungeon_name = dungeon.get("name", "Masmorra Desconhecida")
        required_mitigation = dungeon.get("mitigation_required")

        fixture = self.league_engine.get_player_match(self.state.day)
        rival_name = "Guilda Rival"
        if fixture:
            rival_name = fixture["away_name"] if fixture["home_is_player"] else fixture["home_name"]

        # 1. Poder Base da equipe (heróis titulares escalados)
        starter_heroes = [h for h in self.state.team if h["id"] in self.state.starters]
        if not starter_heroes:
            starter_heroes = [h for h in self.state.team if h.get("status") == "Apto"][:6]

        base_power = sum(h.get("current_power", h.get("power", 50)) for h in starter_heroes)

        # 2. Bônus de Loadout dos 5 Slots
        bonus_slots_power = 0
        consumable_energy_bonus = 0
        has_terrain_mitigation = False

        for slot_name, item in self.state.loadout.items():
            if item and isinstance(item, dict):
                bonus_slots_power += item.get("power_bonus", 0)
                if slot_name == "Consumível":
                    consumable_energy_bonus += item.get("energy_bonus", item.get("energy_restore", 25))

                item_mitigation = item.get("terrain_mitigation")
                if required_mitigation and item_mitigation == required_mitigation:
                    has_terrain_mitigation = True

        # 3. Penalidades de Terreno usando power_penalty_pct
        pct = dungeon.get("power_penalty_pct", 0.0)
        terrain_power_penalty = 0
        energy_cost_extra = 0

        if required_mitigation and not has_terrain_mitigation:
            terrain_power_penalty = round(pct * (base_power + bonus_slots_power))
            energy_cost_extra = dungeon.get("energy_cost_extra", 5)

        # Poder do rival com flutuação da liga
        rival_guild_info = next((g for g in self.league_engine.guilds if g["name"] == rival_name), None)
        rival_base_power = rival_guild_info["power_rating"] if rival_guild_info else 60
        rival_penalty = round(pct * rival_base_power) if required_mitigation else 0

        player_pe = 0
        rival_pe = 0
        match_log = []
        room_events = []

        if self.match_engine:
            t1 = self.match_engine.Team(
                "Guilda do Jogador",
                base_power=base_power,
                bonus_slots=bonus_slots_power,
                consumable_energy_bonus=consumable_energy_bonus
            )
            t2 = self.match_engine.Team(
                rival_name,
                base_power=rival_base_power,
                bonus_slots=6,
                consumable_energy_bonus=0
            )
            engine = self.match_engine.MatchEngine(
                t1,
                t2,
                terrain_penalty_t1=terrain_power_penalty,
                terrain_penalty_t2=rival_penalty,
                energy_cost_extra_t1=energy_cost_extra,
                energy_cost_extra_t2=dungeon.get("energy_cost_extra", 5) if required_mitigation else 0,
                terrain_name=dungeon_name,
            )
            sim_result = engine.simulate()
            player_pe = sim_result["player_score"]
            rival_pe = sim_result["rival_score"]
            match_log = sim_result["match_log"]
            room_events = sim_result["room_events"]
        else:
            player_pe = 2
            rival_pe = 1
            match_log = [f"Expedição em {dungeon_name} concluída com sucesso."]

        # 4. Regra das Cargas do Consumível (Slot 5 consome 1 de 3 cargas)
        consumable_report = None
        equipped_consumable = self.state.loadout.get("Consumível")
        if equipped_consumable and isinstance(equipped_consumable, dict):
            instance_id = equipped_consumable.get("item_instance_id")
            inv_item = next((i for i in self.state.inventory if i.get("item_instance_id") == instance_id), None)
            target = inv_item if inv_item else equipped_consumable

            current_charges = target.get("charges", 3) - 1
            target["charges"] = current_charges

            if current_charges <= 0:
                self.state.loadout["Consumível"] = None
                if inv_item in self.state.inventory:
                    self.state.inventory.remove(inv_item)
                consumable_report = f"O consumível '{target['name']}' esgotou todas as suas cargas e foi descartado."
                match_log.append(f"[Logística] {consumable_report}")
            else:
                consumable_report = f"O consumível '{target['name']}' gastou 1 carga ({current_charges}/3 cargas restantes)."
                match_log.append(f"[Logística] {consumable_report}")

        # 5. Adiciona fadiga aos titulares que exploraram a masmorra
        balance = get_balance()
        gain_val = balance.get("fatigue", {}).get("gain_per_expedition", 20)
        fatigued_thresh = balance.get("fatigue", {}).get("fatigued_threshold", 70)

        for h in starter_heroes:
            h["fatigue"] = min(100, h.get("fatigue", 0) + gain_val)
            if h["fatigue"] >= fatigued_thresh:
                h["status"] = "Fatigado"

        # 6. Simulação de TODOS os confrontos da Liga
        round_results = self.league_engine.process_round_simulations(
            round_num=self.state.day,
            player_pe_for=player_pe,
            player_pe_against=rival_pe
        )

        return {
            "phase": 4,
            "dungeon": dungeon,
            "mitigation_applied": has_terrain_mitigation,
            "player_match": {
                "player_guild": "Guilda do Jogador",
                "rival_guild": rival_name,
                "player_pe": player_pe,
                "rival_pe": rival_pe,
                "match_log": match_log,
                "room_events": room_events,
            },
            "consumable_report": consumable_report,
            "round_results": round_results,
            "standings": self.league_engine.get_standings(),
        }

    def phase_5_results(self) -> dict:
        """Fase 5: Balanço financeiro semanal e fechamento da rodada."""
        balance = get_balance()
        econ_cfg = balance.get("economy", {})
        maintenance = econ_cfg.get("weekly_maintenance", 50)
        expedition_revenue = econ_cfg.get("base_expedition_revenue", 250)

        salary_cost = sum(h.get("salary", 50) for h in self.state.team)
        net = expedition_revenue - salary_cost - maintenance
        self.state.gold += net

        return {
            "phase": 5,
            "financials": {
                "revenue": expedition_revenue,
                "salaries": salary_cost,
                "maintenance": maintenance,
                "net": net,
            },
            "gold": self.state.gold,
            "standings": self.league_engine.get_standings(),
        }
