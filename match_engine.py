"""
HeroFoot Match Engine Module.
Simulador de expedição e confrontos entre guildas em masmorras.
Lê todas as regras e parâmetros de balanceamento via balance.get_balance() (data/balance_seed.json).
"""

import random
from typing import Optional, Dict, Any, List
from balance import get_balance


def calculate_hero_effective_power(hero: Optional[Dict[str, Any]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o poder efetivo de um herói considerando sua fadiga."""
    if not hero:
        return 0.0
    if balance is None:
        balance = get_balance()
    fatigue_cfg = balance.get("fatigue", {})
    penalty_max = fatigue_cfg.get("power_penalty_max", 0.30)
    current_power = hero.get("current_power", hero.get("power", 50))
    fatigue = hero.get("fatigue", 0)
    return float(current_power) * (1.0 - float(penalty_max) * (float(fatigue) / 100.0))


def calculate_team_base_power(starters: List[Optional[Dict[str, Any]]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o Poder Base da Equipe: soma do poder efetivo dos titulares dividido pela contagem padrão de titulares."""
    if balance is None:
        balance = get_balance()
    starters_count = balance.get("party", {}).get("starters", 6)
    if starters_count <= 0:
        return 0.0
    total_power = sum(calculate_hero_effective_power(h, balance) for h in starters if h)
    return total_power / starters_count


def calculate_slot_bonus(loadout: Optional[Dict[str, Any]], balance: Optional[Dict[str, Any]] = None) -> float:
    """Calcula o bônus de poder total conferido pelos slots de loadout equipados."""
    if balance is None:
        balance = get_balance()
    loadout_cfg = balance.get("loadout", {})
    factor = loadout_cfg.get("slot_bonus_factor", 0.15)
    cap = loadout_cfg.get("slot_bonus_cap", 15)
    total_power_bonus = 0.0
    if loadout and isinstance(loadout, dict):
        for item in loadout.values():
            if isinstance(item, dict):
                total_power_bonus += item.get("power_bonus", 0)
    return min(total_power_bonus * factor, float(cap))


def check_terrain_mitigation(loadout: Optional[Dict[str, Any]], required_mitigation: Optional[str]) -> bool:
    """Verifica se algum item no loadout mitiga a exigência ambiental da masmorra."""
    if not required_mitigation:
        return True
    if loadout and isinstance(loadout, dict):
        for item in loadout.values():
            if isinstance(item, dict) and item.get("terrain_mitigation") == required_mitigation:
                return True
    return False


def calculate_average_agi(starters: List[Optional[Dict[str, Any]]]) -> float:
    """Calcula a Agilidade média dos titulares a partir de hidden_attributes.agi."""
    if not starters:
        return 0.0
    valid_heroes = [h for h in starters if h]
    if not valid_heroes:
        return 0.0
    total_agi = 0.0
    for h in valid_heroes:
        attrs = h.get("hidden_attributes", {})
        agi = attrs.get("agi", h.get("agi", 50))
        total_agi += agi
    return total_agi / len(valid_heroes)


class Team:
    """Representa a força-tarefa de uma guilda escalada para a expedição."""

    def __init__(
        self,
        name: str,
        base_power: float = 0.0,
        bonus_slots: float = 0.0,
        consumable_energy_bonus: float = 0.0,
        agi: float = 50.0,
        has_terrain_mitigation: bool = True,
        balance: Optional[Dict[str, Any]] = None,
    ):
        if balance is None:
            balance = get_balance()
        self.balance = balance
        self.name = name
        self.base_power = float(base_power)
        self.bonus_slots = float(bonus_slots)
        self.consumable_energy_bonus = float(consumable_energy_bonus)
        self.agi = float(agi)
        self.has_terrain_mitigation = has_terrain_mitigation

        exp_cfg = self.balance.get("expedition", {})
        base_energy = exp_cfg.get("base_energy", 100)
        self.energy = float(base_energy + self.consumable_energy_bonus)
        self.score = 0
        self.rooms_explored = 0
        self.exit_reason = "Suprimentos esgotados"

    def calculate_effective_power(self, terrain_power_penalty_pct: float = 0.0) -> float:
        """Calcula o Poder Efetivo da equipe aplicando penalidade percentual de terreno se não houver mitigação."""
        pct = 0.0 if self.has_terrain_mitigation else float(terrain_power_penalty_pct)
        if pct > 1.0:
            pct = pct / 100.0
        effective = (self.base_power + self.bonus_slots) * (1.0 - pct)
        return max(0.0, effective)


class MatchEngine:
    """Motor de simulação de expedições semanais e confrontos em masmorras."""

    def __init__(
        self,
        team1: Team,
        team2: Team,
        dungeon: Optional[Dict[str, Any]] = None,
        terrain_penalty_t1: Optional[float] = None,
        terrain_penalty_t2: Optional[float] = None,
        energy_cost_extra_t1: Optional[float] = None,
        energy_cost_extra_t2: Optional[float] = None,
        num_rooms: Optional[int] = None,
        base_energy_cost_per_room: Optional[float] = None,
        terrain_name: Optional[str] = None,
        recommended_power: Optional[float] = None,
        rng: Optional[random.Random] = None,
        fast_mode: bool = False,
        balance: Optional[Dict[str, Any]] = None,
    ):
        self.team1 = team1
        self.team2 = team2
        self.balance = balance if balance is not None else get_balance()
        self.fast_mode = fast_mode
        self.rng = rng if rng is not None else random.Random()

        exp_cfg = self.balance.get("expedition", {})
        self.num_rooms = num_rooms if num_rooms is not None else exp_cfg.get("max_rooms", 10)
        self.base_energy_cost_per_room = (
            base_energy_cost_per_room
            if base_energy_cost_per_room is not None
            else exp_cfg.get("base_energy_cost_per_room", 10)
        )
        self.room_cost_variance = exp_cfg.get("room_cost_variance", 0.25)
        self.room_encounter_probability = exp_cfg.get("room_encounter_probability", 0.65)
        self.solo_clear_base = exp_cfg.get("solo_clear_base", 0.6)
        self.agi_energy_reduction_max = exp_cfg.get("agi_energy_reduction_max", 0.20)
        self.miniboss_draw_margin = exp_cfg.get("miniboss_draw_margin", 0.08)
        self.miniboss_points = exp_cfg.get("miniboss_points", 1)
        self.boss_threshold_pct = exp_cfg.get("boss_threshold_pct", 0.15)
        self.boss_win_points = exp_cfg.get("boss_win_points", 2)
        self.boss_joint_points = exp_cfg.get("boss_joint_points", 1)

        # Configurações ambientais da masmorra
        if dungeon:
            self.terrain_name = terrain_name or dungeon.get("name", dungeon.get("terrain_label", "Masmorra"))
            self.recommended_power = (
                recommended_power if recommended_power is not None else dungeon.get("recommended_power", 55)
            )
            dungeon_penalty = dungeon.get("power_penalty_pct", 0.0)
            dungeon_extra_energy = dungeon.get("energy_cost_extra", 0)
            req_mitigation = dungeon.get("mitigation_required")
        else:
            self.terrain_name = terrain_name or "Campo Aberto Verdejante"
            self.recommended_power = recommended_power if recommended_power is not None else 55
            dungeon_penalty = 0.0
            dungeon_extra_energy = 0
            req_mitigation = None

        # Penalidades ambientais calculadas para cada equipe
        if terrain_penalty_t1 is not None:
            self.penalty_pct_t1 = terrain_penalty_t1
        else:
            self.penalty_pct_t1 = 0.0 if (not req_mitigation or team1.has_terrain_mitigation) else dungeon_penalty

        if terrain_penalty_t2 is not None:
            self.penalty_pct_t2 = terrain_penalty_t2
        else:
            self.penalty_pct_t2 = 0.0 if (not req_mitigation or team2.has_terrain_mitigation) else dungeon_penalty

        if energy_cost_extra_t1 is not None:
            self.extra_cost_t1 = energy_cost_extra_t1
        else:
            self.extra_cost_t1 = 0 if (not req_mitigation or team1.has_terrain_mitigation) else dungeon_extra_energy

        if energy_cost_extra_t2 is not None:
            self.extra_cost_t2 = energy_cost_extra_t2
        else:
            self.extra_cost_t2 = 0 if (not req_mitigation or team2.has_terrain_mitigation) else dungeon_extra_energy

        self.match_log: List[str] = []
        self.room_events: List[Dict[str, Any]] = []

    def log(self, message: str):
        if not self.fast_mode:
            self.match_log.append(message)

    def simulate(self) -> Dict[str, Any]:
        """Executa a simulação sala a sala até o esgotamento de suprimentos ou resolução do Boss Final."""
        self.log(f"Iniciando expedição oficial na masmorra: {self.terrain_name}")
        self.log(f"Confronto da Rodada: {self.team1.name} vs {self.team2.name}")

        ep1 = self.team1.calculate_effective_power(self.penalty_pct_t1)
        ep2 = self.team2.calculate_effective_power(self.penalty_pct_t2)

        self.log(
            f"Poder Efetivo Calculado — {self.team1.name}: {ep1:.1f} | "
            f"{self.team2.name}: {ep2:.1f}"
        )

        for room in range(1, self.num_rooms + 1):
            is_final_boss = (room == self.num_rooms)

            # A guilda só entra numa sala com energia estritamente acima de 0
            t1_entered = self.team1.energy > 0
            t2_entered = self.team2.energy > 0

            if not t1_entered and not t2_entered:
                break

            # A variação de custo de suprimentos é sorteada por sala e vale para as duas guildas na mesma sala
            room_variance = self.rng.uniform(1.0 - self.room_cost_variance, 1.0 + self.room_cost_variance)

            # Consumo de suprimentos da sala percorrida
            if t1_entered:
                agi_reduction_1 = self.agi_energy_reduction_max * (self.team1.agi / 100.0)
                cost_t1 = self.base_energy_cost_per_room * room_variance * (1.0 - agi_reduction_1) + self.extra_cost_t1
                self.team1.energy = max(0.0, self.team1.energy - cost_t1)
                self.team1.rooms_explored += 1
                if self.team1.energy == 0 and not is_final_boss:
                    self.team1.exit_reason = "Suprimentos esgotados"

            if t2_entered:
                agi_reduction_2 = self.agi_energy_reduction_max * (self.team2.agi / 100.0)
                cost_t2 = self.base_energy_cost_per_room * room_variance * (1.0 - agi_reduction_2) + self.extra_cost_t2
                self.team2.energy = max(0.0, self.team2.energy - cost_t2)
                self.team2.rooms_explored += 1
                if self.team2.energy == 0 and not is_final_boss:
                    self.team2.exit_reason = "Suprimentos esgotados"

            room_report = {
                "room": room,
                "is_final_boss": is_final_boss,
                "energy_t1": round(self.team1.energy, 2),
                "energy_t2": round(self.team2.energy, 2),
                "t1_present": t1_entered,
                "t2_present": t2_entered,
            }

            if is_final_boss:
                event_msg = self._resolve_final_boss(ep1, ep2, t1_entered, t2_entered)
                if t1_entered:
                    self.team1.exit_reason = "Boss resolvido"
                if t2_entered:
                    self.team2.exit_reason = "Boss resolvido"
                if not self.fast_mode:
                    room_report["event"] = event_msg
                    self.room_events.append(room_report)
                break
            else:
                has_encounter = (self.rng.random() < self.room_encounter_probability)
                if not has_encounter:
                    empty_opts = [
                        "Sala sem ocorrências operacionais. Expedição avança em formação defensiva.",
                        "Corredor úmido e silencioso coberto por névoa densa. A tropa avança sem contato hostil.",
                        "Labirinto de pedra calcária; batedores contornam escombros e mantêm o ritmo de marcha.",
                        "Inscrições rúnicas desgastadas nas paredes; goteiras e silêncio sepulcral.",
                        "Vasto salão abandonado com tochas extintas; expedição reorganiza provisões com cautela.",
                    ]
                    event_msg = self.rng.choice(empty_opts)
                    self.log(f"Câmara {room}: {event_msg}")
                else:
                    event_msg = self._resolve_miniboss(ep1, ep2, room, t1_entered, t2_entered)

                if not self.fast_mode:
                    room_report["event"] = event_msg
                    self.room_events.append(room_report)

            if self.team1.energy == 0 and self.team2.energy == 0:
                self.log(f"Câmara {room}: Ambas as expedições esgotaram seus suprimentos operacionais.")
                break

        return self._generate_save_data()

    def _resolve_miniboss(self, ep1: float, ep2: float, room: int, t1_present: bool, t2_present: bool) -> str:
        """Resolve o confronto de câmara intermediária com Mini-Boss ou ameaça de sala."""
        enc_templates = [
            "{team} neutralizou a ameaça hostil na Câmara {room} (+{points} PE).",
            "{team} resgatou emissários reais aprisionados na Câmara {room} (+{points} PE).",
            "{team} desarmou armadilhas arcanas e saqueou um baú ancestral na Câmara {room} (+{points} PE).",
            "{team} decifrou selos rúnicos e recuperou uma relíquia da Coroa na Câmara {room} (+{points} PE).",
            "{team} repeliu uma emboscada hostil com manobra coordenada na Câmara {room} (+{points} PE).",
        ]

        if t1_present and t2_present:
            total_p = ep1 + ep2
            prob_t1 = ep1 / total_p if total_p > 0 else 0.5
            roll = self.rng.random()

            if roll < prob_t1 - self.miniboss_draw_margin:
                self.team1.score += self.miniboss_points
                tmpl = self.rng.choice(enc_templates)
                msg = tmpl.format(team=self.team1.name, room=room, points=self.miniboss_points)
            elif roll > prob_t1 + self.miniboss_draw_margin:
                self.team2.score += self.miniboss_points
                tmpl = self.rng.choice(enc_templates)
                msg = tmpl.format(team=self.team2.name, room=room, points=self.miniboss_points)
            else:
                draw_opts = [
                    f"Disputa equilibrada na Câmara {room}. Nenhum abate prioritário deferido (0 PE).",
                    f"Confronto tático acirrado na Câmara {room}. Ambas as forças disputaram os recursos sem vantagem conclusiva (0 PE).",
                ]
                msg = self.rng.choice(draw_opts)
        elif t1_present:
            p_clear = max(0.05, min(0.95, self.solo_clear_base * ep1 / self.recommended_power))
            if self.rng.random() < p_clear:
                self.team1.score += self.miniboss_points
                solo_wins = [
                    f"{self.team1.name} conteve a ameaça na Câmara {room} de forma autônoma (+{self.miniboss_points} PE).",
                    f"{self.team1.name} resgatou reféns da Câmara {room} (+{self.miniboss_points} PE).",
                    f"{self.team1.name} destravou um baú ancestral na Câmara {room} (+{self.miniboss_points} PE).",
                ]
                msg = self.rng.choice(solo_wins)
            else:
                solo_fails = [
                    f"{self.team1.name} não obteve êxito na contenção da ameaça na Câmara {room} (0 PE).",
                    f"{self.team1.name} encontrou forte resistência e recuou preventivamente na Câmara {room} (0 PE).",
                ]
                msg = self.rng.choice(solo_fails)
        elif t2_present:
            p_clear = max(0.05, min(0.95, self.solo_clear_base * ep2 / self.recommended_power))
            if self.rng.random() < p_clear:
                self.team2.score += self.miniboss_points
                solo_wins = [
                    f"{self.team2.name} conteve a ameaça na Câmara {room} de forma autônoma (+{self.miniboss_points} PE).",
                    f"{self.team2.name} resgatou reféns da Câmara {room} (+{self.miniboss_points} PE).",
                    f"{self.team2.name} destravou um baú ancestral na Câmara {room} (+{self.miniboss_points} PE).",
                ]
                msg = self.rng.choice(solo_wins)
            else:
                solo_fails = [
                    f"{self.team2.name} não obteve êxito na contenção da ameaça na Câmara {room} (0 PE).",
                    f"{self.team2.name} encontrou forte resistência e recuou preventivamente na Câmara {room} (0 PE).",
                ]
                msg = self.rng.choice(solo_fails)
        else:
            msg = f"Nenhum destacamento operacional presente na Câmara {room}."

        self.log(msg)
        return msg

    def _resolve_final_boss(self, ep1: float, ep2: float, t1_present: bool, t2_present: bool) -> str:
        """Resolve o confronto final do Boss da masmorra."""
        self.log("Forças-tarefas alcançaram a Câmara do Boss Final!")

        if t1_present and t2_present:
            diff = abs(ep1 - ep2)
            higher_p = max(ep1, ep2)
            percent_diff = (diff / higher_p) if higher_p > 0 else 0.0

            if percent_diff > self.boss_threshold_pct:
                if ep1 > ep2:
                    self.team1.score += self.boss_win_points
                    msg = f"{self.team1.name} superou o rival em mais de 15% de poder e garantiu o Abate do Boss Final (+{self.boss_win_points} PE)!"
                else:
                    self.team2.score += self.boss_win_points
                    msg = f"{self.team2.name} superou o rival em mais de 15% de poder e garantiu o Abate do Boss Final (+{self.boss_win_points} PE)!"
            else:
                self.team1.score += self.boss_joint_points
                self.team2.score += self.boss_joint_points
                msg = f"Equilíbrio tático no Boss Final (margem ≤ 15%). Abate Conjunto registrado (+{self.boss_joint_points} PE para cada guilda)!"
        elif t1_present:
            if ep1 >= self.recommended_power:
                self.team1.score += self.boss_win_points
                msg = f"{self.team1.name} enfrentou o Boss Final de forma autônoma e executou o abate (+{self.boss_win_points} PE)!"
            else:
                msg = f"{self.team1.name} enfrentou o Boss Final, mas o contingente operacional não atingiu o poder recomendado de {self.recommended_power} (0 PE)."
        elif t2_present:
            if ep2 >= self.recommended_power:
                self.team2.score += self.boss_win_points
                msg = f"{self.team2.name} enfrentou o Boss Final de forma autônoma e executou o abate (+{self.boss_win_points} PE)!"
            else:
                msg = f"{self.team2.name} enfrentou o Boss Final, mas o contingente operacional não atingiu o poder recomendado de {self.recommended_power} (0 PE)."
        else:
            msg = "Nenhuma expedição alcançou a Câmara do Boss Final."

        self.log(msg)
        return msg

    def _generate_save_data(self) -> Dict[str, Any]:
        """Gera o consolidado do resultado da expedição."""
        return {
            "score": {
                self.team1.name: self.team1.score,
                self.team2.name: self.team2.score,
            },
            "player_score": self.team1.score,
            "rival_score": self.team2.score,
            "final_energy_player": round(self.team1.energy, 2),
            "final_energy_rival": round(self.team2.energy, 2),
            "rooms_explored_player": self.team1.rooms_explored,
            "rooms_explored_rival": self.team2.rooms_explored,
            "exit_reason_player": self.team1.exit_reason,
            "exit_reason_rival": self.team2.exit_reason,
            "match_log": self.match_log,
            "room_events": self.room_events,
        }
