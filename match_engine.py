import random

class Team:
    def __init__(self, name, base_power, bonus_slots=0, consumable_energy_bonus=0):
        self.name = name
        self.base_power = base_power
        self.bonus_slots = bonus_slots
        self.consumable_energy_bonus = consumable_energy_bonus
        self.score = 0
        self.energy = 100 + consumable_energy_bonus

    def calculate_effective_power(self, terrain_power_penalty):
        return max(10, self.base_power + self.bonus_slots - terrain_power_penalty)


class MatchEngine:
    def __init__(
        self,
        team1,
        team2,
        terrain_penalty_t1=0,
        terrain_penalty_t2=0,
        energy_cost_extra_t1=0,
        energy_cost_extra_t2=0,
        num_rooms=5,
        base_energy_cost_per_room=20,
        terrain_name="Caverna Padrão",
    ):
        self.team1 = team1
        self.team2 = team2
        self.terrain_penalty_t1 = terrain_penalty_t1
        self.terrain_penalty_t2 = terrain_penalty_t2
        self.energy_cost_extra_t1 = energy_cost_extra_t1
        self.energy_cost_extra_t2 = energy_cost_extra_t2
        self.num_rooms = num_rooms
        self.base_energy_cost_per_room = base_energy_cost_per_room
        self.terrain_name = terrain_name
        self.match_log = []
        self.room_events = []

    def log(self, message):
        self.match_log.append(message)

    def simulate(self):
        self.log(f"Iniciando expedição oficial na masmorra: {self.terrain_name}")
        self.log(f"Confronto da Rodada: {self.team1.name} vs {self.team2.name}")

        ep1 = self.team1.calculate_effective_power(self.terrain_penalty_t1)
        ep2 = self.team2.calculate_effective_power(self.terrain_penalty_t2)

        self.log(
            f"Poder Efetivo Calculado — {self.team1.name}: {ep1} "
            f"(Penalidade de Terreno: -{self.terrain_penalty_t1}) | "
            f"{self.team2.name}: {ep2} (Penalidade: -{self.terrain_penalty_t2})"
        )

        cost_t1 = self.base_energy_cost_per_room + self.energy_cost_extra_t1
        cost_t2 = self.base_energy_cost_per_room + self.energy_cost_extra_t2

        for room in range(1, self.num_rooms + 1):
            is_final_boss = (room == self.num_rooms)

            # Consumo de suprimentos
            self.team1.energy = max(0, self.team1.energy - cost_t1)
            self.team2.energy = max(0, self.team2.energy - cost_t2)

            room_report = {
                "room": room,
                "is_final_boss": is_final_boss,
                "energy_t1": self.team1.energy,
                "energy_t2": self.team2.energy,
            }

            if self.team1.energy == 0 and self.team2.energy == 0:
                self.log(f"Sala {room}: Ambas as expedições esgotaram seus suprimentos antes do confronto final.")
                room_report["event"] = "Suprimentos esgotados para ambas as guildas."
                self.room_events.append(room_report)
                break

            if not is_final_boss:
                event_msg = self._resolve_miniboss(ep1, ep2, room)
                room_report["event"] = event_msg
            else:
                event_msg = self._resolve_final_boss(ep1, ep2)
                room_report["event"] = event_msg
                self.room_events.append(room_report)
                break

            self.room_events.append(room_report)

            if self.team1.energy == 0 or self.team2.energy == 0:
                out_team = self.team1.name if self.team1.energy == 0 else self.team2.name
                self.log(f"A guilda {out_team} esgotou seus suprimentos operacionais na Sala {room}.")
                if self.team1.energy == 0 and self.team2.energy == 0:
                    break

        return self._generate_save_data()

    def _resolve_miniboss(self, ep1, ep2, room):
        # Mini-boss: probabilidade baseada na razão de poder
        total_p = ep1 + ep2
        prob_t1 = ep1 / total_p if total_p > 0 else 0.5
        roll = random.random()

        if roll < prob_t1 - 0.08:
            self.team1.score += 1
            msg = f"{self.team1.name} neutralizou o Mini-Boss na Câmara {room} (+1 Ponto de Expedição)."
        elif roll > prob_t1 + 0.08:
            self.team2.score += 1
            msg = f"{self.team2.name} neutralizou o Mini-Boss na Câmara {room} (+1 Ponto de Expedição)."
        else:
            msg = f"Disputa equilibrada na Câmara {room}. Nenhum abate prioritário confirmado."

        self.log(msg)
        return msg

    def _resolve_final_boss(self, ep1, ep2):
        self.log("Forças-tarefas alcançaram a Câmara do Boss Final!")
        diff = abs(ep1 - ep2)
        higher_p = max(ep1, ep2)
        percent_diff = (diff / higher_p) * 100 if higher_p > 0 else 0

        # Regra inviolável: diferença > 15% confere abate exclusivo (+2 PE)
        if percent_diff > 15:
            if ep1 > ep2:
                self.team1.score += 2
                msg = f"{self.team1.name} superou o rival em mais de 15% de poder e garantiu o Abate do Boss Final (+2 PE)!"
            else:
                self.team2.score += 2
                msg = f"{self.team2.name} superou o rival em mais de 15% de poder e garantiu o Abate do Boss Final (+2 PE)!"
        else:
            # Abate conjunto (+1 PE para ambas)
            self.team1.score += 1
            self.team2.score += 1
            msg = f"Equilíbrio tático no Boss Final (margem ≤ 15%). Abate Conjunto registrado (+1 PE para cada guilda)!"

        self.log(msg)
        return msg

    def _generate_save_data(self):
        # Descarte de log detalhado pós-simulação para evitar save bloat
        return {
            "score": {
                self.team1.name: self.team1.score,
                self.team2.name: self.team2.score
            },
            "player_score": self.team1.score,
            "rival_score": self.team2.score,
            "final_energy_player": self.team1.energy,
            "final_energy_rival": self.team2.energy,
            "match_log": self.match_log,
            "room_events": self.room_events,
        }
