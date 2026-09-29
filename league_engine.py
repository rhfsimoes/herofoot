"""
HeroFoot League Engine
Gerencia as guildas da Liga, divisões (Nobre e Acesso), geração de confrontos,
simulação de jogos rivais, encerramento de temporada com premiação e acesso/descenso.
"""

import os
import json
import random
import copy


def load_default_guilds():
    """Carrega lista plana de guildas para compatibilidade legada."""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'guilds_seed.json')
    if os.path.exists(data_path):
        try:
            with open(data_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                player_g = data.get("player_guild", {"id": "g_player", "name": "Guilda do Jogador", "is_player": True, "power_rating": 61})
                rivals = data.get("rival_guilds", [])
                return [player_g] + rivals
        except Exception:
            pass
    return [
        {"id": "g_player", "name": "Guilda do Jogador", "is_player": True, "power_rating": 61},
        {"id": "g_grifo", "name": "Ordem do Grifo Dourado", "is_player": False, "power_rating": 76},
        {"id": "g_aco", "name": "Irmandade do Aço Negro", "is_player": False, "power_rating": 71},
        {"id": "g_alvorada", "name": "Lança da Alvorada", "is_player": False, "power_rating": 67},
        {"id": "g_corvo", "name": "Corvo e Osso", "is_player": False, "power_rating": 59},
        {"id": "g_prata", "name": "Sentinelas da Prata", "is_player": False, "power_rating": 56},
        {"id": "g_pedra", "name": "Vigia de Pedra", "is_player": False, "power_rating": 54},
        {"id": "g_crepusculo", "name": "Legião do Crepúsculo", "is_player": False, "power_rating": 51},
    ]


DEFAULT_GUILDS = load_default_guilds()


class LeagueEngine:
    def __init__(self, guilds=None, divisions_data=None):
        self.all_guilds = {}
        raw_seed = self._load_seed_data()

        # Configuração de balanceamento da liga
        from balance import get_balance
        balance = get_balance()
        league_cfg = balance.get("league", {})
        self.rounds_per_season = league_cfg.get("rounds_per_season", 7)
        self.promotion_spots = league_cfg.get("promotion_spots", 2)
        self.relegation_spots = league_cfg.get("relegation_spots", 2)
        self.season_rewards = league_cfg.get("season_rewards", {
            "div_nobre": {"1": 1500, "2": 1000, "3": 600, "4": 400, "default": 200},
            "div_acesso": {"1": 800, "2": 500, "3": 300, "4": 200, "default": 100}
        })

        # Carrega todas as guildas catalogadas
        if raw_seed:
            player_g = raw_seed.get("player_guild", {"id": "g_player", "name": "Guilda do Jogador", "is_player": True, "power_rating": 61})
            self.all_guilds[player_g["id"]] = copy.deepcopy(player_g)
            for r in raw_seed.get("rival_guilds", []):
                self.all_guilds[r["id"]] = copy.deepcopy(r)
        else:
            for g in (guilds if guilds else DEFAULT_GUILDS):
                self.all_guilds[g["id"]] = copy.deepcopy(g)

        # Se guilds foi passado explicitamente (ex: testes legados), atualiza/complementa
        if guilds:
            for g in guilds:
                self.all_guilds[g["id"]] = copy.deepcopy(g)

        self.current_division_id = "div_acesso"
        self.season_number = 1
        self.season_summary = None
        self.season_history = []
        self.current_round = 1
        self.last_round_matches = []

        # Inicializa divisões
        self.divisions = {}
        seed_divisions = raw_seed.get("divisions") if raw_seed else None
        if seed_divisions:
            for d in seed_divisions:
                div_id = d["id"]
                self.divisions[div_id] = {
                    "id": div_id,
                    "name": d["name"],
                    "tier": d["tier"],
                    "promotion_spots": d.get("promotion_spots", 0),
                    "relegation_spots": d.get("relegation_spots", 0),
                    "guild_ids": list(d.get("guild_ids", [])),
                    "table": {},
                    "_schedule": []
                }
        else:
            # Fallback para divisões padrão
            all_ids = list(self.all_guilds.keys())
            mid = len(all_ids) // 2
            self.divisions["div_nobre"] = {
                "id": "div_nobre",
                "name": "Divisão Nobre da Coroa",
                "tier": 1,
                "promotion_spots": 0,
                "relegation_spots": 2,
                "guild_ids": all_ids[:mid],
                "table": {},
                "_schedule": []
            }
            self.divisions["div_acesso"] = {
                "id": "div_acesso",
                "name": "Divisão de Acesso Mercante",
                "tier": 2,
                "promotion_spots": 2,
                "relegation_spots": 0,
                "guild_ids": all_ids[mid:],
                "table": {},
                "_schedule": []
            }

        # Inicializa tabelas e calendários de cada divisão
        for div_id, div in self.divisions.items():
            self._init_division_table(div_id)
            div["_schedule"] = self._generate_round_robin_schedule(div["guild_ids"])

    def _load_seed_data(self):
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'guilds_seed.json')
        if os.path.exists(data_path):
            try:
                with open(data_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def _init_division_table(self, div_id):
        div = self.divisions[div_id]
        div["table"] = {}
        for gid in div["guild_ids"]:
            g = self.all_guilds.get(gid, {"id": gid, "name": gid, "is_player": (gid == "g_player"), "power_rating": 60})
            div["table"][gid] = {
                "id": gid,
                "guild_name": g.get("name", gid),
                "is_player": g.get("is_player", False),
                "power_rating": g.get("power_rating", 60),
                "average_agi": g.get("average_agi", g.get("power_rating", 60)),
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "points": 0,
                "pe_for": 0,       # Pontos de Expedição a favor
                "pe_against": 0,   # Pontos de Expedição contra
                "pe_diff": 0,      # Saldo de PE
            }

    @property
    def table(self):
        """Propriedade para compatibilidade com código que acessa self.table diretamente."""
        if self.current_division_id in self.divisions:
            return self.divisions[self.current_division_id]["table"]
        return {}

    @table.setter
    def table(self, val):
        if self.current_division_id in self.divisions:
            self.divisions[self.current_division_id]["table"] = val

    @property
    def _schedule(self):
        """Propriedade para compatibilidade com código que acessa self._schedule diretamente."""
        if self.current_division_id in self.divisions:
            return self.divisions[self.current_division_id]["_schedule"]
        return []

    @_schedule.setter
    def _schedule(self, val):
        if self.current_division_id in self.divisions:
            self.divisions[self.current_division_id]["_schedule"] = val

    @property
    def guilds(self):
        """Retorna lista das guildas participantes da divisão ativa do jogador."""
        div = self.divisions.get(self.current_division_id)
        if div:
            return [self.all_guilds[gid] for gid in div["guild_ids"] if gid in self.all_guilds]
        return list(self.all_guilds.values())

    def _generate_round_robin_schedule(self, guild_ids):
        """Gera o calendário todos contra todos para uma lista de guildas."""
        n = len(guild_ids)
        if n < 2:
            return []
        
        rounds = []
        pool = list(guild_ids)
        if n % 2 != 0:
            pool.append(None)
            n += 1

        for r in range(n - 1):
            round_pairs = []
            for i in range(n // 2):
                home = pool[i]
                away = pool[n - 1 - i]
                if home is not None and away is not None:
                    round_pairs.append((home, away))
            rounds.append(round_pairs)
            pool = [pool[0]] + [pool[-1]] + pool[1:-1]
            
        return rounds

    def get_fixtures_for_round(self, round_num, division_id=None):
        """Retorna os confrontos de uma rodada específica para a divisão informada (ou atual)."""
        target_div_id = division_id if division_id else self.current_division_id
        div = self.divisions.get(target_div_id)
        if not div or not div["_schedule"]:
            return []

        schedule_idx = (round_num - 1) % len(div["_schedule"])
        pairs = div["_schedule"][schedule_idx]
        fixtures = []
        for home_id, away_id in pairs:
            home_data = div["table"].get(home_id, self.all_guilds.get(home_id, {}))
            away_data = div["table"].get(away_id, self.all_guilds.get(away_id, {}))
            fixtures.append({
                "home_id": home_id,
                "home_name": home_data.get("guild_name", home_data.get("name", home_id)),
                "home_is_player": home_data.get("is_player", False),
                "away_id": away_id,
                "away_name": away_data.get("guild_name", away_data.get("name", away_id)),
                "away_is_player": away_data.get("is_player", False),
            })
        return fixtures

    def get_player_match(self, round_num):
        """Retorna o confronto da guilda do jogador na rodada especificada dentro de sua divisão."""
        fixtures = self.get_fixtures_for_round(round_num, self.current_division_id)
        for fix in fixtures:
            if fix["home_is_player"] or fix["away_is_player"]:
                rival_id = fix["away_id"] if fix["home_is_player"] else fix["home_id"]
                rival_data = self.all_guilds.get(rival_id, {})
                fix_copy = dict(fix)
                fix_copy["rival_id"] = rival_id
                fix_copy["rival_power"] = rival_data.get("power_rating", 60)
                fix_copy["rival_agi"] = rival_data.get("average_agi", fix_copy["rival_power"])
                return fix_copy
        return None

    def simulate_ai_match(self, home_id, away_id, dungeon=None, rng=None):
        """
        Simula o confronto entre duas guildas rivais utilizando o MatchEngine em modo rápido.
        Lê poder e AGI reais das guildas e seus elencos gerados no seed.
        """
        from match_engine import Team, MatchEngine
        from balance import get_balance

        if rng is None:
            rng = random.Random()

        balance = get_balance()
        rival_cfg = balance.get("rival", {})
        default_slot_bonus = rival_cfg.get("default_slot_bonus", 6)
        mit_prob = rival_cfg.get("mitigation_probability", 0.5)

        home = self.all_guilds.get(home_id, {})
        away = self.all_guilds.get(away_id, {})

        p_home = home.get("power_rating", 60)
        p_away = away.get("power_rating", 60)

        agi_home = home.get("average_agi", p_home)
        agi_away = away.get("average_agi", p_away)

        req_mit = dungeon.get("mitigation_required") if dungeon else None
        mit_home = (rng.random() < mit_prob) if req_mit else True
        mit_away = (rng.random() < mit_prob) if req_mit else True

        t_home = Team(
            name=home.get("name", home_id),
            base_power=p_home,
            bonus_slots=default_slot_bonus,
            consumable_energy_bonus=0,
            agi=agi_home,
            has_terrain_mitigation=mit_home,
            balance=balance,
        )
        t_away = Team(
            name=away.get("name", away_id),
            base_power=p_away,
            bonus_slots=default_slot_bonus,
            consumable_energy_bonus=0,
            agi=agi_away,
            has_terrain_mitigation=mit_away,
            balance=balance,
        )

        engine = MatchEngine(
            t_home,
            t_away,
            dungeon=dungeon,
            rng=rng,
            fast_mode=True,
            balance=balance,
        )
        result = engine.simulate()
        return result["player_score"], result["rival_score"]

    def record_match_result(self, home_id, away_id, pe_home, pe_away, division_id=None):
        """Atualiza a pontuação, estatísticas e saldo de duas equipes na divisão correspondente."""
        target_div_id = division_id
        if not target_div_id:
            for did, ddata in self.divisions.items():
                if home_id in ddata["table"]:
                    target_div_id = did
                    break
        if not target_div_id:
            target_div_id = self.current_division_id

        table = self.divisions[target_div_id]["table"]
        h = table[home_id]
        a = table[away_id]

        h["played"] += 1
        a["played"] += 1

        h["pe_for"] += pe_home
        h["pe_against"] += pe_away
        h["pe_diff"] = h["pe_for"] - h["pe_against"]

        a["pe_for"] += pe_away
        a["pe_against"] += pe_home
        a["pe_diff"] = a["pe_for"] - a["pe_against"]

        if pe_home > pe_away:
            h["wins"] += 1
            h["points"] += 3
            a["losses"] += 1
        elif pe_away > pe_home:
            a["wins"] += 1
            a["points"] += 3
            h["losses"] += 1
        else:
            h["draws"] += 1
            h["points"] += 1
            a["draws"] += 1
            a["points"] += 1

    def process_round_simulations(self, round_num, player_pe_for, player_pe_against, dungeon=None, rng=None):
        """
        Executa a rodada completa: simula partidas em todas as divisões.
        Ao final da temporada (rodada 7 de 7), dispara a apuração de títulos, acesso e descenso.
        """
        if rng is None:
            rng = random.Random()

        self.season_summary = None
        results = []

        # 1. Simula a divisão ativa do jogador
        player_div = self.divisions[self.current_division_id]
        fixtures_player_div = self.get_fixtures_for_round(round_num, self.current_division_id)

        for fix in fixtures_player_div:
            h_id = fix["home_id"]
            a_id = fix["away_id"]

            if fix["home_is_player"]:
                score_h = player_pe_for
                score_a = player_pe_against
            elif fix["away_is_player"]:
                score_h = player_pe_against
                score_a = player_pe_for
            else:
                score_h, score_a = self.simulate_ai_match(h_id, a_id, dungeon=dungeon, rng=rng)

            self.record_match_result(h_id, a_id, score_h, score_a, division_id=self.current_division_id)

            results.append({
                "home_name": fix["home_name"],
                "home_score": score_h,
                "away_name": fix["away_name"],
                "away_score": score_a,
                "is_player_match": fix["home_is_player"] or fix["away_is_player"]
            })

        # 2. Simula as demais divisões
        for div_id, div in self.divisions.items():
            if div_id == self.current_division_id:
                continue
            fixtures_other = self.get_fixtures_for_round(round_num, div_id)
            for fix in fixtures_other:
                h_id = fix["home_id"]
                a_id = fix["away_id"]
                score_h, score_a = self.simulate_ai_match(h_id, a_id, dungeon=dungeon, rng=rng)
                self.record_match_result(h_id, a_id, score_h, score_a, division_id=div_id)

        self.last_round_matches = results

        # 3. Verifica se esta rodada encerra o exercício anual/temporada
        round_in_season = ((round_num - 1) % self.rounds_per_season) + 1
        if round_in_season == self.rounds_per_season:
            self.process_season_end(rng=rng)

        self.current_round = round_num + 1
        return results

    def process_season_end(self, rng=None):
        """
        Processa o encerramento do exercício fiscal da temporada:
        - Apura colocações finais em ambas as divisões;
        - Calcula bonificação orçamentária da Coroa para o jogador;
        - Aplica promoção (top 2 da Divisão de Acesso) e rebaixamento (bottom 2 da Divisão Nobre);
        - Emite laudo corporativo com veredito régio;
        - Arquiva resumo e reseta tabelas para a próxima temporada.
        """
        if rng is None:
            rng = random.Random()

        standings_nobre = self.get_standings("div_nobre")
        standings_acesso = self.get_standings("div_acesso")

        # Identifica colocação e bonificação do jogador
        player_div_id = self.current_division_id
        current_standings = standings_nobre if player_div_id == "div_nobre" else standings_acesso
        player_row = next((r for r in current_standings if r.get("is_player")), None)
        player_rank = player_row["rank"] if player_row else 8

        rewards_table = self.season_rewards.get(player_div_id, {})
        award_gold = rewards_table.get(str(player_rank), rewards_table.get("default", 100))

        # Promoção: Top 2 da Divisão de Acesso
        promoted_ids = [standings_acesso[i]["id"] for i in range(min(self.promotion_spots, len(standings_acesso)))]
        # Rebaixamento: Bottom 2 da Divisão Nobre
        n_nobre = len(standings_nobre)
        relegated_ids = [standings_nobre[n_nobre - 1 - i]["id"] for i in range(min(self.relegation_spots, n_nobre))]

        promoted_names = [self.all_guilds.get(gid, {}).get("name", gid) for gid in promoted_ids]
        relegated_names = [self.all_guilds.get(gid, {}).get("name", gid) for gid in relegated_ids]

        is_player_promoted = "g_player" in promoted_ids
        is_player_relegated = "g_player" in relegated_ids

        # Veredito corporativo régio
        if is_player_promoted:
            verdict = (
                f"Portaria Real Nº {self.season_number * 103}: Concedida homologação de Acesso à Divisão Nobre da Coroa. "
                f"A guilda encerrou em {player_rank}º lugar e foi outorgada bonificação de ⬡ {award_gold} Ouro por mérito extraordinário."
            )
        elif is_player_relegated:
            verdict = (
                f"Notificação Administrativa Nº {self.season_number * 88}: Por insuficiência de rendimento operacional "
                f"({player_rank}º lugar), a guilda sofreu Rebaixamento Compulsório para a Divisão de Acesso Mercante. "
                f"Bonificação de permanência: ⬡ {award_gold} Ouro."
            )
        elif player_div_id == "div_nobre" and player_rank == 1:
            verdict = (
                f"Decreto Régio de Soberania: A guilda sagrou-se Campeã Absoluta da Divisão Nobre da Coroa! "
                f"Prêmio régio em ouro: ⬡ {award_gold} Ouro incorporado ao patrimônio."
            )
        elif player_div_id == "div_acesso" and player_rank == 1:
            verdict = (
                f"Portaria de Título Mercante: A guilda sagrou-se Campeã da Divisão de Acesso Mercante e ascendeu à elite. "
                f"Prêmio oficial: ⬡ {award_gold} Ouro."
            )
        else:
            verdict = (
                f"Laudo da Junta dos Oficiais da Liga: Exercício da Temporada {self.season_number} concluído. "
                f"Classificação final: {player_rank}º lugar. Permanência homologada para o próximo ano. Bonificação: ⬡ {award_gold} Ouro."
            )

        summary = {
            "season": self.season_number,
            "player_division_id": player_div_id,
            "player_division_name": self.divisions[player_div_id]["name"],
            "player_rank": player_rank,
            "player_promoted": is_player_promoted,
            "player_relegated": is_player_relegated,
            "award_gold": award_gold,
            "verdict": verdict,
            "promoted_guilds": promoted_names,
            "relegated_guilds": relegated_names,
            "champion_nobre": standings_nobre[0]["guild_name"] if standings_nobre else "",
            "champion_acesso": standings_acesso[0]["guild_name"] if standings_acesso else "",
        }
        self.season_summary = summary
        self.season_history.append(summary)

        # Executa trocas de acesso e descenso entre as listas de IDs
        div_nobre = self.divisions["div_nobre"]
        div_acesso = self.divisions["div_acesso"]

        for pid in promoted_ids:
            if pid in div_acesso["guild_ids"]:
                div_acesso["guild_ids"].remove(pid)
            if pid not in div_nobre["guild_ids"]:
                div_nobre["guild_ids"].append(pid)
            if pid in self.all_guilds:
                self.all_guilds[pid]["division_id"] = "div_nobre"

        for rid in relegated_ids:
            if rid in div_nobre["guild_ids"]:
                div_nobre["guild_ids"].remove(rid)
            if rid not in div_acesso["guild_ids"]:
                div_acesso["guild_ids"].append(rid)
            if rid in self.all_guilds:
                self.all_guilds[rid]["division_id"] = "div_acesso"

        # Atualiza divisão ativa do jogador
        if is_player_promoted:
            self.current_division_id = "div_nobre"
        elif is_player_relegated:
            self.current_division_id = "div_acesso"

        # Reinicia tabelas e calendários para a nova temporada
        for did in self.divisions:
            self._init_division_table(did)
            self.divisions[did]["_schedule"] = self._generate_round_robin_schedule(self.divisions[did]["guild_ids"])

        self.season_number += 1
        return summary

    def get_standings(self, division_id=None):
        """
        Retorna a tabela de classificação ordenada da divisão:
        1º Critério: Pontos
        2º Critério: Vitórias
        3º Critério: Saldo de PE (pe_diff)
        4º Critério: PE marcados (pe_for)
        """
        target_div_id = division_id if division_id else self.current_division_id
        div = self.divisions.get(target_div_id)
        if not div:
            return []

        rows = list(div["table"].values())
        rows.sort(
            key=lambda x: (x["points"], x["wins"], x["pe_diff"], x["pe_for"]),
            reverse=True
        )

        ranked = []
        n_teams = len(rows)
        p_spots = div.get("promotion_spots", 0)
        r_spots = div.get("relegation_spots", 0)

        for idx, row in enumerate(rows, 1):
            item = dict(row)
            item["rank"] = idx
            item["is_promotion_zone"] = (p_spots > 0 and idx <= p_spots)
            item["is_relegation_zone"] = (r_spots > 0 and idx > (n_teams - r_spots))
            ranked.append(item)
        return ranked

    def get_divisions_data(self):
        """Retorna visão consolidada de todas as divisões para a interface."""
        result = []
        for did, div in sorted(self.divisions.items(), key=lambda x: x[1]["tier"]):
            result.append({
                "id": did,
                "name": div["name"],
                "tier": div["tier"],
                "promotion_spots": div.get("promotion_spots", 0),
                "relegation_spots": div.get("relegation_spots", 0),
                "is_player_division": (did == self.current_division_id),
                "standings": self.get_standings(division_id=did),
            })
        return result

    def get_current_division_info(self):
        """Retorna informações da divisão ativa da guilda do jogador."""
        div = self.divisions.get(self.current_division_id, {})
        return {
            "id": self.current_division_id,
            "name": div.get("name", "Divisão de Acesso Mercante"),
            "tier": div.get("tier", 2),
            "promotion_spots": div.get("promotion_spots", 2),
            "relegation_spots": div.get("relegation_spots", 0),
            "season": self.season_number,
            "rounds_per_season": self.rounds_per_season,
        }

    def to_dict(self) -> dict:
        """Serializa o estado completo da Liga preservando compatibilidade legada."""
        cleaned_matches = []
        for m in self.last_round_matches:
            if isinstance(m, dict):
                cleaned = {k: copy.deepcopy(v) for k, v in m.items() if k not in ("match_log", "room_events")}
                cleaned_matches.append(cleaned)
            else:
                cleaned_matches.append(m)

        return {
            # Campos legados essenciais para compatibilidade de testes existentes
            "table": copy.deepcopy(self.table),
            "current_round": self.current_round,
            "last_round_matches": cleaned_matches,
            "_schedule": copy.deepcopy(self._schedule),
            "guilds": copy.deepcopy(self.guilds),
            # Campos da Onda 2 (Multi-Divisão e Temporadas)
            "season_number": self.season_number,
            "current_division_id": self.current_division_id,
            "divisions": copy.deepcopy(self.divisions),
            "season_summary": copy.deepcopy(self.season_summary),
            "season_history": copy.deepcopy(self.season_history),
        }

    def from_dict(self, data: dict):
        """Restaura o estado da Liga a partir de um dicionário serializado."""
        if not isinstance(data, dict):
            return self

        if "season_number" in data:
            self.season_number = data["season_number"]
        if "current_division_id" in data:
            self.current_division_id = data["current_division_id"]
        if "current_round" in data:
            self.current_round = data["current_round"]
        if "last_round_matches" in data:
            self.last_round_matches = copy.deepcopy(data["last_round_matches"])
        if "season_summary" in data:
            self.season_summary = copy.deepcopy(data["season_summary"])
        if "season_history" in data:
            self.season_history = copy.deepcopy(data["season_history"])

        if "divisions" in data and isinstance(data["divisions"], dict):
            self.divisions = copy.deepcopy(data["divisions"])
        elif "table" in data:
            # Migração de save legado sem divisões
            if self.current_division_id in self.divisions:
                self.divisions[self.current_division_id]["table"] = copy.deepcopy(data["table"])
            if "_schedule" in data:
                self.divisions[self.current_division_id]["_schedule"] = copy.deepcopy(data["_schedule"])

        return self
